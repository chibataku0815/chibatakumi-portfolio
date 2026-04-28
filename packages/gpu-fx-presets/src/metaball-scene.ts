import type { MetaballParticleSource } from "./metaball-types";
import { createMetaballSDF, METABALL_SDF_DEFAULTS } from "./metaball-sdf";
import type { MetaballSDFConfig } from "./metaball-sdf";
import type { Effect } from "./types";

/**
 * Wraps MetaballSDF + a particle source into a unified Effect<MetaballSDFConfig>.
 * This allows any particle scene to be used as a drop-in Effect in poster-fx.
 */
export function createMetaballEffect(
  device: GPUDevice,
  width: number,
  height: number,
  createParticles: (device: GPUDevice) => MetaballParticleSource,
  userConfig?: Partial<MetaballSDFConfig>,
): Effect<MetaballSDFConfig> {
  const source = createParticles(device);
  const sdf = createMetaballSDF(device, width, height, userConfig);

  return {
    render(encoder, outputView, time) {
      sdf.render(encoder, outputView, time, source);
    },
    resize(w, h) {
      sdf.resize(w, h);
    },
    updateConfig(config) {
      sdf.updateConfig(config);
    },
    getConfig() {
      return sdf.getConfig();
    },
    destroy() {
      source.destroy();
      sdf.destroy();
    },
  };
}

export { METABALL_SDF_DEFAULTS };
export type { MetaballSDFConfig };
