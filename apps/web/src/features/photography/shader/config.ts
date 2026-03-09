/**
 * Photography Video Hero Shader Configuration
 * シネマティック動画背景用パラメータ
 */

export const videoShaderConfig = {
  // === Film Grain ===
  grainIntensity: 0.06,
  grainSpeed: 100.0,

  // === Chromatic Aberration ===
  // 端に向かって強くなるレンズ色収差
  chromaticStrength: 0.003,

  // === Vignette ===
  vignetteStrength: 1.4,
  vignetteSmoothing: 0.3,
  vignetteRadius: 0.8,

  // === Pointer Interaction ===
  cursorWarpStrength: 0.025,
  cursorRadius: 1.5,
  cursorHighlight: 0.04,
  cursorChromaticBoost: 0.012,

  // === Breathing ===
  breathIntensity: 0.06,
  breathFrequency: 0.2,

  // === Color Grading ===
  warmShift: 0.02,
  contrast: 1.05,

  // === Signature Heat ===
  heatStrength: 0.16,
  heatRadius: 3.0,
  heatScrollBoost: 0.2,

  // === Fallback ===
  fallbackColor: "#070707",
} as const;

export type VideoShaderConfig = typeof videoShaderConfig;
