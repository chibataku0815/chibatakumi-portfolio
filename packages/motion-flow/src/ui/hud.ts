// motion-flow HUD — Apple Liquid Glass chrome family (parallel to motion-dot/ui/hud.ts).
//
// Layout topology (bottom-right corner, mirror dot):
//   bottom 22px right 22px   → status pill (read-only)
//   bottom 68px right 22px   → control dock (Scene / Reseed / Film / Audio / Help)
//   bottom 136px right 22px  → scene popover  (auto + scene picker)
//                            → audio popover  (4-bar meter + connect)
//                            → help popover   (keymap entries)
//
// Three popovers are mutually exclusive — only one open at a time. Surfaces
// register at root only (never per-button) so the front-canvas SDF refracts
// a single rounded rect with proper edge highlight and corner micro-specular.
// All tokens are white-ink (`rgba(255,255,255,X)`); active state is a
// transparent white overlay (`color-mix(in oklch, white 9%, transparent)` or
// `rgba(255,255,255,0.16)`) so we never punch a black hole through the glass.

import type { AudioMeterReading } from "webgpu-motion-ui";
import type { KeymapEntry } from "webgpu-motion-ui";

const FONT_STACK =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, system-ui, sans-serif";
const FONT_MONO = 'ui-monospace, "SF Mono", Menlo, monospace';

const PILL_BOTTOM_PX = 22;
const PILL_HEIGHT_ESTIMATE_PX = 32;
const STACK_GAP_PX = 14;
const DOCK_BOTTOM_PX = PILL_BOTTOM_PX + PILL_HEIGHT_ESTIMATE_PX + STACK_GAP_PX;
const DOCK_RIGHT_PX = 22;
const DOCK_HEIGHT_ESTIMATE_PX = 56;
const POPOVER_GAP_PX = 12;
const POPOVER_BOTTOM = `calc(var(--motion-control-bottom, ${DOCK_BOTTOM_PX}px) + ${DOCK_HEIGHT_ESTIMATE_PX + POPOVER_GAP_PX}px)`;

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
// Status Pill (bottom-right)
// ───────────────────────────────────────────────────────────

export interface FlowStatusPillState {
  readonly sceneName: string;
  readonly sceneIndex: number;
  readonly sceneCount: number;
  readonly autoEnabled: boolean;
  readonly filmEnabled: boolean;
  readonly audioEnabled: boolean;
  readonly audioSourceLabel: string;
  readonly onsetActivity: number;
}

export function createFlowStatusPill(parent?: ParentNode): HTMLDivElement {
  const root = document.createElement("div");
  applyStyles(root, {
    position: "fixed",
    bottom: `var(--motion-hud-bottom, ${PILL_BOTTOM_PX}px)`,
    right: `var(--motion-control-right, ${DOCK_RIGHT_PX}px)`,
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
  markLiquidGlassControl(root, "control.flow.status", {
    radius: 14,
    intensity: 0.55,
    brightness: 0.78,
  });
  return appendTo(parent, root);
}

export function updateFlowStatusPill(
  pill: HTMLDivElement,
  state: FlowStatusPillState,
): void {
  const idx = String(state.sceneIndex + 1).padStart(2, "0");
  const total = String(state.sceneCount).padStart(2, "0");
  const mode = state.filmEnabled ? "Film" : "Raw";

  pill.replaceChildren();
  pill.appendChild(makeSpan(`${idx}/${total}`, "rgba(255,255,255,0.62)"));
  pill.appendChild(makeSeparator());
  pill.appendChild(makeSpan(state.sceneName, "rgba(255,255,255,0.94)"));
  pill.appendChild(makeSeparator());
  pill.appendChild(makeSpan(state.autoEnabled ? "Auto" : "Pin", "rgba(255,255,255,0.72)"));
  pill.appendChild(makeSeparator());
  pill.appendChild(makeSpan(mode, "rgba(255,255,255,0.78)"));

  if (state.audioEnabled) {
    pill.appendChild(makeSeparator());
    pill.appendChild(makeSpan(state.audioSourceLabel || "Audio", "rgba(255,255,255,0.72)"));
    if (state.onsetActivity > 0.4) {
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
  }
}

// ───────────────────────────────────────────────────────────
// Control Dock (bottom-right above pill)
// ───────────────────────────────────────────────────────────

const SCENE_ICON_SVG =
  '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">'
  + '<rect x="2" y="2.5" width="5" height="5" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/>'
  + '<rect x="9" y="2.5" width="5" height="5" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/>'
  + '<rect x="2" y="8.5" width="5" height="5" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/>'
  + '<rect x="9" y="8.5" width="5" height="5" rx="1" fill="currentColor"/>'
  + "</svg>";

const RESEED_ICON_SVG =
  '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">'
  + '<path d="M3 8 A5 5 0 1 1 5 12.5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>'
  + '<path d="M2 6 L3 8 L5 7" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>'
  + "</svg>";

const FILM_ICON_SVG =
  '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">'
  + '<rect x="2" y="3" width="12" height="10" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.3"/>'
  + '<line x1="2" y1="6.4" x2="14" y2="6.4" stroke="currentColor" stroke-width="0.9"/>'
  + '<line x1="2" y1="9.6" x2="14" y2="9.6" stroke="currentColor" stroke-width="0.9"/>'
  + "</svg>";

const AUDIO_ICON_SVG =
  '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">'
  + '<rect x="2.5" y="6.4" width="1.6" height="3.2" rx="0.8" fill="currentColor"/>'
  + '<rect x="6.0" y="3.6" width="1.6" height="8.8" rx="0.8" fill="currentColor"/>'
  + '<rect x="9.5" y="5.2" width="1.6" height="5.6" rx="0.8" fill="currentColor"/>'
  + '<rect x="13.0" y="7.0" width="1.6" height="2.0" rx="0.8" fill="currentColor"/>'
  + "</svg>";

const HELP_ICON_SVG =
  '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">'
  + '<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.3"/>'
  + '<path d="M6.2 6.4 A1.8 1.8 0 1 1 8 8.2 V9.4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>'
  + '<circle cx="8" cy="11.6" r="0.7" fill="currentColor"/>'
  + "</svg>";

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

export interface FlowControlDockHandle {
  readonly root: HTMLDivElement;
  readonly sceneButton: HTMLButtonElement;
  readonly reseedButton: HTMLButtonElement;
  readonly filmButton: HTMLButtonElement;
  readonly audioButton: HTMLButtonElement;
  readonly helpButton: HTMLButtonElement;
}

export interface FlowDockState {
  readonly scenePopoverOpen: boolean;
  readonly filmEnabled: boolean;
  readonly audioEnabled: boolean;
  readonly audioPopoverOpen: boolean;
  readonly helpPopoverOpen: boolean;
}

export function createFlowControlDock(parent?: ParentNode): FlowControlDockHandle {
  const root = document.createElement("div");
  applyStyles(root, {
    position: "fixed",
    bottom: `var(--motion-control-bottom, ${DOCK_BOTTOM_PX}px)`,
    right: `var(--motion-control-right, ${DOCK_RIGHT_PX}px)`,
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
  root.setAttribute("aria-label", "Motion flow controls");
  markLiquidGlassControl(root, "control.flow.dock", {
    radius: 22,
    intensity: 0.85,
    brightness: 0.72,
  });

  const sceneButton = createDockButton("Scene", SCENE_ICON_SVG);
  sceneButton.setAttribute("aria-label", "Pick scene (1-7 keys, 0 for auto)");
  const reseedButton = createDockButton("Reseed", RESEED_ICON_SVG);
  reseedButton.setAttribute("aria-label", "Reseed trails (R)");
  const filmButton = createDockButton("Film", FILM_ICON_SVG);
  filmButton.setAttribute("aria-label", "Toggle film grade (F)");
  const audioButton = createDockButton("Audio", AUDIO_ICON_SVG);
  audioButton.setAttribute("aria-label", "Audio settings (A)");
  const helpButton = createDockButton("Help", HELP_ICON_SVG);
  helpButton.setAttribute("aria-label", "Keyboard shortcuts (?)");

  root.appendChild(sceneButton);
  root.appendChild(reseedButton);
  root.appendChild(filmButton);
  root.appendChild(audioButton);
  root.appendChild(helpButton);

  appendTo(parent, root);
  return { root, sceneButton, reseedButton, filmButton, audioButton, helpButton };
}

export function updateFlowControlDock(
  dock: FlowControlDockHandle,
  state: FlowDockState,
): void {
  setDockButtonActive(dock.sceneButton, state.scenePopoverOpen);
  setDockButtonActive(dock.reseedButton, false);
  setDockButtonActive(dock.filmButton, state.filmEnabled);
  setDockButtonActive(dock.audioButton, state.audioEnabled || state.audioPopoverOpen);
  setDockButtonActive(dock.helpButton, state.helpPopoverOpen);
}

// ───────────────────────────────────────────────────────────
// Scene Popover (auto + scene picker)
// ───────────────────────────────────────────────────────────

function createSceneButton(label: string, hotkey: string | undefined): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  applyStyles(button, {
    minHeight: "44px",
    minWidth: "44px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "10px 12px",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.90)",
    font: `600 12px/1 ${FONT_STACK}`,
    letterSpacing: "0.02em",
    cursor: "pointer",
    pointerEvents: "auto",
    userSelect: "none",
    transition: "background 140ms ease, color 140ms ease, border-color 140ms ease",
    textAlign: "left",
  });

  const labelEl = document.createElement("span");
  labelEl.textContent = label;
  labelEl.style.whiteSpace = "nowrap";
  labelEl.style.overflow = "hidden";
  labelEl.style.textOverflow = "ellipsis";
  button.appendChild(labelEl);

  if (hotkey) {
    const key = document.createElement("kbd");
    key.textContent = hotkey;
    applyStyles(key, {
      minWidth: "24px",
      padding: "4px 7px",
      borderRadius: "8px",
      background: "rgba(255,255,255,0.10)",
      color: "rgba(255,255,255,0.74)",
      font: `600 11px/1 ${FONT_MONO}`,
      textAlign: "center",
      flex: "0 0 auto",
    });
    button.appendChild(key);
  }

  return button;
}

function setSceneButtonActive(button: HTMLButtonElement, active: boolean): void {
  button.setAttribute("aria-pressed", active ? "true" : "false");
  if (active) {
    applyStyles(button, {
      background: "rgba(255,255,255,0.16)",
      borderColor: "rgba(255,255,255,0.36)",
      color: "rgba(255,255,255,0.98)",
    });
  } else {
    applyStyles(button, {
      background: "rgba(255,255,255,0.05)",
      borderColor: "rgba(255,255,255,0.14)",
      color: "rgba(255,255,255,0.90)",
    });
  }
}

export interface FlowSceneItem {
  readonly id: string;
  readonly label: string;
  readonly hotkey?: string;
}

export interface FlowScenePopoverHandle {
  readonly root: HTMLDivElement;
  readonly autoButton: HTMLButtonElement;
  readonly sceneButtons: ReadonlyMap<string, HTMLButtonElement>;
}

export interface FlowSceneState {
  readonly autoEnabled: boolean;
  readonly activeId: string;
}

export function createFlowScenePopover(
  scenes: readonly FlowSceneItem[],
  parent?: ParentNode,
): FlowScenePopoverHandle {
  const root = document.createElement("div");
  applyStyles(root, {
    position: "fixed",
    bottom: POPOVER_BOTTOM,
    right: `var(--motion-control-right, ${DOCK_RIGHT_PX}px)`,
    display: "none",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "8px",
    width: "min(330px, calc(100vw - 32px))",
    maxHeight: "calc(var(--vvh, 100dvh) - var(--safe-top) - var(--safe-bottom) - 160px)",
    overflowY: "auto",
    padding: "14px",
    borderRadius: "20px",
    background: "transparent",
    pointerEvents: "auto",
    userSelect: "none",
    color: "rgba(255,255,255,0.90)",
    font: `500 12px/1 ${FONT_STACK}`,
  });
  root.setAttribute("role", "group");
  root.setAttribute("aria-label", "Scene picker");
  markLiquidGlassControl(root, "control.flow.scenes", {
    radius: 20,
    intensity: 0.80,
    brightness: 0.74,
  });

  const autoButton = createSceneButton("Auto cycle", "0");
  autoButton.style.gridColumn = "1 / -1";
  autoButton.setAttribute("aria-label", "Resume auto-cycle (0)");
  root.appendChild(autoButton);

  const sceneButtons = new Map<string, HTMLButtonElement>();
  for (const scene of scenes) {
    const btn = createSceneButton(scene.label, scene.hotkey);
    btn.dataset.sceneId = scene.id;
    btn.setAttribute("aria-label", `${scene.label}${scene.hotkey ? ` (${scene.hotkey})` : ""}`);
    sceneButtons.set(scene.id, btn);
    root.appendChild(btn);
  }

  appendTo(parent, root);
  return { root, autoButton, sceneButtons };
}

export function updateFlowScenePopover(
  popover: FlowScenePopoverHandle,
  state: FlowSceneState,
): void {
  setSceneButtonActive(popover.autoButton, state.autoEnabled);
  for (const [id, btn] of popover.sceneButtons.entries()) {
    setSceneButtonActive(btn, !state.autoEnabled && id === state.activeId);
  }
}

export function setFlowScenePopoverVisibility(
  popover: FlowScenePopoverHandle,
  visible: boolean,
): void {
  popover.root.style.display = visible ? "grid" : "none";
}

// ───────────────────────────────────────────────────────────
// Audio Popover (4-bar meter + connect)
// ───────────────────────────────────────────────────────────

const METER_FIELD_LABELS: Record<string, string> = {
  bass: "Bass",
  mid: "Mid",
  treble: "Treble",
  energy: "Energy",
  bassOnset: "Bass Onset",
  midOnset: "Mid Onset",
  trebleOnset: "Trebl Onset",
  globalOnset: "Onset",
  intensity: "Intensity",
};

interface MeterRow {
  readonly fillEl: HTMLDivElement;
  readonly valueEl: HTMLSpanElement;
  lastQuantum: number;
}

function createMeterRow(key: string): { row: HTMLDivElement; meter: MeterRow } {
  const row = document.createElement("div");
  applyStyles(row, {
    display: "grid",
    gridTemplateColumns: "72px 1fr 36px",
    alignItems: "center",
    gap: "8px",
    minHeight: "18px",
  });

  const labelEl = document.createElement("span");
  labelEl.textContent = METER_FIELD_LABELS[key] ?? key;
  applyStyles(labelEl, {
    color: "rgba(255,255,255,0.74)",
    font: `600 10px/1 ${FONT_STACK}`,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  });

  const barTrack = document.createElement("div");
  applyStyles(barTrack, {
    position: "relative",
    height: "4px",
    borderRadius: "2px",
    background: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  });

  const fillEl = document.createElement("div");
  applyStyles(fillEl, {
    position: "absolute",
    inset: "0 100% 0 0",
    background: "rgba(255,255,255,0.78)",
    borderRadius: "2px",
    transition: "right 140ms ease",
  });
  barTrack.appendChild(fillEl);

  const valueEl = document.createElement("span");
  applyStyles(valueEl, {
    color: "rgba(255,255,255,0.66)",
    font: `500 10px/1 ${FONT_MONO}`,
    textAlign: "right",
  });
  valueEl.textContent = "0.00";

  row.append(labelEl, barTrack, valueEl);

  return { row, meter: { fillEl, valueEl, lastQuantum: -1 } };
}

export interface FlowAudioPopoverHandle {
  readonly root: HTMLDivElement;
  readonly connectButton: HTMLButtonElement;
  readonly trackLabelEl: HTMLDivElement;
  readonly meterRows: ReadonlyMap<string, MeterRow>;
}

export interface FlowAudioPopoverState {
  readonly enabled: boolean;
  readonly sourceLabel: string;
}

const FLOW_METER_FIELDS = ["bass", "energy", "trebleOnset", "intensity"] as const;

export function createFlowAudioPopover(parent?: ParentNode): FlowAudioPopoverHandle {
  const root = document.createElement("div");
  applyStyles(root, {
    position: "fixed",
    bottom: POPOVER_BOTTOM,
    right: `var(--motion-control-right, ${DOCK_RIGHT_PX}px)`,
    width: "min(330px, calc(100vw - 32px))",
    padding: "16px 18px",
    borderRadius: "24px",
    background: "transparent",
    color: "rgba(255,255,255,0.92)",
    font: `400 12px/1.4 ${FONT_STACK}`,
    display: "none",
    pointerEvents: "auto",
  });
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-label", "Audio settings");
  markLiquidGlassControl(root, "control.flow.audio", {
    radius: 24,
    intensity: 0.90,
    brightness: 0.75,
  });

  const title = document.createElement("div");
  title.textContent = "Audio";
  applyStyles(title, {
    fontSize: "13px",
    fontWeight: "600",
    letterSpacing: "0.03em",
    color: "rgba(255,255,255,0.96)",
    marginBottom: "4px",
  });

  const trackLabelEl = document.createElement("div");
  applyStyles(trackLabelEl, {
    fontSize: "11px",
    color: "rgba(255,255,255,0.62)",
    marginBottom: "14px",
    minHeight: "1.4em",
  });

  const meterContainer = document.createElement("div");
  applyStyles(meterContainer, {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "16px",
  });

  const meterRows = new Map<string, MeterRow>();
  for (const key of FLOW_METER_FIELDS) {
    const { row, meter } = createMeterRow(key);
    meterContainer.appendChild(row);
    meterRows.set(key, meter);
  }

  const connectButton = document.createElement("button");
  connectButton.type = "button";
  connectButton.textContent = "Connect";
  applyStyles(connectButton, {
    width: "100%",
    minHeight: "44px",
    padding: "10px 12px",
    border: "1px solid rgba(255,255,255,0.20)",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.10)",
    color: "rgba(255,255,255,0.98)",
    font: `600 12px/1 ${FONT_STACK}`,
    letterSpacing: "0.03em",
    cursor: "pointer",
    pointerEvents: "auto",
    userSelect: "none",
    touchAction: "manipulation",
    transition: "background 140ms ease, border-color 140ms ease",
  });
  connectButton.setAttribute("aria-label", "Toggle audio (A)");

  root.append(title, trackLabelEl, meterContainer, connectButton);
  appendTo(parent, root);

  return { root, connectButton, trackLabelEl, meterRows };
}

function readMeterValue(reading: AudioMeterReading, key: string): number {
  switch (key) {
    case "intensity":   return reading.intensity;
    case "bass":        return reading.bands.bass;
    case "mid":         return reading.bands.mid;
    case "treble":      return reading.bands.treble;
    case "energy":      return reading.bands.energy;
    case "bassOnset":   return reading.onsets.bassOnset;
    case "midOnset":    return reading.onsets.midOnset;
    case "trebleOnset": return reading.onsets.trebleOnset;
    case "globalOnset": return reading.onsets.globalOnset;
    default:            return 0;
  }
}

export function updateFlowAudioPopover(
  popover: FlowAudioPopoverHandle,
  state: FlowAudioPopoverState,
  reading: AudioMeterReading,
): void {
  popover.trackLabelEl.textContent = state.enabled
    ? `Source: ${state.sourceLabel || "Default"}`
    : "Audio is off — tap Connect to enable.";

  popover.connectButton.textContent = state.enabled ? "Disconnect" : "Connect";
  if (state.enabled) {
    applyStyles(popover.connectButton, {
      background: "rgba(255,255,255,0.16)",
      borderColor: "rgba(255,255,255,0.36)",
    });
  } else {
    applyStyles(popover.connectButton, {
      background: "rgba(255,255,255,0.10)",
      borderColor: "rgba(255,255,255,0.20)",
    });
  }

  for (const [key, meter] of popover.meterRows.entries()) {
    const value = Math.max(0, Math.min(1, readMeterValue(reading, key)));
    const quantum = Math.round(value * 100);
    if (quantum !== meter.lastQuantum) {
      meter.fillEl.style.right = `${100 - quantum}%`;
      meter.valueEl.textContent = value.toFixed(2);
      meter.lastQuantum = quantum;
    }
  }
}

export function setFlowAudioPopoverVisibility(
  popover: FlowAudioPopoverHandle,
  visible: boolean,
): void {
  popover.root.style.display = visible ? "block" : "none";
}

// ───────────────────────────────────────────────────────────
// Help Popover (keymap entries)
// ───────────────────────────────────────────────────────────

export interface FlowHelpPopoverHandle {
  readonly root: HTMLDivElement;
}

export function createFlowHelpPopover(
  entries: readonly KeymapEntry[],
  parent?: ParentNode,
): FlowHelpPopoverHandle {
  const root = document.createElement("div");
  applyStyles(root, {
    position: "fixed",
    bottom: POPOVER_BOTTOM,
    right: `var(--motion-control-right, ${DOCK_RIGHT_PX}px)`,
    width: "min(330px, calc(100vw - 32px))",
    padding: "16px 18px",
    borderRadius: "20px",
    background: "transparent",
    color: "rgba(255,255,255,0.92)",
    font: `400 12px/1.4 ${FONT_STACK}`,
    display: "none",
    pointerEvents: "auto",
    userSelect: "none",
  });
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-label", "Keyboard shortcuts");
  markLiquidGlassControl(root, "control.flow.help", {
    radius: 20,
    intensity: 0.80,
    brightness: 0.74,
  });

  const title = document.createElement("div");
  title.textContent = "Keyboard Shortcuts";
  applyStyles(title, {
    fontSize: "13px",
    fontWeight: "600",
    letterSpacing: "0.03em",
    color: "rgba(255,255,255,0.96)",
    marginBottom: "12px",
  });

  const list = document.createElement("div");
  applyStyles(list, {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  });

  for (const entry of entries) {
    const row = document.createElement("div");
    applyStyles(row, {
      display: "grid",
      gridTemplateColumns: "1fr auto",
      gap: "12px",
      alignItems: "center",
    });

    const labelEl = document.createElement("span");
    labelEl.textContent = entry.label;
    applyStyles(labelEl, {
      color: "rgba(255,255,255,0.86)",
      font: `500 12px/1.2 ${FONT_STACK}`,
    });

    const keyEl = document.createElement("kbd");
    keyEl.textContent = entry.key;
    applyStyles(keyEl, {
      minWidth: "30px",
      padding: "4px 8px",
      borderRadius: "8px",
      background: "rgba(255,255,255,0.10)",
      color: "rgba(255,255,255,0.78)",
      font: `600 11px/1 ${FONT_MONO}`,
      textAlign: "center",
    });

    row.append(labelEl, keyEl);
    list.appendChild(row);
  }

  root.append(title, list);
  appendTo(parent, root);

  return { root };
}

export function setFlowHelpPopoverVisibility(
  popover: FlowHelpPopoverHandle,
  visible: boolean,
): void {
  popover.root.style.display = visible ? "block" : "none";
}

// ───────────────────────────────────────────────────────────
// Aggregate visibility (pill + dock; popovers always close when hidden)
// ───────────────────────────────────────────────────────────

export interface FlowOptionsHandles {
  readonly statusPill: HTMLElement;
  readonly dock: FlowControlDockHandle;
  readonly scenePopover: FlowScenePopoverHandle;
  readonly audioPopover: FlowAudioPopoverHandle;
  readonly helpPopover: FlowHelpPopoverHandle;
}

export function setFlowOptionsVisibility(
  handles: FlowOptionsHandles,
  visible: boolean,
): void {
  handles.statusPill.style.display = visible ? "inline-flex" : "none";
  handles.dock.root.style.display = visible ? "inline-flex" : "none";
  if (!visible) {
    handles.scenePopover.root.style.display = "none";
    handles.audioPopover.root.style.display = "none";
    handles.helpPopover.root.style.display = "none";
  }
}
