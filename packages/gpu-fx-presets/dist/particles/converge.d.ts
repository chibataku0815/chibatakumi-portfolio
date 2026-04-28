import type { MetaballParticleSource, ParticleStateSnapshot } from "../metaball-types";
export declare function createConvergeParticles(device: GPUDevice): MetaballParticleSource & {
    isConverged(): boolean;
    exportState(): ParticleStateSnapshot;
    importState(snapshot: ParticleStateSnapshot): void;
};
