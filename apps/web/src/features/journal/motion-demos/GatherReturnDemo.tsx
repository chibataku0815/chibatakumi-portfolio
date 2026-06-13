"use client";

// GatherReturnDemo — live, in-article render of the gather-return motion
// study. Drives the cell's exact schedule (vendored timing clip + transcribed
// drawer assembly) on a requestAnimationFrame loop and paints the cell's
// realization in SVG: one center disc plus eight ring circles, all filled
// with the page's substrate ink (currentColor) so the motion adopts the
// site's light/dark theme. Single fill is load-bearing: merge/split topology
// exists only as the union of same-color circles. No WebGPU, no Remotion.

import { useEffect, useState } from "react";
import {
  gatherReturnSchedule,
  type GatherReturnSceneState,
  GATHER_RETURN_VIEWBOX,
  GATHER_RETURN_PERIOD_FRAMES,
  GATHER_RETURN_FPS,
  GATHER_RETURN_POSTER_FRAME,
} from "./verbs/gather-return.params";

export function GatherReturnDemo() {
  const [state, setState] = useState<GatherReturnSceneState>(() =>
    gatherReturnSchedule(GATHER_RETURN_POSTER_FRAME),
  );

  useEffect(() => {
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let raf = 0;
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsedS = (now - start) / 1000;
      const frame =
        (elapsedS * GATHER_RETURN_FPS) % GATHER_RETURN_PERIOD_FRAMES;
      setState(gatherReturnSchedule(frame));
      raf = requestAnimationFrame(tick);
    };

    const startOrStop = () => {
      cancelAnimationFrame(raf);
      start = null;
      if (reduceQuery.matches) {
        setState(gatherReturnSchedule(GATHER_RETURN_POSTER_FRAME));
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

  const v = GATHER_RETURN_VIEWBOX;

  return (
    <svg
      viewBox={`0 0 ${v} ${v}`}
      className="h-auto w-full max-w-[320px]"
      aria-hidden="true"
      focusable="false"
    >
      {state.core ? (
        <circle
          cx={state.core.cx}
          cy={state.core.cy}
          r={state.core.r}
          fill="currentColor"
        />
      ) : null}
      {state.dots.map((dot, i) => (
        <circle key={i} cx={dot.cx} cy={dot.cy} r={dot.r} fill="currentColor" />
      ))}
    </svg>
  );
}
