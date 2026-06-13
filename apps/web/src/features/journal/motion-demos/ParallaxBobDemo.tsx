"use client";

// ParallaxBobDemo — live, in-article render of the parallax-bob motion study.
// Drives the cell's exact schedule (vendored shared-eased-bob + the measured
// amplitude ladder) on a requestAnimationFrame loop and paints the realization in
// SVG: seven fixed-position circles that share ONE eased vertical bob and differ
// only in how far each one travels. All filled with the page's substrate ink
// (currentColor) so the motion adopts the site's light/dark theme. No WebGPU,
// no Remotion.

import { useEffect, useState } from "react";
import {
  parallaxDotsAt,
  PARALLAX_VIEWBOX,
  PARALLAX_PERIOD_FRAMES,
  PARALLAX_FPS,
  PARALLAX_POSTER_FRAME,
} from "./verbs/parallax-bob.params";
import type { ParallaxDotState } from "./verbs/parallax-bob";

export function ParallaxBobDemo() {
  const [dots, setDots] = useState<ParallaxDotState[]>(() =>
    parallaxDotsAt(PARALLAX_POSTER_FRAME),
  );

  useEffect(() => {
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let raf = 0;
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsedS = (now - start) / 1000;
      const frame = (elapsedS * PARALLAX_FPS) % PARALLAX_PERIOD_FRAMES;
      setDots(parallaxDotsAt(frame));
      raf = requestAnimationFrame(tick);
    };

    const startOrStop = () => {
      cancelAnimationFrame(raf);
      start = null;
      if (reduceQuery.matches) {
        setDots(parallaxDotsAt(PARALLAX_POSTER_FRAME));
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

  const v = PARALLAX_VIEWBOX;

  return (
    <svg
      viewBox={`0 0 ${v} ${v}`}
      className="h-auto w-full max-w-[320px]"
      aria-hidden="true"
      focusable="false"
    >
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill="currentColor" />
      ))}
    </svg>
  );
}
