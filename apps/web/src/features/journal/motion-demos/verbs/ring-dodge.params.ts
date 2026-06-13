// Demo parameters for the ring-dodge (interference) motion study.
//
// These are the ORIGIN cell's measurement-bound constants (drawer cell #17
// "interference"/干渉 — one inner dot on a pure linear orbit, plus 8 ring dots
// each running ONE authored radial pulse replicated on an integer 11-frame
// clock, with two inverse-square proximity "dodge" fields read off the
// orbiter's actual position; 90-frame / 3s loop @ 30fps), copied from
// motion-grammar-lab studies/puttimw-motion-drawers/src/verbs/interference.ts.
// The schedule math itself lives in the vendored ./ring-dodge
// (createRingDodgeSchedule); this file only supplies the measured rig + the
// render-only recentring.
//
// Deliberate adaptations for this embedded demo (the allowed three only):
//   1. Recentring: the cell reserves a lower band for its "干渉" kana label, so
//      the figure sits high. This label-free demo adds a render-only shift so
//      the motion's full-loop bbox centre lands on the 324-square centre — the
//      same recentre the lab's finish deliverable applies. It is derived by
//      sweeping the schedule (no magic number) and added LAST per position, so
//      every value equals the schedule's value plus one constant; the mechanism
//      is untouched (the design-space base is what the article skeleton is
//      proven equal to).
//   2. No calibration to strip: unlike offset, interference bakes NO +0.5
//      registration or +0.33 AA bias — the cell draws raw schedule cx/cy/r — so
//      there is nothing to preserve or zero beyond the recentre.
//   3. Colours are NOT carried. The cell binds a study-side blue fill the
//      schedule never reads; the inner dot and all 8 ring dots share ONE tone
//      (single-tone). The SVG demo paints with the page ink (currentColor), the
//      finish demo with the API-finish light palette.

import {
  createRingDodgeSchedule,
  type RingDodgeRig,
} from "./ring-dodge";

export type RingDodgeCircle = { cx: number; cy: number; r: number; key: string };

export const RING_DODGE_VIEWBOX = 324;
export const RING_DODGE_PERIOD_FRAMES = 90;
export const RING_DODGE_FPS = 30; // design contract: 90f = 3s loop

/**
 * Static fallback frame for prefers-reduced-motion: the orbiter is mid-pass of a
 * ring dot here, so a clear pop (and the antipode sink) reads in one still.
 */
export const RING_DODGE_POSTER_FRAME = 22;

// Measured rig (no calibration baked, adaptation 2). One inner dot on a pure
// linear orbit (4°/frame, one revolution per 90-frame loop, no easing) and 8
// ring dots, each replaying ONE authored radial pulse offset by an integer
// 11-frame clock (a blind metronome — it does NOT track the orbiter), with two
// inverse-square proximity fields nudging each dot away from the passing
// orbiter: a radial push and a tangential slide, both using the pulsed (actual)
// distance so an already-pushed dot is dodged more weakly.
export const RING_DODGE_RIG: RingDodgeRig = {
  periodFrames: RING_DODGE_PERIOD_FRAMES,
  ringCenter: [163.0, 129.5],
  innerOrbitRadiusPx: 41.8,
  innerAngularVelocityDegPerFrame: 4.0,
  innerStartAngleDeg: 4.1,
  innerRenderRadiusPx: 11.4,
  outerRestRadiusPx: 66.4,
  outerRenderRadiusPx: 18.4,
  outerRestAnglesDeg: [0, 45, 90, 135, 180, 225, 270, 315],
  pulseClockFrames: 11.0,
  pulseAnchorFrame: 3.2,
  pulseCycle: {
    attackStartTau: 82.3,
    peakValue: 10.6,
    decayZeroTau: 11.88,
    attackBez: [0.45, 1.11, 0.98, 0.91],
    decayBez: [0.76, 0.0, 0.77, 0.61],
    settleLambda: 0.22,
    settleOmega: 0.27,
  },
  tangentialDodge: { strengthPx3: 8850.0, exponent: 2.0 },
  radialDodge: { strengthPx3: 2700.0, exponent: 2.0 },
};

const baseSchedule = createRingDodgeSchedule(RING_DODGE_RIG);

// Render-only recentring (adaptation 1): sweep the whole loop, take the bbox of
// every circle over all frames, and shift its midpoint to the 324-square centre.
const computeRecenterShift = () => {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let f = 0; f < RING_DODGE_RIG.periodFrames; f += 1) {
    const s = baseSchedule(f);
    for (const d of [s.inner, ...s.outer]) {
      minX = Math.min(minX, d.cx - d.r);
      maxX = Math.max(maxX, d.cx + d.r);
      minY = Math.min(minY, d.cy - d.r);
      maxY = Math.max(maxY, d.cy + d.r);
    }
  }
  const half = RING_DODGE_VIEWBOX / 2;
  return { x: half - (minX + maxX) / 2, y: half - (minY + maxY) / 2 };
};

const SHIFT = computeRecenterShift();

/**
 * All 9 circles at a loop frame, recentred for the demo stage. Outer ring dots
 * are drawn first (so the inner orbiter paints on top, matching the cell). The
 * shift is added LAST so each value equals the schedule's value plus the same
 * constant — render-only, the mechanism is untouched.
 */
export const ringDodgeDotsAt = (frame: number): RingDodgeCircle[] => {
  const s = baseSchedule(frame);
  const outer = s.outer.map((d, k) => ({
    cx: d.cx + SHIFT.x,
    cy: d.cy + SHIFT.y,
    r: d.r,
    key: `ring-${k}`,
  }));
  return [
    ...outer,
    { cx: s.inner.cx + SHIFT.x, cy: s.inner.cy + SHIFT.y, r: s.inner.r, key: "orbiter" },
  ];
};
