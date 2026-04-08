import {
  clamp01,
  createFlatProfile,
  mix,
  resolveDelayedProgress,
  resolvePremiumClampedProgress,
  resolvePremiumMotionProgress,
  type PremiumMotionProfile,
} from "./premium-motion-primitives";

export interface PremiumPushInOptions {
  startFrame: number;
  motion: PremiumMotionProfile;
  scaleFrom: number;
  scaleTo: number;
  backgroundScaleFrom?: number;
  backgroundScaleTo?: number;
  backgroundShift?: number;
  chromeDelayFrames?: number;
  contentDelayFrames?: number;
}

export interface PremiumPushInState {
  shellProgress: number;
  shellScale: number;
  backgroundProgress: number;
  backgroundScale: number;
  backgroundShiftY: number;
  chromeProgress: number;
  contentProgress: number;
}

export const getPremiumPushInState = (
  frame: number,
  options: PremiumPushInOptions,
): PremiumPushInState => {
  const localFrame = frame - options.startFrame;
  const shellProgress = resolvePremiumClampedProgress(localFrame, options.motion);
  const backgroundProgress = clamp01(shellProgress * 0.9);
  return {
    shellProgress,
    shellScale: mix(options.scaleFrom, options.scaleTo, shellProgress),
    backgroundProgress,
    backgroundScale: mix(
      options.backgroundScaleFrom ?? 1,
      options.backgroundScaleTo ?? 1.04,
      backgroundProgress,
    ),
    backgroundShiftY: mix(0, options.backgroundShift ?? -18, backgroundProgress),
    chromeProgress: resolveDelayedProgress(
      localFrame,
      options.chromeDelayFrames ?? 0,
      createFlatProfile("cubicOut", 18),
    ),
    contentProgress: resolveDelayedProgress(
      localFrame,
      options.contentDelayFrames ?? 0,
      createFlatProfile("cubicOut", 22),
    ),
  };
};

export interface PremiumPullBackOptions {
  startFrame: number;
  motion: PremiumMotionProfile;
  scaleFrom: number;
  scaleTo: number;
  detailScaleFrom?: number;
  detailScaleTo?: number;
  backgroundScaleFrom?: number;
  backgroundScaleTo?: number;
  backgroundShift?: number;
  railDelayFrames?: number;
  contentDelayFrames?: number;
}

export interface PremiumPullBackState {
  shellProgress: number;
  shellScale: number;
  detailScale: number;
  backgroundScale: number;
  backgroundShiftY: number;
  chromeProgress: number;
  railProgress: number;
}

export const getPremiumPullBackState = (
  frame: number,
  options: PremiumPullBackOptions,
): PremiumPullBackState => {
  const localFrame = frame - options.startFrame;
  const shellProgress = resolvePremiumClampedProgress(localFrame, options.motion);
  const detailProgress = resolveDelayedProgress(
    localFrame,
    options.contentDelayFrames ?? 0,
    createFlatProfile("cubicOut", 20),
  );

  return {
    shellProgress,
    shellScale: mix(options.scaleFrom, options.scaleTo, shellProgress),
    detailScale: mix(
      options.detailScaleFrom ?? 1.02,
      options.detailScaleTo ?? 0.98,
      detailProgress,
    ),
    backgroundScale: mix(
      options.backgroundScaleFrom ?? 1.06,
      options.backgroundScaleTo ?? 1,
      shellProgress,
    ),
    backgroundShiftY: mix(0, options.backgroundShift ?? 18, shellProgress),
    chromeProgress: resolvePremiumClampedProgress(
      localFrame,
      createFlatProfile("cubicOut", 18),
    ),
    railProgress: resolveDelayedProgress(
      localFrame,
      options.railDelayFrames ?? 0,
      createFlatProfile("cubicOut", 16),
    ),
  };
};

export interface PremiumLongSettleOptions {
  startFrame: number;
  motion: PremiumMotionProfile;
  scaleFrom: number;
  scaleTo: number;
  yFrom: number;
  yTo: number;
}

export interface PremiumLongSettleState {
  progress: number;
  clampedProgress: number;
  scale: number;
  translateY: number;
}

export const getPremiumLongSettleState = (
  frame: number,
  options: PremiumLongSettleOptions,
): PremiumLongSettleState => {
  const localFrame = frame - options.startFrame;
  const progress = resolvePremiumMotionProgress(localFrame, options.motion);
  const clampedProgress = clamp01(progress);
  return {
    progress,
    clampedProgress,
    scale: mix(options.scaleFrom, options.scaleTo, progress),
    translateY: mix(options.yFrom, options.yTo, clampedProgress),
  };
};

export interface PremiumSnapInOptions {
  startFrame: number;
  motion: PremiumMotionProfile;
  scaleFrom: number;
  scaleTo: number;
  yFrom: number;
  yTo: number;
}

export interface PremiumSnapInState {
  progress: number;
  opacity: number;
  scale: number;
  translateY: number;
}

export const getPremiumSnapInState = (
  frame: number,
  options: PremiumSnapInOptions,
): PremiumSnapInState => {
  const localFrame = frame - options.startFrame;
  const progress = resolvePremiumMotionProgress(localFrame, options.motion);
  return {
    progress,
    opacity: clamp01(progress * 1.15),
    scale: mix(options.scaleFrom, options.scaleTo, progress),
    translateY: mix(options.yFrom, options.yTo, clamp01(progress)),
  };
};

export interface PremiumContinuityCutOptions {
  startFrame: number;
  motion: PremiumMotionProfile;
  cutFrame: number;
  scaleFrom: number;
  scaleTo: number;
  backgroundScaleFrom?: number;
  backgroundScaleTo?: number;
  detailDelayFrames?: number;
  cutOnly?: boolean;
  instantDetailAfterCut?: boolean;
}

export interface PremiumContinuityCutState {
  shellProgress: number;
  shellScale: number;
  searchProgress: number;
  detailProgress: number;
  detailScale: number;
  backgroundScale: number;
  backgroundShiftY: number;
}

export const getPremiumContinuityCutState = (
  frame: number,
  options: PremiumContinuityCutOptions,
): PremiumContinuityCutState => {
  const motionBase = frame - options.startFrame;
  const shellProgress = options.cutOnly
    ? 0
    : resolvePremiumClampedProgress(motionBase, options.motion);
  const detailProgress =
    frame < options.cutFrame
      ? 0
      : options.instantDetailAfterCut
        ? 1
        : resolveDelayedProgress(
            frame - options.cutFrame,
            options.detailDelayFrames ?? 0,
            createFlatProfile("cubicOut", 14),
          );

  return {
    shellProgress,
    shellScale: mix(options.scaleFrom, options.scaleTo, shellProgress),
    searchProgress: frame < options.cutFrame ? 1 : 0,
    detailProgress,
    detailScale: mix(1.02, 0.98, clamp01(shellProgress)),
    backgroundScale: mix(
      options.backgroundScaleFrom ?? 1,
      options.backgroundScaleTo ?? 1.05,
      shellProgress,
    ),
    backgroundShiftY: mix(0, -18, shellProgress),
  };
};

export interface PremiumEditorialGapOptions {
  exitStart: number;
  gapFrames: number;
  revealStaggerFrames?: number;
}

export interface PremiumEditorialGapState {
  exitProgress: number;
  revealStart: number;
  detailMain: number;
  detailSecondary: number;
  searchProgress: number;
  detailScale: number;
}

export const getPremiumEditorialGapState = (
  frame: number,
  options: PremiumEditorialGapOptions,
): PremiumEditorialGapState => {
  const exitProgress = resolvePremiumClampedProgress(
    frame - options.exitStart,
    createFlatProfile("cubicOut", 10),
  );
  const revealStart = options.exitStart + 10 + options.gapFrames;
  const detailMain = resolvePremiumClampedProgress(
    frame - revealStart,
    createFlatProfile("cubicOut", 18),
  );
  const detailSecondary = resolvePremiumClampedProgress(
    frame - revealStart - (options.revealStaggerFrames ?? 0),
    createFlatProfile("cubicOut", 18),
  );
  return {
    exitProgress,
    revealStart,
    detailMain,
    detailSecondary,
    searchProgress: 1 - exitProgress,
    detailScale: mix(1.02, 1, detailSecondary),
  };
};

export interface PremiumLayeredRevealOptions {
  startFrame: number;
  motion: PremiumMotionProfile;
  chromeDelayFrames?: number;
  railDelayFrames?: number;
  contentDelayFrames?: number;
}

export interface PremiumLayeredRevealState {
  shellProgress: number;
  shellScale: number;
  shellY: number;
  shellOpacity: number;
  chromeProgress: number;
  railProgress: number;
  detailProgress: number;
  detailScale: number;
  backgroundScale: number;
  backgroundShiftY: number;
}

export const getPremiumLayeredRevealState = (
  frame: number,
  options: PremiumLayeredRevealOptions,
): PremiumLayeredRevealState => {
  const localFrame = frame - options.startFrame;
  const shellProgress = resolvePremiumClampedProgress(localFrame, options.motion);
  const detailProgress = resolveDelayedProgress(
    localFrame,
    options.contentDelayFrames ?? 0,
    createFlatProfile("cubicOut", 18),
  );
  return {
    shellProgress,
    shellScale: mix(0.96, 1.02, shellProgress),
    shellY: mix(12, 0, shellProgress),
    shellOpacity: mix(0.22, 1, shellProgress),
    chromeProgress: resolveDelayedProgress(
      localFrame,
      options.chromeDelayFrames ?? 0,
      createFlatProfile("cubicOut", 16),
    ),
    railProgress: resolveDelayedProgress(
      localFrame,
      options.railDelayFrames ?? 0,
      createFlatProfile("cubicOut", 16),
    ),
    detailProgress,
    detailScale: mix(1.03, 1, detailProgress),
    backgroundScale: mix(1, 1.03, shellProgress),
    backgroundShiftY: mix(0, -10, shellProgress),
  };
};
