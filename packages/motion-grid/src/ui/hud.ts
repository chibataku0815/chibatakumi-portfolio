// HUD, InputOverlay, and ControlCluster for motion-grid — ported verbatim from
// life/output/motion-grid-guided-webgpu/src/ui/hud.ts.
//
// Changed from original:
//   - createHud / createInputOverlay / createControlCluster each accept a
//     `container: HTMLElement` parameter and pass it as `parent` to
//     createOverlayText. This keeps hud.ts free of document.body references
//     and lets mount.ts control where elements are attached (hostOverlay).
//   - Import for MAX_HERO_TOKEN_CHARS / MIN_HERO_TOKEN_CHARS adjusted to
//     relative path from src/ui/ → src/scene/typography/hero-token.
//
// SSR safety: no top-level DOM/window access. All element creation happens
// inside the exported factory functions called from mountMotionGridApp().

import { createOverlayText } from "webgpu-motion-dom";
import { MAX_HERO_TOKEN_CHARS, MIN_HERO_TOKEN_CHARS } from "../scene/typography/hero-token";

// ── Apple Liquid Glass surface marker (parallel to motion-dot/hud.ts) ────────
// Stamp `data-liquid-glass-control` so apps/web/LiquidGlassProvider's
// MutationObserver registers the element as a glass surface and the front-
// chrome compose pass refracts the motion-grid substrate through it.
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

const FONT_STACK =
  'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

export interface HudState {
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

export interface InputOverlayState {
  readonly active: boolean;
  readonly draftToken: string;
  readonly isValid: boolean;
  readonly invalidHint?: string;
}

// Dark-on-glass token set. motion-grid's substrate is dominated by
// near-white #d1d1d1 (the grid lines are thin alpha strokes, so the field
// reads light). White text on a light-refracting glass is invisible — the
// motion-dot pattern (white text on glass) only works because motion-dot's
// dark dot field provides per-pixel contrast under the surface.
//
// On glass over a light substrate the legible choice is dark ink with a
// light text-shadow emboss. Active state stays dark (inverse-style highlight
// matching the original #1a1a1a affordance) — a white overlay would vanish
// against the same light substrate.
const TOKEN = {
  inkOnGlass: "rgba(26,26,26,0.92)",
  inkOnGlassMuted: "rgba(26,26,26,0.66)",
  inkOnGlassActive: "rgba(255,255,255,0.98)",
  inkOnGlassDisabled: "rgba(26,26,26,0.36)",
  inkOnGlassDisabledLabel: "rgba(26,26,26,0.28)",
  bgActiveOverlay: "rgba(26,26,26,0.86)",
  textShadow: "0 1px 0 rgba(255,255,255,0.55)",
  marginCells: 1,
  labelHideBelowCellSize: 20,
  focusRingColor: "rgba(26,26,26,0.55)",
  fontMono: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontStack: FONT_STACK,
} as const;

const overlayTextCache = new WeakMap<HTMLDivElement, string>();

export function createHud(container: HTMLElement): HTMLDivElement {
  // Status pill — top-left, glass surface. `top: 96px` clears the Nav rail
  // (brand pill at top:24, 48×48 → bottom 72, plus 24px breathing room).
  const root = createOverlayText({
    parent: container,
    style: {
      position: "fixed",
      top: "96px",
      left: "24px",
      padding: "10px 18px",
      borderRadius: "14px",
      background: "transparent",
      fontFamily: TOKEN.fontStack,
      fontSize: "12px",
      fontWeight: "500",
      letterSpacing: "0.02em",
      color: TOKEN.inkOnGlass,
      textShadow: TOKEN.textShadow,
      pointerEvents: "none",
      userSelect: "none",
      lineHeight: "1.4",
      whiteSpace: "nowrap",
    },
  });
  markLiquidGlassControl(root, "control.grid.status", {
    radius: 14,
    intensity: 0.55,
    brightness: 0.78,
  });
  return root;
}

export function createInputOverlay(container: HTMLElement): HTMLDivElement {
  // Input overlay — sits below the status pill (96 + ~40 height + 12 gap ≈
  // 148). Same glass parameters as status; revealed via display flip.
  const root = createOverlayText({
    parent: container,
    style: {
      position: "fixed",
      top: "148px",
      left: "24px",
      minWidth: "min(320px, calc(100vw - 48px))",
      maxWidth: "min(420px, calc(100vw - 48px))",
      padding: "12px 18px",
      borderRadius: "14px",
      background: "transparent",
      fontFamily: TOKEN.fontStack,
      fontSize: "12px",
      letterSpacing: "0.02em",
      color: TOKEN.inkOnGlass,
      textShadow: TOKEN.textShadow,
      pointerEvents: "none",
      userSelect: "none",
      lineHeight: "1.45",
      whiteSpace: "pre-line",
      display: "none",
    },
  });
  markLiquidGlassControl(root, "control.grid.input", {
    radius: 14,
    intensity: 0.55,
    brightness: 0.78,
  });
  return root;
}

export function updateInputOverlay(overlay: HTMLDivElement, state: InputOverlayState): void {
  const nextDisplay = state.active ? "block" : "none";
  if (overlay.style.display !== nextDisplay) {
    overlay.style.display = nextDisplay;
  }
  if (!state.active) {
    if (overlayTextCache.get(overlay) !== "") {
      overlay.textContent = "";
      overlayTextCache.set(overlay, "");
    }
    return;
  }

  const hintLine = state.isValid
    ? "Enter confirm  |  Esc cancel  |  Backspace delete"
    : `Enter confirm  |  Esc cancel  |  Backspace delete\n${state.invalidHint ?? `${MIN_HERO_TOKEN_CHARS}-${MAX_HERO_TOKEN_CHARS} chars, A-Z 0-9 . space`}`;

  const nextText = `INPUT\n${state.draftToken || ""}\n${hintLine}`;
  if (overlayTextCache.get(overlay) !== nextText) {
    overlay.textContent = nextText;
    overlayTextCache.set(overlay, nextText);
  }
}

export function updateHud(hud: HTMLDivElement, state: HudState): void {
  const postLabel = state.postEnabled ? "Film ON" : "Raw";
  const loopLabel = state.loopEnabled ? "Loop ON" : "Loop OFF";
  const progress = Math.min(state.cycleTime / Math.max(state.cycleDuration, 0.001), 1);
  const progressPercent = Math.round(progress * 100);
  const beatChar = (state.onsetActivity ?? 0) > 0.3 ? "●" : "○";
  const audioLabel = state.audioEnabled
    ? `  |  ${beatChar} ${state.audioMode === "demo" ? "Demo" : state.trackName}`
    : "";
  const nextText =
    `${state.sceneName}  |  ${postLabel}  |  ${loopLabel}  |  ${state.continuityLabel}  |  ${state.heroToken}  |  ${state.patternName}  |  ${state.phraseName} `
    + `(${state.stepIndex + 1}/${state.stepCount})  |  ${progressPercent}%${audioLabel}`;
  if (overlayTextCache.get(hud) !== nextText) {
    hud.textContent = nextText;
    overlayTextCache.set(hud, nextText);
  }
}

export interface ControlChipDef {
  readonly key: string;
  readonly label: string;
  readonly cellsWide?: number;
  readonly onClick: (event: MouseEvent) => void;
}

export interface ControlChipState {
  readonly active?: boolean;
  readonly enabled?: boolean;
}

export interface ControlCluster {
  readonly element: HTMLDivElement;
  updateChip(key: string, state: ControlChipState): void;
  setVisible(visible: boolean): void;
  setMetrics(cellSize: number, rightPx: number, bottomPx: number): void;
}

interface ChipRecord {
  readonly button: HTMLButtonElement;
  readonly keyEl: HTMLSpanElement;
  readonly labelEl: HTMLSpanElement;
  readonly cellsWide: number;
  active: boolean;
  enabled: boolean;
}

export function createControlCluster(
  container: HTMLElement,
  rows: readonly (readonly ControlChipDef[])[],
): ControlCluster {
  const element = createOverlayText({
    parent: container,
    style: {
      position: "fixed",
      right: "24px",
      bottom: "24px",
      padding: "10px 14px",
      borderRadius: "18px",
      background: "transparent",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      gap: "6px",
      pointerEvents: "auto",
      userSelect: "none",
      transition: "opacity 160ms ease-out",
    },
  });
  markLiquidGlassControl(element, "control.grid.cluster", {
    radius: 18,
    intensity: 0.75,
    brightness: 0.74,
  });

  const chips = new Map<string, ChipRecord>();
  let lastRight = -1;
  let lastBottom = -1;
  let lastCellSize = -1;

  for (const row of rows) {
    const rowEl = document.createElement("div");
    Object.assign(rowEl.style, {
      display: "flex",
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "stretch",
    } satisfies Partial<CSSStyleDeclaration>);
    for (const def of row) {
      const record = createChip(def);
      chips.set(def.key, record);
      rowEl.appendChild(record.button);
    }
    element.appendChild(rowEl);
  }

  function applyChipVisualState(record: ChipRecord): void {
    if (!record.enabled) {
      record.button.style.cursor = "default";
      record.keyEl.style.background = "transparent";
      record.keyEl.style.color = TOKEN.inkOnGlassDisabled;
      record.labelEl.style.color = TOKEN.inkOnGlassDisabledLabel;
      record.button.disabled = true;
      return;
    }
    record.button.style.cursor = "pointer";
    record.button.disabled = false;
    if (record.active) {
      // Active state on glass — semi-transparent white overlay, brighter ink.
      // Avoids opaque dark backgrounds that would punch a hole through the
      // glass refraction.
      record.keyEl.style.background = TOKEN.bgActiveOverlay;
      record.keyEl.style.color = TOKEN.inkOnGlassActive;
      record.labelEl.style.color = TOKEN.inkOnGlass;
    } else {
      record.keyEl.style.background = "transparent";
      record.keyEl.style.color = TOKEN.inkOnGlass;
      record.labelEl.style.color = TOKEN.inkOnGlassMuted;
    }
  }

  return {
    element,
    updateChip(key, state) {
      const record = chips.get(key);
      if (!record) return;
      let changed = false;
      if (state.active !== undefined && state.active !== record.active) {
        record.active = state.active;
        changed = true;
      }
      if (state.enabled !== undefined && state.enabled !== record.enabled) {
        record.enabled = state.enabled;
        changed = true;
      }
      if (!changed) {
        return;
      }
      applyChipVisualState(record);
    },
    setVisible(visible) {
      const nextOpacity = visible ? "1" : "0";
      const nextPointerEvents = visible ? "auto" : "none";
      if (element.style.opacity !== nextOpacity) {
        element.style.opacity = nextOpacity;
      }
      if (element.style.pointerEvents !== nextPointerEvents) {
        element.style.pointerEvents = nextPointerEvents;
      }
    },
    setMetrics(cellSize, rightPx, bottomPx) {
      const cs = Math.max(Math.round(cellSize), 1);
      if (cs !== lastCellSize) {
        const keyPx = cs >= 24 ? 11 : 10;
        const labelPx = cs >= 24 ? 10 : 9;
        const showLabels = cs >= TOKEN.labelHideBelowCellSize;
        for (const record of chips.values()) {
          const chipW = record.cellsWide * cs;
          record.button.style.width = `${chipW}px`;
          record.button.style.height = `${cs}px`;
          record.keyEl.style.width = `${cs}px`;
          record.keyEl.style.height = `${cs}px`;
          record.keyEl.style.fontSize = `${keyPx}px`;
          record.labelEl.style.fontSize = `${labelPx}px`;
          record.labelEl.style.display = showLabels ? "" : "none";
        }
        lastCellSize = cs;
      }
      const r = Math.round(rightPx);
      const b = Math.round(bottomPx);
      if (r !== lastRight) {
        element.style.right = `${r}px`;
        lastRight = r;
      }
      if (b !== lastBottom) {
        element.style.bottom = `${b}px`;
        lastBottom = b;
      }
    },
  };
}

function createChip(def: ControlChipDef): ChipRecord {
  const cellsWide = def.cellsWide ?? 3;
  const button = document.createElement("button");
  button.type = "button";
  Object.assign(button.style, {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "0",
    margin: "0",
    boxSizing: "border-box",
    borderRadius: "0",
    background: "transparent",
    border: "none",
    boxShadow: "none",
    color: TOKEN.inkOnGlass,
    cursor: "pointer",
    fontFamily: TOKEN.fontStack,
    outline: "none",
    textAlign: "left",
    overflow: "hidden",
  } satisfies Partial<CSSStyleDeclaration>);

  const keyEl = document.createElement("span");
  Object.assign(keyEl.style, {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: "0",
    boxSizing: "border-box",
    fontFamily: TOKEN.fontMono,
    fontWeight: "700",
    lineHeight: "1",
    color: TOKEN.inkOnGlass,
    background: "transparent",
  } satisfies Partial<CSSStyleDeclaration>);
  keyEl.textContent = def.key;

  const labelEl = document.createElement("span");
  Object.assign(labelEl.style, {
    flex: "1",
    padding: "0 0 0 4px",
    fontFamily: TOKEN.fontStack,
    fontWeight: "500",
    letterSpacing: "0.04em",
    lineHeight: "1",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    overflow: "hidden",
    color: TOKEN.inkOnGlassMuted,
  } satisfies Partial<CSSStyleDeclaration>);
  labelEl.textContent = def.label;

  button.append(keyEl, labelEl);

  const record: ChipRecord = { button, keyEl, labelEl, cellsWide, active: false, enabled: true };

  button.addEventListener("focus", () => {
    if (button.matches(":focus-visible")) {
      button.style.outline = `1px dashed ${TOKEN.focusRingColor}`;
      button.style.outlineOffset = "-1px";
    }
  });
  button.addEventListener("blur", () => {
    button.style.outline = "none";
  });
  button.addEventListener("click", (event) => {
    def.onClick(event);
    button.blur();
  });

  return record;
}
