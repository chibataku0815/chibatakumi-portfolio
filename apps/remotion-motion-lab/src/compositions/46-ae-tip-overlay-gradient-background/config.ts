export type GradientLayerConfig = {
  readonly name: string;
  readonly colorA: string;
  readonly colorB: string;
  readonly opacity: number;
  readonly angleOffsetDeg: number;
  readonly rotationMultiplier: number;
  readonly phase: number;
};

export const layerPalette: readonly GradientLayerConfig[] = [
  {
    name: "sky x amber",
    colorA: "#7ce6ff",
    colorB: "#ff8a3d",
    opacity: 0.9,
    angleOffsetDeg: 0,
    rotationMultiplier: 1,
    phase: 0.0,
  },
  {
    name: "mint x coral",
    colorA: "#95ffe0",
    colorB: "#ff6f91",
    opacity: 0.76,
    angleOffsetDeg: 45,
    rotationMultiplier: 2,
    phase: 0.7,
  },
  {
    name: "lavender x peach",
    colorA: "#9b8cff",
    colorB: "#ffd47a",
    opacity: 0.7,
    angleOffsetDeg: 90,
    rotationMultiplier: 3,
    phase: 1.3,
  },
  {
    name: "cyan x rose",
    colorA: "#66d7ff",
    colorB: "#ff5b7f",
    opacity: 0.62,
    angleOffsetDeg: 135,
    rotationMultiplier: 4,
    phase: 1.9,
  },
] as const;

export const config = {
  fps: 30,
  width: 1920,
  height: 1080,
  totalFrames: 210,
  panelInsetX: 72,
  panelTop: 186,
  panelGap: 32,
  panelHeight: 742,
  panelRadius: 28,
  panelContentInset: 22,
  panelHeaderHeight: 56,
  panelFooterHeight: 26,
  internalWidth: 432,
  internalHeight: 320,
  background: "#08070c",
  panelBackground: "#111019",
  panelStroke: "rgba(255,255,255,0.08)",
  stageBaseColor: "#1a1020",
  stageSingleBaseColor: "#17111d",
  stageGradientLeftColor: "rgba(17,35,61,0.26)",
  stageGradientRightColor: "rgba(74,38,31,0.24)",
  stageGradientBottomColor: "rgba(5,7,12,0.42)",
  textColor: "#f8f0e8",
  labelColor: "#ddd4cc",
  accentColor: "#ff9a62",
  guideColor: "rgba(255,255,255,0.45)",
  guideLineColor: "rgba(255,255,255,0.1)",
  gradientAngleDeg: 24,
  wipeCompletion: 50,
  wipeFeatherPx: 1000,
  hardWipeFeatherPx: 220,
  angleStepDeg: 45,
  rotationSpeedDegPerSec: 20,
  distortAmount: 100,
  distortSize: 100,
  distortEvolutionSpeed: 0.7,
  layerOpacity: 0.88,
  singleLayerOpacity: 0.96,
  layerPresence: 0.14,
  layerCount: layerPalette.length,
} as const;

export const panelWidth =
  (config.width - config.panelInsetX * 2 - config.panelGap) / 2;

export const panelContentWidth = panelWidth - config.panelContentInset * 2;
export const panelContentHeight =
  config.panelHeight -
  config.panelHeaderHeight -
  config.panelFooterHeight -
  config.panelContentInset * 2;
