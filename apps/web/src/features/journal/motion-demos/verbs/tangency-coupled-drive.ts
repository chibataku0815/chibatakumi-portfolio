// Vendored — verbatim schedule logic from motion-grammar-lab.
//   source: packages/motion-grammar/src/tangency-coupled-drive.ts
//   upstream repo: forestone/motion-grammar-lab (private R&D)
//   provenance: promoted from studies/puttimw-motion-drawers cell #8
//     (drawer "linkage"/連動) — see that study's
//     validation/linkage-construction-record.md.
//   why vendored, not imported: the upstream package is private:true with a
//     Remotion-coupled barrel, so it is not consumable from this deployed app.
//     The schedule below is pure (numbers in → numbers out): its only
//     dependency is the cubic-bezier easing primitive in ./unit-bezier, which
//     is mathematically identical to CSS cubic-bezier(). No Remotion, no React,
//     no DOM — safe to run in an rAF loop. Keep in sync with upstream; do not
//     re-derive the math here.
//
// MECHANISM (load-bearing): one eased rotation driver geometrically derives
// its followers by a tangency (contact) constraint — 1-DOF coupling. A SINGLE
// driver angle θ(f) (a keyed, eased rotation ladder) drives everything. The
// followers are NOT keyed, staggered, or envelope-mapped — each translates
// just enough to stay tangent to (clear of) the rotating driver's support
// half-width, by a constant gap. A convex square's support half-width is
// 90°-periodic, so the apparent "hold" near 45° is the geometric dwell of
// tangency (the cosine's flat top), not a keyed plateau. Because
// rotate(90°) ≡ rotate(0°) for a square and disp = 0 at rest, the schedule
// self-seals at the loop boundary.

import { unitBezierY } from "./unit-bezier";

export interface TangencyDriverAngleKey {
  /** loop frame */
  t: number;
  /** rotation in degrees */
  deg: number;
}

export interface TangencyCoupledDriveParams {
  periodFrames: number;
  /** master rotation key ladder (e.g. 3 keys: 0 → 45 → 90) */
  thetaKeys: TangencyDriverAngleKey[];
  /** cubic-bezier ease per segment (thetaKeys.length − 1 entries) */
  segmentBeziers: [number, number, number, number][];
  /** TRUE square side (drives the tangency law; render calibration is the
   *  renderer's concern) */
  squareSidePx: number;
  /** clearance kept between the spinning square's half-width and the
   *  followers (px) */
  tangencyGapPx: number;
  /** shared row center (design px) */
  cyDesign: number;
  /** center (driver) square cx (design px) */
  groupCenterCxDesign: number;
  /** follower rest centers (design px) */
  restNeighborCxDesign: { left: number; right: number };
}

/** Axis-aligned follower square (translates in one axis only — derived,
 *  never keyed). */
export interface TangencyCoupledDriveFollowerState {
  cx: number;
  cy: number;
  side: number;
}

/** Driver square rotating in place about its own center. */
export interface TangencyCoupledDriveDriverState {
  cx: number;
  cy: number;
  side: number;
  thetaDeg: number;
}

export interface TangencyCoupledDriveState {
  center: TangencyCoupledDriveDriverState;
  neighbors: TangencyCoupledDriveFollowerState[];
  /** derived tangency displacement (exposed for tests/demos) */
  dispPx: number;
}

/** Master rotation at loop frame `local` (exact key values at key frames). */
export const tangencyDriverAngleDeg = (
  params: TangencyCoupledDriveParams,
  local: number,
): number => {
  const keys = params.thetaKeys;
  if (local <= keys[0].t) return keys[0].deg;
  const last = keys[keys.length - 1];
  if (local >= last.t) return last.deg;
  let i = 0;
  while (keys[i + 1].t < local) i += 1;
  const k0 = keys[i];
  const k1 = keys[i + 1];
  const p = (local - k0.t) / (k1.t - k0.t);
  return k0.deg + (k1.deg - k0.deg) * unitBezierY(...params.segmentBeziers[i], p);
};

/**
 * The tangency law — the whole coupling: followers clear the rotating square's
 * half-width by a constant gap. Derived, never keyed. A square's support
 * half-width is 90°-periodic (distance to the nearest diagonal), so the law
 * holds for any angle — a quarter-turn driver uses only [0°, 90°], where this
 * reduces exactly to |theta − 45|.
 */
export const tangencyClearanceDisp = (
  params: TangencyCoupledDriveParams,
  thetaDeg: number,
): number => {
  const s = params.squareSidePx;
  const mod = ((thetaDeg % 90) + 90) % 90;
  const phi = Math.abs(mod - 45);
  const halfWidth = (s / Math.SQRT2) * Math.cos((phi * Math.PI) / 180);
  return Math.max(0, halfWidth - s / 2 - params.tangencyGapPx);
};

export const createTangencyCoupledDriveSchedule = (
  params: TangencyCoupledDriveParams,
) => {
  return (frame: number): TangencyCoupledDriveState => {
    const local =
      ((frame % params.periodFrames) + params.periodFrames) %
      params.periodFrames;
    const thetaDeg = tangencyDriverAngleDeg(params, local);
    const disp = tangencyClearanceDisp(params, thetaDeg);
    const { cyDesign, squareSidePx, groupCenterCxDesign } = params;
    const { left, right } = params.restNeighborCxDesign;

    return {
      center: {
        cx: groupCenterCxDesign,
        cy: cyDesign,
        side: squareSidePx,
        thetaDeg,
      },
      neighbors: [
        { cx: left - disp, cy: cyDesign, side: squareSidePx },
        { cx: right + disp, cy: cyDesign, side: squareSidePx },
      ],
      dispPx: disp,
    };
  };
};
