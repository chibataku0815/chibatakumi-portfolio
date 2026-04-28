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
import { createCamera, mixCamera } from "./camera";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

/** Sensible default: 50mm lens, 3-layer composition. */
export const SCENE_PRESET_DEFAULTS: ScenePresetConfig = {
  camera: { focalLength: 50, z: 200 },
  layers: [
    { role: "background", depth: 500, opacity: 1, parallaxScale: 0.2 },
    { role: "subject", depth: 200, opacity: 1, parallaxScale: 1.0 },
    { role: "foreground", depth: 100, opacity: 0.85, parallaxScale: 1.4 },
  ],
  description: "Standard 3-layer 50mm composition.",
};

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

export const SCENE_PRESETS: readonly ScenePreset[] = [
  // 1 — Postcard Classic
  {
    name: "postcard-classic",
    label: "Postcard Classic",
    config: {
      camera: { focalLength: 50, z: 200 },
      layers: [
        { role: "background", depth: 500, opacity: 1, parallaxScale: 0.2 },
        { role: "midground", depth: 300, opacity: 1, parallaxScale: 0.6 },
        { role: "subject", depth: 200, opacity: 1, parallaxScale: 1.0 },
        { role: "foreground", depth: 100, opacity: 0.85, parallaxScale: 1.4 },
      ],
      animation: {
        durationSeconds: 8,
        loop: true,
        keyframes: [
          { t: 0, camera: { panX: -8, panY: -2 } },
          { t: 0.5, camera: { panX: 8, panY: 2 } },
          { t: 1, camera: { panX: -8, panY: -2 } },
        ],
      },
      description:
        "Gentle lateral drift — the Moving Postcard signature look.",
    },
  },

  // 2 — Perspective Floor
  {
    name: "perspective-floor",
    label: "Perspective Floor",
    config: {
      camera: { focalLength: 35, z: 180, panY: 30 },
      layers: [
        { role: "sky", depth: 800, opacity: 1, parallaxScale: 0.1 },
        { role: "background", depth: 450, opacity: 1, parallaxScale: 0.3 },
        { role: "subject", depth: 200, opacity: 1, parallaxScale: 1.0 },
        { role: "floor", depth: 150, opacity: 1, parallaxScale: 1.2 },
        { role: "foreground", depth: 60, opacity: 0.7, parallaxScale: 1.8 },
      ],
      animation: {
        durationSeconds: 12,
        loop: true,
        keyframes: [
          { t: 0, camera: { panY: 30 } },
          { t: 0.5, camera: { panY: 20 } },
          { t: 1, camera: { panY: 30 } },
        ],
      },
      description:
        "Wide-angle floor perspective with vertical breathing motion.",
    },
  },

  // 3 — Dolly Reveal
  {
    name: "dolly-reveal",
    label: "Dolly Reveal",
    config: {
      camera: { focalLength: 85, z: 350 },
      layers: [
        { role: "background", depth: 600, opacity: 1, parallaxScale: 0.15 },
        { role: "midground", depth: 400, opacity: 1, parallaxScale: 0.5 },
        { role: "subject", depth: 250, opacity: 1, parallaxScale: 1.0 },
        { role: "foreground", depth: 120, opacity: 0.9, parallaxScale: 1.5 },
        { role: "atmosphere", depth: 60, opacity: 0.3, parallaxScale: 2.0 },
      ],
      animation: {
        durationSeconds: 6,
        loop: false,
        keyframes: [
          { t: 0, camera: { focalLength: 85, z: 350 } },
          { t: 1, camera: { focalLength: 50, z: 200 } },
        ],
      },
      description:
        "Telephoto pull-back to standard — cinematic dolly reveal with focal length shift.",
    },
  },

  // 4 — Window Parallax
  {
    name: "window-parallax",
    label: "Window Parallax",
    config: {
      camera: { focalLength: 50, z: 160 },
      layers: [
        { role: "exterior", depth: 500, opacity: 1, parallaxScale: 0.15 },
        { role: "midground", depth: 300, opacity: 1, parallaxScale: 0.5 },
        { role: "subject", depth: 180, opacity: 1, parallaxScale: 1.0 },
        { role: "windowframe", depth: 40, opacity: 1, parallaxScale: 2.2 },
      ],
      animation: {
        durationSeconds: 10,
        loop: true,
        keyframes: [
          { t: 0, camera: { panX: -6, panY: -3 } },
          { t: 0.25, camera: { panX: 4, panY: -5 } },
          { t: 0.5, camera: { panX: 6, panY: 3 } },
          { t: 0.75, camera: { panX: -4, panY: 5 } },
          { t: 1, camera: { panX: -6, panY: -3 } },
        ],
      },
      description:
        "Window-frame framing with orbital-style pan path — peering through glass.",
    },
  },

  // 5 — Macro Still
  {
    name: "macro-still",
    label: "Macro Still",
    config: {
      camera: { focalLength: 135, z: 120 },
      layers: [
        { role: "background", depth: 250, opacity: 0.7, parallaxScale: 0.2 },
        { role: "subject", depth: 160, opacity: 1, parallaxScale: 1.0 },
        { role: "foreground", depth: 100, opacity: 0.5, parallaxScale: 1.8 },
      ],
      animation: {
        durationSeconds: 16,
        loop: true,
        keyframes: [
          { t: 0, camera: { panX: -3, panY: -1 } },
          { t: 0.5, camera: { panX: 3, panY: 1 } },
          { t: 1, camera: { panX: -3, panY: -1 } },
        ],
      },
      description:
        "Telephoto macro with razor-thin depth — barely perceptible drift.",
    },
  },
];

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/** Look up a preset by name. */
export function findPreset(name: string): ScenePreset | undefined {
  return SCENE_PRESETS.find((p) => p.name === name);
}

/** Build a CameraState from a preset's camera config. */
export function buildPresetCamera(config: ScenePresetConfig): CameraState {
  return createCamera(config.camera);
}

/**
 * Build CompositionLayer[] from a preset's layer blueprints.
 *
 * @param config  Preset config containing layer blueprints
 * @param mapper  Maps (role, index) to layer content T. Return undefined to skip.
 */
export function buildPresetLayers<T>(
  config: ScenePresetConfig,
  mapper: (role: string, index: number) => T | undefined,
): CompositionLayer<T>[] {
  const result: CompositionLayer<T>[] = [];

  for (let i = 0; i < config.layers.length; i++) {
    const bp = config.layers[i];
    const content = mapper(bp.role, i);
    if (content === undefined) continue;

    result.push({
      id: bp.role,
      depth: bp.depth,
      opacity: bp.opacity,
      parallaxScale: bp.parallaxScale,
      content,
    });
  }

  return result;
}

/**
 * Evaluate a preset's animation at time t (seconds).
 *
 * Finds the surrounding keyframes and interpolates via mixCamera.
 * Loops wrap t; non-loop clamps to [0, duration].
 * Returns the base camera when no animation is defined.
 */
export function evaluatePresetAnimation(
  config: ScenePresetConfig,
  t: number,
): CameraState {
  if (!config.animation || config.animation.keyframes.length === 0) {
    return buildPresetCamera(config);
  }

  const { durationSeconds, keyframes, loop } = config.animation;

  // Normalise t to [0, 1]
  let nt: number;
  if (loop) {
    nt = ((t % durationSeconds) + durationSeconds) % durationSeconds / durationSeconds;
  } else {
    nt = Math.max(0, Math.min(1, t / durationSeconds));
  }

  // Edge cases: before first / after last keyframe
  if (nt <= keyframes[0].t) {
    return createCamera({ ...config.camera, ...keyframes[0].camera });
  }
  const last = keyframes[keyframes.length - 1];
  if (nt >= last.t) {
    return createCamera({ ...config.camera, ...last.camera });
  }

  // Find surrounding keyframes
  let a = keyframes[0];
  let b = keyframes[1];
  for (let i = 1; i < keyframes.length; i++) {
    if (keyframes[i].t >= nt) {
      a = keyframes[i - 1];
      b = keyframes[i];
      break;
    }
  }

  const segT = (nt - a.t) / (b.t - a.t);
  const camA = createCamera({ ...config.camera, ...a.camera });
  const camB = createCamera({ ...config.camera, ...b.camera });

  return mixCamera(camA, camB, segT, b.easing);
}
