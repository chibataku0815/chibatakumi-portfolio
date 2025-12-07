/**
 * Fluid Gradient Shader Configuration
 * 調整ポイントはこのファイルで一元管理
 */

export interface FluidConfig {
  // Brush parameters
  brushSize: number;
  brushStrength: number;

  // Fluid dynamics
  fluidDecay: number;
  trailLength: number;
  stopDecay: number;

  // Display
  distortionAmount: number;
  colorIntensity: number;
  softness: number;

  // Colors (hex string)
  color1: string;
  color2: string;
  color3: string;
  color4: string;
}

/** デフォルト設定（カラフル） */
export const fluidConfig: FluidConfig = {
  brushSize: 25.0,
  brushStrength: 0.5,
  fluidDecay: 0.98,
  trailLength: 0.8,
  stopDecay: 0.85,
  distortionAmount: 2.5,
  colorIntensity: 1.0,
  softness: 1.0,
  color1: "#b8fff7",
  color2: "#6e3466",
  color3: "#0133ff",
  color4: "#66d1fe",
};

/** モノトーン設定（Radix slate ベース、視認性向上） */
export const fluidConfigMonochrome: Partial<FluidConfig> = {
  color1: "#27272a", // slate-4
  color2: "#3f3f46", // slate-6
  color3: "#52525b", // slate-8
  color4: "#71717a", // slate-10
  colorIntensity: 1.0,
  softness: 0.6,
  distortionAmount: 2.5,
  brushSize: 30.0,
  brushStrength: 0.6,
};

export function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}
