/**
 * presets.ts — Scene presets for 2.5D compositions.
 *
 * Each preset defines a camera config, layer blueprint, and optional
 * animation (keyframed camera path). Film terminology throughout:
 * focalLength in mm, dolly/pan/truck for camera moves.
 */
import type { CameraState } from "./types";
import type { EasingFn, CreateCameraConfig } from "./camera";
import type { CompositionLayer } from "./layer";
/** Blueprint for a single depth layer within a preset. */
export interface PresetLayerBlueprint {
    readonly role: string;
    readonly depth: number;
    readonly opacity: number;
    readonly parallaxScale: number;
}
/** A keyframe along a camera animation path. */
export interface CameraKeyframe {
    readonly t: number;
    readonly camera: Partial<CreateCameraConfig>;
    readonly easing?: EasingFn;
}
/** Keyframed camera animation definition. */
export interface PresetAnimation {
    readonly durationSeconds: number;
    readonly keyframes: readonly CameraKeyframe[];
    readonly loop: boolean;
}
/** Full preset configuration: camera + layers + optional animation. */
export interface ScenePresetConfig {
    readonly camera: Partial<CreateCameraConfig>;
    readonly layers: readonly PresetLayerBlueprint[];
    readonly animation?: PresetAnimation;
    readonly description: string;
}
/** Named scene preset entry. */
export interface ScenePreset {
    readonly name: string;
    readonly label: string;
    readonly config: ScenePresetConfig;
}
/** Sensible default: 50mm lens, 3-layer composition. */
export declare const SCENE_PRESET_DEFAULTS: ScenePresetConfig;
export declare const SCENE_PRESETS: readonly ScenePreset[];
/** Look up a preset by name. */
export declare function findPreset(name: string): ScenePreset | undefined;
/** Build a CameraState from a preset's camera config. */
export declare function buildPresetCamera(config: ScenePresetConfig): CameraState;
/**
 * Build CompositionLayer[] from a preset's layer blueprints.
 *
 * @param config  Preset config containing layer blueprints
 * @param mapper  Maps (role, index) to layer content T. Return undefined to skip.
 */
export declare function buildPresetLayers<T>(config: ScenePresetConfig, mapper: (role: string, index: number) => T | undefined): CompositionLayer<T>[];
/**
 * Evaluate a preset's animation at time t (seconds).
 *
 * Finds the surrounding keyframes and interpolates via mixCamera.
 * Loops wrap t; non-loop clamps to [0, duration].
 * Returns the base camera when no animation is defined.
 */
export declare function evaluatePresetAnimation(config: ScenePresetConfig, t: number): CameraState;
