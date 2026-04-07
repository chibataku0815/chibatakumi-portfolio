/**
 * Isshin Reel Credits — Configuration
 *
 * Recreation of isshin REEL 2024, 25.5-33.4s (7.9s, 395 frames @ 50fps).
 * Credits panel assembly → year counter → panel dispersal → 3D scatter outro.
 *
 * Timeline (@ 50fps, 395 frames):
 *   f0-100:   Assembly — panels slide in from edges
 *   f100-225: Year counter 2021→2024 + progress bar fill
 *   f225-300: Panel dispersal — panels fly outward
 *   f300-395: 3D scatter — abstract shapes in elliptical boundary
 */
export const config = {
  totalFrames: 395, // 7.9s × 50fps

  // ── Phase timing ──────────────────────────────────────────
  assemblyEnd: 100,
  yearCounterStart: 100,
  yearCounterEnd: 225,
  dispersalStart: 225,
  scatterStart: 300,

  // ── Background ────────────────────────────────────────────
  bgTeal: "#3CB8AD",
  bgCream: "#F5F0E8",

  // ── Left panel (pink) ─────────────────────────────────────
  leftPanel: { x: 100, y: 350, w: 280, h: 350 },
  leftBg: "#E87878",
  leftTextColor: "#FFFFFF",
  leftFontSize: 64,
  leftFontWeight: 700,

  // ── Right panel (gray, 3 rows) ────────────────────────────
  rightPanel: { x: 420, y: 350, w: 1400, h: 350 },
  rightBg: "#E8E8E8",
  row0H: 110,
  row1H: 110,
  row2H: 130,

  // Row 0: gold accent + labels
  row0AccentBg: "#C8A850",
  row0AccentW: 220,
  row0TextColor: "#333333",
  row0FontSize: 18,

  // Row 1: music info (red)
  row1Bg: "#D73C4B",
  row1TextColor: "#FFFFFF",
  row1FontSize: 22,

  // Row 2: progress bar + timecode
  row2Bg: "#F5F5F5",
  progressBarColor: "#C0D420",
  progressTrackColor: "#CCCCCC",
  row2FontSize: 16,

  // ── Assembly slide ────────────────────────────────────────
  slideDistance: 120,

  // ── Dispersal ─────────────────────────────────────────────
  dispersalLeftStart: 255,
  dispersalRow0Start: 225,
  dispersalRow1Start: 245,
  dispersalRow2Start: 265,
  dispersalDuration: 80,

  // ── Cream border ──────────────────────────────────────────
  borderThickness: 60,

  // ── Scatter ellipse ───────────────────────────────────────
  ellipseCx: 960,
  ellipseCy: 540,
  ellipseRx: 680,
  ellipseRy: 420,
  particleCount: 28,

  // ── Grain ─────────────────────────────────────────────────
  grainSize: 4,
  grainAlpha: 35, // out of 255
} as const;
