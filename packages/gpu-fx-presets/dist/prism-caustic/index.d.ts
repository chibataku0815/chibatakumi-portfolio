import type { Effect } from "../types";
export interface PrismCausticConfig {
    speed: number;
    warpStrength: number;
    warpScale: number;
    bandWidth: number;
    brightness: number;
}
export declare const PRISM_CAUSTIC_DEFAULTS: PrismCausticConfig;
export declare function createPrismCaustic(device: GPUDevice, width: number, height: number, userConfig?: Partial<PrismCausticConfig>): Effect<PrismCausticConfig>;
