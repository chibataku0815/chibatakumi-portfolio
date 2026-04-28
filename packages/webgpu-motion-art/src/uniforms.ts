import { PALETTE, type PaletteToken } from "./tokens";

function hexToRgb(hex: string): readonly [number, number, number] {
  const normalized = hex.startsWith("#") ? hex.slice(1) : hex;
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  const r = parseInt(expanded.slice(0, 2), 16) / 255;
  const g = parseInt(expanded.slice(2, 4), 16) / 255;
  const b = parseInt(expanded.slice(4, 6), 16) / 255;
  return [r, g, b] as const;
}

export function paletteRgb(token: PaletteToken): readonly [number, number, number] {
  return hexToRgb(PALETTE[token]);
}

export function paletteGpuColor(token: PaletteToken): GPUColor {
  const [r, g, b] = paletteRgb(token);
  return { r, g, b, a: 1.0 };
}

export function paletteFloat32(token: PaletteToken): Float32Array {
  const [r, g, b] = paletteRgb(token);
  return new Float32Array([r, g, b]);
}
