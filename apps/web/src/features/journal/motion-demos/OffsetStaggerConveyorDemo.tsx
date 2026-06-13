"use client";

// OffsetStaggerConveyorDemo — live, in-article render of the offset motion study.
// Drives the cell's exact schedule (one dot clip walking a slot-key ladder,
// duplicated at time offsets) on a requestAnimationFrame loop and paints the
// realization in SVG: circles on one horizontal baseline, sizes walking the
// ladder, the wave reading as the same clip replayed at staggered offsets. All
// filled with the page's substrate ink (currentColor) so the motion adopts the
// site's light/dark theme. No WebGPU, no Remotion.

import { useEffect, useState } from "react";
import {
  offsetDotsAt,
  OFFSET_VIEWBOX,
  OFFSET_PERIOD_FRAMES,
  OFFSET_FPS,
  OFFSET_POSTER_FRAME,
} from "./verbs/offset-stagger-conveyor.params";
import type { OffsetDotState } from "./verbs/offset-stagger-conveyor.params";

export function OffsetStaggerConveyorDemo() {
  const [dots, setDots] = useState<OffsetDotState[]>(() =>
    offsetDotsAt(OFFSET_POSTER_FRAME),
  );

  useEffect(() => {
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let raf = 0;
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsedS = (now - start) / 1000;
      const frame = (elapsedS * OFFSET_FPS) % OFFSET_PERIOD_FRAMES;
      setDots(offsetDotsAt(frame));
      raf = requestAnimationFrame(tick);
    };

    const startOrStop = () => {
      cancelAnimationFrame(raf);
      start = null;
      if (reduceQuery.matches) {
        setDots(offsetDotsAt(OFFSET_POSTER_FRAME));
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

  const v = OFFSET_VIEWBOX;

  return (
    <svg
      viewBox={`0 0 ${v} ${v}`}
      className="h-auto w-full max-w-[320px]"
      aria-hidden="true"
      focusable="false"
    >
      {dots.map((d) => (
        <circle key={d.slot} cx={d.cx} cy={d.cy} r={d.r} fill="currentColor" />
      ))}
    </svg>
  );
}
