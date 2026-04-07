export const config = {
  fps: 30,
  width: 1920,
  height: 1080,
  totalFrames: 216,
  burstDurationFrames: 28,
  loopGapFrames: 14,
  ringStartDiameter: 6,
  ringEndDiameter: 620,
  strokeStartWidth: 210,
  strokeEndWidth: 0,
  ringCount: 4,
  ringStaggerFrames: 7,
  ringOpacityDecay: 0.18,
  titleText: "MARGHERITA",
  titleScaleDelayFrames: 12,
  titleScaleDurationFrames: 16,
  titleLetterSpacingEm: 0.18,
  background: "#070707",
  panelInsetX: 72,
  panelTop: 182,
  panelGap: 32,
  panelHeight: 744,
  panelRadius: 28,
  leftPanelWidth: 560,
  accentColor: "#ff8b5e",
  accentSoftColor: "#ffd5c7",
  ringColor: "#f6efe5",
  ringHighlightColor: "rgba(255,139,94,0.18)",
  guideColor: "rgba(255,255,255,0.11)",
  dimGuideColor: "rgba(255,255,255,0.06)",
  labelColor: "#d8d0c7",
  textColor: "#f6efe5",
  titleColor: "#fff3e7",
} as const;

export const singleRingLoopFrames = config.burstDurationFrames + config.loopGapFrames;

export const stackLoopFrames =
  config.burstDurationFrames +
  config.ringStaggerFrames * (config.ringCount - 1) +
  config.loopGapFrames;

export const rightPanelWidth =
  config.width - config.panelInsetX * 2 - config.leftPanelWidth - config.panelGap;
