"use client";

// DifferenceDemo — live, in-article render of the difference (差) motion study.
// Drives the cell's exact schedule (six equal circles sharing four scalar
// channels on one palindrome clock) on a requestAnimationFrame loop and paints
// the cell's realization in SVG: the four quadrant circles as ONE compound path
// with fill-rule evenodd (the symmetric-difference look), and the two axial
// circles as their union outline (a peanut), stroked at the band width. Both
// use the page's substrate ink (currentColor) so the motion adopts the site's
// light/dark theme. No WebGPU, no Remotion.

import { useEffect, useState } from "react";
import {
  differenceFigureAt,
  DIFFERENCE_VIEWBOX,
  DIFFERENCE_PERIOD_FRAMES,
  DIFFERENCE_FPS,
  DIFFERENCE_POSTER_FRAME,
} from "./verbs/quadrant-sign-excursion.params";
import type { DifferenceFigure } from "./verbs/quadrant-sign-excursion.params";

export function DifferenceDemo() {
  const [figure, setFigure] = useState<DifferenceFigure>(() =>
    differenceFigureAt(DIFFERENCE_POSTER_FRAME),
  );

  useEffect(() => {
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let raf = 0;
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsedS = (now - start) / 1000;
      const frame = (elapsedS * DIFFERENCE_FPS) % DIFFERENCE_PERIOD_FRAMES;
      setFigure(differenceFigureAt(frame));
      raf = requestAnimationFrame(tick);
    };

    const startOrStop = () => {
      cancelAnimationFrame(raf);
      start = null;
      if (reduceQuery.matches) {
        setFigure(differenceFigureAt(DIFFERENCE_POSTER_FRAME));
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

  const v = DIFFERENCE_VIEWBOX;

  return (
    <svg
      viewBox={`0 0 ${v} ${v}`}
      className="h-auto w-full max-w-[320px]"
      aria-hidden="true"
      focusable="false"
    >
      <path d={figure.fillPath} fill="currentColor" fillRule="evenodd" />
      <path
        d={figure.peanutPath}
        fill="none"
        stroke="currentColor"
        strokeWidth={figure.bandWidth}
      />
    </svg>
  );
}
