/**
 * Filmtone Countdown — Configuration
 *
 * All text, colors, timing, and labels are defined here.
 * Change this file to rebrand the entire video.
 */

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------
export const palette = {
  black: "#000000",        // Pure black — maximum contrast
  white: "#FFFFFF",        // Pure white
  accent: "#FF5500",       // Vivid orange — high impact
  accentDark: "#CC4400",   // Darker orange
  surface: "#1A1A1A",      // Near-black surface
  midGray: "#4D4D4D",      // Mid gray
  lightGray: "#EBEBEB",    // Light gray
  cream: "#F5F5F5",        // Off-white
} as const;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------
export const fonts = {
  heading: "Inter, sans-serif",
  mono: '"Courier New", monospace',
  headingWeight: "900" as const,
  labelWeight: "600" as const,
} as const;

// ---------------------------------------------------------------------------
// Countdown numbers (displayed during 5→4→3→2→1)
// ---------------------------------------------------------------------------
export const countdown = ["5", "4", "3", "2", "1"] as const;

// ---------------------------------------------------------------------------
// Labels — small monospace text scattered across scenes
// ---------------------------------------------------------------------------
export const labels = {
  primary: "[FILMTONE]",
  secondary: "FILM LOOKS",
  tertiary: "PROOF-FIRST",
  action: "TRY FREE",
  quality: "LUMINOUS",
} as const;

// ---------------------------------------------------------------------------
// Finale text (replaces "RAW POWER")
// ---------------------------------------------------------------------------
export const finale = {
  line1: "SEE IT",
  line2: "FIRST",
} as const;

// ---------------------------------------------------------------------------
// Tagline (post-finale, if needed)
// ---------------------------------------------------------------------------
export const tagline = "Beautiful film looks. Instantly.";

// ---------------------------------------------------------------------------
// Scene timing — 30fps frame counts
// Each scene's duration in frames. Total must equal totalFrames.
// ---------------------------------------------------------------------------
export const timing = {
  s5_label:    15,  // "5" with labels on accent bg
  s5_fill:     15,  // "5" scales to fill frame
  s4:          20,  // "4" symmetric layout
  s3:          15,  // "3" scattered
  s2_orange:    7,  // "2" massive overlapping
  s2_closeup:   8,  // "2" extreme closeup (abstract stripes)
  s1:          15,  // "1" burst scatter
  assembly:    25,  // Letters assemble into finale word
  finale:      40,  // Finale hero text (SEE IT / FIRST)
} as const;

export const totalFrames = Object.values(timing).reduce((a, b) => a + b, 0);
// Expected: 160 frames = 5.33s at 30fps

// ---------------------------------------------------------------------------
// Derived scene start frames
// ---------------------------------------------------------------------------
function buildStarts(t: typeof timing) {
  let f = 0;
  const s: Record<string, number> = {};
  for (const [key, dur] of Object.entries(t)) {
    s[key] = f;
    f += dur;
  }
  return s as Record<keyof typeof timing, number>;
}
export const starts = buildStarts(timing);
