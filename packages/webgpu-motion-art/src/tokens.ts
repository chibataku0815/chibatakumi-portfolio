export const PALETTE = {
  ink: "#1a1a1a",
  paper: "#d1d1d1",
  white: "#ffffff",
  spark: "#fffff2",
  glow: "#b3d9ff",
} as const;

export type PaletteToken = keyof typeof PALETTE;

export const TYPOGRAPHY = {
  fontMono:
    "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
  fontStack: "system-ui, -apple-system, 'Segoe UI', sans-serif",
} as const;
