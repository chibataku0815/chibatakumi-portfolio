// ============================================================
// motion-flowline-webgpu — Phase 14 Epitrochoid scene preset
//
// Star-form counterpart to Spirograph. Inner circle rolls OUTSIDE the outer
// circle instead of inside → the pen traces a cusp-heavy rosette that reads
// as a many-armed star. Visually complements Spirograph (rounded petals)
// with sharper geometric character.
//
// Default preset: (R, r, d) = (0.22, 0.08, 0.11) → 7-lobe cusped rosette.
// The pen offset equals 1.4 × r so cusps nearly pinch at the outer circle —
// gives the "Stella / snowflake" silhouette. phaseSpeed slightly faster than
// Spirograph (0.45 rad/s) so the star rotation is visibly energetic.
// ============================================================

import type { FlowlineScene } from "./laminar";

export const EPITROCHOID_SCENE: FlowlineScene = {
  name: "Epitrochoid",
  compute: {
    flowForce:         0.06,
    noiseScale:        2.4,
    noiseSpeed:        0.09,
    drag:              0.86,
    attractorStrength: 0.0,
    vorticity:         0.0,
    combStrength:      0.0,
    shapeR:            0.22,
    shapeSmall:        0.08,
    shapeD:            0.13,
    phaseSpeed:        0.45,
    shapeStrength:     16.0,
    shapeMode:         2.0,
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
