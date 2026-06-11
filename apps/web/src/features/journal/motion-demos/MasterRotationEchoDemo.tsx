"use client";

// MasterRotationEchoDemo — live, in-article render of the master-rotation-echo
// motion study. Drives the vendored pure schedule (frame in → per-copy angles
// + opacities out) on a requestAnimationFrame loop and paints the antipodal
// dot pair with its echo copies as SVG <circle>s in the page's substrate ink
// (currentColor), so the motion adopts the site's light/dark theme. Copies
// draw deepest-first so the lead dot lands on top — exactly the origin cell's
// draw order. The origin cell ships shutterFrames = 0, so every motion-blur
// capsule degenerates to a point and a plain circle is the exact realization
// (the arc-capsule branch the lab cell keeps for generality never fires).
// No WebGPU, no Remotion.

import { useEffect, useState } from "react";
import type { MasterRotationEchoState } from "./verbs/master-rotation-echo";
import {
  masterRotationEchoSchedule,
  MASTER_ROTATION_ECHO_VIEWBOX,
  MASTER_ROTATION_ECHO_PERIOD_FRAMES,
  MASTER_ROTATION_ECHO_FPS,
  MASTER_ROTATION_ECHO_FAST_FRAME,
} from "./verbs/master-rotation-echo.params";

const frameState = (frame: number): MasterRotationEchoState =>
  masterRotationEchoSchedule(frame);

const RAD_PER_DEG = Math.PI / 180;

export function MasterRotationEchoDemo() {
  const [state, setState] = useState<MasterRotationEchoState>(() =>
    frameState(MASTER_ROTATION_ECHO_FAST_FRAME),
  );

  useEffect(() => {
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let raf = 0;
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsedS = (now - start) / 1000;
      const frame =
        (elapsedS * MASTER_ROTATION_ECHO_FPS) %
        MASTER_ROTATION_ECHO_PERIOD_FRAMES;
      setState(frameState(frame));
      raf = requestAnimationFrame(tick);
    };

    const startOrStop = () => {
      cancelAnimationFrame(raf);
      start = null;
      if (reduceQuery.matches) {
        setState(frameState(MASTER_ROTATION_ECHO_FAST_FRAME));
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

  const v = MASTER_ROTATION_ECHO_VIEWBOX;
  const { centerX, centerY, orbitRadius, dotRadius, arms } = state;

  return (
    <svg
      viewBox={`0 0 ${v} ${v}`}
      className="h-auto w-full max-w-[320px]"
      aria-hidden="true"
      focusable="false"
    >
      {arms.map((copies, armIndex) => (
        <g key={armIndex}>
          {[...copies].reverse().map((copy, i) => {
            const a = copy.angleDeg * RAD_PER_DEG;
            return (
              <circle
                key={i}
                cx={centerX + orbitRadius * Math.cos(a)}
                cy={centerY + orbitRadius * Math.sin(a)}
                r={dotRadius}
                fill="currentColor"
                fillOpacity={copy.opacity}
              />
            );
          })}
        </g>
      ))}
    </svg>
  );
}
