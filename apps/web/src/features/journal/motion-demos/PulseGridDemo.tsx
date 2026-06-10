"use client";

// PulseGridDemo — live, in-article render of the pulse-grid motion study.
// Drives the vendored pure schedule (frame in → nine centres + radii out) on a
// requestAnimationFrame loop and paints each dot as an SVG <circle> in the
// page's substrate ink (currentColor), so the motion adopts the site's
// light/dark theme. All nine dots are one family — no per-role tinting. No
// WebGPU, no Remotion — this is the framework-independent verb running
// directly in the browser.

import { useEffect, useState } from "react";
import type { PulseGridSample } from "./verbs/pulse-grid";
import {
  pulseGridSchedule,
  PULSE_GRID_VIEWBOX,
  PULSE_GRID_PERIOD_FRAMES,
  PULSE_GRID_FPS,
  PULSE_GRID_SPREAD_FRAME,
} from "./verbs/pulse-grid.params";

const frameState = (frame: number): PulseGridSample[] =>
  pulseGridSchedule(frame);

export function PulseGridDemo() {
  const [dots, setDots] = useState<PulseGridSample[]>(() =>
    frameState(PULSE_GRID_SPREAD_FRAME),
  );

  useEffect(() => {
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let raf = 0;
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsedS = (now - start) / 1000;
      const frame = (elapsedS * PULSE_GRID_FPS) % PULSE_GRID_PERIOD_FRAMES;
      setDots(frameState(frame));
      raf = requestAnimationFrame(tick);
    };

    const startOrStop = () => {
      cancelAnimationFrame(raf);
      start = null;
      if (reduceQuery.matches) {
        setDots(frameState(PULSE_GRID_SPREAD_FRAME));
      } else {
        raf = requestAnimationFrame(tick);
      }
    };

    startOrStop();
    reduceQuery.addEventListener("change", startOrStop);
    return () => {
      cancelAnimationFrame(raf);
      reduceQuery.removeEventListener("change", startOrStop);
    };
  }, []);

  const v = PULSE_GRID_VIEWBOX;

  return (
    <svg
      viewBox={`0 0 ${v} ${v}`}
      className="h-auto w-full max-w-[320px]"
      aria-hidden="true"
      focusable="false"
    >
      {dots.map((dot) => (
        <circle
          key={dot.rank}
          cx={dot.cx}
          cy={dot.cy}
          r={dot.r}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}
