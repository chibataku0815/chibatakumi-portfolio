// Demo parameters for the lattice-breath motion study.
//
// These are the ORIGIN cell's independently re-measured, authorable-precision
// constants (6-arm hex lattice, 90-frame / 3s loop @ 30fps), copied from
// motion-grammar-lab studies/puttimw-motion-drawers/src/verbs/count-growth.ts
// (countGrowthParams). Two deliberate adaptations for this embedded demo:
//   1. `center` is moved to the demo viewBox centre and `registrationOffsetDesign`
//      is zeroed — the upstream 0.55px offset is a raster-registration
//      calibration artefact, not part of the motion.
//   2. Colours are NOT carried here. The schedule is pure geometry; the demo
//      renderer paints the dots with the site's substrate ink (currentColor),
//      so the motion adopts the page's light/dark theme instead of the
//      reference cell's red/pink palette.
// The timing, easing handles, radii ratios and family onsets — i.e. the motion
// knowledge itself — are kept faithful.

import { createLatticeBreathSchedule } from "./lattice-breath";
import type { LatticeBreathParams } from "./lattice-breath";

export const LATTICE_BREATH_VIEWBOX = 240;
export const LATTICE_BREATH_PERIOD_FRAMES = 90;
export const LATTICE_BREATH_FPS = 30; // design contract: 90f = 3s loop

/**
 * Frame at which the visible dot count peaks (6→7→13→19). Used as the static
 * fallback for prefers-reduced-motion — the most legible single frame.
 */
export const LATTICE_BREATH_PEAK_FRAME = 38;

export const latticeBreathParams: LatticeBreathParams = {
  master: {
    periodFrames: 90,
    bloomStartFrame: 0,
    bloomEndFrame: 30,
    collapseStartFrame: 44,
    collapseEndFrame: 73,
    bloomBezier: [0.7, 0.01, 0.21, 1],
    collapseBezier: [0.75, 0, 0.3, 1],
    rotationBloomBezier: [0.68, 0.03, 0.24, 1],
    rotationCollapseBezier: [0.69, -0.05, 0.34, 1],
    rotationPerHalfDeg: -90,
  },
  geometry: {
    center: { x: 120, y: 120 },
    armCount: 6,
    armAngle0Deg: 30,
    restRadius: 28.8,
    peakRadius: 75.6,
    innerRadius: 38.1,
    edgeFromRadius: 32.84,
    edgeToRadius: 65.68,
    edgeRadialKeys: {
      bloomStartFrame: 10,
      bloomEndFrame: 28,
      bloomBezier: [0.5, 0.04, 0.2, 1],
      collapseStartFrame: 44,
      collapseEndFrame: 70,
      collapseBezier: [0.81, 0, 0.35, 1],
    },
    dotRadius: 13.45,
  },
  registrationOffsetDesign: { dx: 0, dy: 0 },
  clips: {
    coreIn: {
      riseDurFrames: 8,
      riseBezier: [0.0, 0.13, 0.53, 0.95],
      peakScale: 1.2,
      settleDurFrames: 10,
      settleBezier: [0.26, -0.04, 0.58, 0.95],
    },
    edgeIn: { durFrames: 12, bezier: [0.33, 0.08, 0.28, 1.0] },
    coreOut: { durFrames: 9, bezier: [0.47, -0.04, 0.85, 1.0] },
    edgeOut: { durFrames: 9, bezier: [0.56, -0.01, 0.9, 1.0] },
  },
  onsets: {
    centerIn: 10,
    edgeIn: 13,
    innerIn: 16,
    innerOut: 48,
    centerOut: 54,
    edgeOut: 54,
  },
};

export const latticeBreathSchedule = createLatticeBreathSchedule(
  latticeBreathParams,
);
