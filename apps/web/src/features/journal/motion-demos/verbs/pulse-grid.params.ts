// Demo parameters for the pulse-grid motion study.
//
// These are the ORIGIN cell's measurement-bound constants (3×3 fixed-center
// grid, 90-frame / 3s loop @ 30fps), copied from motion-grammar-lab
// studies/puttimw-motion-drawers/src/verbs/random.ts (randomPulseParams).
// Three deliberate adaptations for this embedded demo:
//   1. The grid is recentred on the demo viewBox centre. The measured pitches
//      (col 58.95 / 58.97, row 59.09 / 58.90) are preserved exactly — only the
//      origin moves (upstream centre column/row sat at x=163.0 / y=127.84 in
//      the reference crop).
//   2. The upstream SVG realization subtracts a render-calibrated AA edge bias
//      (0.4px) so a crisp circle matches the reference's anti-aliased mask
//      footprint. That bias is a raster-calibration artefact, not part of the
//      motion — radii here stay in reference mask units, uncorrected.
//   3. Colours are NOT carried. The schedule is pure geometry; the SVG demo
//      paints with the site's substrate ink (currentColor) and the finish demo
//      with the API-finish light palette, not the reference cell's blue.
// The clip ladder (keys + handles), the 2f cadence and the scramble table —
// i.e. the motion knowledge itself — are kept faithful.

import { createPulseGrid } from "./pulse-grid";
import type { PulseGridParams } from "./pulse-grid";

export const PULSE_GRID_VIEWBOX = 240;
export const PULSE_GRID_PERIOD_FRAMES = 90;
export const PULSE_GRID_FPS = 30; // design contract: 90f = 3s loop

/**
 * The most legible single frame — one dot at its pop peak, earlier ranks
 * already settling, later ranks still at rest — so the time-shifted-copies
 * construction is visible in a still. Used as the static fallback for
 * prefers-reduced-motion.
 */
export const PULSE_GRID_SPREAD_FRAME = 14;

export const pulseGridParams: PulseGridParams = {
  periodFrames: 90,
  cadenceFrames: 2,
  firstClipStartFrame: 3,
  keys: [
    { t: 0, v: 12.02 }, // rest
    { t: 9, v: 26.19 }, // pop peak
    { t: 18, v: 21.84 }, // explicit undershoot
    { t: 25, v: 22.39 }, // plateau
    { t: 50, v: 22.39 }, // hold end = decay start
    { t: 68, v: 12.02 }, // back to rest
  ],
  segmentBeziers: [
    [0.62, 0.08, 0.5, 0.92], // rise
    [0.32, 0.06, 0.5, 1.0], // drop
    [0.48, 0.38, 0.5, 0.88], // recover
    [0, 0, 1, 1], // hold (inert — equal key values)
    [0.2, 0.17, 0.2, 0.83], // decay
  ],
  // upstream cols [104.05, 163.0, 221.97] − 163.0 + 120, rows
  // [68.75, 127.84, 186.74] − 127.84 + 120 (adaptation 1 above)
  gridColsX: [61.05, 120, 178.97],
  gridRowsY: [60.91, 120, 178.9],
  rankByCell: [
    [5, 1, 6],
    [7, 3, 4],
    [8, 2, 0],
  ],
};

export const pulseGridSchedule = createPulseGrid(pulseGridParams);
