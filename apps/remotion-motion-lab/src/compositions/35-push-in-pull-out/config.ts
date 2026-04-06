/**
 * Push-in / Pull-out — Configuration
 *
 * Style: minimalDark — Quiet refinement where whitespace breathes.
 * Camera pushes in (1.0 → 1.08), holds with text cross-fade,
 * then pulls out. Every element earns its place.
 */
export const config = {
  // --- Style: minimalDark ---
  palette: {
    bg: '#0a0a0a',        // organic depth, not pure black
    primary: '#fafafa',    // not pure white — slight warmth
    accent: '#3b82f6',     // tech blue, used sparingly (<=5% area)
    secondary: '#808080',  // 50% luminance
  },
  texture: {
    grain: 5,              // essentially invisible
    vignette: 0.15,        // subliminal
  },

  // --- Typography ---
  font: 'Inter, sans-serif',
  hero: {
    weight: 200,           // Light — the "breathing" quality of minimal
    size: 180,             // frame's 17%
    letterSpacing: 0.03,   // em
  },
  corner: {
    weight: 700,           // Bold contrast with hero's light weight
    size: 20,
  },

  // --- Content ---
  textPush: 'FOCUS',
  textPull: 'CLARITY',

  // --- Camera ---
  pushScale: 1.08,         // subtle but perceptible for minimal
  pushDuration: 60,
  holdDuration: 15,
  pullDuration: 45,
  totalFrames: 120,

  // --- Accent line ---
  accentLineHeight: 3,
  accentLineRatio: 0.6,    // 60% of text width
} as const;
