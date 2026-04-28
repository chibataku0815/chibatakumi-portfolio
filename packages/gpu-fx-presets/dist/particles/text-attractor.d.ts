import type { MetaballParticleSource } from "../metaball-types";
export interface TextAttractorConfig {
    text?: string;
    fontSize?: number;
}
export declare function createTextAttractorParticles(device: GPUDevice, config?: TextAttractorConfig): MetaballParticleSource & {
    setText(text: string): void;
};
