"use client";

// SharedHoldPulseDemo — live, in-article render of the shared-hold-pulse
// motion study. Drives the vendored pure schedule (frame in → per-element
// cx/cy/width/height/rotation out) on a requestAnimationFrame loop and paints
// the four round-cap pills + center rounded square as SVG <rect>s in the
// page's substrate ink (currentColor), so the motion adopts the site's
// light/dark theme. The center square's spin uses the SVG rotate(angle cx cy)
// transform about its own center — the same realization as the origin cell
// (which additionally quantizes the transform string to 1e-4; visually
// identical). No WebGPU, no Remotion.

import { useEffect, useState } from "react";
import type { SharedHoldPulseElementState } from "./verbs/shared-hold-pulse";
import {
  sharedHoldPulseSchedule,
  SHARED_HOLD_PULSE_VIEWBOX,
  SHARED_HOLD_PULSE_PERIOD_FRAMES,
  SHARED_HOLD_PULSE_FPS,
  SHARED_HOLD_PULSE_HOLD_FRAME,
} from "./verbs/shared-hold-pulse.params";

const frameState = (frame: number): SharedHoldPulseElementState[] =>
  sharedHoldPulseSchedule(frame);

export function SharedHoldPulseDemo() {
  const [elements, setElements] = useState<SharedHoldPulseElementState[]>(() =>
    frameState(SHARED_HOLD_PULSE_HOLD_FRAME),
  );

  useEffect(() => {
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let raf = 0;
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsedS = (now - start) / 1000;
      const frame =
        (elapsedS * SHARED_HOLD_PULSE_FPS) % SHARED_HOLD_PULSE_PERIOD_FRAMES;
      setElements(frameState(frame));
      raf = requestAnimationFrame(tick);
    };

    const startOrStop = () => {
      cancelAnimationFrame(raf);
      start = null;
      if (reduceQuery.matches) {
        setElements(frameState(SHARED_HOLD_PULSE_HOLD_FRAME));
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

  const v = SHARED_HOLD_PULSE_VIEWBOX;

  return (
    <svg
      viewBox={`0 0 ${v} ${v}`}
      className="h-auto w-full max-w-[320px]"
      aria-hidden="true"
      focusable="false"
    >
      {elements.map((e, i) => (
        <rect
          key={i}
          x={e.cx - e.width / 2}
          y={e.cy - e.height / 2}
          width={e.width}
          height={e.height}
          rx={e.cornerRadius}
          ry={e.cornerRadius}
          fill="currentColor"
          transform={
            e.rotationDeg !== 0
              ? `rotate(${e.rotationDeg} ${e.cx} ${e.cy})`
              : undefined
          }
        />
      ))}
    </svg>
  );
}
