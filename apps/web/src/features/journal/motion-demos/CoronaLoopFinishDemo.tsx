"use client";

// CoronaLoopFinishDemo — the corona-loop schedule rendered live with the finish
// layer (grain + chromatic aberration) on WebGPU. The source painter draws the
// gold corona frame (canvas2d, with a bloom approximation); @bridges/webgpu-finish
// adds grain + CA as WGSL passes. The grain stream id is the article's own — no
// deliverable-parity claim.
//
// Degradation chain: WebGPU unavailable / init failure → the plain canvas demo
// (no grain/CA); prefers-reduced-motion → a single finished still at the
// loop-midpoint poster frame.

import { useEffect, useRef, useState } from "react";
import {
  createFinishPipeline,
  deriveGrainSeedU32,
  grainTemporalSeed,
} from "@bridges/webgpu-finish";
import { CoronaLoopDemo } from "./CoronaLoopDemo";
import {
  drawCoronaLoopSourceFrame,
  FINISH_RENDER_SIZE,
  FINISH_STREAM_NAMESPACE,
} from "./finish/corona-loop-source";
import {
  CORONA_FINISH_PARAMS,
  CORONA_FPS,
  CORONA_POSTER_FRAME,
  CORONA_PERIOD_FRAMES,
} from "./verbs/corona-loop.params";

export function CoronaLoopFinishDemo() {
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
          params: CORONA_FINISH_PARAMS,
        });

        const renderFrame = (frame: number) => {
          drawCoronaLoopSourceFrame(c2d, size, frame);
          device.queue.copyExternalImageToTexture(
            { source },
            { texture: sourceTexture },
            { width: size, height: size },
          );
          const seedU32 = deriveGrainSeedU32(
            grainTemporalSeed(
              FINISH_STREAM_NAMESPACE,
              CORONA_FINISH_PARAMS.grainSeed,
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
          const frame =
            Math.floor(((now - start) / 1000) * CORONA_FPS) %
            CORONA_PERIOD_FRAMES;
          if (frame === lastFrame) return;
          lastFrame = frame;
          renderFrame(frame);
        };

        const startOrStop = () => {
          cancelAnimationFrame(raf);
          start = null;
          lastFrame = -1;
          if (reduceQuery.matches) {
            renderFrame(CORONA_POSTER_FRAME);
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

  if (fallback) return <CoronaLoopDemo />;

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
