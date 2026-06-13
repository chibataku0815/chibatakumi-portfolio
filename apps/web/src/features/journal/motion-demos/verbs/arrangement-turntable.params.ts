// Demo parameters for the arrangement-turntable motion study.
//
// These are the ORIGIN cell's measurement-bound constants (drawer cell #14
// "arrangement-transition"/配置移行 — nine dots transit between TWO keyed
// arrangements, a 3×3 rest grid and a fixed 9-slot ring sharing one centre, via
// a pull-in-then-fling expansion, a dead-still ring hold, and a +120° turntable
// contraction; 90-frame / 3s loop @ 30fps), copied from motion-grammar-lab
// studies/puttimw-motion-drawers/src/verbs/arrangement-transition.ts. The
// schedule math itself lives in the vendored ./arrangement-turntable
// (createArrangementTurntableSchedule); this file only supplies the measured
// arrangements + transit timing, and the render-only recentring.
//
// Deliberate adaptations for this embedded demo (the allowed three only):
//   1. Recentring: the cell reserves a lower band for its "配置移行" kana label,
//      so the arrangement centre (155.31, 127.28) sits high-left in the 324
//      design cell. This label-free demo adds a render-only shift so that centre
//      lands on the 324-square centre (162, 162) — the same recentre the lab's
//      own finish deliverable applies.
//   2. Raster-calibration ZEROED: the cell's params carry a registration offset
//      (0.49, 0.36)px tuned to match a reference RASTER footprint and applied
//      render-side. This demo renders fresh SVG with no reference raster, so it
//      is set to 0 (the schedule never reads this channel anyway — the recentre
//      below is the only render-side placement shift).
//   3. Colours are NOT carried. The cell binds a study-side blue fill + light
//      field the schedule never reads. The SVG demo paints with the page ink
//      (currentColor), the finish demo with the API-finish light palette.

import {
  createArrangementTurntableSchedule,
  type ArrangementTurntableDotState,
  type ArrangementTurntableParams,
} from "./arrangement-turntable";

export type ArrangementDotState = ArrangementTurntableDotState;

export const ARRANGEMENT_VIEWBOX = 324;
export const ARRANGEMENT_PERIOD_FRAMES = 90;
export const ARRANGEMENT_FPS = 30; // design contract: 90f = 3s loop

/**
 * Static fallback frame for prefers-reduced-motion: the dead-still ring hold,
 * where all nine dots sit cleanly on the formed ring and the arrangement reads.
 */
export const ARRANGEMENT_POSTER_FRAME = 40;

// Render-only recentring (adaptation 1): arrangement centre → 324-square centre.
const CENTER_SHIFT_X = 162 - 155.31;
const CENTER_SHIFT_Y = 162 - 127.28;

// Measured constants (adaptation 2: calibration zeroed). Two keyed arrangements
// — a 3×3 rest grid and a fixed 9-slot ring (r=72.32, slots 10°+40k) sharing one
// centre — joined by a pull-in-then-fling expansion (one shared anticipation
// lobe, per-dot onsets/arrivals), a dead-still ring hold, and a +120° turntable
// contraction (one shared rotation clock, per-slot cosine-wave delays). The
// central pile, the return swirl, the seat permutation and the ring "wobble" are
// all EMERGENT from these two keys — none is authored.
export const ARRANGEMENT_PARAMS: ArrangementTurntableParams = {
  periodFrames: ARRANGEMENT_PERIOD_FRAMES,
  center: { x: 155.31, y: 127.28 },
  restPositions: [
    [118.6, 90.6], [155.3, 90.6], [192.0, 90.6],
    [118.6, 127.3], [155.31, 127.28], [192.0, 127.3],
    [118.6, 164.0], [155.3, 164.0], [192.0, 164.0],
  ],
  ringRadius: 72.32,
  ringAnglesDeg: [10, 50, 90, 130, 170, 210, 250, 290, 330],
  restToRing: [5, 7, 8, 4, 6, 0, 3, 2, 1],
  ringToRest: [6, 3, 0, 1, 4, 2, 5, 8, 7],
  turntableDeg: 120,
  centerSeatDot: 4,
  centerDestinationDot: 3,
  expansion: {
    onsets: [2.95, 7.48, 5.94, 4.76, 4.77, 2.5, 3.61, 3.5, 10.0],
    arrivals: [35, 33, 34, 33, 32, 33, 36, 32, 33],
    lobeXHandles: [0.9, 0.4],
    lobeDepths: [0.72, 0.72, 0.72, 0.72, 0, 0.72, 0.72, 0.72, 0.72],
  },
  contraction: {
    windowStart: 45.46,
    windowEnd: 77.75,
    delaysPerSlot: [0.339, 1.551, 3.068, 4.181, 4.369, 3.544, 2.092, 0.692, 0],
    phiBezier: [0.5243, 0.1449, 0.0578, 0.683],
    sConBezier: [0.335, 0.435, 0.335, 0.3477],
  },
  dotRadius: 14.6,
  registrationOffsetDesign: { dx: 0, dy: 0 },
};

const baseSchedule = createArrangementTurntableSchedule(ARRANGEMENT_PARAMS);

/**
 * Nine dots at a loop frame, recentred for the demo stage. The base schedule
 * computes each dot in design space; the recentring shift is added LAST per field
 * so each value equals the schedule's value plus the same constant — render-only,
 * the mechanism is untouched (and the design-space base is what the article's
 * skeleton is proven equal to).
 */
export const arrangementDotsAt = (frame: number): ArrangementDotState[] =>
  baseSchedule(frame).dots.map((d) => ({
    cx: d.cx + CENTER_SHIFT_X,
    cy: d.cy + CENTER_SHIFT_Y,
    r: d.r,
  }));
