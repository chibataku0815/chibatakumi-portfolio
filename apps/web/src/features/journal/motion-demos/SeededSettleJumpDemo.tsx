"use client";

// SeededSettleJumpDemo — live, in-article render of the seeded-settle-jump motion
// study. Drives the cell's exact schedule (vendored jump-and-settle profile +
// staggered replay) on a requestAnimationFrame loop and paints the realization in
// SVG: five capsules running ONE jump-and-settle profile at staggered time offsets,
// each stretching with its own speed and flicking off a landing satellite. All
// filled with the page's substrate ink (currentColor) so the motion adopts the
// site's light/dark theme. No WebGPU, no Remotion.

import { useEffect, useState } from "react";
import {
  seededSettleDotsAt,
  SEEDED_SETTLE_VIEWBOX,
  SEEDED_SETTLE_PERIOD_FRAMES,
  SEEDED_SETTLE_FPS,
  SEEDED_SETTLE_POSTER_FRAME,
} from "./verbs/seeded-settle-jump.params";
import type { SeededSettleDotState } from "./verbs/seeded-settle-jump.params";

export function SeededSettleJumpDemo() {
  const [dots, setDots] = useState<SeededSettleDotState[]>(() =>
    seededSettleDotsAt(SEEDED_SETTLE_POSTER_FRAME),
  );

  useEffect(() => {
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let raf = 0;
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsedS = (now - start) / 1000;
      const frame = (elapsedS * SEEDED_SETTLE_FPS) % SEEDED_SETTLE_PERIOD_FRAMES;
      setDots(seededSettleDotsAt(frame));
      raf = requestAnimationFrame(tick);
    };

    const startOrStop = () => {
      cancelAnimationFrame(raf);
      start = null;
      if (reduceQuery.matches) {
        setDots(seededSettleDotsAt(SEEDED_SETTLE_POSTER_FRAME));
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

  const v = SEEDED_SETTLE_VIEWBOX;

  return (
    <svg
      viewBox={`0 0 ${v} ${v}`}
      className="h-auto w-full max-w-[320px]"
      aria-hidden="true"
      focusable="false"
    >
      {dots.map((d, i) => {
        const corner = Math.min(d.width, d.height) / 2;
        return (
          <g key={i}>
            <rect
              x={d.cx - d.width / 2}
              y={d.cy - d.height / 2}
              width={d.width}
              height={d.height}
              rx={corner}
              ry={corner}
              fill="currentColor"
            />
            {d.satellite ? (
              <circle
                cx={d.satellite.cx}
                cy={d.satellite.cy}
                r={d.satellite.r}
                fill="currentColor"
              />
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
