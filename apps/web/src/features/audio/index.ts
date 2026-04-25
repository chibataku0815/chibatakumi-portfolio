// ── audio feature boundary ──
//
// Wave 1 Agent E (Stream D5.3) — singleton + React context.
// Wave 2 Agent β (Streams D5.4 + D5.5) — root-mounted SoundToggleControl
// and `/experiments/*` MicInputGate.
//
//   import {
//     AudioBusProvider,
//     useAudioBus,
//     SoundToggleControl,
//     MicInputGate,
//   } from "@/features/audio";

export { GlobalAudioController } from "./GlobalAudioController";
export type { AudioStateListener } from "./GlobalAudioController";

export { AudioBusProvider, useAudioBus } from "./AudioBusProvider";
export type { AudioBusContextValue, AudioBusProviderProps } from "./AudioBusProvider";

export { SoundToggleControl } from "./SoundToggleControl";
export type { SoundToggleControlProps } from "./SoundToggleControl";

export { MicInputGate } from "./MicInputGate";
export type { MicInputGateProps } from "./MicInputGate";

export type {
  AudioBands,
  AudioBus,
  AudioBusConfig,
  AudioController,
  AudioInput,
  AudioInputDevice,
  AudioInputStatus,
  AudioSourceKind,
  AudioWire,
  AudioWireSet,
  CreateAudioControllerOptions,
  ExhaustiveWires,
  OnsetBands,
} from "./types";
