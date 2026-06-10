// Vendored — verbatim schedule logic from motion-grammar-lab.
//   source: packages/motion-grammar/src/complement-tangent-pair.ts
//   upstream repo: forestone/motion-grammar-lab (private R&D)
//   provenance: promoted from studies/puttimw-motion-drawers cell #3
//     (drawer "inverse-proportion"/反比例) — see that study's
//     validation/inverse-proportion-construction-record.md.
//   why vendored, not imported: the upstream package is private:true with a
//     Remotion-coupled barrel, so it is not consumable from this deployed app.
//     The schedule below is pure (numbers in → numbers out): its only
//     dependency is the cubic-bezier easing primitive in ./unit-bezier, which
//     is mathematically identical to CSS cubic-bezier(). No Remotion, no React,
//     no DOM — safe to run in an rAF loop. Keep in sync with upstream; do not
//     re-derive the math here.
//
// MECHANISM (load-bearing): a complement-tangent pair. ONE master extent walks
// a key ladder (one cubic-bezier ease per segment); its partner is whatever
// keeps a conserved sum (complement = totalR − master). Each member is a
// circle anchored at a FIXED contact point on a FIXED axis, receding from that
// point by its own extent — so external tangency at the contact holds by
// construction, never keyed. One eased ladder + one conserved sum + one
// contact anchor produce the whole "one grows as the other shrinks, kiss point
// fixed" motion. The API owns only renderer-neutral schedule data; colors and
// realization stay with the consumer.

import { unitBezierY } from "./unit-bezier";

export interface ComplementTangentKey {
  /** loop frame (keys at 0 / mid / period — the loop cycle is the ladder) */
  t: number;
  /** master extent value at the key (px) */
  r: number;
}

export interface ComplementTangentPairParams {
  periodFrames: number;
  /** master extent key ladder (≥2 keys; first = last value for a sealed loop) */
  radiusKeys: ComplementTangentKey[];
  /** cubic-bezier ease per segment (radiusKeys.length − 1 entries) */
  segmentBeziers: [number, number, number, number][];
  /** conserved sum — the complement link rBR = totalR − rTL */
  totalRadiusPx: number;
  /** fixed contact (kiss) point in design px */
  contactDesign: [number, number];
  /** fixed axis angle (degrees; 0 = horizontal, 90 = vertical, 45 = TL→BR) */
  axisDeg: number;
}

export interface TangentCircle {
  cx: number;
  cy: number;
  r: number;
}

export interface ComplementTangentPairState {
  /** member receding along the −axis direction (master extent at rest) */
  tl: TangentCircle;
  /** member receding along the +axis direction (complement extent at rest) */
  br: TangentCircle;
  /** master extent (exposed for tests/demos) */
  rTL: number;
}

/** Master extent at loop frame `local` (exact key values at key frames). */
export const complementTangentMaster = (
  params: ComplementTangentPairParams,
  local: number,
): number => {
  const keys = params.radiusKeys;
  if (local <= keys[0].t) return keys[0].r;
  const last = keys[keys.length - 1];
  if (local >= last.t) return last.r;
  let i = 0;
  while (keys[i + 1].t < local) i += 1;
  const k0 = keys[i];
  const k1 = keys[i + 1];
  const p = (local - k0.t) / (k1.t - k0.t);
  return k0.r + (k1.r - k0.r) * unitBezierY(...params.segmentBeziers[i], p);
};

export const createComplementTangentPair = (
  params: ComplementTangentPairParams,
) => {
  const [cx, cy] = params.contactDesign;
  const rad = (params.axisDeg * Math.PI) / 180;
  const ux = Math.cos(rad);
  const uy = Math.sin(rad);

  return (frame: number): ComplementTangentPairState => {
    const local =
      ((frame % params.periodFrames) + params.periodFrames) %
      params.periodFrames;
    const rTL = complementTangentMaster(params, local);
    const rBR = params.totalRadiusPx - rTL;

    // anchor-at-contact: each center recedes from the fixed kiss point by its
    // own extent — external tangency at the contact holds by construction,
    // never keyed.
    return {
      tl: { cx: cx - rTL * ux, cy: cy - rTL * uy, r: rTL },
      br: { cx: cx + rBR * ux, cy: cy + rBR * uy, r: rBR },
      rTL,
    };
  };
};
