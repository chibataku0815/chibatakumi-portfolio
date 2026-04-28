import type { Effect } from "../types";
export interface AuroraConfig {
    horizonY: number;
    warmth: number;
    coolness: number;
    envelopeWidth: number;
    glowIntensity: number;
    brightness: number;
    animSpeed: number;
}
export declare const AURORA_DEFAULTS: AuroraConfig;
export declare function createAurora(device: GPUDevice, width: number, height: number, userConfig?: Partial<AuroraConfig>): Effect<AuroraConfig>;
