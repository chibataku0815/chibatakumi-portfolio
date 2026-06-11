// Demo parameters for the shared-hold-pulse motion study.
//
// These are the ORIGIN cell's measurement-bound constants (drawer cell #7
// "symmetry"/対称 — four round-cap pills + a center rounded square on a
// mirror grid, all driven by one shared rise-hold-fall pulse, 90-frame / 3s
// loop @ 30fps), copied from motion-grammar-lab
// studies/puttimw-motion-drawers/src/verbs/symmetry.ts (symmetryParams).
// Deliberate adaptations for this embedded demo (the allowed three only):
//   1. Recentring: upstream sits on mirror axis x = 155.95 with the bar row
//      at cy = 127.95 in the reference crop (the cell reserves a label band
//      at the bottom) — every restCx shifts by −35.95 and restCy by −7.95 so
//      the mirror axis lands on the 240-viewBox center (120, 120). Spacings
//      (34/35px gaps), pill width 27.5, rest heights, every amplitude, the
//      keys and the bezier stay exactly as measured.
//   2. No raster-calibration artifact existed on this cell (the upstream
//      realization draws the schedule's rects directly, with no AA
//      compensation) — nothing to zero out.
//   3. Colours are NOT carried. Upstream pairs the schedule with study-local
//      realization meta (fillRgb/backgroundRgb) the schedule itself never
//      reads; the package params are schedule-only. The SVG demo paints with
//      the site's substrate ink (currentColor), the finish demo with the
//      API-finish light palette.
// The pulse (4 integer keys rise-hold-fall + one shared bezier, stagger
// zero), the amplitude table and the center square's +180° spin — the motion
// knowledge itself — are kept faithful.

import { createSharedHoldPulseSchedule } from "./shared-hold-pulse";
import type { SharedHoldPulseParams } from "./shared-hold-pulse";

export const SHARED_HOLD_PULSE_VIEWBOX = 240;
export const SHARED_HOLD_PULSE_PERIOD_FRAMES = 90;
export const SHARED_HOLD_PULSE_FPS = 30; // design contract: 90f = 3s loop

/**
 * The most legible single frame — mid-plateau, where the pulse holds at 1:
 * bars fully grown and spread, the center square swollen and re-aligned
 * after its half turn. Used as the static fallback for
 * prefers-reduced-motion.
 */
export const SHARED_HOLD_PULSE_HOLD_FRAME = 45;

const PILL_W = 27.5;
const PILL_CAP = 13.75;
const REST_H = 51.5;
const CY = 120; // upstream 127.95 → recentred (adaptation 1 above)

export const sharedHoldPulseParams: SharedHoldPulseParams = {
  envelope: {
    periodFrames: 90,
    keys: [2, 42, 47, 87],
    bezier: [0.684, 0.036, 0.292, 0.985],
  },
  elements: [
    // outer-left bar: height amp 123, outward −19.85 (upstream cx 86.95)
    { restCx: 51, restCy: CY, restWidth: PILL_W, restHeight: REST_H, cornerRadius: PILL_CAP, widthAmp: 0, heightAmp: 123, offsetAmp: -19.85, rotationAmpDeg: 0 },
    // inner-left bar: height amp 36, outward −12.7 (upstream cx 120.95)
    { restCx: 85, restCy: CY, restWidth: PILL_W, restHeight: REST_H, cornerRadius: PILL_CAP, widthAmp: 0, heightAmp: 36, offsetAmp: -12.7, rotationAmpDeg: 0 },
    // center square: 21.5×19.5 → 33.5×31.5, +180° spin, on-axis (upstream cx 155.95)
    { restCx: 120, restCy: CY, restWidth: 21.5, restHeight: 19.5, cornerRadius: 2.5, widthAmp: 12, heightAmp: 12, offsetAmp: 0, rotationAmpDeg: 180 },
    // inner-right bar: mirror (upstream cx 190.95)
    { restCx: 155, restCy: CY, restWidth: PILL_W, restHeight: REST_H, cornerRadius: PILL_CAP, widthAmp: 0, heightAmp: 36, offsetAmp: 12.7, rotationAmpDeg: 0 },
    // outer-right bar: mirror (upstream cx 224.95)
    { restCx: 189, restCy: CY, restWidth: PILL_W, restHeight: REST_H, cornerRadius: PILL_CAP, widthAmp: 0, heightAmp: 123, offsetAmp: 19.85, rotationAmpDeg: 0 },
  ],
};

export const sharedHoldPulseSchedule = createSharedHoldPulseSchedule(
  sharedHoldPulseParams,
);
