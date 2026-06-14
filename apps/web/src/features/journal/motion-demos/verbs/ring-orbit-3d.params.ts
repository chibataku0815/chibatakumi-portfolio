// Demo parameters for the ring-orbit-3d (auto-orient) motion study.
//
// These are the ORIGIN cell's measurement-bound constants (drawer cell #6
// "auto-orient"/自動方向 — eight equal dots, two tones alternating, placed on a
// 3D ring tilted off the screen's vertical axis; the ring turns about that axis
// (parent dial, one turn per 90-frame loop) while the dots circulate about the
// ring's own normal (child dial, two turns per loop the other way); each dot is
// projected with ONE consistent-perspective factor m = 1 + depthK·z/R applied to
// position and radius alike, so the apparent ease, the vertical bob and the
// near/far swap all arise from the projection with no keyframe easing anywhere;
// 90-frame / 3s loop @ 30fps), copied from motion-grammar-lab
// studies/puttimw-motion-drawers/src/verbs/auto-orient.ts. The schedule math
// (and the small 3D vector kit it leans on) lives in the vendored
// ./ring-orbit-3d, ./ring3d and ./rotate-about-axis; this file only supplies the
// measured rig and the render-only recentring.
//
// Deliberate adaptations for this embedded demo (the allowed three only):
//   1. Recentring: the cell reserves a lower band for its "自動方向" kana label,
//      so the ring sits high. This label-free demo adds a render-only shift that
//      puts the ring's pivot (center) on the 324-square centre — the same
//      recentre the lab's finish deliverable applies. The parent rotation is
//      pivot-symmetric, so shifting the pivot centres the whole motion; the
//      shift is added LAST per dot, so every value equals the schedule's value
//      plus one constant and the mechanism is untouched.
//   2. No calibration to strip: the cell draws raw schedule cx/cy/r as plain
//      <circle>s (no registration or AA bias baked), so there is nothing to zero
//      beyond the recentre.
//   3. Colours are NOT carried. The cell binds study-side red/pink fills the
//      schedule never reads (it only emits a `dark` boolean per dot). The SVG
//      demo paints with the page ink (currentColor, the lighter tone dimmed);
//      the finish demo with the API-finish light palette (elem / edge).

import {
  createRingOrbitSchedule,
  type RingOrbitParams,
} from "./ring-orbit-3d";

export type RingOrbitDot = {
  cx: number;
  cy: number;
  r: number;
  dark: boolean;
  key: string;
};

export const RING_ORBIT_VIEWBOX = 324;
export const RING_ORBIT_PERIOD_FRAMES = 90;
export const RING_ORBIT_FPS = 30; // design contract: 90f = 3s loop

/**
 * Static fallback frame for prefers-reduced-motion: mid-loop (parent at 180°),
 * where the dot spread and the near/far swap read most clearly in one still. It
 * is also the lab's golden-hash anchor frame.
 */
export const RING_ORBIT_POSTER_FRAME = 45;

// Measured rig (no calibration baked, adaptation 2). Eight dots, dark = i%2===0,
// on a ring tilted off screen-vertical; parent dial = one turn/loop about the
// screen axis, child dial = two turns/loop (reversed) about the ring normal;
// depthK is the single perspective constant. Copied from auto-orient.ts
// autoOrientParams, minus the realization-only colours (adaptation 3).
export const RING_ORBIT_RIG: RingOrbitParams = {
  center: [156.697, 130.3202],
  ringRadius: 61.5399,
  count: 8,
  axis: [0, -1, 0],
  tiltDeg: 28.656,
  tiltAzimuthDeg: 281.0948,
  spinPhase0Deg: 43.2366,
  parentTurnsPerLoop: 1,
  spinTurnsPerLoop: -2,
  periodFrames: RING_ORBIT_PERIOD_FRAMES,
  depthK: 0.2167,
  darkRadiusPx: 16.3161,
  lightRadiusPx: 17.3246,
};

const baseSchedule = createRingOrbitSchedule(RING_ORBIT_RIG);

// Render-only recentring (adaptation 1): the parent rotation is pivot-symmetric
// about `center`, so putting `center` on the 324-square centre centres the whole
// motion envelope. Derived from the rig (no magic number).
const SHIFT = {
  x: RING_ORBIT_VIEWBOX / 2 - RING_ORBIT_RIG.center[0],
  y: RING_ORBIT_VIEWBOX / 2 - RING_ORBIT_RIG.center[1],
};

/**
 * All 8 dots at a loop frame, depth-sorted (far first so nearer dots paint on
 * top, matching the cell) and recentred for the demo stage. The shift is added
 * LAST so each value equals the schedule's value plus the same constant —
 * render-only, the mechanism is untouched.
 */
export const ringOrbitDotsAt = (frame: number): RingOrbitDot[] =>
  [...baseSchedule(frame)]
    .sort((a, b) => a.z - b.z)
    .map((d, k) => ({
      cx: d.cx + SHIFT.x,
      cy: d.cy + SHIFT.y,
      r: d.r,
      dark: d.dark,
      key: `dot-${k}`,
    }));
