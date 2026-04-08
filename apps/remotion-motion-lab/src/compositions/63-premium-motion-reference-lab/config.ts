export const motionLabConfig = {
  overviewId: "PremiumMotionReferenceLabOverview",
  width: 1920,
  height: 1080,
  fps: 30,
  studyDurationInFrames: 150,
  overviewIntroFrames: 18,
  overviewOutroFrames: 18,
} as const;

export const motionStudyCompositionIds = {
  "push-in-lab": "PremiumMotionPushInLab",
  "pull-back-lab": "PremiumMotionPullBackLab",
  "long-settle-lab": "PremiumMotionLongSettleLab",
  "snap-in-lab": "PremiumMotionSnapInLab",
  "continuity-lab": "PremiumMotionContinuityLab",
  "editorial-gap-lab": "PremiumMotionEditorialGapLab",
  "layered-reveal-lab": "PremiumMotionLayeredRevealLab",
} as const;

export const motionLabOverviewFrames =
  motionLabConfig.overviewIntroFrames +
  motionLabConfig.studyDurationInFrames * 7 +
  motionLabConfig.overviewOutroFrames;
