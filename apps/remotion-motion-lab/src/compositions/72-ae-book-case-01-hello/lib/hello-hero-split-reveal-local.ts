import { Easing, interpolate } from "remotion";

export interface HelloHeroSplitRevealLocalOptions {
  frame: number;
  startFrame: number;
  seedScale: number;
  peakScale: number;
  growFrames: number;
  settleFrames: number;
  textStartFrame: number;
  textRevealFrames: number;
}

const clampExtrapolation = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export const helloHeroSplitRevealLocal = ({
  frame,
  startFrame,
  seedScale,
  peakScale,
  growFrames,
  settleFrames,
  textStartFrame,
  textRevealFrames,
}: HelloHeroSplitRevealLocalOptions): {
  plateScale: number;
  textReveal: number;
} => {
  const platePeakFrame = startFrame + growFrames;
  const plateSettleEnd = platePeakFrame + settleFrames;
  const plateScale =
    frame < startFrame
      ? seedScale
      : frame <= platePeakFrame
        ? interpolate(frame, [startFrame, platePeakFrame], [seedScale, peakScale], {
            ...clampExtrapolation,
            easing: Easing.bezier(0.33, 0, 0.18, 1),
          })
        : frame <= plateSettleEnd
          ? interpolate(frame, [platePeakFrame, plateSettleEnd], [peakScale, 1], {
              ...clampExtrapolation,
              easing: Easing.out(Easing.cubic),
            })
          : 1;

  const revealEnd = textStartFrame + textRevealFrames;
  const textReveal =
    frame < textStartFrame
      ? 0
      : interpolate(frame, [textStartFrame, revealEnd], [0, 1], {
          ...clampExtrapolation,
          easing: Easing.bezier(0.45, 0, 0.2, 1),
        });

  return {
    plateScale,
    textReveal,
  };
};
