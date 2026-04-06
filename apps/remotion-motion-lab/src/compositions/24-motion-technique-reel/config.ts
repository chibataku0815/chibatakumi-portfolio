/**
 * Motion Technique Reel — Configuration
 *
 * Orchestrates all 8 motion techniques (#16-#23) into a single showcase.
 * Order follows dramaturgical arc: analytical → kinetic → conceptual → celebratory.
 */

export const config = {
  fps: 30,

  /** Technique segments in presentation order */
  segments: [
    { id: "title",    label: "",                        frames: 75 },   // 2.5s
    { id: "easing",   label: "Easing Showcase",         frames: 150 },  // 5.0s
    { id: "slam",     label: "Slam In",                 frames: 90 },   // 3.0s
    { id: "stagger",  label: "Stagger",                 frames: 120 },  // 4.0s
    { id: "kinetic",  label: "Kinetic Typography",      frames: 120 },  // 4.0s
    { id: "pulse",    label: "Scale Pulse",             frames: 90 },   // 3.0s
    { id: "texture",  label: "Type as Texture",         frames: 120 },  // 4.0s
    { id: "cropped",  label: "Cropped Typography",      frames: 90 },   // 3.0s
    { id: "burst",    label: "Accent Burst",            frames: 90 },   // 3.0s
    { id: "end",      label: "",                        frames: 90 },   // 3.0s
  ],

  /** Lower-third formal terminology per technique */
  terminology: {
    easing:  { num: "01", formal: "Interpolation Curves" },
    slam:    { num: "02", formal: "Hard Scale-In / easeOutExpo" },
    stagger: { num: "03", formal: "Staggered Animation / backOut" },
    kinetic: { num: "04", formal: "Character Assembly / cubicOut" },
    pulse:   { num: "05", formal: "Rhythmic Scaling / quintOut" },
    texture: { num: "06", formal: "Abstract Kinetic Type / 180° Overlay" },
    cropped: { num: "07", formal: "Cropped Type / Maximalist" },
    burst:   { num: "08", formal: "Shape Burst / Golden Angle" },
  },

  /** Transition durations */
  interstitialFrames: 15,  // 0.5s dark between segments
  labelFadeFrames: 9,      // 0.3s label appear

  /** Title card */
  title: {
    line1: "MOTION",
    line2: "VOCABULARY",
    subtitle: "8 Core Techniques in Code",
  },

  /** End card */
  endCard: {
    line1: "FILMTONE",
    subtitle: "An engineer with a photographer's eye.",
  },
} as const;

// Compute total frames
export const totalFrames = config.segments.reduce((sum, s) => sum + s.frames, 0);
// Expected: 75 + 150 + 90 + 120 + 120 + 90 + 120 + 90 + 90 + 90 = 1035 frames = 34.5s

// Compute start frame for each segment
export const segmentStarts: Record<string, number> = {};
let _f = 0;
for (const s of config.segments) {
  segmentStarts[s.id] = _f;
  _f += s.frames;
}
