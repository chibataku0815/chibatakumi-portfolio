import { textUnitSplitter } from "./staged-emphasis-family";

const phrase = "Shinagawa Station";
const units = textUnitSplitter(phrase);

export const stagedEmphasisPayoffFixtures = {
  benchmarkLabel: "CASE_05_TitleSequence / 05_TitleSequence_Txt2.mp4",
  eyebrow: "Phase 3 / Work 05 / SVG + DOM Home",
  title: "Staged Emphasis Payoff",
  subtitle: "Grapheme Delayed Stack / Emphasis Track / Release Hold",
  runtimeLabel: "Main home: Browser SVG + DOM",
  techniqueFamily: [
    "grapheme delayed stack",
    "late emphasis handoff",
    "staggered release hold",
  ],
  extractionTargets: [
    "textUnitSplitter()",
    "textDelayedStack()",
    "emphasisTrack()",
  ],
  nonGoals: [
    "No shared helper promotion in this pass",
    "No poster styling or decorative system expansion",
    "No PixiJS, WebGPU, Remotion, or export work",
  ],
  phrase,
  units,
  focusClusterIndices: [4, 8, 10, 12],
  releaseOrder: [3, 5, 7, 10, 11, 6, 12, 4, 9, 13, 8, 14, 15, 2, 1, 0],
  emphasisTiming: {
    emphasisStart: 0.34,
    emphasisEnd: 0.58,
    handoffStart: 0.48,
    handoffEnd: 0.7,
    payoffStart: 0.56,
    payoffEnd: 0.8,
    releaseStart: 0.72,
    releaseEnd: 1,
  },
  stackTiming: {
    entryStart: 0.04,
    entryStep: 0.034,
    entryDuration: 0.17,
    releaseStart: 0.66,
    releaseStep: 0.018,
    releaseDuration: 0.16,
  },
  viewport: {
    width: 1000,
    height: 500,
  },
  lineBox: {
    x: 138,
    y: 162,
    width: 724,
    height: 136,
  },
  totalFrames: 60,
  reducedMotionFrame: 44,
  fps: 30,
} as const;
