import { textUnitSplitter } from "./staged-emphasis-family";

const phrase = "Focus hands meaning forward";
const units = textUnitSplitter(phrase);

export const stagedEmphasisPayoffFixtures = {
  eyebrow: "Phase 1 / Work 04 / SVG + DOM Home",
  title: "Staged Emphasis Payoff",
  subtitle: "Text Delayed Stack / Emphasis Track / Payoff Frame",
  runtimeLabel: "Main home: Browser SVG + DOM",
  techniqueFamily: [
    "text-driven staged payoff",
    "per-unit delay",
    "emphasis handoff",
  ],
  extractionTargets: [
    "textUnitSplitter()",
    "textDelayedStack()",
    "emphasisTrack()",
  ],
  nonGoals: [
    "No shared helper extraction in this pass",
    "No poster styling or texture pass",
    "No PixiJS, Three.js, Remotion, or export work",
  ],
  phrase,
  units,
  emphasisIndex: 2,
  payoffIndex: units.length - 1,
  viewport: {
    width: 1280,
    height: 720,
  },
  lineBox: {
    x: 112,
    y: 262,
    width: 1056,
    height: 196,
  },
  totalFrames: 216,
  fps: 60,
} as const;
