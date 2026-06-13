"use client";

// VelocitySeededOvershootDemo — live, in-article render of the
// velocity-seeded-overshoot motion study. Drives the cell's exact schedule
// (vendored channel + transcribed glyph assembly) on a requestAnimationFrame
// loop and paints the cell's realization in SVG: a thick round-capped stem
// between two channel-driven endpoints, plus a lagging, overshooting dot, both
// filled with the page's substrate ink (currentColor) so the motion adopts the
// site's light/dark theme. The two eye-marks the schedule returns are a glyph
// DECORATION, not motion — deliberately not drawn, so the swing reads in a
// single ink. No WebGPU, no Remotion.

import { useEffect, useState } from "react";
import {
  vsoGlyphSchedule,
  type VsoGlyphState,
  VSO_VIEWBOX,
  VSO_PERIOD_FRAMES,
  VSO_FPS,
  VSO_POSTER_FRAME,
} from "./verbs/velocity-seeded-overshoot.params";

export function VelocitySeededOvershootDemo() {
  const [state, setState] = useState<VsoGlyphState>(() =>
    vsoGlyphSchedule(VSO_POSTER_FRAME),
  );

  useEffect(() => {
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let raf = 0;
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsedS = (now - start) / 1000;
      const frame = (elapsedS * VSO_FPS) % VSO_PERIOD_FRAMES;
      setState(vsoGlyphSchedule(frame));
      raf = requestAnimationFrame(tick);
    };

    const startOrStop = () => {
      cancelAnimationFrame(raf);
      start = null;
      if (reduceQuery.matches) {
        setState(vsoGlyphSchedule(VSO_POSTER_FRAME));
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

  const v = VSO_VIEWBOX;

  return (
    <svg
      viewBox={`0 0 ${v} ${v}`}
      className="h-auto w-full max-w-[320px]"
      aria-hidden="true"
      focusable="false"
    >
      {/* stem: round-capped stroke between the two channel-driven endpoints.
          The banana lean is stemTop.x − stemBot.x; a straight centerline is
          enough for a thick round-capped stroke. */}
      <line
        x1={state.stemBot.x}
        y1={state.stemBot.y}
        x2={state.stemTop.x}
        y2={state.stemTop.y}
        stroke="currentColor"
        strokeWidth={state.stemWidth}
        strokeLinecap="round"
      />
      {/* dot: the lagging, overshooting tittle (eye-marks intentionally omitted) */}
      <circle
        cx={state.dot.cx}
        cy={state.dot.cy}
        r={state.dot.r}
        fill="currentColor"
      />
    </svg>
  );
}
