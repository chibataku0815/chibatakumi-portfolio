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

const TOTAL = 28;
const POST_IMPORT_FRAMES = 18;
const BASE_CENTER_X = 0.5;
const BASE_CENTER_Y = 0.5;
const ONSET_BURST = 0.003;

interface OrbitParticle extends ParticleStateLike {
  orbitGroup: 0 | 1 | 2 | 3;
  orbitRadius: number;
  orbitSpeed: number;
  angleBase: number;
  wobbleX: number;
  wobbleY: number;
  radiusBase: number;
  radiusAmp: number;
}

function createOrbitParticle(index: number): OrbitParticle {
  if (index < 5) {
    const i = index;
    return {
      x: BASE_CENTER_X,
      y: BASE_CENTER_Y,
      vx: 0,
      vy: 0,
      radius: 0.025,
      phase: i / 5,
      colorIdx: 0,
      orbitGroup: 0,
      orbitRadius: 0.08,
      orbitSpeed: 0.3,
      angleBase: (i / 5) * Math.PI * 2,
      wobbleX: 0,
      wobbleY: 0,
      radiusBase: 0.025,
      radiusAmp: 0.008,
    };
  }

  if (index < 13) {
    const i = index - 5;
    return {
      x: BASE_CENTER_X,
      y: BASE_CENTER_Y,
      vx: 0,
      vy: 0,
      radius: 0.012,
      phase: i / 8,
      colorIdx: 0,
      orbitGroup: 1,
      orbitRadius: 0.17,
      orbitSpeed: -0.2,
      angleBase: (i / 8) * Math.PI * 2,
      wobbleX: Math.sin(i) * 0.02,
      wobbleY: Math.cos(i) * 0.017,
      radiusBase: 0.012,
      radiusAmp: 0.004,
    };
  }

  if (index < 16) {
    const i = index - 13;
    return {
      x: BASE_CENTER_X,
      y: BASE_CENTER_Y,
      vx: 0,
      vy: 0,
      radius: 0.015,
      phase: i / 3,
      colorIdx: 1,
      orbitGroup: 2,
      orbitRadius: 0.12,
      orbitSpeed: 0.5,
      angleBase: (i / 3) * Math.PI * 2,
      wobbleX: 0,
      wobbleY: 0,
      radiusBase: 0.015,
      radiusAmp: 0.005,
    };
  }

  const i = index - 16;
  return {
    x: BASE_CENTER_X,
    y: BASE_CENTER_Y,
    vx: 0,
    vy: 0,
    radius: 0.004,
    phase: i / 12,
    colorIdx: 0,
    orbitGroup: 3,
    orbitRadius: 0.24,
    orbitSpeed: 0.08,
    angleBase: (i / 12) * Math.PI * 2,
    wobbleX: 0,
    wobbleY: 0,
    radiusBase: 0.004,
    radiusAmp: 0.002,
  };
}

function computeOrbitPose(particle: OrbitParticle, time: number): { x: number; y: number; radius: number } {
  if (particle.orbitGroup === 0) {
    const angle = particle.angleBase + time * particle.orbitSpeed;
    return {
      x: BASE_CENTER_X + Math.cos(angle) * particle.orbitRadius,
      y: BASE_CENTER_Y + Math.sin(angle) * particle.orbitRadius,
      radius: particle.radiusBase + Math.sin(time * 0.8 + particle.angleBase * 1.5) * particle.radiusAmp,
    };
  }

  if (particle.orbitGroup === 1) {
    const angle = particle.angleBase + time * particle.orbitSpeed;
    return {
      x: BASE_CENTER_X + Math.cos(angle) * particle.orbitRadius + Math.sin(time * 0.5 + particle.angleBase) * particle.wobbleX,
      y: BASE_CENTER_Y + Math.sin(angle) * particle.orbitRadius + Math.cos(time * 0.7 + particle.angleBase) * particle.wobbleY,
      radius: particle.radiusBase + Math.sin(time * 1.2 + particle.angleBase * 0.9) * particle.radiusAmp,
    };
  }

  if (particle.orbitGroup === 2) {
    const angle = particle.angleBase + time * particle.orbitSpeed;
    return {
      x: BASE_CENTER_X + Math.cos(angle) * particle.orbitRadius,
      y: BASE_CENTER_Y + Math.sin(angle) * particle.orbitRadius,
      radius: particle.radiusBase + Math.sin(time + particle.angleBase * 2) * particle.radiusAmp,
    };
  }

  const angle = particle.angleBase + time * particle.orbitSpeed;
  return {
    x: BASE_CENTER_X + Math.cos(angle) * (particle.orbitRadius + Math.sin(time * 0.15 + particle.angleBase * 0.5) * 0.055),
    y: BASE_CENTER_Y + Math.sin(angle) * (particle.orbitRadius + Math.sin(time * 0.15 + particle.angleBase * 0.5) * 0.055),
    radius: particle.radiusBase + Math.sin(time * 0.4 + particle.angleBase * 1.3) * particle.radiusAmp,
  };
}

export function createOrbitParticles(device: GPUDevice): MetaballParticleSource {
  const particleBuffer = createParticleStorageBuffer(device, "orbit-particles", TOTAL);
  const data = createParticleArray(TOTAL);
  const particles: OrbitParticle[] = Array.from({ length: TOTAL }, (_, index) => createOrbitParticle(index));

  let attractor: AttractorConfig | null = null;
  let audioBands: AudioReactiveBands | null = null;
  let postImportFrames = 0;

  function getVisibleCount(): number {
    const intensity = audioBands?.intensity;
    if (typeof intensity !== "number" || !Number.isFinite(intensity)) {
      return TOTAL;
    }
    const visScale = 0.3 + intensity * 0.7;
    return Math.max(1, Math.min(TOTAL, Math.ceil(TOTAL * visScale)));
  }

  function flushBuffer(): void {
    const visibleCount = getVisibleCount();
    for (let i = 0; i < TOTAL; i++) {
      const particle = particles[i];
      const displayRadius = i < visibleCount ? particle.radius : 0.001;
      writeParticle(data, i, particle.x, particle.y, displayRadius, particle.phase, particle.colorIdx, particle.vx, particle.vy);
    }
    device.queue.writeBuffer(particleBuffer, 0, data);
  }

  function syncToTarget(time: number): void {
    for (let i = 0; i < TOTAL; i++) {
      const particle = particles[i];
      const pose = computeOrbitPose(particle, time);
      particle.x = pose.x;
      particle.y = pose.y;
      particle.radius = pose.radius;
      particle.vx = 0;
      particle.vy = 0;
    }
    flushBuffer();
  }

  function updateTransition(time: number, dt: number): void {
    const step = clamp(dt * 60, 0.75, 1.5);
    const attractMix = attractor ? clamp(attractor.blend, 0, 1) : 0;
    const recoverMix = postImportFrames > 0 ? smootherstep(1 - postImportFrames / POST_IMPORT_FRAMES) : 0;
    const targetSpring = attractor ? 0.00125 + attractMix * 0.0012 : 0.00075 + recoverMix * 0.0035;
    const radiusSpring = attractor ? 0.02 : 0.025 + recoverMix * 0.03;
    const drag = attractor ? 0.972 : 0.944 + recoverMix * 0.03;
    const swirl = attractor ? 0.00003 * attractMix : 0;

    const sceneMix = attractor ? 1 - clamp(attractor.blend, 0, 1) : 1;
    const speedScale = audioBands ? 1 + audioBands.bass * 3 * sceneMix : 1;
    const orbitSpeedMul = audioBands ? 1 + audioBands.energy * 2 * sceneMix : 1;
    const wobbleMul = audioBands ? 1 + audioBands.mid * 4 * sceneMix : 1;

    for (let i = 0; i < TOTAL; i++) {
      const particle = particles[i];
      const pose = computeOrbitPose(particle, time * orbitSpeedMul);
      // Apply wobble amplification to pose offsets from center
      if (audioBands && sceneMix > 0) {
        pose.x = BASE_CENTER_X + (pose.x - BASE_CENTER_X) * wobbleMul;
        pose.y = BASE_CENTER_Y + (pose.y - BASE_CENTER_Y) * wobbleMul;
      }
      const destX = attractor ? pose.x * (1 - attractMix) + attractor.x * attractMix : pose.x;
      const destY = attractor ? pose.y * (1 - attractMix) + attractor.y * attractMix : pose.y;
      const dx = destX - particle.x;
      const dy = destY - particle.y;
      const crossX = -dy * swirl;
      const crossY = dx * swirl;

      particle.vx = (particle.vx + (dx * targetSpring + crossX) * step) * drag;
      particle.vy = (particle.vy + (dy * targetSpring + crossY) * step) * drag;

      // Beat onset: radial kick outward from orbit center
      if (audioBands?.bassOnset && audioBands.bassOnset > 0.3) {
        const rdx = particle.x - BASE_CENTER_X;
        const rdy = particle.y - BASE_CENTER_Y;
        const dist = Math.hypot(rdx, rdy) || 0.01;
        const burst = audioBands.bassOnset * ONSET_BURST * sceneMix;
        particle.vx += (rdx / dist) * burst;
        particle.vy += (rdy / dist) * burst;
      }

      const speed = Math.hypot(particle.vx, particle.vy);
      const maxSpeed = (attractor ? 0.0026 : 0.0022 + recoverMix * 0.0004) * speedScale;
      if (speed > maxSpeed) {
        const scale = maxSpeed / (speed || 1);
        particle.vx *= scale;
        particle.vy *= scale;
      }

      particle.x = clamp(particle.x + particle.vx * step * speedScale, 0.03, 0.97);
      particle.y = clamp(particle.y + particle.vy * step * speedScale, 0.03, 0.97);
      particle.radius += (pose.radius - particle.radius) * radiusSpring;
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
      importSnapshotIntoParticles(particles, snapshot, { maxSpeed: 0.0032 });
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
