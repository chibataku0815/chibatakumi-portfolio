// Design tokens — extracted from motion-dot-new (Canvas2D legacy) palette + grid.
// Reference: plan §5.6.

export const PALETTE = {
  bgPrimary: "#D2D2D2",
  bgSecondary: "#E8EAED",
  fgPrimary: "#1A1A1A",
  fgSecondary: "#202124",
  accent: "#FFFFFF",
} as const;

export const HEX_GRID = {
  rows: [7, 6, 7] as const,
  sizes: { S: 5, M: 9, L: 15 } as const,
  gap: 88,
  rowOffset: 44,
} as const;

export const MOTION_GRAMMAR = {
  // To be re-exported from @chibatakumi/motion-dot easing module in Stream 3.
  // Listed here as reference.
  primary: ["easeOutQuint", "smootherstep", "springScaleSimple"] as const,
} as const;
