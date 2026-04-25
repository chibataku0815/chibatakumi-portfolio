// MotionParticipant API — Renewal 2026 Phase B (Stream 1).
//
// Each motion artwork (dot / grid / flow) registers as a participant.
// The portfolio shell holds a MotionStage that switches active participant
// on route change with a 0.5s scene blend (flowline pattern).
//
// Design contract:
//   * AudioWiring is imported as a TYPE ONLY from webgpu-motion-audio.
//     Phase A submodule has already symlinked this package via node_modules,
//     but if `vendor/webgpu-motion-libs` is not yet populated, type imports
//     will surface as resolution errors (expected, awaits Phase A).
//   * The participant interface is intentionally minimal: it owns the GPU
//     resources scoped to itself but renders into a passEncoder owned by
//     the MotionStage. This decouples render-target management (scene
//     offscreen pool, swapchain composite) from the per-participant draw.
//   * `blendTo` is called by MotionStage during route-driven blends. The
//     flowline pattern (0.5s scene blend) is the canonical implementation;
//     each participant decides its own blend semantics (cross-fade, mask,
//     handoff transition, etc.).

import type { AudioWiring } from "../audio";

/**
 * Per-frame snapshot passed to every active participant. Held by reference
 * to keep allocation pressure low — do NOT mutate inside `update`.
 */
export type SceneSnapshot = {
  /** Absolute time in seconds since stage init. Monotonic. */
  readonly time: number;
  /** Delta time in seconds. Fixed step (default 1/45). */
  readonly dt: number;
  /** Current route key the shell is navigating to. Used by participants
   *  that key their scene state on route (e.g. ambient vs gallery). */
  readonly routeKey: string;
};

/**
 * Discrete audio features extracted by AudioBus + intensity envelope.
 * `analyser` is the raw Web Audio node when audio is connected; null in
 * silent demo mode (still safe to read `bands`/`energy`/`intensity` —
 * they are filled by AudioBus's demo generator).
 */
export type AudioState = {
  readonly analyser: AnalyserNode | null;
  /** Frequency-band energies. Layout matches webgpu-motion-audio AudioBands. */
  readonly bands: Float32Array;
  /** Broadband RMS, 0-1. */
  readonly energy: number;
  /** Slow envelope (canon attack 1.5s / release 3.0s). */
  readonly intensity: number;
};

/**
 * Lifecycle contract for a motion artwork (dot / grid / flow).
 *
 * `TParams` is the union of audio param keys the participant binds (see
 * webgpu-motion-audio `defineAudioWiring<P>()`). Participants without
 * audio reactivity may set `audioWiring = null` and still satisfy the
 * type via the default `string` parameter.
 */
export type MotionParticipant<TParams extends string = string> = {
  /** Stable identifier used by MotionStage.setActive(name). */
  readonly name: string;
  /** Fixed step rate (canon: 45). */
  readonly fps: number;
  /** Audio→param routing. `null` means the participant ignores audio. */
  readonly audioWiring: AudioWiring<TParams> | null;
  /**
   * One-shot init. Owns its own GPU resources (pipelines, textures,
   * bind groups). `target` is the offscreen color attachment the
   * participant will render into; format is rgba16float canon.
   */
  init(device: GPUDevice, target: GPUTexture): Promise<void>;
  /**
   * Advance simulation state. Pure CPU work — no GPU encoding here.
   * Audio state is read-only (filled by MotionStage from its single
   * AudioBus instance).
   */
  update(dt: number, audioState: AudioState, scene: SceneSnapshot): void;
  /**
   * Encode draw calls into the passed render pass. The pass is opened
   * by MotionStage with the participant's target as the color attachment.
   * Participants must NOT begin/end their own render passes against the
   * stage target — they may, however, run prior compute passes by
   * encoding into the parent encoder accessed via `passEncoder` (TODO:
   * decide whether to expose the encoder directly or pass both —
   * currently render-only).
   */
  render(passEncoder: GPURenderPassEncoder): void;
  /**
   * Cross-blend to another participant over normalized t in [0,1].
   * Called only when MotionStage is mid-transition. Default behavior
   * (cross-fade) can be ignored by participants that own their handoff
   * (e.g. flowline scene blend).
   */
  blendTo(other: MotionParticipant<string>, t: number): void;
  /** Free GPU resources. Idempotent. */
  dispose(): void;
};

/**
 * Stage owns the persistent canvas, the GPU device, and the active
 * participant set. Route changes call `setActive(name, blendDurationMs)`
 * which orchestrates the cross-blend. The shell mounts a single stage
 * at the root layout so the canvas is not torn down on route change.
 */
export type MotionStage = {
  readonly device: GPUDevice;
  readonly canvas: HTMLCanvasElement;
  /**
   * Register a participant. Stage will call `init` lazily on first
   * activation to keep cold-start cheap. Re-registering the same
   * `name` is an error — dispose first.
   */
  register(p: MotionParticipant<string>): void;
  /**
   * Switch active participant with a cross-blend. `blendDurationMs`
   * defaults to 500 (flowline scene-blend canon). Setting to 0 swaps
   * instantly. Calling with the currently active name is a no-op.
   */
  setActive(name: string, blendDurationMs?: number): void;
  /** Tear down all participants + GPU device + RAF loop. */
  dispose(): void;
};
