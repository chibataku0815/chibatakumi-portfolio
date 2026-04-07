export type RgbColor = {
  readonly r: number;
  readonly g: number;
  readonly b: number;
};

const clampChannel = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

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

export const mixRgb = (a: RgbColor, b: RgbColor, t: number): RgbColor => {
  const alpha = clamp01(t);

  return {
    r: clampChannel(a.r + (b.r - a.r) * alpha),
    g: clampChannel(a.g + (b.g - a.g) * alpha),
    b: clampChannel(a.b + (b.b - a.b) * alpha),
  };
};
