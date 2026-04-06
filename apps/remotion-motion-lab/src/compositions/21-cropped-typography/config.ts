/**
 * Cropped Typography — Configuration (brutalist style) — v2
 *
 * 5-layer composition: massive "MOTION" (1500px), dual accent lines,
 * bold registration marks, ghost misregistration, subtext + page number.
 * All decorative layers are clearly visible — no invisible elements.
 */
export const config = {
  // -- Brutalist palette --
  bg: '#000000',
  primary: '#ffffff',
  accent: '#ccff00',

  // -- Main text (Layer 1) --
  mainText: 'MOTION',
  mainFontSize: 1500,
  mainStartX: -300,
  mainEndX: -650,
  mainY: 0.50,
  mainStrokeAlpha: 0.25,
  mainStrokeWidth: 2,

  // -- Ghost copies (misregistration — VISIBLE) --
  ghostAlpha: 0.15,
  ghostOffsetY: 6,
  ghostOffsetX: 4,

  // -- Subtext (Layer 2) --
  subText: 'ANALOG TEXTURE',
  subFontSize: 64,
  subLetterSpacing: 0.2, // em — wide tracking
  subX: 1840,
  subY: 1000,
  subFadeInStart: 12,
  subFadeInDuration: 12,

  // -- Page number (brutalist convention) --
  pageNum: '021',
  pageNumFontSize: 36,
  pageNumX: 80,
  pageNumY: 1000,

  // -- Accent lines (Layer 3) — dual lines for rhythm --
  line1Y: 580,
  line2Y: 620,
  lineWidth: 5,
  lineDrawStart: 8,
  lineDrawDuration: 12,

  // -- Registration marks (Layer 4) — bold & visible --
  regMarkInset: 50,
  regMarkSize: 40,
  regMarkCircleRadius: 5,
  regMarkDotRadius: 2.5, // filled center dot
  regMarkStrokeWidth: 2,
  regMarkAlpha: 0.65,
  regMarkFadeInStart: 4,
  regMarkFadeInDuration: 8,

  // -- Scanlines --
  scanlineAlpha: 0.03,
  scanlineGap: 4,

  // -- Drift --
  driftDuration: 65,
  yMicroDriftAmplitude: 25,
  yMicroDriftFrequency: 0.05,

  // -- Fade in --
  fadeInDuration: 10,

  // -- Exit --
  exitStart: 70,
  mainExitDuration: 18,
  mainExitScale: 1.10,
  subExitDelay: 2,
  subExitDuration: 15,
  regMarkExitDelay: 3,
  regMarkExitDuration: 12,
  regMarkExitScale: 1.03,

  // -- Texture --
  grain: 40,
  vignette: 0,

  totalFrames: 90,
} as const;
