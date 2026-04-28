export type SignalStrokeRelayAnchorId =
  | "lead-exit"
  | "icon-center"
  | "title-start"
  | "underline-start";

export const signalStrokeRelayFixtures = {
  eyebrow: "Reference Work 01",
  title: "SIGNAL STROKE RELAY",
  subtitle: "Trim Paths / Stagger / Offset & Delay / Match Cut",
  titleWidth: 520,
  titlePosition: {
    x: 744,
    y: 248,
  },
  railLabel: "Main home: Theatre.js + Motion + SVG",
  techniqueFamily: [
    "trim path window",
    "staggered cue chain",
    "offset & delay gate",
    "match cut anchor",
  ],
  subjectLabel: "Title cue relay",
  paths: {
    lead:
      "M 108 204 L 444 204 C 506 204 546 192 590 162 C 608 150 622 142 638 142 L 690 142",
    icon:
      "M 716 142 L 746 172 L 716 202 L 686 172 Z M 698 172 L 734 172",
    underline: "M 744 304 L 1268 304",
  },
  anchors: {
    "lead-exit": { x: 690, y: 142 },
    "icon-center": { x: 716, y: 172 },
    "title-start": { x: 744, y: 248 },
    "underline-start": { x: 744, y: 304 },
  } as Record<SignalStrokeRelayAnchorId, { x: number; y: number }>,
  guideLines: [
    { x1: 108, y1: 142, x2: 1268, y2: 142 },
    { x1: 108, y1: 304, x2: 1268, y2: 304 },
    { x1: 716, y1: 100, x2: 716, y2: 356 },
  ],
  extractionTargets: [
    "trimWindow()",
    "staggerChain()",
    "offsetGate()",
    "matchCutAnchor()",
  ],
  nonGoals: [
    "GPU post / PixiJS / Three.js / physics は入れない",
    "smear / boiling / liquid / morph を混ぜない",
    "Remotion main に戻さない",
  ],
} as const;

export function resolveSignalStrokeRelayAnchor(anchorId: SignalStrokeRelayAnchorId) {
  return signalStrokeRelayFixtures.anchors[anchorId];
}
