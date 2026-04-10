import { cubicBezier } from "motion";

export const signalStrokeRelayConfig = {
  fps: 30,
  stageCount: 4,
  viewBoxWidth: 1440,
  viewBoxHeight: 540,
  defaultDurationFrames: 150,
  editorialEase: cubicBezier(0.22, 1, 0.36, 1),
  palette: {
    background: "#090909",
    backgroundSoft: "#141414",
    surface: "rgba(255,255,255,0.03)",
    border: "rgba(255,255,255,0.12)",
    grid: "rgba(255,255,255,0.05)",
    text: "#f2efe8",
    textMuted: "rgba(242,239,232,0.62)",
    accent: "#ff6a3d",
    accentSoft: "rgba(255,106,61,0.28)",
    accentHighlight: "#ffc6a8",
    anchor: "#fff2d8",
    underline: "#d6d1c5",
  },
} as const;

export const signalStrokeRelayDefaultAuthoring = {
  global: {
    durationFrames: signalStrokeRelayConfig.defaultDurationFrames,
    baseFrame: 12,
    relayStepFrames: 12,
    exitFrames: 20,
    playbackRate: 1,
  },
  signal: {
    drawFrames: 28,
    holdFrames: 12,
    eraseFrames: 18,
    strokeWidth: 5,
    accentWidth: 2,
  },
  icon: {
    offsetFrames: -2,
    drawFrames: 16,
    settleFrames: 18,
    scaleFrom: 0.74,
    liftPx: 22,
  },
  title: {
    offsetFrames: 2,
    durationFrames: 24,
    liftPx: 22,
    trackingEm: 0.24,
    maskSlackPx: 40,
  },
  underline: {
    offsetFrames: 4,
    drawFrames: 20,
    slidePx: 28,
  },
} as const;

export type SignalStrokeRelayAuthoring = typeof signalStrokeRelayDefaultAuthoring;
