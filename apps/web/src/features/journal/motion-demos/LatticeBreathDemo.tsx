"use client";

// LatticeBreathDemo — live, in-article render of the lattice-breath motion
// study. Drives the vendored pure schedule (numbers in → dot positions out) on
// a requestAnimationFrame loop and paints each dot as an SVG <circle> in the
// page's substrate ink (currentColor), so the motion adopts the site's
// light/dark theme. No WebGPU, no Remotion — this is the framework-independent
// verb running directly in the browser.

import { useEffect, useState } from "react";
import type { LatticeBreathState } from "./verbs/lattice-breath";
import {
  latticeBreathSchedule,
  LATTICE_BREATH_VIEWBOX,
  LATTICE_BREATH_PERIOD_FRAMES,
  LATTICE_BREATH_FPS,
  LATTICE_BREATH_PEAK_FRAME,
} from "./verbs/lattice-breath.params";

// edge family reads as the lighter cohort; core/arm/inner/center are full ink.
const EDGE_OPACITY = 0.42;

const frameState = (frame: number): LatticeBreathState =>
  latticeBreathSchedule(frame);

export function LatticeBreathDemo() {
  const [state, setState] = useState<LatticeBreathState>(() =>
    frameState(LATTICE_BREATH_PEAK_FRAME),
  );

  useEffect(() => {
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let raf = 0;
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsedS = (now - start) / 1000;
      const frame =
        (elapsedS * LATTICE_BREATH_FPS) % LATTICE_BREATH_PERIOD_FRAMES;
      setState(frameState(frame));
      raf = requestAnimationFrame(tick);
    };

    const startOrStop = () => {
      cancelAnimationFrame(raf);
      start = null;
      if (reduceQuery.matches) {
        setState(frameState(LATTICE_BREATH_PEAK_FRAME));
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

  const v = LATTICE_BREATH_VIEWBOX;

  return (
    <svg
      viewBox={`0 0 ${v} ${v}`}
      className="h-auto w-full max-w-[320px]"
      aria-hidden="true"
      focusable="false"
    >
      {state.dots.map((dot, index) => (
        <circle
          key={index}
          cx={dot.cx}
          cy={dot.cy}
          r={dot.r}
          fill="currentColor"
          opacity={dot.role === "edge" ? EDGE_OPACITY : 1}
        />
      ))}
    </svg>
  );
}
