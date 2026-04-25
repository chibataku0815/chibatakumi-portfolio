// MotionParticipant API — Renewal 2026 Phase 1 → Stream 4 (Phase A wiring).
//
// Each motion artwork (dot / grid / flow) registers as a participant.
// The portfolio shell holds a MotionStage that switches the active participant
// on route change with a 0.5s scene blend (flowline pattern).
//
// Stream 4 revision rationale:
//   * The original `render(passEncoder)` couldn't fit flowline's compute
//     dispatch (4000-16000 agent simulation) nor the film-post composition
//     pass that grid/flow run AFTER the geometry pass. Stream 4 replaces
//     it with a single `render(ctx: ParticipantFrameContext)` that hands
//     the participant the command encoder + final outputView. The
//     participant owns its full pipeline (compute → geometry pass → film
//     post) in one place.
//   * `init(device, format)` replaced `init(device, target)`. Participants
//     compile pipelines against the format only; the actual GPUTexture is
//     supplied per-frame by the stage (it owns the offscreen pool).
//   * `AudioState` now mirrors the canon AudioBus shape — `AudioBands`,
//     `OnsetBands`, `intensity` — instead of an opaque Float32Array. This
//     matches what `AudioWiring.resolveInto` consumes and what AudioBus
//     already keeps alloc-free internally (`_bands`/`_onsets` reused
//     objects). The Float32Array proposed in the Stream 1 handoff §3.4 was
//     redundant given the upstream design.
//   * `blendTo` is still owned by MotionStage (handoff §3.2 recommended).
//     Default behavior is cross-fade against `other`'s last drawn frame.

import type { AudioWiring } from "../audio";
import type { AudioBands, OnsetBands } from "webgpu-motion-audio";

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
 * silent demo mode (still safe to read `bands`/`onsets`/`intensity` —
 * they are filled by AudioBus's demo generator).
 *
 * The references are stable for the lifetime of MotionStage — the stage
 * mutates the contents in place each frame, so participants must read
 * (not retain) the values during `update`.
 */
export type AudioState = {
  readonly analyser: AnalyserNode | null;
  readonly bands: Readonly<AudioBands>;
  readonly onsets: Readonly<OnsetBands>;
  /** Slow envelope (canon attack 1.5s / release 3.0s). 0-1 normalized. */
  readonly intensity: number;
};

/**
 * Per-frame context handed to the participant's `render` method. The
 * participant owns its full render pipeline within this context — it may
 * encode multiple passes (compute, geometry, film post) using the supplied
 * command encoder, ultimately writing to the supplied outputView.
 *
 * The stage manages outputView lifetime: in gallery / ambient mode the
 * view is the participant's offscreen rgba16float target; the stage runs
 * a final composite/blit to the swapchain.
 */
export type ParticipantFrameContext = {
  /** The active command encoder. Participant may add compute & render passes. */
  readonly encoder: GPUCommandEncoder;
  /** Color attachment view the participant must write to. rgba16float canon. */
  readonly outputView: GPUTextureView;
  /** Texture format of `outputView`. Always matches `init(device, format)`. */
  readonly outputFormat: GPUTextureFormat;
  /** Render target dimensions in physical pixels (post-DPR). */
  readonly width: number;
  /** Render target dimensions in physical pixels (post-DPR). */
  readonly height: number;
  /** Absolute time in seconds since stage init. */
  readonly time: number;
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
   * bind groups). `format` is the texture format the participant will
   * render into (rgba16float canon for offscreen-then-composite flow).
   * Width/height are not provided here — the participant lazily sizes
   * resources in the first `render` call (or watches via window.matchMedia
   * if internal resource layout depends on viewport).
   */
  init(device: GPUDevice, format: GPUTextureFormat): Promise<void>;
  /**
   * Advance simulation state. Pure CPU work — no GPU encoding here.
   * Audio state is read-only (filled by MotionStage from its single
   * AudioBus instance).
   */
  update(dt: number, audioState: AudioState, scene: SceneSnapshot): void;
  /**
   * Encode one full frame of GPU work into the supplied command encoder,
   * writing the final pixels to `ctx.outputView`. The participant may
   * encode multiple sub-passes (compute, geometry, film post) — the
   * stage will not begin a render pass on the participant's behalf.
   */
  render(ctx: ParticipantFrameContext): void;
  /**
   * Cross-blend to another participant over normalized t in [0,1].
   * Called only when MotionStage is mid-transition. Default behavior
   * (cross-fade) is owned by MotionStage's composite pass; participants
   * may override here when they want to drive the blend internally
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
