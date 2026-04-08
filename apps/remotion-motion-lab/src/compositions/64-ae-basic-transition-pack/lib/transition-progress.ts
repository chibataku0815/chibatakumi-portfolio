import { config, type TransitionEasingId, type TransitionStudy } from "../config";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const aeLikeEase = (value: number) => 1 - Math.pow(1 - value, 3.4);
const quintOut = (value: number) => 1 - Math.pow(1 - value, 5);
const expoOut = (value: number) =>
  value >= 1 ? 1 : 1 - Math.pow(2, -10 * value);

export const applyTransitionEasing = (
  progress: number,
  easingId: TransitionEasingId,
) => {
  const clamped = clamp01(progress);

  switch (easingId) {
    case "linear":
      return clamped;
    case "ae-like":
      return aeLikeEase(clamped);
    case "quint-out":
      return quintOut(clamped);
    case "expo-out":
      return expoOut(clamped);
    default:
      return aeLikeEase(clamped);
  }
};

export const getPhaseProgress = (
  frame: number,
  startFrame: number,
  durationFrames: number,
  easingId: TransitionEasingId = config.defaultEasingId,
) => {
  if (durationFrames <= 0) {
    return frame >= startFrame ? 1 : 0;
  }

  return applyTransitionEasing(
    clamp01((frame - startFrame) / durationFrames),
    easingId,
  );
};

export const getTransitionTiming = (transition: TransitionStudy) => {
  const layerCount = transition.colors.length;
  const lastLayerStartFrame =
    config.entryStartFrame + transition.layerDelayFrames * (layerCount - 1);
  const coverageCompleteFrame =
    lastLayerStartFrame + config.entryDurationFrames;
  const exitStartFrame = coverageCompleteFrame + config.coverHoldFrames;

  return {
    coverageCompleteFrame,
    exitStartFrame,
  };
};
