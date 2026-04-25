// ============================================================
// motion-flowline-webgpu — Phase 14 Lissajous scene preset
//
// Orthogonal-grid geometric epiphany. Where Spirograph/Epitrochoid use polar
// rosettes, Lissajous uses Cartesian orthogonal sinusoids — the classic
// oscilloscope-figure look. Complements the two rosette scenes with a more
// "technical / measurement" read.
//
// Default preset: 3:1 ratio (Ax amplitude 0.32, Ay 0.28, freqX a=3). π/2 X
// phase offset makes the curve enter along the +X axis and trace three
// horizontal lobes mirrored on the Y axis — visually a woven grid. phaseSpeed
// 0.40 rad/s keeps the full ~15.7 s period readable within the 12 s dwell.
// ============================================================

import type { FlowlineScene } from "./laminar";

export const LISSAJOUS_SCENE: FlowlineScene = {
  name: "Lissajous",
  compute: {
    flowForce:         0.06,
    noiseScale:        2.2,
    noiseSpeed:        0.10,
    drag:              0.86,
    attractorStrength: 0.0,
    vorticity:         0.0,
    combStrength:      0.0,
    shapeR:            0.32,
    shapeSmall:        0.28,
    shapeD:            3.0,
    phaseSpeed:        0.40,
    shapeStrength:     16.0,
    shapeMode:         3.0,
  },
  ribbon: {
    maxWidth:    0.006,
    minWidth:    0.001,
    widthSpeedK: 2.0,
    curvatureK:  0.5,
    widthScale:  1.2,
    alphaScale:  1.0,
  },
};
