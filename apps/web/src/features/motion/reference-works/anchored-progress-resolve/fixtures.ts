export const anchoredProgressResolveFixtures = {
  eyebrow: "Phase 1 / Work 03 / SVG + DOM Home",
  title: "Anchored Progress Resolve",
  subtitle: "Anchored Fill / Blink Channel / Resolve State",
  runtimeLabel: "Main home: Browser SVG + DOM",
  techniqueFamily: [
    "anchoredFill()",
    "blinkChannel()",
    "resolveState()",
  ],
  extractionTargets: [
    "progressStateMachine()",
    "anchoredFill()",
    "blinkChannel()",
    "resolveState()",
  ],
  nonGoals: [
    "No shared helper extraction in this pass",
    "No custom SVG asset intake",
    "No Remotion or export adapter work",
  ],
  viewport: {
    width: 1280,
    height: 720,
  },
  rail: {
    x: 228,
    y: 378,
    width: 824,
    height: 18,
    radius: 9,
  },
  checkpointXs: [390, 558, 732, 900],
  laneYs: [254, 300, 346],
  totalFrames: 240,
  fps: 60,
} as const;
