export const temporalEchoResidueConfig = {
  fps: 24,
  durationFrames: 253,
  reducedMotionFrame: 212,
  size: {
    width: 960,
    height: 540,
  },
  viewport: {
    width: 960,
    height: 540,
  },
  echo: {
    sampleCount: 5,
    baseFrameStep: 2,
    taper: 1.08,
    maxAlpha: 0.48,
    minimumLeadSpeed: 0.18,
    minimumLeadDistance: 1.1,
    minimumSampleSpacing: 0.65,
    idealSampleSpacing: 7.2,
  },
} as const;

export type TemporalEchoResidueConfig = typeof temporalEchoResidueConfig;
