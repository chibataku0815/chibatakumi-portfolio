// Shared audio type surface for the WebGPU motion suite.

export interface AudioBands {
  bass: number;    // 0-1 (43-215Hz)
  mid: number;     // 0-1 (215-1982Hz)
  treble: number;  // 0-1 (1982-6030Hz)
  energy: number;  // 0-1 (RMS across all bins)
}

export interface OnsetBands {
  bassOnset: number;    // 0-1 impulse, decays after kick/bass hit
  midOnset: number;     // 0-1 impulse for snare/vocal transients
  trebleOnset: number;  // 0-1 impulse for hi-hat/cymbal hits
  globalOnset: number;  // 0-1 combined onset strength
}

/**
 * The 9 canon audio inputs available to `defineAudioWiring`.
 * Exactly one of these is bound to each `P` (param) — 1 input = 1 param.
 */
export type AudioInput =
  | "bass"
  | "mid"
  | "treble"
  | "energy"
  | "bassOnset"
  | "midOnset"
  | "trebleOnset"
  | "globalOnset"
  | "intensity";

export type AudioSourceKind = "default_track" | "file" | "input";

export type AudioInputStatus =
  | "idle"
  | "requesting"
  | "connected"
  | "blocked"
  | "error"
  | "disconnected";

export interface AudioInputDevice {
  readonly id: string;
  readonly label: string;
  readonly preferred: boolean;
}

export interface AudioController {
  readonly enabled: boolean;
  readonly sourceKind: AudioSourceKind;
  readonly sourceLabel: string;
  readonly inputStatus: AudioInputStatus;
  readonly inputDevices: readonly AudioInputDevice[];
  readonly selectedInputDeviceId: string | null;
  readonly inputSupported: boolean;
  readonly inputPermissionGranted: boolean;
  toggle(): Promise<void>;
  selectSource(kind: AudioSourceKind): Promise<void>;
  refreshInputDevices(): Promise<void>;
  selectInputDevice(deviceId: string): Promise<void>;
  openFilePicker(): void;
  resetToDefault(): Promise<void>;
  destroy(): void;
}
