// webgpu-motion-audio — shared audio substrate for the WebGPU motion suite.

export type {
  AudioBands,
  OnsetBands,
  AudioInput,
  AudioSourceKind,
  AudioInputStatus,
  AudioInputDevice,
  AudioController,
} from "./types";

export {
  AudioBus,
  CANON_INTENSITY_ATTACK_TAU,
  CANON_INTENSITY_RELEASE_TAU,
} from "./audio-bus";
export type { AudioBusConfig } from "./audio-bus";

export { createAudioController } from "./audio-controller";
export type { CreateAudioControllerOptions } from "./audio-controller";

export { generateAmbientOnsets, generateBeatOnsets } from "./demo-generators";

export { defineAudioWiring } from "./wiring";
export type { AudioWire, AudioWireSet, ExhaustiveWires } from "./wiring";
