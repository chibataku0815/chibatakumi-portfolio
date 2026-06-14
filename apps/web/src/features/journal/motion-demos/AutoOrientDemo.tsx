"use client";

// AutoOrientDemo — live, in-article render of the ring-orbit-3d (auto-orient)
// motion study. Drives the cell's exact schedule (eight dots on a tilted 3D
// ring, parent + child dials, one perspective factor) on a requestAnimationFrame
// loop and paints the realization in SVG: eight depth-sorted <circle>s, the near
// ones larger and drawn on top. Filled with the page's substrate ink
// (currentColor); the lighter of the two tones is dimmed so the alternation
// reads in any theme. No WebGPU, no Remotion.

import { useEffect, useState } from "react";
import {
  ringOrbitDotsAt,
  RING_ORBIT_VIEWBOX,
  RING_ORBIT_PERIOD_FRAMES,
  RING_ORBIT_FPS,
  RING_ORBIT_POSTER_FRAME,
} from "./verbs/ring-orbit-3d.params";
import type { RingOrbitDot } from "./verbs/ring-orbit-3d.params";

// The two tones collapse to one ink (currentColor); the lighter cohort is dimmed
// so the alternation still reads. The finish demo carries the real two-colour
// light palette.
const LIGHT_OPACITY = 0.5;

export function AutoOrientDemo() {
  const [dots, setDots] = useState<RingOrbitDot[]>(() =>
    ringOrbitDotsAt(RING_ORBIT_POSTER_FRAME),
  );

  useEffect(() => {
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let raf = 0;
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsedS = (now - start) / 1000;
      const frame = (elapsedS * RING_ORBIT_FPS) % RING_ORBIT_PERIOD_FRAMES;
      setDots(ringOrbitDotsAt(frame));
      raf = requestAnimationFrame(tick);
    };

    const startOrStop = () => {
      cancelAnimationFrame(raf);
      start = null;
      if (reduceQuery.matches) {
        setDots(ringOrbitDotsAt(RING_ORBIT_POSTER_FRAME));
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

  const v = RING_ORBIT_VIEWBOX;

  return (
    <svg
      viewBox={`0 0 ${v} ${v}`}
      className="h-auto w-full max-w-[320px]"
      aria-hidden="true"
      focusable="false"
    >
      {dots.map((d) => (
        <circle
          key={d.key}
          cx={d.cx}
          cy={d.cy}
          r={d.r}
          fill="currentColor"
          opacity={d.dark ? 1 : LIGHT_OPACITY}
        />
      ))}
    </svg>
  );
}
