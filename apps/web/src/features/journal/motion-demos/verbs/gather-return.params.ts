// Demo parameters for the gather-return motion study.
//
// These are the ORIGIN cell's measurement-bound constants (drawer cell #12
// "merge-split"/一体化と分離 — eight circles on a turning ring diving one by
// one into a square-root-growing center disc and returning; 90-frame / 3s
// loop @ 30fps), copied from motion-grammar-lab
// studies/puttimw-motion-drawers/src/verbs/merge-split.ts. What the lab
// promoted to packages is the timing clip alone (./gather-return); the ring
// assembly (ring layout × per-copy stagger × constant parent rotation ×
// mass-conserving center) is the drawer concept and lives study-side upstream
// — this file transcribes that assembly verbatim on top of the vendored clip.
// Deliberate adaptations for this embedded demo (the allowed three only):
//   1. Recentring: the upstream design cell sits at ring center (163, 127)
//      inside its asymmetric cell crop; the demo stage is a 324 square, so the
//      center moves to (162, 162) — the same shift the lab's own finish
//      deliverable applies (render-only). Ring radius, dot radius, core
//      radius, rotation rate, stagger, clip phase and all segment lengths stay
//      exactly as measured.
//   2. No raster-calibration artifact exists on this cell's schedule —
//      nothing to zero out.
//   3. Colours are NOT carried. Upstream binds a study-side fill the schedule
//      itself never reads. The SVG demo paints core + dots with the page's
//      substrate ink (currentColor), the finish demo with the API-finish light
//      palette. Single fill is load-bearing, not palette policy: merge/split
//      topology exists only as the union of same-color circles — the schedule
//      keeps no merge bookkeeping anywhere.

import {
  makeAbsorb,
  makeGatherReturn,
  type GatherReturnTiming,
} from "./gather-return";

export const GATHER_RETURN_VIEWBOX = 324;
export const GATHER_RETURN_PERIOD_FRAMES = 90;
export const GATHER_RETURN_FPS = 30; // design contract: 90f = 3s loop

/**
 * Static fallback frame for prefers-reduced-motion: a mixed pose — the center
 * disc mid-meal with several circles still in flight, the mechanism's most
 * legible single frame.
 */
export const GATHER_RETURN_POSTER_FRAME = 30;

// Measurement-bound constants (upstream verbs/merge-split.ts).
const CENTER_X = 162; // upstream 163 → recentred (adaptation 1)
const CENTER_Y = 162; // upstream 127 → recentred (adaptation 1)
const RING_RADIUS = 61.5;
const COPY_COUNT = 8;
const DOT_RADIUS = 11;
const CORE_FULL_RADIUS = 35;
const RING_START_DEG = -88; // measured ring phase at the loop head
const TURN_DEG_PER_FRAME = 2; // constant parent rotation — half a turn per loop
const STAGGER_FRAMES = 3; // per-copy clip delay
const CLIP_SHIFT_FRAMES = 44; // reference loop starts in the all-merged state
const MIN_VISIBLE_CORE_RADIUS = 0.5; // skip drawing a sub-pixel core

// Master-clip segment lengths (reference-measured): dive 13 / center 44 /
// out-and-settle 11 / ring rest 22 (= 90 − 13 − 44 − 11).
const TIMING: GatherReturnTiming = { gather: 13, hold: 44, back: 11, period: 90 };

const progress = makeGatherReturn(TIMING);
const absorb = makeAbsorb(TIMING);

export interface GatherReturnDotState {
  cx: number;
  cy: number;
  r: number;
}

export interface GatherReturnSceneState {
  /** center disc (null while fully dispersed) */
  core: GatherReturnDotState | null;
  /** the 8 ring copies (a gathered copy hides under the core) */
  dots: GatherReturnDotState[];
}

/**
 * The drawer assembly, transcribed verbatim from the study schedule
 * (createMergeSplitSchedule): ring layout × per-copy stagger × constant
 * parent rotation × mass-conserving square-root center. Proven equal to the
 * study schedule over all 90 frames (Object.is, centers aligned) — see the
 * article's verification script.
 */
export const gatherReturnSchedule = (frame: number): GatherReturnSceneState => {
  const ring = Array.from({ length: COPY_COUNT }, (_, i) => {
    const a =
      ((RING_START_DEG + TURN_DEG_PER_FRAME * frame + (360 / COPY_COUNT) * i) *
        Math.PI) /
      180;
    return {
      x: CENTER_X + RING_RADIUS * Math.cos(a),
      y: CENTER_Y + RING_RADIUS * Math.sin(a),
    };
  });
  const locals = ring.map(
    (_, i) => frame + CLIP_SHIFT_FRAMES - i * STAGGER_FRAMES,
  );

  const dots = ring.map((pt, i) => {
    const p = progress(locals[i]);
    return {
      cx: pt.x + (CENTER_X - pt.x) * p,
      cy: pt.y + (CENTER_Y - pt.y) * p,
      r: DOT_RADIUS,
    };
  });

  const share =
    locals.map((f) => absorb(f)).reduce((sum, a) => sum + a, 0) / COPY_COUNT;
  const coreR = CORE_FULL_RADIUS * Math.sqrt(share);
  return {
    core:
      coreR > MIN_VISIBLE_CORE_RADIUS
        ? { cx: CENTER_X, cy: CENTER_Y, r: coreR }
        : null,
    dots,
  };
};
