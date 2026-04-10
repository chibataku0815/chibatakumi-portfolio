export const temporalEchoResidueConfig = {
  fps: 30,
  durationFrames: 180,
  reducedMotionFrame: 154,
  size: {
    width: 1200,
    height: 900,
  },
  viewport: {
    width: 1200,
    height: 900,
  },
  subject: {
    width: 252,
    height: 132,
    startX: 242,
    endX: 918,
    centerY: 474,
    arcHeight: 92,
    settleDrop: 16,
  },
  echo: {
    sampleCount: 6,
    baseFrameStep: 4,
    taper: 1.18,
    maxAlpha: 0.54,
    minimumLeadSpeed: 3.6,
    minimumLeadDistance: 20,
    minimumSampleSpacing: 14,
    idealSampleSpacing: 36,
  },
} as const;

export type TemporalEchoResidueConfig = typeof temporalEchoResidueConfig;
