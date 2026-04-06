/**
 * Stagger — Configuration
 *
 * Style: minimalDark — Weight 200+700 contrast is the nucleus.
 * Separators in tech blue accent, restrained grain, subtle vignette.
 *
 * Six text elements enter with non-uniform stagger delays and
 * directional offsets, creating an "Award-Worthy Stagger" effect.
 */
export const config = {
  // --- Style: minimalDark ---
  palette: {
    bg: "#0a0a0a",
    primary: "#fafafa",
    accent: "#3b82f6", // tech blue — separators only, <5% area
  },
  typography: {
    font: "Inter, sans-serif",
    fontSize: 100,
    separatorSize: 60,
    letterSpacing: 0.03, // em — tight but airy
  },
  texture: {
    grain: 5, // nearly invisible anti-flat texture
    vignette: 0.15, // subtle focus guide
  },

  // --- Elements with per-element weight (minimalDark 200/700 contrast) ---
  elements: [
    { text: "quiet", direction: "left" as const, delay: 0, weight: "200" },
    { text: "/", direction: "bottom" as const, delay: 5, weight: "700" },
    { text: "precise", direction: "right" as const, delay: 10, weight: "700" },
    { text: "/", direction: "bottom" as const, delay: 16, weight: "700" },
    { text: "luminous", direction: "left" as const, delay: 22, weight: "200" },
    { text: ".", direction: "bottom" as const, delay: 30, weight: "700" },
  ],
  gap: 20,
  animDuration: 18,
  totalFrames: 120,
} as const;
