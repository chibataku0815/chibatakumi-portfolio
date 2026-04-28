import type { PathFlowConfig } from "./path-flow";

export const RIVER_PRESET: PathFlowConfig = {
  segments: [
    {
      path: { p0: [0.02, 0.35], p1: [0.15, 0.55], p2: [0.28, 0.60], p3: [0.38, 0.50] },
      next: [1],
    },
    {
      path: { p0: [0.38, 0.50], p1: [0.48, 0.40], p2: [0.58, 0.30], p3: [0.65, 0.42] },
      next: [2],
    },
    {
      path: { p0: [0.65, 0.42], p1: [0.72, 0.54], p2: [0.85, 0.58], p3: [0.98, 0.48] },
      next: [0],
    },
  ],
  particleCount: 50,
  baseSpeed: 0.02,
  baseRadius: 0.005,
  largeRadius: 0.016,
  lateralSpread: 0.035,
  whiteRatio: 0.12,
};

export const DELTA_PRESET: PathFlowConfig = {
  segments: [
    {
      path: { p0: [0.05, 0.50], p1: [0.18, 0.58], p2: [0.32, 0.42], p3: [0.42, 0.48] },
      next: [1, 2],
      routing: "lateral",
    },
    {
      path: { p0: [0.42, 0.48], p1: [0.55, 0.38], p2: [0.75, 0.25], p3: [0.92, 0.28] },
      next: [0],
      speedScale: 1.2,
      lateralScale: 0.6,
      radiusScale: 0.85,
    },
    {
      path: { p0: [0.42, 0.48], p1: [0.55, 0.58], p2: [0.72, 0.68], p3: [0.88, 0.72] },
      next: [0],
      speedScale: 1.2,
      lateralScale: 0.6,
      radiusScale: 0.85,
    },
  ],
  particleCount: 55,
  baseSpeed: 0.035,
  baseRadius: 0.005,
  largeRadius: 0.014,
  lateralSpread: 0.035,
  whiteRatio: 0.12,
};
