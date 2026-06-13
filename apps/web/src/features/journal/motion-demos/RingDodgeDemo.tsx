"use client";

// RingDodgeDemo — live, in-article render of the ring-dodge (interference) motion
// study. Drives the cell's exact schedule (one linear orbiter + 8 ring dots on a
// blind 11-frame pulse clock + two inverse-square dodge fields) on a
// requestAnimationFrame loop and paints the realization in SVG: 9 circles, the
// ring dots popping out as the orbiter passes. All filled with the page's
// substrate ink (currentColor) so the motion adopts the site's light/dark theme.
// No WebGPU, no Remotion.

import { useEffect, useState } from "react";
import {
  ringDodgeDotsAt,
  RING_DODGE_VIEWBOX,
  RING_DODGE_PERIOD_FRAMES,
  RING_DODGE_FPS,
  RING_DODGE_POSTER_FRAME,
} from "./verbs/ring-dodge.params";
import type { RingDodgeCircle } from "./verbs/ring-dodge.params";

export function RingDodgeDemo() {
  const [dots, setDots] = useState<RingDodgeCircle[]>(() =>
    ringDodgeDotsAt(RING_DODGE_POSTER_FRAME),
  );

  useEffect(() => {
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let raf = 0;
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsedS = (now - start) / 1000;
      const frame = (elapsedS * RING_DODGE_FPS) % RING_DODGE_PERIOD_FRAMES;
      setDots(ringDodgeDotsAt(frame));
      raf = requestAnimationFrame(tick);
    };

    const startOrStop = () => {
      cancelAnimationFrame(raf);
      start = null;
      if (reduceQuery.matches) {
        setDots(ringDodgeDotsAt(RING_DODGE_POSTER_FRAME));
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

  const v = RING_DODGE_VIEWBOX;

  return (
    <svg
      viewBox={`0 0 ${v} ${v}`}
      className="h-auto w-full max-w-[320px]"
      aria-hidden="true"
      focusable="false"
    >
      {dots.map((d) => (
        <circle key={d.key} cx={d.cx} cy={d.cy} r={d.r} fill="currentColor" />
      ))}
    </svg>
  );
}
