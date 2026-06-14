// Demo parameters for the seeded-settle-jump motion study.
//
// These are the ORIGIN cell's measurement-bound constants (drawer cell #16
// "time-delay"/時間遅延 — five bodies running ONE jump-and-settle profile, each
// replayed at a 4-frame time offset, with a velocity stretch and a landing
// satellite; 90-frame / 3s loop @ 30fps), copied from motion-grammar-lab
// studies/puttimw-motion-drawers/src/verbs/time-delay.ts. The schedule math
// itself lives in the vendored ./seeded-settle-jump
// (createSeededSettleJumpSchedule); this file only supplies the measured rig +
// the render-only recentring.
//
// Deliberate adaptations for this embedded demo (the allowed three only):
//   1. Recentring: the cell reserves a lower band for its "時間遅延" kana label,
//      so the bodies sit high in the 324 design cell. This label-free demo adds
//      a render-only shift so the motion's bbox centre lands on the 324-square
//      centre (162, 162) — the same recentre the lab's own finish deliverable
//      applies. Applied to the body and satellite positions; sizes untouched.
//   2. launchPhaseShift ZEROED: the cell binds launchPhaseShift = 1, a
//      capture-timeline alignment constant (origin curated ADJUDICATION 5). The
//      upstream header is explicit that "generality consumers set it to 0"; this
//      embedded demo is a generality consumer, so it is 0 (a 1-frame loop phase
//      shift, invisible in an isolated loop). The P2 faithfulness proof EXPECTS
//      this divergence (lab 1 → demo 0), like calibration-zeroing.
//   3. Colours are NOT carried. The cell binds a study-side blue fill the
//      schedule never reads. The SVG demo paints with the page ink
//      (currentColor), the finish demo with the API-finish light palette.

import {
  createSeededSettleJumpSchedule,
  type SeededSettleJumpDotState,
  type SeededSettleJumpParams,
} from "./seeded-settle-jump";

export type SeededSettleDotState = SeededSettleJumpDotState;

export const SEEDED_SETTLE_VIEWBOX = 324;
export const SEEDED_SETTLE_PERIOD_FRAMES = 90;
export const SEEDED_SETTLE_FPS = 30; // design contract: 90f = 3s loop

/**
 * Static fallback frame for prefers-reduced-motion: the staggered cascade is at
 * its widest spread here — the five bodies sit at clearly different heights and
 * two satellites are mid-flight, so the time-offset reads.
 */
export const SEEDED_SETTLE_POSTER_FRAME = 31;

// Render-only recentring (adaptation 1): motion bbox centre → 324-square centre.
const CENTER_SHIFT_X = 162 - 169.85;
const CENTER_SHIFT_Y = 162 - 128.65;

// Measured rig (adaptation 2: launchPhaseShift zeroed). ONE jump-and-settle
// profile — rest → extreme ease-out rise → apex → ease-in fall → a damped sine
// settle seeded by the landing speed — is replayed across five bodies at exact
// 4-frame offsets (the time delay). scaleY rides the profile's own velocity, and
// a satellite is flicked off at the landing. None of the cascade is choreographed
// per-body; it all falls out of the single profile plus the per-body time offset.
export const SEEDED_SETTLE_PARAMS: SeededSettleJumpParams = {
  periodFrames: SEEDED_SETTLE_PERIOD_FRAMES,
  staggerFrames: 4,
  launchPhaseShift: 0,
  dotCount: 5,
  dotCx0: 101.3,
  dotSpacing: 34.275,
  restCy: 171.5,
  sizeBasePx: 28.9,
  stretchK: 0.0313,
  jump: {
    tLift: 84.6,
    riseDur: 19.69,
    fallDur: 10.29,
    cyApex: 68.9,
    riseBezier: [0.746, 0.008, 0.196, 1.0],
    fallBezier: [0.79, 0.0, 0.789, 0.741],
    settleLambda: 0.17,
    settleOmega: 0.426,
  },
  satellite: {
    separationLocalFrame: 29,
    preSeparationFrames: 3,
    lifeFrames: 18,
    rAnchor: 9.3,
    rDecay: 0.89,
    cyAnchor: 155.3,
    cyAsymptote: 119.1,
    cyRatio: 0.901,
  },
};

const baseSchedule = createSeededSettleJumpSchedule(SEEDED_SETTLE_PARAMS);

/**
 * Five bodies at a loop frame, recentred for the demo stage. The base schedule
 * computes each in design space; the recentring shift is added LAST per position
 * field so each value equals the schedule's value plus the same constant —
 * render-only, the mechanism is untouched (and the design-space base is what the
 * article's skeleton is proven equal to). Sizes (width/height/r) are unshifted.
 */
export const seededSettleDotsAt = (frame: number): SeededSettleDotState[] =>
  baseSchedule(frame).map((d) => ({
    cx: d.cx + CENTER_SHIFT_X,
    cy: d.cy + CENTER_SHIFT_Y,
    width: d.width,
    height: d.height,
    satellite: d.satellite
      ? {
          cx: d.satellite.cx + CENTER_SHIFT_X,
          cy: d.satellite.cy + CENTER_SHIFT_Y,
          r: d.satellite.r,
        }
      : null,
  }));
