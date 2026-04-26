// @chibatakumi/motion-grid — Renewal 2026 Phase B / Stream 4-B-grid (Phase A wiring).
// Source: life/output/motion-grid-guided-webgpu (vendored under src/)
// Wraps as MotionParticipant. Used at /experiments/grid (full intensity + text input)
// and as nav grid vocabulary in /works.

export {
  createGridParticipant,
  GRID_WIRING,
  GRID_AUDIO_DELTA_BUFFER,
  createDiscreteGridScene,
  createGridBlockPass,
} from "./participant";
export type {
  GridParam,
  /** @deprecated alias for `GridParam`; retained for back-compat. */
  GridParams,
  CreateGridParticipantOptions,
  DiscreteGridScene,
  DiscreteGridSnapshot,
  HeroTokenValidation,
  WordMorphValidation,
  GridBlockPass,
  GridReactiveState,
} from "./participant";

export const GRID_PACKAGE_VERSION = "0.1.0-phase-b";

// Standalone mount entry for /experiments/grid (Package 4 — Motion Works).
// Re-exports keep the package surface area minimal: callers either use the
// participant adapter (MotionStage host) or the mount entry (own canvas).
export { mountMotionGridApp } from "./mount";
export type {
  MountGridOptions,
  MountGridHandle,
} from "./mount";
