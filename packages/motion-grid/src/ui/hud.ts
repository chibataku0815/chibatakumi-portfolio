// motion-grid HUD — Apple Liquid Glass chrome family (parallel to motion-dot/ui/hud.ts).
//
// Layout topology (bottom-right corner, mirror dot):
//   bottom 22px right 22px   → status pill (read-only)
//   bottom 68px right 22px   → control dock (Pattern / Film / Audio / More)
//   bottom 136px right 22px  → touch actions popover (8 secondary actions)
//                            → input popover (text entry, exclusive with actions)
//
// Surfaces register at ROOT only (not per-row / per-button) so the front
// canvas SDF refracts a single rounded rect with proper edge highlight and
// corner micro-specular instead of flat strips. White-ink tokens
// (`rgba(255,255,255,X)`) so refraction stays visible against the light
// substrate; active state uses transparent white overlay (`color-mix` /
// `rgba(255,255,255,0.16)`) so we never punch a black hole through the glass.

import { MAX_HERO_TOKEN_CHARS, MIN_HERO_TOKEN_CHARS } from "../scene/typography/hero-token";

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
// Status Pill (bottom-right, read-only)
// ───────────────────────────────────────────────────────────

export interface GridStatusPillState {
  readonly sceneName: string;
  readonly heroToken: string;
  readonly patternName: string;
  readonly continuityLabel: string;
  readonly phraseName: string;
  readonly stepIndex: number;
  readonly stepCount: number;
  readonly loopEnabled: boolean;
  readonly postEnabled: boolean;
  readonly audioEnabled: boolean;
  readonly audioMode: "demo" | "live";
  readonly trackName: string;
  readonly cycleTime: number;
  readonly cycleDuration: number;
  readonly onsetActivity?: number;
}

export function createGridStatusPill(parent?: ParentNode): HTMLDivElement {
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
    maxWidth: "min(32rem, calc(100vw - 44px))",
  });
  markLiquidGlassControl(root, "control.grid.status", {
    radius: 14,
    intensity: 0.55,
    brightness: 0.78,
  });
  return appendTo(parent, root);
}

export function updateGridStatusPill(
  pill: HTMLDivElement,
  state: GridStatusPillState,
): void {
  const idx = String(state.stepIndex + 1).padStart(2, "0");
  const total = String(state.stepCount).padStart(2, "0");
  const mode = state.postEnabled ? "Film" : "Raw";
  const progress = Math.min(state.cycleTime / Math.max(state.cycleDuration, 0.001), 1);
  const progressPercent = Math.round(progress * 100);

  pill.replaceChildren();
  pill.appendChild(makeSpan(`${idx}/${total}`, "rgba(255,255,255,0.62)"));
  pill.appendChild(makeSeparator());
  pill.appendChild(makeSpan(state.sceneName, "rgba(255,255,255,0.94)"));
  pill.appendChild(makeSeparator());
  pill.appendChild(makeSpan(state.heroToken, "rgba(255,255,255,0.86)"));
  pill.appendChild(makeSeparator());
  pill.appendChild(makeSpan(state.patternName, "rgba(255,255,255,0.78)"));
  pill.appendChild(makeSeparator());
  pill.appendChild(makeSpan(`${progressPercent}%`, "rgba(255,255,255,0.70)"));
  pill.appendChild(makeSeparator());
  pill.appendChild(makeSpan(mode, "rgba(255,255,255,0.78)"));

  if (state.loopEnabled) {
    pill.appendChild(makeSeparator());
    pill.appendChild(makeSpan("Loop", "rgba(255,255,255,0.72)"));
  }

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
}

// ───────────────────────────────────────────────────────────
// Control Dock (bottom-right above pill)
// ───────────────────────────────────────────────────────────

const PATTERN_ICON_SVG =
  '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">'
  + '<path d="M2 8 L6 4 M2 8 L6 12 M2 8 H14 M14 8 L10 4 M14 8 L10 12" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
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

const MORE_ICON_SVG =
  '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">'
  + '<circle cx="3" cy="8" r="1.4" fill="currentColor"/>'
  + '<circle cx="8" cy="8" r="1.4" fill="currentColor"/>'
  + '<circle cx="13" cy="8" r="1.4" fill="currentColor"/>'
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

export interface GridControlDockHandle {
  readonly root: HTMLDivElement;
  readonly patternButton: HTMLButtonElement;
  readonly filmButton: HTMLButtonElement;
  readonly audioButton: HTMLButtonElement;
  readonly moreButton: HTMLButtonElement;
}

export interface GridDockState {
  readonly postEnabled: boolean;
  readonly audioEnabled: boolean;
  readonly actionsPopoverOpen: boolean;
}

export function createGridControlDock(parent?: ParentNode): GridControlDockHandle {
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
  root.setAttribute("aria-label", "Motion grid controls");
  markLiquidGlassControl(root, "control.grid.dock", {
    radius: 22,
    intensity: 0.85,
    brightness: 0.72,
  });

  const patternButton = createDockButton("Pattern", PATTERN_ICON_SVG);
  patternButton.setAttribute(
    "aria-label",
    "Cycle hero word pattern (← / → keys for prev / next)",
  );
  const filmButton = createDockButton("Film", FILM_ICON_SVG);
  filmButton.setAttribute("aria-label", "Toggle film grade (F)");
  const audioButton = createDockButton("Audio", AUDIO_ICON_SVG);
  audioButton.setAttribute("aria-label", "Toggle audio (A)");
  const moreButton = createDockButton("More", MORE_ICON_SVG);
  moreButton.setAttribute("aria-label", "Motion actions (H)");

  root.appendChild(patternButton);
  root.appendChild(filmButton);
  root.appendChild(audioButton);
  root.appendChild(moreButton);

  appendTo(parent, root);
  return { root, patternButton, filmButton, audioButton, moreButton };
}

export function updateGridControlDock(
  dock: GridControlDockHandle,
  state: GridDockState,
): void {
  setDockButtonActive(dock.patternButton, false);
  setDockButtonActive(dock.filmButton, state.postEnabled);
  setDockButtonActive(dock.audioButton, state.audioEnabled);
  setDockButtonActive(dock.moreButton, state.actionsPopoverOpen);
}

// ───────────────────────────────────────────────────────────
// Actions Popover (above dock, secondary actions)
// ───────────────────────────────────────────────────────────

interface ActionDef {
  readonly label: string;
  readonly key: string;
}

const GRID_ACTIONS: Record<string, ActionDef> = {
  prev:        { label: "Prev",       key: "←" },
  next:        { label: "Next",       key: "→" },
  reset:       { label: "Reset",      key: "R" },
  zoomDefault: { label: "1×",         key: "0" },
  loop:        { label: "Loop",       key: "L" },
  continuity:  { label: "Continuity", key: "T" },
  zoomIn:      { label: "Zoom In",    key: "Z" },
  zoomOut:     { label: "Zoom Out",   key: "⇧Z" },
  music:       { label: "Music",      key: "M" },
  input:       { label: "Input",      key: "I" },
  hud:         { label: "HUD",        key: "H" },
};

function createActionButton(action: ActionDef, ariaLabel: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", ariaLabel);
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
    transition: "background 140ms ease, color 140ms ease, border-color 140ms ease, opacity 140ms ease",
  });

  const label = document.createElement("span");
  label.textContent = action.label;
  label.style.whiteSpace = "nowrap";

  const key = document.createElement("kbd");
  key.textContent = action.key;
  applyStyles(key, {
    minWidth: "24px",
    padding: "4px 7px",
    borderRadius: "8px",
    background: "rgba(255,255,255,0.10)",
    color: "rgba(255,255,255,0.74)",
    font: `600 11px/1 ${FONT_MONO}`,
    textAlign: "center",
  });

  button.append(label, key);
  return button;
}

function setActionButtonActive(button: HTMLButtonElement, active: boolean): void {
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

function setActionButtonEnabled(button: HTMLButtonElement, enabled: boolean): void {
  button.disabled = !enabled;
  button.style.opacity = enabled ? "1" : "0.4";
  button.style.cursor = enabled ? "pointer" : "default";
}

export interface GridActionsPopoverHandle {
  readonly root: HTMLDivElement;
  readonly prevButton: HTMLButtonElement;
  readonly nextButton: HTMLButtonElement;
  readonly resetButton: HTMLButtonElement;
  readonly zoomDefaultButton: HTMLButtonElement;
  readonly loopButton: HTMLButtonElement;
  readonly continuityButton: HTMLButtonElement;
  readonly zoomInButton: HTMLButtonElement;
  readonly zoomOutButton: HTMLButtonElement;
  readonly musicButton: HTMLButtonElement;
  readonly inputButton: HTMLButtonElement;
  readonly hudButton: HTMLButtonElement;
}

export interface GridActionsState {
  readonly loopEnabled: boolean;
  readonly continuityEnabled: boolean;
  readonly inputModeActive: boolean;
  readonly hudVisible: boolean;
  readonly canZoomIn: boolean;
  readonly canZoomOut: boolean;
  readonly canResetZoom: boolean;
}

export function createGridActionsPopover(parent?: ParentNode): GridActionsPopoverHandle {
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
  root.setAttribute("aria-label", "Motion grid actions");
  markLiquidGlassControl(root, "control.grid.actions", {
    radius: 20,
    intensity: 0.80,
    brightness: 0.74,
  });

  const prevButton = createActionButton(GRID_ACTIONS.prev, "Previous pattern");
  const nextButton = createActionButton(GRID_ACTIONS.next, "Next pattern");
  const resetButton = createActionButton(GRID_ACTIONS.reset, "Reset scene");
  const zoomDefaultButton = createActionButton(GRID_ACTIONS.zoomDefault, "Reset zoom");
  const loopButton = createActionButton(GRID_ACTIONS.loop, "Toggle phrase loop");
  const continuityButton = createActionButton(
    GRID_ACTIONS.continuity,
    "Toggle continuity mode",
  );
  const zoomInButton = createActionButton(GRID_ACTIONS.zoomIn, "Zoom in");
  const zoomOutButton = createActionButton(GRID_ACTIONS.zoomOut, "Zoom out");
  const musicButton = createActionButton(GRID_ACTIONS.music, "Open audio file picker");
  const inputButton = createActionButton(GRID_ACTIONS.input, "Toggle hero token input");
  const hudButton = createActionButton(GRID_ACTIONS.hud, "Toggle HUD visibility");

  root.append(
    prevButton,
    nextButton,
    resetButton,
    zoomDefaultButton,
    loopButton,
    continuityButton,
    zoomInButton,
    zoomOutButton,
    musicButton,
    inputButton,
    hudButton,
  );

  appendTo(parent, root);
  return {
    root,
    prevButton,
    nextButton,
    resetButton,
    zoomDefaultButton,
    loopButton,
    continuityButton,
    zoomInButton,
    zoomOutButton,
    musicButton,
    inputButton,
    hudButton,
  };
}

export function updateGridActionsPopover(
  popover: GridActionsPopoverHandle,
  state: GridActionsState,
): void {
  setActionButtonActive(popover.loopButton, state.loopEnabled);
  setActionButtonActive(popover.continuityButton, state.continuityEnabled);
  setActionButtonActive(popover.inputButton, state.inputModeActive);
  setActionButtonActive(popover.hudButton, state.hudVisible);
  setActionButtonEnabled(popover.zoomInButton, state.canZoomIn);
  setActionButtonEnabled(popover.zoomOutButton, state.canZoomOut);
  setActionButtonEnabled(popover.zoomDefaultButton, state.canResetZoom);
}

export function setGridActionsPopoverVisibility(
  popover: GridActionsPopoverHandle,
  visible: boolean,
): void {
  popover.root.style.display = visible ? "grid" : "none";
}

// ───────────────────────────────────────────────────────────
// Input Popover (above dock, exclusive with actions)
// ───────────────────────────────────────────────────────────

export interface GridInputPopoverHandle {
  readonly root: HTMLDivElement;
  readonly input: HTMLInputElement;
  readonly applyButton: HTMLButtonElement;
  readonly cancelButton: HTMLButtonElement;
  readonly hintEl: HTMLDivElement;
}

export interface GridInputPopoverState {
  readonly draftToken: string;
  readonly isValid: boolean;
  readonly invalidHint?: string;
}

export function createGridInputPopover(parent?: ParentNode): GridInputPopoverHandle {
  const root = document.createElement("div");
  applyStyles(root, {
    position: "fixed",
    bottom: POPOVER_BOTTOM,
    right: `var(--motion-control-right, ${DOCK_RIGHT_PX}px)`,
    width: "min(330px, calc(100vw - 32px))",
    padding: "16px 18px",
    borderRadius: "20px",
    background: "transparent",
    pointerEvents: "auto",
    userSelect: "none",
    color: "rgba(255,255,255,0.92)",
    font: `400 12px/1.4 ${FONT_STACK}`,
    display: "none",
  });
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-label", "Hero token input");
  markLiquidGlassControl(root, "control.grid.input", {
    radius: 20,
    intensity: 0.80,
    brightness: 0.74,
  });

  const title = document.createElement("div");
  title.textContent = "Hero Token";
  applyStyles(title, {
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.62)",
    marginBottom: "10px",
  });

  const input = document.createElement("input");
  input.type = "text";
  input.inputMode = "text";
  input.autocomplete = "off";
  input.autocapitalize = "characters";
  input.spellcheck = false;
  input.maxLength = MAX_HERO_TOKEN_CHARS;
  input.setAttribute("aria-label", "Hero token text");
  applyStyles(input, {
    width: "100%",
    minHeight: "44px",
    padding: "10px 12px",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.96)",
    font: `600 14px/1 ${FONT_STACK}`,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    outline: "none",
    boxSizing: "border-box",
  });

  const hintEl = document.createElement("div");
  applyStyles(hintEl, {
    marginTop: "8px",
    fontSize: "11px",
    color: "rgba(255,255,255,0.62)",
    lineHeight: "1.4",
    minHeight: "1.4em",
  });

  const buttonRow = document.createElement("div");
  applyStyles(buttonRow, {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginTop: "12px",
  });

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.textContent = "Cancel";
  cancelButton.setAttribute("aria-label", "Cancel input (Escape)");
  applyStyles(cancelButton, {
    minHeight: "44px",
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
    touchAction: "manipulation",
    transition: "background 140ms ease, color 140ms ease",
  });

  const applyButton = document.createElement("button");
  applyButton.type = "button";
  applyButton.textContent = "Apply";
  applyButton.setAttribute("aria-label", "Apply token (Enter)");
  applyStyles(applyButton, {
    minHeight: "44px",
    padding: "10px 12px",
    border: "1px solid rgba(255,255,255,0.36)",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.16)",
    color: "rgba(255,255,255,0.98)",
    font: `600 12px/1 ${FONT_STACK}`,
    letterSpacing: "0.02em",
    cursor: "pointer",
    pointerEvents: "auto",
    userSelect: "none",
    touchAction: "manipulation",
    transition: "background 140ms ease, border-color 140ms ease, opacity 140ms ease",
  });

  buttonRow.append(cancelButton, applyButton);
  root.append(title, input, hintEl, buttonRow);
  appendTo(parent, root);

  return { root, input, applyButton, cancelButton, hintEl };
}

export function updateGridInputPopover(
  popover: GridInputPopoverHandle,
  state: GridInputPopoverState,
): void {
  if (popover.input.value !== state.draftToken) {
    popover.input.value = state.draftToken;
  }
  const hint = state.isValid
    ? `Enter to apply · Esc to cancel · ${MIN_HERO_TOKEN_CHARS}-${MAX_HERO_TOKEN_CHARS} chars`
    : (state.invalidHint
      ?? `${MIN_HERO_TOKEN_CHARS}-${MAX_HERO_TOKEN_CHARS} chars · A-Z 0-9 . space`);
  if (popover.hintEl.textContent !== hint) {
    popover.hintEl.textContent = hint;
  }
  popover.applyButton.disabled = !state.isValid;
  popover.applyButton.style.opacity = state.isValid ? "1" : "0.5";
  popover.applyButton.style.cursor = state.isValid ? "pointer" : "default";
}

export function setGridInputPopoverVisibility(
  popover: GridInputPopoverHandle,
  visible: boolean,
): void {
  popover.root.style.display = visible ? "block" : "none";
  if (visible) {
    queueMicrotask(() => {
      try {
        popover.input.focus({ preventScroll: true });
        popover.input.select?.();
      } catch {
        // ignore — focus may fail if popover removed mid-microtask
      }
    });
  } else {
    try {
      popover.input.blur();
    } catch {
      // ignore
    }
  }
}

// ───────────────────────────────────────────────────────────
// Aggregate visibility (H key — toggles pill + dock; popovers always close)
// ───────────────────────────────────────────────────────────

export interface GridOptionsHandles {
  readonly statusPill: HTMLElement;
  readonly dock: GridControlDockHandle;
  readonly actionsPopover: GridActionsPopoverHandle;
  readonly inputPopover: GridInputPopoverHandle;
}

export function setGridOptionsVisibility(
  handles: GridOptionsHandles,
  visible: boolean,
): void {
  handles.statusPill.style.display = visible ? "inline-flex" : "none";
  handles.dock.root.style.display = visible ? "inline-flex" : "none";
  if (!visible) {
    handles.actionsPopover.root.style.display = "none";
    handles.inputPopover.root.style.display = "none";
  }
}
