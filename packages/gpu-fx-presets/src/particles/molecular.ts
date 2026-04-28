import type { AttractorConfig, AudioReactiveBands, MetaballParticleSource, ParticleStateSnapshot } from "../metaball-types";
import { clamp, createParticleArray, createParticleStorageBuffer, writeParticle } from "./helpers";

// ── Molecular — Lennard-Jones 6-12 potential ───────────────
// Single pairwise formula produces both attraction and repulsion.
// Emergent hexagonal crystalline clusters that breathe and rearrange.
// Periodic thermal kick perturbs equilibrium for visual drama.

const COUNT = 25;
const SIGMA = 0.04;          // equilibrium distance ≈ sigma * 2^(1/6) ≈ 0.0449
const EPSILON = 0.000008;
const CUTOFF = 0.12;         // ~3 * sigma
const DRAG = 0.993;
const BASE_RADIUS = 0.008;
const WHITE_RATIO = 0.10;
const MAX_SPEED = 0.003;
const THERMAL_KICK_INTERVAL = 10.0; // seconds
const THERMAL_KICK_STRENGTH = 0.0008;
const BOUNDARY_FORCE = 0.000025;
const MIN_X = 0.10;
const MAX_X = 0.90;
const MIN_Y = 0.12;
const MAX_Y = 0.88;
const ONSET_BURST = 0.005;
const TAU = Math.PI * 2;

interface Atom {
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

function initialAtom(index: number): Atom {
  // Fibonacci spiral centered at (0.5, 0.5)
  const golden = (1 + Math.sqrt(5)) / 2;
  const angle = index * TAU / (golden * golden);
  const r = 0.04 + Math.sqrt(index / COUNT) * 0.16;
  const sizeVar = 0.82 + hash01(index + 13.3) * 0.42;

  return {
    x: 0.5 + Math.cos(angle) * r,
    y: 0.5 + Math.sin(angle) * r * 0.85,
    vx: 0,
    vy: 0,
    radius: BASE_RADIUS * sizeVar,
    phase: hash01(index + 23.7),
    isWhite: index >= COUNT - Math.floor(COUNT * WHITE_RATIO),
  };
}

export function createMolecularParticles(device: GPUDevice): MetaballParticleSource {
  const particleBuffer = createParticleStorageBuffer(device, "molecular-particles", COUNT);
  const data = createParticleArray(COUNT);
  const atoms = Array.from({ length: COUNT }, (_, i) => initialAtom(i));
  let lastKickTime = 0;
  let attractor: AttractorConfig | null = null;
  let audioBands: AudioReactiveBands | null = null;

  function resetAtoms(): void {
    for (let i = 0; i < COUNT; i++) atoms[i] = initialAtom(i);
    lastKickTime = 0;
  }

  function simulate(time: number, dt: number): void {
    const step = clamp(dt * 60, 0.75, 1.5);
    const speedScale = audioBands ? 1 + audioBands.bass * 3 : 1;
    const sceneMix = attractor ? 1 - attractor.blend : 1;
    const attractMix = attractor ? attractor.blend : 0;
    const ATTRACT_K = 0.0015;

    // Audio-reactive: energy → continuous thermal agitation + looser drag
    const thermalMul = audioBands ? 1 + audioBands.energy * 4 : 1;
    const epsilonMul = audioBands ? 1 + audioBands.bass * 2 : 1;
    const dragMul = audioBands ? DRAG - audioBands.energy * 0.008 : DRAG;
    const speedCap = audioBands ? MAX_SPEED * (1 + audioBands.energy * 2) : MAX_SPEED;

    // Continuous thermal jitter (every frame, not just periodic kicks)
    if (audioBands && audioBands.energy > 0.1) {
      for (let i = 0; i < COUNT; i++) {
        const angle = hash01(i + time * 17.3 + audioBands.bass * 5) * TAU;
        const strength = THERMAL_KICK_STRENGTH * audioBands.energy * 3 * sceneMix;
        atoms[i].vx += Math.cos(angle) * strength;
        atoms[i].vy += Math.sin(angle) * strength;
      }
    }

    // Periodic thermal perturbation (suppressed during convergence)
    if (sceneMix > 0.5 && time - lastKickTime > THERMAL_KICK_INTERVAL) {
      lastKickTime = time;
      for (let i = 0; i < COUNT; i++) {
        const angle = hash01(i + time * 7.3) * TAU;
        atoms[i].vx += Math.cos(angle) * THERMAL_KICK_STRENGTH * thermalMul * sceneMix;
        atoms[i].vy += Math.sin(angle) * THERMAL_KICK_STRENGTH * thermalMul * sceneMix;
      }
    }

    // Lennard-Jones pairwise forces (Newton's 3rd law optimization)
    for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        const ai = atoms[i];
        const aj = atoms[j];
        const dx = aj.x - ai.x;
        const dy = aj.y - ai.y;
        const distSq = dx * dx + dy * dy;

        if (distSq > CUTOFF * CUTOFF || distSq < 0.00001) continue;

        const dist = Math.sqrt(distSq);
        const invDist = 1 / dist;

        // LJ 6-12: F = 24*eps/r * [2*(sigma/r)^12 - (sigma/r)^6]
        const sr = SIGMA * invDist;
        const sr6 = sr * sr * sr * sr * sr * sr;
        const sr12 = sr6 * sr6;
        const forceMag = 24 * EPSILON * epsilonMul * invDist * (2 * sr12 - sr6) * sceneMix;

        // Normalize direction
        const fx = dx * invDist * forceMag * step;
        const fy = dy * invDist * forceMag * step;

        ai.vx += fx;
        ai.vy += fy;
        aj.vx -= fx;
        aj.vy -= fy;
      }
    }

    // Integrate + boundary + drag
    for (let i = 0; i < COUNT; i++) {
      const a = atoms[i];

      // Soft boundary repulsion
      if (a.x < MIN_X) a.vx += (MIN_X - a.x) * BOUNDARY_FORCE * sceneMix;
      else if (a.x > MAX_X) a.vx -= (a.x - MAX_X) * BOUNDARY_FORCE * sceneMix;
      if (a.y < MIN_Y) a.vy += (MIN_Y - a.y) * BOUNDARY_FORCE * sceneMix;
      else if (a.y > MAX_Y) a.vy -= (a.y - MAX_Y) * BOUNDARY_FORCE * sceneMix;

      // Central attractor force (blended in)
      if (attractor && attractMix > 0) {
        a.vx += (attractor.x - a.x) * ATTRACT_K * attractMix * step;
        a.vy += (attractor.y - a.y) * ATTRACT_K * attractMix * step;
      }

      a.vx *= dragMul;
      a.vy *= dragMul;

      // Beat onset impulse — radial thermal explosion on kick
      if (audioBands?.bassOnset && audioBands.bassOnset > 0.3) {
        const angle = Math.atan2(a.y - 0.5, a.x - 0.5);
        const burst = audioBands.bassOnset * ONSET_BURST * sceneMix;
        a.vx += Math.cos(angle) * burst;
        a.vy += Math.sin(angle) * burst;
      }

      // Speed limit
      const speed = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
      if (speed > MAX_SPEED * speedScale) {
        const s = MAX_SPEED * speedScale / speed;
        a.vx *= s;
        a.vy *= s;
      }

      a.x = clamp(a.x + a.vx * speedScale * step, 0.05, 0.95);
      a.y = clamp(a.y + a.vy * speedScale * step, 0.07, 0.93);
    }
  }

  function writeBuffer(time: number): void {
    const intensity = audioBands?.intensity;
    const visibleCount = intensity == null
      ? COUNT
      : Math.max(1, Math.min(COUNT, Math.ceil(COUNT * (0.3 + intensity * 0.7))));
    for (let i = 0; i < COUNT; i++) {
      const a = atoms[i];
      const breathe = 1.0 + Math.sin(time * 0.6 + a.phase * TAU) * 0.04;
      const breathe2 = 1.0 + Math.sin(time * 0.23 + a.phase * TAU * 1.7) * 0.02;
      writeParticle(
        data, i,
        a.x, a.y,
        i < visibleCount ? a.radius * breathe * breathe2 : 0.001,
        a.phase,
        a.isWhite ? 1.0 : 0.0,
        a.vx, a.vy,
      );
    }
    device.queue.writeBuffer(particleBuffer, 0, data);
  }

  resetAtoms();
  writeBuffer(0);

  return {
    particleBuffer,
    get count() { return COUNT; },
    update(_encoder, time, dt) {
      simulate(time, dt);
      writeBuffer(time);
    },
    reset() {
      resetAtoms();
      writeBuffer(0);
    },
    destroy() {
      particleBuffer.destroy();
    },
    exportState() {
      const positions = new Float32Array(COUNT * 2);
      const velocities = new Float32Array(COUNT * 2);
      const radii = new Float32Array(COUNT);
      for (let i = 0; i < COUNT; i++) {
        const a = atoms[i];
        positions[i * 2] = a.x;
        positions[i * 2 + 1] = a.y;
        velocities[i * 2] = a.vx;
        velocities[i * 2 + 1] = a.vy;
        radii[i] = a.radius;
      }
      return { positions, velocities, radii, count: COUNT };
    },
    importState(snapshot: ParticleStateSnapshot) {
      const n = Math.min(snapshot.count, COUNT);
      let cx = 0;
      let cy = 0;
      let speedSum = 0;
      for (let i = 0; i < n; i++) {
        atoms[i].x = snapshot.positions[i * 2];
        atoms[i].y = snapshot.positions[i * 2 + 1];
        atoms[i].vx = snapshot.velocities[i * 2];
        atoms[i].vy = snapshot.velocities[i * 2 + 1];
        cx += atoms[i].x;
        cy += atoms[i].y;
        speedSum += Math.hypot(atoms[i].vx, atoms[i].vy);
      }
      cx = n > 0 ? cx / n : 0.5;
      cy = n > 0 ? cy / n : 0.5;

      if (n < COUNT) {
        for (let i = n; i < COUNT; i++) {
          const ang = (i * 2.399963229728653) % TAU;
          const r = 0.002 + ((i - n) % 4) * 0.0015;
          atoms[i].x = cx + Math.cos(ang) * r;
          atoms[i].y = cy + Math.sin(ang) * r;
          atoms[i].vx = Math.cos(ang) * 0.00006;
          atoms[i].vy = Math.sin(ang) * 0.00006;
        }
      }

      // Give the cluster a tiny repulsive seed so the next molecular structure emerges visibly.
      const avgSpeed = speedSum / Math.max(n, 1);
      if (avgSpeed < 0.00025) {
        for (let i = 0; i < COUNT; i++) {
          const dx = atoms[i].x - cx;
          const dy = atoms[i].y - cy;
          const dist = Math.hypot(dx, dy);
          const ang = dist > 0.001
            ? Math.atan2(dy, dx)
            : atoms[i].phase * TAU + hash01(i + 71.4) * 0.6;
          const kick = 0.00006 + hash01(i + 31.4) * 0.00004;
          atoms[i].vx += Math.cos(ang) * kick;
          atoms[i].vy += Math.sin(ang) * kick;
        }
      }
      writeBuffer(0);
    },
    setAttractor(config: AttractorConfig | null) {
      attractor = config;
    },
    setAudioReactive(bands: AudioReactiveBands | null) {
      audioBands = bands;
    },
  };
}
