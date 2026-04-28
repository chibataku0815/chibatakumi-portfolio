import type { AttractorConfig, AudioReactiveBands, MetaballParticleSource, ParticleStateSnapshot } from "../metaball-types";
import {
  clamp,
  createParticleArray,
  createParticleStorageBuffer,
  simpleNoise,
  smootherstep,
  writeParticle,
} from "./helpers";
import { sampleTextPositions, createTextMaskTexture } from "./text-sampler";

// ── Counts ──────────────────────────────────────────────────────
const INITIAL_COUNT = 30;
const MAX_COUNT = 150;

// ── Physics ─────────────────────────────────────────────────────
const BASE_RADIUS = 0.010;
const SPRING_K = 0.00030;
const THERMAL_STRENGTH = 0.00003;
const REPEL_STRENGTH = 0.0000015;
const REPEL_RADIUS = 0.015;
const DRAG = 0.991;
const MAX_SPEED = 0.0035;
const BOUNDARY_MARGIN = 0.05;
const BOUNDARY_FORCE = 0.00002;
const TWO_PI = Math.PI * 2;
const ATTRACT_K = 0.0015;
const POST_IMPORT_FRAMES = 18;
const IMPORT_KICK = 0.00006;
const MAX_IMPORT_SPEED = 0.004;
const ONSET_BURST = 0.005;
const HIDDEN_POS = -2.0;

// ── Timeline (seconds) ─────────────────────────────────────────
const CONVERGE_DURATION = 6.0;
const FILL_FADE_START = 10.0;
const FILL_FADE_END = 13.0;

/** Pick ~4 white accent particles evenly distributed across the text span */
function pickWhiteIndices(n: number): Set<number> {
  const whites = new Set<number>();
  const WHITE_COUNT = 4;
  const step = Math.max(1, Math.floor(n / (WHITE_COUNT + 1)));
  for (let k = 1; k <= WHITE_COUNT; k++) {
    whites.add(Math.min(k * step, n - 1));
  }
  return whites;
}

export interface TextAttractorConfig {
  text?: string;
  fontSize?: number;
}

interface ParticleState {
  x: number; y: number;
  vx: number; vy: number;
  homeX: number; homeY: number;
  radius: number;
  targetRadius: number;
  phase: number;
  colorIdx: number;
  seed: number;
}

function fract(v: number): number { return v - Math.floor(v); }
function particleSeed(i: number): number { return fract(simpleNoise(i * 13.37 + 0.5) + 0.5); }

export function createTextAttractorParticles(
  device: GPUDevice,
  config?: TextAttractorConfig,
): MetaballParticleSource & { setText(text: string): void } {
  let currentText = config?.text ?? "hello";
  const fontSize = config?.fontSize ?? 160;

  const particleBuffer = createParticleStorageBuffer(device, "text-attractor-particles", MAX_COUNT);
  const data = createParticleArray(MAX_COUNT);
  const particles: ParticleState[] = [];
  const forceX = new Float32Array(MAX_COUNT);
  const forceY = new Float32Array(MAX_COUNT);

  let currentMask = createTextMaskTexture(device, currentText, fontSize);
  let activeCount = INITIAL_COUNT;
  let renderCount = INITIAL_COUNT;
  let sceneTime = 0;
  let currentMaskBlend = 0;
  let attractor: AttractorConfig | null = null;
  let audioBands: AudioReactiveBands | null = null;
  let postImportFrames = 0;
  let postImportCenterX = 0.5;
  let postImportCenterY = 0.5;

  function initParticles(): void {
    const homes = sampleTextPositions(currentText, MAX_COUNT, fontSize);
    const whiteSet = pickWhiteIndices(INITIAL_COUNT);

    // Ensure particles array has MAX_COUNT entries
    while (particles.length < MAX_COUNT) {
      particles.push({
        x: 0, y: 0, vx: 0, vy: 0,
        homeX: 0, homeY: 0,
        radius: 0, targetRadius: 0,
        phase: 0, colorIdx: 0, seed: 0,
      });
    }

    for (let i = 0; i < MAX_COUNT; i++) {
      const seed = particleSeed(i);
      const phase = i / MAX_COUNT + seed * 0.25;
      const fullRadius = BASE_RADIUS * (0.92 + seed * 0.08);
      const p = particles[i];

      p.x = 0.1 + fract(simpleNoise(i * 7.13 + 1.0)) * 0.8;
      p.y = 0.1 + fract(simpleNoise(i * 11.31 + 2.0)) * 0.8;
      p.vx = 0; p.vy = 0;
      p.homeX = homes[i].x;
      p.homeY = homes[i].y;
      p.targetRadius = fullRadius;
      p.radius = i < INITIAL_COUNT ? fullRadius : 0;
      p.phase = phase;
      p.colorIdx = (i < INITIAL_COUNT && whiteSet.has(i)) ? 1.0 : 0.0;
      p.seed = seed;
    }

    activeCount = INITIAL_COUNT;
    sceneTime = 0;
    currentMaskBlend = 0;
  }

  /** Change text at runtime — re-samples positions, regenerates mask, restarts animation */
  function setText(newText: string): void {
    currentText = newText;

    // Regenerate mask texture
    currentMask.destroy();
    currentMask = createTextMaskTexture(device, currentText, fontSize);

    // Re-sample home positions
    const homes = sampleTextPositions(currentText, MAX_COUNT, fontSize);
    for (let i = 0; i < MAX_COUNT; i++) {
      particles[i].homeX = homes[i].x;
      particles[i].homeY = homes[i].y;
    }

    // Reset animation — particles scatter and re-converge to new text
    activeCount = INITIAL_COUNT;
    sceneTime = 0;
    currentMaskBlend = 0;
    for (let i = 0; i < MAX_COUNT; i++) {
      const p = particles[i];
      p.x = 0.1 + fract(simpleNoise(i * 7.13 + sceneTime + 1.0)) * 0.8;
      p.y = 0.1 + fract(simpleNoise(i * 11.31 + sceneTime + 2.0)) * 0.8;
      p.vx = 0; p.vy = 0;
      p.radius = i < INITIAL_COUNT ? p.targetRadius : 0;
    }

    writeBuffer(0, activeCount);
  }

  function writeBuffer(time: number, count: number): void {
    const breathFreq = 0.35;
    const breathAmp = 0.015;
    const intensity = audioBands?.intensity;
    const hasIntensity = intensity != null;
    const visibleCount = hasIntensity
      ? Math.max(1, Math.min(count, Math.ceil(count * clamp(0.3 + intensity * 0.7, 0.3, 1.0))))
      : count;
    renderCount = visibleCount;
    for (let i = 0; i < count; i++) {
      const p = particles[i];
      const breathe = 1.0 + Math.sin(time * breathFreq + p.phase * TWO_PI) * breathAmp;
      if (i < visibleCount) {
        writeParticle(data, i, p.x, p.y, p.radius * breathe, p.phase, p.colorIdx, p.vx, p.vy, 1.0);
      } else {
        writeParticle(data, i, HIDDEN_POS, HIDDEN_POS, p.radius * breathe, p.phase, p.colorIdx, p.vx, p.vy, 1.0);
      }
    }
    device.queue.writeBuffer(particleBuffer, 0, data.buffer, 0, count * 8 * 4);
  }

  function simulate(_absTime: number, dt: number): void {
    sceneTime += dt;

    const temperature = sceneTime < CONVERGE_DURATION
      ? 1.0 - smootherstep(sceneTime / CONVERGE_DURATION)
      : 0.0;
    const order = 1.0 - temperature;
    const sceneMix = attractor ? 1 - attractor.blend : 1;
    const attractMix = attractor ? attractor.blend : 0;

    // ── Audio-reactive modulation ────────────────────────────────
    const speedScale = audioBands ? 1 + audioBands.bass * 3 : 1;
    const thermalMul = audioBands ? 1 + audioBands.energy * 6 : 1;
    const springMul = audioBands ? 1 + audioBands.mid * 2 : 1;
    const textDrag = audioBands ? DRAG - audioBands.energy * 0.006 : DRAG;
    const textSpeedCap = audioBands ? MAX_SPEED * (1 + audioBands.energy * 2) : MAX_SPEED;

    if (sceneTime < FILL_FADE_START) {
      currentMaskBlend = 0;
    } else if (sceneTime < FILL_FADE_END) {
      currentMaskBlend = smootherstep((sceneTime - FILL_FADE_START) / (FILL_FADE_END - FILL_FADE_START));
    } else {
      currentMaskBlend = 1;
    }

    forceX.fill(0);
    forceY.fill(0);
    const frameStep = clamp(dt * 60.0, 0.5, 1.8);
    const repelScale = REPEL_STRENGTH * (0.3 + temperature * 0.7) * sceneMix;
    const repelRadiusSq = REPEL_RADIUS * REPEL_RADIUS;

    for (let i = 0; i < activeCount; i++) {
      const a = particles[i];
      for (let j = i + 1; j < activeCount; j++) {
        const b = particles[j];
        const dx = a.x - b.x; const dy = a.y - b.y;
        const distSq = dx * dx + dy * dy;
        if (distSq >= repelRadiusSq || distSq < 1e-8) continue;
        const dist = Math.sqrt(distSq);
        const proximity = 1.0 - dist / REPEL_RADIUS;
        const force = repelScale * proximity * proximity / distSq;
        const fx = (dx / dist) * force; const fy = (dy / dist) * force;
        forceX[i] += fx; forceY[i] += fy;
        forceX[j] -= fx; forceY[j] -= fy;
      }
    }

    for (let i = 0; i < activeCount; i++) {
      const p = particles[i];
      forceX[i] += (p.homeX - p.x) * SPRING_K * springMul * order * order * sceneMix;
      forceY[i] += (p.homeY - p.y) * SPRING_K * springMul * order * order * sceneMix;

      const jb = sceneTime * 0.35 + p.phase * 11.0 + p.seed * 37.0;
      const ja = fract(simpleNoise(jb) + simpleNoise(jb * 1.7 + 9.1) * 0.25) * TWO_PI;
      const js = THERMAL_STRENGTH * thermalMul * temperature * temperature *
        (0.4 + fract(simpleNoise(jb * 1.3 + 4.7) + 0.5) * 0.6) * sceneMix;
      forceX[i] += Math.cos(ja) * js;
      forceY[i] += Math.sin(ja) * js;

      if (p.x < BOUNDARY_MARGIN) forceX[i] += (BOUNDARY_MARGIN - p.x) * BOUNDARY_FORCE * sceneMix;
      else if (p.x > 1.0 - BOUNDARY_MARGIN) forceX[i] -= (p.x - (1.0 - BOUNDARY_MARGIN)) * BOUNDARY_FORCE * sceneMix;
      if (p.y < BOUNDARY_MARGIN) forceY[i] += (BOUNDARY_MARGIN - p.y) * BOUNDARY_FORCE * sceneMix;
      else if (p.y > 1.0 - BOUNDARY_MARGIN) forceY[i] -= (p.y - (1.0 - BOUNDARY_MARGIN)) * BOUNDARY_FORCE * sceneMix;

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

      p.vx = (p.vx + forceX[i] * frameStep) * textDrag;
      p.vy = (p.vy + forceY[i] * frameStep) * textDrag;

      if (audioBands?.bassOnset && audioBands.bassOnset > 0.3) {
        const bx = p.x - p.homeX;
        const by = p.y - p.homeY;
        const bd = Math.hypot(bx, by) || 0.01;
        const burst = audioBands.bassOnset * ONSET_BURST * sceneMix;
        p.vx += (bx / bd) * burst;
        p.vy += (by / bd) * burst;
      }

      const speedSq = p.vx * p.vx + p.vy * p.vy;
      if (speedSq > textSpeedCap * textSpeedCap) {
        const s = textSpeedCap / Math.sqrt(speedSq);
        p.vx *= s; p.vy *= s;
      }
      p.x += p.vx * speedScale * frameStep;
      p.y += p.vy * speedScale * frameStep;
    }

    if (postImportFrames > 0) {
      postImportFrames--;
    }

    writeBuffer(sceneTime, activeCount);
  }

  function exportState(): ParticleStateSnapshot {
    const positions = new Float32Array(activeCount * 2);
    const velocities = new Float32Array(activeCount * 2);
    const radii = new Float32Array(activeCount);
    for (let i = 0; i < activeCount; i++) {
      const p = particles[i];
      positions[i * 2] = p.x; positions[i * 2 + 1] = p.y;
      velocities[i * 2] = p.vx; velocities[i * 2 + 1] = p.vy;
      radii[i] = p.radius;
    }
    return { positions, velocities, radii, count: activeCount };
  }

  function importState(snapshot: ParticleStateSnapshot): void {
    const n = Math.max(1, Math.min(snapshot.count, MAX_COUNT));
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
        p.targetRadius = snapshot.radii[i];
      }
      cx += p.x;
      cy += p.y;
      avgRadius += p.radius;
      speedSum += Math.hypot(p.vx, p.vy);
    }

    cx = n > 0 ? cx / n : 0.5;
    cy = n > 0 ? cy / n : 0.5;
    avgRadius = n > 0 ? avgRadius / n : BASE_RADIUS;

    for (let i = n; i < MAX_COUNT; i++) {
      const p = particles[i];
      const angle = (i - n + 1) * 2.399963229728653;
      const ring = 0.01 + ((i - n) % 5) * 0.005;
      p.x = clamp(cx + Math.cos(angle) * ring, 0.08, 0.92);
      p.y = clamp(cy + Math.sin(angle) * ring, 0.08, 0.92);
      p.vx = Math.cos(angle) * 0.00005;
      p.vy = Math.sin(angle) * 0.00005;
      if (!(snapshot.radii[i] > 0)) {
        p.radius = avgRadius;
        p.targetRadius = avgRadius;
      }
    }

    const avgSpeed = speedSum / Math.max(n, 1);
    if (avgSpeed < 0.00025) {
      for (let i = 0; i < n; i++) {
        const p = particles[i];
        const dx = p.x - cx;
        const dy = p.y - cy;
        const dist = Math.hypot(dx, dy);
        const angle = dist > 0.001 ? Math.atan2(dy, dx) : p.phase * TWO_PI;
        const kick = IMPORT_KICK + (i % 7) * 0.00001;
        p.vx += Math.cos(angle) * kick;
        p.vy += Math.sin(angle) * kick;
      }
    }

    activeCount = n;
    sceneTime = 0;
    currentMaskBlend = 0;
    postImportCenterX = cx;
    postImportCenterY = cy;
    postImportFrames = POST_IMPORT_FRAMES;
    writeBuffer(0, activeCount);
  }

  // ── Init ──────────────────────────────────────────────────────
  initParticles();
  writeBuffer(0, activeCount);

  return {
    particleBuffer,
    get count() { return renderCount; },
    update(_enc, time, dt) { simulate(time, dt); },
    reset() {
      initParticles();
      postImportFrames = 0;
      attractor = null;
      writeBuffer(0, activeCount);
    },
    destroy() { particleBuffer.destroy(); currentMask.destroy(); },
    exportState,
    importState,
    get maskTexture() { return currentMask; },
    get maskBlend() { return currentMaskBlend; },
    setAttractor(config: AttractorConfig | null) {
      attractor = config;
    },
    setAudioReactive(bands: AudioReactiveBands | null) { audioBands = bands; },
    setText,
  };
}
