/**
 * Type as Texture — Configuration (editorial style) — v6
 *
 * Grid-driven design: ALL dimensions are multiples of the grid unit (108px).
 *   - Font sizes: 432 (4×), 324 (3×), 216 (2×)
 *   - Y positions: 216, 540, 864 (on major grid lines 2, 5, 8)
 *   - Rows tile cleanly within the grid — minimal meaningful overlap only
 *
 * The grid IS the design system. Text obeys the grid.
 */
export const config = {
  palette: {
    bg: '#fafaf7',
    primary: '#1a1a1a',
    accent: '#c8102e',
  },

  typography: {
    letterSpacing: 0.02,
  },

  text: 'TEXTURE',

  // -- Graph paper grid --
  grid: {
    majorGap: 108,
    minorGap: 27,
    majorAlpha: 0.10,
    minorAlpha: 0.04,
    majorWidth: 1,
    minorWidth: 0.5,
    color: '#1a1a1a',
    accentLineIndex: 4,   // 4th horizontal major = y432, in red
  },

  // -- Grid-proportional text rows --
  // Sizes: 4× grid, 3× grid, 2× grid
  // Positions: major lines 2, 5, 8
  rows: [
    {
      fontSize: 432,       // 4 × 108
      fontWeight: 400,
      y: 216,              // major line 2
      normalAlpha: 0.85,
      invertedAlpha: 0.65,
      speed: 1.5,
      normalDirection: 1,
      staggerDelay: 0,
    },
    {
      fontSize: 324,       // 3 × 108
      fontWeight: 900,
      y: 540,              // major line 5 (center)
      normalAlpha: 0.90,
      invertedAlpha: 0.70,
      speed: 4.5,
      normalDirection: -1,
      staggerDelay: 3,
    },
    {
      fontSize: 216,       // 2 × 108
      fontWeight: 400,
      y: 864,              // major line 8
      normalAlpha: 0.80,
      invertedAlpha: 0.55,
      speed: 10.0,
      normalDirection: 1,
      staggerDelay: 5,
    },
  ],

  // -- Red vertical spine (on first major vertical grid line) --
  spine: {
    x: 108,
    yStart: 0,
    yEnd: 1080,
    lineWidth: 2,
    alpha: 0.7,
  },

  // -- Annotation (snaps to grid intersection) --
  annotation: {
    text: 'VOL. I',
    fontSize: 18,
    x: 120,              // just right of spine
    y: 100,              // near top, between grid lines
    alpha: 0.45,
    letterSpacing: 0.5,
  },

  texture: {
    grain: 8,
    grainAlpha: 40,
    vignette: 0.05,
  },

  fadeInDuration: 18,
  totalFrames: 120,
} as const;
