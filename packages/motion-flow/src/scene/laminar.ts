// ============================================================
// motion-flowline-webgpu — Phase 8 Laminar scene preset
// Plan:    .claude/tasks/active/2026-04-18-motion-flowline-webgpu-phase8-plan.md §2 Stream D
// Handoff: docs/guides/2026-04-18-motion-flowline-webgpu-phase8-onward-complete-handoff.md §9.6
// ============================================================

import type { FlowlineConfig } from "../compute/flowline-config";
import type { RibbonConfig }   from "../render/ribbon-config";

/** Canonical scene names. Phase 11 adds CombFlow; Phase 14 adds Spirograph / Epitrochoid / Lissajous. */
export type FlowlineSceneName =
  | "Laminar"
  | "Turbulent"
  | "AttractorKnot"
  | "CombFlow"
  | "Spirograph"
  | "Epitrochoid"
  | "Lissajous";

/**
 * A scene is a named pair of partial overrides over the base FlowlineConfig
 * (compute) and RibbonConfig (render). The app layer merges:
 *   effectiveCompute = { ...FLOWLINE_PRESET_MEDIUM, ...scene.compute }
 *   effectiveRibbon  = { ...RIBBON_DEFAULT_CONFIG,   ...scene.ribbon  }
 */
export type FlowlineScene = {
  name:    FlowlineSceneName;
  compute: Partial<FlowlineConfig>;
  ribbon:  Partial<RibbonConfig>;
};

/**
 * Laminar — calm streamline preset.
 *
 * Long smooth arcing trails all drifting in the same general direction (think
 * wind over water). Lower flowForce keeps the motion serene; noiseScale sets
 * curl's spatial frequency (higher = more visible arcing); higher drag extends
 * trail length because velocity decays more slowly frame-to-frame.
 *
 * Reference: Itaru Yasuda's google-pixel-studio streamline scene.
 *
 * Phase 8 post-M2 tune (2026-04-18): noiseScale 1.8 → 2.4 to lift curvature
 * out of "線束が密+直線的" into a readable arcing calm. alphaScale 1.0 → 0.6
 * to damp overlap saturation at 4000-agent density. nAgents handled via
 * FLOWLINE_DEFAULT_CONFIG below.
 */
export const LAMINAR_SCENE: FlowlineScene = {
  name: "Laminar",
  compute: {
    flowForce:  0.25, // calmer than default 0.35
    noiseScale: 2.4,  // moderate curl frequency — enough arc without chaos
    drag:       0.96, // longer trails than default 0.92
  },
  ribbon: {
    widthScale: 1.0,
    alphaScale: 0.6,  // damp overlap saturation at dense fields
  },
};

/** Default scene for Phase 7–11 development. Launch export (Phase 12) may override. */
export const FLOWLINE_DEFAULT_SCENE: FlowlineScene = LAMINAR_SCENE;
