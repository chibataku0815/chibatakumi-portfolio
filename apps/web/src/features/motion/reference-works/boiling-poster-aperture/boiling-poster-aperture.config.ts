export const boilingPosterApertureConfig = {
  fps: 30,
  durationFrames: 180,
  payoffFrame: 102,
  reveal: {
    startFrame: 10,
    fullFrame: 94,
    settleFrame: 132,
  },
  size: {
    width: 1200,
    height: 1600,
  },
  viewport: {
    width: 1200,
    height: 1600,
  },
  poster: {
    x: 216,
    y: 138,
    width: 760,
    height: 1240,
    radius: 38,
  },
  gate: {
    centerX: 590,
    centerY: 560,
    startRadius: 34,
    endRadius: 468,
    secondaryBlobRadius: 72,
  },
  aperture: {
    centerX: 374,
    centerY: 422,
    minRadius: 34,
    maxRadius: 468,
  },
  displacement: {
    maxScaleX: 56,
    maxScaleY: 34,
  },
  boil: {
    nodeCount: 18,
    warmAmplitude: 18,
    coolAmplitude: 9,
    tightAmplitude: 5,
  },
  accent: {
    startFrame: 74,
    settleFrame: 126,
    bandY: 1280,
    sparkCount: 7,
  },
} as const;

export type BoilingPosterApertureConfig = typeof boilingPosterApertureConfig;
