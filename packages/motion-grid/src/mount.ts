// motion-grid mount entry — Renewal 2026 (Package 4 — Motion Works).
//
// Full-featured port of life/output/motion-grid-guided-webgpu/src/main.ts.
// Provides audio, HUD, keyboard, ControlCluster, InputOverlay, continuity
// mode, word morph, and hero-token input — 1:1 behavioral parity with the
// original standalone Vite app.
//
// API contract:
//   mountMotionGridApp({ canvas, hostOverlay, onError?, onReady? })
//     → Promise<{ stop() }>
//
// Differences from original main.ts:
//   - requireMotionAppElements() removed; canvas is passed as parameter.
//   - showFallback() removed; errors call opts.onError?.(err) then rethrow.
//   - document.body.appendChild → hostOverlay.appendChild (via container arg).
//   - import.meta.env.DEV tau A/B HUD block deleted (Vite-only).
//   - bindKeyboardShortcuts returns dispose(); stop() calls it.
//   - AudioController.destroy() called in stop().
//   - All DOM/audio access inside mountMotionGridApp() body (SSR safe).

import { AudioBus, createAudioController, type AudioController } from "webgpu-motion-audio";
import { GRID_WIRING, GRID_AUDIO_DELTA_BUFFER } from "./audio/wiring";
import { bindKeyboardShortcuts } from "./input/keyboard";
import {
  createGridBlockPass,
  type GridBlockPass,
  type GridReactiveState,
} from "./render/grid-block-pass";
import {
  createDiscreteGridScene,
  type DiscreteGridScene,
  type DiscreteGridSnapshot,
  type HeroTokenValidation,
  type WordMorphValidation,
} from "./scene/discrete-grid-scene";
import {
  DEFAULT_HERO_WORD_PATTERN_ID,
  ELECTRIC_TICKER_CHARACTERS,
  HERO_WORD_PATTERN_IDS,
  type HeroWordPatternId,
} from "./scene/typography/hero-word-pattern-registry";
import {
  MAX_HERO_TOKEN_CHARS,
  sanitizeHeroTokenInput,
} from "./scene/typography/hero-token";
import {
  createControlCluster,
  createHud,
  createInputOverlay,
  updateHud,
  updateInputOverlay,
} from "./ui/hud";
import {
  createFixedStepLoop,
  createOffscreenTargetPool,
  initGpu,
  resizeCanvas,
} from "webgpu-motion-shell";
import {
  createFilmPostPass,
  createPassthroughFilmPostPass,
  type MotionFilmPostConfig,
  type MotionFilmPostPass,
} from "webgpu-motion-post";
import { FILM_STOCK_CANON } from "webgpu-motion-art";

// ── Pure helpers (top-level: no DOM, SSR safe) ──────────────────────────────

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

function shapeIntensity(raw: number): number {
  return clamp01((raw - 0.08) / 0.72);
}

function createGridReactiveState(audioBus: AudioBus): GridReactiveState {
  return {
    ...audioBus.bands,
    ...audioBus.onsets,
    intensity: shapeIntensity(audioBus.intensity),
  };
}

const GRAIN_STATIC = FILM_STOCK_CANON.grain;
const CHROMATIC_STATIC = FILM_STOCK_CANON.chromaticAberration;
const BLOOM_STATIC = FILM_STOCK_CANON.bloom;
const VIGNETTE_STATIC = FILM_STOCK_CANON.vignette;
const TONEMAP_STATIC = FILM_STOCK_CANON.tonemap;

interface ElectricFilmSignals {
  readonly strikeFlag: number;
  readonly strikePhase: number;
  readonly flickerIntensity: number;
  readonly glowMix: number;
  readonly rgbSplitBump: number;
}

function createFilmConfig(
  reactive: GridReactiveState,
  electric?: ElectricFilmSignals,
): Partial<MotionFilmPostConfig> {
  const strikeFlag = electric?.strikeFlag ?? 0;
  const strikePhase = electric?.strikePhase ?? 0;
  const flickerIntensity = electric?.flickerIntensity ?? 0;
  const glowMix = electric?.glowMix ?? 0;
  const rgbSplitBump = electric?.rgbSplitBump ?? 0;
  const caBump = strikeFlag * strikePhase * 0.006 * (0.5 + rgbSplitBump * 0.4);

  // Audio-reactive deltas: wiring returns baseline+coef*input. Since baselines
  // are 0 in GRID_WIRING (see wiring.ts), the buffer holds pure audio deltas
  // that we add to FILM_STOCK_CANON static values. Electric signals compose on
  // top — they are intentionally outside the audio canon.
  GRID_WIRING.resolveInto(
    GRID_AUDIO_DELTA_BUFFER,
    reactive,
    reactive,
    reactive.intensity,
  );

  return {
    grain: {
      ...GRAIN_STATIC,
      intensity: GRAIN_STATIC.intensity + flickerIntensity * 0.12,
    },
    chromaticAberration: {
      ...CHROMATIC_STATIC,
      amount: CHROMATIC_STATIC.amount + caBump,
    },
    vignette: VIGNETTE_STATIC,
    bloom: {
      ...BLOOM_STATIC,
      threshold:
        BLOOM_STATIC.threshold
        + GRID_AUDIO_DELTA_BUFFER["film.bloom.threshold"]
        - glowMix * 0.28,
      intensity:
        BLOOM_STATIC.intensity
        + GRID_AUDIO_DELTA_BUFFER["film.bloom.intensity"]
        + glowMix * 0.35,
      warmth: BLOOM_STATIC.warmth - glowMix * 0.10,
    },
    tonemap: {
      ...TONEMAP_STATIC,
      compression:
        TONEMAP_STATIC.compression
        + GRID_AUDIO_DELTA_BUFFER["film.tonemap.compression"],
    },
  };
}

function getHeroTokenInvalidHint(validation: HeroTokenValidation): string | undefined {
  if (validation.ok) {
    return undefined;
  }

  if (validation.reason === "budget") {
    return `Block budget ${validation.blockCount}/${validation.maxBlocks}`;
  }

  return `3-${MAX_HERO_TOKEN_CHARS} chars, A-Z 0-9 . space`;
}

function getWordMorphInvalidHint(validation: WordMorphValidation): string | undefined {
  if (validation.ok) {
    return undefined;
  }
  if (validation.reason === "compile") {
    return "Cannot compile pattern for this word";
  }
  return undefined;
}

function resolveInputHint(
  tokenValidation: HeroTokenValidation,
  morphValidation: WordMorphValidation,
): string | undefined {
  return getHeroTokenInvalidHint(tokenValidation)
    ?? getWordMorphInvalidHint(morphValidation);
}

// ── Public API types ─────────────────────────────────────────────────────────

export interface MountGridOptions {
  readonly canvas: HTMLCanvasElement;
  readonly hostOverlay: HTMLElement;
  readonly onError?: (err: unknown) => void;
  readonly onReady?: () => void;
}

export interface MountGridHandle {
  stop(): void;
}

// ── Mount entry ──────────────────────────────────────────────────────────────

export async function mountMotionGridApp(
  opts: MountGridOptions,
): Promise<MountGridHandle> {
  const { canvas, hostOverlay } = opts;

  try {
    const gpu = await initGpu(canvas);
    const { device, context, format } = gpu;
    const offscreenTargets = createOffscreenTargetPool(device);
    const offscreenFormat: GPUTextureFormat = "rgba16float";

    // canon = 1.5 / 3.0 (unified with dot); ambient silent-time aesthetic.
    const audioBus = new AudioBus({
      demoStyle: "ambient",
      intensityAttackTau: 1.5,
      intensityReleaseTau: 3.0,
    });

    const scene: DiscreteGridScene = createDiscreteGridScene();
    const renderPass: GridBlockPass = createGridBlockPass(device, offscreenFormat);
    const filmPost: MotionFilmPostPass = createFilmPostPass(device, format, {
      grain: GRAIN_STATIC,
      chromaticAberration: CHROMATIC_STATIC,
      bloom: BLOOM_STATIC,
      vignette: VIGNETTE_STATIC,
      tonemap: TONEMAP_STATIC,
    });
    const filmPassthrough: MotionFilmPostPass = createPassthroughFilmPostPass(device, format);
    const audioController: AudioController = createAudioController({
      audioBus,
      storageKeyPrefix: "motion-grid-guided-webgpu",
      onStateChange: () => {
        if (audioController.enabled) {
          filmEnabled = true;
        }
        syncOverlay();
      },
    });

    // HUD and InputOverlay attached to hostOverlay, not document.body
    const hud = createHud(hostOverlay);
    const inputOverlay = createInputOverlay(hostOverlay);

    let filmEnabled = true;
    let overlaysVisible = true;
    let inputModeActive = false;
    let textAlphaActual = 1;
    let textAlphaTarget = 1;
    const TEXT_ALPHA_TAU = 0.06;
    let currentPatternIndex = Math.max(0, HERO_WORD_PATTERN_IDS.indexOf(DEFAULT_HERO_WORD_PATTERN_ID));
    let continuityModeEnabled = false;
    let pendingPatternId: HeroWordPatternId | null = null;
    let activePatternHandoffTarget: HeroWordPatternId | null = null;
    let pendingWordToken: string | null = null;
    let activeWordHandoffTarget: string | null = null;
    let draftHeroToken = scene.getSnapshot().heroToken;
    let draftValidation = scene.validateHeroToken(draftHeroToken);
    let draftMorphValidation = scene.validateWordMorph(draftHeroToken);

    function currentPatternId(): HeroWordPatternId {
      return HERO_WORD_PATTERN_IDS[currentPatternIndex] ?? DEFAULT_HERO_WORD_PATTERN_ID;
    }

    function resolvePatternIndex(patternId: HeroWordPatternId): number {
      const index = HERO_WORD_PATTERN_IDS.indexOf(patternId);
      return index >= 0 ? index : 0;
    }

    function clearQueuedPatternHandoff(): void {
      pendingPatternId = null;
      activePatternHandoffTarget = null;
    }

    function clearPendingWordHandoff(): void {
      pendingWordToken = null;
      activeWordHandoffTarget = null;
    }

    function continuityLabel(heroToken: string): string {
      if (activeWordHandoffTarget) {
        return `W ACTIVE ${heroToken} -> ${activeWordHandoffTarget}`;
      }

      if (pendingWordToken) {
        return `W QUEUED ${heroToken} -> ${pendingWordToken}`;
      }

      if (activePatternHandoffTarget) {
        return `T ACTIVE ${currentPatternId()} -> ${activePatternHandoffTarget}`;
      }

      if (pendingPatternId) {
        return `T QUEUED ${currentPatternId()} -> ${pendingPatternId}`;
      }

      return continuityModeEnabled ? "T ON" : "T OFF";
    }

    function syncPatternHandoffState(snapshot: DiscreteGridSnapshot = scene.getSnapshot()): void {
      currentPatternIndex = resolvePatternIndex(snapshot.patternId);
      if (activePatternHandoffTarget && !scene.isPatternHandoffActive()) {
        activePatternHandoffTarget = null;
      }
      if (activeWordHandoffTarget && !scene.isWordHandoffActive()) {
        activeWordHandoffTarget = null;
      }
    }

    function requestPatternCycle(delta: number): void {
      if (scene.isAnyHandoffActive()) {
        return;
      }

      const basePatternId = pendingPatternId ?? currentPatternId();
      const nextIndex = (
        resolvePatternIndex(basePatternId) + delta + HERO_WORD_PATTERN_IDS.length
      ) % HERO_WORD_PATTERN_IDS.length;
      const nextPatternId = HERO_WORD_PATTERN_IDS[nextIndex]!;

      if (!continuityModeEnabled) {
        clearQueuedPatternHandoff();
        currentPatternIndex = nextIndex;
        scene.setPatternId(nextPatternId);
        return;
      }

      pendingPatternId = nextPatternId;
    }

    function maybeStartPendingPatternHandoff(): void {
      if (!continuityModeEnabled || !pendingPatternId || scene.isAnyHandoffActive()) {
        return;
      }

      const snapshot = scene.getSnapshot();
      if (!snapshot.holdingAtEnd && snapshot.currentStep.handoffRole !== "hold-final") {
        return;
      }

      if (scene.startPatternHandoff(pendingPatternId)) {
        activePatternHandoffTarget = pendingPatternId;
        pendingPatternId = null;
      }
    }

    function maybeStartPendingWordHandoff(): void {
      if (!pendingWordToken || scene.isAnyHandoffActive()) {
        return;
      }

      const snapshot = scene.getSnapshot();
      if (!snapshot.holdingAtEnd && snapshot.currentStep.handoffRole !== "hold-final") {
        return;
      }

      if (!scene.validateWordMorph(pendingWordToken).ok) {
        pendingWordToken = null;
        return;
      }

      if (scene.startWordHandoff(pendingWordToken)) {
        activeWordHandoffTarget = pendingWordToken;
        pendingWordToken = null;
      }
    }

    function syncDraftToCommittedToken(): void {
      draftHeroToken = scene.getSnapshot().heroToken;
      draftValidation = scene.validateHeroToken(draftHeroToken);
      draftMorphValidation = scene.validateWordMorph(draftHeroToken);
    }

    function setDraftHeroToken(nextDraft: string): void {
      draftHeroToken = sanitizeHeroTokenInput(nextDraft).slice(0, MAX_HERO_TOKEN_CHARS);
      draftValidation = scene.validateHeroToken(draftHeroToken);
      draftMorphValidation = scene.validateWordMorph(draftHeroToken);
    }

    function syncOverlay(snapshot: DiscreteGridSnapshot = scene.getSnapshot()): void {
      currentPatternIndex = resolvePatternIndex(snapshot.patternId);
      if (activePatternHandoffTarget && !scene.isPatternHandoffActive()) {
        activePatternHandoffTarget = null;
      }
      if (activeWordHandoffTarget && !scene.isWordHandoffActive()) {
        activeWordHandoffTarget = null;
      }
      updateHud(hud, {
        sceneName: snapshot.sceneName,
        heroToken: snapshot.heroToken,
        patternName: currentPatternId(),
        continuityLabel: continuityLabel(snapshot.heroToken),
        phraseName: snapshot.currentStep.name,
        stepIndex: snapshot.currentStep.index,
        stepCount: snapshot.stepCount,
        loopEnabled: snapshot.loopEnabled,
        postEnabled: filmEnabled,
        audioEnabled: audioController.enabled,
        audioMode: audioBus.mode,
        trackName: audioController.sourceLabel,
        cycleTime: snapshot.phraseTime,
        cycleDuration: snapshot.cycleDuration,
        onsetActivity: audioBus.onsets.globalOnset,
      });
      updateInputOverlay(inputOverlay, {
        active: inputModeActive && overlaysVisible,
        draftToken: draftHeroToken,
        isValid: draftValidation.ok && draftMorphValidation.ok,
        invalidHint: resolveInputHint(draftValidation, draftMorphValidation),
      });
      const z = snapshot.presentationZoomScale;
      const cellSize = Math.max(snapshot.grid.cellSize, 1);
      const marginCells = 1;
      const rightOffset = snapshot.grid.originX + cellSize * marginCells;
      const bottomOffset = snapshot.grid.originY + cellSize * marginCells;
      cluster.setMetrics(cellSize, rightOffset, bottomOffset);
      cluster.updateChip("T", { active: continuityModeEnabled });
      cluster.updateChip("L", { active: snapshot.loopEnabled });
      cluster.updateChip("Z", { enabled: z < 3.0 - 1e-3 });
      cluster.updateChip("⇧Z", { enabled: z > 1.0 + 1e-3 });
      cluster.updateChip("0", { enabled: Math.abs(z - 1.0) >= 1e-3 });
      cluster.updateChip("A", { active: audioController.enabled });
      cluster.updateChip("F", { active: filmEnabled });
      cluster.updateChip("I", { active: inputModeActive });
      cluster.updateChip("H", { active: overlaysVisible });
      cluster.setVisible(overlaysVisible);
      hud.style.display = overlaysVisible ? "" : "none";
    }

    const enterInputMode = (): void => {
      if (scene.isAnyHandoffActive()) {
        return;
      }
      inputModeActive = true;
      textAlphaTarget = 0;
      setDraftHeroToken("");
    };

    const cancelInputMode = (): void => {
      inputModeActive = false;
      textAlphaTarget = 1;
      syncDraftToCommittedToken();
    };

    const confirmInputMode = (): void => {
      setDraftHeroToken(draftHeroToken);
      if (!draftValidation.ok || !draftMorphValidation.ok) {
        return;
      }

      const normalized = draftValidation.normalizedToken;
      if (normalized === scene.getSnapshot().heroToken) {
        inputModeActive = false;
        textAlphaActual = 1;
        textAlphaTarget = 1;
        syncDraftToCommittedToken();
        return;
      }

      clearQueuedPatternHandoff();
      clearPendingWordHandoff();

      textAlphaActual = 1;
      textAlphaTarget = 1;

      if (scene.startWordHandoff(normalized)) {
        activeWordHandoffTarget = normalized;
      } else {
        pendingWordToken = normalized;
      }

      inputModeActive = false;
      syncDraftToCommittedToken();
    };

    const resetScene = (): void => {
      clearQueuedPatternHandoff();
      clearPendingWordHandoff();
      scene.reset();
    };

    const toggleContinuity = (): void => {
      continuityModeEnabled = !continuityModeEnabled;
      if (!continuityModeEnabled) {
        pendingPatternId = null;
      }
    };

    const toggleLoop = (): void => {
      const snapshot = scene.getSnapshot();
      scene.setLoopEnabled(!snapshot.loopEnabled);
    };

    const toggleFilm = (): void => {
      filmEnabled = !filmEnabled;
    };

    const toggleHud = (): void => {
      overlaysVisible = !overlaysVisible;
    };

    const toggleAudio = async (): Promise<void> => {
      await audioController.toggle();
      if (audioController.enabled) {
        filmEnabled = true;
      }
    };

    // ControlCluster attached to hostOverlay (first arg = container)
    const cluster = createControlCluster(hostOverlay, [
      [
        {
          key: "←→",
          label: "Pattern",
          onClick: (event) => {
            requestPatternCycle(event.shiftKey ? -1 : 1);
            syncOverlay();
          },
        },
        { key: "R", label: "Reset", onClick: () => { resetScene(); syncOverlay(); } },
        { key: "T", label: "Continuity", cellsWide: 4, onClick: () => { toggleContinuity(); syncOverlay(); } },
        { key: "L", label: "Loop", onClick: () => { toggleLoop(); syncOverlay(); } },
      ],
      [
        { key: "Z", label: "Zoom In", onClick: () => { scene.zoomIn(); syncOverlay(); } },
        { key: "⇧Z", label: "Zoom Out", onClick: () => { scene.zoomOut(); syncOverlay(); } },
        { key: "0", label: "Default", onClick: () => { scene.resetZoomToDefault(); syncOverlay(); } },
        { key: "F", label: "Film", onClick: () => { toggleFilm(); syncOverlay(); } },
      ],
      [
        {
          key: "A",
          label: "Audio",
          onClick: () => { void toggleAudio().then(() => syncOverlay()); },
        },
        { key: "M", label: "Music", onClick: () => { audioController.openFilePicker(); syncOverlay(); } },
        {
          key: "I",
          label: "Input",
          onClick: () => {
            if (inputModeActive) {
              cancelInputMode();
            } else {
              enterInputMode();
            }
            syncOverlay();
          },
        },
        { key: "H", label: "HUD", onClick: () => { toggleHud(); syncOverlay(); } },
      ],
    ]);

    const disposeKeyboard = bindKeyboardShortcuts({
      cyclePattern: requestPatternCycle,
      isInputModeActive: () => inputModeActive,
      enterInputMode,
      cancelInputMode,
      confirmInputMode,
      appendInputChar: (char) => {
        setDraftHeroToken(`${draftHeroToken}${char}`);
      },
      backspaceInputChar: () => {
        setDraftHeroToken(draftHeroToken.slice(0, -1));
      },
      resetScene,
      zoomIn: () => scene.zoomIn(),
      zoomOut: () => scene.zoomOut(),
      zoomDefault: () => scene.resetZoomToDefault(),
      toggleContinuityMode: toggleContinuity,
      toggleLoop,
      toggleFilm,
      toggleHud,
      toggleAudio,
      openAudioPicker: () => {
        audioController.openFilePicker();
      },
      resetAudioToDefault: () => audioController.resetToDefault(),
      syncOverlay,
    });

    syncOverlay();

    const loop = createFixedStepLoop({
      fps: 45,
      frame: ({ dt, time }) => {
        const size = resizeCanvas(gpu);
        scene.resize(size.width, size.height);
        maybeStartPendingWordHandoff();
        maybeStartPendingPatternHandoff();
        scene.update(dt);
        maybeStartPendingWordHandoff();
        maybeStartPendingPatternHandoff();
        const snapshot = scene.getSnapshot();
        syncPatternHandoffState(snapshot);
        audioBus.update(audioController.enabled ? dt : 0);

        const reactive: GridReactiveState = audioController.enabled
          ? createGridReactiveState(audioBus)
          : {
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

        if (filmEnabled) {
          const character = ELECTRIC_TICKER_CHARACTERS[snapshot.patternId];
          filmPost.updateConfig(createFilmConfig(reactive, {
            strikeFlag: snapshot.strikeFlag,
            strikePhase: snapshot.strikePhase,
            flickerIntensity: snapshot.flickerIntensity,
            glowMix: snapshot.glowMix,
            rgbSplitBump: character?.rgbSplitBump ?? 0,
          }));
        }
        syncOverlay(snapshot);

        const outputView = context.getCurrentTexture().createView();
        const offscreen = offscreenTargets.get("scene", {
          label: "grid-scene-offscreen",
          width: size.width,
          height: size.height,
          format: offscreenFormat,
        });
        const encoder = device.createCommandEncoder({ label: "frame" });

        const alphaK = 1 - Math.exp(-dt / TEXT_ALPHA_TAU);
        textAlphaActual += (textAlphaTarget - textAlphaActual) * alphaK;
        renderPass.render(encoder, offscreen, snapshot, reactive, textAlphaActual);
        (filmEnabled ? filmPost : filmPassthrough).render(
          encoder,
          offscreen,
          outputView,
          time,
          size.width,
          size.height,
        );

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
        disposeKeyboard();
        // Remove overlay elements from hostOverlay
        hud.remove();
        inputOverlay.remove();
        cluster.element.remove();
        // Destroy AudioController
        audioController.destroy();
        // Destroy GPU resources
        try { scene.destroy(); } catch { /* ignore */ }
        try { renderPass.destroy(); } catch { /* ignore */ }
        try { filmPost.destroy(); } catch { /* ignore */ }
        try { filmPassthrough.destroy(); } catch { /* ignore */ }
      },
    };
  } catch (err) {
    opts.onError?.(err);
    throw err;
  }
}
