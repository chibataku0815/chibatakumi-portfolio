/**
 * Slam In — Configuration
 *
 * Style: brutalist — Pure black/white, Bebas Neue 320px,
 * aggressive grain, zero vignette.
 *
 * Motion: Scale slam 400% → 100% with expOut + motion blur smear.
 */
export const config = {
  // --- Style: brutalist ---
  palette: {
    bg: "#000000",
    primary: "#ffffff",
    accent: "#ccff00",
  },
  text: "IMPACT",
  font: "Bebas Neue", // loaded via @remotion/google-fonts/BebasNeue
  fontSize: 320, // brutalist hero = 320px
  fontWeight: "400", // Bebas Neue only has 400 (visually heavy by design)
  letterSpacing: -0.02, // em — negative for monolithic block feel
  texture: {
    grain: 40, // brutalist = photocopier roughness
    vignette: 0, // brutalist = uniform, no softening
  },

  // --- Motion parameters (UNCHANGED) ---
  startScale: 4.0,
  endScale: 1.0,
  slamDuration: 18, // frames
  holdStart: 18,
  exitStart: 65,
  exitDuration: 15,
  totalFrames: 90,
  blurSamples: 4,
} as const;
