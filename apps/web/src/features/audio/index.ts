// ── audio feature boundary ──
//
// Wave 1 Agent E (Stream D5.3). Single import point for portfolio-side
// audio surfaces:
//
//   import { AudioBusProvider, useAudioBus } from "@/features/audio";
//   import type { AudioController, AudioSourceKind } from "@/features/audio";
//
// Wave 2 D5.4 will mount AudioBusProvider in the root layout and add the
// SoundToggle UI — neither is wired here.

export { GlobalAudioController } from "./GlobalAudioController";
export type { AudioStateListener } from "./GlobalAudioController";

export { AudioBusProvider, useAudioBus } from "./AudioBusProvider";
export type { AudioBusContextValue, AudioBusProviderProps } from "./AudioBusProvider";

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
