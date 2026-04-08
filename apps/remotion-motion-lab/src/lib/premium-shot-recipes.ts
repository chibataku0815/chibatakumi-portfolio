import {
  createFastLaunchLongSettle,
  createFlatProfile,
  getPremiumContinuityCutState,
  getPremiumEditorialGapState,
  getPremiumLayeredRevealState,
  getPremiumLongSettleState,
  getPremiumPullBackState,
  getPremiumPushInState,
  getPremiumSnapInState,
  mix,
  resolveDelayedProgress,
  type PremiumMotionProfile,
} from "./premium-motion";

export interface PremiumShotBackgroundState {
  progress: number;
  scale: number;
  shiftY: number;
}

export interface PremiumShotShellState {
  progress: number;
  scale: number;
  translateY?: number;
  opacity?: number;
}

export interface PremiumShotChromeState {
  progress: number;
  railProgress?: number;
}

export interface PremiumShotContentState {
  progress: number;
  searchProgress?: number;
  secondaryProgress?: number;
}

export interface PremiumShotDetailState {
  progress: number;
  scale?: number;
  emphasis?: number;
}

export interface PremiumShotEditorialState {
  exitProgress?: number;
  gapFrames?: number;
  revealStart?: number;
  cutFrame?: number;
  outgoingProgress?: number;
}

export interface PremiumShotLabelsState {
  eyebrow: number;
  metadata: number;
}

export interface PremiumLayerTimingOptions {
  chromeDelayFrames?: number;
  railDelayFrames?: number;
  contentDelayFrames?: number;
  detailDelayFrames?: number;
}

export interface PremiumLayerTimingState {
  chrome: number;
  rail: number;
  content: number;
  detail: number;
}

export const premiumShotRecipePresets = {
  searchEntry: createFastLaunchLongSettle({
    launchFrames: 10,
    settleFrames: 24,
    launchPortion: 0.86,
    settleCurve: "quintOut",
  }),
  weatherPullback: createFastLaunchLongSettle({
    launchFrames: 10,
    settleFrames: 24,
    launchPortion: 0.82,
    settleCurve: "quintOut",
  }),
  sendIconBeat: createFlatProfile("quintOut", 12),
  continuitySwap: createFastLaunchLongSettle({
    launchFrames: 16,
    settleFrames: 26,
    launchPortion: 0.86,
    settleCurve: "quintOut",
  }),
  layeredPanelReveal: createFlatProfile("cubicOut", 22),
  expensiveStop: createFastLaunchLongSettle({
    launchFrames: 8,
    settleFrames: 24,
    launchPortion: 0.82,
    settleCurve: "quintOut",
  }),
} satisfies Record<string, PremiumMotionProfile>;

const chromeProfile = createFlatProfile("cubicOut", 16);
const contentProfile = createFlatProfile("cubicOut", 18);
const detailProfile = createFlatProfile("cubicOut", 20);

const getLayerTimingState = (
  frame: number,
  startFrame: number,
  options: PremiumLayerTimingOptions = {},
): PremiumLayerTimingState => {
  const localFrame = frame - startFrame;

  return {
    chrome: resolveDelayedProgress(
      localFrame,
      options.chromeDelayFrames ?? 0,
      chromeProfile,
    ),
    rail: resolveDelayedProgress(
      localFrame,
      options.railDelayFrames ?? 0,
      chromeProfile,
    ),
    content: resolveDelayedProgress(
      localFrame,
      options.contentDelayFrames ?? 0,
      contentProfile,
    ),
    detail: resolveDelayedProgress(
      localFrame,
      options.detailDelayFrames ?? 0,
      detailProfile,
    ),
  };
};

export interface PremiumSearchEntryShotOptions extends PremiumLayerTimingOptions {
  startFrame: number;
  motion?: PremiumMotionProfile;
  scaleFrom?: number;
  scaleTo?: number;
  backgroundScaleFrom?: number;
  backgroundScaleTo?: number;
  backgroundShift?: number;
  labelDelayFrames?: number;
}

export interface PremiumSearchEntryShotState {
  background: PremiumShotBackgroundState;
  shell: PremiumShotShellState;
  chrome: PremiumShotChromeState;
  content: PremiumShotContentState;
  detail: PremiumShotDetailState;
  labels: PremiumShotLabelsState;
}

export const createPremiumSearchEntryShot = (
  frame: number,
  options: PremiumSearchEntryShotOptions,
): PremiumSearchEntryShotState => {
  const pushIn = getPremiumPushInState(frame, {
    startFrame: options.startFrame,
    motion: options.motion ?? premiumShotRecipePresets.searchEntry,
    scaleFrom: options.scaleFrom ?? 1,
    scaleTo: options.scaleTo ?? 1.15,
    backgroundScaleFrom: options.backgroundScaleFrom ?? 1,
    backgroundScaleTo: options.backgroundScaleTo ?? 1.06,
    backgroundShift: options.backgroundShift ?? -22,
    chromeDelayFrames: options.chromeDelayFrames ?? 1,
    contentDelayFrames: options.contentDelayFrames ?? 4,
  });

  const timing = getLayerTimingState(frame, options.startFrame, {
    chromeDelayFrames: options.chromeDelayFrames ?? 1,
    contentDelayFrames: options.contentDelayFrames ?? 4,
    detailDelayFrames: options.labelDelayFrames ?? 6,
  });

  return {
    background: {
      progress: pushIn.backgroundProgress,
      scale: pushIn.backgroundScale,
      shiftY: pushIn.backgroundShiftY,
    },
    shell: {
      progress: pushIn.shellProgress,
      scale: pushIn.shellScale,
    },
    chrome: {
      progress: pushIn.chromeProgress,
    },
    content: {
      progress: pushIn.contentProgress,
      searchProgress: timing.content,
    },
    detail: {
      progress: timing.detail,
      emphasis: mix(0.9, 1, timing.detail),
    },
    labels: {
      eyebrow: timing.chrome,
      metadata: timing.detail,
    },
  };
};

export interface PremiumResultRevealShotOptions extends PremiumLayerTimingOptions {
  exitStart: number;
  gapFrames?: number;
  revealStaggerFrames?: number;
  revealMotion?: PremiumMotionProfile;
}

export interface PremiumResultRevealShotState {
  background: PremiumShotBackgroundState;
  shell: PremiumShotShellState;
  chrome: PremiumShotChromeState;
  content: PremiumShotContentState;
  detail: PremiumShotDetailState;
  editorial: PremiumShotEditorialState;
}

export const createPremiumResultRevealShot = (
  frame: number,
  options: PremiumResultRevealShotOptions,
): PremiumResultRevealShotState => {
  const editorial = getPremiumEditorialGapState(frame, {
    exitStart: options.exitStart,
    gapFrames: options.gapFrames ?? 4,
    revealStaggerFrames: options.revealStaggerFrames ?? 2,
  });

  const layeredReveal = getPremiumLayeredRevealState(frame, {
    startFrame: editorial.revealStart,
    motion: options.revealMotion ?? premiumShotRecipePresets.layeredPanelReveal,
    chromeDelayFrames: options.chromeDelayFrames ?? 2,
    railDelayFrames: options.railDelayFrames ?? 0,
    contentDelayFrames: options.contentDelayFrames ?? 6,
  });

  return {
    background: {
      progress: layeredReveal.shellProgress,
      scale: layeredReveal.backgroundScale,
      shiftY: layeredReveal.backgroundShiftY,
    },
    shell: {
      progress: layeredReveal.shellProgress,
      scale: layeredReveal.shellScale,
      translateY: layeredReveal.shellY,
      opacity: layeredReveal.shellOpacity,
    },
    chrome: {
      progress: layeredReveal.chromeProgress,
      railProgress: layeredReveal.railProgress,
    },
    content: {
      progress: layeredReveal.detailProgress,
      searchProgress: editorial.searchProgress,
      secondaryProgress: editorial.detailSecondary,
    },
    detail: {
      progress: editorial.detailMain,
      scale: editorial.detailScale,
    },
    editorial: {
      exitProgress: editorial.exitProgress,
      gapFrames: options.gapFrames ?? 4,
      revealStart: editorial.revealStart,
      outgoingProgress: editorial.searchProgress,
    },
  };
};

export interface PremiumWeatherPullbackShotOptions
  extends PremiumLayerTimingOptions {
  startFrame: number;
  motion?: PremiumMotionProfile;
  scaleFrom?: number;
  scaleTo?: number;
  detailScaleFrom?: number;
  detailScaleTo?: number;
  backgroundScaleFrom?: number;
  backgroundScaleTo?: number;
  backgroundShift?: number;
  labelDelayFrames?: number;
}

export interface PremiumWeatherPullbackShotState {
  background: PremiumShotBackgroundState;
  shell: PremiumShotShellState;
  chrome: PremiumShotChromeState;
  content: PremiumShotContentState;
  detail: PremiumShotDetailState;
  labels: PremiumShotLabelsState;
}

export const createPremiumWeatherPullbackShot = (
  frame: number,
  options: PremiumWeatherPullbackShotOptions,
): PremiumWeatherPullbackShotState => {
  const pullBack = getPremiumPullBackState(frame, {
    startFrame: options.startFrame,
    motion: options.motion ?? premiumShotRecipePresets.weatherPullback,
    scaleFrom: options.scaleFrom ?? 1.2,
    scaleTo: options.scaleTo ?? 1,
    detailScaleFrom: options.detailScaleFrom ?? 1.03,
    detailScaleTo: options.detailScaleTo ?? 0.95,
    backgroundScaleFrom: options.backgroundScaleFrom ?? 1.05,
    backgroundScaleTo: options.backgroundScaleTo ?? 1,
    backgroundShift: options.backgroundShift ?? 16,
    railDelayFrames: options.railDelayFrames ?? 4,
    contentDelayFrames: options.contentDelayFrames ?? 4,
  });

  const timing = getLayerTimingState(frame, options.startFrame, {
    chromeDelayFrames: options.chromeDelayFrames ?? 0,
    railDelayFrames: options.railDelayFrames ?? 4,
    contentDelayFrames: options.contentDelayFrames ?? 4,
    detailDelayFrames: options.labelDelayFrames ?? 6,
  });

  return {
    background: {
      progress: pullBack.shellProgress,
      scale: pullBack.backgroundScale,
      shiftY: pullBack.backgroundShiftY,
    },
    shell: {
      progress: pullBack.shellProgress,
      scale: pullBack.shellScale,
    },
    chrome: {
      progress: pullBack.chromeProgress,
      railProgress: pullBack.railProgress,
    },
    content: {
      progress: timing.content,
    },
    detail: {
      progress: timing.detail,
      scale: pullBack.detailScale,
    },
    labels: {
      eyebrow: timing.rail,
      metadata: timing.detail,
    },
  };
};

export interface PremiumSendIconBeatOptions {
  startFrame: number;
  snapMotion?: PremiumMotionProfile;
  settleMotion?: PremiumMotionProfile;
  scaleFrom?: number;
  scaleTo?: number;
  yFrom?: number;
  yTo?: number;
  holdFrames?: number;
}

export interface PremiumSendIconBeatState {
  shell: PremiumShotShellState;
  content: PremiumShotContentState;
  detail: PremiumShotDetailState;
  editorial: PremiumShotEditorialState;
}

export const createPremiumSendIconBeat = (
  frame: number,
  options: PremiumSendIconBeatOptions,
): PremiumSendIconBeatState => {
  const snap = getPremiumSnapInState(frame, {
    startFrame: options.startFrame,
    motion: options.snapMotion ?? premiumShotRecipePresets.sendIconBeat,
    scaleFrom: options.scaleFrom ?? 0.9,
    scaleTo: options.scaleTo ?? 1,
    yFrom: options.yFrom ?? 18,
    yTo: options.yTo ?? 0,
  });

  const settle = getPremiumLongSettleState(frame, {
    startFrame: options.startFrame,
    motion: options.settleMotion ?? premiumShotRecipePresets.expensiveStop,
    scaleFrom: 0.98,
    scaleTo: 1,
    yFrom: 10,
    yTo: 0,
  });

  return {
    shell: {
      progress: settle.clampedProgress,
      scale: snap.scale,
      translateY: snap.translateY,
      opacity: snap.opacity,
    },
    content: {
      progress: snap.progress,
    },
    detail: {
      progress: settle.clampedProgress,
      scale: settle.scale,
      emphasis: mix(0.88, 1, settle.clampedProgress),
    },
    editorial: {
      gapFrames: options.holdFrames ?? 0,
    },
  };
};

export interface PremiumContinuitySwapShotOptions
  extends PremiumLayerTimingOptions {
  startFrame: number;
  cutFrame: number;
  motion?: PremiumMotionProfile;
  scaleFrom?: number;
  scaleTo?: number;
  backgroundScaleFrom?: number;
  backgroundScaleTo?: number;
  detailDelayFrames?: number;
  cutOnly?: boolean;
  instantDetailAfterCut?: boolean;
}

export interface PremiumContinuitySwapShotState {
  background: PremiumShotBackgroundState;
  shell: PremiumShotShellState;
  content: PremiumShotContentState;
  detail: PremiumShotDetailState;
  editorial: PremiumShotEditorialState;
}

export const createPremiumContinuitySwapShot = (
  frame: number,
  options: PremiumContinuitySwapShotOptions,
): PremiumContinuitySwapShotState => {
  const continuity = getPremiumContinuityCutState(frame, {
    startFrame: options.startFrame,
    motion: options.motion ?? premiumShotRecipePresets.continuitySwap,
    cutFrame: options.cutFrame,
    scaleFrom: options.scaleFrom ?? 1,
    scaleTo: options.scaleTo ?? 1.1,
    backgroundScaleFrom: options.backgroundScaleFrom ?? 1,
    backgroundScaleTo: options.backgroundScaleTo ?? 1.06,
    detailDelayFrames: options.detailDelayFrames ?? 3,
    cutOnly: options.cutOnly,
    instantDetailAfterCut: options.instantDetailAfterCut,
  });

  return {
    background: {
      progress: continuity.shellProgress,
      scale: continuity.backgroundScale,
      shiftY: continuity.backgroundShiftY,
    },
    shell: {
      progress: continuity.shellProgress,
      scale: continuity.shellScale,
    },
    content: {
      progress: continuity.searchProgress,
      searchProgress: continuity.searchProgress,
      secondaryProgress: continuity.detailProgress,
    },
    detail: {
      progress: continuity.detailProgress,
      scale: continuity.detailScale,
    },
    editorial: {
      cutFrame: options.cutFrame,
      outgoingProgress: continuity.searchProgress,
    },
  };
};

export interface PremiumLayeredPanelRevealOptions
  extends PremiumLayerTimingOptions {
  startFrame: number;
  motion?: PremiumMotionProfile;
}

export interface PremiumLayeredPanelRevealState {
  background: PremiumShotBackgroundState;
  shell: PremiumShotShellState;
  chrome: PremiumShotChromeState;
  content: PremiumShotContentState;
  detail: PremiumShotDetailState;
}

export const createPremiumLayeredPanelReveal = (
  frame: number,
  options: PremiumLayeredPanelRevealOptions,
): PremiumLayeredPanelRevealState => {
  const layeredReveal = getPremiumLayeredRevealState(frame, {
    startFrame: options.startFrame,
    motion: options.motion ?? premiumShotRecipePresets.layeredPanelReveal,
    chromeDelayFrames: options.chromeDelayFrames ?? 2,
    railDelayFrames: options.railDelayFrames ?? 0,
    contentDelayFrames: options.contentDelayFrames ?? 6,
  });

  return {
    background: {
      progress: layeredReveal.shellProgress,
      scale: layeredReveal.backgroundScale,
      shiftY: layeredReveal.backgroundShiftY,
    },
    shell: {
      progress: layeredReveal.shellProgress,
      scale: layeredReveal.shellScale,
      translateY: layeredReveal.shellY,
      opacity: layeredReveal.shellOpacity,
    },
    chrome: {
      progress: layeredReveal.chromeProgress,
      railProgress: layeredReveal.railProgress,
    },
    content: {
      progress: layeredReveal.detailProgress,
    },
    detail: {
      progress: layeredReveal.detailProgress,
      scale: layeredReveal.detailScale,
    },
  };
};
