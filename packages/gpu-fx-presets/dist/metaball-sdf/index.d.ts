import type { MetaballParticleSource } from "../metaball-types";
export interface MetaballSDFConfig {
    bgColor: [number, number, number, number];
    threshold: number;
    softness: number;
    rimIntensity: number;
}
export interface MetaballSDF {
    render(encoder: GPUCommandEncoder, outputView: GPUTextureView, time: number, source: MetaballParticleSource): void;
    resize(width: number, height: number): void;
    updateConfig(config: Partial<MetaballSDFConfig>): void;
    getConfig(): MetaballSDFConfig;
    destroy(): void;
}
export declare const METABALL_SDF_DEFAULTS: MetaballSDFConfig;
export declare function createMetaballSDF(device: GPUDevice, width: number, height: number, userConfig?: Partial<MetaballSDFConfig>): MetaballSDF;
