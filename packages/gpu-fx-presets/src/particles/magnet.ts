import type { AttractorConfig, AudioReactiveBands, MetaballParticleSource, ParticleStateSnapshot } from "../metaball-types";
import { clamp, createParticleArray, createParticleStorageBuffer, writeParticle } from "./helpers";

const DYNAMIC_DOT_COUNT = 60;
const POLE_COUNT = 1;
const BASE_RADIUS = 0.007;
const WHITE_RATIO = 0.10;
const ATTRACT_STRENGTH = 0.000004;
const REPEL_STRENGTH = 0.000002;
const REPEL_RADIUS = 0.035;
const DRAG = 0.994;
const POLE_DRIFT_SPEED = 0.012;
const TOTAL_COUNT = DYNAMIC_DOT_COUNT + 1;
const ATTRACT_K = 0.0015;
const POST_IMPORT_FRAMES = 18;
const IMPORT_KICK = 0.00005;
const MAX_IMPORT_SPEED = 0.004;
const ONSET_BURST = 0.004;
const TAIL_RADIUS = 0.001;

interface Dot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  isWhite: boolean;
}

interface Pole {
  orbitCx: number;
  orbitCy: number;
  orbitRx: number;
  orbitRy: number;
  speedMul: number;
  angleOffset: number;
}

export function createMagnetParticles(device: GPUDevice): MetaballParticleSource {
  const particleBuffer = createParticleStorageBuffer(device, "magnet-particles", TOTAL_COUNT);
  const data = createParticleArray(TOTAL_COUNT);
  const dots: Dot[] = [];
  const poles: Pole[] = [];
  let attractor: AttractorConfig | null = null;
  let audioBands: AudioReactiveBands | null = null;
  let postImportFrames = 0;
  let postImportCenterX = 0.5;
  let postImportCenterY = 0.5;

  for (let i = 0; i < DYNAMIC_DOT_COUNT; i++) {
    const sizeRoll = Math.random();
    let radius: number;
    if (sizeRoll < 0.70) {
      radius = BASE_RADIUS * (0.6 + Math.random() * 0.8);
    } else if (sizeRoll < 0.92) {
      radius = BASE_RADIUS * (1.2 + Math.random() * 0.8);
    } else {
      radius = BASE_RADIUS * (2.0 + Math.random() * 0.8);
    }
    const angle = Math.random() * Math.PI * 2;
    const dist = 0.08 + Math.random() * 0.18;
    dots.push({
      x: 0.5 + Math.cos(angle) * dist,
      y: 0.5 + Math.sin(angle) * dist,
      vx: 0,
      vy: 0,
      radius,
      phase: Math.random(),
      isWhite: i < DYNAMIC_DOT_COUNT * WHITE_RATIO,
    });
  }

  for (let i = 0; i < POLE_COUNT; i++) {
    poles.push({
      orbitCx: 0.5,
      orbitCy: 0.5,
      orbitRx: 0.03,
      orbitRy: 0.02,
      speedMul: 1.0,
      angleOffset: 0,
    });
  }

  function getPolePosition(pole: Pole, time: number): [number, number] {
    const angle = time * POLE_DRIFT_SPEED * pole.speedMul + pole.angleOffset;
    return [
      pole.orbitCx + Math.cos(angle) * pole.orbitRx,
      pole.orbitCy + Math.sin(angle) * pole.orbitRy,
    ];
  }

  function simulate(time: number, dt: number): void {
    const polePositions = poles.map((pole) => getPolePosition(pole, time));
    const sceneMix = attractor ? 1 - attractor.blend : 1;
    const attractMix = attractor ? attractor.blend : 0;

    const speedScale = audioBands ? 1 + audioBands.bass * 3 : 1;
    const attractMul = audioBands ? 1 + audioBands.bass * 50 : 1;
    const repelMul = audioBands ? 1 + audioBands.mid * 3 : 1;
    const magnetDrag = audioBands ? DRAG - audioBands.energy * 0.004 : DRAG;

    for (let i = 0; i < DYNAMIC_DOT_COUNT; i++) {
      const dot = dots[i];
      let fx = 0;
      let fy = 0;

      for (const [px, py] of polePositions) {
        const dx = px - dot.x;
        const dy = py - dot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const safeDist = Math.max(dist, 0.01);
        const force = (ATTRACT_STRENGTH * attractMul * sceneMix) / (safeDist * safeDist);
        fx += (dx / safeDist) * force;
        fy += (dy / safeDist) * force;
      }

      for (let j = 0; j < DYNAMIC_DOT_COUNT; j++) {
        if (i === j) {
          continue;
        }
        const dx = dot.x - dots[j].x;
        const dy = dot.y - dots[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_RADIUS && dist > 0.001) {
          const repel = (REPEL_STRENGTH * repelMul * sceneMix) / (dist * dist);
          fx += (dx / dist) * repel;
          fy += (dy / dist) * repel;
        }
      }

      if (attractor && attractMix > 0) {
        fx += (attractor.x - dot.x) * ATTRACT_K * attractMix;
        fy += (attractor.y - dot.y) * ATTRACT_K * attractMix;
      }

      if (postImportFrames > 0) {
        const releaseMix = postImportFrames / POST_IMPORT_FRAMES;
        const dx = dot.x - postImportCenterX;
        const dy = dot.y - postImportCenterY;
        const dist = Math.hypot(dx, dy) || 1;
        const kick = IMPORT_KICK * releaseMix;
        fx += (dx / dist) * kick;
        fy += (dy / dist) * kick;
      }

      dot.vx = (dot.vx + fx) * magnetDrag;
      dot.vy = (dot.vy + fy) * magnetDrag;

      if (audioBands?.bassOnset && audioBands.bassOnset > 0.3) {
        const bx = dot.x - 0.5;
        const by = dot.y - 0.5;
        const bd = Math.hypot(bx, by) || 0.01;
        const burst = audioBands.bassOnset * ONSET_BURST * sceneMix;
        dot.vx += (bx / bd) * burst;
        dot.vy += (by / bd) * burst;
      }

      const speed = Math.hypot(dot.vx, dot.vy);
      const maxSpeed = MAX_IMPORT_SPEED * speedScale;
      if (speed > maxSpeed) {
        const scale = maxSpeed / speed;
        dot.vx *= scale;
        dot.vy *= scale;
      }
      dot.x += dot.vx * speedScale;
      dot.y += dot.vy * speedScale;
    }

    if (postImportFrames > 0) {
      postImportFrames--;
    }
  }

  function writeBuffer(time: number): void {
    const intensity = audioBands?.intensity;
    const hasIntensity = intensity != null;
    const visibleDynamicCount = hasIntensity
      ? Math.max(1, Math.min(DYNAMIC_DOT_COUNT, Math.ceil(DYNAMIC_DOT_COUNT * clamp(0.3 + intensity * 0.7, 0.3, 1.0))))
      : DYNAMIC_DOT_COUNT;

    for (let i = 0; i < DYNAMIC_DOT_COUNT; i++) {
      const dot = dots[i];
      const breathe = 1.0 + Math.sin(time * 1.2 + dot.phase * 6.28) * 0.06;
      writeParticle(
        data,
        i,
        dot.x,
        dot.y,
        i < visibleDynamicCount ? dot.radius * breathe : TAIL_RADIUS,
        dot.phase,
        dot.isWhite ? 1.0 : 0.0,
        dot.vx,
        dot.vy,
      );
    }

    writeParticle(data, DYNAMIC_DOT_COUNT, 0.5, 0.5, 0.05, 0, 0.0);
    device.queue.writeBuffer(particleBuffer, 0, data);
  }

  function exportState(): ParticleStateSnapshot {
    const positions = new Float32Array(TOTAL_COUNT * 2);
    const velocities = new Float32Array(TOTAL_COUNT * 2);
    const radii = new Float32Array(TOTAL_COUNT);

    for (let i = 0; i < DYNAMIC_DOT_COUNT; i++) {
      const dot = dots[i];
      positions[i * 2] = dot.x;
      positions[i * 2 + 1] = dot.y;
      velocities[i * 2] = dot.vx;
      velocities[i * 2 + 1] = dot.vy;
      radii[i] = dot.radius;
    }

    positions[DYNAMIC_DOT_COUNT * 2] = 0.5;
    positions[DYNAMIC_DOT_COUNT * 2 + 1] = 0.5;
    velocities[DYNAMIC_DOT_COUNT * 2] = 0;
    velocities[DYNAMIC_DOT_COUNT * 2 + 1] = 0;
    radii[DYNAMIC_DOT_COUNT] = 0.05;

    return { positions, velocities, radii, count: TOTAL_COUNT };
  }

  function importState(snapshot: ParticleStateSnapshot): void {
    const n = Math.min(snapshot.count, DYNAMIC_DOT_COUNT);
    let cx = 0;
    let cy = 0;
    let avgRadius = 0;
    let speedSum = 0;

    for (let i = 0; i < n; i++) {
      const dot = dots[i];
      dot.x = snapshot.positions[i * 2];
      dot.y = snapshot.positions[i * 2 + 1];
      dot.vx = clamp(snapshot.velocities[i * 2], -MAX_IMPORT_SPEED, MAX_IMPORT_SPEED);
      dot.vy = clamp(snapshot.velocities[i * 2 + 1], -MAX_IMPORT_SPEED, MAX_IMPORT_SPEED);
      if (snapshot.radii[i] > 0) {
        dot.radius = snapshot.radii[i];
      }
      cx += dot.x;
      cy += dot.y;
      avgRadius += dot.radius;
      speedSum += Math.hypot(dot.vx, dot.vy);
    }

    cx = n > 0 ? cx / n : 0.5;
    cy = n > 0 ? cy / n : 0.5;
    avgRadius = n > 0 ? avgRadius / n : BASE_RADIUS;

    for (let i = n; i < DYNAMIC_DOT_COUNT; i++) {
      const dot = dots[i];
      const angle = (i - n + 1) * 2.399963229728653;
      const ring = 0.01 + ((i - n) % 5) * 0.005;
      dot.x = clamp(cx + Math.cos(angle) * ring, 0.05, 0.95);
      dot.y = clamp(cy + Math.sin(angle) * ring, 0.05, 0.95);
      dot.vx = Math.cos(angle) * 0.00008;
      dot.vy = Math.sin(angle) * 0.00008;
      if (!(snapshot.radii[i] > 0)) {
        dot.radius = avgRadius;
      }
    }

    const avgSpeed = speedSum / Math.max(n, 1);
    if (avgSpeed < 0.0003) {
      for (let i = 0; i < DYNAMIC_DOT_COUNT; i++) {
        const dot = dots[i];
        const dx = dot.x - cx;
        const dy = dot.y - cy;
        const dist = Math.hypot(dx, dy);
        const angle = dist > 0.001 ? Math.atan2(dy, dx) : dot.phase * Math.PI * 2 + i * 0.11;
        const kick = IMPORT_KICK + (i % 7) * 0.000008;
        dot.vx += Math.cos(angle) * kick;
        dot.vy += Math.sin(angle) * kick;
      }
    }

    postImportCenterX = cx;
    postImportCenterY = cy;
    postImportFrames = POST_IMPORT_FRAMES;
    writeBuffer(0);
  }

  function resetDots(): void {
    for (let i = 0; i < DYNAMIC_DOT_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 0.08 + Math.random() * 0.18;
      dots[i].x = 0.5 + Math.cos(angle) * dist;
      dots[i].y = 0.5 + Math.sin(angle) * dist;
      dots[i].vx = 0;
      dots[i].vy = 0;
    }
    writeBuffer(0);
  }

  writeBuffer(0);

  return {
    particleBuffer,
    get count() {
      return TOTAL_COUNT;
    },
    update(_encoder, time, dt) {
      simulate(time, dt);
      writeBuffer(time);
    },
    reset() {
      resetDots();
      attractor = null;
      postImportFrames = 0;
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
