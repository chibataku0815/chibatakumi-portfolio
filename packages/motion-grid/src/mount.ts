// Standalone mount entry — Renewal 2026 Motion Works (Package 4).
//
// Mirrors life/output/motion-grid-guided-webgpu/src/main.ts as a host-driven
// mount API: caller provides the canvas, we drive the loop until stop().
// MotionStageProvider hosts only motion-dot, so /experiments/grid mounts its
// own canvas via this entry. Audio controller / HUD / keyboard cluster are
// intentionally omitted — the scene's own state machine cycles hero word
// patterns and keeps the surface alive without input. Per
// `feedback_no_fallback_bug_hotbed.md`: WebGPU init failure throws; route
// callers surface the error explicitly (no silent fallback).
//
// Audio is wired with a zeroed AudioBus (intensity = 0), so the film-post
// composite uses the static FILM_STOCK_CANON baseline plus the scene's
// non-audio electric signals (strikeFlag / flickerIntensity / glowMix).
// Adding audio playback is a Phase A+1 concern.

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
  createGridBlockPass,
  type GridBlockPass,
  type GridReactiveState,
} from "./render/grid-block-pass";
import {
  createDiscreteGridScene,
  type DiscreteGridScene,
  type DiscreteGridSnapshot,
} from "./scene/discrete-grid-scene";
import { ELECTRIC_TICKER_CHARACTERS } from "./scene/typography/hero-word-pattern-registry";

const GRAIN_STATIC = FILM_STOCK_CANON.grain;
const CHROMATIC_STATIC = FILM_STOCK_CANON.chromaticAberration;
const BLOOM_STATIC = FILM_STOCK_CANON.bloom;
const VIGNETTE_STATIC = FILM_STOCK_CANON.vignette;
const TONEMAP_STATIC = FILM_STOCK_CANON.tonemap;

const ZERO_REACTIVE: GridReactiveState = {
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

interface ElectricFilmSignals {
  readonly strikeFlag: number;
  readonly strikePhase: number;
  readonly flickerIntensity: number;
  readonly glowMix: number;
  readonly rgbSplitBump: number;
}

function composeFilmConfig(electric: ElectricFilmSignals): Partial<MotionFilmPostConfig> {
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
      threshold: BLOOM_STATIC.threshold - electric.glowMix * 0.28,
      intensity: BLOOM_STATIC.intensity + electric.glowMix * 0.35,
      warmth: BLOOM_STATIC.warmth - electric.glowMix * 0.10,
    },
    tonemap: TONEMAP_STATIC,
  };
}

export interface MountGridOptions {
  readonly canvas: HTMLCanvasElement;
  readonly onError?: (err: unknown) => void;
  readonly onReady?: () => void;
}

export interface MountGridHandle {
  stop(): void;
}

export async function mountMotionGridApp(
  opts: MountGridOptions,
): Promise<MountGridHandle> {
  const { canvas } = opts;

  try {
    const gpu = await initGpu(canvas);
    const { device, context, format } = gpu;
    const offscreenTargets = createOffscreenTargetPool(device);
    const offscreenFormat: GPUTextureFormat = "rgba16float";

    const scene: DiscreteGridScene = createDiscreteGridScene();
    const blockPass: GridBlockPass = createGridBlockPass(device, offscreenFormat);
    const filmPost: MotionFilmPostPass = createFilmPostPass(device, format, {
      grain: GRAIN_STATIC,
      chromaticAberration: CHROMATIC_STATIC,
      bloom: BLOOM_STATIC,
      vignette: VIGNETTE_STATIC,
      tonemap: TONEMAP_STATIC,
    });

    const loop = createFixedStepLoop({
      fps: 45,
      frame: ({ dt, time }) => {
        const size = resizeCanvas(gpu);
        scene.resize(size.width, size.height);
        scene.update(dt);

        const snapshot: DiscreteGridSnapshot = scene.getSnapshot();
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

        const outputView = context.getCurrentTexture().createView();
        const offscreen = offscreenTargets.get("scene", {
          label: "grid-scene-offscreen",
          width: size.width,
          height: size.height,
          format: offscreenFormat,
        });
        const encoder = device.createCommandEncoder({ label: "grid-frame" });

        blockPass.render(encoder, offscreen, snapshot, ZERO_REACTIVE, 1);
        filmPost.render(encoder, offscreen, outputView, time, size.width, size.height);

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
        try { scene.destroy(); } catch { /* ignore */ }
        try { blockPass.destroy(); } catch { /* ignore */ }
        try { filmPost.destroy(); } catch { /* ignore */ }
      },
    };
  } catch (err) {
    opts.onError?.(err);
    throw err;
  }
}
