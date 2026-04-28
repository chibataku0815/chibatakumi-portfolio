// Standalone mount entry — Renewal 2026 Motion Works (Package 4).
//
// Full port of life/output/motion-flowline-webgpu/src/main.ts as a host-driven
// mount API: caller provides canvas + hostOverlay, we drive the loop until stop().
// AudioBus + AudioController, tap-to-start overlay, HUD with scene picker,
// keyboard (1-7 pin / 0 auto / R reseed / A audio / F film / ? help), and
// audio-reactive FLOWLINE_WIRING composite are all included.
//
// Differences from original main.ts:
// - requireMotionAppElements() removed: caller passes canvas directly
// - document.body.appendChild → hostOverlay.appendChild
// - defaultSrc: "audio.mp3" → opts.defaultAudioSrc ?? "/audio.mp3"
// - bindFlowlineKeyboard returns dispose(); stop() calls it
// - showFallback removed; catch calls opts.onError?.(err) then re-throws
// - stop() is idempotent; cleans up overlay, HUD, keyboard, GPU resources

import { FILM_STOCK_CANON } from "webgpu-motion-art";
import {
  createDefaultBlitPass,
  type ComposePass,
} from "@chibatakumi/motion-core/compose";
import {
  AudioBus,
  createAudioController,
  type AudioController,
} from "webgpu-motion-audio";
import {
  createFilmPostPass,
  type MotionFilmPostConfig,
  type MotionFilmPostPass,
} from "webgpu-motion-post";
import {
  createFixedStepLoop,
  createOffscreenTargetPool,
  initGpu,
  resizeCanvas,
} from "webgpu-motion-shell";
import {
  FLOWLINE_AUDIO_DELTA_BUFFER,
  FLOWLINE_WIRING,
} from "./audio/wiring";
import {
  createFlowlineCompute,
  type FlowlineComputeHandle,
} from "./compute/flowline-compute";
import {
  FLOWLINE_DEFAULT_CONFIG,
  type FlowlineConfig,
} from "./compute/flowline-config";
import {
  FLOWLINE_KEYMAP_ENTRIES,
  bindFlowlineKeyboard,
} from "./input/bindings";
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
} from "./scene";
import {
  createHeroSdf,
  HERO_PLACEMENT,
} from "./text/glyph-registry";
import {
  createFlowlineHud,
  setFlowlineHudKeymapVisible,
  updateFlowlineHud,
  updateFlowlineHudAudio,
} from "./ui/hud";

const OFFSCREEN_FORMAT: GPUTextureFormat = "rgba16float";

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

function shapeIntensity(raw: number): number {
  return clamp01((raw - 0.08) / 0.72);
}

// Flowline-specific film tuning. Canon values were designed for grid's
// architectural stillness; here the thin ribbons read as "insufficiently
// filmic" at canon grain (0.07 intensity, 0.22 radialMix). We raise baseline
// grain ~2.3× so the ink ribbons carry visible film texture at rest, and
// push radialMix down so grain appears evenly across the frame rather than
// concentrating at the edges. Size is dropped slightly to give thin lines
// finer texture detail instead of uniform clumps.
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

export interface MountFlowOptions {
  readonly canvas: HTMLCanvasElement;
  /** Required. HUD + tap-to-start overlay are appended here. */
  readonly hostOverlay: HTMLElement;
  /** Default audio track URL. Defaults to "/audio.mp3" (Next.js public root). */
  readonly defaultAudioSrc?: string;
  readonly onError?: (err: unknown) => void;
  readonly onReady?: () => void;
}

export interface MountFlowHandle {
  stop(): void;
  /**
   * Hot-swap the final-stage compose pass at runtime. Pass `null` to fall
   * back to the default pass-through blit. Mirrors motion-dot's MountHandle
   * so the LiquidGlass compose pass can drive flow the same way.
   */
  setComposePass(pass: ComposePass | null): void;
  /**
   * Subscribe to a callback fired at the start of each frame, before the
   * encoder is built. Returns an unsubscribe fn.
   */
  onBeforeFrame(cb: () => void): () => void;
  /**
   * WebGPU resources owned by motion-flow. Exposed so a ComposePass
   * implementation can construct its own pipelines, samplers, and uniform
   * buffers using the same device. Do not destroy the device.
   */
  readonly gpu: {
    readonly device: GPUDevice;
    readonly queue: GPUQueue;
    readonly format: GPUTextureFormat;
  };
}

export async function mountMotionFlowApp(
  opts: MountFlowOptions,
): Promise<MountFlowHandle> {
  const { canvas, hostOverlay } = opts;

  try {
    const gpu = await initGpu(canvas);
    const { device, context, format } = gpu;

    const offscreenTargets = createOffscreenTargetPool(device);
    const filmPost: MotionFilmPostPass = createFilmPostPass(
      device,
      format,
      FILM_STOCK_CANON,
    );

    // ── Compose pass plumbing (parallel to motion-dot/main.ts) ────────────
    const composeSampler = device.createSampler({
      label: "motion-flow:compose substrate sampler",
      magFilter: "nearest",
      minFilter: "nearest",
      addressModeU: "clamp-to-edge",
      addressModeV: "clamp-to-edge",
    });
    const defaultBlit = createDefaultBlitPass(device, format);
    let activeComposePass: ComposePass | null = null;
    const beforeFrameCallbacks = new Set<() => void>();

    const audioBus = new AudioBus({
      demoStyle: "beat",
      intensityAttackTau: 1.5,
      intensityReleaseTau: 3.0,
    });

    const baseCompute: FlowlineConfig = FLOWLINE_DEFAULT_CONFIG;
    const baseRibbon: RibbonConfig = RIBBON_DEFAULT_CONFIG;
    const initialScene = SCENES[0];

    const initialCompute: FlowlineConfig = {
      ...baseCompute,
      ...initialScene.compute,
    };

    // Phase 11 — hero glyph SDF. Generated once at startup on the CPU and
    // uploaded to GPU as r32float. The texture lives for the full app
    // lifetime; only the Comb/Flow scene samples it meaningfully (other
    // scenes carry combStrength=0 which short-circuits the sampling branch).
    const heroSdf = createHeroSdf(device);

    const flowlineCompute: FlowlineComputeHandle = createFlowlineCompute(device, {
      config: initialCompute,
      sdfTextureView: heroSdf.texture.view,
      sdfSampler: heroSdf.texture.sampler,
    });

    const ribbonPass: RibbonPassHandle = createRibbonPass(device, {
      targetFormat: OFFSCREEN_FORMAT,
      agentBuffer: flowlineCompute.agentBuffer,
      trailBuffer: flowlineCompute.trailBuffer,
      nAgents: initialCompute.nAgents,
      nTrail: initialCompute.nTrail,
      config: { ...baseRibbon, ...initialScene.ribbon },
    });

    const sceneController = createFlowlineSceneController({
      compute: flowlineCompute,
      initialScene,
      baseCompute,
      baseRibbon,
    });

    let lastCycleIdx = 0;
    let autoCycleEnabled = true;
    let filmEnabled = true;
    let keymapVisible = false;

    const audioController: AudioController = createAudioController({
      audioBus,
      defaultSrc: opts.defaultAudioSrc ?? "/audio.mp3",
      storageKeyPrefix: "flowline",
      onStateChange: () => {
        if (audioController.enabled) {
          filmEnabled = true;
        }
        updateStartOverlay();
      },
    });

    // Click-to-start overlay: browser autoplay policy requires a user gesture
    // before the bundled track can play. One tap enables audio and dismisses
    // the overlay — zero subsequent decisions required for M4 verification.
    const startOverlay = document.createElement("div");
    Object.assign(startOverlay.style, {
      position: "fixed",
      inset: "0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: "10px",
      background: "rgba(26,26,26,0.78)",
      color: "#fffff2",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: "14px",
      letterSpacing: "0.08em",
      cursor: "pointer",
      zIndex: "50",
      userSelect: "none",
      backdropFilter: "blur(6px)",
    } satisfies Partial<CSSStyleDeclaration>);
    const headline = document.createElement("div");
    headline.textContent = "TAP TO START";
    headline.style.fontSize = "18px";
    headline.style.letterSpacing = "0.24em";
    const sub = document.createElement("div");
    sub.textContent = "motion-flowline-webgpu · Phase 11";
    sub.style.opacity = "0.62";
    sub.style.fontSize = "11px";
    startOverlay.append(headline, sub);
    hostOverlay.appendChild(startOverlay);

    function updateStartOverlay(): void {
      if (audioController.enabled) {
        startOverlay.style.display = "none";
      }
    }

    const startClickHandler = (): void => {
      void audioController.toggle();
    };
    startOverlay.addEventListener("click", startClickHandler);

    const pinScene = (sceneIdx: number): void => {
      if (sceneIdx < 0 || sceneIdx >= SCENES.length) return;
      autoCycleEnabled = false;
      sceneController.switchTo(SCENES[sceneIdx]);
    };

    const resumeAuto = (): void => {
      autoCycleEnabled = true;
    };

    const reseed = (): void => {
      sceneController.participant.reset();
    };

    const toggleFilm = (): void => {
      filmEnabled = !filmEnabled;
    };

    const toggleAudio = async (): Promise<void> => {
      await audioController.toggle();
    };

    let hud: ReturnType<typeof createFlowlineHud>;
    const toggleKeymap = (): void => {
      keymapVisible = !keymapVisible;
      setFlowlineHudKeymapVisible(hud, keymapVisible);
    };

    hud = createFlowlineHud({
      parent: hostOverlay,
      scenes: SCENES.map((scene, idx) => ({
        id: String(idx),
        label: scene.name,
        hotkey: String(idx + 1),
      })),
      onPickScene: (id) => {
        const idx = Number(id);
        if (Number.isNaN(idx)) return;
        pinScene(idx);
      },
      onAuto: resumeAuto,
      onReseed: reseed,
      onToggleFilm: toggleFilm,
      onToggleAudio: toggleAudio,
      onToggleHelp: toggleKeymap,
      keymapEntries: FLOWLINE_KEYMAP_ENTRIES,
    });

    const disposeKeyboard = bindFlowlineKeyboard({
      pinScene,
      resumeAuto,
      reseed,
      toggleAudio,
      toggleFilm,
      toggleKeymap,
    });

    const loop = createFixedStepLoop({
      fps: 45,
      frame: ({ time, dt }) => {
        // Fire onBeforeFrame subscribers (consumers update uniforms / DOM
        // rects / surface lists here before any GPU encoding starts).
        for (const cb of beforeFrameCallbacks) {
          try {
            cb();
          } catch (err) {
            console.error("[motion-flow] onBeforeFrame callback threw:", err);
          }
        }

        const size = resizeCanvas(gpu);

        const outputView = context.getCurrentTexture().createView();
        const sceneView = offscreenTargets.get("scene", {
          label: "flowline-scene-offscreen",
          width: size.width,
          height: size.height,
          format: OFFSCREEN_FORMAT,
        });
        // Compose substrate — post-effect output, sampled by the compose pass.
        // Same format as the swap chain so the default blit preserves bits.
        const composeSubstrateView = offscreenTargets.get("compose-substrate", {
          label: "motion-flow:compose-substrate",
          width: size.width,
          height: size.height,
          format,
        });

        const encoder = device.createCommandEncoder({ label: "flowline-frame" });

        if (autoCycleEnabled) {
          const cycleIdx =
            Math.floor(time / SCENE_CYCLE_DURATION_SEC) % SCENES.length;
          if (cycleIdx !== lastCycleIdx) {
            sceneController.switchTo(SCENES[cycleIdx]);
            lastCycleIdx = cycleIdx;
          }
        }

        const frameConfig = sceneController.tick(encoder, dt);

        // Advance audio analysis. When disabled, bus zeros out — wiring resolves
        // to 0 deltas and the visual falls back to the canon baseline.
        audioBus.update(audioController.enabled ? dt : 0);
        const intensity = audioController.enabled
          ? shapeIntensity(audioBus.intensity)
          : 0;
        const bands = audioController.enabled
          ? audioBus.bands
          : { bass: 0, mid: 0, treble: 0, energy: 0 };
        const onsets = audioController.enabled
          ? audioBus.onsets
          : { bassOnset: 0, midOnset: 0, trebleOnset: 0, globalOnset: 0 };

        FLOWLINE_WIRING.resolveInto(
          FLOWLINE_AUDIO_DELTA_BUFFER,
          bands,
          onsets,
          intensity,
        );

        flowlineCompute.update(encoder, {
          time,
          dt,
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

        ribbonPass.updateConfig(frameConfig.ribbon);
        ribbonPass.render(encoder, sceneView, {
          viewWidth: size.width,
          viewHeight: size.height,
          rimPulse: FLOWLINE_AUDIO_DELTA_BUFFER["trail.rimPulse"],
        });

        if (filmEnabled) {
          filmPost.updateConfig(composeFilmConfig(FLOWLINE_AUDIO_DELTA_BUFFER));
        } else {
          filmPost.updateConfig({
            grain: GRAIN_STATIC,
            chromaticAberration: CHROMATIC_STATIC,
            bloom: BLOOM_STATIC,
            vignette: VIGNETTE_STATIC,
            tonemap: TONEMAP_STATIC,
          });
        }

        filmPost.render(
          encoder,
          sceneView,
          composeSubstrateView,
          time,
          size.width,
          size.height,
        );

        // Final stage: compose substrate into swap chain. Default blit when
        // no LiquidGlass compose pass is registered.
        const composePass = activeComposePass ?? defaultBlit;
        composePass.render({
          encoder,
          device,
          queue: device.queue,
          substrateView: composeSubstrateView,
          substrateSampler: composeSampler,
          swapView: outputView,
          format,
          width: size.width,
          height: size.height,
          dpr: gpu.dpr,
          time,
          dt,
        });

        device.queue.submit([encoder.finish()]);

        const activeSceneId = String(
          SCENES.findIndex((s) => s.name === sceneController.target.name),
        );
        updateFlowlineHud(
          hud,
          {
            sceneName: sceneController.target.name,
            autoEnabled: autoCycleEnabled,
            filmEnabled,
            audioEnabled: audioController.enabled,
            audioSourceLabel: audioController.sourceLabel,
            onsetActivity: onsets.globalOnset,
            keymapVisible,
          },
          activeSceneId,
        );
        updateFlowlineHudAudio(hud, { bands, onsets, intensity });
      },
    });
    loop.start();

    console.info(
      `[flowline] Phase 14 ready — ${SCENES.length} scenes × ${SCENE_CYCLE_DURATION_SEC}s auto-cycle (${initialCompute.nAgents} agents × ${initialCompute.nTrail} trail, SDF ${heroSdf.sdf.width}×${heroSdf.sdf.height} r32float). Keys: 1-7 pin, 0 auto, R reseed, A audio, F film, ? help.`,
    );

    opts.onReady?.();

    let stopped = false;
    return {
      stop(): void {
        if (stopped) return;
        stopped = true;
        loop.stop();
        disposeKeyboard();
        startOverlay.removeEventListener("click", startClickHandler);
        startOverlay.remove();
        hud.overlay.element.remove();
        hud.selector.element.remove();
        hud.meter.element.remove();
        hud.keymap.element.remove();
        hud.touchStrip.remove();
        if (audioController.enabled) {
          void audioController.toggle();
        }
        // Destroy compose pipeline
        beforeFrameCallbacks.clear();
        if (activeComposePass) {
          activeComposePass.destroy?.();
          activeComposePass = null;
        }
        defaultBlit.destroy?.();
        try { flowlineCompute.destroy(); } catch { /* ignore */ }
        try { ribbonPass.destroy(); } catch { /* ignore */ }
        try { filmPost.destroy(); } catch { /* ignore */ }
        try { heroSdf.texture.destroy(); } catch { /* ignore */ }
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
  } catch (err) {
    opts.onError?.(err);
    throw err;
  }
}
