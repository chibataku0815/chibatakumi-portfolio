export const config = {
  id: "AETipMovingTexture",
  fps: 30,
  width: 1080,
  height: 1080,
  totalFrames: 180,
  background: "#09080b",
  steppedTexture: {
    holdFrames: 5,
    variantCount: 4,
    offsetAmplitude: 120,
    minScale: 1.42,
    maxScale: 1.94,
    rotationAmplitudeDeg: 24,
  },
  posterizedTexture: {
    posterizeFps: 6,
    offsetAmplitude: 148,
    rotationAmplitudeDeg: 30,
    scaleBase: 1.12,
    scaleJitter: 0.28,
  },
  fabric: {
    tileSize: 164,
    opacity: 0.4,
    shimmerOpacity: 0.08,
  },
  dust: {
    tileSize: 188,
  },
} as const;
