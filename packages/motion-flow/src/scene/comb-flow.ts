// ============================================================
// motion-flowline-webgpu — Phase 11 Comb/Flow scene preset
//
// Handoff: docs/guides/2026-04-18-motion-flowline-webgpu-phase11-onward-handoff.md §6
// ============================================================

import type { FlowlineScene } from "./laminar";

/**
 * Comb/Flow — hero glyph integration preset.
 *
 * Background motion blends toward the glyph's SDF iso-contours so trails
 * "comb" the silhouette of the hero text. Outside the edge band agents still
 * read curl noise, giving the scene a calm field interrupted by the character
 * of the glyph — the "文字が編まれる" gesture described in the Phase 11 brief.
 *
 * flowForce / noiseScale sit between Laminar (calm) and Turbulent (chaotic)
 * so the underlying field is gentle enough that the SDF tangent reads
 * clearly, while drag is raised to keep trails long along the combed edge.
 */
export const COMB_FLOW_SCENE: FlowlineScene = {
  name: "CombFlow",
  compute: {
    flowForce:         0.22,
    noiseScale:        2.0,
    noiseSpeed:        0.08,
    drag:              0.95,
    attractorStrength: 0.0,
    vorticity:         0.0,
    combStrength:      1.0,
    sdfEdgeSoft:       0.08,
  },
  ribbon: {
    widthScale: 1.05,
    alphaScale: 0.7,
  },
};
