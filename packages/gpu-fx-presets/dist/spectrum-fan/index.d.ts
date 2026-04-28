import type { Effect } from "../types";
export interface SpectrumFanConfig {
    shapeCount: number;
    fanAngle: number;
    fanRotation: number;
    pivotX: number;
    pivotY: number;
    shapeWidth: number;
    shapeHeight: number;
    opacity: number;
    brightness: number;
    skewAngle: number;
    separation: number;
    glowIntensity: number;
    hueShift: number;
    saturation: number;
    warmth: number;
    bgBrightness: number;
}
export declare const SPECTRUM_FAN_DEFAULTS: SpectrumFanConfig;
export interface SpectrumFanPreset {
    name: string;
    label: string;
    config: Partial<SpectrumFanConfig>;
}
export declare const SPECTRUM_FAN_PRESETS: SpectrumFanPreset[];
export declare function createSpectrumFan(device: GPUDevice, width: number, height: number, userConfig?: Partial<SpectrumFanConfig>): Effect<SpectrumFanConfig>;
