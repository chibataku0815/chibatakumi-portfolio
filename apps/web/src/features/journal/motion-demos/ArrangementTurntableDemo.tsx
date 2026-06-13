"use client";

// ArrangementTurntableDemo — live, in-article render of the arrangement-turntable
// motion study. Drives the cell's exact schedule (vendored two-arrangement
// transit) on a requestAnimationFrame loop and paints the realization in SVG:
// nine fixed-identity dots transiting between a rest grid and a ring, with the
// central pile, return swirl and seat permutation all emergent. All filled with
// the page's substrate ink (currentColor) so the motion adopts the site's
// light/dark theme. No WebGPU, no Remotion.

import { useEffect, useState } from "react";
import {
  arrangementDotsAt,
  ARRANGEMENT_VIEWBOX,
  ARRANGEMENT_PERIOD_FRAMES,
  ARRANGEMENT_FPS,
  ARRANGEMENT_POSTER_FRAME,
} from "./verbs/arrangement-turntable.params";
import type { ArrangementDotState } from "./verbs/arrangement-turntable.params";

export function ArrangementTurntableDemo() {
  const [dots, setDots] = useState<ArrangementDotState[]>(() =>
    arrangementDotsAt(ARRANGEMENT_POSTER_FRAME),
  );

  useEffect(() => {
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let raf = 0;
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsedS = (now - start) / 1000;
      const frame = (elapsedS * ARRANGEMENT_FPS) % ARRANGEMENT_PERIOD_FRAMES;
      setDots(arrangementDotsAt(frame));
      raf = requestAnimationFrame(tick);
    };

    const startOrStop = () => {
      cancelAnimationFrame(raf);
      start = null;
      if (reduceQuery.matches) {
        setDots(arrangementDotsAt(ARRANGEMENT_POSTER_FRAME));
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

  const v = ARRANGEMENT_VIEWBOX;

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
