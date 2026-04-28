/**
 * TransitionProxy — Dual-physics blending adapter for seamless scene transitions.
 *
 * Implements MetaballParticleSource so the SDF renderer sees a single source.
 * Internally calls computeForces() on both old and new scenes, blends the
 * force vectors with asymmetric easing, and integrates a shared particle state.
 *
 * Key design decisions:
 * - No central convergence: particles stay in place, only forces change
 * - Asymmetric easing: old forces fade with easeOutQuad, new with easeInCubic
 * - Velocity inheritance: old scene velocities decay with easeOutExpo
 * - Particle count mismatch: excess particles fade via life field, new spawn near parents
 * - Chain anchors: smootherstep merge to parametric orbit over 4s
 */

import type { MetaballParticleSource, ParticleStateSnapshot } from "../metaball-types";
import {
  clamp,
  createParticleArray,
  createParticleStorageBuffer,
  smootherstep,
  writeParticle,
} from "./helpers";

const MAX_PARTICLES = 40;
const DRAG = 0.994;
const MAX_SPEED = 0.004;

// ── Timing parameters ─────────────────────────────────────────
const BLEND_DURATION = 2.5;           // force crossfade duration (seconds)
const VEL_INHERIT_DURATION = 1.8;     // inherited velocity lifetime
const PARTICLE_FADE_DELAY = 0.3;      // delay before excess particles begin fading
const PARTICLE_FADE_DURATION = 2.0;   // life 1→0 for disappearing particles
const PARTICLE_SPAWN_DURATION = 2.0;  // life 0→1 for appearing particles

// ── Per-transition velocity inheritance multipliers ────────────
const VEL_INHERIT_SCALE: Record<string, number> = {
  "Flock→Molecular": 0.65,
  "Molecular→Chain": 0.40,
  "Chain→Flock": 1.10,
};

// ── Easing functions ──────────────────────────────────────────
function easeOutQuad(t: number): number {
  const tc = clamp(t, 0, 1);
  return 1 - (1 - tc) * (1 - tc);
}

function easeInCubic(t: number): number {
  const tc = clamp(t, 0, 1);
  return tc * tc * tc;
}

function easeOutExpo(t: number): number {
  const tc = clamp(t, 0, 1);
  return tc >= 1 ? 1 : 1 - Math.pow(2, -10 * tc);
}

function easeInQuad(t: number): number {
  const tc = clamp(t, 0, 1);
  return tc * tc;
}

function easeOutQuadFn(t: number): number {
  const tc = clamp(t, 0, 1);
  return tc * (2 - tc);
}

// ── Particle state ────────────────────────────────────────────
interface TransitionParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  colorIdx: number;
  life: number;
}

export interface TransitionProxyConfig {
  device: GPUDevice;
  oldScene: MetaballParticleSource;
  newScene: MetaballParticleSource;
  oldName: string;
  newName: string;
  duration?: number;
}

export interface TransitionProxy extends MetaballParticleSource {
  readonly progress: number;
  readonly isComplete: boolean;
  finalize(): void;
}

export function createTransitionProxy(config: TransitionProxyConfig): TransitionProxy {
  const {
    device,
    oldScene,
    newScene,
    oldName,
    newName,
    duration = BLEND_DURATION,
  } = config;

  const particleBuffer = createParticleStorageBuffer(device, "transition-proxy", MAX_PARTICLES);
  const data = createParticleArray(MAX_PARTICLES);

  const oldCount = oldScene.count;
  const newCount = newScene.count;
  const activeCount = Math.max(oldCount, newCount);
  const sharedCount = Math.min(oldCount, newCount);

  // Capture initial state from old scene
  const snapshot = oldScene.exportState?.();
  const particles: TransitionParticle[] = [];

  // Initialize shared particles from old scene's current state
  for (let i = 0; i < activeCount; i++) {
    if (i < oldCount && snapshot) {
      particles.push({
        x: snapshot.positions[i * 2],
        y: snapshot.positions[i * 2 + 1],
        vx: snapshot.velocities[i * 2],
        vy: snapshot.velocities[i * 2 + 1],
        radius: snapshot.radii[i],
        phase: Math.random(),
        colorIdx: i < Math.floor(activeCount * 0.1) ? 1.0 : 0.0,
        life: i < oldCount ? 1.0 : 0.0,
      });
    } else {
      // New particles (spawning): place near a random existing particle
      const parentIdx = i % oldCount;
      const parent = particles[parentIdx];
      const angle = (i / activeCount) * Math.PI * 2;
      particles.push({
        x: parent.x + Math.cos(angle) * 0.015,
        y: parent.y + Math.sin(angle) * 0.015,
        vx: parent.vx,
        vy: parent.vy,
        radius: 0.008 * (0.78 + Math.random() * 0.55),
        phase: Math.random(),
        colorIdx: 0.0,
        life: 0.0, // will fade in
      });
    }
  }

  // Capture inherited velocities for decay
  const inheritedVx = new Float32Array(activeCount);
  const inheritedVy = new Float32Array(activeCount);
  const velKey = `${oldName}→${newName}`;
  const velScale = VEL_INHERIT_SCALE[velKey] ?? 0.65;
  for (let i = 0; i < activeCount; i++) {
    inheritedVx[i] = particles[i].vx * velScale;
    inheritedVy[i] = particles[i].vy * velScale;
  }

  let progress = 0;
  let elapsedTime = 0;

  // Temp arrays for computeForces calls
  const posArray = new Float32Array(activeCount * 2);
  const velArray = new Float32Array(activeCount * 2);

  function syncArrays(): void {
    for (let i = 0; i < activeCount; i++) {
      const p = particles[i];
      posArray[i * 2] = p.x;
      posArray[i * 2 + 1] = p.y;
      velArray[i * 2] = p.vx;
      velArray[i * 2 + 1] = p.vy;
    }
  }

  function writeGpuBuffer(time: number): void {
    for (let i = 0; i < activeCount; i++) {
      const p = particles[i];
      const breathe = 1.0 + Math.sin(time * 0.6 + p.phase * Math.PI * 2) * 0.05;
      writeParticle(
        data, i,
        p.x, p.y,
        p.radius * breathe,
        p.phase,
        p.colorIdx,
        p.vx, p.vy,
        p.life,
      );
    }
    // Zero out unused slots
    for (let i = activeCount; i < MAX_PARTICLES; i++) {
      writeParticle(data, i, 0, 0, 0, 0, 0, 0, 0, 0);
    }
    device.queue.writeBuffer(particleBuffer, 0, data);
  }

  // Write initial state
  writeGpuBuffer(0);

  return {
    particleBuffer,
    get count() { return activeCount; },
    get progress() { return progress; },
    get isComplete() { return progress >= 1; },

    update(_encoder: GPUCommandEncoder, time: number, dt: number): void {
      if (progress >= 1) return;

      elapsedTime += dt;
      progress = clamp(elapsedTime / duration, 0, 1);

      // ── Force blend weights (asymmetric) ──────────────────
      const oldWeight = 1 - easeOutQuad(progress);        // lingering fade
      const newWeight = easeInCubic(progress);             // gentle assertion

      // ── Velocity inheritance decay ────────────────────────
      const velDecayT = clamp(elapsedTime / VEL_INHERIT_DURATION, 0, 1);
      const velFade = 1 - easeOutExpo(velDecayT);

      // ── Compute forces from both scenes ───────────────────
      syncArrays();

      const oldForces = oldScene.computeForces?.(posArray, velArray, activeCount, time, dt);
      const newForces = newScene.computeForces?.(posArray, velArray, activeCount, time, dt);

      // ── Integrate blended forces ──────────────────────────
      const step = clamp(dt * 60, 0.75, 1.5);

      for (let i = 0; i < activeCount; i++) {
        const p = particles[i];

        // Blend forces
        let fx = 0;
        let fy = 0;
        if (oldForces && i < oldCount) {
          fx += (oldForces.forces[i * 2] || 0) * oldWeight;
          fy += (oldForces.forces[i * 2 + 1] || 0) * oldWeight;
        }
        if (newForces && i < newCount) {
          fx += (newForces.forces[i * 2] || 0) * newWeight;
          fy += (newForces.forces[i * 2 + 1] || 0) * newWeight;
        }

        // Add inherited velocity bias (decaying)
        const inheritBiasX = inheritedVx[i] * velFade * 0.1;
        const inheritBiasY = inheritedVy[i] * velFade * 0.1;

        // Integrate velocity
        p.vx = (p.vx + fx + inheritBiasX) * DRAG;
        p.vy = (p.vy + fy + inheritBiasY) * DRAG;

        // Speed limit
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > MAX_SPEED) {
          const s = MAX_SPEED / speed;
          p.vx *= s;
          p.vy *= s;
        }

        // Integrate position
        p.x = clamp(p.x + p.vx * step, 0.04, 0.96);
        p.y = clamp(p.y + p.vy * step, 0.06, 0.94);

        // ── Life management for particle count transitions ──
        if (i >= sharedCount) {
          if (i < oldCount && i >= newCount) {
            // Excess: old particles fading out
            const fadeT = clamp((elapsedTime - PARTICLE_FADE_DELAY) / PARTICLE_FADE_DURATION, 0, 1);
            p.life = 1 - easeInQuad(fadeT);
          } else if (i >= oldCount && i < newCount) {
            // New: spawning particles fading in
            const spawnT = clamp(elapsedTime / PARTICLE_SPAWN_DURATION, 0, 1);
            p.life = easeOutQuadFn(spawnT);
          }
        }
      }

      writeGpuBuffer(time);
    },

    reset(): void {
      // No-op for transition proxy
    },

    destroy(): void {
      particleBuffer.destroy();
    },

    exportState(): ParticleStateSnapshot {
      const positions = new Float32Array(activeCount * 2);
      const velocities = new Float32Array(activeCount * 2);
      const radii = new Float32Array(activeCount);
      for (let i = 0; i < activeCount; i++) {
        const p = particles[i];
        positions[i * 2] = p.x;
        positions[i * 2 + 1] = p.y;
        velocities[i * 2] = p.vx;
        velocities[i * 2 + 1] = p.vy;
        radii[i] = p.radius;
      }
      return { positions, velocities, radii, count: activeCount };
    },

    finalize(): void {
      // Transfer final state to new scene
      const positions = new Float32Array(activeCount * 2);
      const velocities = new Float32Array(activeCount * 2);
      const radii = new Float32Array(activeCount);
      for (let i = 0; i < activeCount; i++) {
        const p = particles[i];
        positions[i * 2] = p.x;
        positions[i * 2 + 1] = p.y;
        velocities[i * 2] = p.vx;
        velocities[i * 2 + 1] = p.vy;
        radii[i] = p.radius;
      }
      if (newScene.importState) {
        newScene.importState({ positions, velocities, radii, count: activeCount });
      }
    },
  };
}
