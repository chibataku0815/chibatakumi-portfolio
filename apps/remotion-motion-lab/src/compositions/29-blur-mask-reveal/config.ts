/**
 * Blur Mask Reveal — Configuration
 *
 * Style: minimalDark — Luxury brand launch composition.
 * Three-layer reveal: watermark depth → text reveal → subtitle settle.
 *
 * Layer 0: Background watermark (oversized, 4% alpha — depth without distraction)
 * Layer 1: Main text reveal (blur 14px→0 + left-to-right wipe)
 * Layer 2: Subtitle fade-in (appears 4 frames after reveal completes)
 */
export const config = {
  // --- Style: minimalDark ---
  palette: {
    bg: "#0a0a0a",
    primary: "#fafafa",
    accent: "#3b82f6",
    muted: "#6b7280",
  },
  texture: {
    grain: 5,
    vignette: 0.15,
  },

  // --- Main text ---
  text: "PREMIUM",
  font: "Inter, sans-serif",
  fontSize: 220,
  fontWeight: "400",
  letterSpacing: 0.08, // em — wider luxury spacing

  // --- Background watermark (always visible, creates depth) ---
  watermark: {
    text: "PREMIUM",
    fontSize: 680,
    fontWeight: "100",
    alpha: 0.08,
  },

  // --- Subtitle (fades in after reveal completes) ---
  subtitle: {
    text: "SERIES  01",
    fontSize: 20,
    fontWeight: "300",
    letterSpacing: 0.3, // em — very wide luxury tracking
    alpha: 0.45,
    fadeDelay: 10,   // frames after reveal ends
    fadeDuration: 30,
  },

  // --- Accent line ---
  accentLineWidth: 200,
  accentLineHeight: 2,
  accentLineOffsetY: 68, // below 220px text

  // --- Timing ---
  preDelay: 30,        // 1s — viewer absorbs the background
  revealDuration: 60,  // 2s — slow, deliberate reveal
  maxBlur: 14,
  totalFrames: 180,    // 6s total
} as const;
