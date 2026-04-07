import { Easing } from "remotion";

export type ProgressEase = "linear" | "ae-like";

export type ProgressStop = {
  frame: number;
  value: number;
  easing?: ProgressEase;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const easingMap: Record<ProgressEase, (value: number) => number> = {
  linear: (value) => value,
  "ae-like": Easing.bezier(0.22, 1, 0.36, 1),
};

export const getLoopFrame = (frame: number, loopLength: number) =>
  ((frame % loopLength) + loopLength) % loopLength;

export const getSegmentedProgress = ({
  frame,
  stops,
}: {
  frame: number;
  stops: readonly ProgressStop[];
}) => {
  if (stops.length === 0) {
    return 0;
  }

  if (frame <= stops[0].frame) {
    return stops[0].value;
  }

  for (let i = 0; i < stops.length - 1; i += 1) {
    const start = stops[i];
    const end = stops[i + 1];

    if (frame > end.frame) {
      continue;
    }

    const span = end.frame - start.frame;
    if (span <= 0 || start.value === end.value) {
      return end.value;
    }

    const local = clamp01((frame - start.frame) / span);
    const eased = easingMap[end.easing ?? "linear"](local);

    return start.value + (end.value - start.value) * eased;
  }

  return stops[stops.length - 1].value;
};

export const getBlinkOpacity = ({
  frame,
  stepFrames,
  pattern,
  high,
  low,
}: {
  frame: number;
  stepFrames: number;
  pattern: readonly number[];
  high: number;
  low: number;
}) => {
  if (pattern.length === 0) {
    return high;
  }

  const safeStep = Math.max(1, stepFrames);
  const patternIndex =
    Math.floor(Math.max(0, frame) / safeStep) % pattern.length;
  const normalized = clamp01(pattern[patternIndex]);

  return low + (high - low) * normalized;
};
