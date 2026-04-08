import type { ToneGrade } from "../config";
import { clamp01 } from "./math";

export type RgbColor = {
  r: number;
  g: number;
  b: number;
};

const clampChannel = (value: number) =>
  Math.max(0, Math.min(255, Math.round(value)));

export const hexToRgb = (hex: string): RgbColor => {
  const normalized = hex.replace("#", "");
  const safeHex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized.padEnd(6, "0").slice(0, 6);

  const numeric = Number.parseInt(safeHex, 16);

  return {
    r: (numeric >> 16) & 0xff,
    g: (numeric >> 8) & 0xff,
    b: numeric & 0xff,
  };
};

export const mixWeightedColors = (
  colors: readonly RgbColor[],
  weights: readonly number[],
): RgbColor => {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const safeTotalWeight = totalWeight === 0 ? 1 : totalWeight;
  const mixed = colors.reduce(
    (accumulator, color, index) => {
      const weight = weights[index] ?? 0;
      return {
        r: accumulator.r + color.r * weight,
        g: accumulator.g + color.g * weight,
        b: accumulator.b + color.b * weight,
      };
    },
    { r: 0, g: 0, b: 0 },
  );

  return {
    r: clampChannel(mixed.r / safeTotalWeight),
    g: clampChannel(mixed.g / safeTotalWeight),
    b: clampChannel(mixed.b / safeTotalWeight),
  };
};

export const applyToneGrade = (color: RgbColor, tone: ToneGrade): RgbColor => {
  let r = color.r / 255;
  let g = color.g / 255;
  let b = color.b / 255;

  r = clamp01((r - 0.5) * tone.contrast + 0.5 + tone.lift);
  g = clamp01((g - 0.5) * tone.contrast + 0.5 + tone.lift);
  b = clamp01((b - 0.5) * tone.contrast + 0.5 + tone.lift);

  r = Math.pow(r, tone.gamma);
  g = Math.pow(g, tone.gamma);
  b = Math.pow(b, tone.gamma);

  const luma = r * 0.2126 + g * 0.7152 + b * 0.0722;
  r = clamp01(luma + (r - luma) * tone.saturation);
  g = clamp01(luma + (g - luma) * tone.saturation);
  b = clamp01(luma + (b - luma) * tone.saturation);

  return {
    r: clampChannel(r * 255),
    g: clampChannel(g * 255),
    b: clampChannel(b * 255),
  };
};

export const brighten = (color: string, amount: number) => {
  const rgb = hexToRgb(color);
  const alpha = clamp01(amount);

  return {
    r: clampChannel(rgb.r + (255 - rgb.r) * alpha),
    g: clampChannel(rgb.g + (255 - rgb.g) * alpha),
    b: clampChannel(rgb.b + (255 - rgb.b) * alpha),
  };
};

export const darken = (color: string, amount: number) => {
  const rgb = hexToRgb(color);
  const alpha = clamp01(amount);

  return {
    r: clampChannel(rgb.r * (1 - alpha)),
    g: clampChannel(rgb.g * (1 - alpha)),
    b: clampChannel(rgb.b * (1 - alpha)),
  };
};
