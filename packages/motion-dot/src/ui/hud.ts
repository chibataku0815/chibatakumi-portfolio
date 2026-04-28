import type {
  AudioInputDevice,
  AudioInputStatus,
  AudioSourceKind,
} from "webgpu-motion-audio";

export interface StatusPillState {
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

export interface DockState {
  readonly postEnabled: boolean;
  readonly audioPopoverOpen: boolean;
  readonly hotkeysOpen: boolean;
  readonly audioActive: boolean;
}

export interface AudioSettingsPopoverState {
  readonly enabled: boolean;
  readonly sourceKind: AudioSourceKind;
  readonly inputStatus: AudioInputStatus;
  readonly inputDevices: readonly AudioInputDevice[];
  readonly selectedInputDeviceId: string | null;
  readonly inputSupported: boolean;
  readonly inputPermissionGranted: boolean;
}

export interface ControlDockHandle {
  readonly root: HTMLDivElement;
  readonly filmButton: HTMLButtonElement;
  readonly audioButton: HTMLButtonElement;
  readonly moreButton: HTMLButtonElement;
}

export interface AudioSettingsPopover {
  readonly root: HTMLDivElement;
  readonly sourceButtons: Record<AudioSourceKind, HTMLButtonElement>;
  readonly deviceSection: HTMLDivElement;
  readonly deviceSelect: HTMLSelectElement;
  readonly refreshButton: HTMLButtonElement;
  readonly actionButton: HTMLButtonElement;
  readonly statusText: HTMLDivElement;
  readonly detailText: HTMLDivElement;
}

export interface OptionsHandles {
  readonly statusPill: HTMLElement;
  readonly dock: ControlDockHandle;
  readonly hotkeysPopover: HTMLElement;
}

const FONT_STACK =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, system-ui, sans-serif";

// Status pill sits at the bottom edge; dock stacks above it with a 14px gap.
const PILL_BOTTOM_PX = 22;
const PILL_HEIGHT_ESTIMATE_PX = 32;
const STACK_GAP_PX = 14;
const DOCK_BOTTOM_PX = PILL_BOTTOM_PX + PILL_HEIGHT_ESTIMATE_PX + STACK_GAP_PX;
const DOCK_RIGHT_PX = 22;
const DOCK_HEIGHT_ESTIMATE_PX = 56;
const POPOVER_GAP_PX = 12;
const POPOVER_BOTTOM = `${DOCK_BOTTOM_PX + DOCK_HEIGHT_ESTIMATE_PX + POPOVER_GAP_PX}px`;

const HOTKEYS: ReadonlyArray<{ key: string; label: string }> = [
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
];

interface ControlSurfaceOptions {
  readonly radius?: number;
  readonly intensity?: number;
  readonly brightness?: number;
  readonly tint?: string;
}

function markLiquidGlassControl(
  el: HTMLElement,
  id: string,
  opts?: ControlSurfaceOptions,
): void {
  el.dataset.liquidGlassControl = id;
  if (opts?.radius !== undefined) el.dataset.liquidGlassRadius = String(opts.radius);
  if (opts?.intensity !== undefined) el.dataset.liquidGlassIntensity = String(opts.intensity);
  if (opts?.brightness !== undefined) el.dataset.liquidGlassBrightness = String(opts.brightness);
  if (opts?.tint) el.dataset.liquidGlassTint = opts.tint;
}

function applyStyles(el: HTMLElement, styles: Partial<CSSStyleDeclaration>): void {
  Object.assign(el.style, styles);
}

function appendTo<T extends HTMLElement>(parent: ParentNode | undefined, el: T): T {
  if (parent) parent.appendChild(el);
  return el;
}

function makeSpan(text: string, color: string): HTMLSpanElement {
  const span = document.createElement("span");
  span.textContent = text;
  span.style.color = color;
  return span;
}

function makeSeparator(): HTMLSpanElement {
  const span = document.createElement("span");
  span.textContent = "·";
  span.setAttribute("aria-hidden", "true");
  applyStyles(span, {
    color: "rgba(255,255,255,0.40)",
    padding: "0 2px",
  });
  return span;
}

// ───────────────────────────────────────────────────────────
// Status Pill (top-left, read-only)
// ───────────────────────────────────────────────────────────

export function createStatusPill(parent?: ParentNode): HTMLDivElement {
  const root = document.createElement("div");
  applyStyles(root, {
    // Anchored to the bottom-right edge below the control dock — single
    // right column, top-left masthead stays free, transitions like
    // "[Transition] River Flow → Magnet" stay within the right gutter.
    position: "fixed",
    bottom: `var(--motion-hud-bottom, ${PILL_BOTTOM_PX}px)`,
    right: `${DOCK_RIGHT_PX}px`,
    top: "auto",
    left: "auto",
    padding: "8px 14px",
    borderRadius: "14px",
    background: "transparent",
    color: "rgba(255,255,255,0.92)",
    font: `500 12px/1 ${FONT_STACK}`,
    letterSpacing: "0.02em",
    pointerEvents: "none",
    userSelect: "none",
    whiteSpace: "nowrap",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "min(28rem, calc(100vw - 44px))",
  });
  markLiquidGlassControl(root, "control.status", {
    radius: 14,
    intensity: 0.55,
    brightness: 0.78,
  });
  return appendTo(parent, root);
}

export function updateStatusPill(pill: HTMLDivElement, state: StatusPillState): void {
  const idx = String(state.sceneIndex + 1).padStart(2, "0");
  const total = String(state.sceneCount).padStart(2, "0");
  const mode = state.postEnabled ? "Film" : "Raw";

  pill.replaceChildren();
  pill.appendChild(makeSpan(`${idx}/${total}`, "rgba(255,255,255,0.62)"));
  pill.appendChild(makeSeparator());
  pill.appendChild(makeSpan(state.sceneName, "rgba(255,255,255,0.94)"));
  pill.appendChild(makeSeparator());
  pill.appendChild(makeSpan(mode, "rgba(255,255,255,0.78)"));

  if (state.audioEnabled && (state.onsetActivity ?? 0) > 0.4) {
    const beat = document.createElement("span");
    beat.textContent = "●";
    beat.setAttribute("aria-hidden", "true");
    applyStyles(beat, {
      color: "rgba(255,196,61,0.88)",
      fontSize: "9px",
      marginLeft: "4px",
    });
    pill.appendChild(beat);
  }
  if (state.galleryEnabled && state.layoutName) {
    pill.appendChild(makeSeparator());
    pill.appendChild(makeSpan(state.layoutName, "rgba(255,255,255,0.72)"));
  }
  if (state.transitionLabel) {
    pill.appendChild(makeSeparator());
    pill.appendChild(makeSpan(state.transitionLabel, "rgba(255,255,255,0.66)"));
  }
}

// ───────────────────────────────────────────────────────────
// Control Dock (bottom-right, primary actions)
// ───────────────────────────────────────────────────────────

const FILM_ICON_SVG =
  '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">' +
  '<rect x="2" y="3" width="12" height="10" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.3"/>' +
  '<line x1="2" y1="6.4" x2="14" y2="6.4" stroke="currentColor" stroke-width="0.9"/>' +
  '<line x1="2" y1="9.6" x2="14" y2="9.6" stroke="currentColor" stroke-width="0.9"/>' +
  "</svg>";

const AUDIO_ICON_SVG =
  '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">' +
  '<rect x="2.5" y="6.4" width="1.6" height="3.2" rx="0.8" fill="currentColor"/>' +
  '<rect x="6.0" y="3.6" width="1.6" height="8.8" rx="0.8" fill="currentColor"/>' +
  '<rect x="9.5" y="5.2" width="1.6" height="5.6" rx="0.8" fill="currentColor"/>' +
  '<rect x="13.0" y="7.0" width="1.6" height="2.0" rx="0.8" fill="currentColor"/>' +
  "</svg>";

const MORE_ICON_SVG =
  '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">' +
  '<circle cx="3" cy="8" r="1.4" fill="currentColor"/>' +
  '<circle cx="8" cy="8" r="1.4" fill="currentColor"/>' +
  '<circle cx="13" cy="8" r="1.4" fill="currentColor"/>' +
  "</svg>";

function createDockButton(label: string, iconSvg: string): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  applyStyles(btn, {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "9px 14px",
    border: "0",
    borderRadius: "16px",
    background: "transparent",
    color: "rgba(255,255,255,0.82)",
    font: `500 12px/1 ${FONT_STACK}`,
    letterSpacing: "0.02em",
    cursor: "pointer",
    pointerEvents: "auto",
    userSelect: "none",
    transition: "background 140ms ease, color 140ms ease",
  });

  const icon = document.createElement("span");
  icon.innerHTML = iconSvg;
  applyStyles(icon, {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "14px",
    height: "14px",
    flex: "0 0 auto",
  });

  const text = document.createElement("span");
  text.textContent = label;
  text.style.whiteSpace = "nowrap";

  btn.appendChild(icon);
  btn.appendChild(text);

  btn.addEventListener("pointerenter", () => {
    if (btn.dataset.active !== "true") {
      btn.style.color = "rgba(255,255,255,0.96)";
    }
  });
  btn.addEventListener("pointerleave", () => {
    if (btn.dataset.active !== "true") {
      btn.style.color = "rgba(255,255,255,0.82)";
    }
  });

  return btn;
}

function setDockButtonActive(btn: HTMLButtonElement, active: boolean): void {
  btn.dataset.active = active ? "true" : "false";
  btn.setAttribute("aria-pressed", active ? "true" : "false");
  if (active) {
    applyStyles(btn, {
      background: "color-mix(in oklch, white 9%, transparent)",
      color: "rgba(255,255,255,0.98)",
    });
  } else {
    applyStyles(btn, {
      background: "transparent",
      color: "rgba(255,255,255,0.82)",
    });
  }
}

export function createControlDock(parent?: ParentNode): ControlDockHandle {
  const root = document.createElement("div");
  applyStyles(root, {
    position: "fixed",
    bottom: `${DOCK_BOTTOM_PX}px`,
    right: `${DOCK_RIGHT_PX}px`,
    display: "inline-flex",
    alignItems: "center",
    gap: "2px",
    padding: "6px",
    borderRadius: "22px",
    background: "transparent",
    pointerEvents: "auto",
    userSelect: "none",
  });
  root.setAttribute("role", "toolbar");
  root.setAttribute("aria-label", "Motion controls");
  markLiquidGlassControl(root, "control.dock", {
    radius: 22,
    intensity: 0.85,
    brightness: 0.72,
  });

  const filmButton = createDockButton("Film", FILM_ICON_SVG);
  filmButton.setAttribute("aria-label", "Toggle film grade (F)");
  const audioButton = createDockButton("Audio", AUDIO_ICON_SVG);
  audioButton.setAttribute("aria-label", "Audio settings (I)");
  const moreButton = createDockButton("More", MORE_ICON_SVG);
  moreButton.setAttribute("aria-label", "Hotkey reference (H)");

  root.appendChild(filmButton);
  root.appendChild(audioButton);
  root.appendChild(moreButton);

  appendTo(parent, root);
  return { root, filmButton, audioButton, moreButton };
}

export function updateControlDock(dock: ControlDockHandle, state: DockState): void {
  setDockButtonActive(dock.filmButton, state.postEnabled);
  setDockButtonActive(dock.audioButton, state.audioPopoverOpen || state.audioActive);
  setDockButtonActive(dock.moreButton, state.hotkeysOpen);
}

// ───────────────────────────────────────────────────────────
// Hotkey Legend Popover
// ───────────────────────────────────────────────────────────

export function createHotkeyLegendPopover(parent?: ParentNode): HTMLDivElement {
  const root = document.createElement("div");
  applyStyles(root, {
    position: "fixed",
    bottom: POPOVER_BOTTOM,
    right: `${DOCK_RIGHT_PX}px`,
    display: "none",
    gridTemplateColumns: "auto auto",
    columnGap: "20px",
    rowGap: "9px",
    padding: "16px 18px",
    borderRadius: "20px",
    background: "transparent",
    pointerEvents: "none",
    userSelect: "none",
    color: "rgba(255,255,255,0.90)",
    font: `500 12px/1 ${FONT_STACK}`,
  });
  root.setAttribute("role", "list");
  root.setAttribute("aria-label", "Keyboard shortcuts");
  markLiquidGlassControl(root, "control.hotkeys", {
    radius: 20,
    intensity: 0.80,
    brightness: 0.74,
  });

  for (const { key, label } of HOTKEYS) {
    const row = document.createElement("div");
    applyStyles(row, {
      display: "contents",
    });

    const kbd = document.createElement("kbd");
    kbd.textContent = key;
    applyStyles(kbd, {
      display: "inline-flex",
      justifyContent: "center",
      alignItems: "center",
      minWidth: "26px",
      padding: "3px 7px",
      borderRadius: "6px",
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.14)",
      color: "rgba(255,255,255,0.94)",
      font: `500 11px/1.1 ui-monospace, "SF Mono", Menlo, monospace`,
      letterSpacing: "0.04em",
      whiteSpace: "nowrap",
    });

    const labelEl = document.createElement("span");
    labelEl.textContent = label;
    applyStyles(labelEl, {
      alignSelf: "center",
      color: "rgba(255,255,255,0.84)",
      letterSpacing: "0.03em",
    });

    row.appendChild(kbd);
    row.appendChild(labelEl);
    root.appendChild(row);
  }

  return appendTo(parent, root);
}

export function setHotkeyPopoverVisibility(popover: HTMLElement, visible: boolean): void {
  popover.style.display = visible ? "grid" : "none";
}

// ───────────────────────────────────────────────────────────
// Audio Settings Popover (re-skinned glass version of legacy panel)
// ───────────────────────────────────────────────────────────

function createPopoverSectionLabel(text: string): HTMLDivElement {
  const label = document.createElement("div");
  label.textContent = text;
  applyStyles(label, {
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.62)",
  });
  return label;
}

function createSourceButton(text: string): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = text;
  applyStyles(btn, {
    padding: "7px 11px",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.84)",
    font: `600 11px/1 ${FONT_STACK}`,
    letterSpacing: "0.02em",
    cursor: "pointer",
    transition: "background 140ms ease, color 140ms ease, border-color 140ms ease",
  });
  return btn;
}

export function createAudioSettingsPopover(parent?: ParentNode): AudioSettingsPopover {
  const root = document.createElement("div");
  applyStyles(root, {
    position: "fixed",
    bottom: POPOVER_BOTTOM,
    right: `${DOCK_RIGHT_PX}px`,
    width: "min(320px, calc(100vw - 32px))",
    padding: "16px 18px",
    borderRadius: "24px",
    background: "transparent",
    color: "rgba(255,255,255,0.92)",
    font: `400 12px/1.4 ${FONT_STACK}`,
    display: "none",
    pointerEvents: "auto",
  });
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-label", "Audio input settings");
  markLiquidGlassControl(root, "control.audio", {
    radius: 24,
    intensity: 0.90,
    brightness: 0.75,
  });

  const title = document.createElement("div");
  title.textContent = "Audio Input";
  applyStyles(title, {
    fontSize: "13px",
    fontWeight: "600",
    letterSpacing: "0.03em",
    color: "rgba(255,255,255,0.96)",
    marginBottom: "14px",
  });

  const sourceLabel = createPopoverSectionLabel("Source");
  sourceLabel.style.marginBottom = "8px";

  const sourceRow = document.createElement("div");
  applyStyles(sourceRow, {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginBottom: "14px",
  });

  const sourceButtons: Record<AudioSourceKind, HTMLButtonElement> = {
    default_track: createSourceButton("Default"),
    file: createSourceButton("File"),
    input: createSourceButton("Live Input"),
  };
  sourceRow.append(
    sourceButtons.default_track,
    sourceButtons.file,
    sourceButtons.input,
  );

  const deviceSection = document.createElement("div");
  applyStyles(deviceSection, {
    display: "none",
    marginBottom: "12px",
  });

  const deviceLabel = createPopoverSectionLabel("Device");
  deviceLabel.style.marginBottom = "8px";

  const deviceControls = document.createElement("div");
  applyStyles(deviceControls, {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "8px",
    alignItems: "center",
  });

  const deviceSelect = document.createElement("select");
  applyStyles(deviceSelect, {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.94)",
    font: `400 12px/1 ${FONT_STACK}`,
    outline: "none",
  });

  const refreshButton = document.createElement("button");
  refreshButton.type = "button";
  refreshButton.textContent = "Refresh";
  applyStyles(refreshButton, {
    padding: "9px 12px",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.92)",
    font: `600 11px/1 ${FONT_STACK}`,
    letterSpacing: "0.02em",
    cursor: "pointer",
  });

  deviceControls.append(deviceSelect, refreshButton);
  deviceSection.append(deviceLabel, deviceControls);

  const statusText = document.createElement("div");
  applyStyles(statusText, {
    fontSize: "12px",
    color: "rgba(255,255,255,0.78)",
    marginBottom: "8px",
  });

  const detailText = document.createElement("div");
  applyStyles(detailText, {
    fontSize: "11px",
    color: "rgba(255,255,255,0.62)",
    lineHeight: "1.5",
    marginBottom: "12px",
  });

  const actionButton = document.createElement("button");
  actionButton.type = "button";
  actionButton.textContent = "Connect";
  applyStyles(actionButton, {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid rgba(255,255,255,0.20)",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.10)",
    color: "rgba(255,255,255,0.98)",
    font: `600 12px/1 ${FONT_STACK}`,
    letterSpacing: "0.03em",
    cursor: "pointer",
    marginBottom: "10px",
    transition: "background 140ms ease, border-color 140ms ease, opacity 140ms ease",
  });

  const helper = document.createElement("div");
  helper.textContent = "Monitoring is handled outside the browser";
  applyStyles(helper, {
    fontSize: "11px",
    color: "rgba(255,255,255,0.50)",
    lineHeight: "1.5",
  });

  root.append(title, sourceLabel, sourceRow, deviceSection, statusText, detailText, actionButton, helper);
  appendTo(parent, root);

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

function getActionLabel(state: AudioSettingsPopoverState): string {
  if (state.enabled) {
    if (state.sourceKind === "input") return "Disconnect Input";
    if (state.sourceKind === "file") return "Stop File Audio";
    return "Stop Default Track";
  }
  if (state.sourceKind === "input") return "Connect Input";
  if (state.sourceKind === "file") return "Start File Audio";
  return "Start Default Track";
}

function getDetailText(state: AudioSettingsPopoverState): string {
  if (!state.inputSupported) {
    return "This browser cannot capture live audio input.";
  }
  if (state.sourceKind !== "input") {
    return "Choose Live Input to analyze Scarlett or another external interface.";
  }
  if (!state.inputPermissionGranted && state.inputStatus !== "blocked") {
    return "Device names appear only after the browser microphone permission is granted.";
  }
  if (state.inputStatus === "blocked") {
    return "Microphone permission is blocked. Re-enable it in browser site settings, then connect again.";
  }
  if (state.inputStatus === "disconnected") {
    return "The selected input disappeared. Reconnect the interface or pick another device.";
  }
  if (!state.inputDevices.length) {
    return "No browser-visible audio inputs were found. Check macOS Input settings and refresh.";
  }
  return "Use Connect Input to start live analysis from the selected device.";
}

function setSourceButtonState(button: HTMLButtonElement, active: boolean): void {
  if (active) {
    applyStyles(button, {
      background: "rgba(255,255,255,0.18)",
      borderColor: "rgba(255,255,255,0.38)",
      color: "rgba(255,255,255,0.98)",
    });
  } else {
    applyStyles(button, {
      background: "rgba(255,255,255,0.06)",
      borderColor: "rgba(255,255,255,0.14)",
      color: "rgba(255,255,255,0.84)",
    });
  }
}

function buildDeviceSignature(state: AudioSettingsPopoverState): string {
  return state.inputDevices
    .map((device) => `${device.id}:${device.label}:${device.preferred ? 1 : 0}`)
    .join("|");
}

export function updateAudioSettingsPopover(
  popover: AudioSettingsPopover,
  state: AudioSettingsPopoverState,
): void {
  setSourceButtonState(popover.sourceButtons.default_track, state.sourceKind === "default_track");
  setSourceButtonState(popover.sourceButtons.file, state.sourceKind === "file");
  setSourceButtonState(popover.sourceButtons.input, state.sourceKind === "input");
  popover.sourceButtons.input.disabled = !state.inputSupported;
  popover.deviceSection.style.display =
    state.sourceKind === "input" && state.inputPermissionGranted ? "block" : "none";
  popover.refreshButton.disabled = !state.inputSupported;
  popover.statusText.textContent = `Status: ${getStatusLabel(state.inputStatus)}`;
  popover.detailText.textContent = getDetailText(state);
  popover.actionButton.textContent = getActionLabel(state);
  popover.actionButton.disabled = state.sourceKind === "input"
    ? !state.inputSupported || state.inputStatus === "requesting"
    : false;
  popover.actionButton.style.opacity = popover.actionButton.disabled ? "0.5" : "1";
  popover.actionButton.style.cursor = popover.actionButton.disabled ? "default" : "pointer";

  const deviceSignature = buildDeviceSignature(state);
  const selectedValue = state.selectedInputDeviceId ?? "";
  const needsPlaceholder = !state.inputDevices.length
    || (selectedValue !== "" && !state.inputDevices.some((device) => device.id === selectedValue));

  if (
    popover.root.dataset.deviceSignature !== deviceSignature
    || popover.root.dataset.needsPlaceholder !== String(needsPlaceholder)
  ) {
    popover.deviceSelect.replaceChildren();

    if (needsPlaceholder) {
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = state.inputDevices.length
        ? "Selected device unavailable"
        : "No audio inputs found";
      popover.deviceSelect.appendChild(placeholder);
    }

    for (const device of state.inputDevices) {
      const option = document.createElement("option");
      option.value = device.id;
      option.textContent = device.preferred ? `${device.label} (Preferred)` : device.label;
      popover.deviceSelect.appendChild(option);
    }

    popover.root.dataset.deviceSignature = deviceSignature;
    popover.root.dataset.needsPlaceholder = String(needsPlaceholder);
  }

  popover.deviceSelect.disabled = !state.inputSupported || !state.inputDevices.length;
  popover.deviceSelect.value = needsPlaceholder ? "" : selectedValue;
}

export function setAudioSettingsPopoverVisibility(
  popover: AudioSettingsPopover,
  visible: boolean,
): void {
  popover.root.style.display = visible ? "block" : "none";
}

// ───────────────────────────────────────────────────────────
// Aggregate visibility (H key — toggle full options layer)
// ───────────────────────────────────────────────────────────

export function setOptionsVisibility(
  handles: OptionsHandles,
  visible: boolean,
): void {
  handles.statusPill.style.display = visible ? "inline-flex" : "none";
  handles.dock.root.style.display = visible ? "inline-flex" : "none";
  if (!visible) {
    handles.hotkeysPopover.style.display = "none";
  }
}
