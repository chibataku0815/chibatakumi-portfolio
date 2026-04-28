// ── Fluid Dot Metaball — Entry Point ──────────────────────────
// Uses gpu-fx-presets library for metaball SDF + particle scenes.
// Fluid (GPU Compute) scene remains local (out of library scope).

import {
  createMetaballSDF,
  createOrbitParticles,
  createGridFluidParticles,
  createRiverParticles,
  createMagnetParticles,
  createMitosisParticles,
  createPendulumParticles,
  createRippleParticles,
  createDeltaParticles,
  createFlockParticles,
  createHelixParticles,
  createPhaseTransitionParticles,
  createFireflyParticles,
  createMolecularParticles,
  createChainParticles,
  createConvergeParticles,
  createTextAttractorParticles,
  type AudioReactiveBands,
  type MetaballSDF,
  type MetaballParticleSource,
} from "gpu-fx-presets";
import { createFluidScene, type FluidScene } from "./scene/fluid-scene";
import { AudioBus, createAudioController, type AudioController } from "webgpu-motion-audio";
import { DOT_WIRING, DOT_AUDIO_DELTA_BUFFER } from "./audio/wiring";
import { createGalleryMode, type GalleryMode, type PanelRenderer } from "./scene/composite-25d";
import {
  createStatusPill,
  createControlDock,
  createTouchActionsPopover,
  createAudioSettingsPopover,
  setOptionsVisibility,
  setTouchActionsPopoverVisibility,
  setAudioSettingsPopoverVisibility,
  updateStatusPill,
  updateControlDock,
  updateTouchActionsPopover,
  updateAudioSettingsPopover,
} from "./ui/hud";
import { bindKeyboardShortcuts } from "./input/keyboard";
import {
  createKineticHandoff,
  type KineticHandoffController,
  type TransitionParticipant,
  type TransitionScene,
} from "./transition/kinetic-handoff";
import {
  createFixedStepLoop,
  createOffscreenTargetPool,
  initGpu,
  resizeCanvas,
} from "webgpu-motion-shell";
import {
  createFilmPostPass,
  createPassthroughFilmPostPass,
  type MotionFilmPostPass,
} from "webgpu-motion-post";
import {
  createDefaultBlitPass,
  type ComposePass,
} from "./compose-pass";

export type DotSceneName =
  | "Orbit"
  | "Grid Fluid"
  | "River Flow"
  | "Magnet"
  | "Mitosis"
  | "Pendulum Wave"
  | "Ripple"
  | "River Delta"
  | "Flock"
  | "DNA Helix"
  | "Phase Transition"
  | "Firefly Sync"
  | "Molecular"
  | "Chain"
  | "Living Typography"
  | "Fluid (GPU)";

export interface MountOptions {
  readonly canvas: HTMLCanvasElement;
  readonly hostOverlay?: HTMLElement;
  readonly onError?: (err: unknown) => void;
  readonly onReady?: () => void;
  /**
   * Optional final-stage compose pass plugged into the render pipeline.
   * When set, motion-dot renders scene → MFP → textureB, then hands the
   * encoder + textureB view + swap-chain view to this pass. When null /
   * unset, motion-dot performs a pure pass-through blit from textureB to
   * the swap chain (visually identical to the legacy direct-write).
   */
  readonly composePass?: ComposePass | null;
}

export interface MountHandle {
  stop(): void;
  /**
   * Hard-switch the active scene by name (same path as the ←/→ arrow
   * keys — no kinetic transition, the SDF metaball field smooths the
   * change). No-op if a kinetic transition is currently playing or the
   * name is not in the scene catalog.
   */
  setActiveScene(name: DotSceneName): void;
  /**
   * Hot-swap the final-stage compose pass at runtime. Pass `null` to
   * fall back to the default pass-through blit. The previous pass's
   * `destroy()` is invoked before the swap.
   */
  setComposePass(pass: ComposePass | null): void;
  /**
   * Subscribe to a callback fired at the start of each frame, before the
   * encoder is built. Use to update uniform buffers / surface lists from
   * external state (DOM rect, pointer, scroll). Returns an unsubscribe fn.
   */
  onBeforeFrame(cb: () => void): () => void;
  /**
   * WebGPU resources owned by motion-dot. Exposed so a ComposePass
   * implementation can construct its own pipelines, samplers, and uniform
   * buffers using the same device. Do not destroy the device.
   */
  readonly gpu: {
    readonly device: GPUDevice;
    readonly queue: GPUQueue;
    readonly format: GPUTextureFormat;
  };
}

interface SceneEntry {
  readonly name: string;
  readonly source: MetaballParticleSource | null;
  readonly fluidScene: FluidScene | null;
}

function getTransitionParticipant(entry: SceneEntry): TransitionParticipant | null {
  return (entry.source ?? entry.fluidScene) as TransitionParticipant | null;
}

function resetEntry(entry: SceneEntry): void {
  getTransitionParticipant(entry)?.reset();
}

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

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
  readonly particleIntensity: number;
  readonly threshold: number;
  readonly softness: number;
  readonly rimIntensity: number;
  readonly bloomIntensity: number;
  readonly bloomThreshold: number;
  readonly grainIntensity: number;
  readonly chromaAmount: number;
  readonly vignetteStrength: number;
}

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
  3: {
    particleIntensity: 0.46,
    threshold: 0.32,
    softness: 0.62,
    rimIntensity: 0.40,
  },
  6: {
    particleIntensity: 0.50,
    threshold: 0.35,
    softness: 0.70,
    rimIntensity: 0.52,
  },
  9: {
    particleIntensity: 0.48,
    threshold: 0.34,
    softness: 0.66,
    rimIntensity: 0.44,
  },
  10: {
    particleIntensity: 0.42,
    threshold: 0.30,
    softness: 0.60,
    rimIntensity: 0.38,
  },
} as const;

const DESKTOP_MOTION_FPS = 45;
const MOBILE_MOTION_FPS = 45;
const DESKTOP_DPR_CAP = 1.5;
const MOBILE_DPR_CAP = 1.25;

function shouldUseMobileMotionBudget(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return (
    window.matchMedia("(max-width: 720px)").matches
    || window.matchMedia("(pointer: coarse)").matches
  );
}

function shapeIntensity(rawIntensity: number): number {
  const normalized = clamp01((rawIntensity - INTENSITY_TUNING.gate) / INTENSITY_TUNING.range);
  return clamp01((normalized - 0.5) * INTENSITY_TUNING.contrast + 0.5);
}

function createPresentationModulation(
  panelCount: number,
  shapedIntensity: number,
): PresentationModulation {
  // DOT_AUDIO_DELTA_BUFFER is assumed to be pre-populated for this frame by
  // the caller via DOT_WIRING.resolveInto(...) — see main loop. Baselines are
  // 0 in DOT_WIRING, so the buffer holds pure audio deltas. When audio is
  // disabled, the buffer must be zeroed by the caller.
  const galleryMix = clamp01((panelCount - 1) / 11);
  const particleIntensity = lerp(shapedIntensity, 1, galleryMix * INTENSITY_TUNING.galleryParticleLift);

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
    bloomIntensity: 0.3 + DOT_AUDIO_DELTA_BUFFER["film.bloom.intensity"] * bloomMul,
    bloomThreshold: 0.55 + DOT_AUDIO_DELTA_BUFFER["film.bloom.threshold"] * bloomMul,
    grainIntensity: 0.05 + DOT_AUDIO_DELTA_BUFFER["film.grain.intensity"] * grainMul,
    chromaAmount: 0.001 + DOT_AUDIO_DELTA_BUFFER["film.chroma.amount"] * chromaMul,
    vignetteStrength: 0.80 + DOT_AUDIO_DELTA_BUFFER["film.vignette.strength"] * vignetteMul,
  };
}

function resolveDotAudioDeltas(
  audioBus: AudioBus,
  shapedIntensity: number,
  audioEnabled: boolean,
): void {
  if (!audioEnabled) {
    for (const p of DOT_WIRING.params) DOT_AUDIO_DELTA_BUFFER[p] = 0;
    return;
  }
  DOT_WIRING.resolveInto(
    DOT_AUDIO_DELTA_BUFFER,
    audioBus.bands,
    audioBus.onsets,
    shapedIntensity,
  );
}

function buildAudioReactiveState(audioBus: AudioBus, intensity: number): AudioReactiveBands {
  return {
    ...audioBus.bands,
    ...audioBus.onsets,
    intensity,
  };
}

function applyGallerySceneDamping(
  sceneIndex: number,
  modulation: PresentationModulation,
): PresentationModulation {
  const damping = GALLERY_SCENE_DAMPING[sceneIndex];
  if (!damping) {
    return modulation;
  }

  return {
    ...modulation,
    particleIntensity: modulation.particleIntensity * damping.particleIntensity,
    threshold: lerp(1.0, modulation.threshold, damping.threshold),
    softness: modulation.softness * damping.softness,
    rimIntensity: modulation.rimIntensity * damping.rimIntensity,
  };
}

// ── Mount entry (host-driven) ────────────────────────────────
export async function mountMotionDotApp(opts: MountOptions): Promise<MountHandle> {
  const { canvas } = opts;
  const hostOverlay = opts.hostOverlay ?? document.body;
  const mobileMotionBudget = shouldUseMobileMotionBudget();

  try {
    const gpu = await initGpu(canvas, {
      maxDpr: mobileMotionBudget ? MOBILE_DPR_CAP : DESKTOP_DPR_CAP,
    });
    const { device, context, format } = gpu;
    const offscreenTargets = createOffscreenTargetPool(device);
    const offscreenFormat: GPUTextureFormat = "rgba16float";

    // ── Library: Metaball SDF renderer ──────────────────────
    const size = resizeCanvas(gpu);
    const sdf: MetaballSDF = createMetaballSDF(device, size.width, size.height);

    // ── Library: Particle sources ───────────────────────────
    const orbit = createOrbitParticles(device);
    const gridFluid = createGridFluidParticles(device);
    const river = createRiverParticles(device);
    const magnet = createMagnetParticles(device);
    const mitosis = createMitosisParticles(device);
    const pendulum = createPendulumParticles(device);
    const ripple = createRippleParticles(device);
    const delta = createDeltaParticles(device);
    const flock = createFlockParticles(device);
    const helix = createHelixParticles(device);
    const phaseTransition = createPhaseTransitionParticles(device);
    const firefly = createFireflyParticles(device);
    const molecular = createMolecularParticles(device);
    const chain = createChainParticles(device);
    createConvergeParticles(device);
    const textAttractor = createTextAttractorParticles(device, { text: "hello" });

    // ── Local: Fluid scene (GPU Compute, not in library) ────
    const fluid = createFluidScene(device, {
      count: 200,
      noiseScale: 2.0,
      noiseSpeed: 0.025,
      flowForce: 0.12,
      drag: 0.992,
      whiteRatio: 0.15,
    });

    type SourceDef = { name: string; source: MetaballParticleSource };
    type FluidDef = { name: string; fluidScene: FluidScene };

    const libScenes: SourceDef[] = [
      { name: "Orbit", source: orbit },
      { name: "Grid Fluid", source: gridFluid },
      { name: "River Flow", source: river },
      { name: "Magnet", source: magnet },
      { name: "Mitosis", source: mitosis },
      { name: "Pendulum Wave", source: pendulum },
      { name: "Ripple", source: ripple },
      { name: "River Delta", source: delta },
      { name: "Flock", source: flock },
      { name: "DNA Helix", source: helix },
      { name: "Phase Transition", source: phaseTransition },
      { name: "Firefly Sync", source: firefly },
      { name: "Molecular", source: molecular },
      { name: "Chain", source: chain },
      { name: "Living Typography", source: textAttractor },
    ];
    const fluidScenes: FluidDef[] = [
      { name: "Fluid (GPU)", fluidScene: fluid },
    ];

    const entries: SceneEntry[] = [];
    for (const scene of libScenes) {
      entries.push({ name: scene.name, source: scene.source, fluidScene: null });
    }
    for (const scene of fluidScenes) {
      entries.push({ name: scene.name, source: null, fluidScene: scene.fluidScene });
    }

    const transitionScenes: TransitionScene[] = entries.map((entry) => ({
      name: entry.name,
      participant: getTransitionParticipant(entry),
    }));

    let idx = 0;
    let postEnabled = false;
    let galleryEnabled = false;
    let galleryMode: GalleryMode | null = null;
    let audioController!: AudioController;
    let kineticHandoff!: KineticHandoffController;
    // demoStyle: "beat" preserves dot's 120 BPM silent-time aesthetic
    // (new shared substrate defaults to "ambient" for grid's use case).
    const audioBus = new AudioBus({ demoStyle: "beat" });

    // ── Film post passes ───────────────────────────────────
    const filmPost: MotionFilmPostPass = createFilmPostPass(device, format);
    const filmPassthrough: MotionFilmPostPass = createPassthroughFilmPostPass(device, format);

    // ── Compose pass (final stage: textureB → swap chain) ──
    const composeSampler = device.createSampler({
      label: "motion-dot:compose substrate sampler",
      magFilter: "nearest",
      minFilter: "nearest",
      addressModeU: "clamp-to-edge",
      addressModeV: "clamp-to-edge",
    });
    const defaultBlit = createDefaultBlitPass(device, format);
    let activeComposePass: ComposePass | null = opts.composePass ?? null;
    const beforeFrameCallbacks = new Set<() => void>();

    function getGalleryMode(w: number, h: number): GalleryMode {
      if (!galleryMode) {
        galleryMode = createGalleryMode(device, w, h);
      }
      return galleryMode;
    }

    // ── Legacy metaball pass for Fluid scene ─────────────────
    const { createMetaballPass } = await import("./render/metaball-pass");
    const legacyMetaball = createMetaballPass(device, offscreenFormat);

    const statusPill = createStatusPill(hostOverlay);
    const dock = createControlDock(hostOverlay);
    const actionsPopover = createTouchActionsPopover(hostOverlay);
    const audioSettingsPopover = createAudioSettingsPopover(hostOverlay);
    let optionsVisible = true;
    let audioPanelOpen = false;
    let actionPanelOpen = false;

    function syncOptionsVisibility(): void {
      setOptionsVisibility({ statusPill, dock, actionsPopover: actionsPopover.root }, optionsVisible);
      setTouchActionsPopoverVisibility(actionsPopover.root, optionsVisible && actionPanelOpen);
      setAudioSettingsPopoverVisibility(audioSettingsPopover, optionsVisible && audioPanelOpen);
    }

    function syncOverlay(): void {
      updateStatusPill(statusPill, {
        sceneName: entries[idx].name,
        sceneIndex: idx,
        sceneCount: entries.length,
        postEnabled,
        audioEnabled: audioController.enabled,
        audioSourceLabel: audioController.sourceLabel,
        transitionLabel: kineticHandoff.hudMessage,
        galleryEnabled,
        layoutName: galleryMode?.getLayoutName() ?? "",
        onsetActivity: audioBus.onsets.globalOnset,
      });
      updateControlDock(dock, {
        postEnabled,
        audioPopoverOpen: audioPanelOpen,
        actionPanelOpen,
        audioActive: audioController.enabled,
      });
      updateTouchActionsPopover(actionsPopover, {
        galleryEnabled,
        transitionActive: kineticHandoff.isActive(),
      });
      updateAudioSettingsPopover(audioSettingsPopover, {
        enabled: audioController.enabled,
        sourceKind: audioController.sourceKind,
        inputStatus: audioController.inputStatus,
        inputDevices: audioController.inputDevices,
        selectedInputDeviceId: audioController.selectedInputDeviceId,
        inputSupported: audioController.inputSupported,
        inputPermissionGranted: audioController.inputPermissionGranted,
      });
      syncOptionsVisibility();
    }

    kineticHandoff = createKineticHandoff({
      scenes: transitionScenes,
      getCurrentIndex: () => idx,
      setCurrentIndex: (nextIdx) => {
        idx = nextIdx;
      },
      onStateChange: syncOverlay,
    });

    audioController = createAudioController({
      audioBus,
      defaultSrc: "/audio.mp3",
      storageKeyPrefix: "motion-dot-new-webgpu",
      onStateChange: () => {
        if (audioController.enabled) {
          postEnabled = true;
        }
        syncOverlay();
      },
    });

    function disableGallery(): boolean {
      if (!galleryEnabled) {
        return false;
      }
      galleryEnabled = false;
      return true;
    }

    function setSingleMode(): void {
      disableGallery();
      syncOverlay();
    }

    function advanceScene(delta: number): void {
      if (kineticHandoff.isActive()) {
        return;
      }

      if (galleryEnabled && galleryMode) {
        galleryMode.shiftBase(delta);
      } else {
        idx = (idx + delta + entries.length) % entries.length;
      }

      syncOverlay();
    }

    function resetCurrentScene(): void {
      if (kineticHandoff.isActive()) {
        return;
      }
      resetEntry(entries[idx]);
      syncOverlay();
    }

    function toggleOptionsVisibility(): void {
      optionsVisible = !optionsVisible;
      syncOverlay();
    }

    function toggleAudioPanel(): void {
      audioPanelOpen = !audioPanelOpen;
      if (audioPanelOpen) actionPanelOpen = false;
      syncOverlay();
    }

    function toggleActionPanel(): void {
      actionPanelOpen = !actionPanelOpen;
      if (actionPanelOpen) audioPanelOpen = false;
      syncOverlay();
    }

    function triggerTransition(): void {
      if (!kineticHandoff.isActive()) {
        kineticHandoff.start(idx);
      } else if (kineticHandoff.phase !== "handoff_pending") {
        kineticHandoff.stop();
      }
      syncOverlay();
    }

    function toggleFilm(): void {
      postEnabled = !postEnabled;
      syncOverlay();
    }

    function cycleGallery(delta: 1 | -1): void {
      if (!galleryEnabled) {
        galleryEnabled = true;
        const g = getGalleryMode(size.width, size.height);
        if (delta > 0) {
          g.resetLayout();
        } else {
          g.resetLayoutToLast();
        }
      } else if (galleryMode) {
        const hasNext = delta > 0
          ? galleryMode.nextLayout()
          : galleryMode.prevLayout();
        if (!hasNext) {
          disableGallery();
        }
      }
      syncOverlay();
    }

    async function toggleAudio(): Promise<void> {
      await audioController.toggle();
      if (audioController.enabled) {
        postEnabled = true;
      }
      syncOverlay();
    }

    function openAudioPicker(): void {
      audioController.openFilePicker();
      syncOverlay();
    }

    function changeTypographyText(): void {
      const newText = prompt("Enter text for Living Typography:");
      if (newText && newText.trim()) {
        textAttractor.setText(newText.trim());
      }
      syncOverlay();
    }

    dock.filmButton.addEventListener("click", toggleFilm);
    dock.audioButton.addEventListener("click", toggleAudioPanel);
    dock.moreButton.addEventListener("click", toggleActionPanel);
    actionsPopover.prevButton.addEventListener("click", () => advanceScene(-1));
    actionsPopover.nextButton.addEventListener("click", () => advanceScene(1));
    actionsPopover.resetButton.addEventListener("click", resetCurrentScene);
    actionsPopover.transitionButton.addEventListener("click", triggerTransition);
    actionsPopover.galleryButton.addEventListener("click", () => {
      if (galleryEnabled) {
        setSingleMode();
      } else {
        cycleGallery(1);
      }
    });
    actionsPopover.textButton.addEventListener("click", changeTypographyText);
    actionsPopover.fileButton.addEventListener("click", openAudioPicker);

    audioSettingsPopover.sourceButtons.default_track.addEventListener("click", () => {
      void audioController.selectSource("default_track");
    });
    audioSettingsPopover.sourceButtons.file.addEventListener("click", () => {
      void audioController.selectSource("file");
    });
    audioSettingsPopover.sourceButtons.input.addEventListener("click", () => {
      void audioController.selectSource("input");
    });
    audioSettingsPopover.refreshButton.addEventListener("click", () => {
      void audioController.refreshInputDevices();
    });
    audioSettingsPopover.actionButton.addEventListener("click", () => {
      void toggleAudio();
    });
    audioSettingsPopover.deviceSelect.addEventListener("change", () => {
      if (audioSettingsPopover.deviceSelect.value) {
        void audioController.selectInputDevice(audioSettingsPopover.deviceSelect.value);
      }
    });

    const keyboardTeardown = bindKeyboardShortcuts({
      setSingleMode,
      advanceScene,
      toggleOptionsVisibility,
      toggleAudioPanel,
      triggerTransition,
      resetCurrentScene,
      toggleFilm,
      cycleGallery,
      toggleAudio,
      openAudioPicker,
      changeTypographyText,
    });

    syncOverlay();

    // ── Animation loop ───────────────────────────────────────
    const loop = createFixedStepLoop({
      fps: mobileMotionBudget ? MOBILE_MOTION_FPS : DESKTOP_MOTION_FPS,
      frame: ({ dt, time }) => {
        // Fire onBeforeFrame subscribers (consumers update uniforms / DOM
        // rects / surface lists here before any GPU encoding starts).
        for (const cb of beforeFrameCallbacks) {
          try {
            cb();
          } catch (err) {
            console.error("[motion-dot] onBeforeFrame callback threw:", err);
          }
        }

        const sz = resizeCanvas(gpu);
        sdf.resize(sz.width, sz.height);

        const outputTexture = context.getCurrentTexture();
        const outputView = outputTexture.createView();
        const encoder = device.createCommandEncoder({ label: "frame" });
        const gallery = galleryEnabled ? getGalleryMode(sz.width, sz.height) : null;

        // textureB — post-effect output, sampled by the compose pass. Same
        // format as the swap chain so MFP's pre-built pipelines render to
        // it without modification, and the default blit preserves bits.
        const composeSubstrateView = offscreenTargets.get("post-output", {
          label: "motion-dot:post-output",
          width: sz.width,
          height: sz.height,
          format,
        });

        kineticHandoff.update(dt, time);

        const entry = entries[idx];

        // ── Audio breath modulation ──────────────────────────
        audioBus.update(audioController.enabled ? dt : 0);

        const bass = audioController.enabled ? audioBus.bands.bass : 0;
        const mid = audioController.enabled ? audioBus.bands.mid : 0;
        const treble = audioController.enabled ? audioBus.bands.treble : 0;
        const energy = audioController.enabled ? audioBus.bands.energy : 0;
        const intensity = audioController.enabled ? shapeIntensity(audioBus.intensity) : 0;

        // ── Onset impulse modulation (additive) ─────────────
        const kickPulse = audioController.enabled ? audioBus.onsets.bassOnset : 0;
        const snarePulse = audioController.enabled ? audioBus.onsets.midOnset : 0;
        const hatPulse = audioController.enabled ? audioBus.onsets.trebleOnset : 0;
        const globalPulse = audioController.enabled ? audioBus.onsets.globalOnset : 0;

        // Populate DOT_AUDIO_DELTA_BUFFER once per frame, shared across the
        // single and gallery modulations (galleryMix damping is applied inside
        // createPresentationModulation to the same underlying deltas).
        resolveDotAudioDeltas(audioBus, intensity, audioController.enabled);

        const singleModulation = createPresentationModulation(1, intensity);
        const galleryPanelCount = galleryEnabled && gallery ? gallery.getPanelCount() : 1;
        const galleryModulation = createPresentationModulation(galleryPanelCount, intensity);
        const activeModulation = galleryEnabled ? galleryModulation : singleModulation;

        // Wire audio bands into particle physics (sources that implement setAudioReactive)
        const participant = getTransitionParticipant(entry);
        if (participant && "setAudioReactive" in participant) {
          (participant as { setAudioReactive(b: AudioReactiveBands | null): void })
            .setAudioReactive(
              audioController.enabled
                ? buildAudioReactiveState(audioBus, singleModulation.particleIntensity)
                : null,
            );
        }

        sdf.updateConfig({
          threshold: activeModulation.threshold,
          softness: activeModulation.softness,
          rimIntensity: activeModulation.rimIntensity,
        });
        filmPost.updateConfig({
          bloom: {
            intensity: activeModulation.bloomIntensity,
            threshold: activeModulation.bloomThreshold,
            warmth: 0.0,
          },
          grain: {
            intensity: activeModulation.grainIntensity,
            size: 0.6,
            radialMix: 0.35,
          },
          chromaticAberration: { amount: activeModulation.chromaAmount },
          vignette: { strength: activeModulation.vignetteStrength, warmShift: 0.0 },
        });

        // In gallery mode, feed audio to all visible panel scenes
        if (galleryEnabled && galleryMode) {
          const base = galleryMode.getBaseSceneIndex();
          const count = galleryMode.getPanelCount();
          for (let i = 0; i < count; i++) {
            const si = (base + i) % entries.length;
            const p = getTransitionParticipant(entries[si]);
            const sceneGalleryModulation = applyGallerySceneDamping(si, galleryModulation);
            if (p && "setAudioReactive" in p) {
              (p as { setAudioReactive(b: AudioReactiveBands | null): void })
                .setAudioReactive(
                  audioController.enabled
                    ? buildAudioReactiveState(audioBus, sceneGalleryModulation.particleIntensity)
                    : null,
                );
            }
          }
        }

        const postPass = postEnabled ? filmPost : filmPassthrough;

        syncOverlay();

        if (galleryEnabled) {
          // Gallery mode: renders multiple scenes internally
          if (!gallery) {
            throw new Error("Gallery mode unavailable");
          }
          gallery.resize(sz.width, sz.height);
          const compOv = offscreenTargets.get("composite", {
            label: "composite-offscreen",
            width: sz.width,
            height: sz.height,
            format: offscreenFormat,
          });

          const renderPanel: PanelRenderer = (enc, view, sceneIdx, pw, ph) => {
            const e = entries[sceneIdx];
            const sceneGalleryModulation = applyGallerySceneDamping(sceneIdx, galleryModulation);
            sdf.resize(pw, ph);
            sdf.updateConfig({
              threshold: sceneGalleryModulation.threshold,
              softness: sceneGalleryModulation.softness,
              rimIntensity: sceneGalleryModulation.rimIntensity,
            });
            if (e.source) {
              sdf.render(enc, view, time, e.source);
            } else if (e.fluidScene) {
              const scene = e.fluidScene;
              scene.encode(enc, time, dt);
              legacyMetaball.render(enc, view, scene.particleBuffer, {
                time,
                width: pw,
                height: ph,
                count: scene.count,
                bgColor: [0.82, 0.82, 0.82, 1.0],
                threshold: sceneGalleryModulation.threshold,
                softness: sceneGalleryModulation.softness,
              });
            }
          };

          gallery.render(encoder, compOv, entries.length, renderPanel, time);
          sdf.resize(sz.width, sz.height); // restore full resolution
          postPass.render(encoder, compOv, composeSubstrateView, time, sz.width, sz.height);
        } else {
          // Single scene mode (existing)
          const ov = offscreenTargets.get("scene", {
            label: "offscreen",
            width: sz.width,
            height: sz.height,
            format: offscreenFormat,
          });

          if (entry.source) {
            sdf.render(encoder, ov, time, entry.source);
          } else if (entry.fluidScene) {
            const scene = entry.fluidScene;
            scene.encode(encoder, time, dt);
            const legacyThreshold = 1.0 - bass * 0.4 - kickPulse * 0.15;
            legacyMetaball.render(encoder, ov, scene.particleBuffer, {
              time,
              width: sz.width,
              height: sz.height,
              count: scene.count,
              bgColor: [0.82, 0.82, 0.82, 1.0],
              threshold: legacyThreshold,
              softness: 0.015,
            });
          }

          postPass.render(encoder, ov, composeSubstrateView, time, sz.width, sz.height);
        }

        // Final stage: compose substrate (textureB) into swap chain. If a
        // composePass is registered it owns the swap-chain write; otherwise
        // the default blit preserves the legacy direct-write behavior.
        const composePass = activeComposePass ?? defaultBlit;
        composePass.render({
          encoder,
          device,
          queue: device.queue,
          substrateView: composeSubstrateView,
          substrateSampler: composeSampler,
          swapView: outputView,
          format,
          width: sz.width,
          height: sz.height,
          dpr: gpu.dpr,
          time,
          dt,
        });

        device.queue.submit([encoder.finish()]);
      },
    });
    loop.start();

    opts.onReady?.();

    let stopped = false;
    return {
      stop(): void {
        if (stopped) return;
        stopped = true;
        loop.stop();
        keyboardTeardown();
        beforeFrameCallbacks.clear();
        if (activeComposePass) {
          activeComposePass.destroy?.();
          activeComposePass = null;
        }
        defaultBlit.destroy?.();
        for (const el of [statusPill, dock.root, actionsPopover.root, audioSettingsPopover.root]) {
          el.remove();
        }
      },
      setActiveScene(name: DotSceneName): void {
        if (stopped) return;
        if (kineticHandoff.isActive()) return;
        const targetIdx = entries.findIndex((entry) => entry.name === name);
        if (targetIdx < 0 || targetIdx === idx) return;
        if (galleryEnabled) {
          galleryEnabled = false;
        }
        idx = targetIdx;
        syncOverlay();
      },
      setComposePass(pass: ComposePass | null): void {
        if (stopped) return;
        if (activeComposePass === pass) return;
        if (activeComposePass) {
          activeComposePass.destroy?.();
        }
        activeComposePass = pass;
      },
      onBeforeFrame(cb: () => void): () => void {
        beforeFrameCallbacks.add(cb);
        return () => {
          beforeFrameCallbacks.delete(cb);
        };
      },
      gpu: {
        device,
        queue: device.queue,
        format,
      },
    };
  } catch (e) {
    opts.onError?.(e);
    throw e;
  }
}
