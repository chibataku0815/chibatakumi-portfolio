// Demo parameters for the offset-stagger-conveyor motion study.
//
// These are the ORIGIN cell's measurement-bound constants (drawer cell #1
// "offset"/ずらし — ONE dot clip sliding one slot per sub-cycle while its radius
// walks the slot-key ladder, the clip duplicated at 30-frame time offsets, with
// one altered key on the sub-cycle-1 entrant; 90-frame / 3s loop @ 30fps),
// copied from motion-grammar-lab
// studies/puttimw-motion-drawers/src/verbs/offset-stagger.ts. The schedule math
// itself lives in the vendored ./offset-stagger-conveyor
// (createOffsetStaggerConveyor); this file only supplies the measured rig + the
// render-only recentring.
//
// Deliberate adaptations for this embedded demo (the allowed three only):
//   1. Recentring: the cell reserves a lower band for its "オフセット" kana label
//      and sits the figure on a high horizontal baseline. This label-free demo
//      adds a render-only shift so the centre slot lands on the 324-square
//      centre (162, 162) — the same recentre the lab's finish deliverable
//      applies. Applied to the circle positions; radii untouched.
//   2. No calibration is stripped. The +0.5 registration offset (baked into
//      anchorCoord) and the +0.33 AA radius bias (baked into slotKeys) are
//      reference-raster artifacts, but they are PRESERVED verbatim so the demo
//      stays bit-identical to the cell and passes the full-schedule-equality
//      proof — subtracting them would misalign against the cell.
//   3. Colours are NOT carried. The cell binds a study-side blue fill the
//      schedule never reads. The SVG demo paints with the page ink
//      (currentColor), the finish demo with the API-finish light palette.

import {
  createOffsetStaggerConveyor,
  type OffsetStaggerConveyorParams,
} from "./offset-stagger-conveyor";

export type OffsetDotState = { cx: number; cy: number; r: number; slot: number };

export const OFFSET_VIEWBOX = 324;
export const OFFSET_PERIOD_FRAMES = 90;
export const OFFSET_FPS = 30; // design contract: 90f = 3s loop

/**
 * Static fallback frame for prefers-reduced-motion: the lattice is at its clean
 * symmetric rest here — three circles sit on the baseline (the two end slots are
 * at radius 0 and drop out), so the size ladder reads at a glance.
 */
export const OFFSET_POSTER_FRAME = 0;

// The cell draws every circle on one fixed horizontal baseline (the verb is 1-D
// — it returns a scalar coord + value; the cross-axis is the renderer's).
const BASELINE_CY = 129.6;

// Render-only recentring (adaptation 1): centre slot → 324-square centre.
// Centre slot x = anchorCoord + 2·spacingPx = 170.1; baseline y = 129.6.
const CENTER_SHIFT_X = 162 - 170.1;
const CENTER_SHIFT_Y = 162 - BASELINE_CY;

// Measured rig (calibration preserved, adaptation 2). ONE dot clip slides one
// 62px slot per 30-frame sub-cycle (an 18-frame eased ramp, then a 12-frame
// hold) while its radius walks the slot-key ladder 0 → 15.9 → 28.85 → 15.9 → 0
// on the SAME master progression. The clip is duplicated at 30-frame offsets;
// the sub-cycle-1 entrant carries one altered key (right slot 18.5 ≈ 1.16×), and
// the look of it easing back to normal en route to the centre is just that one
// key interpolating to the shared centre key — there is no separate falloff.
export const OFFSET_PARAMS: OffsetStaggerConveyorParams = {
  periodFrames: OFFSET_PERIOD_FRAMES,
  subcycleFrames: 30,
  activeFrames: 18,
  bezier: [0.58, 0.057, 0.415, 0.93],
  spacingPx: 62,
  // design CONTINUOUS coords = measured pixel-index centroids + 0.5; exit slot.
  anchorCoord: 46.1,
  // radii render-calibrated: bound R measures r_eq ≈ R + 0.33 under the
  // thresh-40 mask convention.
  slotKeys: [0, 15.9, 28.85, 15.9, 0],
  keyOverrides: [{ duplicateClass: 1, slot: 3, value: 18.5 }],
};

const baseSchedule = createOffsetStaggerConveyor(OFFSET_PARAMS);

/**
 * Circles at a loop frame, recentred for the demo stage. The base schedule
 * computes each in design space; the recentring shift is added LAST so each
 * value equals the schedule's value plus the same constant — render-only, the
 * mechanism is untouched (and the design-space base is what the article's
 * skeleton is proven equal to). Radii are unshifted. Zero-radius end slots are
 * culled, exactly as the cell does.
 */
export const offsetDotsAt = (frame: number): OffsetDotState[] =>
  baseSchedule(frame)
    .filter((d) => d.value > 0.01)
    .map((d) => ({
      cx: d.coord + CENTER_SHIFT_X,
      cy: BASELINE_CY + CENTER_SHIFT_Y,
      r: d.value,
      slot: d.slotFrom,
    }));
