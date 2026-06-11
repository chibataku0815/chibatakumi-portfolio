"use client";

// WhipCrawlPathCycleDemo — live, in-article render of the whip-crawl-path-cycle
// motion study. Drives the cell's exact u(frame) (vendored pure schedule) on a
// requestAnimationFrame loop and paints the cell's realization in SVG: the
// infinity path stroked as a fixed-length dash window (pathLength=1 normalizes
// the dash fractions; the dash offset slides with u) plus the head dot — both
// in the page's substrate ink (currentColor), so the motion adopts the site's
// light/dark theme. The carrier is the user-approved round-lobe idealized
// infinity (same object as the cell's SNS post artifact — see params), NOT the
// measured 4-anchor path; the pacing is untouched. Single ink: the trim-window
// gap keeps the head readable without the cell's second colour. No WebGPU, no
// Remotion.

import { useEffect, useState } from "react";
import type { WhipCrawlCycleState } from "./verbs/whip-crawl-path-cycle";
import {
  whipCrawlDemoSchedule,
  whipCrawlDemoGeometry,
  WHIP_CRAWL_VIEWBOX,
  WHIP_CRAWL_PERIOD_FRAMES,
  WHIP_CRAWL_FPS,
  WHIP_CRAWL_POSTER_FRAME,
  DRAWN_FRACTION,
  PAINT_HEAD_LAG_FRACTION,
  STROKE_WIDTH,
  DOT_RADIUS,
} from "./verbs/whip-crawl-path-cycle.params";

const frameState = (frame: number): WhipCrawlCycleState =>
  whipCrawlDemoSchedule(frame);

export function WhipCrawlPathCycleDemo() {
  const [state, setState] = useState<WhipCrawlCycleState>(() =>
    frameState(WHIP_CRAWL_POSTER_FRAME),
  );

  useEffect(() => {
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let raf = 0;
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsedS = (now - start) / 1000;
      const frame =
        (elapsedS * WHIP_CRAWL_FPS) % WHIP_CRAWL_PERIOD_FRAMES;
      setState(frameState(frame));
      raf = requestAnimationFrame(tick);
    };

    const startOrStop = () => {
      cancelAnimationFrame(raf);
      start = null;
      if (reduceQuery.matches) {
        setState(frameState(WHIP_CRAWL_POSTER_FRAME));
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

  const v = WHIP_CRAWL_VIEWBOX;

  return (
    <svg
      viewBox={`0 0 ${v} ${v}`}
      className="h-auto w-full max-w-[320px]"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={whipCrawlDemoGeometry.d}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={`${DRAWN_FRACTION} ${1 - DRAWN_FRACTION}`}
        strokeDashoffset={DRAWN_FRACTION + PAINT_HEAD_LAG_FRACTION - state.u}
      />
      <circle cx={state.dotCx} cy={state.dotCy} r={DOT_RADIUS} fill="currentColor" />
    </svg>
  );
}
