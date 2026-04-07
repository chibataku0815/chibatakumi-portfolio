import type { RingEasing } from "../47-ae-tip-expanding-ring-reveal/lib/ring-progress";

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
    name: "electric blue x amber",
    colorA: "#274dff",
    colorB: "#ff9d3f",
    opacity: 1,
    angleOffsetDeg: 0,
    rotationMultiplier: 1,
    phase: 0,
  },
  {
    name: "indigo x lilac",
    colorA: "#1d2277",
    colorB: "#f1b9ff",
    opacity: 0.88,
    angleOffsetDeg: 45,
    rotationMultiplier: 1.45,
    phase: 0.8,
  },
  {
    name: "midnight x cream",
    colorA: "#090b1d",
    colorB: "#fff1bf",
    opacity: 0.78,
    angleOffsetDeg: 92,
    rotationMultiplier: 1.85,
    phase: 1.6,
  },
] as const;

export const config = {
  fps: 30,
  width: 1920,
  height: 1080,
  durationFrames: 90,
  backgroundLayerCount: 3,
  backgroundPalette,
  backgroundInternalWidth: 640,
  backgroundInternalHeight: 360,
  backgroundBaseColor: "#03040b",
  backgroundOverlayColor: "rgba(5,4,10,0.12)",
  backgroundCenterGlowColor: "rgba(255,232,116,0.18)",
  backgroundGradientAngleDeg: 18,
  backgroundWipeCompletion: 50,
  backgroundWipeFeatherPx: 940,
  backgroundRotationSpeedDegPerSec: 14,
  backgroundDistortAmount: 34,
  backgroundDistortSize: 124,
  backgroundDistortEvolutionSpeed: 0.34,
  backgroundOpacity: 0.86,
  backgroundColorDrift: 0.05,
  heroStartFrame: 18,
  ringCount: 5,
  ringStaggerFrames: 3,
  ringDurationFrames: 26,
  ringStartDiameter: 12,
  ringEndDiameter: 860,
  strokeStartWidth: 188,
  strokeEndWidth: 1,
  ringColor: "#fff7db",
  ringHighlightColor: "rgba(255,228,103,0.34)",
  ringOpacityDecay: 0.13,
  ringEase: "ae-like" as RingEasing,
  titleText: "FILMTONE",
  titleDelayFrames: 73,
  titleDurationFrames: 12,
  titleStartScale: 0.62,
  titleMaxScale: 1.05,
  titleColor: "#fffbe8",
  titleLetterSpacingEm: 0.19,
  titleFontSize: 132,
  titleShadow: "0 0 40px rgba(255,216,88,0.28)",
  accentStartFrame: 58,
  accentDrawDurationFrames: 8,
  accentEraseDelayFrames: 2,
  accentEraseDurationFrames: 6,
  accentLineAnglesDeg: [-132, -96, -32, 12, 48, 102, 148, 174] as const,
  accentLineStaggerFrames: 0.8,
  accentRadiusOffset: -10,
  accentStrokeLength: 178,
  accentStrokeWidth: 8,
  accentOpacity: 0.56,
  accentGlowOpacity: 0.34,
  accentEnvelopeOutFrames: 5,
  accentColor: "#fff23c",
  accentGlowColor: "rgba(122,153,255,0.42)",
  burstFlashColor: "rgba(255,243,134,0.38)",
  burstFlashRadius: 560,
  titleFlashColor: "rgba(255,248,190,0.24)",
} as const;
