import type { ProgressStop } from "../49-ae-tip-now-loading-progress-bar/lib/loading-progress";

export type BackgroundLayerConfig = {
  readonly name: string;
  readonly colorA: string;
  readonly colorB: string;
  readonly opacity: number;
  readonly angleOffsetDeg: number;
  readonly rotationMultiplier: number;
  readonly phase: number;
};

export const backgroundPalette: readonly BackgroundLayerConfig[] = [
  {
    name: "deep navy x amber",
    colorA: "#111c34",
    colorB: "#c27049",
    opacity: 0.72,
    angleOffsetDeg: 0,
    rotationMultiplier: 1,
    phase: 0,
  },
  {
    name: "teal x rose dust",
    colorA: "#123449",
    colorB: "#8d556f",
    opacity: 0.54,
    angleOffsetDeg: 44,
    rotationMultiplier: 1.28,
    phase: 0.8,
  },
  {
    name: "midnight x warm white",
    colorA: "#0d1529",
    colorB: "#d6b69a",
    opacity: 0.44,
    angleOffsetDeg: 96,
    rotationMultiplier: 1.6,
    phase: 1.6,
  },
] as const;

export const config = {
  fps: 30,
  width: 1920,
  height: 1080,
  durationFrames: 114,
  backgroundPalette,
  backgroundLayerCount: 3,
  backgroundInternalWidth: 640,
  backgroundInternalHeight: 360,
  backgroundBaseColor: "#07090d",
  backgroundOverlayColor: "rgba(7,9,13,0.16)",
  backgroundCenterGlowColor: "rgba(126,230,255,0.08)",
  backgroundBaseGradientLeftColor: "rgba(9,23,43,0.22)",
  backgroundBaseGradientRightColor: "rgba(42,24,23,0.24)",
  backgroundBaseGradientBottomColor: "rgba(4,7,12,0.34)",
  backgroundWarmCornerColor: "rgba(255,136,74,0.16)",
  backgroundCoolCornerColor: "rgba(80,196,255,0.14)",
  backgroundGradientAngleDeg: 18,
  backgroundWipeCompletion: 52,
  backgroundWipeFeatherPx: 960,
  backgroundRotationSpeedDegPerSec: 7,
  backgroundDistortAmount: 22,
  backgroundDistortSize: 138,
  backgroundDistortEvolutionSpeed: 0.28,
  backgroundOpacity: 0.74,
  backgroundColorDrift: 0.045,
  backgroundLayerPresence: 0.14,
  labelText: "Now Loading...",
  resolvedText: "Loaded",
  eyebrowText: "INTERSTITIAL / PHASE 2",
  labelFontSize: 78,
  resolvedFontSize: 44,
  labelLetterSpacingEm: 0.08,
  resolvedLetterSpacingEm: 0.2,
  resolvedOffsetY: 126,
  barWidth: 620,
  barHeight: 34,
  barStrokeWidth: 6,
  barGap: 24,
  loadingScale: 1,
  loadingOffsetY: -22,
  fillDurationFrames: 84,
  fillStops: [
    { frame: 0, value: 0 },
    { frame: 16, value: 0.14, easing: "ae-like" },
    { frame: 28, value: 0.14 },
    { frame: 52, value: 0.48, easing: "ae-like" },
    { frame: 64, value: 0.48 },
    { frame: 84, value: 1, easing: "ae-like" },
  ] as readonly ProgressStop[],
  blinkStepFrames: 6,
  blinkPattern: [1, 1, 0, 0] as const,
  blinkHighOpacity: 0.94,
  blinkLowOpacity: 0.32,
  resolveHoldFrames: 10,
  resolveFadeFrames: 14,
  resolvedDelayFrames: 6,
  textColor: "#f2f6f8",
  mutedTextColor: "rgba(242,246,248,0.56)",
  resolvedTextColor: "#b7ecff",
  barStrokeColor: "#f2f6f8",
  barFillColor: "#f2f6f8",
  accentColor: "#86e3ff",
} as const;
