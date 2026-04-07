/**
 * Isshin Reel Intro — Configuration
 *
 * Recreation of first 15 seconds of isshin REEL 2024 showreel (0-15s).
 * Animated block-grid card on coral→teal background.
 *
 * Phases (@ 50fps):
 *   0-80    Bar: collapsed card (thin horizontal bar, appears immediately)
 *   80-158  Expand: bar grows into 3-row card (expOut easing)
 *   158-225 Card#1: self-intro (映像制作 / isshin / hatching / gradient+dots / NR7-24)
 *   225-312 Transition: block morph + bg color change to teal
 *   312-750 Card#2: music credit (音楽 / Lolica Tonica / French Kiss / from Acid Future)
 */
export const config = {
  totalFrames: 750, // 15s at 50fps

  // Phase timing (frames at 50fps)
  barEnd: 80,
  expandEnd: 158,
  transitionStart: 225,
  transitionEnd: 312,

  // Text stagger during expansion
  textStaggerStart: 130,
  textStaggerDelay: 3, // frames between each block's text entrance

  // Background
  bgCoral: "#E3897E",
  bgTeal: "#3CB8AD",

  // Card geometry (3 rows)
  cardBg: "#F0EDE8",
  cardW: 1200,
  cardH: 310,
  barH: 14,
  rowGap: 4,
  borderRadius: 4,
  numRows: 3,

  // Grain
  grain: 42,
} as const;
