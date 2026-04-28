// Re-export shim for webgpu-motion-audio.
// Resolves via root workspaces glob; will be backed by
// vendor/webgpu-motion-libs/packages/webgpu-motion-audio once Phase A submodule lands.
//
// AudioWiring is exported here as a structural alias of `AudioWireSet<P>` so
// downstream packages (motion-grid / motion-flow) can type their participants
// against `AudioWiring<TParams>` without depending on the upstream brand symbol
// at construction sites — they still call `defineAudioWiring<P>()(...)` to
// build instances. This keeps the participant API stable even if the upstream
// brand changes.

export {
  AudioBus,
  CANON_INTENSITY_ATTACK_TAU,
  CANON_INTENSITY_RELEASE_TAU,
  createAudioController,
  generateAmbientOnsets,
  generateBeatOnsets,
  defineAudioWiring,
} from "webgpu-motion-audio";

export type {
  AudioBands,
  OnsetBands,
  AudioInput,
  AudioSourceKind,
  AudioInputStatus,
  AudioInputDevice,
  AudioController,
  AudioBusConfig,
  CreateAudioControllerOptions,
  AudioWire,
  AudioWireSet,
  ExhaustiveWires,
} from "webgpu-motion-audio";

import type { AudioWireSet } from "webgpu-motion-audio";

/**
 * Public type alias used by MotionParticipant<TParams>. Participants that
 * are not audio-reactive set this to `null`; the alias keeps the call-site
 * shape (`AudioWiring<MyParam>`) ergonomic.
 */
export type AudioWiring<P extends string> = AudioWireSet<P>;
