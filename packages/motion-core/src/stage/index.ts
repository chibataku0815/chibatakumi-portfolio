// MotionStage — Renewal 2026 Stream 4-A.
//
// Owns the persistent canvas, the GPU device, the AudioBus, the offscreen
// pool, and a fullscreen composite pass. Route changes call
// `setActive(name, blendDurationMs?)` which orchestrates a 0.5s cross-blend
// between two participants by rendering each into its own offscreen and
// blending in the composite pass to the swapchain.
//
// Architecture rationale (see `feedback_no_fallback_bug_hotbed.md`):
//   * Single GPU device, single AudioBus, single RAF loop. Participants
//     never instantiate these themselves.
//   * Offscreen pool keyed by participant name → rgba16float color
//     attachment. Compiled at participant.init time; resized when the
//     canvas backing-store changes.
//   * Composite pass is the ONLY thing that targets the swapchain.
//     Participants render to their offscreen view; the stage blits or
//     blends to the swapchain. This decouples participant pipelines
//     (which compile against rgba16float) from the swapchain format
//     (which is platform-dependent — bgra8unorm or rgba8unorm-srgb).
//   * Fixed-step accumulator from webgpu-motion-shell (canon 45 FPS).
//   * No silent fallback: missing WebGPU support throws synchronously
//     during `createMotionStage`.

import { AudioBus, type AudioBands, type OnsetBands } from "webgpu-motion-audio";
import {
  initGpu,
  resizeCanvas,
  createOffscreenTargetPool,
  createFixedStepLoop,
  type GpuContext,
  type OffscreenTargetPool,
  type FixedStepLoopHandle,
} from "webgpu-motion-shell";

import type {
  MotionParticipant,
  MotionStage,
  AudioState,
  SceneSnapshot,
  ParticipantFrameContext,
} from "../participant";
import { COMPOSITE_WGSL } from "./composite.wgsl";

/** Format that participants render into. Stage composites to swapchain. */
export const STAGE_OFFSCREEN_FORMAT: GPUTextureFormat = "rgba16float";
export const STAGE_DEFAULT_FPS = 45;
export const STAGE_DEFAULT_BLEND_MS = 500;

export interface MotionStageOptions {
  readonly canvas: HTMLCanvasElement;
  /** Initial route key (e.g. `/works`). Participants may use this for state keying. */
  readonly initialRouteKey?: string;
  /** Override fixed-step rate. Canon: 45. */
  readonly fps?: number;
  /** AudioBus demo style for the silent default. */
  readonly demoStyle?: "ambient" | "beat";
  /** Optional error sink — called when a frame throws. Stage stops the loop. */
  readonly onError?: (err: unknown) => void;
}

interface ParticipantRecord {
  readonly p: MotionParticipant<string>;
  initialized: boolean;
  /** rgba16float offscreen texture allocated by the stage's offscreen pool. */
  texture: GPUTexture | null;
  width: number;
  height: number;
}

interface BlendState {
  fromName: string;
  toName: string;
  /** Normalized progress, 0 = pure from, 1 = pure to. */
  t: number;
  durationMs: number;
}

const COMPOSITE_TARGET_KEY = "@stage/composite-input";

/**
 * Create and start a MotionStage bound to the given canvas. Returns once
 * GPU init has settled (resolves async).
 *
 * Throws synchronously when `navigator.gpu` is missing or adapter
 * negotiation fails — callers should catch and present the unsupported
 * screen (per plan §5.4: no silent fallback).
 */
export async function createMotionStage(
  options: MotionStageOptions,
): Promise<MotionStage & MotionStageControls> {
  const gpu = await initGpu(options.canvas);
  return startStage(gpu, options);
}

/**
 * Extension of the MotionStage type surface with controls only the
 * shell needs. Kept on the returned instance so plain MotionStage
 * consumers don't see the imperative knobs.
 */
export interface MotionStageControls {
  readonly format: GPUTextureFormat;
  readonly audioBus: AudioBus;
  /** Emit a route key change so participants that key state on route can react. */
  setRouteKey(key: string): void;
  /** Force a resize check (call from ResizeObserver if your shell wires one). */
  resize(): void;
}

function startStage(
  gpu: GpuContext,
  options: MotionStageOptions,
): MotionStage & MotionStageControls {
  const { device, context, format, canvas } = gpu;
  const fps = options.fps ?? STAGE_DEFAULT_FPS;
  const audioBus = new AudioBus({ demoStyle: options.demoStyle ?? "ambient" });

  const participants = new Map<string, ParticipantRecord>();
  let activeName: string | null = null;
  let blend: BlendState | null = null;
  let routeKey = options.initialRouteKey ?? "/";
  let stageStartTime = performance.now() / 1000;

  // Offscreen pool — keyed per participant so re-renders reuse textures.
  const offscreenPool: OffscreenTargetPool = createOffscreenTargetPool(device);

  // Composite pipeline: blits texA when blend=0, blends texA→texB when 0<blend≤1.
  const compositeModule = device.createShaderModule({
    label: "stage/composite",
    code: COMPOSITE_WGSL,
  });
  const compositeBindGroupLayout = device.createBindGroupLayout({
    label: "stage/composite-bgl",
    entries: [
      { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
      { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
      { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
    ],
  });
  const compositePipeline = device.createRenderPipeline({
    label: "stage/composite-pipeline",
    layout: device.createPipelineLayout({
      bindGroupLayouts: [compositeBindGroupLayout],
    }),
    vertex: { module: compositeModule, entryPoint: "vs" },
    fragment: {
      module: compositeModule,
      entryPoint: "fs",
      targets: [{ format }],
    },
    primitive: { topology: "triangle-list" },
  });
  const compositeSampler = device.createSampler({
    magFilter: "linear",
    minFilter: "linear",
    addressModeU: "clamp-to-edge",
    addressModeV: "clamp-to-edge",
  });
  const compositeUniformBuffer = device.createBuffer({
    label: "stage/composite-uniform",
    size: 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // Stage-internal "no participant ready yet" texture: a 1x1 black so the
  // composite pass has a valid bind group on cold start.
  const fallbackTexture = device.createTexture({
    label: "stage/fallback-1x1",
    size: { width: 1, height: 1 },
    format: STAGE_OFFSCREEN_FORMAT,
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
  });
  const fallbackView = fallbackTexture.createView();
  // Clear the fallback texture once so it has well-defined contents.
  {
    const enc = device.createCommandEncoder({ label: "stage/fallback-init" });
    const pass = enc.beginRenderPass({
      colorAttachments: [
        {
          view: fallbackView,
          loadOp: "clear",
          storeOp: "store",
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        },
      ],
    });
    pass.end();
    device.queue.submit([enc.finish()]);
  }

  // Stable AudioState — bands/onsets are AudioBus's reused objects.
  const audioState: AudioState = {
    analyser: null,
    bands: audioBus.bands as AudioBands,
    onsets: audioBus.onsets as OnsetBands,
    intensity: 0,
  };

  const sceneSnapshot: { time: number; dt: number; routeKey: string } = {
    time: 0,
    dt: 1 / fps,
    routeKey,
  };

  function ensureParticipantTexture(rec: ParticipantRecord, w: number, h: number): GPUTexture {
    if (rec.texture && rec.width === w && rec.height === h) {
      return rec.texture;
    }
    if (rec.texture) {
      rec.texture.destroy();
    }
    const tex = device.createTexture({
      label: `stage/participant-target/${rec.p.name}`,
      size: { width: w, height: h },
      format: STAGE_OFFSCREEN_FORMAT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    rec.texture = tex;
    rec.width = w;
    rec.height = h;
    return tex;
  }

  function getRecord(name: string): ParticipantRecord {
    const rec = participants.get(name);
    if (!rec) {
      throw new Error(`[motion-stage] no participant named "${name}" registered`);
    }
    return rec;
  }

  async function ensureInitialized(rec: ParticipantRecord): Promise<void> {
    if (rec.initialized) return;
    await rec.p.init(device, STAGE_OFFSCREEN_FORMAT);
    rec.initialized = true;
  }

  const compositeUniforms = new Float32Array(4);

  function frame(now: number, dt: number): void {
    const { width, height } = resizeCanvas(gpu);
    if (width === 0 || height === 0) return;

    audioBus.update(dt);
    // Object identities are reused; just refresh the snapshot fields.
    // (analyser is left null — current participants consume only bands/onsets/
    //  intensity. Raw FFT access is a future extension when audio surfaces
    //  expose an explicit subscription API.)
    (audioState as { intensity: number }).intensity = audioBus.intensity;

    sceneSnapshot.time = now / 1000 - stageStartTime;
    sceneSnapshot.dt = dt;
    sceneSnapshot.routeKey = routeKey;
    const snapshot: SceneSnapshot = sceneSnapshot;

    // Advance blend timer.
    if (blend) {
      blend.t = Math.min(1, blend.t + (dt * 1000) / blend.durationMs);
      if (blend.t >= 1) {
        activeName = blend.toName;
        blend = null;
      }
    }

    // Determine which participants need a frame this tick.
    const drawSlots: { rec: ParticipantRecord; useFallback: boolean }[] = [];
    if (blend) {
      drawSlots.push({ rec: getRecord(blend.fromName), useFallback: false });
      drawSlots.push({ rec: getRecord(blend.toName), useFallback: false });
    } else if (activeName) {
      drawSlots.push({ rec: getRecord(activeName), useFallback: false });
    }

    // CPU update phase — pure (no GPU encoding).
    for (const { rec } of drawSlots) {
      if (!rec.initialized) continue; // first frame after register; init pending
      try {
        rec.p.update(dt, audioState, snapshot);
      } catch (err) {
        options.onError?.(err);
        throw err;
      }
    }

    // GPU encode phase.
    const encoder = device.createCommandEncoder({ label: "stage/frame" });

    // Per-participant render into their offscreen.
    for (const { rec } of drawSlots) {
      if (!rec.initialized) continue;
      const tex = ensureParticipantTexture(rec, width, height);
      const view = tex.createView({ label: `stage/view/${rec.p.name}` });
      const ctx: ParticipantFrameContext = {
        encoder,
        outputView: view,
        outputFormat: STAGE_OFFSCREEN_FORMAT,
        width,
        height,
        time: snapshot.time,
      };
      try {
        rec.p.render(ctx);
      } catch (err) {
        options.onError?.(err);
        throw err;
      }
    }

    // Drive any participant blendTo callbacks (UI hooks; no GPU work).
    if (blend) {
      const fromRec = getRecord(blend.fromName);
      const toRec = getRecord(blend.toName);
      if (fromRec.initialized) fromRec.p.blendTo(toRec.p, blend.t);
      if (toRec.initialized) toRec.p.blendTo(fromRec.p, 1 - blend.t);
    }

    // Composite to swapchain.
    const swapView = context.getCurrentTexture().createView({ label: "stage/swap" });
    let viewA: GPUTextureView = fallbackView;
    let viewB: GPUTextureView = fallbackView;
    let blendValue = 0;
    if (blend) {
      const fromRec = getRecord(blend.fromName);
      const toRec = getRecord(blend.toName);
      viewA = fromRec.texture ? fromRec.texture.createView() : fallbackView;
      viewB = toRec.texture ? toRec.texture.createView() : fallbackView;
      blendValue = blend.t;
    } else if (activeName) {
      const rec = getRecord(activeName);
      viewA = rec.texture ? rec.texture.createView() : fallbackView;
      viewB = fallbackView;
      blendValue = 0;
    }

    compositeUniforms[0] = blendValue;
    device.queue.writeBuffer(compositeUniformBuffer, 0, compositeUniforms);

    const compositeBindGroup = device.createBindGroup({
      label: "stage/composite-bg",
      layout: compositeBindGroupLayout,
      entries: [
        { binding: 0, resource: compositeSampler },
        { binding: 1, resource: viewA },
        { binding: 2, resource: viewB },
        { binding: 3, resource: { buffer: compositeUniformBuffer } },
      ],
    });

    const swapPass = encoder.beginRenderPass({
      label: "stage/composite-pass",
      colorAttachments: [
        {
          view: swapView,
          loadOp: "clear",
          storeOp: "store",
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        },
      ],
    });
    swapPass.setPipeline(compositePipeline);
    swapPass.setBindGroup(0, compositeBindGroup);
    swapPass.draw(3);
    swapPass.end();

    device.queue.submit([encoder.finish()]);
  }

  const loop: FixedStepLoopHandle = createFixedStepLoop({
    fps,
    frame: ({ now, dt }) => {
      try {
        frame(now, dt);
      } catch (err) {
        options.onError?.(err);
        loop.stop();
      }
    },
  });

  // Initial size + start.
  resizeCanvas(gpu);
  loop.start();

  return {
    device,
    canvas,
    format,
    audioBus,
    register(p: MotionParticipant<string>): void {
      if (participants.has(p.name)) {
        throw new Error(
          `[motion-stage] participant "${p.name}" is already registered — dispose first`,
        );
      }
      participants.set(p.name, {
        p,
        initialized: false,
        texture: null,
        width: 0,
        height: 0,
      });
    },
    setActive(name: string, blendDurationMs?: number): void {
      const rec = getRecord(name);
      if (activeName === name && !blend) return;
      // Lazy init the new participant. The async init runs without
      // blocking the caller; the loop will start drawing it once
      // initialized=true.
      void ensureInitialized(rec).catch((err) => options.onError?.(err));

      const duration = Math.max(0, blendDurationMs ?? STAGE_DEFAULT_BLEND_MS);
      if (duration === 0 || activeName === null) {
        activeName = name;
        blend = null;
        return;
      }
      blend = {
        fromName: activeName,
        toName: name,
        t: 0,
        durationMs: duration,
      };
    },
    setRouteKey(key: string): void {
      routeKey = key;
    },
    resize(): void {
      resizeCanvas(gpu);
      // Per-participant textures resize lazily on next frame.
    },
    dispose(): void {
      loop.stop();
      for (const rec of participants.values()) {
        if (rec.initialized) {
          try { rec.p.dispose(); } catch (err) { options.onError?.(err); }
        }
        if (rec.texture) rec.texture.destroy();
      }
      participants.clear();
      offscreenPool.destroyAll();
      fallbackTexture.destroy();
      compositeUniformBuffer.destroy();
      // GPU device dispose is owned by the host (browser cleans on tab close);
      // we don't call device.destroy() because route remounts that share
      // a single canvas would lose the device.
      void offscreenPool;
      void COMPOSITE_TARGET_KEY;
    },
  };
}
