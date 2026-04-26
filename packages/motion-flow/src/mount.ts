// Standalone mount entry — Renewal 2026 Motion Works (Package 4).
//
// Mirrors life/output/motion-flowline-webgpu/src/main.ts as a host-driven
// mount API: caller provides the canvas, we drive the loop until stop().
// MotionStageProvider hosts only motion-dot, so /experiments/flow mounts its
// own canvas via this entry. Audio controller / HUD / keyboard cluster are
// intentionally omitted — the 7-scene auto-cycle (84 s full rotation) keeps
// the surface alive without input. Per `feedback_no_fallback_bug_hotbed.md`:
// WebGPU init failure throws; route callers surface the error explicitly.
//
// Audio is wired with a zeroed delta buffer (intensity = 0), so ribbon
// pulses use scene defaults and the film-post composite reads the static
// flowline grain baseline plus the canon bloom/vignette/tonemap. Adding
// audio playback is a Phase A+1 concern.

import { FILM_STOCK_CANON } from "webgpu-motion-art";
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

const OFFSCREEN_FORMAT: GPUTextureFormat = "rgba16float";

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
  readonly onError?: (err: unknown) => void;
  readonly onReady?: () => void;
}

export interface MountFlowHandle {
  stop(): void;
}

export async function mountMotionFlowApp(
  opts: MountFlowOptions,
): Promise<MountFlowHandle> {
  const { canvas } = opts;

  try {
    const gpu = await initGpu(canvas);
    const { device, context, format } = gpu;

    const offscreenTargets = createOffscreenTargetPool(device);
    const filmPost: MotionFilmPostPass = createFilmPostPass(
      device,
      format,
      FILM_STOCK_CANON,
    );

    const baseCompute: FlowlineConfig = FLOWLINE_DEFAULT_CONFIG;
    const baseRibbon: RibbonConfig = RIBBON_DEFAULT_CONFIG;
    const initialScene = SCENES[0];

    const initialCompute: FlowlineConfig = {
      ...baseCompute,
      ...initialScene.compute,
    };

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

    const sceneController: FlowlineSceneController = createFlowlineSceneController({
      compute: flowlineCompute,
      initialScene,
      baseCompute,
      baseRibbon,
    });

    let lastCycleIdx = 0;

    const loop = createFixedStepLoop({
      fps: 45,
      frame: ({ time, dt }) => {
        const size = resizeCanvas(gpu);

        const outputView = context.getCurrentTexture().createView();
        const sceneView = offscreenTargets.get("scene", {
          label: "flowline-scene-offscreen",
          width: size.width,
          height: size.height,
          format: OFFSCREEN_FORMAT,
        });

        const encoder = device.createCommandEncoder({ label: "flowline-frame" });

        const cycleIdx =
          Math.floor(time / SCENE_CYCLE_DURATION_SEC) % SCENES.length;
        if (cycleIdx !== lastCycleIdx) {
          sceneController.switchTo(SCENES[cycleIdx]);
          lastCycleIdx = cycleIdx;
        }

        const frameConfig = sceneController.tick(encoder, dt);

        // Audio is not wired in this mount — keep the delta buffer at zero so
        // composeFilmConfig reads the static baseline. (FLOWLINE_AUDIO_DELTA_
        // BUFFER is module-scoped; reset every frame in case a future caller
        // shares the buffer.)
        for (const key of Object.keys(FLOWLINE_AUDIO_DELTA_BUFFER) as Array<
          keyof typeof FLOWLINE_AUDIO_DELTA_BUFFER
        >) {
          FLOWLINE_AUDIO_DELTA_BUFFER[key] = 0;
        }

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
          breathStrength:    0,
          vorticityPulse:    0,
          rimPulse:          0,
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
          rimPulse: 0,
        });

        filmPost.updateConfig(composeFilmConfig(FLOWLINE_AUDIO_DELTA_BUFFER));
        filmPost.render(
          encoder,
          sceneView,
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
        try { flowlineCompute.destroy(); } catch { /* ignore */ }
        try { ribbonPass.destroy(); } catch { /* ignore */ }
        try { filmPost.destroy(); } catch { /* ignore */ }
        try { heroSdf.texture.destroy(); } catch { /* ignore */ }
      },
    };
  } catch (err) {
    opts.onError?.(err);
    throw err;
  }
}
