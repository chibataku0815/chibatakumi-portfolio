"use client";

// TangencyCoupledDriveDemo — live, in-article render of the
// tangency-coupled-drive motion study. Drives the vendored pure schedule
// (frame in → driver angle + follower positions out) on a
// requestAnimationFrame loop and paints the three squares as SVG <rect>s in
// the page's substrate ink (currentColor), so the motion adopts the site's
// light/dark theme. The driver rotates about its own center via an SVG
// transform; the followers translate on the x axis only — exactly the split
// the verb prescribes (schedule = numbers, realization = renderer). No
// WebGPU, no Remotion.

import { useEffect, useState } from "react";
import type { TangencyCoupledDriveState } from "./verbs/tangency-coupled-drive";
import {
  tangencyCoupledDriveSchedule,
  TANGENCY_DRIVE_VIEWBOX,
  TANGENCY_DRIVE_PERIOD_FRAMES,
  TANGENCY_DRIVE_FPS,
  TANGENCY_DRIVE_DIAMOND_FRAME,
} from "./verbs/tangency-coupled-drive.params";

const frameState = (frame: number): TangencyCoupledDriveState =>
  tangencyCoupledDriveSchedule(frame);

export function TangencyCoupledDriveDemo() {
  const [state, setState] = useState<TangencyCoupledDriveState>(() =>
    frameState(TANGENCY_DRIVE_DIAMOND_FRAME),
  );

  useEffect(() => {
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let raf = 0;
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsedS = (now - start) / 1000;
      const frame =
        (elapsedS * TANGENCY_DRIVE_FPS) % TANGENCY_DRIVE_PERIOD_FRAMES;
      setState(frameState(frame));
      raf = requestAnimationFrame(tick);
    };

    const startOrStop = () => {
      cancelAnimationFrame(raf);
      start = null;
      if (reduceQuery.matches) {
        setState(frameState(TANGENCY_DRIVE_DIAMOND_FRAME));
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

  const v = TANGENCY_DRIVE_VIEWBOX;
  const { center, neighbors } = state;
  const half = center.side / 2;

  return (
    <svg
      viewBox={`0 0 ${v} ${v}`}
      className="h-auto w-full max-w-[320px]"
      aria-hidden="true"
      focusable="false"
    >
      {neighbors.map((n, index) => (
        <rect
          key={index}
          x={n.cx - half}
          y={n.cy - half}
          width={n.side}
          height={n.side}
          fill="currentColor"
        />
      ))}
      <rect
        x={center.cx - half}
        y={center.cy - half}
        width={center.side}
        height={center.side}
        fill="currentColor"
        transform={`rotate(${center.thetaDeg} ${center.cx} ${center.cy})`}
      />
    </svg>
  );
}
