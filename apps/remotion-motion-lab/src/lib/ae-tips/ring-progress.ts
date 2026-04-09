export type RingEasing = "linear" | "ae-like";

export type RingProgress = {
  readonly visible: boolean;
  readonly rawProgress: number;
  readonly motionProgress: number;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const easeAeLike = (value: number) => 1 - Math.pow(1 - value, 3.4);

export const getRingProgress = ({
  frame,
  durationFrames,
  easing,
}: {
  frame: number;
  durationFrames: number;
  easing: RingEasing;
}): RingProgress => {
  if (frame < 0 || frame >= durationFrames) {
    return {
      visible: false,
      rawProgress: 0,
      motionProgress: 0,
    };
  }

  const rawProgress = clamp01(frame / Math.max(1, durationFrames - 1));

  return {
    visible: true,
    rawProgress,
    motionProgress:
      easing === "ae-like" ? easeAeLike(rawProgress) : rawProgress,
  };
};
