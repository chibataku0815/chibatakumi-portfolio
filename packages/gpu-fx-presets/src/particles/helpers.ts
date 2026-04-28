import type { ParticleStateSnapshot } from "../metaball-types";
import { METABALL_PARTICLE_BYTES, METABALL_PARTICLE_FLOATS } from "../metaball-types";

export interface ParticleStateLike {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  colorIdx: number;
}

export interface SnapshotStats {
  centerX: number;
  centerY: number;
  centerVx: number;
  centerVy: number;
  avgSpeed: number;
  count: number;
}

export function createParticleStorageBuffer(
  device: GPUDevice,
  label: string,
  count: number,
): GPUBuffer {
  return device.createBuffer({
    label,
    size: count * METABALL_PARTICLE_BYTES,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
}

export function createParticleArray(count: number): Float32Array {
  return new Float32Array(count * METABALL_PARTICLE_FLOATS);
}

export function snapshotFromParticles(
  particles: readonly ParticleStateLike[],
  count: number = particles.length,
): ParticleStateSnapshot {
  const n = Math.min(count, particles.length);
  const positions = new Float32Array(n * 2);
  const velocities = new Float32Array(n * 2);
  const radii = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    const particle = particles[i];
    positions[i * 2] = particle.x;
    positions[i * 2 + 1] = particle.y;
    velocities[i * 2] = particle.vx;
    velocities[i * 2 + 1] = particle.vy;
    radii[i] = particle.radius;
  }

  return { positions, velocities, radii, count: n };
}

export function snapshotStats(snapshot: ParticleStateSnapshot, count: number = snapshot.count): SnapshotStats {
  const n = Math.min(count, snapshot.count);
  let centerX = 0;
  let centerY = 0;
  let centerVx = 0;
  let centerVy = 0;
  let speedSum = 0;

  for (let i = 0; i < n; i++) {
    const x = snapshot.positions[i * 2];
    const y = snapshot.positions[i * 2 + 1];
    const vx = snapshot.velocities[i * 2];
    const vy = snapshot.velocities[i * 2 + 1];
    centerX += x;
    centerY += y;
    centerVx += vx;
    centerVy += vy;
    speedSum += Math.hypot(vx, vy);
  }

  const safeCount = Math.max(n, 1);
  return {
    centerX: centerX / safeCount,
    centerY: centerY / safeCount,
    centerVx: centerVx / safeCount,
    centerVy: centerVy / safeCount,
    avgSpeed: speedSum / safeCount,
    count: n,
  };
}

export function seedParticleFromCentroid(
  particle: ParticleStateLike,
  index: number,
  stats: SnapshotStats,
): void {
  const angle = index * 2.399963229728653;
  const ring = 0.0025 + (index % 5) * 0.0017;
  particle.x = stats.centerX + Math.cos(angle) * ring;
  particle.y = stats.centerY + Math.sin(angle) * ring * 0.8;
  particle.vx = Math.cos(angle) * 0.0001;
  particle.vy = Math.sin(angle) * 0.0001;
}

export function importSnapshotIntoParticles<T extends ParticleStateLike>(
  particles: T[],
  snapshot: ParticleStateSnapshot,
  options?: {
    maxSpeed?: number;
    fillMissing?: (particle: T, index: number, stats: SnapshotStats) => void;
  },
): SnapshotStats {
  const stats = snapshotStats(snapshot, particles.length);
  const importedCount = Math.min(snapshot.count, particles.length);
  const maxSpeed = options?.maxSpeed ?? Number.POSITIVE_INFINITY;

  for (let i = 0; i < importedCount; i++) {
    const particle = particles[i];
    particle.x = snapshot.positions[i * 2];
    particle.y = snapshot.positions[i * 2 + 1];
    particle.vx = snapshot.velocities[i * 2];
    particle.vy = snapshot.velocities[i * 2 + 1];
    particle.radius = snapshot.radii[i];

    if (Number.isFinite(maxSpeed)) {
      const speed = Math.hypot(particle.vx, particle.vy);
      if (speed > maxSpeed) {
        const scale = maxSpeed / (speed || 1);
        particle.vx *= scale;
        particle.vy *= scale;
      }
    }
  }

  for (let i = importedCount; i < particles.length; i++) {
    const particle = particles[i];
    if (options?.fillMissing) {
      options.fillMissing(particle, i, stats);
    } else {
      seedParticleFromCentroid(particle, i, stats);
    }

    if (Number.isFinite(maxSpeed)) {
      const speed = Math.hypot(particle.vx, particle.vy);
      if (speed > maxSpeed) {
        const scale = maxSpeed / (speed || 1);
        particle.vx *= scale;
        particle.vy *= scale;
      }
    }
  }

  return stats;
}

export function writeParticle(
  data: Float32Array,
  idx: number,
  x: number,
  y: number,
  radius: number,
  phase: number,
  colorIdx: number,
  vx: number = 0,
  vy: number = 0,
  life: number = 1,
): void {
  const off = idx * METABALL_PARTICLE_FLOATS;
  data[off + 0] = x;
  data[off + 1] = y;
  data[off + 2] = vx;
  data[off + 3] = vy;
  data[off + 4] = radius;
  data[off + 5] = phase;
  data[off + 6] = colorIdx;
  data[off + 7] = life;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function smootherstep(t: number): number {
  const tc = clamp(t, 0, 1);
  return tc * tc * tc * (tc * (tc * 6 - 15) + 10);
}

export function simpleNoise(x: number): number {
  const ix = Math.floor(x);
  const fx = x - ix;
  const u = fx * fx * (3 - 2 * fx);
  const a = Math.sin(ix * 127.1) * 43758.5453 % 1;
  const b = Math.sin((ix + 1) * 127.1) * 43758.5453 % 1;
  return a + u * (b - a);
}

export function cubicBezier(
  p0x: number,
  p0y: number,
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
  p3x: number,
  p3y: number,
  t: number,
): [number, number] {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;
  return [
    mt3 * p0x + 3 * mt2 * t * p1x + 3 * mt * t2 * p2x + t3 * p3x,
    mt3 * p0y + 3 * mt2 * t * p1y + 3 * mt * t2 * p2y + t3 * p3y,
  ];
}

export interface CubicPathDef {
  readonly p0: readonly [number, number];
  readonly p1: readonly [number, number];
  readonly p2: readonly [number, number];
  readonly p3: readonly [number, number];
}

export function evalPath(path: CubicPathDef, t: number): [number, number] {
  return cubicBezier(
    path.p0[0], path.p0[1],
    path.p1[0], path.p1[1],
    path.p2[0], path.p2[1],
    path.p3[0], path.p3[1],
    t,
  );
}

export function pathTangent(path: CubicPathDef, t: number): [number, number] {
  const dt = 0.003;
  const [ax, ay] = evalPath(path, Math.max(0, t - dt));
  const [bx, by] = evalPath(path, Math.min(1, t + dt));
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return [dx / len, dy / len];
}

export function pathCurvature(path: CubicPathDef, t: number): number {
  const dt = 0.005;
  const [t1x, t1y] = pathTangent(path, Math.max(0, t - dt));
  const [t2x, t2y] = pathTangent(path, Math.min(1, t + dt));
  const dx = t2x - t1x;
  const dy = t2y - t1y;
  return Math.sqrt(dx * dx + dy * dy) / (2 * dt);
}
