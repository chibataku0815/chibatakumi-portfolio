/**
 * Kinetic Typography -- Configuration #18
 *
 * Editorial style: warm white paper, near-black ink, Playfair Display serif.
 * Characters scatter then assemble with expoOut easing.
 * Red accent line + editorial annotations for magazine feel.
 */
export const config = {
  word: "LESS IS MORE",
  font: "PlayfairDisplay",
  fontSize: 160,
  fontWeight: "400",  // Playfair Display lightest available (editorial thin serif)
  color: "#1a1a1a",           // near-black ink
  bgColor: "#fafaf7",         // warm white paper
  accentColor: "#c8102e",     // editorial red (< 5% screen area)
  secondaryColor: "#6b6b6b",  // mid-grey for annotations
  scatterRadius: 800,
  staggerDelay: 1.0,
  assemblyDuration: 14,
  totalFrames: 120,
  seed: 42,
  texture: {
    grain: 8,
    vignette: 0.05,
  },
} as const;
