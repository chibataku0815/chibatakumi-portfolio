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

const TOTAL = 30;
const HELIX_COUNT = TOTAL / 2;
const CENTER_X = 0.5;
const CENTER_Y = 0.5;
const HELIX_RADIUS = 0.082;
const VERTICAL_SPAN = 0.60;
const TURNS = 3.0;
const ROTATION_SPEED = 0.08;
const BASE_RADIUS = 0.010;
const BREATHE_AMPLITUDE = 0.0018;
const MIDLINE_BOOST = 0.0028;
const WHITE_COUNT = 4;
const TWO_PI = Math.PI * 2;
const POST_IMPORT_FRAMES = 18;

interface HelixParticle extends ParticleStateLike {
  helixIndex: 0 | 1;
  t: number;
}

export function createHelixParticles(device: GPUDevice): MetaballParticleSource {
  let audioBands: AudioReactiveBands | null = null;

  function computeHelixPose(particle: HelixParticle, time: number): { x: number; y: number; radius: number } {
    const twistMul = audioBands ? 1 + audioBands.bass * 3 : 1;
    const breatheMul = audioBands ? 1 + audioBands.energy * 4 : 1;
    const radiusMul = audioBands ? 1 + audioBands.mid * 1.5 : 1;
    const rotation = time * ROTATION_SPEED * twistMul;
    const stripe = particle.t * TURNS * TWO_PI + rotation + particle.helixIndex * Math.PI;
    const envelope = smootherstep(1 - Math.abs(particle.t - 0.5) * 2);
    const breathe = Math.sin(time * 0.85 + particle.t * 4.5 + particle.helixIndex * 1.7) * BREATHE_AMPLITUDE * breatheMul;
    // Beat onset helix expansion (radius + particle size)
    const onsetExpand = audioBands?.bassOnset && audioBands.bassOnset > 0.3
      ? audioBands.bassOnset * 0.03 : 0;
    return {
      x: CENTER_X + Math.cos(stripe) * (HELIX_RADIUS * radiusMul + onsetExpand),
      y: CENTER_Y + (particle.t - 0.5) * VERTICAL_SPAN + Math.sin(time * 0.32 + particle.t * 6.0) * 0.008,
      radius: BASE_RADIUS + breathe + envelope * MIDLINE_BOOST + onsetExpand * 0.3,
    };
  }
  const particleBuffer = createParticleStorageBuffer(device, "helix-particles", TOTAL);
  const data = createParticleArray(TOTAL);
  const particles: HelixParticle[] = [];

  for (let strand = 0; strand < 2; strand++) {
    for (let i = 0; i < HELIX_COUNT; i++) {
      const t = HELIX_COUNT === 1 ? 0 : i / (HELIX_COUNT - 1);
      const phase = t + strand * 0.5;
      const pose = computeHelixPose({ x: CENTER_X, y: CENTER_Y, vx: 0, vy: 0, radius: BASE_RADIUS, phase, colorIdx: strand === 1 && i < WHITE_COUNT ? 1.0 : 0.0, helixIndex: strand as 0 | 1, t }, 0);
      particles.push({
        x: pose.x,
        y: pose.y,
        vx: 0,
        vy: 0,
        radius: pose.radius,
        phase,
        colorIdx: strand === 1 && i < WHITE_COUNT ? 1.0 : 0.0,
        helixIndex: strand as 0 | 1,
        t,
      });
    }
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
      const pose = computeHelixPose(particle, time);
      particle.x = pose.x;
      particle.y = pose.y;
      particle.radius = pose.radius;
      particle.vx = 0;
      particle.vy = 0;
    }
    flushBuffer();
  }

  let attractor: AttractorConfig | null = null;
  let postImportFrames = 0;

  function updateTransition(time: number, dt: number): void {
    const step = clamp(dt * 60, 0.75, 1.5);
    const attractMix = attractor ? clamp(attractor.blend, 0, 1) : 0;
    const recoverMix = postImportFrames > 0 ? smootherstep(1 - postImportFrames / POST_IMPORT_FRAMES) : 0;
    const spring = attractor ? 0.0011 + attractMix * 0.0011 : 0.0007 + recoverMix * 0.0027;
    const drag = attractor ? 0.968 : 0.942 + recoverMix * 0.03;
    const radiusFollow = attractor ? 0.01 : 0.03 + recoverMix * 0.03;

    for (let i = 0; i < TOTAL; i++) {
      const particle = particles[i];
      const pose = computeHelixPose(particle, time);
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
