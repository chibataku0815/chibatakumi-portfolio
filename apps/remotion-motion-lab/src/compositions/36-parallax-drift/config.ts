/**
 * Parallax Drift — Configuration (#36)
 *
 * Style: cinematic — 映画的な重厚さとエモーショナルな物語性
 * Letterbox 2.35:1 (CinemaScope), 35mm film grain, warm tones
 *
 * Three depth layers with oscillating elliptical drift.
 * Sine-based motion gives natural acceleration at center
 * and deceleration at direction reversals.
 */
export const config = {
  palette: {
    bg: '#0c0c0e',
    primary: '#e8e4dc',
    secondary: '#8a8478',
    accent: '#d4856a',
    teal: '#2a8c8a',
    muted: '#8a8478',
  },
  typography: {
    heroSize: 120,
    heroWeight: 300,
    headingSize: 36,
    headingWeight: 400,
    bgTextSize: 80,
    bgTextWeight: 300,
    letterSpacing: 0.08,
  },
  texture: {
    grain: 35,
    vignette: 0.4,
  },
  letterbox: {
    barHeight: 131,
  },
  layers: {
    background: {
      opacity: 0.6,
      gridCell: 120,
      particleCount: 30,
      text: 'FAR',
      // Slow gentle drift — near-static reference
      driftX: { amplitude: 15, cycles: 0.4 },
      driftY: { amplitude: 8, cycles: 0.3 },
    },
    midground: {
      opacity: 1.0,
      text: 'DEPTH',
      subtitle: 'PARALLAX  DRIFT',
      // Moderate swing
      driftX: { amplitude: 50, cycles: 1.0 },
      driftY: { amplitude: 18, cycles: 0.7 },
    },
    foreground: {
      opacity: 1.0,
      bokeh: [
        { x: 250, y: 300, radius: 150 },
        { x: 1650, y: 750, radius: 200 },
        { x: 950, y: 100, radius: 110 },
        { x: 1300, y: 950, radius: 160 },
        { x: 500, y: 800, radius: 130 },
      ],
      // Fast dramatic sweep — clearly different from MG
      driftX: { amplitude: 140, cycles: 2.0 },
      driftY: { amplitude: 50, cycles: 1.3 },
    },
  },
  totalFrames: 150,
} as const;
