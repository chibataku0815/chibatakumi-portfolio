// Vendored — verbatim schedule logic from motion-grammar-lab.
//   source: packages/motion-grammar/src/shared-hold-pulse.ts
//   upstream repo: forestone/motion-grammar-lab (private R&D)
//   provenance: promoted from studies/puttimw-motion-drawers cell #7
//     (drawer "symmetry"/対称) — see that study's
//     validation/symmetry-construction-record.md.
//   why vendored, not imported: the upstream package is private:true with a
//     Remotion-coupled barrel, so it is not consumable from this deployed app.
//     The schedule below is pure (numbers in → numbers out): its only
//     dependency is the cubic-bezier easing primitive in ./unit-bezier, which
//     is mathematically identical to CSS cubic-bezier(). No Remotion, no React,
//     no DOM — safe to run in an rAF loop. Keep in sync with upstream; do not
//     re-derive the math here.
//
// MECHANISM (load-bearing): ONE shared rise-HOLD-fall pulse E(f) ∈ [0,1] —
// four integer keys [riseStart, riseEnd(=hold start), fallStart, fallEnd] +
// one shared cubic-bezier ease, the fall replaying the SAME bezier mirrored —
// drives every element simultaneously (stagger zero) through per-element
// amplitude reads:
//   quantity_i(f) = rest_i + amp_i · E(f)
// (height, width, signed outward x-offset, and optionally a rotation
// amplitude on the same pulse). The mirror-pair look is a PARAMS property
// (signed offsetAmp) — the schedule itself never distinguishes left from
// right. The plateau hold (E pinned at 1 between the middle keys) is the
// mechanism's distinguishing feature and the reason "hold" is in the name.

import { unitBezierY } from "./unit-bezier";

export interface SharedHoldPulseEnvelopeParams {
  periodFrames: number;
  /** [riseStart, riseEnd(=hold start), fallStart, fallEnd] — integer keyframes */
  keys: [number, number, number, number];
  /** shared cubic-bezier ease (the fall mirrors the rise) */
  bezier: [number, number, number, number];
}

export interface SharedHoldPulseElementSpec {
  restCx: number;
  restCy: number;
  restWidth: number;
  restHeight: number;
  /** width/2 = full-cap pill, small values = flat rounded square (shape family shared) */
  cornerRadius: number;
  widthAmp: number;
  heightAmp: number;
  /** outward x-offset amplitude. Sign is the direction (mirror pairs ∓/±, on-axis 0) */
  offsetAmp: number;
  /** rotation amplitude (deg) on the same pulse — plateau/rest aligned spin; 0 if unused */
  rotationAmpDeg: number;
}

export interface SharedHoldPulseParams {
  envelope: SharedHoldPulseEnvelopeParams;
  elements: SharedHoldPulseElementSpec[];
}

export interface SharedHoldPulseElementState {
  cx: number;
  cy: number;
  width: number;
  height: number;
  cornerRadius: number;
  rotationDeg: number;
}

/** master pulse E(f) ∈ [0,1] — rise / hold / fall (the fall mirrors the same bezier) */
export const sharedHoldPulseEnvelope = (
  env: SharedHoldPulseEnvelopeParams,
  frame: number,
): number => {
  const local = ((frame % env.periodFrames) + env.periodFrames) % env.periodFrames;
  const [t0, t1, t2, t3] = env.keys;
  const [x1, y1, x2, y2] = env.bezier;
  if (local < t0) return 0;
  if (local < t1) return unitBezierY(x1, y1, x2, y2, (local - t0) / (t1 - t0));
  if (local <= t2) return 1;
  if (local <= t3) return 1 - unitBezierY(x1, y1, x2, y2, (local - t2) / (t3 - t2));
  return 0;
};

/**
 * shared-hold-pulse schedule — ONE master pulse drives every element's
 * amplitude reads simultaneously. All values are pure numbers. Timing (keys)
 * and amplitudes are arguments, so the same rig serves other objects and
 * other timings as-is.
 */
export const createSharedHoldPulseSchedule = (params: SharedHoldPulseParams) => {
  return (frame: number): SharedHoldPulseElementState[] => {
    const e = sharedHoldPulseEnvelope(params.envelope, frame);
    return params.elements.map((el) => ({
      cx: el.restCx + el.offsetAmp * e,
      cy: el.restCy,
      width: el.restWidth + el.widthAmp * e,
      height: el.restHeight + el.heightAmp * e,
      cornerRadius: el.cornerRadius,
      rotationDeg: el.rotationAmpDeg * e,
    }));
  };
};
