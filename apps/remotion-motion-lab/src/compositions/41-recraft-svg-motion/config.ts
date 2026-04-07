/**
 * Recraft SVG Motion Test — Configuration (#41)
 *
 * Tests Recraft API-generated SVG animation capabilities in Remotion.
 * Each scene segment tests a specific technique.
 */
export const config = {
  /** Scene durations (frames at 30fps) */
  scenes: {
    imgLoad: { start: 0, duration: 90 },        // 3s — <Img> loading test
    inlineSvg: { start: 90, duration: 90 },      // 3s — inline SVG expansion
    transform: { start: 180, duration: 90 },     // 3s — per-path transform
    opacity: { start: 270, duration: 90 },       // 3s — stagger fade
    clipReveal: { start: 360, duration: 90 },    // 3s — clipPath reveal
    strokeDraw: { start: 450, duration: 90 },    // 3s — stroke-dasharray
    svgFilter: { start: 540, duration: 90 },     // 3s — blur/shadow filter
    scaleCompare: { start: 630, duration: 120 }, // 4s — SVG vs PNG scale
  },
  totalFrames: 750, // 25 seconds
  palette: {
    bg: "#0c0a09",
    label: "#fafaf9",
    labelMuted: "#a8a29e",
    accent: "#d97706",
  },
  labelSize: 20,
} as const;
