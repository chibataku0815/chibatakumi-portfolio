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

const COUNT = 17;
const CENTER_Y = 0.5;
const AMPLITUDE = 0.15;
const MARGIN_X = 0.15;
const BASE_RADIUS = 0.012;
const RADIUS_MOD = 0.004;
const REALIGN_PERIOD = 60.0;
const BASE_CYCLES = 51;
const WHITE_A = 5;
const WHITE_B = 11;
const TWO_PI = Math.PI * 2;
const POST_IMPORT_FRAMES = 18;

interface PendulumParticle extends ParticleStateLike {
  xBase: number;
  period: number;
}

export function createPendulumParticles(device: GPUDevice): MetaballParticleSource {
  const particleBuffer = createParticleStorageBuffer(device, "pendulum-particles", COUNT);
  const data = createParticleArray(COUNT);
  const particles: PendulumParticle[] = [];

  const spanX = 1.0 - 2.0 * MARGIN_X;
  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: MARGIN_X + (i / (COUNT - 1)) * spanX,
      y: CENTER_Y,
      vx: 0,
      vy: 0,
      radius: BASE_RADIUS,
      phase: i / COUNT,
      colorIdx: i === WHITE_A || i === WHITE_B ? 1.0 : 0.0,
      xBase: MARGIN_X + (i / (COUNT - 1)) * spanX,
      period: REALIGN_PERIOD / (BASE_CYCLES + i),
    });
  }

  function computePose(time: number, index: number): { x: number; y: number; radius: number } {
    const particle = particles[index];
    const speedMul = audioBands ? 1 + audioBands.energy * 2 : 1;
    const ampMul = audioBands ? 1 + audioBands.bass * 3 : 1;
    const radiusBreatheMul = audioBands ? 1 + audioBands.energy * 2 : 1;
    const phase = TWO_PI * time * speedMul / particle.period;
    const sinValue = Math.sin(phase);
    // Beat onset y-impulse (visible even in syncToTarget mode)
    const onsetKick = audioBands?.bassOnset && audioBands.bassOnset > 0.3
      ? audioBands.bassOnset * 0.08 : 0;
    return {
      x: particle.xBase,
      y: CENTER_Y + AMPLITUDE * ampMul * sinValue + onsetKick,
      radius: BASE_RADIUS + RADIUS_MOD * radiusBreatheMul * Math.abs(sinValue),
    };
  }

  function flushBuffer(): void {
    const intensity = audioBands?.intensity;
    const total = particles.length;
    const visibleCount = intensity == null
      ? total
      : Math.max(1, Math.ceil(total * (0.3 + intensity * 0.7)));
    for (let i = 0; i < COUNT; i++) {
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
    for (let i = 0; i < COUNT; i++) {
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
    const drag = attractor ? 0.968 : 0.942 + recoverMix * 0.03;
    const radiusFollow = attractor ? 0.01 : 0.03 + recoverMix * 0.03;

    for (let i = 0; i < COUNT; i++) {
      const particle = particles[i];
      const pose = computePose(time, i);
      const destX = attractor ? pose.x * (1 - attractMix) + attractor.x * attractMix : pose.x;
      const destY = attractor ? pose.y * (1 - attractMix) + attractor.y * attractMix : pose.y;
      const dx = destX - particle.x;
      const dy = destY - particle.y;

      particle.vx = (particle.vx + dx * spring * step) * drag;
      particle.vy = (particle.vy + dy * spring * step) * drag;
      particle.x = clamp(particle.x + particle.vx * step, 0.05, 0.95);
      particle.y = clamp(particle.y + particle.vy * step, 0.07, 0.93);
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
      return COUNT;
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
      importSnapshotIntoParticles(particles, snapshot, { maxSpeed: 0.003 });
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
