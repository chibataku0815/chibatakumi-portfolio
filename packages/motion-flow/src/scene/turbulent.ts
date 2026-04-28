// ============================================================
// motion-flowline-webgpu — Phase 9 Turbulent scene preset
// Plan:    .claude/tasks/active/2026-04-18-motion-flowline-webgpu-phase9-plan.md §1 C9
// Handoff: docs/guides/2026-04-18-motion-flowline-webgpu-phase8-onward-complete-handoff.md §11.1
// ============================================================

import type { FlowlineScene } from "./laminar";

/**
 * Turbulent — chaotic streamline preset.
 *
 * Higher flowForce + tighter noise scale + faster drift + lower drag yield a
 * jittery, short-lived look. Attractor is disabled; only curl noise drives
 * motion. Ribbon shrinks and thins so the density does not read as clogged.
 */
export const TURBULENT_SCENE: FlowlineScene = {
  name: "Turbulent",
  compute: {
    flowForce:         0.75,
    noiseScale:        4.6,
    noiseSpeed:        0.30,
    drag:              0.84,
    attractorStrength: 0.0,
    vorticity:         0.0,
  },
  ribbon: {
    widthScale: 0.75,
    alphaScale: 0.45,
  },
};
