import type { AttractorConfig, AudioReactiveBands, MetaballParticleSource, ParticleStateSnapshot } from "../metaball-types";
import { clamp, createParticleArray, createParticleStorageBuffer, writeParticle } from "./helpers";

const COUNT = 40;
const GROUP_COUNT = 3;
const BASE_RADIUS = 0.008;
const WHITE_RATIO = 0.10;
const PERCEPTION_RADIUS = 0.14;
const SEPARATION_DISTANCE = 0.04;
const SEPARATION_WEIGHT = 0.000024;
const ALIGNMENT_WEIGHT = 0.000010;
const COHESION_WEIGHT = 0.000007;
const BOUNDARY_WEIGHT = 0.000020;
const DRAG = 0.995;
const MAX_SPEED = 0.0028;
const MIN_X = 0.08;
const MAX_X = 0.92;
const MIN_Y = 0.10;
const MAX_Y = 0.90;
const ONSET_BURST = 0.004;
const TAU = Math.PI * 2;

interface Dot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  isWhite: boolean;
}

function fract(value: number): number {
  return value - Math.floor(value);
}

function hash01(seed: number): number {
  return fract(Math.sin(seed * 127.1 + 311.7) * 43758.5453123);
}

function hashSigned(seed: number): number {
  return hash01(seed) * 2 - 1;
}

function initialDot(index: number): Dot {
  const group = index % GROUP_COUNT;
  const clusterAngle = (group / GROUP_COUNT) * TAU + 0.45;
  const clusterRadius = 0.14 + group * 0.015;
  const centerX = 0.5 + Math.cos(clusterAngle) * clusterRadius;
  const centerY = 0.5 + Math.sin(clusterAngle) * clusterRadius * 0.55;
  const spreadAngle = hash01(index + 1.3) * TAU;
  const spreadRadius = 0.010 + hash01(index + 11.2) * 0.040;
  const tangentAngle = clusterAngle + Math.PI * 0.5 + hashSigned(index + 21.5) * 0.2;
  const radius = BASE_RADIUS * (0.78 + hash01(index + 31.8) * 0.55);
  const speed = 0.0007 + hash01(index + 41.4) * 0.00045;
  return {
    x: centerX + Math.cos(spreadAngle) * spreadRadius,
    y: centerY + Math.sin(spreadAngle) * spreadRadius * 0.8,
    vx: Math.cos(tangentAngle) * speed,
    vy: Math.sin(tangentAngle) * speed,
    radius,
    phase: hash01(index + 51.7),
    isWhite: index < Math.floor(COUNT * WHITE_RATIO),
  };
}

export function createFlockParticles(device: GPUDevice): MetaballParticleSource {
  const particleBuffer = createParticleStorageBuffer(device, "flock-particles", COUNT);
  const data = createParticleArray(COUNT);
  const dots = Array.from({ length: COUNT }, (_, index) => initialDot(index));
  let attractor: AttractorConfig | null = null;
  let audioBands: AudioReactiveBands | null = null;

  function resetDots(): void {
    for (let i = 0; i < COUNT; i++) {
      dots[i] = initialDot(i);
    }
  }

  function simulate(dt: number): void {
    const step = clamp(dt * 60, 0.75, 1.5);
    const speedScale = audioBands ? 1 + audioBands.bass * 3 : 1;
    const sceneMix = attractor ? 1 - attractor.blend : 1;
    const attractMix = attractor ? attractor.blend : 0;
    const ATTRACT_K = 0.0015;

    // Audio-reactive: bass intensifies separation, energy loosens drag
    const sepMul = audioBands ? 1 + audioBands.bass * 2 : 1;
    const dragMul = audioBands ? DRAG - audioBands.energy * 0.006 : DRAG;

    for (let i = 0; i < COUNT; i++) {
      const dot = dots[i];
      let separationX = 0;
      let separationY = 0;
      let alignmentX = 0;
      let alignmentY = 0;
      let cohesionX = 0;
      let cohesionY = 0;
      let neighbors = 0;

      for (let j = 0; j < COUNT; j++) {
        if (i === j) {
          continue;
        }
        const other = dots[j];
        const dx = other.x - dot.x;
        const dy = other.y - dot.y;
        const distSq = dx * dx + dy * dy;
        if (distSq > PERCEPTION_RADIUS * PERCEPTION_RADIUS || distSq < 0.0000001) {
          continue;
        }

        neighbors++;
        alignmentX += other.vx;
        alignmentY += other.vy;
        cohesionX += other.x;
        cohesionY += other.y;

        if (distSq < SEPARATION_DISTANCE * SEPARATION_DISTANCE) {
          const dist = Math.sqrt(distSq);
          const safeDist = Math.max(dist, 0.002);
          separationX -= dx / (safeDist * safeDist);
          separationY -= dy / (safeDist * safeDist);
        }
      }

      let forceX = separationX * SEPARATION_WEIGHT * sepMul * sceneMix;
      let forceY = separationY * SEPARATION_WEIGHT * sepMul * sceneMix;

      if (neighbors > 0) {
        const invNeighbors = 1 / neighbors;
        forceX += (alignmentX * invNeighbors - dot.vx) * ALIGNMENT_WEIGHT * sceneMix;
        forceY += (alignmentY * invNeighbors - dot.vy) * ALIGNMENT_WEIGHT * sceneMix;
        forceX += (cohesionX * invNeighbors - dot.x) * COHESION_WEIGHT * sceneMix;
        forceY += (cohesionY * invNeighbors - dot.y) * COHESION_WEIGHT * sceneMix;
      }

      if (dot.x < MIN_X) {
        forceX += (MIN_X - dot.x) * BOUNDARY_WEIGHT * sceneMix;
      } else if (dot.x > MAX_X) {
        forceX -= (dot.x - MAX_X) * BOUNDARY_WEIGHT * sceneMix;
      }
      if (dot.y < MIN_Y) {
        forceY += (MIN_Y - dot.y) * BOUNDARY_WEIGHT * sceneMix;
      } else if (dot.y > MAX_Y) {
        forceY -= (dot.y - MAX_Y) * BOUNDARY_WEIGHT * sceneMix;
      }

      // Central attractor force (blended in)
      if (attractor && attractMix > 0) {
        forceX += (attractor.x - dot.x) * ATTRACT_K * attractMix;
        forceY += (attractor.y - dot.y) * ATTRACT_K * attractMix;
      }

      dot.vx = (dot.vx + forceX * step) * dragMul;
      dot.vy = (dot.vy + forceY * step) * dragMul;

      // Beat onset impulse — random scatter burst on kick
      if (audioBands?.bassOnset && audioBands.bassOnset > 0.3) {
        const burst = audioBands.bassOnset * ONSET_BURST * sceneMix;
        dot.vx += (Math.random() - 0.5) * burst;
        dot.vy += (Math.random() - 0.5) * burst;
      }

      const speed = Math.sqrt(dot.vx * dot.vx + dot.vy * dot.vy);
      if (speed > MAX_SPEED * speedScale) {
        const scale = MAX_SPEED * speedScale / speed;
        dot.vx *= scale;
        dot.vy *= scale;
      }
    }

    for (let i = 0; i < COUNT; i++) {
      const dot = dots[i];
      dot.x = clamp(dot.x + dot.vx * speedScale * step, 0.04, 0.96);
      dot.y = clamp(dot.y + dot.vy * speedScale * step, 0.06, 0.94);
    }
  }

  function writeBuffer(time: number): void {
    const intensity = audioBands?.intensity;
    const visibleCount = intensity == null
      ? COUNT
      : Math.max(1, Math.min(COUNT, Math.ceil(COUNT * (0.3 + intensity * 0.7))));
    for (let i = 0; i < COUNT; i++) {
      const dot = dots[i];
      const breathe = 1.0 + Math.sin(time * 0.7 + dot.phase * TAU) * 0.05;
      writeParticle(
        data,
        i,
        dot.x,
        dot.y,
        i < visibleCount ? dot.radius * breathe : 0.001,
        dot.phase,
        dot.isWhite ? 1.0 : 0.0,
        dot.vx,
        dot.vy,
      );
    }

    device.queue.writeBuffer(particleBuffer, 0, data);
  }

  resetDots();
  writeBuffer(0);

  return {
    particleBuffer,
    get count() {
      return COUNT;
    },
    update(_encoder, time, dt) {
      simulate(dt);
      writeBuffer(time);
    },
    reset() {
      resetDots();
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
        const d = dots[i];
        positions[i * 2] = d.x;
        positions[i * 2 + 1] = d.y;
        velocities[i * 2] = d.vx;
        velocities[i * 2 + 1] = d.vy;
        radii[i] = d.radius;
      }
      return { positions, velocities, radii, count: COUNT };
    },
    importState(snapshot: ParticleStateSnapshot) {
      const n = Math.min(snapshot.count, COUNT);
      let cx = 0;
      let cy = 0;
      let speedSum = 0;
      for (let i = 0; i < n; i++) {
        dots[i].x = snapshot.positions[i * 2];
        dots[i].y = snapshot.positions[i * 2 + 1];
        dots[i].vx = snapshot.velocities[i * 2];
        dots[i].vy = snapshot.velocities[i * 2 + 1];
        cx += dots[i].x;
        cy += dots[i].y;
        speedSum += Math.hypot(dots[i].vx, dots[i].vy);
      }
      cx = n > 0 ? cx / n : 0.5;
      cy = n > 0 ? cy / n : 0.5;

      // Deficit particles: place at centroid of imported cluster
      if (n < COUNT) {
        for (let i = n; i < COUNT; i++) {
          const ang = (i * 2.399) % (Math.PI * 2); // golden angle
          const r = 0.003 + (i % 5) * 0.002;
          dots[i].x = cx + Math.cos(ang) * r;
          dots[i].y = cy + Math.sin(ang) * r;
          dots[i].vx = Math.cos(ang) * 0.00014;
          dots[i].vy = Math.sin(ang) * 0.00014;
        }
      }

      // If the absorbed mass arrives almost motionless, seed a tiny flock-specific release.
      const avgSpeed = speedSum / Math.max(n, 1);
      if (avgSpeed < 0.00035) {
        for (let i = 0; i < COUNT; i++) {
          const dx = dots[i].x - cx;
          const dy = dots[i].y - cy;
          const dist = Math.hypot(dx, dy);
          const ang = dist > 0.0015
            ? Math.atan2(dy, dx)
            : dots[i].phase * TAU + (i % GROUP_COUNT) * (TAU / GROUP_COUNT);
          const dirX = Math.cos(ang);
          const dirY = Math.sin(ang);
          const kick = 0.00012 + (i % GROUP_COUNT) * 0.00003;
          const swirl = 0.42;
          dots[i].vx += dirX * kick - dirY * kick * swirl;
          dots[i].vy += dirY * kick + dirX * kick * swirl;
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
