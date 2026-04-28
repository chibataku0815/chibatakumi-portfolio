// ============================================================
// motion-flowline-webgpu — Phase 9 scene registry
// Plan:    .claude/tasks/active/2026-04-18-motion-flowline-webgpu-phase9-plan.md §1 C10
// Handoff: docs/guides/2026-04-18-motion-flowline-webgpu-phase8-onward-complete-handoff.md §11.1
// ============================================================

import { LAMINAR_SCENE, FLOWLINE_DEFAULT_SCENE } from "./laminar";
import { TURBULENT_SCENE } from "./turbulent";
import { ATTRACTOR_KNOT_SCENE } from "./attractor-knot";
import { COMB_FLOW_SCENE } from "./comb-flow";
import { SPIROGRAPH_SCENE } from "./spirograph";
import { EPITROCHOID_SCENE } from "./epitrochoid";
import { LISSAJOUS_SCENE } from "./lissajous";
import type { FlowlineScene } from "./laminar";

/**
 * Canonical Phase 14 scene set — index order is the visual rotation order for
 * the auto-cycle mode and the [1..7] keyboard shortcut mapping.
 *
 * Organic ↔ geometric alternation across 7 scenes: each organic scene leads
 * into a distinct geometric epiphany before dispersing. The 0.5 s blend
 * window in FlowlineSceneController softens transitions; shapeStrength /
 * combStrength lerp smoothly so the geometric forms fade in/out rather than
 * pop. 7 × 12 s = 84 s full cycle.
 */
export const SCENES: readonly FlowlineScene[] = [
  LAMINAR_SCENE,
  SPIROGRAPH_SCENE,
  TURBULENT_SCENE,
  LISSAJOUS_SCENE,
  ATTRACTOR_KNOT_SCENE,
  EPITROCHOID_SCENE,
  COMB_FLOW_SCENE,
] as const;

/**
 * Auto-cycle dwell time, in seconds. At 12 s per scene the ensemble has a
 * full Laminar lifetime cycle (lifetimeMax=12) before switching — long
 * enough for viewers to read the new field's character before the next
 * transition fires.
 */
export const SCENE_CYCLE_DURATION_SEC = 12;

export {
  LAMINAR_SCENE,
  TURBULENT_SCENE,
  ATTRACTOR_KNOT_SCENE,
  COMB_FLOW_SCENE,
  SPIROGRAPH_SCENE,
  EPITROCHOID_SCENE,
  LISSAJOUS_SCENE,
  FLOWLINE_DEFAULT_SCENE,
};
export type { FlowlineScene };

// Re-export scene controller factory so app code has a single `./scene` entry.
export {
  createFlowlineSceneController,
  FLOWLINE_BLEND_DURATION,
  type FlowlineSceneController,
  type FlowlineFrameConfig,
  type FlowSnapshot,
} from "./flowline-participant";
