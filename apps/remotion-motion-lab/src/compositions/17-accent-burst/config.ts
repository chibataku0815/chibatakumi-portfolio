/**
 * Accent Burst — Configuration (brutalist style) — v2
 *
 * 35 elements (including 5 hero-scale) exploding outward.
 * Aggressive secondary motion, scanline texture, pulsing center ring.
 */

export const config = {
  // -- Brutalist palette --
  bg: '#000000',
  primary: '#ffffff',
  accent: '#ccff00',

  // -- Center monogram --
  centerText: 'C',
  centerFontSize: 320,
  centerScaleInFrames: 10,
  centerScaleOvershoot: 2.5,
  centerStrokeAlpha: 0.4,
  centerStrokeWidth: 3,
  centerRingRadius: 200,
  centerRingStrokeWidth: 2,
  centerRingPulseAmplitude: 0.3, // alpha pulse 0.1-0.4

  // -- Element field --
  elementCount: 35,
  heroElementCount: 5, // large accent elements
  maxDistance: 700,
  colorRatio: 0.55,
  sizeRanges: {
    circle: { min: 22, max: 45 },
    square: { min: 28, max: 55 },
    line: { minLength: 45, maxLength: 80, minWidth: 2, maxWidth: 5 },
    strokeCircle: { min: 30, max: 50, minWidth: 2, maxWidth: 4 },
    hero: { min: 60, max: 100 },
  },
  alphaRange: { min: 0.6, max: 1.0 },

  // -- Timing --
  burstStart: 6,
  burstDuration: 22,
  staggerInterval: 0.3,
  holdStart: 30,
  holdEnd: 67,
  exitStart: 68,
  exitDuration: 20,
  exitDrift: 70,
  totalFrames: 90,

  // -- Secondary motion (hold phase) — AGGRESSIVE --
  rotationFrequency: 0.12,
  rotationAmplitudeDeg: 15,
  breathingFrequency: 0.09,
  breathingAmplitude: 0.08,

  // -- Scanlines --
  scanlineAlpha: 0.04,
  scanlineGap: 4,

  // -- Texture --
  grain: 40,
  vignette: 0,
} as const;
