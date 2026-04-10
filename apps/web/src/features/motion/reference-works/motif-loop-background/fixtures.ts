export const motifLoopBackgroundFixtures = {
  runtimeLabel: "PixiJS 8 / work-local loop evaluator",
  techniqueFamily: [
    "motif-driven looping background",
    "loop phasing",
    "background safety clamp",
  ],
  extractionTargets: [
    "motifLayout()",
    "motifLoopMotion()",
    "backgroundSafetyClamp()",
  ],
  nonGoals: [
    "shared helper extraction or runtime promotion",
    "foreground hero events or title animation systems",
    "poster styling expansion or public-facing polish",
    "mixed renderer architecture or Remotion integration",
  ],
} as const;
