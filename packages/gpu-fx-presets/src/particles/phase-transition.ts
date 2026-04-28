import type { AttractorConfig, AudioReactiveBands, MetaballParticleSource, ParticleStateSnapshot } from "../metaball-types";
import { clamp, createParticleArray, createParticleStorageBuffer, simpleNoise, smootherstep, writeParticle } from "./helpers";

const COLS = 8;
const ROWS = 6;
const COUNT = COLS * ROWS;
const CYCLE_DURATION = 60.0;
const BASE_RADIUS = 0.0078;
const WHITE_RATIO = 0.10;
const SPRING_K = 0.0001;
const THERMAL_STRENGTH = 0.00003;
const REPEL_STRENGTH = 0.000002;
const REPEL_RADIUS = 0.03;
const DRAG = 0.993;
const MAX_SPEED = 0.0028;
const MARGIN_X = 0.12;
const MARGIN_Y = 0.14;
const BOUNDARY_MARGIN = 0.05;
const BOUNDARY_FORCE = 0.00002;
const ONSET_BURST = 0.005;
const TWO_PI = Math.PI * 2;
const ATTRACT_K = 0.0015;
const POST_IMPORT_FRAMES = 18;
const IMPORT_KICK = 0.00006;
const MAX_IMPORT_SPEED = 0.004;

interface ParticleState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  homeX: number;
  homeY: number;
  radius: number;
  phase: number;
  colorIdx: number;
  seed: number;
}

function fract(value: number): number {
  return value - Math.floor(value);
}

function temperatureAt(time: number): number {
  const cycle = ((time % CYCLE_DURATION) + CYCLE_DURATION) % CYCLE_DURATION;

  if (cycle < 15.0) {
    return 0.3 * smootherstep(cycle / 15.0);
  }
  if (cycle < 25.0) {
    return 0.3 + 0.7 * smootherstep((cycle - 15.0) / 10.0);
  }
  if (cycle < 40.0) {
    return 1.0;
  }
  if (cycle < 55.0) {
    return 1.0 - smootherstep((cycle - 40.0) / 15.0);
  }
  return 0.0;
}

function particleSeed(idx: number): number {
  return fract(simpleNoise(idx * 13.37 + 0.5) + 0.5);
}

export function createPhaseTransitionParticles(device: GPUDevice): MetaballParticleSource {
  const particleBuffer = createParticleStorageBuffer(device, "phase-transition-particles", COUNT);
  const data = createParticleArray(COUNT);
  const particles: ParticleState[] = [];
  const forceX = new Float32Array(COUNT);
  const forceY = new Float32Array(COUNT);

  const xStart = MARGIN_X;
  const xEnd = 1.0 - MARGIN_X;
  const yStart = MARGIN_Y;
  const yEnd = 1.0 - MARGIN_Y;
  const xStep = (xEnd - xStart) / (COLS - 1);
  const yStep = (yEnd - yStart) / (ROWS - 1);

  const whiteCount = Math.max(1, Math.floor(COUNT * WHITE_RATIO));
  const whiteIndices = new Set<number>();
  const whiteStride = COUNT / whiteCount;

  for (let i = 0; i < whiteCount; i++) {
    whiteIndices.add(Math.min(COUNT - 1, Math.floor(i * whiteStride + whiteStride * 0.5)));
  }

  let idx = 0;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const homeX = xStart + col * xStep;
      const homeY = yStart + row * yStep;
      const seed = particleSeed(idx);
      const phase = (row / (ROWS - 1) + col / (COLS - 1)) * 0.5 + seed * 0.25;
      const radius = BASE_RADIUS * (0.92 + seed * 0.08);

      particles.push({
        x: homeX,
        y: homeY,
        vx: 0,
        vy: 0,
        homeX,
        homeY,
        radius,
        phase,
        colorIdx: whiteIndices.has(idx) ? 1.0 : 0.0,
        seed,
      });
      idx++;
    }
  }

  let audioBands: AudioReactiveBands | null = null;
  let attractor: AttractorConfig | null = null;
  let postImportFrames = 0;
  let postImportCenterX = 0.5;
  let postImportCenterY = 0.5;

  function resetParticles(): void {
    for (const p of particles) {
      p.x = p.homeX;
      p.y = p.homeY;
      p.vx = 0;
      p.vy = 0;
    }
  }

  function writeBuffer(time: number, temperature: number): void {
    const intensity = audioBands?.intensity;
    const visibleCount = intensity == null
      ? COUNT
      : Math.max(1, Math.min(COUNT, Math.ceil(COUNT * (0.3 + intensity * 0.7))));
    for (let i = 0; i < COUNT; i++) {
      const p = particles[i];
      const breathe = 1.0 + Math.sin(time * 0.65 + p.phase * TWO_PI) * 0.03;
      const hotShrink = 1.0 - temperature * 0.05;
      writeParticle(
        data,
        i,
        p.x,
        p.y,
        i < visibleCount ? p.radius * breathe * hotShrink : 0.001,
        p.phase,
        p.colorIdx,
        p.vx,
        p.vy,
        1.0,
      );
    }

    device.queue.writeBuffer(particleBuffer, 0, data);
  }

  function exportState(): ParticleStateSnapshot {
    const positions = new Float32Array(COUNT * 2);
    const velocities = new Float32Array(COUNT * 2);
    const radii = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const p = particles[i];
      positions[i * 2] = p.x;
      positions[i * 2 + 1] = p.y;
      velocities[i * 2] = p.vx;
      velocities[i * 2 + 1] = p.vy;
      radii[i] = p.radius;
    }

    return { positions, velocities, radii, count: COUNT };
  }

  function importState(snapshot: ParticleStateSnapshot): void {
    const n = Math.min(snapshot.count, COUNT);
    let cx = 0;
    let cy = 0;
    let avgRadius = 0;
    let speedSum = 0;

    for (let i = 0; i < n; i++) {
      const p = particles[i];
      p.x = snapshot.positions[i * 2];
      p.y = snapshot.positions[i * 2 + 1];
      p.vx = clamp(snapshot.velocities[i * 2], -MAX_IMPORT_SPEED, MAX_IMPORT_SPEED);
      p.vy = clamp(snapshot.velocities[i * 2 + 1], -MAX_IMPORT_SPEED, MAX_IMPORT_SPEED);
      if (snapshot.radii[i] > 0) {
        p.radius = snapshot.radii[i];
      }
      cx += p.x;
      cy += p.y;
      avgRadius += p.radius;
      speedSum += Math.hypot(p.vx, p.vy);
    }

    cx = n > 0 ? cx / n : 0.5;
    cy = n > 0 ? cy / n : 0.5;
    avgRadius = n > 0 ? avgRadius / n : BASE_RADIUS;

    for (let i = n; i < COUNT; i++) {
      const p = particles[i];
      const angle = (i - n + 1) * 2.399963229728653;
      const ring = 0.01 + ((i - n) % 5) * 0.005;
      p.x = clamp(cx + Math.cos(angle) * ring, 0.05, 0.95);
      p.y = clamp(cy + Math.sin(angle) * ring, 0.05, 0.95);
      p.vx = Math.cos(angle) * 0.00006;
      p.vy = Math.sin(angle) * 0.00006;
      if (!(snapshot.radii[i] > 0)) {
        p.radius = avgRadius;
      }
    }

    const avgSpeed = speedSum / Math.max(n, 1);
    if (avgSpeed < 0.00025) {
      for (let i = 0; i < COUNT; i++) {
        const p = particles[i];
        const dx = p.x - cx;
        const dy = p.y - cy;
        const dist = Math.hypot(dx, dy);
        const angle = dist > 0.001 ? Math.atan2(dy, dx) : p.seed * TWO_PI;
        const kick = IMPORT_KICK + (i % 7) * 0.00001;
        p.vx += Math.cos(angle) * kick;
        p.vy += Math.sin(angle) * kick;
      }
    }

    postImportCenterX = cx;
    postImportCenterY = cy;
    postImportFrames = POST_IMPORT_FRAMES;
    writeBuffer(0, Math.max(1, n));
  }

  function simulate(time: number, dt: number): void {
    forceX.fill(0);
    forceY.fill(0);

    // Audio-reactive: energy → temperature + thermal agitation + drag
    const baseTemp = temperatureAt(time);
    const temperature = audioBands ? clamp(baseTemp + audioBands.energy * 0.6, 0, 1) : baseTemp;
    const thermalMul = audioBands ? 1 + audioBands.energy * 10 : 1;
    const ptDrag = audioBands ? DRAG - audioBands.energy * 0.008 : DRAG;
    const ptSpeedCap = audioBands ? MAX_SPEED * (1 + audioBands.energy * 3) : MAX_SPEED;
    const order = 1.0 - temperature;
    const sceneMix = attractor ? 1 - attractor.blend : 1;
    const attractMix = attractor ? attractor.blend : 0;
    const frameStep = clamp(dt * 60.0, 0.5, 1.8);
    const speedScale = audioBands ? 1 + audioBands.bass * 3 : 1;
    const repelScale = REPEL_STRENGTH * (0.45 + temperature * 0.85) * sceneMix;
    const repelRadiusSq = REPEL_RADIUS * REPEL_RADIUS;

    for (let i = 0; i < COUNT; i++) {
      const a = particles[i];
      for (let j = i + 1; j < COUNT; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distSq = dx * dx + dy * dy;
        if (distSq >= repelRadiusSq || distSq < 1e-8) {
          continue;
        }

        const dist = Math.sqrt(distSq);
        const proximity = 1.0 - dist / REPEL_RADIUS;
        const force = repelScale * proximity * proximity / distSq;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        forceX[i] += fx;
        forceY[i] += fy;
        forceX[j] -= fx;
        forceY[j] -= fy;
      }
    }

    for (let i = 0; i < COUNT; i++) {
      const p = particles[i];

      forceX[i] += (p.homeX - p.x) * SPRING_K * order * order * sceneMix;
      forceY[i] += (p.homeY - p.y) * SPRING_K * order * order * sceneMix;

      const jitterBase = time * 0.35 + p.phase * 11.0 + p.seed * 37.0;
      const jitterAngle = fract(simpleNoise(jitterBase) + simpleNoise(jitterBase * 1.7 + 9.1) * 0.25) * TWO_PI;
      const jitterStrength = THERMAL_STRENGTH * thermalMul * temperature * temperature * (0.4 + fract(simpleNoise(jitterBase * 1.3 + 4.7) + 0.5) * 0.6);
      forceX[i] += Math.cos(jitterAngle) * jitterStrength * sceneMix;
      forceY[i] += Math.sin(jitterAngle) * jitterStrength * sceneMix;

      if (p.x < BOUNDARY_MARGIN) {
        forceX[i] += (BOUNDARY_MARGIN - p.x) * BOUNDARY_FORCE * sceneMix;
      } else if (p.x > 1.0 - BOUNDARY_MARGIN) {
        forceX[i] -= (p.x - (1.0 - BOUNDARY_MARGIN)) * BOUNDARY_FORCE * sceneMix;
      }

      if (p.y < BOUNDARY_MARGIN) {
        forceY[i] += (BOUNDARY_MARGIN - p.y) * BOUNDARY_FORCE * sceneMix;
      } else if (p.y > 1.0 - BOUNDARY_MARGIN) {
        forceY[i] -= (p.y - (1.0 - BOUNDARY_MARGIN)) * BOUNDARY_FORCE * sceneMix;
      }

      if (attractor && attractMix > 0) {
        forceX[i] += (attractor.x - p.x) * ATTRACT_K * attractMix;
        forceY[i] += (attractor.y - p.y) * ATTRACT_K * attractMix;
      }

      if (postImportFrames > 0) {
        const releaseMix = postImportFrames / POST_IMPORT_FRAMES;
        const dx = p.x - postImportCenterX;
        const dy = p.y - postImportCenterY;
        const dist = Math.hypot(dx, dy) || 1;
        const kick = IMPORT_KICK * releaseMix;
        forceX[i] += (dx / dist) * kick;
        forceY[i] += (dy / dist) * kick;
      }

      p.vx = (p.vx + forceX[i] * frameStep) * ptDrag;
      p.vy = (p.vy + forceY[i] * frameStep) * ptDrag;

      // Beat onset impulse — random velocity burst on kick
      if (audioBands?.bassOnset && audioBands.bassOnset > 0.3) {
        const burst = audioBands.bassOnset * ONSET_BURST * sceneMix;
        p.vx += (Math.random() - 0.5) * burst;
        p.vy += (Math.random() - 0.5) * burst;
      }

      const speedSq = p.vx * p.vx + p.vy * p.vy;
      const cap = MAX_SPEED * speedScale;
      if (speedSq > cap * cap) {
        const scale = cap / Math.sqrt(speedSq);
        p.vx *= scale;
        p.vy *= scale;
      }

      p.x += p.vx * speedScale * frameStep;
      p.y += p.vy * speedScale * frameStep;
    }

    if (postImportFrames > 0) {
      postImportFrames--;
    }

    writeBuffer(time, temperature);
  }

  resetParticles();
  writeBuffer(0, temperatureAt(0));

  return {
    particleBuffer,
    get count() {
      return COUNT;
    },
    update(_encoder, time, dt) {
      simulate(time, dt);
    },
    reset() {
      resetParticles();
      postImportFrames = 0;
      attractor = null;
      writeBuffer(0, temperatureAt(0));
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
