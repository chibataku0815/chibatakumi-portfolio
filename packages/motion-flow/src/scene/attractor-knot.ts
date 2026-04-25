// ============================================================
// motion-flowline-webgpu — Phase 9 AttractorKnot scene preset
// Plan:    .claude/tasks/active/2026-04-18-motion-flowline-webgpu-phase9-plan.md §1 C9
// Handoff: docs/guides/2026-04-18-motion-flowline-webgpu-phase8-onward-complete-handoff.md §11.1
// ============================================================

import type { FlowlineScene } from "./laminar";

/**
 * AttractorKnot — centred vortex preset.
 *
 * A single attractor at canvas centre pulls agents inward while a tangential
 * vorticity term spins them around it, producing knot-like orbital ribbons.
 * Curl noise remains but at low flowForce so the underlying structure reads
 * as a vortex rather than pure chaos. Ribbon slightly thicker + moderately
 * opaque — the knot is the hero shape.
 */
export const ATTRACTOR_KNOT_SCENE: FlowlineScene = {
  name: "AttractorKnot",
  compute: {
    flowForce:         0.18,
    noiseScale:        2.2,
    noiseSpeed:        0.10,
    drag:              0.94,
    attractorX:        0.5,
    attractorY:        0.5,
    attractorStrength: 0.45,
    vorticity:         1.1,
  },
  ribbon: {
    widthScale: 1.1,
    alphaScale: 0.75,
  },
};
