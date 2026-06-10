// Demo parameters for the complement-tangent-pair motion study.
//
// These are the ORIGIN cell's measurement-bound constants (two kissing circles
// on the 45° diagonal, 90-frame / 3s loop @ 30fps), copied from
// motion-grammar-lab studies/puttimw-motion-drawers/src/verbs/
// inverse-proportion.ts (inverseProportionParams).
// Three deliberate adaptations for this embedded demo:
//   1. The fixed contact (kiss) point is recentred on the demo viewBox centre —
//      upstream it sat at (163, 127.8) in the reference crop (the row-2 shared
//      anchor). The radius ladder, the conserved sum and the 45° axis are
//      preserved exactly; only the anchor moves.
//   2. The upstream SVG realization draws radii with a render-calibrated
//      +0.5px offset (half-coverage vs hard-threshold mask convention; the 2δ
//      kiss overlap also keeps the rasterized pair one connected component for
//      the footprint gate). That is a calibration, not geometry — radii here
//      stay at the TRUE construction values, uncorrected.
//   3. Colours are NOT carried. The schedule is pure geometry; the SVG demo
//      paints with the site's substrate ink (currentColor) and the finish demo
//      with the API-finish light palette, not the reference cell's blue.
// The 3-key radius ladder + per-segment handles, the conserved sum 81 and the
// exact 45° axis — i.e. the motion knowledge itself — are kept faithful.

import { createComplementTangentPair } from "./complement-tangent-pair";
import type { ComplementTangentPairParams } from "./complement-tangent-pair";

export const COMPLEMENT_TANGENT_VIEWBOX = 240;
export const COMPLEMENT_TANGENT_PERIOD_FRAMES = 90;
export const COMPLEMENT_TANGENT_FPS = 30; // design contract: 90f = 3s loop

/**
 * The most legible single frame — both radii exactly at their keyed values
 * (54 / 27, the 2:1 author pose), the kiss point visible between them.
 * Used as the static fallback for prefers-reduced-motion.
 */
export const COMPLEMENT_TANGENT_REST_FRAME = 0;

export const complementTangentPairParams: ComplementTangentPairParams = {
  periodFrames: 90,
  radiusKeys: [
    { t: 0, r: 54 }, // rest crest — the loop seam IS the key
    { t: 45, r: 27 }, // half-loop mid key (rendered min lands ~44.1 via overshoot)
    { t: 90, r: 54 }, // = next loop's frame 0 (structural seal)
  ],
  segmentBeziers: [
    [0.777, 0.029, 0.173, 1.016], // shrink: long shoulder, settle-overshoot tail
    [0.765, 0.02, 0.155, 1.024], // grow: long shoulder, settle-overshoot tail
  ],
  totalRadiusPx: 81,
  // upstream contact: (163, 127.8) — recentred to the 240-viewBox centre
  // (shift −43, −7.8; adaptation 1 above)
  contactDesign: [120, 120],
  axisDeg: 45,
};

export const complementTangentPairSchedule = createComplementTangentPair(
  complementTangentPairParams,
);
