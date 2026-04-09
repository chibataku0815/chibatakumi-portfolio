import { Easing } from "remotion";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const aeEase = Easing.bezier(0.33, 0, 0.18, 1);

type TrimEasing = "linear" | "ae-like";

export type TrimWindow = {
  visible: boolean;
  start: number;
  end: number;
};

export const getTrimWindow = ({
  frame,
  drawDurationFrames,
  eraseDelayFrames,
  eraseDurationFrames,
  easing = "linear",
}: {
  frame: number;
  drawDurationFrames: number;
  eraseDelayFrames: number;
  eraseDurationFrames: number;
  easing?: TrimEasing;
}): TrimWindow => {
  if (frame < 0) {
    return {
      visible: false,
      start: 0,
      end: 0,
    };
  }

  const ease = easing === "ae-like" ? aeEase : Easing.linear;
  const drawProgress = clamp01(frame / Math.max(1, drawDurationFrames));
  const eraseStartFrame = drawDurationFrames + eraseDelayFrames;
  const eraseProgress = clamp01(
    (frame - eraseStartFrame) / Math.max(1, eraseDurationFrames),
  );

  const end = ease(drawProgress);
  const start = ease(eraseProgress);

  return {
    visible: end - start > 0.001,
    start,
    end: Math.max(start, end),
  };
};
