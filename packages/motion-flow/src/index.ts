// @chibatakumi/motion-flow — Renewal 2026 Stream 4-B-flow Phase A.
// Source: life/output/motion-flowline-webgpu (vendored under src/{audio,
// compute, render, scene, text}). Wraps as MotionParticipant. Used at
// /experiments/flow (full intensity + auto-cycle 7 scenes) and provides the
// scene-blend transition pattern for portfolio page transitions.
//
// Phase A scope: 7-scene auto-cycle + audio-reactive compute + ribbon +
// film post composite. Caption / HUD / input clusters are deferred (input
// is route-controlled, not participant-owned).

export {
  createFlowParticipant,
  FLOW_WIRING,
  FLOWLINE_WIRING,
  FLOWLINE_AUDIO_DELTA_BUFFER,
} from "./participant";
export type { FlowParams, CreateFlowParticipantOptions } from "./participant";

// Canonical scene + config exports — useful for callers wiring custom UI on
// top of the participant (route-level pinning, gallery overrides, etc).
export {
  SCENES,
  SCENE_CYCLE_DURATION_SEC,
  FLOWLINE_BLEND_DURATION,
  LAMINAR_SCENE,
  TURBULENT_SCENE,
  ATTRACTOR_KNOT_SCENE,
  COMB_FLOW_SCENE,
  SPIROGRAPH_SCENE,
  EPITROCHOID_SCENE,
  LISSAJOUS_SCENE,
  FLOWLINE_DEFAULT_SCENE,
} from "./scene";
export type {
  FlowlineScene,
  FlowlineSceneController,
  FlowlineFrameConfig,
  FlowSnapshot,
} from "./scene";

export {
  FLOWLINE_DEFAULT_CONFIG,
  FLOWLINE_PRESET_SMALL,
  FLOWLINE_PRESET_MEDIUM,
  FLOWLINE_PRESET_LARGE,
} from "./compute/flowline-config";
export type { FlowlineConfig } from "./compute/flowline-config";

export { RIBBON_DEFAULT_CONFIG } from "./render/ribbon-config";
export type { RibbonConfig } from "./render/ribbon-config";

export type { FlowlineParam } from "./audio/params";

export const FLOW_PACKAGE_VERSION = "0.1.0-phase-a";

// Standalone mount entry for /experiments/flow (Package 4 — Motion Works).
// Re-exports keep the package surface area minimal: callers either use the
// participant adapter (MotionStage host) or the mount entry (own canvas).
export { mountMotionFlowApp } from "./mount";
export type {
  MountFlowOptions,
  MountFlowHandle,
} from "./mount";
