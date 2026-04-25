// motion-grid participant adapter — Renewal 2026 Phase B (Stream 1).
//
// Wraps motion-grid-guided-webgpu (life/output/motion-grid-guided-webgpu) as
// a MotionParticipant. The implementation here is a SCAFFOLD only — the full
// scene/render/audio/input modules will be vendored via Phase A submodule
// (vendor/webgpu-motion-libs/packages/...). For now we keep the API surface
// complete so portfolio shell code (Stream 4) can compile against this type.
//
// Audio param canon (mirrors life/output/motion-grid-guided-webgpu/src/audio/wiring.ts):
//   film.bloom.threshold    | globalOnset    | -0.45
//   film.bloom.intensity    | energy         |  0.90
//   film.tonemap.compression| intensity      |  0.35
//
// No silent-degradation fallbacks: if init fails, throw cleanly.

import type {
  MotionParticipant,
  AudioState,
  SceneSnapshot,
} from "@chibatakumi/motion-core/participant";
import {
  defineAudioWiring,
  type AudioWiring,
} from "@chibatakumi/motion-core/audio";

/**
 * Audio params bound by the grid participant. Matches GridParam in
 * life/output/motion-grid-guided-webgpu/src/audio/wiring.ts. ElectricFilmSignals
 * (strikeFlag, flickerIntensity, glowMix, rgbSplitBump) are scene-driven, not
 * audio-driven, and live outside this wiring.
 */
export type GridParams =
  | "film.bloom.threshold"
  | "film.bloom.intensity"
  | "film.tonemap.compression";

/**
 * Canonical grid wiring. Re-declared here (not imported from life/output/...)
 * because that path is not in the portfolio workspace; once Phase A lands the
 * submodule the canon will be re-exported from `vendor/webgpu-motion-libs`.
 */
export const GRID_WIRING: AudioWiring<GridParams> = defineAudioWiring<GridParams>()([
  {
    param: "film.bloom.threshold",
    input: "globalOnset",
    coefficient: -0.45,
    baseline: 0,
    intent: "ビートで発光閾値が瞬間的に下がり、光が滲み出す",
  },
  {
    param: "film.bloom.intensity",
    input: "energy",
    coefficient: 0.9,
    baseline: 0,
    intent: "全体ラウドネスで光の広がりが増す（体温）",
  },
  {
    param: "film.tonemap.compression",
    input: "intensity",
    coefficient: 0.35,
    baseline: 0,
    intent: "長期的な高揚でコントラストが蓄積する（緊張）",
  },
] as const);

export interface CreateGridParticipantOptions {
  /** Override the registered name. Default: "grid". */
  readonly name?: string;
  /** Initial hero token. If omitted, falls back to the scene's default. */
  readonly initialHeroToken?: string;
  /** Disable the input/keyboard cluster (gallery vs ambient mode). */
  readonly enableInput?: boolean;
}

/**
 * Construct a grid MotionParticipant. The returned instance is uninitialized;
 * MotionStage will call `init(device, target)` on first activation.
 *
 * NOTE (scaffold): The lifecycle methods are stubs that throw a clear error
 * message until Phase A vendors the implementation. This is intentional —
 * see `feedback_no_fallback_bug_hotbed.md`: do NOT silently no-op.
 */
export function createGridParticipant(
  opts: CreateGridParticipantOptions = {},
): MotionParticipant<GridParams> {
  const name = opts.name ?? "grid";

  let initialized = false;
  // TODO(phase-a): wire to vendor/webgpu-motion-libs/packages/.../grid-block-pass
  // and life/output/motion-grid-guided-webgpu/src/scene/discrete-grid-scene.
  // The full state ownership chain:
  //   - DiscreteGridScene (typography blocks + handoff state machine)
  //   - GridBlockPass (renders blocks into offscreen rgba16float)
  //   - MotionFilmPostPass (audio-reactive film grade onto target)
  //   - GRID_AUDIO_DELTA_BUFFER (Record<GridParams, number>, hot-path zero-alloc)

  const participant: MotionParticipant<GridParams> = {
    name,
    fps: 45,
    audioWiring: GRID_WIRING,

    async init(_device: GPUDevice, _target: GPUTexture): Promise<void> {
      // TODO(phase-a): initGpu pipelines, allocate offscreen pool slot keyed
      // to `name`, build DiscreteGridScene + GridBlockPass + MotionFilmPostPass.
      void _device;
      void _target;
      void opts.initialHeroToken;
      void opts.enableInput;
      initialized = true;
    },

    update(_dt: number, _audioState: AudioState, _scene: SceneSnapshot): void {
      if (!initialized) {
        throw new Error(
          `[motion-grid] update() called before init() — did MotionStage.register fire?`,
        );
      }
      // TODO(phase-a): scene.update(dt); GRID_WIRING.resolveInto(deltaBuffer, ...);
      // filmPost.updateConfig(composeFilmConfig(deltas, electricSignals));
    },

    render(_passEncoder: GPURenderPassEncoder): void {
      if (!initialized) {
        throw new Error(
          `[motion-grid] render() called before init() — did MotionStage.register fire?`,
        );
      }
      // TODO(phase-a): renderPass.render(encoder, offscreen, snapshot, reactive, textAlpha);
      // filmPost.render(encoder, offscreen, outputView, time, w, h);
    },

    blendTo(_other: MotionParticipant<string>, _t: number): void {
      // TODO(phase-a): grid uses kinetic-handoff for inter-pattern transitions
      // internally; for inter-participant blend we apply textAlpha drive on
      // the film-post output. Default behavior: linear cross-fade against
      // `other`'s last drawn frame, orchestrated by MotionStage.
    },

    dispose(): void {
      if (!initialized) return;
      // TODO(phase-a): scene.dispose? renderPass.destroy? filmPost.destroy()
      initialized = false;
    },
  };

  return participant;
}
