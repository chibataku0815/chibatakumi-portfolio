// @chibatakumi/motion-dot — Renewal 2026 Phase 1 / Stream 2.
//
// Source: life/output/motion-dot-new-webgpu (vendored under src/)
// Wraps as MotionParticipant. Used at /experiments/dot (full HUD + gallery)
// and as ambient motion vocabulary on home / works pages.
//
// Stream 2 deliverables:
//   * `createDotScene(name, device, opts?)` — REAL factory. 17 vendor presets
//     (gpu-fx-presets) + local `fluid` (compute-driven). Returns a unified
//     `DotScene` adapter so callers can drive any scene with the same shape.
//   * `createDotParticipant(opts?)` — SCAFFOLD matching motion-grid /
//     motion-flow parity. Phase A wiring (MetaballSDF + FilmPost + audio
//     resolve loop) lands when MotionStage in motion-core picks up the
//     real implementation. Throws cleanly on uninitialized usage — see
//     `feedback_no_fallback_bug_hotbed.md`.
//
// Audio param canon: see `./audio/wiring` (DOT_WIRING). 7-wire canon-化
// (1 input → 1 param) replacing legacy multi-input mappings.

import type {
  MotionParticipant,
  AudioState,
  SceneSnapshot,
  ParticipantFrameContext,
} from "@chibatakumi/motion-core/participant";
import type { AudioWiring } from "@chibatakumi/motion-core/audio";

import {
  createChainParticles,
  createConvergeParticles,
  createDeltaParticles,
  createFireflyParticles,
  createFlockParticles,
  createGridFluidParticles,
  createHelixParticles,
  createMagnetParticles,
  createMetaballSDF,
  createMitosisParticles,
  createMolecularParticles,
  createOrbitParticles,
  createPendulumParticles,
  createPhaseTransitionParticles,
  createRippleParticles,
  createRiverParticles,
  createTextAttractorParticles,
  type AttractorConfig,
  type AudioReactiveBands,
  type MetaballParticleSource,
  type MetaballSDF,
  type ParticleStateSnapshot,
} from "gpu-fx-presets";
import {
  createFilmPostPass,
  type MotionFilmPostPass,
} from "webgpu-motion-post";

import { createFluidScene, type FluidScene } from "./scene/fluid-scene";
import { DOT_WIRING, DOT_AUDIO_DELTA_BUFFER } from "./audio/wiring";
import type { DotParam } from "./audio/wiring";
import {
  createKineticHandoff,
  type KineticHandoffController,
  type TransitionScene,
} from "./transition/kinetic-handoff";

// ---------------------------------------------------------------------------
// Scene name canon (17 vendor presets + 1 local). Order matches
// `life/output/motion-dot-new-webgpu/src/main.ts` libScenes for handoff
// snapshot index parity.
// ---------------------------------------------------------------------------

export const DOT_SCENE_NAMES = [
  "orbit",
  "river",
  "magnet",
  "mitosis",
  "pendulum",
  "ripple",
  "delta",
  "flock",
  "helix",
  "phase-transition",
  "firefly",
  "molecular",
  "chain",
  "converge",
  "text-attractor",
  "grid-fluid",
  "fluid",
] as const;

export type DotSceneName = typeof DOT_SCENE_NAMES[number];

// Subset that is safe to cycle through with KineticHandoff: every vendor
// preset (16 entries). The local "fluid" scene needs the legacy metaball
// pass — wiring lands in Phase A+1, so we exclude it here.
export const CYCLEABLE_DOT_SCENES: readonly Exclude<DotSceneName, "fluid">[] =
  DOT_SCENE_NAMES.filter(
    (name): name is Exclude<DotSceneName, "fluid"> => name !== "fluid",
  );

// ---------------------------------------------------------------------------
// Unified scene adapter. Both vendor preset sources (MetaballParticleSource,
// `update(encoder, time, dt)`) and the local FluidScene (`encode(encoder,
// time, dt)`) collapse to this single contract so callers — including
// `createDotParticipant` and demo routes — drive every scene identically.
// ---------------------------------------------------------------------------

export interface DotScene {
  readonly name: DotSceneName;
  /** Run compute / particle update for this frame. */
  encode(encoder: GPUCommandEncoder, time: number, dt: number): void;
  /** 32-byte Particle storage buffer (matches gpu-fx-presets layout). */
  readonly particleBuffer: GPUBuffer;
  readonly count: number;
  reset(): void;
  destroy(): void;
  setAttractor?(config: AttractorConfig | null): void;
  exportState?(): ParticleStateSnapshot;
  exportStateAsync?(): Promise<ParticleStateSnapshot>;
  importState?(snapshot: ParticleStateSnapshot): void;
}

export interface CreateDotSceneOptions {
  /** Particle count override. Vendor presets ignore this. Fluid uses it. */
  readonly particleCount?: number;
}

// ---------------------------------------------------------------------------
// createDotScene — real factory, name-dispatched.
// ---------------------------------------------------------------------------

export function createDotScene(
  name: DotSceneName,
  device: GPUDevice,
  opts: CreateDotSceneOptions = {},
): DotScene {
  if (name === "fluid") {
    const fluid = createFluidScene(
      device,
      opts.particleCount !== undefined ? { count: opts.particleCount } : undefined,
    );
    return adaptFluidScene(name, fluid);
  }
  return adaptVendorSource(name, createVendorSource(name, device));
}

function createVendorSource(
  name: Exclude<DotSceneName, "fluid">,
  device: GPUDevice,
): MetaballParticleSource {
  switch (name) {
    case "orbit": return createOrbitParticles(device);
    case "river": return createRiverParticles(device);
    case "magnet": return createMagnetParticles(device);
    case "mitosis": return createMitosisParticles(device);
    case "pendulum": return createPendulumParticles(device);
    case "ripple": return createRippleParticles(device);
    case "delta": return createDeltaParticles(device);
    case "flock": return createFlockParticles(device);
    case "helix": return createHelixParticles(device);
    case "phase-transition": return createPhaseTransitionParticles(device);
    case "firefly": return createFireflyParticles(device);
    case "molecular": return createMolecularParticles(device);
    case "chain": return createChainParticles(device);
    case "converge": return createConvergeParticles(device);
    case "text-attractor": return createTextAttractorParticles(device);
    case "grid-fluid": return createGridFluidParticles(device);
  }
}

function adaptVendorSource(
  name: DotSceneName,
  source: MetaballParticleSource,
): DotScene {
  return {
    name,
    encode: (encoder, time, dt) => source.update(encoder, time, dt),
    get particleBuffer() { return source.particleBuffer; },
    get count() { return source.count; },
    reset: () => source.reset(),
    destroy: () => source.destroy(),
    setAttractor: source.setAttractor
      ? (config) => source.setAttractor!(config)
      : undefined,
    exportState: source.exportState
      ? () => source.exportState!()
      : undefined,
    importState: source.importState
      ? (snapshot) => source.importState!(snapshot)
      : undefined,
  };
}

function adaptFluidScene(name: DotSceneName, fluid: FluidScene): DotScene {
  return {
    name,
    encode: (encoder, time, dt) => fluid.encode(encoder, time, dt),
    get particleBuffer() { return fluid.particleBuffer; },
    get count() { return fluid.count; },
    reset: () => fluid.reset(),
    destroy: () => fluid.destroy(),
    setAttractor: (config) => fluid.setAttractor(config),
    exportStateAsync: () => fluid.exportStateAsync(),
    importState: (snapshot) => fluid.importState(snapshot),
  };
}

// ---------------------------------------------------------------------------
// createDotParticipant — Phase 1 scaffold. Mirrors motion-grid /
// motion-flow shape so portfolio shell (Stream 4) can compile against the
// MotionParticipant<DotParam> contract today. Phase A wiring will replace
// the stub bodies with the full SceneEntry array + MetaballSDF +
// MotionFilmPostPass + KineticHandoff orchestration (already vendored under
// `src/`).
// ---------------------------------------------------------------------------

export interface CreateDotParticipantOptions {
  /** Override the registered name. Default: "dot". */
  readonly name?: string;
  /** Initial scene. Default: "river" (ambient reference scene). */
  readonly initialScene?: DotSceneName;
  /** Show HUD overlay. Portfolio default: false (gallery mode opt-in). */
  readonly enableHud?: boolean;
  /** Bind keyboard cluster for scene cycling. Gallery default: true. */
  readonly enableInput?: boolean;
  /** Particle count override applied only to the local `fluid` scene. */
  readonly fluidParticleCount?: number;
  /**
   * When true, the participant cycles through `cycleScenes` automatically
   * via KineticHandoff. Each scene plays ~5.5s, then a 1.75s + 1.25s blend
   * with attractor burst hands off to the next scene (canonical motion-dot
   * showcase loop). Default: false (single-scene, current Phase A behavior
   * — used by ambient surfaces like home / works pages).
   */
  readonly enableSceneCycle?: boolean;
  /**
   * Override the cycle list. Defaults to all 16 vendor scenes
   * (CYCLEABLE_DOT_SCENES). Order is preserved — KineticHandoff visits
   * scenes in this order, wrapping back to index 0 after the last.
   */
  readonly cycleScenes?: readonly Exclude<DotSceneName, "fluid">[];
}

export const DOT_DEFAULT_INITIAL_SCENE: DotSceneName = "river";

// Tuning constants (from motion-dot-new-webgpu/src/main.ts INTENSITY_TUNING).
// Single-scene panelCount=1 path; gallery mode is deferred (Phase A+1).
const INTENSITY_GATE = 0.08;
const INTENSITY_RANGE = 0.84;
const INTENSITY_CONTRAST = 1.35;

function clamp01(v: number): number {
  return Math.min(Math.max(v, 0), 1);
}

function shapeIntensity(rawIntensity: number): number {
  const normalized = clamp01((rawIntensity - INTENSITY_GATE) / INTENSITY_RANGE);
  return clamp01((normalized - 0.5) * INTENSITY_CONTRAST + 0.5);
}

function buildVendorSource(
  name: Exclude<DotSceneName, "fluid">,
  device: GPUDevice,
): MetaballParticleSource {
  switch (name) {
    case "orbit": return createOrbitParticles(device);
    case "river": return createRiverParticles(device);
    case "magnet": return createMagnetParticles(device);
    case "mitosis": return createMitosisParticles(device);
    case "pendulum": return createPendulumParticles(device);
    case "ripple": return createRippleParticles(device);
    case "delta": return createDeltaParticles(device);
    case "flock": return createFlockParticles(device);
    case "helix": return createHelixParticles(device);
    case "phase-transition": return createPhaseTransitionParticles(device);
    case "firefly": return createFireflyParticles(device);
    case "molecular": return createMolecularParticles(device);
    case "chain": return createChainParticles(device);
    case "converge": return createConvergeParticles(device);
    case "text-attractor": return createTextAttractorParticles(device);
    case "grid-fluid": return createGridFluidParticles(device);
  }
}

export function createDotParticipant(
  opts: CreateDotParticipantOptions = {},
): MotionParticipant<DotParam> {
  const name = opts.name ?? "dot";
  const initialScene: DotSceneName = opts.initialScene ?? DOT_DEFAULT_INITIAL_SCENE;
  const enableSceneCycle = opts.enableSceneCycle ?? false;
  const cycleSceneList: readonly Exclude<DotSceneName, "fluid">[] =
    opts.cycleScenes ?? CYCLEABLE_DOT_SCENES;

  // Bound state — populated by `init`, cleared by `dispose`.
  let device: GPUDevice | null = null;
  let outputFormat: GPUTextureFormat | null = null;
  let sdf: MetaballSDF | null = null;
  let filmPost: MotionFilmPostPass | null = null;

  // Single-scene mode (legacy / default when enableSceneCycle is false).
  let currentSource: MetaballParticleSource | null = null;
  let currentFluid: FluidScene | null = null;

  // Multi-scene cycle mode (enableSceneCycle = true). All vendor sources
  // are built upfront in init so KineticHandoff can swap between them
  // without per-frame allocation. Fluid is excluded (Phase A+1 scope).
  let cycleSources: MetaballParticleSource[] = [];
  let cycleSceneNames: string[] = [];
  let cycleIdx = 0;
  let kineticHandoff: KineticHandoffController | null = null;

  // Internal offscreen target — separate from MotionStage's outputView so
  // the participant can run SDF → film-post composite (the canonical dot
  // pipeline). Resized lazily on first render.
  let offscreenTexture: GPUTexture | null = null;
  let offscreenWidth = 0;
  let offscreenHeight = 0;

  // Per-frame audio shaping cache (written by update, read by render).
  let cachedShapedIntensity = 0;

  let initialized = false;

  function ensureOffscreenView(w: number, h: number): GPUTextureView {
    if (offscreenTexture && offscreenWidth === w && offscreenHeight === h) {
      return offscreenTexture.createView({ label: `motion-dot:${name}/offscreen-view` });
    }
    if (offscreenTexture) {
      offscreenTexture.destroy();
    }
    if (!device) {
      throw new Error(`[motion-dot] device unavailable when allocating offscreen`);
    }
    offscreenTexture = device.createTexture({
      label: `motion-dot:${name}/offscreen`,
      size: { width: w, height: h },
      format: "rgba16float",
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    offscreenWidth = w;
    offscreenHeight = h;
    return offscreenTexture.createView({ label: `motion-dot:${name}/offscreen-view` });
  }

  function getActiveSource(): MetaballParticleSource | null {
    if (enableSceneCycle && cycleSources.length > 0) {
      return cycleSources[cycleIdx] ?? null;
    }
    return currentSource;
  }

  const participant: MotionParticipant<DotParam> = {
    name,
    fps: 45,
    audioWiring: DOT_WIRING as AudioWiring<DotParam>,

    async init(d: GPUDevice, format: GPUTextureFormat): Promise<void> {
      device = d;
      outputFormat = format;

      if (enableSceneCycle) {
        // Pre-build every cycle scene so KineticHandoff swaps are cheap.
        cycleSceneNames = cycleSceneList.map((s) => String(s));
        cycleSources = cycleSceneList.map((sceneName) => buildVendorSource(sceneName, d));

        // Resolve initialScene to an idx within the cycle list. If the
        // requested scene is not present (e.g. "fluid"), start at 0.
        const requestedIdx = cycleSceneList.indexOf(
          initialScene as Exclude<DotSceneName, "fluid">,
        );
        cycleIdx = requestedIdx >= 0 ? requestedIdx : 0;

        const transitionScenes: TransitionScene[] = cycleSources.map(
          (source, i) => ({ name: cycleSceneNames[i], participant: source }),
        );
        kineticHandoff = createKineticHandoff({
          scenes: transitionScenes,
          getCurrentIndex: () => cycleIdx,
          setCurrentIndex: (next) => {
            cycleIdx = next;
          },
        });
        // Kick off the auto-cycle. start(idx) drives the state machine
        // playing → blending → handoff → start(next) recursively, so we
        // only need to call it once.
        kineticHandoff.start(cycleIdx);
      } else if (initialScene === "fluid") {
        // Build but do not wire — render() throws until Phase A+1 brings
        // the fluid → legacy-metaball path online.
        currentFluid = createFluidScene(
          d,
          opts.fluidParticleCount !== undefined
            ? { count: opts.fluidParticleCount }
            : undefined,
        );
      } else {
        currentSource = buildVendorSource(initialScene, d);
      }

      filmPost = createFilmPostPass(d, format);

      void opts.enableHud;   // HUD wiring deferred; portfolio currently uses chrome
      void opts.enableInput; // Keyboard cluster deferred; route owns activation

      initialized = true;
    },

    update(dt: number, audioState: AudioState, scene: SceneSnapshot): void {
      if (!initialized) {
        throw new Error(
          `[motion-dot] update() called before init() — did MotionStage.register fire?`,
        );
      }

      // Shape the long-envelope intensity into the gate/range/contrast curve.
      const shaped = shapeIntensity(audioState.intensity);
      cachedShapedIntensity = shaped;

      // Resolve the 7-wire DOT_WIRING into the alloc-free delta buffer.
      DOT_WIRING.resolveInto(
        DOT_AUDIO_DELTA_BUFFER,
        audioState.bands,
        audioState.onsets,
        shaped,
      );

      // Tick KineticHandoff state machine: idle → playing → blending →
      // handoff → playing chain. May rewrite cycleIdx via setCurrentIndex
      // when a handoff completes.
      if (kineticHandoff) {
        kineticHandoff.update(dt, scene.time);
      }

      // Push audio reactive bands to the ACTIVE source. Sources without
      // setAudioReactive ignore it (they still animate via internal physics).
      const active = getActiveSource();
      if (active && active.setAudioReactive) {
        const reactive: AudioReactiveBands = {
          ...audioState.bands,
          ...audioState.onsets,
          intensity: shaped,
        };
        active.setAudioReactive(reactive);
      }
    },

    render(ctx: ParticipantFrameContext): void {
      if (!initialized) {
        throw new Error(
          `[motion-dot] render() called before init() — did MotionStage.register fire?`,
        );
      }
      if (!device || !filmPost) {
        throw new Error(
          `[motion-dot] render() — required GPU resources not built (init didn't complete?)`,
        );
      }

      const active = getActiveSource();

      // Fluid scene path is not wired in Phase A. Throwing here keeps the
      // contract honest (`feedback_no_fallback_bug_hotbed.md` — no silent
      // degradation).
      if (currentFluid && !active) {
        throw new Error(
          `[motion-dot] fluid scene rendering is deferred (Phase A+1). Pick a vendor scene via initialScene or use enableSceneCycle.`,
        );
      }
      if (!active) {
        throw new Error(
          `[motion-dot] no scene source — did init complete?`,
        );
      }

      // Lazy SDF init / resize. SDF caches device + output format internally.
      if (!sdf) {
        sdf = createMetaballSDF(device, ctx.width, ctx.height);
      } else {
        sdf.resize(ctx.width, ctx.height);
      }

      const offscreenView = ensureOffscreenView(ctx.width, ctx.height);

      // Compute the per-frame presentation modulation for panelCount=1.
      // Gallery (panelCount > 1) mode is deferred — when wired, multiply the
      // additive deltas below by the galleryMix damping coefficients from
      // life/output/motion-dot-new-webgpu/src/main.ts INTENSITY_TUNING.
      const threshold = 1.0 + DOT_AUDIO_DELTA_BUFFER["scene.threshold"];
      const softness = 0.015 + DOT_AUDIO_DELTA_BUFFER["scene.softness"];
      const rimIntensity = 0.04 + cachedShapedIntensity * 0.24;
      const bloomIntensity = 0.3 + DOT_AUDIO_DELTA_BUFFER["film.bloom.intensity"];
      const bloomThreshold = 0.55 + DOT_AUDIO_DELTA_BUFFER["film.bloom.threshold"];
      const grainIntensity = 0.05 + DOT_AUDIO_DELTA_BUFFER["film.grain.intensity"];
      const chromaAmount = 0.001 + DOT_AUDIO_DELTA_BUFFER["film.chroma.amount"];
      const vignetteStrength = 0.80 + DOT_AUDIO_DELTA_BUFFER["film.vignette.strength"];

      sdf.updateConfig({
        threshold,
        softness,
        rimIntensity,
      });
      filmPost.updateConfig({
        bloom: { intensity: bloomIntensity, threshold: bloomThreshold, warmth: 0.0 },
        grain: { intensity: grainIntensity, size: 0.6, radialMix: 0.35 },
        chromaticAberration: { amount: chromaAmount },
        vignette: { strength: vignetteStrength, warmShift: 0.0 },
      });

      // SDF reads particles from `active` and runs `source.update` internally
      // (per-frame compute pass), then renders metaballs into `offscreenView`.
      // In cycle mode KineticHandoff has already swapped cycleIdx and applies
      // the attractor burst on the source scene during the blend phase.
      sdf.render(ctx.encoder, offscreenView, ctx.time, active);

      // Film post composes the offscreen onto the stage's outputView.
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
      // Dot's internal scene-to-scene transition is owned by KineticHandoff
      // (transition/kinetic-handoff.ts) — not relevant for inter-PARTICIPANT
      // blends. MotionStage runs the participant cross-fade at the composite
      // layer, so this method is a no-op for now.
    },

    dispose(): void {
      if (!initialized) return;
      try { currentSource?.destroy(); } catch { /* ignore */ }
      try { currentFluid?.destroy(); } catch { /* ignore */ }
      for (const src of cycleSources) {
        try { src.destroy(); } catch { /* ignore */ }
      }
      try { sdf?.destroy(); } catch { /* ignore */ }
      try { filmPost?.destroy(); } catch { /* ignore */ }
      if (offscreenTexture) {
        try { offscreenTexture.destroy(); } catch { /* ignore */ }
      }
      currentSource = null;
      currentFluid = null;
      cycleSources = [];
      cycleSceneNames = [];
      cycleIdx = 0;
      kineticHandoff = null;
      sdf = null;
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
// Re-exports — surface the canon for portfolio shell / gallery / kinetic
// handoff orchestration.
// ---------------------------------------------------------------------------

export { DOT_WIRING, DOT_AUDIO_DELTA_BUFFER } from "./audio/wiring";
export type { DotParam } from "./audio/wiring";

export { createKineticHandoff } from "./transition/kinetic-handoff";
export type {
  KineticHandoffController,
  TransitionParticipant,
  TransitionScene,
  TransitionPhase,
} from "./transition/kinetic-handoff";

export { createGalleryMode } from "./scene/composite-25d";
export type { GalleryMode, PanelRenderer } from "./scene/composite-25d";

export { createFluidScene } from "./scene/fluid-scene";
export type { FluidScene } from "./scene/fluid-scene";

export type { Scene } from "./scene/scene-types";
export { PARTICLE_FLOATS, PARTICLE_BYTES } from "./scene/scene-types";

export type { AttractorConfig, ParticleStateSnapshot, MetaballParticleSource } from "gpu-fx-presets";

export const DOT_PACKAGE_VERSION = "0.1.0-phase-b";
