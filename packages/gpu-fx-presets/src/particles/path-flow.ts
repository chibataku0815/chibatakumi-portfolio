import type { AttractorConfig, AudioReactiveBands, MetaballParticleSource, ParticleStateSnapshot } from "../metaball-types";
import {
  type CubicPathDef,
  createParticleArray,
  createParticleStorageBuffer,
  clamp,
  importSnapshotIntoParticles,
  evalPath,
  pathCurvature,
  pathTangent,
  simpleNoise,
  smootherstep,
  snapshotFromParticles,
  type ParticleStateLike,
  writeParticle,
} from "./helpers";
import { parseSvgPath } from "./svg-parser";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PathSegment {
  path: CubicPathDef;
  /** Indices into segments[] that this segment can transition to when t >= 1.0 */
  next: number[];
  /** How to choose among multiple next segments. Default: 'lateral' */
  routing?: "lateral" | "random" | "round-robin";
  /** Speed multiplier on this segment. Default: 1.0 */
  speedScale?: number;
  /** Lateral spread multiplier. Default: 1.0 */
  lateralScale?: number;
  /** Radius multiplier. Default: 1.0 */
  radiusScale?: number;
}

export interface PathFlowConfig {
  segments: PathSegment[];
  particleCount?: number;
  baseSpeed?: number;
  baseRadius?: number;
  largeRadius?: number;
  lateralSpread?: number;
  whiteRatio?: number;
  /** Size distribution [small%, mid%, large%]. Default: [0.65, 0.25, 0.10] */
  sizeDistribution?: [number, number, number];
}

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

const POST_IMPORT_FRAMES = 18;
const ONSET_BURST = 0.008;

interface FlowDot extends ParticleStateLike {
  t: number;
  segmentIdx: number;
  baseSpeed: number;
  lateralOffset: number;
  origSpeed: number;
  origLateral: number;
  origRadius: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** True when all scale factors on a segment are effectively 1.0 */
function isDefaultScales(seg: PathSegment): boolean {
  return (
    (seg.speedScale ?? 1.0) === 1.0 &&
    (seg.lateralScale ?? 1.0) === 1.0 &&
    (seg.radiusScale ?? 1.0) === 1.0
  );
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createPathFlowParticles(
  device: GPUDevice,
  config: PathFlowConfig,
): MetaballParticleSource {
  const {
    segments,
    particleCount = 50,
    baseSpeed = 0.025,
    baseRadius = 0.005,
    largeRadius = 0.015,
    lateralSpread = 0.035,
    whiteRatio = 0.12,
    sizeDistribution = [0.65, 0.25, 0.10],
  } = config;

  const particleBuffer = createParticleStorageBuffer(device, "path-flow-particles", particleCount);
  const data = createParticleArray(particleCount);
  const dots: FlowDot[] = [];

  // Round-robin counters per segment
  const rrCounters = new Uint32Array(segments.length);

  // --- Particle init ---
  const [smallPct, midPct] = sizeDistribution;

  for (let i = 0; i < particleCount; i++) {
    const sizeRoll = Math.random();
    let radius: number;
    if (sizeRoll < smallPct) {
      radius = baseRadius * (0.7 + Math.random() * 0.6);
    } else if (sizeRoll < smallPct + midPct) {
      radius = baseRadius + (largeRadius - baseRadius) * 0.5 * (0.8 + Math.random() * 0.4);
    } else {
      radius = largeRadius * (0.8 + Math.random() * 0.4);
    }

    const speed = baseSpeed * (0.7 + Math.random() * 0.6);
    const lateral = (Math.random() - 0.5) * 2 * lateralSpread;

    dots.push({
      t: i / particleCount,
      segmentIdx: 0,
      baseSpeed: speed,
      lateralOffset: lateral,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius,
      phase: Math.random(),
      colorIdx: i < particleCount * whiteRatio ? 1.0 : 0.0,
      origSpeed: speed,
      origLateral: lateral,
      origRadius: radius,
    });
  }

  // --- Choose next segment ---
  function chooseNext(seg: PathSegment, dot: FlowDot, segIdx: number): number {
    const nexts = seg.next;

    // Self-loop fallback when no next segments defined
    if (nexts.length === 0) return segIdx;
    if (nexts.length === 1) return nexts[0];

    const routing = seg.routing ?? "lateral";

    if (routing === "random") {
      return nexts[Math.floor(Math.random() * nexts.length)];
    }

    if (routing === "round-robin") {
      const idx = rrCounters[segIdx] % nexts.length;
      rrCounters[segIdx]++;
      return nexts[idx];
    }

    // 'lateral' — default
    return dot.lateralOffset < 0 ? nexts[0] : nexts[nexts.length - 1];
  }

  let attractor: AttractorConfig | null = null;
  let audioBands: AudioReactiveBands | null = null;
  let postImportFrames = 0;

  function getVisibleCount(): number {
    const intensity = audioBands?.intensity;
    if (typeof intensity !== "number" || !Number.isFinite(intensity)) {
      return particleCount;
    }
    const visScale = 0.3 + intensity * 0.7;
    return Math.max(1, Math.min(particleCount, Math.ceil(particleCount * visScale)));
  }

  function writeCurrentFrame(): void {
    const visibleCount = getVisibleCount();
    for (let i = 0; i < particleCount; i++) {
      const dot = dots[i];
      const displayRadius = i < visibleCount ? dot.radius : 0.001;
      writeParticle(data, i, dot.x, dot.y, displayRadius, dot.phase, dot.colorIdx, dot.vx, dot.vy);
    }
    device.queue.writeBuffer(particleBuffer, 0, data);
  }

  // --- Update ---
  function updatePositions(time: number, dt: number): void {
    const attractMixGlobal = attractor ? clamp(attractor.blend, 0, 1) : 0;
    const sceneMix = 1 - attractMixGlobal;
    const speedScale = audioBands ? 1 + audioBands.bass * 3 * sceneMix : 1;
    const turbulenceMul = audioBands ? 1 + audioBands.energy * 4 * sceneMix : 1;
    const lateralMul = audioBands ? 1 + audioBands.mid * 2 * sceneMix : 1;

    for (let i = 0; i < particleCount; i++) {
      const dot = dots[i];
      const seg = segments[dot.segmentIdx];

      // 1. Speed calculation
      const curvatureBoost = 1.0 + pathCurvature(seg.path, dot.t) * 3.0 * turbulenceMul;
      const noisePulse = 0.6 + simpleNoise(dot.t * 5 + time * 0.2 + dot.phase * 10) * 0.8 * turbulenceMul;
      const segSpeedScale = seg.speedScale ?? 1.0;
      const speed = dot.baseSpeed * curvatureBoost * noisePulse * segSpeedScale * speedScale;

      // Beat onset: burst speed multiplier
      let flowSpeed = speed;
      if (audioBands?.bassOnset && audioBands.bassOnset > 0.3) {
        flowSpeed *= 1 + audioBands.bassOnset * 3;
      }

      // 2. Advance
      dot.t += flowSpeed * dt;

      // 3. Segment transition
      if (dot.t >= 1.0) {
        const overflow = dot.t - 1.0;
        const nextIdx = chooseNext(seg, dot, dot.segmentIdx);
        const nextSeg = segments[nextIdx];

        if (!isDefaultScales(nextSeg)) {
          // Entering a scaled segment — apply modifiers
          dot.lateralOffset = dot.origLateral * (nextSeg.lateralScale ?? 1.0);
          dot.baseSpeed = dot.origSpeed * (nextSeg.speedScale ?? 1.0);
          dot.radius = dot.origRadius * (nextSeg.radiusScale ?? 1.0);
        } else {
          // Returning to default scales — restore originals
          dot.baseSpeed = dot.origSpeed;
          dot.lateralOffset = dot.origLateral;
          dot.radius = dot.origRadius;
        }

        dot.segmentIdx = nextIdx;
        dot.t = Math.min(overflow, 0.999);
      }

      // 4. Position calculation
      const currentSeg = segments[dot.segmentIdx];
      const clampedT = Math.min(dot.t, 0.999);
      const [px, py] = evalPath(currentSeg.path, clampedT);
      const [tx, ty] = pathTangent(currentSeg.path, clampedT);
      const nx = -ty;
      const ny = tx;
      // lateralScale is already applied to dot.lateralOffset during transition
      const lateral =
        (dot.lateralOffset +
        Math.sin(time * 0.2 + dot.phase * 6.28) * 0.004) * lateralMul;
      const poseX = px + nx * lateral;
      const poseY = py + ny * lateral;

      if (!attractor && postImportFrames === 0) {
        dot.x = poseX;
        dot.y = poseY;
        dot.vx = 0;
        dot.vy = 0;
      } else {
        const attractMix = attractor ? clamp(attractor.blend, 0, 1) : 0;
        const recoverMix = postImportFrames > 0 ? smootherstep(1 - postImportFrames / POST_IMPORT_FRAMES) : 0;
        const spring = attractor ? 0.00135 + attractMix * 0.0012 : 0.0008 + recoverMix * 0.0032;
        const drag = attractor ? 0.972 : 0.94 + recoverMix * 0.03;
        const destX = attractor ? poseX * (1 - attractMix) + attractor.x * attractMix : poseX;
        const destY = attractor ? poseY * (1 - attractMix) + attractor.y * attractMix : poseY;

        dot.vx = (dot.vx + (destX - dot.x) * spring * clamp(dt * 60, 0.75, 1.5)) * drag;
        dot.vy = (dot.vy + (destY - dot.y) * spring * clamp(dt * 60, 0.75, 1.5)) * drag;
        dot.x = clamp(dot.x + dot.vx * clamp(dt * 60, 0.75, 1.5), 0.02, 0.98);
        dot.y = clamp(dot.y + dot.vy * clamp(dt * 60, 0.75, 1.5), 0.02, 0.98);
      }
    }

    if (postImportFrames > 0) {
      postImportFrames--;
    }

    writeCurrentFrame();
  }

  function resetDots(): void {
    for (let i = 0; i < particleCount; i++) {
      dots[i].t = i / particleCount;
      dots[i].segmentIdx = 0;
      dots[i].baseSpeed = dots[i].origSpeed;
      dots[i].lateralOffset = dots[i].origLateral;
      dots[i].radius = dots[i].origRadius;
      dots[i].vx = 0;
      dots[i].vy = 0;
      dots[i].x = 0;
      dots[i].y = 0;
    }
  }

  resetDots();
  updatePositions(0, 0);

  return {
    particleBuffer,
    get count() {
      return particleCount;
    },
    update(_encoder, time, dt) {
      updatePositions(time, dt);
    },
    reset() {
      attractor = null;
      postImportFrames = 0;
      resetDots();
      updatePositions(0, 0);
    },
    destroy() {
      particleBuffer.destroy();
    },
    exportState() {
      return snapshotFromParticles(dots);
    },
    importState(snapshot: ParticleStateSnapshot) {
      importSnapshotIntoParticles(dots, snapshot, { maxSpeed: 0.0032 });
      postImportFrames = POST_IMPORT_FRAMES;
      writeCurrentFrame();
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

// ---------------------------------------------------------------------------
// SVG convenience
// ---------------------------------------------------------------------------

export function createSvgFlowParticles(
  device: GPUDevice,
  svgPathD: string,
  options?: Partial<PathFlowConfig> & { viewBox?: { width: number; height: number } },
): MetaballParticleSource {
  const paths = parseSvgPath(svgPathD, options?.viewBox);
  const segments: PathSegment[] = paths.map((path, i) => ({
    path,
    next: [i + 1 < paths.length ? i + 1 : 0],
  }));
  return createPathFlowParticles(device, { ...options, segments });
}
