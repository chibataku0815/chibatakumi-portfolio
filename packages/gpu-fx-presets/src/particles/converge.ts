import type { MetaballParticleSource, ParticleStateSnapshot } from "../metaball-types";
import { clamp, createParticleArray, createParticleStorageBuffer, writeParticle } from "./helpers";

// ── Converge — Central Attractor Convergence ─────────────────
// Receives arbitrary particle state via importState(), applies
// a gentle central attractor force to converge all particles
// toward center (0.5, 0.5). Reports convergence via isConverged().

const MAX_COUNT = 50;
const TARGET_X = 0.5;
const TARGET_Y = 0.5;
const ATTRACT_STRENGTH = 0.0004;
const DRAG = 0.985;
const CONVERGE_THRESHOLD = 0.02;
const BASE_RADIUS = 0.007;
const TAU = Math.PI * 2;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  isWhite: boolean;
}

function fract(v: number): number { return v - Math.floor(v); }
function hash01(seed: number): number {
  return fract(Math.sin(seed * 127.1 + 311.7) * 43758.5453123);
}

export function createConvergeParticles(
  device: GPUDevice,
): MetaballParticleSource & {
  isConverged(): boolean;
  exportState(): ParticleStateSnapshot;
  importState(snapshot: ParticleStateSnapshot): void;
} {
  const particleBuffer = createParticleStorageBuffer(device, "converge-particles", MAX_COUNT);
  const data = createParticleArray(MAX_COUNT);
  let particles: Particle[] = [];
  let currentCount = 0;

  function simulate(dt: number): void {
    const step = clamp(dt * 60, 0.75, 1.5);
    for (let i = 0; i < currentCount; i++) {
      const p = particles[i];
      // Central attractor
      const dx = TARGET_X - p.x;
      const dy = TARGET_Y - p.y;
      p.vx += dx * ATTRACT_STRENGTH * step;
      p.vy += dy * ATTRACT_STRENGTH * step;
      p.vx *= DRAG;
      p.vy *= DRAG;
      p.x += p.vx * step;
      p.y += p.vy * step;
    }
  }

  function writeBuffer(time: number): void {
    for (let i = 0; i < currentCount; i++) {
      const p = particles[i];
      const breathe = 1.0 + Math.sin(time * 0.5 + p.phase * TAU) * 0.03;
      writeParticle(
        data, i,
        p.x, p.y,
        p.radius * breathe,
        p.phase,
        p.isWhite ? 1.0 : 0.0,
        p.vx, p.vy,
      );
    }
    // Zero out remaining slots — park offscreen
    for (let i = currentCount; i < MAX_COUNT; i++) {
      writeParticle(data, i, -1, -1, 0, 0, 0);
    }
    device.queue.writeBuffer(particleBuffer, 0, data);
  }

  writeBuffer(0);

  return {
    particleBuffer,
    get count() { return currentCount; },
    update(_encoder, time, dt) {
      simulate(dt);
      writeBuffer(time);
    },
    reset() {
      particles = [];
      currentCount = 0;
      writeBuffer(0);
    },
    destroy() {
      particleBuffer.destroy();
    },
    exportState() {
      const positions = new Float32Array(currentCount * 2);
      const velocities = new Float32Array(currentCount * 2);
      const radii = new Float32Array(currentCount);
      for (let i = 0; i < currentCount; i++) {
        const p = particles[i];
        positions[i * 2] = p.x;
        positions[i * 2 + 1] = p.y;
        velocities[i * 2] = p.vx;
        velocities[i * 2 + 1] = p.vy;
        radii[i] = p.radius;
      }
      return { positions, velocities, radii, count: currentCount };
    },
    importState(snapshot: ParticleStateSnapshot) {
      currentCount = Math.min(snapshot.count, MAX_COUNT);
      particles = [];
      for (let i = 0; i < currentCount; i++) {
        particles.push({
          x: snapshot.positions[i * 2],
          y: snapshot.positions[i * 2 + 1],
          vx: snapshot.velocities[i * 2],
          vy: snapshot.velocities[i * 2 + 1],
          radius: snapshot.radii?.[i] ?? BASE_RADIUS,
          phase: hash01(i + 7.3),
          isWhite: i < Math.floor(currentCount * 0.1),
        });
      }
      writeBuffer(0);
    },
    isConverged() {
      if (currentCount === 0) return false;
      for (let i = 0; i < currentCount; i++) {
        const p = particles[i];
        const dx = p.x - TARGET_X;
        const dy = p.y - TARGET_Y;
        if (dx * dx + dy * dy > CONVERGE_THRESHOLD * CONVERGE_THRESHOLD) return false;
      }
      return true;
    },
  };
}
