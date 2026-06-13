// Demo parameters for the parallax-bob motion study.
//
// These are the ORIGIN cell's measurement-bound constants (drawer cell #5
// "parallax"/視差 — seven fixed-position, fixed-radius circles bobbing on one
// shared vertical waveform; 90-frame / 3s loop @ 30fps), copied from
// motion-grammar-lab studies/puttimw-motion-drawers/src/verbs/parallax.ts. The
// schedule math itself lives in the vendored ./parallax-bob (createSharedEasedWave
// + createParallaxBobSchedule); this file only supplies the measured rig + the
// amplitude ladder, and the render-only recentring.
//
// Deliberate adaptations for this embedded demo (the allowed three only):
//   1. Recentring: the cell reserves a lower band for its "視差" kana label, so
//      the bob group sits high in the 324 design cell. This label-free demo adds
//      a render-only vertical shift so the motion's bbox centre (~128.25) lands
//      on the 324-square centre — the same vertical recentre the lab's own finish
//      deliverable applies. X is already centred (~163.65) and is left untouched.
//   2. Raster-calibration ZEROED: the cell's schedule carries a registration
//      offset (0.57, 0.55)px and a +0.4px AA-edge radius bias, both tuned to make
//      the rendered SVG match a reference RASTER footprint. This demo renders
//      fresh SVG with no reference raster, so both are set to 0 — the pure
//      measured radii and positions are used (this also keeps the radius ratios
//      faithful, which the constant AA bias slightly distorted).
//   3. Colours are NOT carried. The cell binds a study-side red fill the schedule
//      never reads. The SVG demo paints with the page ink (currentColor), the
//      finish demo with the API-finish light palette.

import {
  createParallaxBobSchedule,
  type ParallaxBobParams,
  type ParallaxDotState,
} from "./parallax-bob";

export const PARALLAX_VIEWBOX = 324;
export const PARALLAX_PERIOD_FRAMES = 90;
export const PARALLAX_FPS = 30; // design contract: 90f = 3s loop

/**
 * Static fallback frame for prefers-reduced-motion: partway down the descent,
 * where the seven circles sit at clearly different heights and the spread reads.
 */
export const PARALLAX_POSTER_FRAME = 33;

// Render-only recentring (adaptation 1): vertical bbox centre → 324-square centre.
const CENTER_SHIFT_X = 0;
const CENTER_SHIFT_Y = 162 - 128.25;

// Measured rig + 7-element amplitude ladder (adaptation 2: calibration zeroed).
// All seven circles share ONE eased 3-key bob (top f0 → bottom f45 → top f90,
// equal split, speed-0 at every key, one cubic-bezier per segment) with zero phase
// offset, and differ only in their authored amp + mid — amp ∝ r was rejected in
// the originating cell, so the ladder is bound, not derived.
export const PARALLAX_PARAMS: ParallaxBobParams = {
  rig: {
    periodFrames: PARALLAX_PERIOD_FRAMES,
    bottomKeyFrame: 45,
    descBezier: [0.71, 0, 0.24, 1],
    ascBezier: [0.74, 0, 0.26, 1],
  },
  capturePhaseShiftFrames: 1,
  elements: [
    { cx: 96.8, midCy: 118.5, ampPx: 40.6, rPx: 15.5 },
    { cx: 123.8, midCy: 177.9, ampPx: 29.6, rPx: 8.3 },
    { cx: 125.8, midCy: 110.1, ampPx: 20.6, rPx: 5.4 },
    { cx: 169.6, midCy: 131.0, ampPx: 64.8, rPx: 27.6 },
    { cx: 218.1, midCy: 171.0, ampPx: 26.7, rPx: 12.4 },
    { cx: 224.7, midCy: 74.4, ampPx: 33.2, rPx: 8.1 },
    { cx: 239.3, midCy: 144.8, ampPx: 20.0, rPx: 6.7 },
  ],
  registrationOffsetDesign: { dx: 0, dy: 0 },
  radiusAaBiasPx: 0,
};

const baseSchedule = createParallaxBobSchedule(PARALLAX_PARAMS);

/**
 * Seven dots at a loop frame, recentred for the demo stage. The base schedule
 * computes each dot in design space; the recentring shift is added LAST per field
 * so each value equals the schedule's value plus the same constant — render-only,
 * the mechanism is untouched (and the design-space base is what the article's
 * skeleton is proven equal to).
 */
export const parallaxDotsAt = (frame: number): ParallaxDotState[] =>
  baseSchedule(frame).map((d) => ({
    cx: d.cx + CENTER_SHIFT_X,
    cy: d.cy + CENTER_SHIFT_Y,
    r: d.r,
  }));
