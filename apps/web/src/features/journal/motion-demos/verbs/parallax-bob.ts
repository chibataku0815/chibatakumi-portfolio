// Vendored — verbatim motion grammar from motion-grammar-lab.
//   source: packages/motion-grammar/src/parallax-bob.ts
//   upstream repo: forestone/motion-grammar-lab (private R&D)
//   provenance: promoted from studies/puttimw-motion-drawers cell #5
//     (drawer "parallax"/視差) — see that study's
//     validation/parallax-construction-record.md and
//     parallax-bob-promotion-record.md.
//   why vendored, not imported: the upstream package is private:true with a
//     Remotion-coupled barrel, so it is not consumable from this deployed app.
//     The module below is pure (numbers in → numbers out) — its only dependency
//     is the sibling ./unit-bezier easing primitive (also vendored, byte-
//     identical). No Remotion, no React, no DOM — safe in an rAF loop. Keep in
//     sync with upstream; do not re-derive the math here. Everything below this
//     header comment is byte-identical to the entire upstream file. The measured
//     element ladder and the demo recentring live in ./parallax-bob.params.ts.

// Parallax-bob grammar.
//
// N fixed-position, fixed-radius elements all share the SAME eased periodic
// waveform — a single 3-key bob (top → bottom → top, equal split, speed-0 at
// every key, one cubic-bezier per segment) with ZERO phase offset — and differ
// ONLY in their authored amplitude and mid. The parallax read is the amplitude
// ladder, not phase and NOT a depth law (amp ∝ r was REJECTED in the
// originating cell: ratios scatter 2.0–3.7 with no rational ladder). The
// waveform is generated parametrically from (keys, two beziers) alone — no
// sampled series.
//
// The API owns only renderer-neutral schedule data. Colors and the SVG
// realization stay in the consuming study, kept verbatim from the originating
// parallax cell so the move is a pure relocation. Field/type names
// (SharedEasedBobRig, ParallaxElement, ParallaxBobParams, ParallaxDotState,
// createSharedEasedWave, createParallaxBobSchedule; cx/midCy/ampPx/rPx, cx/cy/r)
// are preserved for consumer compat.

import { unitBezierY, type UnitBezier } from "./unit-bezier";

/** Shared 3-key eased bob rig: top(0) → bottom(splitFrame) → top(period). */
export interface SharedEasedBobRig {
  periodFrames: number;
  /** bottom-key frame in design time (top keys sit at 0 and period) */
  bottomKeyFrame: number;
  /** descent (top→bottom) segment ease, speed-0 at both keys */
  descBezier: UnitBezier;
  /** ascent (bottom→top) segment ease, speed-0 at both keys */
  ascBezier: UnitBezier;
}

export interface ParallaxElement {
  cx: number;
  midCy: number;
  ampPx: number;
  rPx: number;
}

export interface ParallaxBobParams {
  rig: SharedEasedBobRig;
  /**
   * capture-alignment calibration: the reference capture loop starts 1 frame
   * BEFORE the top key, so design_t = capture_f + 1 (mod period). Pure
   * calibration constant (time-delay launchPhaseShift precedent) — the
   * construction itself is phase-free.
   */
  capturePhaseShiftFrames: number;
  /** authored per-element ladder (amp ∝ r rejected — bound, not derived) */
  elements: ParallaxElement[];
  /**
   * raster registration calibration: rendered-vs-reference binary centroids
   * showed a UNIFORM (−0.57, −0.55)px offset across all 7 elements × 4 anchor
   * frames (per-blob, thr-40) — a crop-vs-design grid constant, not geometry
   * (curated ADJ8 precedent, re-derived independently). Added once here.
   */
  registrationOffsetDesign: { dx: number; dy: number };
  /**
   * AA-edge radius calibration: a crisp SVG circle of radius R reads +0.4px
   * larger than the reference's soft edge under the thr-40 footprint mask —
   * ADDITIVE and constant across r 5.4→27.6 (per-blob dr +0.34…+0.51, no
   * radius trend), unlike curated ADJ5's multiplicative 0.98. Subtracted once.
   */
  radiusAaBiasPx: number;
}

/**
 * Shared eased waveform w(designT) ∈ [−1, +1]: −1 at the top keys (designT 0,
 * period), +1 at the bottom key. Generated from the rig alone — parametric,
 * no sample tables. w(0) === w(period) exactly (loop seal by construction).
 */
export const createSharedEasedWave = (rig: SharedEasedBobRig) => {
  const { periodFrames, bottomKeyFrame, descBezier, ascBezier } = rig;
  return (designT: number): number => {
    const t = ((designT % periodFrames) + periodFrames) % periodFrames;
    if (t <= bottomKeyFrame) {
      return -1 + 2 * unitBezierY(...descBezier, t / bottomKeyFrame);
    }
    return 1 - 2 * unitBezierY(...ascBezier, (t - bottomKeyFrame) / (periodFrames - bottomKeyFrame));
  };
};

export interface ParallaxDotState {
  cx: number;
  cy: number;
  r: number;
}

export const createParallaxBobSchedule = (params: ParallaxBobParams) => {
  const wave = createSharedEasedWave(params.rig);
  const { dx, dy } = params.registrationOffsetDesign;
  return (frame: number): ParallaxDotState[] => {
    const w = wave(frame + params.capturePhaseShiftFrames);
    return params.elements.map((e) => ({
      cx: e.cx + dx,
      cy: e.midCy + e.ampPx * w + dy,
      r: e.rPx - params.radiusAaBiasPx,
    }));
  };
};
