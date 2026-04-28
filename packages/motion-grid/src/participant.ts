// motion-grid participant adapter — Renewal 2026 Phase B (Stream 4-B-grid Phase A).
//
// Wraps motion-grid-guided-webgpu (vendored under src/{audio,scene,render})
// as a MotionParticipant<GridParam>. Mirrors motion-dot's Phase A wiring
// pattern: module-level closure state + lazy offscreen texture +
// GRID_AUDIO_DELTA_BUFFER alloc-free audio resolve into film-post config.
//
// Audio param canon (see ./audio/wiring.ts):
//   film.bloom.threshold     | globalOnset    | -0.45
//   film.bloom.intensity     | energy         |  0.90
//   film.tonemap.compression | intensity      |  0.35
//
// Scope (Phase A):
//   * Single DiscreteGridScene + GridBlockPass + MotionFilmPostPass.
//   * Default hero token (DiscreteGridScene's internal default).
//   * No HUD, no keyboard cluster, no input mode, no audio controller —
//     ambient mode only. Gallery wiring + interactive controls deferred
//     to Phase A+1.
//
// Strict-failure rules (per `feedback_no_fallback_bug_hotbed.md`):
//   * No silent fallback: init/update/render throw on misuse.
//   * dispose is the ONLY place that swallows per-resource destroy errors.

import type {
  MotionParticipant,
  AudioState,
  SceneSnapshot,
  ParticipantFrameContext,
} from "@chibatakumi/motion-core/participant";
import type { AudioWiring } from "@chibatakumi/motion-core/audio";
import {
  createFilmPostPass,
  type MotionFilmPostConfig,
  type MotionFilmPostPass,
} from "webgpu-motion-post";
import { FILM_STOCK_CANON } from "webgpu-motion-art";

import {
  GRID_WIRING,
  GRID_AUDIO_DELTA_BUFFER,
  type GridParam,
} from "./audio/wiring";
import {
  createDiscreteGridScene,
  type DiscreteGridScene,
  type DiscreteGridSnapshot,
} from "./scene/discrete-grid-scene";
import {
  createGridBlockPass,
  type GridBlockPass,
  type GridReactiveState,
} from "./render/grid-block-pass";
import { ELECTRIC_TICKER_CHARACTERS } from "./scene/typography/hero-word-pattern-registry";

// ---------------------------------------------------------------------------
// Static film-stock baselines (mirrors life/output/motion-grid-guided-webgpu
// main.ts). Cached once; the audio-reactive deltas are added per frame.
// ---------------------------------------------------------------------------

const GRAIN_STATIC = FILM_STOCK_CANON.grain;
const CHROMATIC_STATIC = FILM_STOCK_CANON.chromaticAberration;
const BLOOM_STATIC = FILM_STOCK_CANON.bloom;
const VIGNETTE_STATIC = FILM_STOCK_CANON.vignette;
const TONEMAP_STATIC = FILM_STOCK_CANON.tonemap;

// ---------------------------------------------------------------------------
// Intensity shaping — mirrors main.ts's shapeIntensity (gate 0.08, range 0.72).
// ---------------------------------------------------------------------------

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

function shapeIntensity(raw: number): number {
  return clamp01((raw - 0.08) / 0.72);
}

function deriveReactive(audioState: AudioState): GridReactiveState {
  return {
    ...audioState.bands,
    ...audioState.onsets,
    intensity: shapeIntensity(audioState.intensity),
  };
}

// ---------------------------------------------------------------------------
// Film-post config composer. Audio deltas (resolved into
// GRID_AUDIO_DELTA_BUFFER by `update`) are added to the static baselines.
// Electric scene signals (strikeFlag, flickerIntensity, glowMix, rgbSplitBump)
// compose on top — they are non-audio scene-driven, lifted from main.ts.
// ---------------------------------------------------------------------------

interface ElectricFilmSignals {
  readonly strikeFlag: number;
  readonly strikePhase: number;
  readonly flickerIntensity: number;
  readonly glowMix: number;
  readonly rgbSplitBump: number;
}

function composeFilmConfig(
  electric: ElectricFilmSignals,
): Partial<MotionFilmPostConfig> {
  const caBump =
    electric.strikeFlag *
    electric.strikePhase *
    0.006 *
    (0.5 + electric.rgbSplitBump * 0.4);

  return {
    grain: {
      ...GRAIN_STATIC,
      intensity: GRAIN_STATIC.intensity + electric.flickerIntensity * 0.12,
    },
    chromaticAberration: {
      ...CHROMATIC_STATIC,
      amount: CHROMATIC_STATIC.amount + caBump,
    },
    vignette: VIGNETTE_STATIC,
    bloom: {
      ...BLOOM_STATIC,
      threshold:
        BLOOM_STATIC.threshold +
        GRID_AUDIO_DELTA_BUFFER["film.bloom.threshold"] -
        electric.glowMix * 0.28,
      intensity:
        BLOOM_STATIC.intensity +
        GRID_AUDIO_DELTA_BUFFER["film.bloom.intensity"] +
        electric.glowMix * 0.35,
      warmth: BLOOM_STATIC.warmth - electric.glowMix * 0.10,
    },
    tonemap: {
      ...TONEMAP_STATIC,
      compression:
        TONEMAP_STATIC.compression +
        GRID_AUDIO_DELTA_BUFFER["film.tonemap.compression"],
    },
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface CreateGridParticipantOptions {
  /** Override the registered name. Default: "grid". */
  readonly name?: string;
  /** Initial hero token. If omitted, falls back to the scene's default. */
  readonly initialHeroToken?: string;
  /**
   * Bind keyboard cluster for hero-token / pattern cycling. Phase A: deferred.
   * The flag is accepted today so the API surface is stable for portfolio
   * shell code; wiring lands in Phase A+1.
   */
  readonly enableInput?: boolean;
}

/**
 * Construct a grid MotionParticipant. The returned instance is uninitialized;
 * MotionStage will call `init(device, format)` on first activation.
 */
export function createGridParticipant(
  opts: CreateGridParticipantOptions = {},
): MotionParticipant<GridParam> {
  const name = opts.name ?? "grid";

  // Bound state — populated by `init`, cleared by `dispose`.
  let device: GPUDevice | null = null;
  let outputFormat: GPUTextureFormat | null = null;
  let scene: DiscreteGridScene | null = null;
  let blockPass: GridBlockPass | null = null;
  let filmPost: MotionFilmPostPass | null = null;
  // Internal offscreen target — separate from MotionStage's outputView so the
  // grid pipeline can run blockPass → film-post composite (canonical pattern
  // from motion-grid-guided-webgpu/src/main.ts). Resized lazily on first render.
  let offscreenTexture: GPUTexture | null = null;
  let offscreenWidth = 0;
  let offscreenHeight = 0;

  // Per-frame audio reactive cache (written by update, read by render).
  let cachedReactive: GridReactiveState = {
    bass: 0,
    mid: 0,
    treble: 0,
    energy: 0,
    intensity: 0,
    bassOnset: 0,
    midOnset: 0,
    trebleOnset: 0,
    globalOnset: 0,
  };

  let initialized = false;

  function ensureOffscreenView(w: number, h: number): GPUTextureView {
    if (offscreenTexture && offscreenWidth === w && offscreenHeight === h) {
      return offscreenTexture.createView({
        label: `motion-grid:${name}/offscreen-view`,
      });
    }
    if (offscreenTexture) {
      offscreenTexture.destroy();
    }
    if (!device) {
      throw new Error(`[motion-grid] device unavailable when allocating offscreen`);
    }
    offscreenTexture = device.createTexture({
      label: `motion-grid:${name}/offscreen`,
      size: { width: w, height: h },
      format: "rgba16float",
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    offscreenWidth = w;
    offscreenHeight = h;
    return offscreenTexture.createView({
      label: `motion-grid:${name}/offscreen-view`,
    });
  }

  const participant: MotionParticipant<GridParam> = {
    name,
    fps: 45,
    audioWiring: GRID_WIRING as AudioWiring<GridParam>,

    async init(d: GPUDevice, format: GPUTextureFormat): Promise<void> {
      device = d;
      outputFormat = format;

      scene = createDiscreteGridScene();
      if (opts.initialHeroToken !== undefined) {
        // setHeroToken is a synchronous swap. validateHeroToken throws
        // semantically by yielding `ok: false`; we surface that as an error
        // rather than silently committing an invalid hero word.
        const validation = scene.validateHeroToken(opts.initialHeroToken);
        if (!validation.ok) {
          throw new Error(
            `[motion-grid] initialHeroToken "${opts.initialHeroToken}" rejected: reason=${validation.reason}`,
          );
        }
        scene.setHeroToken(validation.normalizedToken);
      }

      // GridBlockPass renders into the offscreen rgba16float target.
      blockPass = createGridBlockPass(d, "rgba16float");

      // Film-post writes to the stage's outputView (whose format == `format`).
      // FILM_STOCK_CANON baselines are wired here; per-frame deltas are
      // applied via `updateConfig` in `render`.
      filmPost = createFilmPostPass(d, format, {
        grain: GRAIN_STATIC,
        chromaticAberration: CHROMATIC_STATIC,
        bloom: BLOOM_STATIC,
        vignette: VIGNETTE_STATIC,
        tonemap: TONEMAP_STATIC,
      });

      void opts.enableInput; // Phase A+1 — keyboard cluster wiring deferred.

      initialized = true;
    },

    update(dt: number, audioState: AudioState, _scene: SceneSnapshot): void {
      if (!initialized) {
        throw new Error(
          `[motion-grid] update() called before init() — did MotionStage.register fire?`,
        );
      }
      if (!scene) {
        throw new Error(
          `[motion-grid] update() — scene not built (init didn't complete?)`,
        );
      }

      // CPU scene update: state machine drives blocks toward next phrase step.
      scene.update(dt);

      // Resolve the 3-wire GRID_WIRING into the alloc-free delta buffer.
      // GridReactiveState is built from AudioBus shape (`bands`/`onsets`/
      // intensity envelope after gate/range shaping). This same struct is
      // both the input to the wiring resolver AND the per-block reactive
      // sidecar consumed by GridBlockPass.
      const reactive = deriveReactive(audioState);
      cachedReactive = reactive;

      GRID_WIRING.resolveInto(
        GRID_AUDIO_DELTA_BUFFER,
        reactive,
        reactive,
        reactive.intensity,
      );
    },

    render(ctx: ParticipantFrameContext): void {
      if (!initialized) {
        throw new Error(
          `[motion-grid] render() called before init() — did MotionStage.register fire?`,
        );
      }
      if (!device || !scene || !blockPass || !filmPost) {
        throw new Error(
          `[motion-grid] render() — required GPU resources not built (init didn't complete?)`,
        );
      }

      // Push current physical pixel size into the scene so its grid
      // dimensions track DPR / window resize.
      scene.resize(ctx.width, ctx.height);

      const snapshot: DiscreteGridSnapshot = scene.getSnapshot();
      const offscreenView = ensureOffscreenView(ctx.width, ctx.height);

      // Compose film-post config from audio deltas + electric scene signals.
      const character = ELECTRIC_TICKER_CHARACTERS[snapshot.patternId];
      filmPost.updateConfig(
        composeFilmConfig({
          strikeFlag: snapshot.strikeFlag,
          strikePhase: snapshot.strikePhase,
          flickerIntensity: snapshot.flickerIntensity,
          glowMix: snapshot.glowMix,
          rgbSplitBump: character?.rgbSplitBump ?? 0,
        }),
      );

      // Pass A — block render to offscreen rgba16float.
      // Phase A: textAlpha is hard-pinned to 1 (input fade is not wired).
      blockPass.render(ctx.encoder, offscreenView, snapshot, cachedReactive, 1);

      // Pass B — film post composes offscreen onto the stage's outputView.
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
      // Inter-participant cross-fade is owned by MotionStage at the
      // composite layer; intra-grid handoffs (pattern / word) are owned
      // by DiscreteGridScene. Nothing to do here in Phase A.
    },

    dispose(): void {
      if (!initialized) return;
      try { scene?.destroy(); } catch { /* ignore */ }
      try { blockPass?.destroy(); } catch { /* ignore */ }
      try { filmPost?.destroy(); } catch { /* ignore */ }
      if (offscreenTexture) {
        try { offscreenTexture.destroy(); } catch { /* ignore */ }
      }
      scene = null;
      blockPass = null;
      filmPost = null;
      offscreenTexture = null;
      offscreenWidth = 0;
      offscreenHeight = 0;
      device = null;
      outputFormat = null;
      initialized = false;
    },
  };

  return participant;
}

// ---------------------------------------------------------------------------
// Re-exports — surface the canon for portfolio shell / route handlers.
// ---------------------------------------------------------------------------

export { GRID_WIRING, GRID_AUDIO_DELTA_BUFFER } from "./audio/wiring";
export type { GridParam } from "./audio/wiring";
export { createDiscreteGridScene } from "./scene/discrete-grid-scene";
export type {
  DiscreteGridScene,
  DiscreteGridSnapshot,
  HeroTokenValidation,
  WordMorphValidation,
} from "./scene/discrete-grid-scene";
export { createGridBlockPass } from "./render/grid-block-pass";
export type { GridBlockPass, GridReactiveState } from "./render/grid-block-pass";

/**
 * @deprecated Use `GridParam` (canon, mirrors `./audio/wiring.ts`). Kept as a
 * type alias so call sites that imported the scaffold's `GridParams` don't
 * break during the Phase A→A+1 transition.
 */
export type GridParams = GridParam;
