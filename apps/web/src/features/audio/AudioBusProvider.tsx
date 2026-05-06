"use client";

// ── AudioBusProvider — React context wiring for GlobalAudioController ──
//
// Wave 1 Agent E (Stream D5.3) — exposes the GlobalAudioController singleton
// via React context. Mounts on first client render; before mount `useAudioBus`
// returns null so SSR-rendered components render in their "no audio yet"
// state without throwing.
//
// Wave 2 D5.4 will mount this provider in the root layout and pair it with
// SoundToggle UI. This provider does NOT mount itself anywhere — Wave 2 owns
// that decision.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { GlobalAudioController } from "./GlobalAudioController";
import type { AudioBus, AudioController, AudioSourceKind } from "./types";

export interface AudioBusContextValue {
  readonly bus: AudioBus;
  readonly controller: AudioController;
  readonly mute: boolean;
  setMute(value: boolean): void;
  ensureContext(): Promise<void>;
  setSource(source: AudioSourceKind): Promise<void>;
}

const AudioBusContext = createContext<AudioBusContextValue | null>(null);

type AudioSnapshot = {
  readonly global: GlobalAudioController | null;
  readonly mute: boolean;
  readonly version: number;
};

const SERVER_AUDIO_SNAPSHOT: AudioSnapshot = {
  global: null,
  mute: false,
  version: 0,
};

let audioSnapshot = SERVER_AUDIO_SNAPSHOT;

function updateAudioSnapshot(global: GlobalAudioController): void {
  audioSnapshot = {
    global,
    mute: global.isMuted(),
    version: audioSnapshot.version + 1,
  };
}

function subscribeAudioSnapshot(listener: () => void): () => void {
  const global = GlobalAudioController.getInstance();
  let active = true;
  const emit = () => {
    if (!active) return;
    updateAudioSnapshot(global);
    listener();
  };
  const unsubscribe = global.subscribe(emit);
  queueMicrotask(emit);

  return () => {
    active = false;
    unsubscribe();
  };
}

function getAudioSnapshot(): AudioSnapshot {
  return audioSnapshot;
}

function getServerAudioSnapshot(): AudioSnapshot {
  return SERVER_AUDIO_SNAPSHOT;
}

export interface AudioBusProviderProps {
  readonly children: ReactNode;
}

export function AudioBusProvider({ children }: AudioBusProviderProps) {
  const { global, mute } = useSyncExternalStore(
    subscribeAudioSnapshot,
    getAudioSnapshot,
    getServerAudioSnapshot,
  );

  const setMute = useCallback(
    (value: boolean) => {
      global?.setMute(value);
    },
    [global],
  );

  const ensureContext = useCallback(async () => {
    if (!global) return;
    await global.ensureContext();
  }, [global]);

  const setSource = useCallback(
    async (source: AudioSourceKind) => {
      if (!global) return;
      await global.setSource(source);
    },
    [global],
  );

  const value = useMemo<AudioBusContextValue | null>(() => {
    if (!global) return null;
    return {
      bus: global.getBus(),
      controller: global.getController(),
      mute,
      setMute,
      ensureContext,
      setSource,
    };
  }, [global, mute, setMute, ensureContext, setSource]);

  return <AudioBusContext.Provider value={value}>{children}</AudioBusContext.Provider>;
}

/**
 * Returns the shared audio context value, or `null` until the provider has
 * mounted on the client. Components that need to render an idle state during
 * SSR / before hydration should treat `null` as "audio not yet available".
 */
export function useAudioBus(): AudioBusContextValue | null {
  return useContext(AudioBusContext);
}
