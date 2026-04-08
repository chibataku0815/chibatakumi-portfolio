export const config = {
  id: "AETipPopShapeEffects",
  fps: 30,
  width: 1920,
  height: 1080,
  totalFrames: 348,
  sceneDurationFrames: 108,
  sceneGapFrames: 12,
  background: "#0d1117",
  backgroundAccentA: "#1a2435",
  backgroundAccentB: "#241816",
  gridColor: "rgba(255,255,255,0.05)",
  guideColor: "rgba(255,255,255,0.12)",
  chromeLabelColor: "rgba(255,255,255,0.62)",
  chromeTitleColor: "#fff6ea",
  centerGlowColor: "rgba(255,255,255,0.05)",
} as const;

export const sceneOffsets = [
  0,
  config.sceneDurationFrames + config.sceneGapFrames,
  (config.sceneDurationFrames + config.sceneGapFrames) * 2,
] as const;

export const effectOneConfig = {
  startFrame: 18,
  lineLength: 244,
  strokeWidth: 20,
  drawDurationFrames: 28,
  eraseDelayFrames: 10,
  eraseDurationFrames: 24,
  spokeCount: 4,
  baseRotationDeg: 0,
  secondLayerDelayFrames: 8,
  secondLayerRotationDeg: 45,
  primaryColor: "#ffd36a",
  secondaryColor: "#ff6a55",
  glowColor: "rgba(255,106,85,0.18)",
} as const;

export const effectTwoConfig = {
  burstStartFrame: 14,
  squareStartFrame: 24,
  burstColor: "#52d9c7",
  squareColor: "#fff3e4",
  squareSide: 252,
  squareRotationDeg: -40,
  scaleDurationFrames: 42,
  strokeStartWidth: 92,
  strokeEndWidth: 0,
} as const;

export const effectThreeConfig = {
  startFrame: 20,
  lineLength: 228,
  strokeWidth: 20,
  drawDurationFrames: 26,
  eraseDelayFrames: 8,
  eraseDurationFrames: 20,
  layerCount: 5,
  layerStaggerFrames: 4,
  baseRotationDeg: -90,
  rotationStepDeg: 45,
  colors: ["#ffd36a", "#ff6a55", "#5de0d1", "#ff6a55", "#ffd36a"],
} as const;
