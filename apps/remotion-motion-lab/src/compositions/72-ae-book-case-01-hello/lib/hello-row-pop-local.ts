import { Easing, interpolate } from "remotion";

export interface HelloRowPopLocalOptions {
  frame: number;
  startFrame: number;
  seedScale: number;
  peakScale: number;
  growFrames: number;
  settleFrames: number;
}

const clampExtrapolation = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export const helloRowPopLocal = ({
  frame,
  startFrame,
  seedScale,
  peakScale,
  growFrames,
  settleFrames,
}: HelloRowPopLocalOptions): number => {
  if (frame < startFrame) {
    return seedScale;
  }

  const overshootEnd = startFrame + growFrames;
  const settleEnd = overshootEnd + settleFrames;

  if (frame <= overshootEnd) {
    return interpolate(
      frame,
      [startFrame, overshootEnd],
      [seedScale, peakScale],
      {
        ...clampExtrapolation,
        easing: Easing.bezier(0.22, 1, 0.28, 1),
      },
    );
  }

  if (frame <= settleEnd) {
    return interpolate(frame, [overshootEnd, settleEnd], [peakScale, 1], {
      ...clampExtrapolation,
      easing: Easing.out(Easing.cubic),
    });
  }

  return 1;
};
