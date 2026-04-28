// ── Fluid Scene (Phase 2 expression) ─────────────────────────
// GPU compute-driven: 200 particles in curl noise flow field.
// Wraps the particle compute system as a Scene.

import {
  createParticleSystem,
  type ParticleSystem,
  type ParticleConfig,
} from "../compute/particle-system";
import type { AttractorConfig, ParticleStateSnapshot } from "gpu-fx-presets";
import type { Scene } from "./scene-types";

export interface FluidScene extends Scene {
  setAttractor(config: AttractorConfig | null): void;
  exportStateAsync(): Promise<ParticleStateSnapshot>;
  writeState(snapshot: ParticleStateSnapshot): void;
  importState(snapshot: ParticleStateSnapshot): void;
}

export function createFluidScene(
  device: GPUDevice,
  config?: Partial<ParticleConfig>,
): FluidScene {
  const particles: ParticleSystem = createParticleSystem(device, config);

  return {
    name: "Fluid (Phase 2)",
    encode(encoder, time, dt) {
      particles.compute(encoder, time, dt);
    },
    get particleBuffer() { return particles.storageBuffer; },
    get count() { return particles.count; },
    reset() { particles.reset(); },
    setAttractor(config) { particles.setAttractor(config); },
    exportStateAsync() { return particles.exportStateAsync(); },
    writeState(snapshot) { particles.writeState(snapshot); },
    importState(snapshot) { particles.importState(snapshot); },
    destroy() { particles.destroy(); },
  };
}
