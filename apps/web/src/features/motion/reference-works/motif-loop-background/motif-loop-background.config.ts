export const motifLoopBackgroundConfig = {
  fps: 30,
  durationFrames: 240,
  safeFrame: 156,
  size: {
    width: 1440,
    height: 960,
  },
  motifCount: 12,
  layout: {
    columns: 4,
    rows: 3,
    outerMarginX: 180,
    outerMarginY: 156,
    jitterX: 44,
    jitterY: 34,
  },
  loop: {
    travelX: 30,
    travelY: 24,
    scaleAmplitude: 0.06,
    rotationAmplitude: 0.18,
  },
  clamp: {
    minMotifAlpha: 0.12,
    maxMotifAlpha: 0.28,
    minGlowAlpha: 0.03,
    maxGlowAlpha: 0.12,
    minWashAlpha: 0.34,
    maxWashAlpha: 0.48,
    maxBlurStrength: 4,
  },
  readabilityPlate: {
    x: 828,
    y: 180,
    width: 420,
    height: 600,
    radius: 34,
  },
} as const;

export type MotifLoopBackgroundConfig = typeof motifLoopBackgroundConfig;
