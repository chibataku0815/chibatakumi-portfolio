import type { MetaballParticleSource } from "./metaball-types";
import { METABALL_SDF_DEFAULTS } from "./metaball-sdf";
import type { MetaballSDFConfig } from "./metaball-sdf";
import type { Effect } from "./types";
/**
 * Wraps MetaballSDF + a particle source into a unified Effect<MetaballSDFConfig>.
 * This allows any particle scene to be used as a drop-in Effect in poster-fx.
 */
export declare function createMetaballEffect(device: GPUDevice, width: number, height: number, createParticles: (device: GPUDevice) => MetaballParticleSource, userConfig?: Partial<MetaballSDFConfig>): Effect<MetaballSDFConfig>;
export { METABALL_SDF_DEFAULTS };
export type { MetaballSDFConfig };
