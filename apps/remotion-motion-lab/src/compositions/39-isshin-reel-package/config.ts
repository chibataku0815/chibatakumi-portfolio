/**
 * Isshin Reel Package — Configuration (v2 rewrite)
 *
 * Recreation of isshin REEL 2024 package shot (15-25.5s).
 * 4 visual groups: title, warning bar, right info, barcode.
 * Positions measured from detail_19s0.jpg reference frame.
 *
 * Timeline (@ 50fps, 525 frames = 10.5s):
 *   f0-50:    Card#2 hold from #38 (teal bg, nothing else)
 *   f50-100:  BG morph teal→lime + warning bar fade-in
 *   f100-125: Warning bar settle
 *   f125-200: Title + right info + barcode staggered entry
 *   f200-400: Package hold (all elements static)
 *   f400-475: Entity scale-up dispersal
 *   f475-525: Empty lime bg hold
 */
export const config = {
  totalFrames: 525, // 10.5s at 50fps

  // ── Background ──
  bgTeal: "#3CB8AD",
  bgLime: "#C0D420",
  bgMorphStart: 50,
  bgMorphDuration: 50, // f50-100 (faster than before)
  bgExitStart: 470,
  bgExitDuration: 40, // f470-510: lime→teal for #40 transition

  // ── Title "isshin REEL 2024" ──
  // Measured from 1920×1080 ref + systematic offset correction (+35x, +13y)
  title: {
    x: 540,
    y: 185,
    fontSize: 136,
    weight: 900,
    color: "#1A1A1A",
    lineHeight: 1.08,
    // Entry animation (ref: not visible at f135, entering at f150)
    entryStart: 140,
    entryDuration: 40,
  },

  // ── Warning + Caution bar (merged) ──
  // Measured from 1920×1080 ref + systematic offset correction
  warningBar: {
    x: 88,
    y: 450,
    w: 655,
    h: 258,
    bgColor: "#000000",
    textColor: "#FFFFFF",
    headerSize: 22,
    bodySize: 13,
    hatchSpacing: 7,
    hatchAngle: 45,
    dividerY: 0.55, // fraction of height for divider
    // Entry animation
    entryStart: 60,
    entryDuration: 40,
  },

  // ── Right info cluster ──
  // Measured from 1920×1080 ref + systematic offset correction
  rightInfo: {
    x: 1020,
    y: 535,
    w: 450,
    h: 370,
    textColor: "#3A3A3A",
    headerSize: 14,
    bodySize: 12,
    // Entry animation (ref: small element at right edge at f150)
    entryStart: 155,
    entryDuration: 35,
  },

  // ── Barcode ──
  // Measured from 1920×1080 ref + systematic offset correction
  barcode: {
    x: 792,
    y: 891,
    w: 270,
    h: 90,
    // Entry animation (after title + rightInfo)
    entryStart: 170,
    entryDuration: 30,
  },

  // ── Dispersal ──
  dispersalStart: 420,
  dispersalDuration: 100,
  dispersalStagger: 6,
  dispersalScale: 3.5, // entities grow to 3.5x during fly-out
  dispersalFlyDistance: 600, // px fly distance

  // ── Grain ──
  grainSize: 2,
  grainAlpha: 12, // out of 255 (was 35 — too chunky/visible)
} as const;
