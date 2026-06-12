// Vendored — verbatim schedule logic from motion-grammar-lab.
//   source: packages/motion-grammar/src/coupled-shear-rotation.ts
//   upstream repo: forestone/motion-grammar-lab (private R&D)
//   provenance: promoted from studies/puttimw-motion-drawers cell #10
//     (drawer "split"/分割) — see that study's
//     validation/split-construction-record.md.
//   why vendored, not imported: the upstream package is private:true with a
//     Remotion-coupled barrel, so it is not consumable from this deployed app.
//     The schedule below is pure (numbers in → numbers out): its only
//     dependency is the cubic-bezier easing primitive in ./unit-bezier, which
//     is mathematically identical to CSS cubic-bezier(). No Remotion, no React,
//     no DOM — safe to run in an rAF loop. Keep in sync with upstream; do not
//     re-derive the math here. Everything below the import line is
//     byte-identical to the upstream file below its import line.
//
// MECHANISM (load-bearing): ONE master phase u(frame): 0→2 per loop drives
// BOTH the group rotation G = groupTurnDeg·u/2 about the center AND the
// opposed shear slide s = slideMaxPx·(1 − |1 − u|) along the cut (out at u=1,
// back at u=2 — the slide returns while the rotation keeps accumulating). The
// pair is point-symmetric (pieceB = 2·center − pieceA); each piece is nudged
// min(s, seamInsetPx) INTO its partner so the S-neck seam never opens a
// hairline gap. All easing lives in u(t): two cubic-bezier beats (open /
// close) between keyframes tOpen → tMid → tClose; outside them the rig rests.
// The loop seals at the UNION level: u=2 leaves the pair rotated +90° at
// rest, which a single-fill full shape hides (pair-swap-equivalent).

import { unitBezierY } from "./unit-bezier";

/** frame → loop-local frame in [0, period). Safe for negative frames.
 *  (inlined from studies/puttimw-motion-drawers/src/lib/loop — the only
 *  non-verbatim edit vs the study verb; render-byte covers it.) */
const loopFrame = (frame: number, period: number): number =>
  ((frame % period) + period) % period;

/**
 * One half-disc piece in DESIGN-cell coordinates: the disc of radius `r` at
 * (cx, cy) clipped to the half-plane whose inward normal points at
 * `chordNormalDeg` (deg, image y-down); the semicircle bulges toward it.
 */
export interface CoupledShearRotationPieceState {
  cx: number;
  cy: number;
  r: number;
  chordNormalDeg: number;
}

export interface CoupledShearRotationState {
  /** master phase in [0, 2] — the rig's only animated DOF */
  u: number;
  /** group rotation about the center, deg (G = groupTurnDeg·u/2) */
  groupRotationDeg: number;
  /** shear slide along the cut, px */
  slidePx: number;
  pieces: [CoupledShearRotationPieceState, CoupledShearRotationPieceState];
}

export interface CoupledShearRotationParams {
  periodFrames: number;
  center: [number, number];
  radiusPx: number;
  /** rest chord direction, deg (90 = vertical cut) */
  cutAngleDeg: number;
  /** perpendicular nudge of each piece into its partner, px (fades in: min(s, inset)) */
  seamInsetPx: number;
  slideMaxPx: number;
  /** TOTAL group turn over the loop, deg (G reaches this at u=2) */
  groupTurnDeg: number;
  /** u-curve keyframes (loop-local frames) and per-beat unit beziers */
  tOpen: number;
  tMid: number;
  tClose: number;
  bezierOpen: [number, number, number, number];
  bezierClose: [number, number, number, number];
}

/** master phase u(loop-local frame) ∈ [0, 2] */
export const coupledShearRotationMasterPhase = (
  local: number,
  p: CoupledShearRotationParams,
): number => {
  if (local <= p.tOpen) return 0;
  if (local < p.tMid) {
    const [p1x, p1y, p2x, p2y] = p.bezierOpen;
    return unitBezierY(p1x, p1y, p2x, p2y, (local - p.tOpen) / (p.tMid - p.tOpen));
  }
  if (local < p.tClose) {
    const [p1x, p1y, p2x, p2y] = p.bezierClose;
    return 1 + unitBezierY(p1x, p1y, p2x, p2y, (local - p.tMid) / (p.tClose - p.tMid));
  }
  return 2;
};

export const createCoupledShearRotationSchedule = (
  params: CoupledShearRotationParams,
) => {
  const [cxC, cyC] = params.center;
  const cut = (params.cutAngleDeg * Math.PI) / 180;
  // û = chord direction; vA = bulge direction of piece A = Rot(+90°)û (y-down)
  const ux = Math.cos(cut);
  const uy = Math.sin(cut);
  const vx = -uy;
  const vy = ux;

  return (frame: number): CoupledShearRotationState => {
    const local = loopFrame(frame, params.periodFrames);
    const u = coupledShearRotationMasterPhase(local, params);
    const G = (params.groupTurnDeg * u) / 2;
    const s = params.slideMaxPx * (1 - Math.abs(1 - u));
    const inset = Math.min(s, params.seamInsetPx);
    // piece A local offset in the REST frame, then group-rotated about center
    const lx = -vx * inset - ux * s;
    const ly = -vy * inset - uy * s;
    const g = (G * Math.PI) / 180;
    const cg = Math.cos(g);
    const sg = Math.sin(g);
    const ax = cxC + cg * lx - sg * ly;
    const ay = cyC + sg * lx + cg * ly;
    const normalA = params.cutAngleDeg + 90 + G;
    const pieceA: CoupledShearRotationPieceState = {
      cx: ax,
      cy: ay,
      r: params.radiusPx,
      chordNormalDeg: normalA,
    };
    const pieceB: CoupledShearRotationPieceState = {
      cx: 2 * cxC - ax,
      cy: 2 * cyC - ay,
      r: params.radiusPx,
      chordNormalDeg: normalA + 180,
    };
    return { u, groupRotationDeg: G, slidePx: s, pieces: [pieceA, pieceB] };
  };
};
