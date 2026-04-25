// motion-flow participant adapter — Renewal 2026 Phase B (Stream 1).
//
// Wraps motion-flowline-webgpu (life/output/motion-flowline-webgpu) as a
// MotionParticipant. The implementation here is a SCAFFOLD only — the full
// scene/compute/render/text modules will be vendored via Phase A submodule
// (vendor/webgpu-motion-libs/packages/...). For now we keep the API surface
// complete so portfolio shell code (Stream 4) can compile against this type.
//
// Audio param canon (mirrors life/output/motion-flowline-webgpu/src/audio/wiring.ts,
// Phase 10 post-tune 2026-04-18 coefficients):
//   field.breathStrength      | bass         |  1.80
//   field.vorticityPulse      | bassOnset    |  2.80
//   trail.rimPulse            | trebleOnset  |  1.60
//   film.bloom.threshold      | globalOnset  | -0.75
//   film.bloom.intensity      | energy       |  1.60
//   film.tonemap.compression  | intensity    |  0.70
//   film.grain.intensity      | trebleOnset  |  0.55
//   film.chroma.amount        | midOnset     |  0.014
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
 * Audio params bound by the flow participant. Matches FlowlineParam in
 * life/output/motion-flowline-webgpu/src/audio/params.ts. 8 wires across
 * the field/trail/film canon. Note `trebleOnset` is bound twice (rimPulse
 * + grain.intensity) — defineAudioWiring's exhaustiveness check rejects
 * duplicate PARAMS, not duplicate INPUTS, so this is legal.
 */
export type FlowParams =
  | "field.breathStrength"
  | "field.vorticityPulse"
  | "trail.rimPulse"
  | "film.bloom.threshold"
  | "film.bloom.intensity"
  | "film.tonemap.compression"
  | "film.grain.intensity"
  | "film.chroma.amount";

/**
 * Canonical flow wiring. Re-declared here (not imported from life/output/...)
 * because that path is not in the portfolio workspace; once Phase A lands the
 * submodule the canon will be re-exported from `vendor/webgpu-motion-libs`.
 */
export const FLOW_WIRING: AudioWiring<FlowParams> = defineAudioWiring<FlowParams>()([
  {
    param: "field.breathStrength",
    input: "bass",
    coefficient: 1.8,
    baseline: 0,
    intent: "低域で場全体が呼吸する — ribbon 幅と速度が膨らむ（flow 最大 2.8 倍）",
  },
  {
    param: "field.vorticityPulse",
    input: "bassOnset",
    coefficient: 2.8,
    baseline: 0,
    intent: "キックで渦が一瞬強まる — AttractorKnot でスピン kick、Turbulent でも旋回発生",
  },
  {
    param: "trail.rimPulse",
    input: "trebleOnset",
    coefficient: 1.6,
    baseline: 0,
    intent: "ハイハットで trail の先端が研がれる — 新鮮な点が強く光る",
  },
  {
    param: "film.bloom.threshold",
    input: "globalOnset",
    coefficient: -0.75,
    baseline: 0,
    intent: "ビートで発光閾値が深く沈み、光が大きく滲み出す",
  },
  {
    param: "film.bloom.intensity",
    input: "energy",
    coefficient: 1.6,
    baseline: 0,
    intent: "全体ラウドネスで光量が強く広がる（体温）",
  },
  {
    param: "film.tonemap.compression",
    input: "intensity",
    coefficient: 0.7,
    baseline: 0,
    intent: "長期高揚でコントラストが深く蓄積する（緊張）",
  },
  {
    param: "film.grain.intensity",
    input: "trebleOnset",
    coefficient: 0.55,
    baseline: 0,
    intent: "ハットで粒子感が強く跳ね上がる（film texture response、ベース 0.18 に +0.55s 上乗せ）",
  },
  {
    param: "film.chroma.amount",
    input: "midOnset",
    coefficient: 0.014,
    baseline: 0,
    intent: "スネア/ミッド transient で色収差が瞬間的に増える",
  },
] as const);

export interface CreateFlowParticipantOptions {
  /** Override the registered name. Default: "flow". */
  readonly name?: string;
  /** Auto-cycle through the 7 canonical scenes. Gallery default: true. */
  readonly autoCycle?: boolean;
  /** Particle count override. Source canon: 4000-16000. */
  readonly particleCount?: number;
}

/**
 * Construct a flow MotionParticipant. The returned instance is uninitialized;
 * MotionStage will call `init(device, target)` on first activation.
 *
 * NOTE (scaffold): The lifecycle methods are stubs that throw a clear error
 * message until Phase A vendors the implementation. This is intentional —
 * see `feedback_no_fallback_bug_hotbed.md`: do NOT silently no-op.
 */
export function createFlowParticipant(
  opts: CreateFlowParticipantOptions = {},
): MotionParticipant<FlowParams> {
  const name = opts.name ?? "flow";

  let initialized = false;
  // TODO(phase-a): wire to vendor/webgpu-motion-libs/packages/.../ribbon-pass
  // and life/output/motion-flowline-webgpu/src/{compute,scene,text}.
  // The full state ownership chain:
  //   - FlowlineSceneController (7-scene auto-cycle, 0.5s cross-blend)
  //   - FlowlineComputeHandle (4000-16000 agent simulation, compute pass)
  //   - HeroSdf (text attractor SDF)
  //   - RibbonPassHandle (renders ribbons into offscreen rgba16float)
  //   - MotionFilmPostPass (audio-reactive film grade onto target)
  //   - FLOWLINE_AUDIO_DELTA_BUFFER (Record<FlowParams, number>, hot-path zero-alloc)

  const participant: MotionParticipant<FlowParams> = {
    name,
    fps: 45,
    audioWiring: FLOW_WIRING,

    async init(_device: GPUDevice, _target: GPUTexture): Promise<void> {
      // TODO(phase-a): initGpu pipelines, allocate offscreen pool slot keyed
      // to `name`, build SceneController + ComputeHandle + RibbonPass + FilmPost.
      void _device;
      void _target;
      void opts.autoCycle;
      void opts.particleCount;
      initialized = true;
    },

    update(_dt: number, _audioState: AudioState, _scene: SceneSnapshot): void {
      if (!initialized) {
        throw new Error(
          `[motion-flow] update() called before init() — did MotionStage.register fire?`,
        );
      }
      // TODO(phase-a): sceneController.update(dt); FLOW_WIRING.resolveInto(deltaBuffer, ...);
      // computeHandle.dispatch(encoder, deltas);
      // filmPost.updateConfig(composeFilmConfig(deltas));
    },

    render(_passEncoder: GPURenderPassEncoder): void {
      if (!initialized) {
        throw new Error(
          `[motion-flow] render() called before init() — did MotionStage.register fire?`,
        );
      }
      // TODO(phase-a): ribbonPass.render(encoder, offscreen, sceneState);
      // filmPost.render(encoder, offscreen, outputView, time, w, h);
    },

    blendTo(_other: MotionParticipant<string>, _t: number): void {
      // TODO(phase-a): flowline owns the canonical 0.5s cross-blend pattern
      // (see life/output/motion-flowline-webgpu/src/scene). MotionStage will
      // delegate to this method during route transitions; participants MAY
      // ignore `other` and run their own internal scene blend instead.
    },

    dispose(): void {
      if (!initialized) return;
      // TODO(phase-a): computeHandle.destroy? ribbonPass.destroy? filmPost.destroy()
      initialized = false;
    },
  };

  return participant;
}
