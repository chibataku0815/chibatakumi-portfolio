// Demo parameters for the tangency-coupled-drive motion study.
//
// These are the ORIGIN cell's measurement-bound constants (three 54px squares
// in a row, 90-frame / 3s loop @ 30fps), copied from motion-grammar-lab
// studies/puttimw-motion-drawers/src/verbs/linkage.ts (linkageParams).
// Three deliberate adaptations for this embedded demo:
//   1. The row is recentred on the demo viewBox centre — the measured rest
//      spacing (109 / 163 / 217, i.e. ±54 from the driver) is preserved
//      exactly; only the origin moves (upstream centre sat at x=163.0 /
//      y=127.7 in the reference crop).
//   2. The upstream SVG realization adds a render-calibrated +1px AA side
//      compensation so a crisp rect matches the reference video's anti-aliased
//      mask (curated ADJUDICATION 4 — a calibration, not geometry). Sides here
//      stay at the TRUE measured 54px, uncorrected.
//   3. Colours are NOT carried. The schedule is pure geometry; the SVG demo
//      paints with the site's substrate ink (currentColor) and the finish demo
//      with the API-finish light palette, not the reference cell's red.
// The rotation ladder (keys + handles), the tangency law constants (side 54,
// gap 0.1px) — i.e. the motion knowledge itself — are kept faithful.

import { createTangencyCoupledDriveSchedule } from "./tangency-coupled-drive";
import type { TangencyCoupledDriveParams } from "./tangency-coupled-drive";

export const TANGENCY_DRIVE_VIEWBOX = 240;
export const TANGENCY_DRIVE_PERIOD_FRAMES = 90;
export const TANGENCY_DRIVE_FPS = 30; // design contract: 90f = 3s loop

/**
 * The most legible single frame — the driver exactly at the 45° diamond, the
 * followers at full ~11px push, the tangency relation visible at its extreme.
 * Used as the static fallback for prefers-reduced-motion.
 */
export const TANGENCY_DRIVE_DIAMOND_FRAME = 46;

export const tangencyCoupledDriveParams: TangencyCoupledDriveParams = {
  periodFrames: 90,
  thetaKeys: [
    { t: 3, deg: 0 }, // rest ends (frames 0-2 exact upright, frame 3 is the key)
    { t: 46, deg: 45 }, // diamond — geometric dwell, not a hold key
    { t: 89, deg: 90 }, // quarter-turn completes ≡ upright (seal)
  ],
  segmentBeziers: [
    [0.67, 0.06, 0.16, 1.0], // rise: gentle start, deep ease into the diamond
    [0.76, 0.04, 0.19, 0.98], // fall: slow out of the diamond, soft landing tail
  ],
  squareSidePx: 54,
  tangencyGapPx: 0.1,
  // upstream row: cy 127.7, centers 109 / 163 / 217 — recentred to the
  // 240-viewBox centre (shift −43, −7.7; adaptation 1 above)
  cyDesign: 120,
  groupCenterCxDesign: 120,
  restNeighborCxDesign: { left: 66, right: 174 },
};

export const tangencyCoupledDriveSchedule = createTangencyCoupledDriveSchedule(
  tangencyCoupledDriveParams,
);
