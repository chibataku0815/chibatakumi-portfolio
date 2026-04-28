import type { MetaballParticleSource } from "../metaball-types";
import { createPathFlowParticles } from "./path-flow";
import { RIVER_PRESET } from "./presets";

export function createRiverParticles(device: GPUDevice): MetaballParticleSource {
  return createPathFlowParticles(device, RIVER_PRESET);
}
