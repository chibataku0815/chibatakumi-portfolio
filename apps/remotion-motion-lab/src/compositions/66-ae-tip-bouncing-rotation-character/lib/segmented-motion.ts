export type MotionEase = "linear" | "ae-in" | "ae-out" | "ae-in-out";

export type MotionStop = {
  frame: number;
  value: number;
  easing?: MotionEase;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const easingMap: Record<MotionEase, (value: number) => number> = {
  linear: (value) => value,
  "ae-in": (value) => value * value * value,
  "ae-out": (value) => 1 - Math.pow(1 - value, 3),
  "ae-in-out": (value) =>
    value < 0.5
      ? 4 * value * value * value
      : 1 - Math.pow(-2 * value + 2, 3) / 2,
};

export const getLoopFrame = (frame: number, loopFrames: number) => {
  const safeLoop = Math.max(1, loopFrames);
  return ((frame % safeLoop) + safeLoop) % safeLoop;
};

export const sampleMotionStops = ({
  frame,
  stops,
}: {
  frame: number;
  stops: readonly MotionStop[];
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
    const eased = easingMap[start.easing ?? "linear"](local);
    return start.value + (end.value - start.value) * eased;
  }

  return stops[stops.length - 1].value;
};
