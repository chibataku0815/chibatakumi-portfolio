import type { AttractorConfig, AudioReactiveBands, MetaballParticleSource, ParticleStateSnapshot } from "../metaball-types";
import { clamp, createParticleArray, createParticleStorageBuffer, writeParticle } from "./helpers";

// ── Firefly Sync — Kuramoto phase synchronization ──────────
// Primary animation: radius oscillation (unique among all scenes).
// Particles gradually entrain until pulsing in near-unison,
// then perturbation breaks sync and the cycle restarts.

const COUNT = 35;
const BASE_RADIUS = 0.006;
const PULSE_AMPLITUDE = 0.012;
const NATURAL_FREQ_MIN = 0.80; // Hz
const NATURAL_FREQ_MAX = 1.20;
const COUPLING_RADIUS = 0.18;
const COUPLING_STRENGTH = 0.003;
const DRIFT_NOISE = 0.000025;
const BOUNDARY_WEIGHT = 0.000012;
const DRAG = 0.995;
const MAX_DRIFT = 0.0006;
const PERTURB_INTERVAL = 45.0; // seconds
const PERTURB_STRENGTH = 3.0;  // radians of phase scatter
const WHITE_RATIO = 0.10;
const ONSET_BURST = 0.003;
const TAU = Math.PI * 2;
const MIN_X = 0.10;
const MAX_X = 0.90;
const MIN_Y = 0.12;
const MAX_Y = 0.88;
const ATTRACT_K = 0.0015;
const POST_IMPORT_FRAMES = 18;
const IMPORT_KICK = 0.00005;
const MAX_IMPORT_SPEED = 0.004;

interface Firefly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;          // internal Kuramoto phase
  naturalFreq: number;    // Hz, unique per particle
  baseRadius: number;
  phaseOffset: number;    // for breathing variation
  isWhite: boolean;
}

function fract(v: number): number { return v - Math.floor(v); }
function hash01(seed: number): number {
  return fract(Math.sin(seed * 127.1 + 311.7) * 43758.5453123);
}

function initialFirefly(index: number): Firefly {
  // Fibonacci spiral placement
  const golden = (1 + Math.sqrt(5)) / 2;
  const angle = index * TAU / (golden * golden);
  const r = 0.06 + Math.sqrt(index / COUNT) * 0.24;
  const cx = 0.5 + Math.cos(angle) * r;
  const cy = 0.5 + Math.sin(angle) * r * 0.85;

  const t = hash01(index + 7.3);
  const freq = NATURAL_FREQ_MIN + t * (NATURAL_FREQ_MAX - NATURAL_FREQ_MIN);
  const sizeVar = 0.80 + hash01(index + 17.1) * 0.45;

  return {
    x: clamp(cx, MIN_X, MAX_X),
    y: clamp(cy, MIN_Y, MAX_Y),
    vx: 0,
    vy: 0,
    phase: hash01(index + 27.9) * TAU, // random initial phase
    naturalFreq: freq,
    baseRadius: BASE_RADIUS * sizeVar,
    phaseOffset: hash01(index + 37.4),
    isWhite: index >= COUNT - Math.floor(COUNT * WHITE_RATIO),
  };
}

export function createFireflyParticles(device: GPUDevice): MetaballParticleSource {
  const particleBuffer = createParticleStorageBuffer(device, "firefly-particles", COUNT);
  const data = createParticleArray(COUNT);
  const flies = Array.from({ length: COUNT }, (_, i) => initialFirefly(i));
  let lastPerturbTime = 0;
  let audioBands: AudioReactiveBands | null = null;
  let attractor: AttractorConfig | null = null;
  let postImportFrames = 0;
  let postImportCenterX = 0.5;
  let postImportCenterY = 0.5;

  function resetFlies(): void {
    for (let i = 0; i < COUNT; i++) flies[i] = initialFirefly(i);
    lastPerturbTime = 0;
  }

  function simulate(time: number, dt: number): void {
    const step = clamp(dt * 60, 0.75, 1.5);
    const speedScale = audioBands ? 1 + audioBands.bass * 3 : 1;
    const sceneMix = attractor ? 1 - attractor.blend : 1;
    const attractMix = attractor ? attractor.blend : 0;

    // Audio-reactive: bass strengthens coupling, energy boosts drift speed
    const couplingMul = (audioBands ? 1 + audioBands.bass * 2 : 1) * sceneMix;
    const driftMul = (audioBands ? 1 + audioBands.energy * 8 : 1) * sceneMix;
    const maxDriftMul = audioBands ? MAX_DRIFT * (1 + audioBands.energy * 5) : MAX_DRIFT;
    const perturbInterval = audioBands && audioBands.energy > 0.6
      ? PERTURB_INTERVAL * 0.2
      : PERTURB_INTERVAL;

    // Periodic perturbation: scatter phases to break sync
    if (time - lastPerturbTime > perturbInterval) {
      lastPerturbTime = time;
      const perturbMul = audioBands ? 1 + audioBands.energy * 2 : 1;
      for (let i = 0; i < COUNT; i++) {
        flies[i].phase += (hash01(i + time * 13.7) * 2 - 1) * PERTURB_STRENGTH * perturbMul * sceneMix;
      }
    }

    // Kuramoto coupling: each firefly adjusts phase toward neighbors
    const dPhase = new Float64Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const fi = flies[i];
      let coupling = 0;

      for (let j = 0; j < COUNT; j++) {
        if (i === j) continue;
        const fj = flies[j];
        const dx = fj.x - fi.x;
        const dy = fj.y - fi.y;
        const distSq = dx * dx + dy * dy;
        if (distSq > COUPLING_RADIUS * COUPLING_RADIUS) continue;

      // Kuramoto: coupling * sin(theta_j - theta_i)
      coupling += Math.sin(fj.phase - fi.phase);
      }

      dPhase[i] = fi.naturalFreq * TAU + coupling * COUPLING_STRENGTH * couplingMul;
    }

    // Apply phase updates + gentle spatial drift
    for (let i = 0; i < COUNT; i++) {
      const fi = flies[i];
      fi.phase += dPhase[i] * step * (1 / 60);

      // Spatial drift (amplified by audio energy)
      const noiseAngle = hash01(i + time * 0.37) * TAU;
      fi.vx += Math.cos(noiseAngle) * DRIFT_NOISE * driftMul * step;
      fi.vy += Math.sin(noiseAngle) * DRIFT_NOISE * driftMul * step;

      // Boundary repulsion
      if (fi.x < MIN_X) fi.vx += (MIN_X - fi.x) * BOUNDARY_WEIGHT;
      else if (fi.x > MAX_X) fi.vx -= (fi.x - MAX_X) * BOUNDARY_WEIGHT;
      if (fi.y < MIN_Y) fi.vy += (MIN_Y - fi.y) * BOUNDARY_WEIGHT;
      else if (fi.y > MAX_Y) fi.vy -= (fi.y - MAX_Y) * BOUNDARY_WEIGHT;

      if (attractor && attractMix > 0) {
        fi.vx += (attractor.x - fi.x) * ATTRACT_K * attractMix;
        fi.vy += (attractor.y - fi.y) * ATTRACT_K * attractMix;
      }

      if (postImportFrames > 0) {
        const releaseMix = postImportFrames / POST_IMPORT_FRAMES;
        const dx = fi.x - postImportCenterX;
        const dy = fi.y - postImportCenterY;
        const dist = Math.hypot(dx, dy) || 1;
        const kick = IMPORT_KICK * releaseMix;
        fi.vx += (dx / dist) * kick;
        fi.vy += (dy / dist) * kick;
      }

      fi.vx *= DRAG;
      fi.vy *= DRAG;

      // Beat onset impulse — gentle drift burst on kick
      if (audioBands?.bassOnset && audioBands.bassOnset > 0.3) {
        const burst = audioBands.bassOnset * ONSET_BURST * sceneMix;
        fi.vx += (Math.random() - 0.5) * burst;
        fi.vy += (Math.random() - 0.5) * burst;
      }
      // Global onset — phase perturbation (scatter Kuramoto sync)
      if (audioBands?.globalOnset && audioBands.globalOnset > 0.5) {
        fi.phase += (Math.random() - 0.5) * 0.3 * audioBands.globalOnset;
      }

      // Clamp drift speed
      const speed = Math.sqrt(fi.vx * fi.vx + fi.vy * fi.vy);
      if (speed > maxDriftMul) {
        const s = maxDriftMul / speed;
        fi.vx *= s;
        fi.vy *= s;
      }

      fi.x = clamp(fi.x + fi.vx * speedScale * step, 0.05, 0.95);
      fi.y = clamp(fi.y + fi.vy * speedScale * step, 0.07, 0.93);
    }

    if (postImportFrames > 0) {
      postImportFrames--;
    }
  }

  function writeBuffer(time: number): void {
    const intensity = audioBands?.intensity;
    const visibleCount = intensity == null
      ? COUNT
      : Math.max(1, Math.min(COUNT, Math.ceil(COUNT * (0.3 + intensity * 0.7))));
    for (let i = 0; i < COUNT; i++) {
      const fi = flies[i];
      // Radius driven by internal phase (primary animation axis)
      const brightness = 0.5 + 0.5 * Math.sin(fi.phase);
      // Secondary breathing adds slight variation to break mechanical regularity
      const breathe2 = 1.0 + Math.sin(time * 0.4 + fi.phaseOffset * TAU) * 0.03;
      const radius = i < visibleCount
        ? (fi.baseRadius + PULSE_AMPLITUDE * brightness) * breathe2
        : 0.001;

      writeParticle(
        data, i,
        fi.x, fi.y,
        radius,
        fi.phaseOffset,
        fi.isWhite ? 1.0 : 0.0,
        fi.vx, fi.vy,
      );
    }
    device.queue.writeBuffer(particleBuffer, 0, data);
  }

  function exportState(): ParticleStateSnapshot {
    const positions = new Float32Array(COUNT * 2);
    const velocities = new Float32Array(COUNT * 2);
    const radii = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const fi = flies[i];
      positions[i * 2] = fi.x;
      positions[i * 2 + 1] = fi.y;
      velocities[i * 2] = fi.vx;
      velocities[i * 2 + 1] = fi.vy;
      radii[i] = fi.baseRadius;
    }

    return { positions, velocities, radii, count: COUNT };
  }

  function importState(snapshot: ParticleStateSnapshot): void {
    for (let i = 0; i < COUNT; i++) {
      flies[i] = initialFirefly(i);
    }

    const n = Math.min(snapshot.count, COUNT);
    let cx = 0;
    let cy = 0;
    let speedSum = 0;

    for (let i = 0; i < n; i++) {
      const fi = flies[i];
      fi.x = snapshot.positions[i * 2];
      fi.y = snapshot.positions[i * 2 + 1];
      fi.vx = clamp(snapshot.velocities[i * 2], -MAX_IMPORT_SPEED, MAX_IMPORT_SPEED);
      fi.vy = clamp(snapshot.velocities[i * 2 + 1], -MAX_IMPORT_SPEED, MAX_IMPORT_SPEED);
      if (snapshot.radii[i] > 0) {
        fi.baseRadius = snapshot.radii[i];
      }
      cx += fi.x;
      cy += fi.y;
      speedSum += Math.hypot(fi.vx, fi.vy);
    }

    cx = n > 0 ? cx / n : 0.5;
    cy = n > 0 ? cy / n : 0.5;

    for (let i = n; i < COUNT; i++) {
      const fi = flies[i];
      const angle = (i - n + 1) * 2.399963229728653;
      const ring = 0.01 + ((i - n) % 5) * 0.005;
      fi.x = clamp(cx + Math.cos(angle) * ring, 0.05, 0.95);
      fi.y = clamp(cy + Math.sin(angle) * ring, 0.07, 0.93);
      fi.vx = Math.cos(angle) * 0.00005;
      fi.vy = Math.sin(angle) * 0.00005;
    }

    const avgSpeed = speedSum / Math.max(n, 1);
    if (avgSpeed < 0.00025) {
      for (let i = 0; i < COUNT; i++) {
        const fi = flies[i];
        const dx = fi.x - cx;
        const dy = fi.y - cy;
        const dist = Math.hypot(dx, dy);
        const angle = dist > 0.001 ? Math.atan2(dy, dx) : fi.phaseOffset * TAU;
        const kick = IMPORT_KICK + (i % 5) * 0.000008;
        fi.vx += Math.cos(angle) * kick;
        fi.vy += Math.sin(angle) * kick;
      }
    }

    lastPerturbTime = 0;
    postImportCenterX = cx;
    postImportCenterY = cy;
    postImportFrames = POST_IMPORT_FRAMES;
    writeBuffer(0);
  }

  resetFlies();
  writeBuffer(0);

  return {
    particleBuffer,
    get count() { return COUNT; },
    update(_encoder, time, dt) {
      simulate(time, dt);
      writeBuffer(time);
    },
    reset() {
      resetFlies();
      attractor = null;
      postImportFrames = 0;
      writeBuffer(0);
    },
    destroy() {
      particleBuffer.destroy();
    },
    exportState,
    importState,
    setAttractor(config: AttractorConfig | null) {
      attractor = config;
    },
    setAudioReactive(bands: AudioReactiveBands | null) {
      audioBands = bands;
    },
  };
}
