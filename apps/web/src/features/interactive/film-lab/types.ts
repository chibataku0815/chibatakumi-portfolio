export const PARAM_KEYS = [
  "exposure",
  "contrast",
  "saturation",
  "temperature",
  "tint",
  "rgbShift",
  "grainIntensity",
  "vignette",
  "bloomThreshold",
  "bloomStrength",
  "bloomRadius",
  "halationIntensity",
  "halationSpread",
  "halationHue",
  "fade",
  "highlights",
  "shadows",
  "shadowTone",
  "highlightTone",
] as const;

export type ParamKey = (typeof PARAM_KEYS)[number];

export interface Params {
  exposure: number;
  contrast: number;
  saturation: number;
  temperature: number;
  tint: number;
  rgbShift: number;
  grainIntensity: number;
  vignette: number;
  bloomThreshold: number;
  bloomStrength: number;
  bloomRadius: number;
  halationIntensity: number;
  halationSpread: number;
  halationHue: number;
  fade: number;
  highlights: number;
  shadows: number;
  shadowTone: number;
  highlightTone: number;
}

export function cloneParams(params: Params): Params {
  return { ...params };
}
