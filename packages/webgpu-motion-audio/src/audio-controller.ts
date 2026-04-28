// ── Audio Controller — Source kind management (default_track / file / input) ──
// TODO(phase5): move DOM side-effects (file input element, devicechange listener)
// to `webgpu-motion-dom` when the UI panel package is split out.
//
// Ported from motion-dot-new-webgpu. Key generalization for the shared substrate:
//   * `storageKeyPrefix` is a REQUIRED option — throws when empty. This prevents
//     localStorage key collisions if two apps ever load side-by-side and lets each
//     app persist its preferred input device independently.
//   * HMR dispose hook is registered inside the factory so Vite hot-updates of
//     THIS module (audio-controller.ts) destroy the stale controller instance
//     before the replacement runs. Apps whose `main.ts` re-instantiates the
//     controller on hot-update should additionally register their own
//     `import.meta.hot.dispose(() => controller.destroy())` in their entry file.

import { AudioBus } from "./audio-bus";
import type {
  AudioController,
  AudioInputDevice,
  AudioInputStatus,
  AudioSourceKind,
} from "./types";

export type {
  AudioController,
  AudioInputDevice,
  AudioInputStatus,
  AudioSourceKind,
} from "./types";

export interface CreateAudioControllerOptions {
  readonly audioBus: AudioBus;
  /**
   * Optional. When provided, the controller can auto-play a baked-in track on
   * toggle. When omitted (grid's use case), `default_track` selection falls
   * back to demo mode — file / input sources still work normally.
   */
  readonly defaultSrc?: string;
  /**
   * Required. Used as the localStorage key prefix for persisting the preferred
   * audio input device. Typical values: `"motion-dot-new-webgpu"`,
   * `"motion-grid-guided-webgpu"`. Throws if empty or whitespace-only.
   */
  readonly storageKeyPrefix: string;
  readonly onStateChange?: () => void;
}

const DEFAULT_TRACK_LABEL = "default track";
const DEFAULT_INPUT_LABEL = "audio input";

function buildInputLabel(device: MediaDeviceInfo, index: number): string {
  const label = device.label.trim();
  return label || `Input ${index + 1}`;
}

function pickPreferredInputDeviceId(
  devices: readonly MediaDeviceInfo[],
  currentDeviceId: string | null,
  storageKey: string,
): string | null {
  if (currentDeviceId && devices.some((device) => device.deviceId === currentDeviceId)) {
    return currentDeviceId;
  }

  const storedDeviceId = loadStoredInputDeviceId(storageKey);
  if (storedDeviceId && devices.some((device) => device.deviceId === storedDeviceId)) {
    return storedDeviceId;
  }

  const focusriteDevice = devices.find((device) => /scarlett|focusrite/i.test(device.label));
  return focusriteDevice?.deviceId ?? devices[0]?.deviceId ?? null;
}

function loadStoredInputDeviceId(storageKey: string): string | null {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function persistInputDeviceId(storageKey: string, deviceId: string | null): void {
  try {
    if (deviceId) {
      localStorage.setItem(storageKey, deviceId);
    } else {
      localStorage.removeItem(storageKey);
    }
  } catch {
    // Ignore storage failures in restricted environments.
  }
}

export function createAudioController(options: CreateAudioControllerOptions): AudioController {
  const { audioBus, defaultSrc, storageKeyPrefix, onStateChange } = options;

  if (!storageKeyPrefix || storageKeyPrefix.trim().length === 0) {
    throw new Error(
      "[webgpu-motion-audio] createAudioController: storageKeyPrefix is required (non-empty string)",
    );
  }

  const INPUT_DEVICE_STORAGE_KEY = `${storageKeyPrefix}.audio-input-device-id`;

  const audioEl = new Audio();
  audioEl.loop = true;
  audioEl.volume = 0.5;
  audioEl.preload = "auto";
  if (defaultSrc) {
    audioEl.src = defaultSrc;
  }

  let audioEnabled = false;
  let sourceKind: AudioSourceKind = "default_track";
  let currentFileName: string | null = null;
  let currentFileUrl: string | null = null;
  let inputStatus: AudioInputStatus = "idle";
  let inputDevices: AudioInputDevice[] = [];
  let selectedInputDeviceId: string | null = loadStoredInputDeviceId(INPUT_DEVICE_STORAGE_KEY);
  let lastInputLabel = DEFAULT_INPUT_LABEL;
  let inputPermissionGranted = false;

  const mediaDevices = navigator.mediaDevices;
  const inputSupported = !!mediaDevices?.getUserMedia && !!mediaDevices?.enumerateDevices;

  const audioFileInput = document.createElement("input");
  audioFileInput.type = "file";
  audioFileInput.accept = "audio/*";
  audioFileInput.style.display = "none";
  document.body.appendChild(audioFileInput);

  function notifyChange(): void {
    onStateChange?.();
  }

  function revokeBlobUrl(): void {
    if (currentFileUrl) {
      URL.revokeObjectURL(currentFileUrl);
      currentFileUrl = null;
    }
  }

  function setAudioElementSource(kind: "default_track" | "file"): void {
    const nextSrc = kind === "file" && currentFileUrl ? currentFileUrl : defaultSrc;
    if (!nextSrc) {
      // No track configured — stay silent; demo mode covers the silent-time aesthetic.
      audioEl.removeAttribute("src");
      audioEl.load();
      return;
    }
    audioEl.src = nextSrc;
    audioEl.load();
  }

  function buildInputConstraints(deviceId: string | null): MediaStreamConstraints {
    const audio: MediaTrackConstraints = {
      channelCount: { ideal: 1 },
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    };

    if (deviceId) {
      audio.deviceId = { exact: deviceId };
    }

    return { audio };
  }

  function getSourceLabel(): string {
    switch (sourceKind) {
      case "default_track":
        return DEFAULT_TRACK_LABEL;
      case "file":
        return currentFileName ?? DEFAULT_TRACK_LABEL;
      case "input": {
        const selectedDevice = inputDevices.find((device) => device.id === selectedInputDeviceId);
        return selectedDevice?.label ?? lastInputLabel;
      }
    }
  }

  async function refreshInputDevicesInternal(shouldNotify = true): Promise<void> {
    if (!inputSupported || !mediaDevices) {
      inputDevices = [];
      inputStatus = "error";
      if (shouldNotify) {
        notifyChange();
      }
      return;
    }

    try {
      const devices = await mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((device) => device.kind === "audioinput");
      inputPermissionGranted = audioInputs.some((device) => device.label.trim().length > 0)
        || inputStatus === "connected";
      const previousSelectedDeviceId = selectedInputDeviceId;
      const preferredDeviceId = pickPreferredInputDeviceId(
        audioInputs,
        selectedInputDeviceId,
        INPUT_DEVICE_STORAGE_KEY,
      );
      const hasSelectedDevice = !!selectedInputDeviceId
        && audioInputs.some((device) => device.deviceId === selectedInputDeviceId);

      if (!hasSelectedDevice && !(sourceKind === "input" && inputStatus === "connected")) {
        selectedInputDeviceId = preferredDeviceId;
      }

      const markedDeviceId = hasSelectedDevice ? selectedInputDeviceId : preferredDeviceId;
      inputDevices = audioInputs.map((device, index) => ({
        id: device.deviceId,
        label: buildInputLabel(device, index),
        preferred: device.deviceId === markedDeviceId,
      }));

      const selectedDevice = inputDevices.find((device) => device.id === selectedInputDeviceId)
        ?? inputDevices.find((device) => device.id === preferredDeviceId)
        ?? null;

      if (selectedDevice) {
        lastInputLabel = selectedDevice.label;
        if (selectedDevice.id !== previousSelectedDeviceId && !(sourceKind === "input" && inputStatus === "connected")) {
          persistInputDeviceId(INPUT_DEVICE_STORAGE_KEY, selectedDevice.id);
        }
      }

      if (sourceKind === "input" && inputStatus === "connected" && previousSelectedDeviceId && !hasSelectedDevice) {
        audioEnabled = false;
        audioBus.disconnectCurrentSource();
        audioBus.setMode("demo");
        inputStatus = "disconnected";
      }
    } catch {
      inputDevices = [];
      inputPermissionGranted = false;
      if (inputStatus === "connected") {
        audioEnabled = false;
        audioBus.disconnectCurrentSource();
        audioBus.setMode("demo");
      }
      inputStatus = "error";
    }

    if (shouldNotify) {
      notifyChange();
    }
  }

  async function startAudioElementSource(kind: "default_track" | "file"): Promise<boolean> {
    sourceKind = kind;
    setAudioElementSource(kind);

    // No concrete src yet (grid's demo-only flow): keep bus in demo mode and
    // just flip the enabled flag. File / input sources still work normally.
    if (kind === "default_track" && !defaultSrc) {
      audioBus.disconnectCurrentSource();
      audioBus.setMode("demo");
      audioEnabled = true;
      if (inputStatus === "connected") {
        inputStatus = "idle";
      }
      notifyChange();
      return true;
    }

    await audioBus.connectAudioElement(audioEl);
    audioBus.setMode("live");
    await audioEl.play();
    audioEnabled = true;
    if (inputStatus === "connected") {
      inputStatus = "idle";
    }
    notifyChange();
    return true;
  }

  async function startInputSource(): Promise<boolean> {
    if (!inputSupported || !mediaDevices) {
      inputStatus = "error";
      audioEnabled = false;
      notifyChange();
      return false;
    }

    audioEl.pause();
    inputStatus = "requesting";
    notifyChange();

    try {
      const stream = await mediaDevices.getUserMedia(buildInputConstraints(selectedInputDeviceId));
      const [track] = stream.getAudioTracks();
      const resolvedDeviceId = track?.getSettings().deviceId ?? selectedInputDeviceId;

      if (resolvedDeviceId) {
        selectedInputDeviceId = resolvedDeviceId;
        persistInputDeviceId(INPUT_DEVICE_STORAGE_KEY, selectedInputDeviceId);
      }

      if (track?.label?.trim()) {
        lastInputLabel = track.label.trim();
      }

      await audioBus.connectMediaStream(stream, { monitor: false });
      audioBus.setMode("live");
      audioEnabled = true;
      inputStatus = "connected";
      inputPermissionGranted = true;
      await refreshInputDevicesInternal(false);
      notifyChange();
      return true;
    } catch (error) {
      audioEnabled = false;
      audioBus.disconnectCurrentSource();
      audioBus.setMode("demo");
      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError" || error.name === "SecurityError") {
          inputStatus = "blocked";
          inputPermissionGranted = false;
        } else if (error.name === "NotFoundError" || error.name === "OverconstrainedError") {
          inputStatus = "disconnected";
        } else {
          inputStatus = "error";
        }
      } else {
        inputStatus = "error";
      }
      notifyChange();
      return false;
    }
  }

  async function startCurrentSource(): Promise<boolean> {
    if (sourceKind === "input") {
      return startInputSource();
    }

    const elementSourceKind = sourceKind === "file" && currentFileUrl ? "file" : "default_track";
    sourceKind = elementSourceKind;
    return startAudioElementSource(elementSourceKind);
  }

  function stopPlayback(): void {
    audioEl.pause();
    audioBus.disconnectCurrentSource();
    audioBus.setMode("demo");
    audioEnabled = false;
    if (sourceKind === "input" && inputStatus === "connected") {
      inputStatus = "idle";
    }
    notifyChange();
  }

  audioFileInput.addEventListener("change", () => {
    const file = audioFileInput.files?.[0];
    if (!file) {
      return;
    }

    void (async () => {
      revokeBlobUrl();
      currentFileName = file.name;
      currentFileUrl = URL.createObjectURL(file);
      sourceKind = "file";
      await startAudioElementSource("file");
      audioFileInput.value = "";
    })();
  });

  const handleDeviceChange = () => {
    void refreshInputDevicesInternal();
  };

  mediaDevices?.addEventListener?.("devicechange", handleDeviceChange);
  void refreshInputDevicesInternal();

  const controller: AudioController = {
    get enabled() {
      return audioEnabled;
    },
    get sourceKind() {
      return sourceKind;
    },
    get sourceLabel() {
      return getSourceLabel();
    },
    get inputStatus() {
      return inputStatus;
    },
    get inputDevices() {
      return inputDevices;
    },
    get selectedInputDeviceId() {
      return selectedInputDeviceId;
    },
    get inputSupported() {
      return inputSupported;
    },
    get inputPermissionGranted() {
      return inputPermissionGranted;
    },
    async toggle() {
      if (audioEnabled) {
        stopPlayback();
        return;
      }
      await startCurrentSource();
    },
    async selectSource(kind) {
      if (kind === "file" && !currentFileUrl) {
        audioFileInput.click();
        return;
      }

      sourceKind = kind;
      if (kind === "default_track") {
        setAudioElementSource("default_track");
      } else if (kind === "file") {
        setAudioElementSource("file");
      } else if (!inputDevices.length) {
        void refreshInputDevicesInternal(false);
      }

      if (audioEnabled) {
        await startCurrentSource();
        return;
      }

      if (kind !== "input" && inputStatus === "connected") {
        inputStatus = "idle";
      }
      notifyChange();
    },
    async refreshInputDevices() {
      await refreshInputDevicesInternal();
    },
    async selectInputDevice(deviceId) {
      selectedInputDeviceId = deviceId;
      persistInputDeviceId(INPUT_DEVICE_STORAGE_KEY, deviceId);
      const selectedDevice = inputDevices.find((device) => device.id === deviceId);
      if (selectedDevice) {
        lastInputLabel = selectedDevice.label;
      }

      if (sourceKind === "input" && audioEnabled) {
        await startInputSource();
        return;
      }

      notifyChange();
    },
    openFilePicker() {
      audioFileInput.click();
    },
    async resetToDefault() {
      sourceKind = "default_track";
      setAudioElementSource("default_track");
      if (audioEnabled) {
        await startAudioElementSource("default_track");
        return;
      }
      notifyChange();
    },
    destroy() {
      revokeBlobUrl();
      audioEl.pause();
      audioBus.disconnectCurrentSource();
      mediaDevices?.removeEventListener?.("devicechange", handleDeviceChange);
      audioFileInput.remove();
    },
  };

  // Vite HMR: destroy stale controller before this module is replaced.
  // Apps whose `main.ts` re-instantiates the controller on hot-update should
  // register their own `import.meta.hot.dispose(() => controller.destroy())`.
  const maybeHot = (import.meta as unknown as { hot?: { dispose(cb: () => void): void } }).hot;
  maybeHot?.dispose(() => controller.destroy());

  return controller;
}
