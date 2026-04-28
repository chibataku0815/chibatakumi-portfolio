// webgpu-motion-ui — shared HUD atoms for the WebGPU motion suite.
//
// Phase 10 scope: exposes the minimal primitive set motion-flowline-webgpu needs
// for its first formal HUD (replacing the dev-only [1/2/3/0/r] keyboard hook).
// grid/dot keep their bespoke HUDs for now — see docs/guides/
// 2026-04-18-motion-flowline-webgpu-phase10-onward-complete-handoff.md §6.1.

export { createHudOverlay, updateHudOverlay } from "./hud-overlay";
export type { HudOverlay, HudLine } from "./hud-overlay";

export { createSceneSelector, updateSceneSelector } from "./scene-selector";
export type { SceneSelector, SceneSelectorItem, SceneSelectorOptions } from "./scene-selector";

export { createAudioMeter, updateAudioMeter } from "./audio-meter";
export type { AudioMeter, AudioMeterFieldKey, AudioMeterReading } from "./audio-meter";

export { createKeymapHud, updateKeymapHud } from "./keymap-hud";
export type { KeymapHud, KeymapEntry } from "./keymap-hud";
