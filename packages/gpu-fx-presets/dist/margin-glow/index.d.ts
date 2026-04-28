import type { Effect } from "../types";
export interface MarginGlowConfig {
    pillarWidth: number;
    pillarHeight: number;
    bottomRadius: number;
    pillarX: number;
    pillarY: number;
    edgeSoftness: number;
    haloIntensity: number;
    pinkIntensity: number;
    yellowGreenIntensity: number;
    whiteCoreIntensity: number;
    brightness: number;
    motionAmount: number;
    motionSpeed: number;
    twistAmount: number;
    wobbleAmount: number;
    wobbleFrequency: number;
    twistCycles: number;
    wobbleHarmonic: number;
    hueShift: number;
    saturation: number;
    warmth: number;
    bgBrightness: number;
}
export interface MarginGlowPreset {
    name: string;
    label: string;
    config: Partial<MarginGlowConfig>;
}
export declare const MARGIN_GLOW_DEFAULTS: MarginGlowConfig;
export declare const MARGIN_GLOW_PRESETS: MarginGlowPreset[];
export declare function createMarginGlow(device: GPUDevice, width: number, height: number, userConfig?: Partial<MarginGlowConfig>): Effect<MarginGlowConfig>;
