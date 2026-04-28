// ── audio feature — re-exported public types ──
//
// Wave 1 Agent E (Stream D5.3). These re-exports let consumers in apps/web
// import audio types from a single boundary (`@/features/audio`) instead of
// reaching into `webgpu-motion-audio` directly. The underlying package
// remains the source of truth — this file is a thin pass-through.

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
} from "webgpu-motion-audio";
