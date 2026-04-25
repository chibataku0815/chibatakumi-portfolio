// motion-flow participant adapter — Renewal 2026 Stream 4-B-flow Phase A.
//
// Wraps motion-flowline-webgpu (vendored under ./compute, ./render, ./scene,
// ./text, ./audio) as a MotionParticipant. Mirrors the motion-dot Phase A
// pattern (init/update/render/dispose with module-level closure state +
// lazy offscreen) and adds a WebGPU compute dispatch for the agent
// simulation (4000-16000 agents over 7 auto-cycle scenes).
//
// Audio param canon (mirrors ./audio/wiring.ts, Phase 10 post-tune
// 2026-04-18 coefficients):
//   field.breathStrength      | bass         |  1.80
//   field.vorticityPulse      | bassOnset    |  2.80
//   trail.rimPulse            | trebleOnset  |  1.60
//   film.bloom.threshold      | globalOnset  | -0.75
//   film.bloom.intensity      | energy       |  1.60
//   film.tonemap.compression  | intensity    |  0.70
//   film.grain.intensity      | trebleOnset  |  0.55
//   film.chroma.amount        | midOnset     |  0.014
//
// No silent-degradation fallbacks: if init fails, throw cleanly. If update
// or render is called before init (or required GPU resources are unexpectedly
// null), throw. Errors are swallowed only inside `dispose` (per-resource
// best-effort cleanup).

import type {
  MotionParticipant,
  AudioState,
  SceneSnapshot,
  ParticipantFrameContext,
} from "@chibatakumi/motion-core/participant";
import type { AudioWiring } from "@chibatakumi/motion-core/audio";

import { FILM_STOCK_CANON } from "webgpu-motion-art";
import {
  createFilmPostPass,
  type MotionFilmPostConfig,
  type MotionFilmPostPass,
} from "webgpu-motion-post";

import {
  FLOWLINE_AUDIO_DELTA_BUFFER,
  FLOWLINE_WIRING,
} from "./audio/wiring";
import type { FlowlineParam } from "./audio/params";
import {
  createFlowlineCompute,
  type FlowlineComputeHandle,
} from "./compute/flowline-compute";
import {
  FLOWLINE_DEFAULT_CONFIG,
  FLOWLINE_PRESET_LARGE,
  FLOWLINE_PRESET_MEDIUM,
  FLOWLINE_PRESET_SMALL,
  type FlowlineConfig,
} from "./compute/flowline-config";
import {
  createRibbonPass,
  type RibbonPassHandle,
} from "./render/ribbon-pass";
import {
  RIBBON_DEFAULT_CONFIG,
  type RibbonConfig,
} from "./render/ribbon-config";
import {
  SCENES,
  SCENE_CYCLE_DURATION_SEC,
  createFlowlineSceneController,
  type FlowlineSceneController,
} from "./scene";
import {
  createHeroSdf,
  HERO_PLACEMENT,
} from "./text/glyph-registry";
import type { FlowlineSdfTexture } from "./text/sdf-texture";
import type { GeneratedSdf } from "./text/sdf-generator";

// ---------------------------------------------------------------------------
// Re-export the canonical FlowlineParam union under the legacy `FlowParams`
// alias used by callers who imported from `participant` directly. The vendored
// audio/params.ts is now the single source of truth.
// ---------------------------------------------------------------------------

export type FlowParams = FlowlineParam;
export { FLOWLINE_AUDIO_DELTA_BUFFER, FLOWLINE_WIRING } from "./audio/wiring";

/**
 * Backwards-compat alias for callers still importing `FLOW_WIRING`. Identical
 * reference to FLOWLINE_WIRING; declared once and re-exported below so both
 * names point at the same const.
 */
export const FLOW_WIRING: AudioWiring<FlowlineParam> = FLOWLINE_WIRING;

// ---------------------------------------------------------------------------
// Film tuning — mirrors life/output/motion-flowline-webgpu/src/main.ts
// `composeFilmConfig`. Flowline raises baseline grain ~2.3× over canon so
// the thin ribbons carry visible film texture at rest, and pushes radialMix
// down for even-frame grain rather than edge-concentrated grain.
// ---------------------------------------------------------------------------

const GRAIN_STATIC = {
  intensity: 0.18,
  size: 0.52,
  radialMix: 0.08,
};
const CHROMATIC_STATIC = FILM_STOCK_CANON.chromaticAberration;
const BLOOM_STATIC = FILM_STOCK_CANON.bloom;
const VIGNETTE_STATIC = FILM_STOCK_CANON.vignette;
const TONEMAP_STATIC = FILM_STOCK_CANON.tonemap;

function composeFilmConfig(
  deltas: typeof FLOWLINE_AUDIO_DELTA_BUFFER,
): Partial<MotionFilmPostConfig> {
  return {
    grain: {
      ...GRAIN_STATIC,
      intensity: GRAIN_STATIC.intensity + deltas["film.grain.intensity"],
    },
    chromaticAberration: {
      ...CHROMATIC_STATIC,
      amount: CHROMATIC_STATIC.amount + deltas["film.chroma.amount"],
    },
    vignette: VIGNETTE_STATIC,
    bloom: {
      ...BLOOM_STATIC,
      threshold: BLOOM_STATIC.threshold + deltas["film.bloom.threshold"],
      intensity: BLOOM_STATIC.intensity + deltas["film.bloom.intensity"],
    },
    tonemap: {
      ...TONEMAP_STATIC,
      compression: TONEMAP_STATIC.compression + deltas["film.tonemap.compression"],
    },
  };
}

// ---------------------------------------------------------------------------
// Particle count → preset selection. The compute handle's nAgents is fixed
// at construction time (buffer allocations), so callers pick a preset (or
// pass an explicit count that we route to the closest preset).
// ---------------------------------------------------------------------------

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

/**
 * Long-envelope intensity shaping. Mirrors life/output/motion-flowline-
 * webgpu/src/main.ts shapeIntensity — gates raw intensity below 0.08
 * (silence floor) and stretches 0.08-0.80 → 0-1 so the tonemap.compression
 * wire reads natural musical dynamics.
 */
function shapeIntensity(raw: number): number {
  return clamp01((raw - 0.08) / 0.72);
}

function selectPreset(particleCount: number | undefined): FlowlineConfig {
  if (particleCount === undefined) {
    return FLOWLINE_DEFAULT_CONFIG; // SMALL = 4000
  }
  if (particleCount <= 4000) return FLOWLINE_PRESET_SMALL;
  if (particleCount <= 8000) return FLOWLINE_PRESET_MEDIUM;
  return FLOWLINE_PRESET_LARGE;
}

export interface CreateFlowParticipantOptions {
  /** Override the registered name. Default: "flow". */
  readonly name?: string;
  /** Auto-cycle through the 7 canonical scenes. Gallery default: true. */
  readonly autoCycle?: boolean;
  /** Particle count override. Source canon: 4000 / 8000 / 16000. */
  readonly particleCount?: number;
}

/**
 * Construct a flow MotionParticipant. The returned instance is uninitialized;
 * MotionStage will call `init(device, format)` on first activation.
 *
 * Lifecycle:
 *   1. init(device, format)  — build compute + ribbon + film post + SDF +
 *                              scene controller. Throws on any failure.
 *   2. update(dt, audio, …)  — advance scene controller, resolve audio wires
 *                              into the alloc-free delta buffer, update film
 *                              post config. Pure CPU work.
 *   3. render(ctx)           — encode compute dispatch (agent sim) + ribbon
 *                              pass (offscreen rgba16float) + film post
 *                              (composite onto ctx.outputView). Lazy-allocs
 *                              the offscreen target on first call / resize.
 *   4. dispose()             — per-resource best-effort destroy. Idempotent.
 */
export function createFlowParticipant(
  opts: CreateFlowParticipantOptions = {},
): MotionParticipant<FlowlineParam> {
  const name = opts.name ?? "flow";
  const autoCycleEnabled = opts.autoCycle ?? true;

  // Bound state — populated by `init`, cleared by `dispose`.
  let device: GPUDevice | null = null;
  let outputFormat: GPUTextureFormat | null = null;
  let sceneController: FlowlineSceneController | null = null;
  let compute: FlowlineComputeHandle | null = null;
  let heroSdf: { sdf: GeneratedSdf; texture: FlowlineSdfTexture } | null = null;
  let ribbonPass: RibbonPassHandle | null = null;
  let filmPost: MotionFilmPostPass | null = null;

  // Internal offscreen target — separate from MotionStage's outputView so the
  // ribbon pass can render into rgba16float and the film post can composite
  // onto the stage's outputView with the canonical pipeline.
  let offscreenTexture: GPUTexture | null = null;
  let offscreenWidth = 0;
  let offscreenHeight = 0;

  // Scene cycling state — only consulted when autoCycle is true.
  let lastCycleIdx = 0;

  // Per-frame dt cache — written by update(), read by render(). The
  // ParticipantFrameContext intentionally does not carry dt (the stage owns
  // the fixed-step loop), so we shuttle it through closure state.
  let cachedDt = 1 / 45;

  let initialized = false;

  function ensureOffscreenView(w: number, h: number): GPUTextureView {
    if (offscreenTexture && offscreenWidth === w && offscreenHeight === h) {
      return offscreenTexture.createView({
        label: `motion-flow:${name}/offscreen-view`,
      });
    }
    if (offscreenTexture) {
      offscreenTexture.destroy();
    }
    if (!device) {
      throw new Error(
        `[motion-flow] device unavailable when allocating offscreen target`,
      );
    }
    offscreenTexture = device.createTexture({
      label: `motion-flow:${name}/offscreen`,
      size: { width: w, height: h },
      format: "rgba16float",
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    offscreenWidth = w;
    offscreenHeight = h;
    return offscreenTexture.createView({
      label: `motion-flow:${name}/offscreen-view`,
    });
  }

  const participant: MotionParticipant<FlowlineParam> = {
    name,
    fps: 45,
    audioWiring: FLOWLINE_WIRING,

    async init(d: GPUDevice, format: GPUTextureFormat): Promise<void> {
      device = d;
      outputFormat = format;

      // Resolve preset → base compute config. Scene presets layer on top
      // via FlowlineSceneController (Partial<FlowlineConfig> overrides).
      const baseCompute: FlowlineConfig = selectPreset(opts.particleCount);
      const baseRibbon: RibbonConfig = RIBBON_DEFAULT_CONFIG;
      const initialScene = SCENES[0];
      const initialCompute: FlowlineConfig = {
        ...baseCompute,
        ...initialScene.compute,
      };

      // Hero glyph SDF — generated once on the CPU and uploaded as r32float.
      // Lives for the participant lifetime; only the Comb/Flow scene samples
      // it meaningfully (other scenes carry combStrength=0 which short-
      // circuits the sampling branch in the compute kernel).
      heroSdf = createHeroSdf(d);

      compute = createFlowlineCompute(d, {
        config: initialCompute,
        sdfTextureView: heroSdf.texture.view,
        sdfSampler: heroSdf.texture.sampler,
      });

      ribbonPass = createRibbonPass(d, {
        targetFormat: "rgba16float",
        agentBuffer: compute.agentBuffer,
        trailBuffer: compute.trailBuffer,
        nAgents: initialCompute.nAgents,
        nTrail: initialCompute.nTrail,
        config: { ...baseRibbon, ...initialScene.ribbon },
      });

      sceneController = createFlowlineSceneController({
        compute,
        initialScene,
        baseCompute,
        baseRibbon,
      });

      filmPost = createFilmPostPass(d, format, FILM_STOCK_CANON);

      initialized = true;
    },

    update(dt: number, audioState: AudioState, scene: SceneSnapshot): void {
      if (!initialized) {
        throw new Error(
          `[motion-flow] update() called before init() — did MotionStage.register fire?`,
        );
      }

      cachedDt = dt;

      // Auto-cycle: advance the scene index based on absolute time. The
      // controller's tick() handles the 0.5s blend window + reseed pulse on
      // switchTo. Manual override (autoCycle=false) keeps the initial scene
      // unless an external caller calls switchTo via a future API.
      if (autoCycleEnabled && sceneController) {
        const cycleIdx =
          Math.floor(scene.time / SCENE_CYCLE_DURATION_SEC) % SCENES.length;
        if (cycleIdx !== lastCycleIdx) {
          sceneController.switchTo(SCENES[cycleIdx]);
          lastCycleIdx = cycleIdx;
        }
      }

      // Resolve the 8-wire FLOWLINE_WIRING into the alloc-free delta buffer.
      // The buffer is mutated in place — read by render() this frame.
      // intensity is shaped (gate 0.08 / stretch 0.72) to match the canonical
      // flowline tonemap.compression curve from life/output/.../main.ts.
      FLOWLINE_WIRING.resolveInto(
        FLOWLINE_AUDIO_DELTA_BUFFER,
        audioState.bands,
        audioState.onsets,
        shapeIntensity(audioState.intensity),
      );

      // Push film post config. Bloom/grain/chroma/tonemap deltas applied on
      // top of FILM_STOCK_CANON + flowline grain baseline.
      if (filmPost) {
        filmPost.updateConfig(composeFilmConfig(FLOWLINE_AUDIO_DELTA_BUFFER));
      }
    },

    render(ctx: ParticipantFrameContext): void {
      if (!initialized) {
        throw new Error(
          `[motion-flow] render() called before init() — did MotionStage.register fire?`,
        );
      }
      if (!device || !compute || !ribbonPass || !filmPost || !sceneController) {
        throw new Error(
          `[motion-flow] render() — required GPU resources not built (init didn't complete?)`,
        );
      }

      // Lazy alloc / resize the offscreen target. rgba16float for HDR-ish
      // intermediate so bloom + tonemap have headroom.
      const offscreenView = ensureOffscreenView(ctx.width, ctx.height);

      // Tick the scene controller — advances blend, fires reseed pass on
      // pending switchTo, and produces the resolved per-frame compute/ribbon
      // config (already merged with any active blend interpolation).
      const frameConfig = sceneController.tick(ctx.encoder, cachedDt);

      // ── Compute pass — agent simulation (4000-16000 agents) ──
      compute.update(ctx.encoder, {
        time: ctx.time,
        dt: cachedDt,
        flowForce:         frameConfig.compute.flowForce,
        noiseScale:        frameConfig.compute.noiseScale,
        noiseSpeed:        frameConfig.compute.noiseSpeed,
        drag:              frameConfig.compute.drag,
        attractorX:        frameConfig.compute.attractorX,
        attractorY:        frameConfig.compute.attractorY,
        attractorStrength: frameConfig.compute.attractorStrength,
        vorticity:         frameConfig.compute.vorticity,
        breathStrength:    FLOWLINE_AUDIO_DELTA_BUFFER["field.breathStrength"],
        vorticityPulse:    FLOWLINE_AUDIO_DELTA_BUFFER["field.vorticityPulse"],
        rimPulse:          FLOWLINE_AUDIO_DELTA_BUFFER["trail.rimPulse"],
        glyphCenterX:      HERO_PLACEMENT.centerX,
        glyphCenterY:      HERO_PLACEMENT.centerY,
        glyphWidth:        HERO_PLACEMENT.width,
        glyphHeight:       HERO_PLACEMENT.height,
        combStrength:      frameConfig.compute.combStrength,
        sdfEdgeSoft:       frameConfig.compute.sdfEdgeSoft,
        shapeR:            frameConfig.compute.shapeR,
        shapeSmall:        frameConfig.compute.shapeSmall,
        shapeD:            frameConfig.compute.shapeD,
        phaseSpeed:        frameConfig.compute.phaseSpeed,
        shapeStrength:     frameConfig.compute.shapeStrength,
        shapeMode:         frameConfig.compute.shapeMode,
      });

      // ── Ribbon pass — composite ribbons into rgba16float offscreen ──
      ribbonPass.updateConfig(frameConfig.ribbon);
      ribbonPass.render(ctx.encoder, offscreenView, {
        viewWidth: ctx.width,
        viewHeight: ctx.height,
        rimPulse: FLOWLINE_AUDIO_DELTA_BUFFER["trail.rimPulse"],
      });

      // ── Film post — final grade onto the stage's outputView ──
      filmPost.render(
        ctx.encoder,
        offscreenView,
        ctx.outputView,
        ctx.time,
        ctx.width,
        ctx.height,
      );

      void outputFormat;
    },

    blendTo(_other: MotionParticipant<string>, _t: number): void {
      // Flowline owns the canonical 0.5s cross-blend pattern at the SCENE
      // level (FlowlineSceneController). MotionStage runs the inter-
      // participant cross-fade at the composite layer, so this method is a
      // no-op for now — participants may override later if a custom
      // inter-substrate transition is needed.
    },

    dispose(): void {
      if (!initialized) return;
      try { compute?.destroy(); } catch { /* ignore */ }
      try { ribbonPass?.destroy(); } catch { /* ignore */ }
      try { filmPost?.destroy(); } catch { /* ignore */ }
      try { heroSdf?.texture.destroy(); } catch { /* ignore */ }
      if (offscreenTexture) {
        try { offscreenTexture.destroy(); } catch { /* ignore */ }
      }
      compute = null;
      ribbonPass = null;
      filmPost = null;
      heroSdf = null;
      sceneController = null;
      offscreenTexture = null;
      offscreenWidth = 0;
      offscreenHeight = 0;
      device = null;
      outputFormat = null;
      lastCycleIdx = 0;
      initialized = false;
    },
  };

  return participant;
}
