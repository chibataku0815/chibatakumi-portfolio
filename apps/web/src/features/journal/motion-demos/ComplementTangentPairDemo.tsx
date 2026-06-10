"use client";

// ComplementTangentPairDemo — live, in-article render of the
// complement-tangent-pair motion study. Drives the vendored pure schedule
// (frame in → two kissing circles out) on a requestAnimationFrame loop and
// paints both circles as SVG <circle> in the page's substrate ink
// (currentColor), so the motion adopts the site's light/dark theme. Both
// circles are one family — a single ink, like the reference cell's single
// fill. No WebGPU, no Remotion — this is the framework-independent verb
// running directly in the browser.

import { useEffect, useState } from "react";
import type { ComplementTangentPairState } from "./verbs/complement-tangent-pair";
import {
  complementTangentPairSchedule,
  COMPLEMENT_TANGENT_VIEWBOX,
  COMPLEMENT_TANGENT_PERIOD_FRAMES,
  COMPLEMENT_TANGENT_FPS,
  COMPLEMENT_TANGENT_REST_FRAME,
} from "./verbs/complement-tangent-pair.params";

const frameState = (frame: number): ComplementTangentPairState =>
  complementTangentPairSchedule(frame);

export function ComplementTangentPairDemo() {
  const [state, setState] = useState<ComplementTangentPairState>(() =>
    frameState(COMPLEMENT_TANGENT_REST_FRAME),
  );

  useEffect(() => {
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let raf = 0;
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsedS = (now - start) / 1000;
      const frame =
        (elapsedS * COMPLEMENT_TANGENT_FPS) % COMPLEMENT_TANGENT_PERIOD_FRAMES;
      setState(frameState(frame));
      raf = requestAnimationFrame(tick);
    };

    const startOrStop = () => {
      cancelAnimationFrame(raf);
      start = null;
      if (reduceQuery.matches) {
        setState(frameState(COMPLEMENT_TANGENT_REST_FRAME));
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

  const v = COMPLEMENT_TANGENT_VIEWBOX;

  return (
    <svg
      viewBox={`0 0 ${v} ${v}`}
      className="h-auto w-full max-w-[320px]"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx={state.tl.cx}
        cy={state.tl.cy}
        r={state.tl.r}
        fill="currentColor"
      />
      <circle
        cx={state.br.cx}
        cy={state.br.cy}
        r={state.br.r}
        fill="currentColor"
      />
    </svg>
  );
}
