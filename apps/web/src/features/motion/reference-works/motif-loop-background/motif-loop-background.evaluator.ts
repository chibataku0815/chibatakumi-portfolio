import { motifLoopBackgroundConfig } from "./motif-loop-background.config";

type MotifVariant = "ring" | "capsule" | "orbit";

export type MotifLayoutState = {
  index: number;
  variant: MotifVariant;
  baseX: number;
  baseY: number;
  baseScale: number;
  rotationBias: number;
  phaseOffset: number;
  depth: number;
  tint: number;
};

export type MotifFrameState = MotifLayoutState & {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  alpha: number;
  glowAlpha: number;
  blurStrength: number;
  accentAlpha: number;
};

export type MotifLoopBackgroundFrameState = {
  frame: number;
  phase: number;
  washAlpha: number;
  fieldDriftX: number;
  fieldDriftY: number;
  plateShadowAlpha: number;
  motifs: MotifFrameState[];
};

const motifVariants: MotifVariant[] = ["ring", "capsule", "orbit"];
const motifPalette = [0xf6d59b, 0xf2a65a, 0xd17445, 0xe9c48f] as const;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function mix(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function wrapPhase(frame: number) {
  const frameCount = motifLoopBackgroundConfig.durationFrames;

  return ((frame % frameCount) + frameCount) % frameCount;
}

/**
 * 背景 motif の基準配置だけを返す。
 * Work 05 の局所 helper であり、他 work に昇格させない。
 */
export function motifLayout(index: number): MotifLayoutState {
  const { columns, rows, outerMarginX, outerMarginY, jitterX, jitterY } =
    motifLoopBackgroundConfig.layout;
  const column = index % columns;
  const row = Math.floor(index / columns) % rows;
  const columnProgress = columns <= 1 ? 0.5 : column / (columns - 1);
  const rowProgress = rows <= 1 ? 0.5 : row / (rows - 1);
  const baseX = mix(
    outerMarginX,
    motifLoopBackgroundConfig.size.width - outerMarginX,
    columnProgress,
  );
  const baseY = mix(
    outerMarginY,
    motifLoopBackgroundConfig.size.height - outerMarginY,
    rowProgress,
  );
  const horizontalJitter = ((index % 2) - 0.5) * jitterX;
  const verticalJitter = ((Math.floor(index / 2) % 2) - 0.5) * jitterY;

  return {
    index,
    variant: motifVariants[index % motifVariants.length],
    baseX: baseX + horizontalJitter,
    baseY: baseY + verticalJitter,
    baseScale: mix(0.74, 1.08, ((index * 37) % 100) / 100),
    rotationBias: ((index % 5) - 2) * 0.06,
    phaseOffset: index * 0.63,
    depth: mix(0.58, 1, ((index * 29) % 100) / 100),
    tint: motifPalette[index % motifPalette.length],
  };
}

/**
 * 1 motif の looping motion を局所評価する。
 * 位相差と低振幅 drift だけを持たせ、主役化しない。
 */
export function motifLoopMotion(layout: MotifLayoutState, frame: number) {
  const normalizedFrame = wrapPhase(frame);
  const phase =
    (normalizedFrame / motifLoopBackgroundConfig.durationFrames) *
      Math.PI *
      2 +
    layout.phaseOffset;
  const secondaryPhase = phase * 0.55 + layout.phaseOffset * 0.4;
  const driftX =
    Math.sin(phase) *
    motifLoopBackgroundConfig.loop.travelX *
    layout.depth;
  const driftY =
    Math.cos(secondaryPhase) *
    motifLoopBackgroundConfig.loop.travelY *
    layout.depth;
  const scale =
    layout.baseScale *
    (1 +
      Math.sin(phase + Math.PI / 4) *
        motifLoopBackgroundConfig.loop.scaleAmplitude);
  const rotation =
    layout.rotationBias +
    Math.sin(phase * 0.8 + 0.35) *
      motifLoopBackgroundConfig.loop.rotationAmplitude;
  const motionEnergy = clamp01(
    Math.abs(Math.sin(phase)) * 0.58 + Math.abs(Math.cos(secondaryPhase)) * 0.42,
  );

  return {
    x: layout.baseX + driftX,
    y: layout.baseY + driftY,
    scale,
    rotation,
    motionEnergy,
  };
}

/**
 * 背景として読ませるための安全 clamp。
 * alpha / glow / blur をここで抑え、画面中央の readability を優先する。
 */
export function backgroundSafetyClamp({
  depth,
  motionEnergy,
  plateDistance,
}: {
  depth: number;
  motionEnergy: number;
  plateDistance: number;
}) {
  const centralPenalty = clamp01(1 - plateDistance / 360);
  const safeEnergy = clamp01(
    motionEnergy * 0.42 + depth * 0.26 - centralPenalty * 0.32,
  );
  const alpha = mix(
    motifLoopBackgroundConfig.clamp.minMotifAlpha,
    motifLoopBackgroundConfig.clamp.maxMotifAlpha,
    safeEnergy,
  );
  const glowAlpha = mix(
    motifLoopBackgroundConfig.clamp.minGlowAlpha,
    motifLoopBackgroundConfig.clamp.maxGlowAlpha,
    safeEnergy * 0.72,
  );
  const blurStrength =
    motifLoopBackgroundConfig.clamp.maxBlurStrength * (0.34 + (1 - depth) * 0.5);

  return {
    alpha: alpha * (1 - centralPenalty * 0.3),
    glowAlpha: glowAlpha * (1 - centralPenalty * 0.42),
    blurStrength,
    accentAlpha: alpha * 0.82,
  };
}

export function getMotifLoopBackgroundSafeFrame() {
  return motifLoopBackgroundConfig.safeFrame;
}

export function evaluateMotifLoopBackgroundFrame(
  frame: number,
): MotifLoopBackgroundFrameState {
  const normalizedFrame = wrapPhase(frame);
  const phase = normalizedFrame / motifLoopBackgroundConfig.durationFrames;
  const plateCenterX =
    motifLoopBackgroundConfig.readabilityPlate.x +
    motifLoopBackgroundConfig.readabilityPlate.width / 2;
  const plateCenterY =
    motifLoopBackgroundConfig.readabilityPlate.y +
    motifLoopBackgroundConfig.readabilityPlate.height / 2;
  const motifs = Array.from(
    { length: motifLoopBackgroundConfig.motifCount },
    (_, index) => {
      const layout = motifLayout(index);
      const motion = motifLoopMotion(layout, normalizedFrame);
      const plateDistance = Math.hypot(
        motion.x - plateCenterX,
        motion.y - plateCenterY,
      );
      const clamp = backgroundSafetyClamp({
        depth: layout.depth,
        motionEnergy: motion.motionEnergy,
        plateDistance,
      });

      return {
        ...layout,
        x: motion.x,
        y: motion.y,
        scale: motion.scale,
        rotation: motion.rotation,
        alpha: clamp.alpha,
        glowAlpha: clamp.glowAlpha,
        blurStrength: clamp.blurStrength,
        accentAlpha: clamp.accentAlpha,
      };
    },
  );

  return {
    frame: normalizedFrame,
    phase,
    washAlpha: mix(
      motifLoopBackgroundConfig.clamp.minWashAlpha,
      motifLoopBackgroundConfig.clamp.maxWashAlpha,
      clamp01(0.45 + Math.sin(phase * Math.PI * 2 + 0.2) * 0.08),
    ),
    fieldDriftX: Math.sin(phase * Math.PI * 2) * 18,
    fieldDriftY: Math.cos(phase * Math.PI * 2 * 0.85) * 12,
    plateShadowAlpha: 0.36 + Math.sin(phase * Math.PI * 2 + 0.4) * 0.02,
    motifs,
  };
}
