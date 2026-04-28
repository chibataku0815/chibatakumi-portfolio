import type { MetaballParticleSource } from "../metaball-types";
import { createPathFlowParticles } from "./path-flow";
import { DELTA_PRESET } from "./presets";

export function createDeltaParticles(device: GPUDevice): MetaballParticleSource {
  return createPathFlowParticles(device, DELTA_PRESET);
}
