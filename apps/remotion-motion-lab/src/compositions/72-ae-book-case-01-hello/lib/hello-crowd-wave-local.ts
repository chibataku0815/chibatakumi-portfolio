import { Easing, interpolate } from "remotion";

export interface HelloCrowdWaveLocalOptions {
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

export const helloCrowdWaveLocal = ({
  frame,
  startFrame,
  seedScale,
  peakScale,
  growFrames,
  settleFrames,
}: HelloCrowdWaveLocalOptions): number => {
  const overshootEnd = startFrame + growFrames;
  const settleEnd = overshootEnd + settleFrames;

  if (frame <= overshootEnd) {
    return interpolate(frame, [startFrame, overshootEnd], [seedScale, peakScale], {
      ...clampExtrapolation,
      easing: Easing.bezier(0.22, 1, 0.28, 1),
    });
  }

  if (frame <= settleEnd) {
    return interpolate(frame, [overshootEnd, settleEnd], [peakScale, 1], {
      ...clampExtrapolation,
      easing: Easing.out(Easing.cubic),
    });
  }

  return 1;
};
