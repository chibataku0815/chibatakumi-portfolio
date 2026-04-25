import {
  createHotkeyLegend as createHotkeyLegendPrimitive,
  createOverlayText,
  createPillButton,
  setGroupVisibility,
  setVisibility,
} from "webgpu-motion-dom";
import type {
  AudioInputDevice,
  AudioInputStatus,
  AudioSourceKind,
} from "webgpu-motion-audio";

export interface HudState {
  readonly sceneName: string;
  readonly sceneIndex: number;
  readonly sceneCount: number;
  readonly postEnabled: boolean;
  readonly audioEnabled: boolean;
  readonly audioSourceLabel: string;
  readonly transitionLabel: string;
  readonly galleryEnabled: boolean;
  readonly layoutName: string;
  readonly onsetActivity?: number;
}

export interface AudioSettingsButtonState {
  readonly enabled: boolean;
  readonly panelOpen: boolean;
  readonly sourceLabel: string;
}

export interface AudioSettingsPanelState {
  readonly enabled: boolean;
  readonly sourceKind: AudioSourceKind;
  readonly inputStatus: AudioInputStatus;
  readonly inputDevices: readonly AudioInputDevice[];
  readonly selectedInputDeviceId: string | null;
  readonly inputSupported: boolean;
  readonly inputPermissionGranted: boolean;
}

export interface AudioSettingsPanel {
  readonly root: HTMLDivElement;
  readonly sourceButtons: Record<AudioSourceKind, HTMLButtonElement>;
  readonly deviceSection: HTMLDivElement;
  readonly deviceSelect: HTMLSelectElement;
  readonly refreshButton: HTMLButtonElement;
  readonly actionButton: HTMLButtonElement;
  readonly statusText: HTMLDivElement;
  readonly detailText: HTMLDivElement;
}

export function createHud(): HTMLDivElement {
  return createOverlayText({
    style: {
      position: "fixed",
      top: "16px",
      left: "16px",
      fontFamily: "system-ui, sans-serif",
      fontSize: "13px",
      color: "#555",
      pointerEvents: "none",
      userSelect: "none",
      lineHeight: "1.6",
    },
  });
}

export function createFilmToggleButton(): HTMLButtonElement {
  return createPillButton({
    style: {
      position: "fixed",
      top: "16px",
      right: "16px",
      border: "1px solid rgba(255,255,255,0.18)",
      background: "rgba(24,24,24,0.78)",
      color: "#f3f3f3",
      padding: "10px 14px",
      fontFamily: "system-ui, sans-serif",
      fontSize: "12px",
      fontWeight: "600",
      letterSpacing: "0.03em",
      backdropFilter: "blur(10px)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
    },
  });
}

export function createAudioSettingsButton(): HTMLButtonElement {
  return createPillButton({
    style: {
      position: "fixed",
      top: "64px",
      right: "16px",
      border: "1px solid rgba(255,255,255,0.18)",
      background: "rgba(24,24,24,0.78)",
      color: "#f3f3f3",
      padding: "10px 14px",
      fontFamily: "system-ui, sans-serif",
      fontSize: "12px",
      fontWeight: "600",
      letterSpacing: "0.03em",
      backdropFilter: "blur(10px)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
    },
  });
}

function createPanelSectionLabel(text: string): HTMLDivElement {
  const label = document.createElement("div");
  label.textContent = text;
  label.style.fontSize = "10px";
  label.style.fontWeight = "700";
  label.style.letterSpacing = "0.08em";
  label.style.textTransform = "uppercase";
  label.style.color = "rgba(255,255,255,0.62)";
  return label;
}

function createSourceButton(text: string): HTMLButtonElement {
  return createPillButton({
    textContent: text,
    style: {
      padding: "7px 10px",
      border: "1px solid rgba(255,255,255,0.14)",
      background: "rgba(255,255,255,0.06)",
      color: "rgba(255,255,255,0.84)",
      fontFamily: "system-ui, sans-serif",
      fontSize: "11px",
      fontWeight: "600",
      letterSpacing: "0.03em",
      boxShadow: "none",
    },
  });
}

export function createAudioSettingsPanel(): AudioSettingsPanel {
  const root = createOverlayText({
    style: {
      position: "fixed",
      top: "112px",
      right: "16px",
      width: "min(320px, calc(100vw - 32px))",
      padding: "14px",
      borderRadius: "18px",
      border: "1px solid rgba(255,255,255,0.14)",
      background: "rgba(18,18,18,0.82)",
      color: "#f3f3f3",
      fontFamily: "system-ui, sans-serif",
      boxShadow: "0 18px 48px rgba(0,0,0,0.32)",
      backdropFilter: "blur(16px)",
      display: "none",
      zIndex: "10",
    },
  });

  const title = document.createElement("div");
  title.textContent = "Audio Input";
  title.style.fontSize = "13px";
  title.style.fontWeight = "700";
  title.style.letterSpacing = "0.04em";
  title.style.marginBottom = "12px";

  const sourceLabel = createPanelSectionLabel("Source");
  sourceLabel.style.marginBottom = "8px";

  const sourceRow = document.createElement("div");
  sourceRow.style.display = "flex";
  sourceRow.style.flexWrap = "wrap";
  sourceRow.style.gap = "8px";
  sourceRow.style.marginBottom = "14px";

  const sourceButtons: Record<AudioSourceKind, HTMLButtonElement> = {
    default_track: createSourceButton("Default Track"),
    file: createSourceButton("File"),
    input: createSourceButton("Audio Input"),
  };
  sourceRow.append(
    sourceButtons.default_track,
    sourceButtons.file,
    sourceButtons.input,
  );

  const deviceSection = document.createElement("div");
  deviceSection.style.display = "none";
  deviceSection.style.marginBottom = "12px";

  const deviceLabel = createPanelSectionLabel("Device");
  deviceLabel.style.marginBottom = "8px";

  const deviceControls = document.createElement("div");
  deviceControls.style.display = "grid";
  deviceControls.style.gridTemplateColumns = "1fr auto";
  deviceControls.style.gap = "8px";
  deviceControls.style.alignItems = "center";

  const deviceSelect = document.createElement("select");
  deviceSelect.style.width = "100%";
  deviceSelect.style.padding = "10px 12px";
  deviceSelect.style.borderRadius = "12px";
  deviceSelect.style.border = "1px solid rgba(255,255,255,0.14)";
  deviceSelect.style.background = "rgba(255,255,255,0.06)";
  deviceSelect.style.color = "#f3f3f3";
  deviceSelect.style.fontFamily = "system-ui, sans-serif";
  deviceSelect.style.fontSize = "12px";
  deviceSelect.style.outline = "none";

  const refreshButton = createPillButton({
    textContent: "Refresh",
    style: {
      padding: "10px 12px",
      border: "1px solid rgba(255,255,255,0.14)",
      background: "rgba(255,255,255,0.06)",
      color: "#f3f3f3",
      fontFamily: "system-ui, sans-serif",
      fontSize: "11px",
      fontWeight: "600",
      letterSpacing: "0.03em",
      boxShadow: "none",
    },
  });

  deviceControls.append(deviceSelect, refreshButton);
  deviceSection.append(deviceLabel, deviceControls);

  const statusText = document.createElement("div");
  statusText.style.fontSize = "12px";
  statusText.style.color = "rgba(255,255,255,0.76)";
  statusText.style.marginBottom = "8px";

  const actionButton = createPillButton({
    textContent: "Connect",
    style: {
      width: "100%",
      padding: "10px 12px",
      marginBottom: "10px",
      border: "1px solid rgba(255,255,255,0.18)",
      background: "rgba(255,255,255,0.12)",
      color: "#fff",
      fontFamily: "system-ui, sans-serif",
      fontSize: "12px",
      fontWeight: "700",
      letterSpacing: "0.03em",
      boxShadow: "none",
    },
  });

  const detailText = document.createElement("div");
  detailText.style.fontSize = "11px";
  detailText.style.color = "rgba(255,255,255,0.62)";
  detailText.style.lineHeight = "1.5";
  detailText.style.marginBottom = "10px";

  const helper = document.createElement("div");
  helper.textContent = "Monitoring is handled outside the browser";
  helper.style.fontSize = "11px";
  helper.style.color = "rgba(255,255,255,0.52)";
  helper.style.lineHeight = "1.5";

  root.append(title, sourceLabel, sourceRow, deviceSection, statusText, detailText, actionButton, helper);

  return {
    root,
    sourceButtons,
    deviceSection,
    deviceSelect,
    refreshButton,
    actionButton,
    statusText,
    detailText,
  };
}

export function createHotkeyLegend(): HTMLDivElement {
  return createHotkeyLegendPrimitive([
    { key: "← →", label: "Scene" },
    { key: "0", label: "Single" },
    { key: "H", label: "Options" },
    { key: "R", label: "Reset" },
    { key: "F", label: "Film" },
    { key: "T", label: "Transit" },
    { key: "A", label: "Audio" },
    { key: "D", label: "Gallery" },
    { key: "I", label: "Panel" },
    { key: "M", label: "File" },
  ], {
    containerStyle: {
      position: "fixed",
      right: "16px",
      bottom: "16px",
      justifyContent: "flex-end",
      maxWidth: "min(420px, calc(100vw - 32px))",
      fontFamily: "system-ui, sans-serif",
      fontSize: "11px",
      color: "rgba(255,255,255,0.9)",
      pointerEvents: "none",
      userSelect: "none",
    },
    chipStyle: {
      padding: "8px 10px",
      borderRadius: "999px",
      background: "rgba(20,20,20,0.7)",
      border: "1px solid rgba(255,255,255,0.14)",
      boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
      backdropFilter: "blur(10px)",
    },
    keyStyle: {
      fontSize: "11px",
      fontWeight: "700",
      padding: "4px 7px",
      borderRadius: "999px",
      background: "rgba(255,255,255,0.12)",
      color: "#fff",
    },
    labelStyle: {
      letterSpacing: "0.04em",
    },
  });
}

export function updateHud(hud: HTMLDivElement, state: HudState): void {
  const postLabel = state.postEnabled ? "Film ON" : "Raw";
  const galleryLabel = state.galleryEnabled ? ` | Gallery [${state.layoutName}]` : "";
  const beatChar = (state.onsetActivity ?? 0) > 0.3 ? "\u25CF" : "\u25CB";
  const audioLabel = state.audioEnabled ? ` | ${beatChar} ${state.audioSourceLabel}` : "";
  const transitionPart = state.transitionLabel ? `  \u2014  ${state.transitionLabel}` : "";
  hud.textContent = `[${state.sceneIndex + 1}/${state.sceneCount}] ${state.sceneName}  \u2014  ${postLabel}${galleryLabel}${audioLabel}${transitionPart}  \u2014  \u2190 \u2192 switch | 0 single | H options | R reset | F film | D gallery | A audio | I panel | M file | W text`;
}

export function updateFilmToggleButton(button: HTMLButtonElement, postEnabled: boolean): void {
  button.textContent = postEnabled ? "Film: ON (F)" : "Film: OFF (F)";
  button.style.background = postEnabled ? "rgba(36,36,36,0.86)" : "rgba(24,24,24,0.78)";
  button.style.borderColor = postEnabled ? "rgba(255,255,255,0.36)" : "rgba(255,255,255,0.18)";
}

export function updateAudioSettingsButton(
  button: HTMLButtonElement,
  state: AudioSettingsButtonState,
): void {
  button.textContent = state.enabled ? `Audio Panel: ${state.sourceLabel}` : "Audio Panel (I)";
  button.style.background = state.panelOpen ? "rgba(38,38,38,0.88)" : "rgba(24,24,24,0.78)";
  button.style.borderColor = state.panelOpen ? "rgba(255,255,255,0.32)" : "rgba(255,255,255,0.18)";
}

function getStatusLabel(status: AudioInputStatus): string {
  switch (status) {
    case "idle":
      return "Idle";
    case "requesting":
      return "Requesting permission";
    case "connected":
      return "Connected";
    case "blocked":
      return "Blocked";
    case "disconnected":
      return "Disconnected";
    case "error":
      return "Error";
  }
}

function getActionLabel(state: AudioSettingsPanelState): string {
  if (state.enabled) {
    if (state.sourceKind === "input") {
      return "Disconnect Input";
    }
    if (state.sourceKind === "file") {
      return "Stop File Audio";
    }
    return "Stop Default Track";
  }

  if (state.sourceKind === "input") {
    return "Connect Input";
  }
  if (state.sourceKind === "file") {
    return "Start File Audio";
  }
  return "Start Default Track";
}

function getDetailText(state: AudioSettingsPanelState): string {
  if (!state.inputSupported) {
    return "This browser cannot capture live audio input.";
  }

  if (state.sourceKind !== "input") {
    return "Choose Audio Input to analyze Scarlett or another external interface.";
  }

  if (!state.inputPermissionGranted && state.inputStatus !== "blocked") {
    return "Device names such as Scarlett Solo appear only after the browser microphone permission is granted.";
  }

  if (state.inputStatus === "blocked") {
    return "Microphone permission is blocked. Re-enable it in the browser site settings, then connect again.";
  }

  if (state.inputStatus === "disconnected") {
    return "The selected input disappeared. Reconnect the interface or pick another device.";
  }

  if (!state.inputDevices.length) {
    return "No browser-visible audio inputs were found. Check macOS Input settings and then refresh.";
  }

  return "Use Connect Input to start live analysis from the selected device.";
}

function setSourceButtonState(button: HTMLButtonElement, active: boolean): void {
  button.style.background = active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)";
  button.style.borderColor = active ? "rgba(255,255,255,0.36)" : "rgba(255,255,255,0.14)";
  button.style.color = active ? "#fff" : "rgba(255,255,255,0.84)";
}

function buildDeviceSignature(state: AudioSettingsPanelState): string {
  return state.inputDevices
    .map((device) => `${device.id}:${device.label}:${device.preferred ? 1 : 0}`)
    .join("|");
}

export function updateAudioSettingsPanel(
  panel: AudioSettingsPanel,
  state: AudioSettingsPanelState,
): void {
  setSourceButtonState(panel.sourceButtons.default_track, state.sourceKind === "default_track");
  setSourceButtonState(panel.sourceButtons.file, state.sourceKind === "file");
  setSourceButtonState(panel.sourceButtons.input, state.sourceKind === "input");
  panel.sourceButtons.input.disabled = !state.inputSupported;
  panel.deviceSection.style.display = state.sourceKind === "input" && state.inputPermissionGranted ? "block" : "none";
  panel.refreshButton.disabled = !state.inputSupported;
  panel.statusText.textContent = `Status: ${getStatusLabel(state.inputStatus)}`;
  panel.detailText.textContent = getDetailText(state);
  panel.actionButton.textContent = getActionLabel(state);
  panel.actionButton.disabled = state.sourceKind === "input"
    ? !state.inputSupported || state.inputStatus === "requesting"
    : false;
  panel.actionButton.style.opacity = panel.actionButton.disabled ? "0.5" : "1";
  panel.actionButton.style.cursor = panel.actionButton.disabled ? "default" : "pointer";

  const deviceSignature = buildDeviceSignature(state);
  const selectedValue = state.selectedInputDeviceId ?? "";
  const needsPlaceholder = !state.inputDevices.length
    || (selectedValue !== "" && !state.inputDevices.some((device) => device.id === selectedValue));

  if (panel.root.dataset.deviceSignature !== deviceSignature || panel.root.dataset.needsPlaceholder !== String(needsPlaceholder)) {
    panel.deviceSelect.replaceChildren();

    if (needsPlaceholder) {
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = state.inputDevices.length ? "Selected device unavailable" : "No audio inputs found";
      panel.deviceSelect.appendChild(placeholder);
    }

    for (const device of state.inputDevices) {
      const option = document.createElement("option");
      option.value = device.id;
      option.textContent = device.preferred ? `${device.label} (Preferred)` : device.label;
      panel.deviceSelect.appendChild(option);
    }

    panel.root.dataset.deviceSignature = deviceSignature;
    panel.root.dataset.needsPlaceholder = String(needsPlaceholder);
  }

  panel.deviceSelect.disabled = !state.inputSupported || !state.inputDevices.length;
  panel.deviceSelect.value = needsPlaceholder ? "" : selectedValue;
}

export function setOptionsVisibility(
  filmButton: HTMLButtonElement,
  audioButton: HTMLButtonElement,
  legend: HTMLDivElement,
  visible: boolean,
): void {
  setGroupVisibility([filmButton, audioButton, { element: legend, display: "flex" }], visible);
}

export function setAudioSettingsPanelVisibility(
  panel: AudioSettingsPanel,
  visible: boolean,
): void {
  setVisibility(panel.root, visible);
}
