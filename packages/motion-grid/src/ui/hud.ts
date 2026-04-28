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

const TOKEN = {
  ink: "#1a1a1a",
  paper: "#D1D1D1",
  inkInverse: "#D1D1D1",
  bg: "rgba(255,255,255,0.62)",
  bgActive: "#1a1a1a",
  divider: "rgba(26,26,26,0.16)",
  radius: "2px",
  marginCells: 1,
  labelHideBelowCellSize: 20,
  disabledLabelColor: "rgba(26,26,26,0.40)",
  focusRingColor: "rgba(26,26,26,0.40)",
  fontMono: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontStack: "system-ui, sans-serif",
} as const;

const overlayTextCache = new WeakMap<HTMLDivElement, string>();

export function createHud(container: HTMLElement): HTMLDivElement {
  return createOverlayText({
    parent: container,
    style: {
      position: "fixed",
      top: "16px",
      left: "16px",
      fontFamily: TOKEN.fontStack,
      fontSize: "12px",
      letterSpacing: "0.02em",
      color: "#444",
      pointerEvents: "none",
      userSelect: "none",
      lineHeight: "1.55",
    },
  });
}

export function createInputOverlay(container: HTMLElement): HTMLDivElement {
  return createOverlayText({
    parent: container,
    style: {
      position: "fixed",
      top: "72px",
      left: "16px",
      minWidth: "min(320px, calc(100vw - 32px))",
      maxWidth: "min(420px, calc(100vw - 32px))",
      padding: "10px 12px",
      borderRadius: TOKEN.radius,
      background: TOKEN.bg,
      border: `1px solid ${TOKEN.divider}`,
      fontFamily: TOKEN.fontStack,
      fontSize: "12px",
      letterSpacing: "0.02em",
      color: TOKEN.ink,
      pointerEvents: "none",
      userSelect: "none",
      lineHeight: "1.45",
      whiteSpace: "pre-line",
      display: "none",
    },
  });
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
      right: "0px",
      bottom: "0px",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      pointerEvents: "auto",
      userSelect: "none",
      transition: "opacity 160ms ease-out",
    },
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
      record.keyEl.style.color = TOKEN.ink;
      record.labelEl.style.color = TOKEN.disabledLabelColor;
      record.button.disabled = true;
      return;
    }
    record.button.style.cursor = "pointer";
    record.button.disabled = false;
    if (record.active) {
      record.keyEl.style.background = TOKEN.bgActive;
      record.keyEl.style.color = TOKEN.inkInverse;
      record.labelEl.style.color = TOKEN.ink;
    } else {
      record.keyEl.style.background = "transparent";
      record.keyEl.style.color = TOKEN.ink;
      record.labelEl.style.color = TOKEN.ink;
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
    color: TOKEN.ink,
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
    color: TOKEN.ink,
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
    color: TOKEN.ink,
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
