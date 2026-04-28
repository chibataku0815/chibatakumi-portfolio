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

const RINGS = [
  { r: 0.12, count: 8 },
  { r: 0.22, count: 14 },
  { r: 0.32, count: 20 },
] as const;

const TOTAL = RINGS.reduce((sum, ring) => sum + ring.count, 0);
const CENTER_X = 0.5;
const CENTER_Y = 0.5;
const SECONDARY_X = 0.65;
const SECONDARY_Y = 0.60;
const BASE_RADIUS = 0.005;
const SWELL_AMPLITUDE = 0.020;
const WAVELENGTH = 0.18;
const WAVE_FREQ = 0.12;
const DECAY_FACTOR = 1.5;
const WHITE_RATIO = 0.10;
const TWO_PI = Math.PI * 2;
const POST_IMPORT_FRAMES = 18;

interface RippleParticle extends ParticleStateLike {
  baseX: number;
  baseY: number;
}

export function createRippleParticles(device: GPUDevice): MetaballParticleSource {
  const particleBuffer = createParticleStorageBuffer(device, "ripple-particles", TOTAL);
  const data = createParticleArray(TOTAL);
  const particles: RippleParticle[] = [];

  let idx = 0;
  for (const ring of RINGS) {
    for (let i = 0; i < ring.count; i++) {
      const angle = (i / ring.count) * TWO_PI;
      const x = CENTER_X + Math.cos(angle) * ring.r;
      const y = CENTER_Y + Math.sin(angle) * ring.r;
      particles.push({
        x,
        y,
        vx: 0,
        vy: 0,
        radius: BASE_RADIUS,
        phase: idx / TOTAL,
        colorIdx: idx < TOTAL * WHITE_RATIO ? 1.0 : 0.0,
        baseX: x,
        baseY: y,
      });
      idx++;
    }
  }

  function waveAt(dotX: number, dotY: number, srcX: number, srcY: number, time: number): number {
    const dx = dotX - srcX;
    const dy = dotY - srcY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const decay = Math.exp(-dist * DECAY_FACTOR);
    const waveMul = audioBands ? 1 + audioBands.bass * 3 : 1;
    const freqMul = audioBands ? 1 + audioBands.energy * 2 : 1;
    return SWELL_AMPLITUDE * waveMul * Math.sin(TWO_PI * (dist / WAVELENGTH - time * WAVE_FREQ * freqMul)) * decay;
  }

  function computePose(time: number, index: number): { x: number; y: number; radius: number } {
    const particle = particles[index];
    const wave1 = waveAt(particle.baseX, particle.baseY, CENTER_X, CENTER_Y, time);
    const wave2 = waveAt(particle.baseX, particle.baseY, SECONDARY_X, SECONDARY_Y, time);
    // Beat onset radius pulse (all rings swell simultaneously)
    const onsetPulse = audioBands?.bassOnset && audioBands.bassOnset > 0.3
      ? audioBands.bassOnset * 0.015 : 0;
    return {
      x: particle.baseX,
      y: particle.baseY,
      radius: Math.max(BASE_RADIUS * 0.3, BASE_RADIUS + wave1 + wave2 + onsetPulse),
    };
  }

  function flushBuffer(): void {
    const intensity = audioBands?.intensity;
    const total = particles.length;
    const visibleCount = intensity == null
      ? total
      : Math.max(1, Math.ceil(total * (0.3 + intensity * 0.7)));
    for (let i = 0; i < TOTAL; i++) {
      const particle = particles[i];
      writeParticle(
        data,
        i,
        particle.x,
        particle.y,
        i < visibleCount ? particle.radius : 0.001,
        particle.phase,
        particle.colorIdx,
        particle.vx,
        particle.vy,
      );
    }
    device.queue.writeBuffer(particleBuffer, 0, data);
  }

  function syncToTarget(time: number): void {
    for (let i = 0; i < TOTAL; i++) {
      const particle = particles[i];
      const pose = computePose(time, i);
      particle.x = pose.x;
      particle.y = pose.y;
      particle.radius = pose.radius;
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
    const spring = attractor ? 0.0011 + attractMix * 0.0011 : 0.0007 + recoverMix * 0.0027;
    const drag = attractor ? 0.970 : 0.944 + recoverMix * 0.03;
    const radiusFollow = attractor ? 0.01 : 0.03 + recoverMix * 0.03;

    for (let i = 0; i < TOTAL; i++) {
      const particle = particles[i];
      const pose = computePose(time, i);
      const destX = attractor ? pose.x * (1 - attractMix) + attractor.x * attractMix : pose.x;
      const destY = attractor ? pose.y * (1 - attractMix) + attractor.y * attractMix : pose.y;
      const dx = destX - particle.x;
      const dy = destY - particle.y;

      particle.vx = (particle.vx + dx * spring * step) * drag;
      particle.vy = (particle.vy + dy * spring * step) * drag;
      particle.x = clamp(particle.x + particle.vx * step, 0.03, 0.97);
      particle.y = clamp(particle.y + particle.vy * step, 0.03, 0.97);
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
      return TOTAL;
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
    setAudioReactive(bands: AudioReactiveBands | null) {
      audioBands = bands;
    },
    setAttractor(config: AttractorConfig | null) {
      const hadAttractor = attractor !== null;
      attractor = config;
      if (!config && hadAttractor) {
        postImportFrames = Math.max(postImportFrames, POST_IMPORT_FRAMES);
      }
    },
  };
}
