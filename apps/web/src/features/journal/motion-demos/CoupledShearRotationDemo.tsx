"use client";

// CoupledShearRotationDemo — live, in-article render of the coupled-shear-
// rotation motion study. Drives the cell's exact schedule (vendored pure
// verb) on a requestAnimationFrame loop and paints the cell's realization in
// SVG: two half-disc paths (a point-symmetric pair), both filled with the
// page's substrate ink (currentColor) so the motion adopts the site's
// light/dark theme. Single fill is load-bearing: the loop seals because the
// recombined disc hides its quarter-turn. No WebGPU, no Remotion.

import { useEffect, useState } from "react";
import type { CoupledShearRotationState } from "./verbs/coupled-shear-rotation";
import {
  coupledShearSchedule,
  piecePath,
  COUPLED_SHEAR_VIEWBOX,
  COUPLED_SHEAR_PERIOD_FRAMES,
  COUPLED_SHEAR_FPS,
  COUPLED_SHEAR_POSTER_FRAME,
} from "./verbs/coupled-shear-rotation.params";

export function CoupledShearRotationDemo() {
  const [state, setState] = useState<CoupledShearRotationState>(() =>
    coupledShearSchedule(COUPLED_SHEAR_POSTER_FRAME),
  );

  useEffect(() => {
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let raf = 0;
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsedS = (now - start) / 1000;
      const frame =
        (elapsedS * COUPLED_SHEAR_FPS) % COUPLED_SHEAR_PERIOD_FRAMES;
      setState(coupledShearSchedule(frame));
      raf = requestAnimationFrame(tick);
    };

    const startOrStop = () => {
      cancelAnimationFrame(raf);
      start = null;
      if (reduceQuery.matches) {
        setState(coupledShearSchedule(COUPLED_SHEAR_POSTER_FRAME));
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

  const v = COUPLED_SHEAR_VIEWBOX;

  return (
    <svg
      viewBox={`0 0 ${v} ${v}`}
      className="h-auto w-full max-w-[320px]"
      aria-hidden="true"
      focusable="false"
    >
      {state.pieces.map((piece, i) => (
        <path key={i} d={piecePath(piece)} fill="currentColor" />
      ))}
    </svg>
  );
}
