import { config } from "../config";
import { getLoopFrame, sampleMotionStops } from "./segmented-motion";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const bodyBottomStops = [
  {
    frame: 0,
    value: config.motion.bodyStartBottomY,
    easing: "ae-in",
  },
  {
    frame: 14,
    value: config.motion.bodyLandingBottomY,
    easing: "linear",
  },
  {
    frame: 15,
    value: config.motion.bodyLandingBottomY,
    easing: "ae-out",
  },
  {
    frame: 29,
    value: config.motion.bodyStartBottomY,
  },
] as const;

const scaleXStops = [
  { frame: 0, value: 1, easing: "ae-in-out" },
  { frame: 9, value: 0.9, easing: "ae-in-out" },
  { frame: 13, value: 0.8, easing: "ae-out" },
  { frame: 15, value: 1.68, easing: "ae-out" },
  { frame: 17, value: 1.48, easing: "ae-in-out" },
  { frame: 19, value: 1.08, easing: "ae-in-out" },
  { frame: 29, value: 1 },
] as const;

const scaleYStops = [
  { frame: 0, value: 1, easing: "ae-in-out" },
  { frame: 9, value: 1.1, easing: "ae-in-out" },
  { frame: 13, value: 1.2, easing: "ae-out" },
  { frame: 15, value: 0.84, easing: "ae-out" },
  { frame: 17, value: 0.9, easing: "ae-in-out" },
  { frame: 19, value: 1.02, easing: "ae-in-out" },
  { frame: 29, value: 1 },
] as const;

const boardSagStops = [
  { frame: 0, value: 0, easing: "linear" },
  { frame: 14, value: 0.02, easing: "ae-out" },
  { frame: 15, value: 0.55, easing: "ae-out" },
  { frame: 17, value: 0.82, easing: "ae-in-out" },
  { frame: 19, value: 0.46, easing: "ae-in-out" },
  { frame: 21, value: 0.24, easing: "ae-in-out" },
  { frame: 23, value: 0.12, easing: "ae-in-out" },
  { frame: 25, value: 0.07, easing: "ae-out" },
  { frame: 27, value: 0, easing: "linear" },
  { frame: 29, value: 0 },
] as const;

const frontFaceStops = [
  {
    frame: 0,
    value: config.motion.frontFaceStartY,
    easing: "ae-in",
  },
  {
    frame: 13,
    value: 182,
    easing: "ae-out",
  },
  {
    frame: 15,
    value: config.motion.frontFaceHiddenY,
    easing: "linear",
  },
  {
    frame: 29,
    value: config.motion.frontFaceHiddenY,
  },
] as const;

const backFaceStops = [
  {
    frame: 0,
    value: config.motion.backFaceStartY,
    easing: "linear",
  },
  {
    frame: 15,
    value: config.motion.backFaceStartY,
    easing: "ae-out",
  },
  {
    frame: 29,
    value: config.motion.backFaceEndY,
  },
] as const;

export const getCharacterMotion = (frame: number) => {
  const loopFrame = getLoopFrame(frame, config.loopFrames);
  const boardSagProgress = sampleMotionStops({
    frame: loopFrame,
    stops: boardSagStops,
  });
  const boardSagPx = boardSagProgress * config.board.maxSagPx;
  const baseBottomY = sampleMotionStops({
    frame: loopFrame,
    stops: bodyBottomStops,
  });
  const scaleX = sampleMotionStops({
    frame: loopFrame,
    stops: scaleXStops,
  });
  const scaleY = sampleMotionStops({
    frame: loopFrame,
    stops: scaleYStops,
  });
  const frontFaceY = sampleMotionStops({
    frame: loopFrame,
    stops: frontFaceStops,
  });
  const backFaceY = sampleMotionStops({
    frame: loopFrame,
    stops: backFaceStops,
  });
  const bodyBottomY =
    baseBottomY + boardSagPx * config.motion.boardFollowRatio;
  const airborneAmount = clamp01(
    (config.motion.bodyLandingBottomY - baseBottomY) /
      Math.max(
        1,
        config.motion.bodyLandingBottomY - config.motion.bodyStartBottomY,
      ),
  );

  return {
    loopFrame,
    boardSagPx,
    bodyBottomY,
    scaleX,
    scaleY,
    frontFaceY,
    backFaceY,
    shadowScaleX: 0.7 + (1 - airborneAmount) * 0.42,
    shadowScaleY: 0.66 + (1 - airborneAmount) * 0.18,
    shadowOpacity: 0.08 + (1 - airborneAmount) * 0.22,
  };
};
