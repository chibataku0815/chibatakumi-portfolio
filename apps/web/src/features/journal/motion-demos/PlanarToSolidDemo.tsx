"use client";

// PlanarToSolidDemo — live, in-article render of the disc-tumble-projection (2D→3D)
// motion study. Drives the cell's exact schedule (one thick bored disc tumbling
// 0→180→0° about a tilted axis with a scale pulse, the silhouette + bore produced
// by orthographic projection) on a requestAnimationFrame loop, and paints the
// body silhouette — bore punched out (even-odd) — in the page's substrate ink
// (currentColor). The three-tone wall/face shading is the finish demo's job; this
// plain fallback shows the honest footprint in one ink. No WebGPU, no Remotion.

import { useEffect, useState } from "react";
import {
  discTumbleFigureAt,
  DISC_TUMBLE_VIEWBOX,
  DISC_TUMBLE_PERIOD_FRAMES,
  DISC_TUMBLE_FPS,
  DISC_TUMBLE_POSTER_FRAME,
} from "./verbs/disc-tumble-projection.params";

export function PlanarToSolidDemo() {
  const [bodyPath, setBodyPath] = useState<string>(
    () => discTumbleFigureAt(DISC_TUMBLE_POSTER_FRAME).bodyPath,
  );

  useEffect(() => {
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let raf = 0;
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsedS = (now - start) / 1000;
      const frame = (elapsedS * DISC_TUMBLE_FPS) % DISC_TUMBLE_PERIOD_FRAMES;
      setBodyPath(discTumbleFigureAt(frame).bodyPath);
      raf = requestAnimationFrame(tick);
    };

    const startOrStop = () => {
      cancelAnimationFrame(raf);
      start = null;
      if (reduceQuery.matches) {
        setBodyPath(discTumbleFigureAt(DISC_TUMBLE_POSTER_FRAME).bodyPath);
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

  const v = DISC_TUMBLE_VIEWBOX;

  return (
    <svg
      viewBox={`0 0 ${v} ${v}`}
      className="h-auto w-full max-w-[320px]"
      aria-hidden="true"
      focusable="false"
    >
      <path d={bodyPath} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}
