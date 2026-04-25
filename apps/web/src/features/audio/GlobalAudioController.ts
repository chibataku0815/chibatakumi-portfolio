// ── GlobalAudioController — singleton wrapper around webgpu-motion-audio ──
//
// Wave 1 Agent E (Stream D5.3) — provides a single AudioBus + AudioController
// instance to the entire portfolio so that motion-{dot,grid,flow} experiments,
// the eventual SoundToggle (Wave 2 D5.4), and any future audio-reactive
// surfaces share one Web Audio context, one analyser, and one persisted
// device preference.
//
// API notes (verified against vendor/webgpu-motion-libs/packages/webgpu-motion-audio):
//   • `AudioBus.ensureAudioContext()` is private — there is no public way to
//     warm the context from outside. The library's intended pattern is to
//     trigger context creation via `controller.toggle()` (which internally
//     calls `connectAudioElement` → `ensureAudioContext`). Therefore
//     `ensureContext()` here is a thin wrapper that defers to `controller.toggle()`
//     when audio is not yet enabled. Consumers MUST call this from a
//     user-gesture handler (onClick / onPointerDown) — browser autoplay
//     policy requires it.
//   • `createAudioController` requires `storageKeyPrefix` (non-empty); we use
//     "portfolio-audio" so all routes share the same persisted input device.
//   • `onStateChange` is `() => void` (no state arg). Read live values via
//     getter properties on `controller`.
//   • There is no mute method on AudioBus or AudioController. Mute is tracked
//     here at the wrapper level and persisted to localStorage. The actual
//     silencing wiring (gain → 0 / pause()) is the responsibility of the UI
//     consumer (Wave 2 D5.4 SoundToggle) — this wrapper just holds the flag
//     and persists it across sessions.

import {
  AudioBus,
  createAudioController,
  type AudioController,
  type AudioSourceKind,
} from "webgpu-motion-audio";

const MUTE_STORAGE_KEY = "portfolio-audio:mute";
const STORAGE_KEY_PREFIX = "portfolio-audio";

let instance: GlobalAudioController | null = null;

/**
 * Listener invoked whenever wrapper-level state (mute) or underlying
 * controller state (sourceKind, enabled, inputStatus, etc.) changes.
 * Listeners read live values via `getController()` / `isMuted()` — no payload.
 */
export type AudioStateListener = () => void;

export class GlobalAudioController {
  static getInstance(): GlobalAudioController {
    if (!instance) {
      instance = new GlobalAudioController();
    }
    return instance;
  }

  /** Test-only reset hook — not exported from the feature index. */
  static __resetForTest(): void {
    if (instance) {
      try {
        instance.controller.destroy();
      } catch {
        // ignore
      }
      try {
        instance.bus.destroy();
      } catch {
        // ignore
      }
      instance = null;
    }
  }

  private readonly bus: AudioBus;
  private readonly controller: AudioController;
  private mute = false;
  private readonly listeners = new Set<AudioStateListener>();

  private constructor() {
    this.bus = new AudioBus({ demoStyle: "ambient" });
    this.controller = createAudioController({
      audioBus: this.bus,
      storageKeyPrefix: STORAGE_KEY_PREFIX,
      onStateChange: () => {
        this.notify();
      },
    });

    if (typeof window !== "undefined") {
      try {
        const muted = window.localStorage.getItem(MUTE_STORAGE_KEY);
        if (muted === "true") {
          this.mute = true;
        }
      } catch {
        // localStorage may be blocked in restricted environments — ignore.
      }
    }
  }

  /**
   * Gesture-gate friendly entry point. Call from an `onClick` / `onPointerDown`
   * handler before any sound should play. If audio is already enabled this
   * is a no-op; otherwise it triggers `controller.toggle()` which internally
   * resumes the AudioContext (the library's only public path to context
   * creation, since `AudioBus.ensureAudioContext` is private).
   */
  async ensureContext(): Promise<void> {
    if (this.controller.enabled) return;
    await this.controller.toggle();
  }

  setSource(source: AudioSourceKind): Promise<void> {
    return this.controller.selectSource(source);
  }

  setMute(value: boolean): void {
    if (this.mute === value) return;
    this.mute = value;
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(MUTE_STORAGE_KEY, value ? "true" : "false");
      } catch {
        // ignore
      }
    }
    this.notify();
  }

  isMuted(): boolean {
    return this.mute;
  }

  getBus(): AudioBus {
    return this.bus;
  }

  getController(): AudioController {
    return this.controller;
  }

  /**
   * Subscribe to state changes (mute toggle + underlying controller state
   * changes). Returns an unsubscribe function.
   */
  subscribe(listener: AudioStateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // ignore listener exceptions to keep notify loop alive
      }
    }
  }
}
