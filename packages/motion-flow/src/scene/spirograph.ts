// ============================================================
// motion-flowline-webgpu — Phase 14 Spirograph scene preset
//
// Geometric-epiphany counterpoint to the 4 organic scenes. While Laminar /
// Turbulent / AttractorKnot / CombFlow all pay zero cost for the shape block
// (shapeStrength = 0), Spirograph flips shapeStrength to a spring coefficient
// that pulls each agent toward its own point on a hypotrochoid rosette.
//
// Agents sample the curve rather than stacking on a single point: every
// agent's immutable `phase` seed indexes a different θ, and phaseSpeed scrubs
// the whole ensemble around the curve so the rosette "revolves" rather than
// pins. Curl noise remains under the spring so trails gently drift off-curve
// and snap back — the "epiphany / dispersal" cadence the Moving Postcard
// reference photo captures.
//
// Default preset tuned for a 5-petal hypotrochoid: (R, r) = (0.35, 0.10) →
// petal count = (R - r) / gcd(R, r) = 0.25 / 0.05 = 5. Petal depth set by d.
// Alternative presets worth trying in extension phase:
//   (R, r, d) = (0.36, 0.14, 0.07) → 11 / 7 = 1.57 ratio, 4-petal
//   (R, r, d) = (0.40, 0.08, 0.06) → 50 / 8 = 6.25 → dense 25-petal web
// For MVP we ship the 5-petal reading. phaseSpeed 0.30 rad/s = ~21 s per full
// curve revolution — one full rotation per ~2 scene cycles.
// ============================================================

import type { FlowlineScene } from "./laminar";

export const SPIROGRAPH_SCENE: FlowlineScene = {
  name: "Spirograph",
  compute: {
    // Curl noise dialed way down so the rosette reads as the primary shape;
    // small residual flow keeps the curve breathing. drag 0.86 is slightly
    // overdamped for shapeStrength 16 → agents settle onto the curve within
    // ~0.5 s after the 0.5 s scene blend, leaving ~10 s of clear rosette.
    flowForce:         0.06,
    noiseScale:        2.2,
    noiseSpeed:        0.08,
    drag:              0.86,
    attractorStrength: 0.0,
    vorticity:         0.0,
    combStrength:      0.0,
    // Shape block — hypotrochoid; d bumped to 0.08 for deeper petals.
    shapeR:            0.35,
    shapeSmall:        0.10,
    shapeD:            0.08,
    phaseSpeed:        0.30,
    shapeStrength:     16.0,
    shapeMode:         1.0,
  },
  ribbon: {
    // Shape scenes need near-zero curvature damping because the curve itself
    // has constant high curvature (cusps, petals, intersections). Default
    // curvatureK=3.0 cuts rosette alpha by 70 %; 0.5 keeps sharp turns
    // readable. Width/alpha lifted for prominence against the curl backdrop.
    maxWidth:    0.006,
    minWidth:    0.001,
    widthSpeedK: 2.0,
    curvatureK:  0.5,
    widthScale:  1.2,
    alphaScale:  1.0,
  },
};
