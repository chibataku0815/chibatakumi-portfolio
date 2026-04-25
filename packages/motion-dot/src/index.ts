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
import {
  createGalleryMode as createGalleryModeImpl,
  type GalleryMode,
  type PanelRenderer,
} from "./scene/composite-25d";

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
  /**
   * Multi-scene gallery mode (composite-25d). When true, N independent
   * vendor scenes are rendered simultaneously into a tiled grid layout
   * via `createGalleryMode`. Mutually exclusive with `enableSceneCycle`
   * — the participant throws on init if both are true. Default: false.
   *
   * Phase A+2 wiring: the panel set is fixed at init, audio reactive
   * state is broadcast to all panels, KineticHandoff is NOT engaged
   * (gallery shows static co-existence, not handoff). Phase A+3 may
   * unify cycle + gallery (handoff between layouts).
   */
  readonly enableGalleryMode?: boolean;
  /**
   * Number of simultaneous panels in gallery mode. Maps to the
   * composite-25d layout presets (2 / 4 / 8 / 12). Values are quantized
   * to the nearest supported layout. Default: 4 (2×2 grid).
   *
   * Only consulted when `enableGalleryMode === true`.
   */
  readonly panelCount?: number;
  /**
   * Explicit scene set for gallery panels. When omitted, the first
   * `panelCount` entries of CYCLEABLE_DOT_SCENES are used (deterministic).
   * If the array is shorter than `panelCount`, the list cycles modulo;
   * if longer, only the first `panelCount` entries are used.
   *
   * Only consulted when `enableGalleryMode === true`.
   */
  readonly galleryScenes?: readonly Exclude<DotSceneName, "fluid">[];
}

export const DOT_DEFAULT_INITIAL_SCENE: DotSceneName = "river";

// ---------------------------------------------------------------------------
// Scene display names (Title Case) — required for KineticHandoff anchor
// policy lookup. TRANSITION_ANCHOR_POLICIES in transition/kinetic-handoff.ts
// keys policies by Title Case scene name ("River Flow", "Pendulum Wave",
// "River Delta", "Chain", etc). Without this mapping, every scene falls
// back to DEFAULT_TRANSITION_ANCHOR_POLICY and per-scene transition burst
// quality is lost. Mirrors original motion-dot-new-webgpu/src/main.ts
// libScenes name field (line 261-275) + fluidScenes (line 277-279).
// ---------------------------------------------------------------------------

export const DOT_SCENE_DISPLAY_NAMES: Record<DotSceneName, string> = {
  orbit: "Orbit",
  river: "River Flow",
  magnet: "Magnet",
  mitosis: "Mitosis",
  pendulum: "Pendulum Wave",
  ripple: "Ripple",
  delta: "River Delta",
  flock: "Flock",
  helix: "DNA Helix",
  "phase-transition": "Phase Transition",
  firefly: "Firefly Sync",
  molecular: "Molecular",
  chain: "Chain",
  converge: "Converge",
  "text-attractor": "Living Typography",
  "grid-fluid": "Grid Fluid",
  fluid: "Fluid (GPU)",
};

// ---------------------------------------------------------------------------
// Tuning constants (full port from motion-dot-new-webgpu/src/main.ts
// INTENSITY_TUNING block, line 87-99). Includes gallery damping coefficients
// that Phase A+2 originally deferred.
// ---------------------------------------------------------------------------

const INTENSITY_TUNING = {
  gate: 0.08,
  range: 0.84,
  contrast: 1.35,
  galleryParticleLift: 0.45,
  galleryThresholdDamping: 0.34,
  gallerySoftnessDamping: 0.30,
  galleryRimDamping: 0.46,
  galleryBloomDamping: 0.36,
  galleryGrainDamping: 0.16,
  galleryChromaDamping: 0.24,
  galleryVignetteDamping: 0.32,
} as const;

interface PresentationModulation {
  particleIntensity: number;
  threshold: number;
  softness: number;
  rimIntensity: number;
  bloomIntensity: number;
  bloomThreshold: number;
  grainIntensity: number;
  chromaAmount: number;
  vignetteStrength: number;
}

// Per-scene-index gallery overrides (port from main.ts:113-131). The keys
// are GALLERY scene indices (within the gallerySources array order), so
// when galleryScenes is the default (CYCLEABLE_DOT_SCENES first N), idx 1
// = "river" / idx 6 = "delta" (mapping needs verification — see notes in
// applyGallerySceneDamping). Per-scene damping ONLY applies in gallery
// mode; single-scene cycle / single-scene mode ignore it.
const GALLERY_SCENE_DAMPING: Readonly<Record<number, Readonly<{
  particleIntensity: number;
  threshold: number;
  softness: number;
  rimIntensity: number;
}>>> = {
  1: {
    particleIntensity: 0.46,
    threshold: 0.30,
    softness: 0.65,
    rimIntensity: 0.45,
  },
  6: {
    particleIntensity: 0.50,
    threshold: 0.35,
    softness: 0.70,
    rimIntensity: 0.52,
  },
} as const;

function clamp01(v: number): number {
  return Math.min(Math.max(v, 0), 1);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function shapeIntensity(rawIntensity: number): number {
  const normalized = clamp01(
    (rawIntensity - INTENSITY_TUNING.gate) / INTENSITY_TUNING.range,
  );
  return clamp01((normalized - 0.5) * INTENSITY_TUNING.contrast + 0.5);
}

/**
 * Compute the per-frame presentation modulation. galleryMix scales 0→1 as
 * panelCount goes 1→12; bloom/grain/chroma/vignette/threshold/softness/rim
 * are damped proportionally to keep the gallery composite legible (full
 * intensity values were tuned for single-scene full-screen).
 *
 * Mirrors motion-dot-new-webgpu/src/main.ts:138-170.
 */
function createPresentationModulation(
  panelCount: number,
  shapedIntensity: number,
): PresentationModulation {
  const galleryMix = clamp01((panelCount - 1) / 11);
  const particleIntensity = lerp(
    shapedIntensity,
    1,
    galleryMix * INTENSITY_TUNING.galleryParticleLift,
  );

  const thresholdDamp = 1 - galleryMix * INTENSITY_TUNING.galleryThresholdDamping;
  const softnessDamp = 1 - galleryMix * INTENSITY_TUNING.gallerySoftnessDamping;
  const rimMin = lerp(0.04, 0.03, galleryMix);
  const rimSpan = 0.24 * (1 - galleryMix * INTENSITY_TUNING.galleryRimDamping);

  const bloomMul = 1 - galleryMix * INTENSITY_TUNING.galleryBloomDamping;
  const grainMul = 1 - galleryMix * INTENSITY_TUNING.galleryGrainDamping;
  const chromaMul = 1 - galleryMix * INTENSITY_TUNING.galleryChromaDamping;
  const vignetteMul = 1 - galleryMix * INTENSITY_TUNING.galleryVignetteDamping;

  return {
    particleIntensity,
    threshold: 1.0 + DOT_AUDIO_DELTA_BUFFER["scene.threshold"] * thresholdDamp,
    softness: 0.015 + DOT_AUDIO_DELTA_BUFFER["scene.softness"] * softnessDamp,
    rimIntensity: rimMin + shapedIntensity * rimSpan,
    bloomIntensity:
      0.3 + DOT_AUDIO_DELTA_BUFFER["film.bloom.intensity"] * bloomMul,
    bloomThreshold:
      0.55 + DOT_AUDIO_DELTA_BUFFER["film.bloom.threshold"] * bloomMul,
    grainIntensity:
      0.05 + DOT_AUDIO_DELTA_BUFFER["film.grain.intensity"] * grainMul,
    chromaAmount: 0.001 + DOT_AUDIO_DELTA_BUFFER["film.chroma.amount"] * chromaMul,
    vignetteStrength:
      0.80 + DOT_AUDIO_DELTA_BUFFER["film.vignette.strength"] * vignetteMul,
  };
}

/**
 * Per-panel damping for gallery mode. Returns a modified PresentationModulation
 * scoped to a single panel — only `particleIntensity` / `threshold` /
 * `softness` / `rimIntensity` change. Film-post values (bloom / grain /
 * chroma / vignette) are full-frame and stay at the gallery default.
 *
 * Mirrors motion-dot-new-webgpu/src/main.ts:197-213.
 */
function applyGallerySceneDamping(
  sceneIndex: number,
  modulation: PresentationModulation,
): PresentationModulation {
  const damping = GALLERY_SCENE_DAMPING[sceneIndex];
  if (!damping) return modulation;
  return {
    ...modulation,
    particleIntensity: modulation.particleIntensity * damping.particleIntensity,
    threshold: lerp(1.0, modulation.threshold, damping.threshold),
    softness: modulation.softness * damping.softness,
    rimIntensity: modulation.rimIntensity * damping.rimIntensity,
  };
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

// Supported gallery panel counts (must match composite-25d LAYOUTS array).
const GALLERY_LAYOUT_PANEL_COUNTS = [2, 4, 8, 12] as const;

function resolveGalleryPanelCount(requested: number): number {
  // Snap to nearest supported layout. Default to 4 if out of range.
  let best: number = GALLERY_LAYOUT_PANEL_COUNTS[1]; // 4
  let bestDelta = Math.abs(requested - best);
  for (const candidate of GALLERY_LAYOUT_PANEL_COUNTS) {
    const delta = Math.abs(requested - candidate);
    if (delta < bestDelta) {
      best = candidate;
      bestDelta = delta;
    }
  }
  return best;
}

export function createDotParticipant(
  opts: CreateDotParticipantOptions = {},
): MotionParticipant<DotParam> {
  const name = opts.name ?? "dot";
  const initialScene: DotSceneName = opts.initialScene ?? DOT_DEFAULT_INITIAL_SCENE;
  const enableSceneCycle = opts.enableSceneCycle ?? false;
  const enableGalleryMode = opts.enableGalleryMode ?? false;
  const enableInput = opts.enableInput ?? false;
  const cycleSceneList: readonly Exclude<DotSceneName, "fluid">[] =
    opts.cycleScenes ?? CYCLEABLE_DOT_SCENES;

  // Mutually exclusive — see CreateDotParticipantOptions JSDoc and
  // `feedback_no_fallback_bug_hotbed.md`. Phase A+3 may unify them.
  if (enableSceneCycle && enableGalleryMode) {
    throw new Error(
      `[motion-dot] enableSceneCycle and enableGalleryMode are mutually exclusive — Phase A+3 may unify them`,
    );
  }

  // Resolve gallery panel set up-front (pure, no GPU). Gallery mode uses
  // a fixed-layout grid keyed off panelCount (2 / 4 / 8 / 12).
  const galleryPanelCount = enableGalleryMode
    ? resolveGalleryPanelCount(opts.panelCount ?? 4)
    : 0;
  const gallerySceneList: readonly Exclude<DotSceneName, "fluid">[] = (() => {
    if (!enableGalleryMode) return [];
    const explicit = opts.galleryScenes;
    if (explicit && explicit.length > 0) {
      // Cycle through explicit list modulo panel count, deterministic.
      const result: Exclude<DotSceneName, "fluid">[] = [];
      for (let i = 0; i < galleryPanelCount; i++) {
        result.push(explicit[i % explicit.length]);
      }
      return result;
    }
    // Default: first N from CYCLEABLE_DOT_SCENES, cycling if N > 16.
    const result: Exclude<DotSceneName, "fluid">[] = [];
    for (let i = 0; i < galleryPanelCount; i++) {
      result.push(CYCLEABLE_DOT_SCENES[i % CYCLEABLE_DOT_SCENES.length]);
    }
    return result;
  })();

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

  // Multi-scene gallery mode (enableGalleryMode = true). N independent
  // sources are rendered into composite-25d's panel grid each frame.
  // Audio reactive state is broadcast to all panels.
  let gallerySources: MetaballParticleSource[] = [];
  let galleryMode: GalleryMode | null = null;
  // Intermediate offscreen — gallery composites panels into this, then
  // filmPost runs from this → participant offscreen. Re-allocated lazily
  // when canvas size changes.
  let galleryCompositeTexture: GPUTexture | null = null;
  let galleryCompositeWidth = 0;
  let galleryCompositeHeight = 0;

  // Internal offscreen target — separate from MotionStage's outputView so
  // the participant can run SDF → film-post composite (the canonical dot
  // pipeline). Resized lazily on first render.
  let offscreenTexture: GPUTexture | null = null;
  let offscreenWidth = 0;
  let offscreenHeight = 0;

  // Per-frame audio shaping cache (written by update, read by render).
  let cachedShapedIntensity = 0;

  // Keyboard cluster — only registered when enableInput is true. Bound
  // to participant lifecycle and removed on dispose.
  let keydownHandler: ((ev: KeyboardEvent) => void) | null = null;

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

  function ensureGalleryCompositeView(w: number, h: number): GPUTextureView {
    if (
      galleryCompositeTexture
      && galleryCompositeWidth === w
      && galleryCompositeHeight === h
    ) {
      return galleryCompositeTexture.createView({
        label: `motion-dot:${name}/gallery-composite-view`,
      });
    }
    if (galleryCompositeTexture) {
      galleryCompositeTexture.destroy();
    }
    if (!device) {
      throw new Error(`[motion-dot] device unavailable when allocating gallery composite`);
    }
    galleryCompositeTexture = device.createTexture({
      label: `motion-dot:${name}/gallery-composite`,
      size: { width: w, height: h },
      format: "rgba16float",
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    galleryCompositeWidth = w;
    galleryCompositeHeight = h;
    return galleryCompositeTexture.createView({
      label: `motion-dot:${name}/gallery-composite-view`,
    });
  }

  // Shared keyboard input guard — bail when focus is on a form field so
  // we don't hijack typing. Mirrors the desktop-film-lab pattern.
  function isInputElement(target: EventTarget | null): boolean {
    if (!target || !(target instanceof Element)) return false;
    const tag = target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    if (target instanceof HTMLElement && target.isContentEditable) return true;
    return false;
  }

  function handleNextKey(): void {
    // Single-scene: no scene to advance to. Gallery: rotate the visible
    // panel window by +1 (shows the next set of N scenes). Cycle: trigger
    // a fresh handoff from the current scene to the next.
    if (enableGalleryMode && galleryMode) {
      galleryMode.shiftBase(1);
      return;
    }
    if (enableSceneCycle && kineticHandoff && cycleSources.length > 0) {
      // If a transition is mid-flight, stop it cleanly first so the
      // user-driven advance feels responsive.
      if (kineticHandoff.isActive()) {
        kineticHandoff.stop();
      }
      kineticHandoff.start(cycleIdx);
    }
  }

  function handlePrevKey(): void {
    if (enableGalleryMode && galleryMode) {
      galleryMode.shiftBase(-1);
      return;
    }
    if (enableSceneCycle && kineticHandoff && cycleSources.length > 0) {
      if (kineticHandoff.isActive()) {
        kineticHandoff.stop();
      }
      // Decrement first, then start a handoff that lands ON the new
      // (already-decremented) idx by sourcing from the slot before it.
      const N = cycleSources.length;
      const targetIdx = (cycleIdx - 1 + N) % N;
      const sourceIdx = (targetIdx - 1 + N) % N;
      // Snap cycleIdx to the source so the in-flight handoff target
      // resolves to `targetIdx` via nextSceneIdx(sourceIdx).
      cycleIdx = sourceIdx;
      kineticHandoff.start(sourceIdx);
    }
  }

  function handleResetKey(): void {
    if (enableGalleryMode && galleryMode) {
      galleryMode.setBaseSceneIndex(0);
      galleryMode.resetLayout();
      return;
    }
    if (enableSceneCycle && kineticHandoff && cycleSources.length > 0) {
      if (kineticHandoff.isActive()) {
        kineticHandoff.stop();
      }
      cycleIdx = 0;
      kineticHandoff.start(cycleIdx);
    }
  }

  function onKeydown(ev: KeyboardEvent): void {
    if (isInputElement(ev.target)) return;
    switch (ev.key) {
      case "ArrowRight":
      case " ":
      case "n":
      case "N":
        handleNextKey();
        break;
      case "ArrowLeft":
      case "p":
      case "P":
        handlePrevKey();
        break;
      case "r":
      case "R":
        handleResetKey();
        break;
      default:
        return;
    }
  }

  const participant: MotionParticipant<DotParam> = {
    name,
    fps: 45,
    audioWiring: DOT_WIRING as AudioWiring<DotParam>,

    async init(d: GPUDevice, format: GPUTextureFormat): Promise<void> {
      device = d;
      outputFormat = format;

      if (enableGalleryMode) {
        // Build N independent vendor sources (one per panel). Gallery
        // mode renders all N every frame — there is no cycle, no
        // KineticHandoff. Phase A+3 may unify cycle + gallery.
        gallerySources = gallerySceneList.map((sceneName) => buildVendorSource(sceneName, d));
        // GalleryMode itself is created lazily in render() once we know
        // the canvas dimensions — composite-25d's createGalleryMode
        // expects width/height up-front for its texture pool.
      } else if (enableSceneCycle) {
        // Pre-build every cycle scene so KineticHandoff swaps are cheap.
        // Use Title Case display names so TRANSITION_ANCHOR_POLICIES
        // (keyed by "River Flow" / "Pendulum Wave" / "River Delta" /
        // "Chain") resolve correctly. Without this map, every transition
        // falls back to DEFAULT_TRANSITION_ANCHOR_POLICY and per-scene
        // anchor / orbit / wobble / burst tuning is lost — the visible
        // result is generic, less expressive scene-to-scene handoffs.
        cycleSceneNames = cycleSceneList.map((s) => DOT_SCENE_DISPLAY_NAMES[s]);
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

      void opts.enableHud; // HUD wiring deferred; portfolio currently uses chrome

      // Keyboard cluster — bind to document so the cluster works without
      // canvas focus. Bail on form-input focus so typing isn't hijacked.
      if (enableInput && typeof document !== "undefined") {
        keydownHandler = onKeydown;
        document.addEventListener("keydown", keydownHandler);
      }

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

      // Push audio reactive bands to all live sources. Gallery mode
      // broadcasts the same state to every panel (panels are meant to
      // feel coordinated). Sources without setAudioReactive ignore it
      // (they still animate via internal physics).
      const reactive: AudioReactiveBands = {
        ...audioState.bands,
        ...audioState.onsets,
        intensity: shaped,
      };

      if (enableGalleryMode && gallerySources.length > 0) {
        for (const src of gallerySources) {
          if (src.setAudioReactive) src.setAudioReactive(reactive);
        }
      } else {
        const active = getActiveSource();
        if (active && active.setAudioReactive) {
          active.setAudioReactive(reactive);
        }
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

      // Lazy SDF init / resize. SDF caches device + output format internally.
      // Used by both single-scene and gallery-panel paths (resized per-panel
      // inside the gallery callback, then restored to full size after).
      if (!sdf) {
        sdf = createMetaballSDF(device, ctx.width, ctx.height);
      } else {
        sdf.resize(ctx.width, ctx.height);
      }

      // Compute the per-frame presentation modulation. galleryMix is 0
      // for single-scene/cycle (panelCount=1) and scales toward 1 as
      // gallery panels increase — bloom/grain/chroma/vignette/threshold/
      // softness/rim are damped accordingly so the multi-scene composite
      // remains legible. (Mirrors original main.ts INTENSITY_TUNING port.)
      const panelCount = enableGalleryMode ? galleryPanelCount : 1;
      const modulation = createPresentationModulation(
        panelCount,
        cachedShapedIntensity,
      );

      // Film-post is FULL-FRAME (single composite pass over the entire
      // canvas / gallery composite) so it uses the gallery-mix-damped
      // modulation as-is. Per-panel SDF tuning is applied inside the
      // gallery render callback below via applyGallerySceneDamping.
      filmPost.updateConfig({
        bloom: {
          intensity: modulation.bloomIntensity,
          threshold: modulation.bloomThreshold,
          warmth: 0.0,
        },
        grain: {
          intensity: modulation.grainIntensity,
          size: 0.6,
          radialMix: 0.35,
        },
        chromaticAberration: { amount: modulation.chromaAmount },
        vignette: { strength: modulation.vignetteStrength, warmShift: 0.0 },
      });

      // Single-scene / cycle path uses the gallery-undamped modulation
      // directly (panelCount=1 → galleryMix=0 → all damp factors = 1).
      sdf.updateConfig({
        threshold: modulation.threshold,
        softness: modulation.softness,
        rimIntensity: modulation.rimIntensity,
      });

      // ── Gallery mode path ────────────────────────────────────────────
      if (enableGalleryMode) {
        if (gallerySources.length === 0) {
          throw new Error(
            `[motion-dot] gallery mode: no panel sources built — did init complete?`,
          );
        }
        // Lazy gallery init — needs canvas dims. composite-25d allocates
        // its own per-panel texture pool internally based on the layout.
        if (!galleryMode) {
          galleryMode = createGalleryModeImpl(device, ctx.width, ctx.height);
          // Snap the gallery layout to the requested panelCount. The
          // LAYOUTS array is [2, 4, 8, 12]; we step through nextLayout()
          // until we land on the requested layout.
          const targetIdx = GALLERY_LAYOUT_PANEL_COUNTS.indexOf(
            galleryPanelCount as typeof GALLERY_LAYOUT_PANEL_COUNTS[number],
          );
          // resetLayout() lands us at idx 0 (2 panels); then advance.
          galleryMode.resetLayout();
          for (let i = 0; i < targetIdx; i++) {
            galleryMode.nextLayout();
          }
        } else {
          galleryMode.resize(ctx.width, ctx.height);
        }

        const compositeView = ensureGalleryCompositeView(ctx.width, ctx.height);

        // Panel renderer — composite-25d calls this for each panel slot
        // with a fresh encoder (gallery internally submits per-panel so
        // SDF's writeBuffer params don't get stomped between panels).
        // sceneIdx is `(baseSceneIndex + i) % sceneCount` where
        // sceneCount is the arg we pass to gallery.render below.
        //
        // Per-panel SDF damping (port from main.ts:197-213): some scenes
        // are visually too bright when shown side-by-side with others
        // (e.g. Grid Fluid at idx 1 of CYCLEABLE_DOT_SCENES). The
        // applyGallerySceneDamping override scales particleIntensity /
        // threshold / softness / rim per-scene-index so the composite
        // reads as a coordinated gallery rather than competing brights.
        const renderPanel: PanelRenderer = (
          panelEncoder,
          panelView,
          sceneIdx,
          panelW,
          panelH,
        ) => {
          if (!sdf) return;
          const src = gallerySources[sceneIdx % gallerySources.length];
          const panelMod = applyGallerySceneDamping(sceneIdx, modulation);
          sdf.updateConfig({
            threshold: panelMod.threshold,
            softness: panelMod.softness,
            rimIntensity: panelMod.rimIntensity,
          });
          sdf.resize(panelW, panelH);
          sdf.render(panelEncoder, panelView, ctx.time, src);
        };

        // sceneCount = number of available panel scenes (modulo'd inside
        // composite-25d when iterating the layout slots). When
        // panelCount === gallerySources.length, every panel renders a
        // distinct scene.
        galleryMode.render(
          ctx.encoder,
          compositeView,
          gallerySources.length,
          renderPanel,
          ctx.time,
        );

        // Restore SDF to full canvas resolution for any subsequent
        // single-pass consumers (and to keep the texture pool consistent
        // for the next frame in case the participant flips modes — guarded
        // by mutual exclusion today, defensive for tomorrow).
        sdf.resize(ctx.width, ctx.height);

        // Film post composes the gallery composite onto the stage's
        // outputView (single full-frame post pass — matches the canon
        // single-scene path).
        filmPost.render(
          ctx.encoder,
          compositeView,
          ctx.outputView,
          ctx.time,
          ctx.width,
          ctx.height,
        );

        void outputFormat;
        return;
      }

      // ── Single-scene / cycle path ────────────────────────────────────
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

      const offscreenView = ensureOffscreenView(ctx.width, ctx.height);

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
      if (keydownHandler && typeof document !== "undefined") {
        try {
          document.removeEventListener("keydown", keydownHandler);
        } catch { /* ignore */ }
      }
      try { currentSource?.destroy(); } catch { /* ignore */ }
      try { currentFluid?.destroy(); } catch { /* ignore */ }
      for (const src of cycleSources) {
        try { src.destroy(); } catch { /* ignore */ }
      }
      for (const src of gallerySources) {
        try { src.destroy(); } catch { /* ignore */ }
      }
      try { galleryMode?.destroy(); } catch { /* ignore */ }
      try { sdf?.destroy(); } catch { /* ignore */ }
      try { filmPost?.destroy(); } catch { /* ignore */ }
      if (offscreenTexture) {
        try { offscreenTexture.destroy(); } catch { /* ignore */ }
      }
      if (galleryCompositeTexture) {
        try { galleryCompositeTexture.destroy(); } catch { /* ignore */ }
      }
      keydownHandler = null;
      currentSource = null;
      currentFluid = null;
      cycleSources = [];
      cycleSceneNames = [];
      cycleIdx = 0;
      kineticHandoff = null;
      gallerySources = [];
      galleryMode = null;
      galleryCompositeTexture = null;
      galleryCompositeWidth = 0;
      galleryCompositeHeight = 0;
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
