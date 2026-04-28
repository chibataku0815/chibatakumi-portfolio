// ── audio feature boundary ──
//
// Wave 1 Agent E (Stream D5.3) — singleton + React context.
// Wave 2 Agent β (Stream D5.4) — root-mounted SoundToggleControl.
// Wave 2 Agent β (Stream D5.5) introduced MicInputGate; its
// experiments-wide mount was later removed in Package 7 (corrective)
// because no current experiments visual reads from the
// GlobalAudioController bus. The component stays exported for any
// future GlobalAudioController-bound visual route. The canonical mic
// surface for `/experiments/dot` is motion-dot's internal Audio Panel.
//
//   import {
//     AudioBusProvider,
//     useAudioBus,
//     SoundToggleControl,
//     MicInputGate, // exported, currently no JSX mount in apps/web
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
