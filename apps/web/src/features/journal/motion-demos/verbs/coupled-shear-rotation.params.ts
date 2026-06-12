// Demo parameters for the coupled-shear-rotation motion study.
//
// These are the ORIGIN cell's measurement-bound constants (drawer cell #10
// "split"/分割 — a disc cleaved by a vertical chord, the two halves shearing
// apart into an S while the whole group quarter-turns, then sealing back into
// one disc; 90-frame / 3s loop @ 30fps), copied from motion-grammar-lab
// studies/puttimw-motion-drawers/src/verbs/split.ts (splitParams). Deliberate
// adaptations for this embedded demo (the allowed three only):
//   1. Recentring: the upstream design cell sits at center (169.731, 120.091)
//      inside its asymmetric cell crop; the demo stage is a 324 square, so the
//      center moves to (162, 162) — the same shift the lab's own finish
//      deliverable applies (centerShift x −7.731 / y +41.909, render-only).
//      Radius, slide, inset, every timing value and both beziers stay exactly
//      as measured.
//   2. No raster-calibration artifact exists on this cell's schedule —
//      nothing to zero out.
//   3. Colours are NOT carried. Upstream binds a study-side fill (fillRgb)
//      the schedule itself never reads; the package params are colour-free by
//      design. The SVG demo paints both pieces with the site's substrate ink
//      (currentColor), the finish demo with the API-finish light palette.
//      Single fill is load-bearing here, not just palette policy: the loop
//      seals because the recombined disc hides its quarter-turn — a two-tone
//      split would hard-cut at the seam (lab generality-demo finding).

import {
  createCoupledShearRotationSchedule,
  type CoupledShearRotationParams,
  type CoupledShearRotationPieceState,
} from "./coupled-shear-rotation";

export const COUPLED_SHEAR_VIEWBOX = 324;
export const COUPLED_SHEAR_PERIOD_FRAMES = 90;
export const COUPLED_SHEAR_FPS = 30; // design contract: 90f = 3s loop

/**
 * Static fallback frame for prefers-reduced-motion: peak separation — maximum
 * shear slide with the group mid-turn, the mechanism's distinguishing pose
 * (the S silhouette).
 */
export const COUPLED_SHEAR_POSTER_FRAME = 45;

export const coupledShearParams: CoupledShearRotationParams = {
  periodFrames: 90,
  center: [162, 162], // upstream [169.731, 120.091] → recentred (adaptation 1)
  radiusPx: 42.345,
  cutAngleDeg: 90, // vertical cut
  seamInsetPx: 1.177,
  slideMaxPx: 41.55, // 0.9812 R measured — deliberately NOT snapped to R
  groupTurnDeg: 90,
  tOpen: 5.96,
  tMid: 44.5,
  tClose: 82.27,
  bezierOpen: [0.526, 0.003, 0.204, 1.0],
  bezierClose: [0.805, 0.026, 0.352, 0.761],
};

export const coupledShearSchedule =
  createCoupledShearRotationSchedule(coupledShearParams);

/**
 * Half-disc piece path: the disc of radius r at (cx, cy) cut by the diameter
 * chord perpendicular to chordNormalDeg; the semicircle bulges toward that
 * normal. Endpoints e1 = O + r·t̂, e2 = O − r·t̂ (t̂ ⟂ normal), arc sweep 0.
 * Copied verbatim from the lab's fidelity-cell realization (SplitCell
 * piecePath) — the SVG demo and the finish painter share it.
 */
export const piecePath = ({
  cx,
  cy,
  r,
  chordNormalDeg,
}: CoupledShearRotationPieceState): string => {
  const n = (chordNormalDeg * Math.PI) / 180;
  const mx = Math.cos(n);
  const my = Math.sin(n);
  const tx = -my;
  const ty = mx;
  const e1x = cx + r * tx;
  const e1y = cy + r * ty;
  const e2x = cx - r * tx;
  const e2y = cy - r * ty;
  return `M ${e1x.toFixed(3)} ${e1y.toFixed(3)} A ${r} ${r} 0 0 0 ${e2x.toFixed(3)} ${e2y.toFixed(3)} Z`;
};
