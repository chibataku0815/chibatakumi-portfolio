import { Easing, interpolate } from "remotion";
import { getRingProgress, type RingEasing } from "./ring-progress";

export type PeakWindowConfig = {
  readonly startFrame: number;
  readonly durationFrames: number;
  readonly staggerFrames: number;
  readonly easing: RingEasing;
  readonly startDiameter: number;
  readonly endDiameter: number;
  readonly startStrokeWidth: number;
  readonly endStrokeWidth: number;
  readonly opacityDecay: number;
  readonly alphaStart?: number;
  readonly alphaEnd?: number;
  readonly layerAlphaFloor?: number;
};

export type PeakWindowState = {
  readonly diameter: number;
  readonly strokeWidth: number;
  readonly alpha: number;
  readonly rawProgress: number;
  readonly motionProgress: number;
};

export type TitleHandoffConfig = {
  readonly startFrame: number;
  readonly durationFrames: number;
  readonly startScale: number;
  readonly endScale: number;
  readonly opacityRampFraction?: number;
  readonly scaleOvershoot?: number;
};

export type TitleHandoffState = {
  readonly scale: number;
  readonly opacity: number;
};

export const peakWindow = ({
  frame,
  layerIndex = 0,
  startFrame,
  durationFrames,
  staggerFrames,
  easing,
  startDiameter,
  endDiameter,
  startStrokeWidth,
  endStrokeWidth,
  opacityDecay,
  alphaStart = 0.94,
  alphaEnd = 0.08,
  layerAlphaFloor = 0.12,
}: {
  frame: number;
  layerIndex?: number;
} & PeakWindowConfig): PeakWindowState | null => {
  const progress = getRingProgress({
    frame: frame - startFrame - layerIndex * staggerFrames,
    durationFrames,
    easing,
  });

  if (!progress.visible) {
    return null;
  }

  const diameter = interpolate(
    progress.motionProgress,
    [0, 1],
    [startDiameter, endDiameter],
  );
  const strokeWidth = Math.max(
    endStrokeWidth,
    interpolate(
      progress.motionProgress,
      [0, 1],
      [startStrokeWidth, endStrokeWidth],
    ),
  );
  const alpha =
    interpolate(progress.rawProgress, [0, 1], [alphaStart, alphaEnd]) *
    Math.max(layerAlphaFloor, 1 - layerIndex * opacityDecay);

  return {
    diameter,
    strokeWidth,
    alpha,
    rawProgress: progress.rawProgress,
    motionProgress: progress.motionProgress,
  };
};

export const titleHandoff = ({
  frame,
  startFrame,
  durationFrames,
  startScale,
  endScale,
  opacityRampFraction = 0.72,
  scaleOvershoot = 1.2,
}: {
  frame: number;
} & TitleHandoffConfig): TitleHandoffState => {
  const scale = interpolate(
    frame,
    [startFrame, startFrame + durationFrames],
    [startScale, endScale],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.back(scaleOvershoot)),
    },
  );
  const opacity = interpolate(
    frame,
    [startFrame, startFrame + durationFrames * opacityRampFraction],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );

  return {
    scale,
    opacity,
  };
};
