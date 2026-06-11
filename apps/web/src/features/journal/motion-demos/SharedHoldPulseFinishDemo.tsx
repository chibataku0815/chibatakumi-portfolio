"use client";

// SharedHoldPulseFinishDemo — the shared-hold-pulse schedule rendered live
// with the API-finish standard (grain + chromatic aberration, light palette)
// on WebGPU.
//
// Architecture mirrors the lab deliverable pipeline: the verb draws a source frame
// (canvas2d = the Remotion base render's analogue), then @bridges/webgpu-finish applies
// the finish as two WGSL passes whose math is parity-proven against the vec-core CPU
// oracle (see docs/journal/motion-demo-webgpu-finish-plan.md). This cell has no posted
// per-cell SNS clip, so the grain stream id is the article's own (see
// ./finish/shared-hold-pulse-source.ts) — no deliverable-parity claim is made.
//
// Degradation chain: WebGPU unavailable / init failure → the plain SVG demo (no finish);
// prefers-reduced-motion → a single finished still at the mid-plateau hold.

import { useEffect, useRef, useState } from "react";
import {
  API_FINISH_LIGHT_STANDARD,
  createFinishPipeline,
  deriveGrainSeedU32,
  grainTemporalSeed,
} from "@bridges/webgpu-finish";
import { SharedHoldPulseDemo } from "./SharedHoldPulseDemo";
import {
  drawSharedHoldPulseSourceFrame,
  FINISH_RENDER_SIZE,
  FINISH_STREAM_NAMESPACE,
} from "./finish/shared-hold-pulse-source";
import {
  SHARED_HOLD_PULSE_FPS,
  SHARED_HOLD_PULSE_HOLD_FRAME,
  SHARED_HOLD_PULSE_PERIOD_FRAMES,
} from "./verbs/shared-hold-pulse.params";

export function SharedHoldPulseFinishDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (typeof navigator === "undefined" || !("gpu" in navigator)) {
      setFallback(true);
      return;
    }

    let disposed = false;
    let raf = 0;
    let cleanup: (() => void) | null = null;

    (async () => {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) throw new Error("WebGPU adapter unavailable");
        const device = await adapter.requestDevice();
        if (disposed) {
          device.destroy();
          return;
        }
        const gpuCtx = canvas.getContext("webgpu");
        if (!gpuCtx) throw new Error("webgpu canvas context unavailable");
        const format = navigator.gpu.getPreferredCanvasFormat();
        gpuCtx.configure({ device, format, alphaMode: "opaque" });

        const size = FINISH_RENDER_SIZE;
        const source = document.createElement("canvas");
        source.width = size;
        source.height = size;
        const c2d = source.getContext("2d");
        if (!c2d) throw new Error("2d context unavailable");
        // The painter draws capsules with ctx.roundRect — universally present in
        // WebGPU-era browsers, but feature-test so any gap degrades to the SVG
        // demo like every other init failure (first paint runs inside rAF,
        // outside this try/catch).
        if (typeof c2d.roundRect !== "function") {
          throw new Error("roundRect unavailable");
        }

        const sourceTexture = device.createTexture({
          size: { width: size, height: size },
          format: "rgba8unorm",
          usage:
            GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT,
        });
        const sourceView = sourceTexture.createView();
        const pipeline = createFinishPipeline(device, {
          width: size,
          height: size,
          outputFormat: format,
        });

        const renderFrame = (frame: number) => {
          drawSharedHoldPulseSourceFrame(c2d, size, frame);
          device.queue.copyExternalImageToTexture(
            { source },
            { texture: sourceTexture },
            { width: size, height: size },
          );
          const seedU32 = deriveGrainSeedU32(
            grainTemporalSeed(
              FINISH_STREAM_NAMESPACE,
              API_FINISH_LIGHT_STANDARD.grainSeed,
              frame,
            ),
          );
          const encoder = device.createCommandEncoder();
          pipeline.render(
            encoder,
            sourceView,
            gpuCtx.getCurrentTexture().createView(),
            { seedU32 },
          );
          device.queue.submit([encoder.finish()]);
        };

        const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        let visible = true;
        const io = new IntersectionObserver((entries) => {
          visible = entries.some((e) => e.isIntersecting);
        });
        io.observe(canvas);

        let start: number | null = null;
        let lastFrame = -1;

        const tick = (now: number) => {
          raf = requestAnimationFrame(tick);
          if (!visible) {
            start = null;
            lastFrame = -1;
            return;
          }
          if (start === null) start = now;
          const frame = Math.floor(((now - start) / 1000) * SHARED_HOLD_PULSE_FPS) %
            SHARED_HOLD_PULSE_PERIOD_FRAMES;
          if (frame === lastFrame) return;
          lastFrame = frame;
          renderFrame(frame);
        };

        const startOrStop = () => {
          cancelAnimationFrame(raf);
          start = null;
          lastFrame = -1;
          if (reduceQuery.matches) {
            renderFrame(SHARED_HOLD_PULSE_HOLD_FRAME);
          } else {
            raf = requestAnimationFrame(tick);
          }
        };

        startOrStop();
        reduceQuery.addEventListener("change", startOrStop);

        cleanup = () => {
          cancelAnimationFrame(raf);
          reduceQuery.removeEventListener("change", startOrStop);
          io.disconnect();
          pipeline.destroy();
          sourceTexture.destroy();
          device.destroy();
        };
      } catch {
        if (!disposed) setFallback(true);
      }
    })();

    return () => {
      disposed = true;
      cleanup?.();
      cleanup = null;
    };
  }, []);

  if (fallback) return <SharedHoldPulseDemo />;

  return (
    <canvas
      ref={canvasRef}
      width={FINISH_RENDER_SIZE}
      height={FINISH_RENDER_SIZE}
      className="h-auto w-full max-w-[320px]"
      aria-hidden="true"
    />
  );
}
