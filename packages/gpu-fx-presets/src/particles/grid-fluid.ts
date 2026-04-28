import type { AttractorConfig, AudioReactiveBands, MetaballParticleSource, ParticleStateSnapshot } from "../metaball-types";
import {
  clamp,
  createParticleArray,
  createParticleStorageBuffer,
  importSnapshotIntoParticles,
  smootherstep,
  snapshotFromParticles,
  type ParticleStateLike,
  writeParticle,
} from "./helpers";

function hash(x: number, y: number): [number, number] {
  const nx = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  const ny = Math.sin(x * 269.5 + y * 183.3) * 43758.5453;
  return [(nx - Math.floor(nx)) * 2 - 1, (ny - Math.floor(ny)) * 2 - 1];
}

function perlin2d(px: number, py: number): number {
  const ix = Math.floor(px);
  const iy = Math.floor(py);
  const fx = px - ix;
  const fy = py - iy;
  const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
  const uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);

  const [gx00, gy00] = hash(ix, iy);
  const [gx10, gy10] = hash(ix + 1, iy);
  const [gx01, gy01] = hash(ix, iy + 1);
  const [gx11, gy11] = hash(ix + 1, iy + 1);

  const d00 = gx00 * fx + gy00 * fy;
  const d10 = gx10 * (fx - 1) + gy10 * fy;
  const d01 = gx01 * fx + gy01 * (fy - 1);
  const d11 = gx11 * (fx - 1) + gy11 * (fy - 1);

  const mx0 = d00 + ux * (d10 - d00);
  const mx1 = d01 + ux * (d11 - d01);
  return mx0 + uy * (mx1 - mx0);
}

const COLS = 24;
const ROWS = 14;
const BASE_RADIUS = 0.003;
const SWELL_RADIUS = 0.032;
const WHITE_RATIO = 0.10;
const NOISE_SCALE = 1.8;
const FLOW_SPEED = 0.15;
const FLOW_ANGLE = Math.PI * 0.12;
const MARGIN = 0.06;
const POST_IMPORT_FRAMES = 18;
const ONSET_BURST = 0.002;
const COLUMN_VISIBILITY_STEP = 5;
const ROW_VISIBILITY_STEP = 5;

interface GridParticle extends ParticleStateLike {
  baseX: number;
  baseY: number;
}

export function createGridFluidParticles(device: GPUDevice): MetaballParticleSource {
  const count = COLS * ROWS;
  const particleBuffer = createParticleStorageBuffer(device, "grid-fluid-particles", count);
  const data = createParticleArray(count);
  const particles: GridParticle[] = [];

  const xStart = MARGIN;
  const xEnd = 1.0 - MARGIN;
  const yStart = MARGIN;
  const yEnd = 1.0 - MARGIN;
  const xStep = (xEnd - xStart) / (COLS - 1);
  const yStep = (yEnd - yStart) / (ROWS - 1);
  const flowDx = Math.cos(FLOW_ANGLE);
  const flowDy = Math.sin(FLOW_ANGLE);

  const whiteCount = Math.floor(count * WHITE_RATIO);
  const whiteSet = new Set<number>();
  const rowVisibilityOrder = Array.from({ length: ROWS }, (_, row) => (row * ROW_VISIBILITY_STEP) % ROWS);
  const columnVisibilityOrderByRow = Array.from({ length: ROWS }, (_, row) => {
    const seed = (row * 11 + 3) % COLS;
    return Array.from({ length: COLS }, (_, orderIdx) => (seed + orderIdx * COLUMN_VISIBILITY_STEP) % COLS);
  });
  const columnVisibilityRank = Array.from({ length: ROWS }, () => new Array<number>(COLS).fill(0));

  for (let row = 0; row < ROWS; row++) {
    const order = columnVisibilityOrderByRow[row];
    for (let rank = 0; rank < COLS; rank++) {
      columnVisibilityRank[row][order[rank]] = rank;
    }
  }

  if (whiteCount > 0) {
    const stride = Math.max(Math.floor(count / whiteCount), 1);
    for (let i = 0; i < whiteCount; i++) {
      whiteSet.add((i * stride + Math.floor(stride / 2)) % count);
    }
  }

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const idx = row * COLS + col;
      const baseX = xStart + col * xStep;
      const baseY = yStart + row * yStep;
      particles.push({
        x: baseX,
        y: baseY,
        vx: 0,
        vy: 0,
        radius: BASE_RADIUS,
        phase: (col / COLS + row / ROWS) * 0.5,
        colorIdx: whiteSet.has(idx) ? 1.0 : 0.0,
        baseX,
        baseY,
      });
    }
  }

  function computePose(
    time: number,
    index: number,
    flowMul = 1,
    noiseMul = 1,
    swellMul = 1,
  ): { x: number; y: number; radius: number } {
    const particle = particles[index];
    const offsetX = time * FLOW_SPEED * flowMul * flowDx;
    const offsetY = time * FLOW_SPEED * flowMul * flowDy;
    const nx = particle.baseX * NOISE_SCALE * noiseMul + offsetX;
    const ny = particle.baseY * NOISE_SCALE * noiseMul + offsetY;
    const noise = perlin2d(nx, ny);
    const noise2 = perlin2d(nx * 2.1 + 5.3, ny * 2.1 + 3.7) * 0.4;
    const t = clamp((noise + noise2 + 0.3) / 1.3, 0, 1);
    const swellRadius = SWELL_RADIUS * swellMul;
    const radius = BASE_RADIUS + (swellRadius - BASE_RADIUS) * t * t;
    return {
      x: particle.baseX,
      y: particle.baseY,
      radius,
    };
  }

  function flushBuffer(): void {
    const intensity = audioBands?.intensity;
    const visibleCount =
      typeof intensity === "number" && Number.isFinite(intensity)
        ? Math.max(1, Math.min(count, Math.ceil(count * (0.3 + intensity * 0.7))))
        : count;
    const baseVisiblePerRow = Math.floor(visibleCount / ROWS);
    const extraVisibleCells = visibleCount - baseVisiblePerRow * ROWS;
    const rowVisibleCounts = new Array<number>(ROWS).fill(baseVisiblePerRow);

    for (let i = 0; i < extraVisibleCells; i++) {
      rowVisibleCounts[rowVisibilityOrder[i % ROWS]]++;
    }

    for (let i = 0; i < count; i++) {
      const particle = particles[i];
      const row = Math.floor(i / COLS);
      const col = i % COLS;
      const displayRadius =
        columnVisibilityRank[row][col] < rowVisibleCounts[row] ? particle.radius : 0.001;
      writeParticle(data, i, particle.x, particle.y, displayRadius, particle.phase, particle.colorIdx, particle.vx, particle.vy);
    }
    device.queue.writeBuffer(particleBuffer, 0, data);
  }

  function syncToTarget(time: number): void {
    const flowMul = audioBands ? 1 + audioBands.bass * 3 : 1;
    const noiseMul = audioBands ? 1 + audioBands.energy * 2 : 1;
    const swellMul = audioBands ? 1 + audioBands.mid * 3 : 1;
    for (let i = 0; i < count; i++) {
      const particle = particles[i];
      const pose = computePose(time, i, flowMul, noiseMul, swellMul);
      particle.x = pose.x;
      particle.y = pose.y;
      particle.radius = pose.radius;
      // Beat onset: radius pulse (no velocity in sync path)
      if (audioBands?.bassOnset && audioBands.bassOnset > 0.3) {
        particle.radius *= 1 + audioBands.bassOnset * 0.5;
      }
      particle.vx = 0;
      particle.vy = 0;
    }
    flushBuffer();
  }

  let attractor: AttractorConfig | null = null;
  let audioBands: AudioReactiveBands | null = null;
  let postImportFrames = 0;

  function updateTransition(time: number, dt: number): void {
    const step = clamp(dt * 60, 0.75, 1.5);
    const attractMix = attractor ? clamp(attractor.blend, 0, 1) : 0;
    const recoverMix = postImportFrames > 0 ? smootherstep(1 - postImportFrames / POST_IMPORT_FRAMES) : 0;
    const spring = attractor ? 0.0012 + attractMix * 0.001 : 0.0007 + recoverMix * 0.0027;
    const drag = attractor ? 0.970 : 0.944 + recoverMix * 0.03;
    const radiusFollow = attractor ? 0.01 : 0.03 + recoverMix * 0.03;

    const sceneMix = 1 - attractMix;
    const flowMul = audioBands ? 1 + audioBands.bass * 3 * sceneMix : 1;
    const noiseMul = audioBands ? 1 + audioBands.energy * 2 * sceneMix : 1;
    const swellMul = audioBands ? 1 + audioBands.mid * 3 * sceneMix : 1;

    for (let i = 0; i < count; i++) {
      const particle = particles[i];
      const pose = computePose(time, i, flowMul, noiseMul, swellMul);
      const destX = attractor ? pose.x * (1 - attractMix) + attractor.x * attractMix : pose.x;
      const destY = attractor ? pose.y * (1 - attractMix) + attractor.y * attractMix : pose.y;
      const dx = destX - particle.x;
      const dy = destY - particle.y;

      particle.vx = (particle.vx + dx * spring * step) * drag;
      particle.vy = (particle.vy + dy * spring * step) * drag;

      // Beat onset: random velocity kick
      if (audioBands?.bassOnset && audioBands.bassOnset > 0.3) {
        const burst = audioBands.bassOnset * ONSET_BURST * sceneMix;
        particle.vx += (Math.random() - 0.5) * burst;
        particle.vy += (Math.random() - 0.5) * burst;
      }

      particle.x = clamp(particle.x + particle.vx * step, 0.04, 0.96);
      particle.y = clamp(particle.y + particle.vy * step, 0.06, 0.94);
      particle.radius += (pose.radius - particle.radius) * radiusFollow;
    }

    if (postImportFrames > 0) {
      postImportFrames--;
    }

    flushBuffer();
  }

  syncToTarget(0);

  return {
    particleBuffer,
    get count() {
      return count;
    },
    update(_encoder, time, dt) {
      if (!attractor && postImportFrames === 0) {
        syncToTarget(time);
        return;
      }
      updateTransition(time, dt);
    },
    reset() {
      attractor = null;
      postImportFrames = 0;
      syncToTarget(0);
    },
    destroy() {
      particleBuffer.destroy();
    },
    exportState() {
      return snapshotFromParticles(particles);
    },
    importState(snapshot: ParticleStateSnapshot) {
      importSnapshotIntoParticles(particles, snapshot, { maxSpeed: 0.0035 });
      postImportFrames = POST_IMPORT_FRAMES;
      flushBuffer();
    },
    setAttractor(config: AttractorConfig | null) {
      const hadAttractor = attractor !== null;
      attractor = config;
      if (!config && hadAttractor) {
        postImportFrames = Math.max(postImportFrames, POST_IMPORT_FRAMES);
      }
    },
    setAudioReactive(bands: AudioReactiveBands | null) {
      audioBands = bands;
    },
  };
}
