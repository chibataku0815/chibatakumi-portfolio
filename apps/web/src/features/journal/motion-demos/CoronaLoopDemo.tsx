"use client";

// CoronaLoopDemo — the corona-loop schedule rendered live on canvas2d with no
// finish (the degradation target when WebGPU is unavailable). The lobe orbits
// the eclipse void; dots stay put and only re-shade. prefers-reduced-motion
// holds the loop-midpoint poster frame.

import { useEffect, useRef } from "react";
import {
  drawCoronaLoopSourceFrame,
  FINISH_RENDER_SIZE,
} from "./finish/corona-loop-source";
import {
  CORONA_FPS,
  CORONA_PERIOD_FRAMES,
  CORONA_POSTER_FRAME,
} from "./verbs/corona-loop.params";

export function CoronaLoopDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let start: number | null = null;
    let lastFrame = -1;
    let visible = true;
    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
    });
    io.observe(canvas);

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible) {
        start = null;
        lastFrame = -1;
        return;
      }
      if (start === null) start = now;
      const frame =
        Math.floor(((now - start) / 1000) * CORONA_FPS) % CORONA_PERIOD_FRAMES;
      if (frame === lastFrame) return;
      lastFrame = frame;
      drawCoronaLoopSourceFrame(ctx, FINISH_RENDER_SIZE, frame);
    };

    const startOrStop = () => {
      cancelAnimationFrame(raf);
      start = null;
      lastFrame = -1;
      if (reduceQuery.matches) {
        drawCoronaLoopSourceFrame(ctx, FINISH_RENDER_SIZE, CORONA_POSTER_FRAME);
      } else {
        raf = requestAnimationFrame(tick);
      }
    };

    startOrStop();
    reduceQuery.addEventListener("change", startOrStop);

    return () => {
      cancelAnimationFrame(raf);
      reduceQuery.removeEventListener("change", startOrStop);
      io.disconnect();
    };
  }, []);

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
