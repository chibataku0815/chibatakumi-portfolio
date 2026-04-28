// Scene selector: horizontal chip bar. Clicking a scene chip pins that scene;
// an explicit "AUTO" chip re-enables cycling.

import { createOverlayText } from "webgpu-motion-dom";

export type SceneSelectorItem = {
  readonly id: string;
  readonly label: string;
  readonly hotkey?: string;
};

export type SceneSelectorOptions = {
  readonly parent?: ParentNode;
  readonly items: readonly SceneSelectorItem[];
  readonly autoLabel?: string;
  readonly onPick: (id: string) => void;
  readonly onAuto?: () => void;
};

export type SceneSelectorState = {
  readonly activeId: string;
  readonly autoEnabled: boolean;
};

export type SceneSelector = {
  readonly element: HTMLDivElement;
  readonly autoId: string;
};

const TOKEN = {
  fontMono: "ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

const AUTO_ID = "__auto__";
const stateCache = new WeakMap<HTMLDivElement, string>();

export function createSceneSelector(options: SceneSelectorOptions): SceneSelector {
  const element = createOverlayText({
    parent: options.parent,
    style: {
      position: "fixed",
      top: "16px",
      right: "16px",
      display: "flex",
      gap: "6px",
      flexDirection: "row",
      pointerEvents: "auto",
      userSelect: "none",
    },
  });

  const autoLabel = options.autoLabel ?? "AUTO";

  for (const item of options.items) {
    const button = createChipButton(
      item.hotkey ? `${item.hotkey} ${item.label}` : item.label,
    );
    button.dataset.chipId = item.id;
    button.addEventListener("click", () => {
      options.onPick(item.id);
      button.blur();
    });
    element.appendChild(button);
  }

  const autoButton = createChipButton(autoLabel);
  autoButton.dataset.chipId = AUTO_ID;
  autoButton.addEventListener("click", () => {
    options.onAuto?.();
    autoButton.blur();
  });
  element.appendChild(autoButton);

  return { element, autoId: AUTO_ID };
}

function createChipButton(label: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  Object.assign(button.style, {
    padding: "6px 10px",
    fontFamily: TOKEN.fontMono,
    fontSize: "10px",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "rgba(26,26,26,0.82)",
    background: "rgba(255,255,255,0.62)",
    border: "1px solid rgba(26,26,26,0.16)",
    borderRadius: "2px",
    cursor: "pointer",
    lineHeight: "1",
    boxShadow: "0 1px 0 rgba(255,255,255,0.72)",
  } satisfies Partial<CSSStyleDeclaration>);
  return button;
}

function applyActiveStyle(button: HTMLButtonElement, active: boolean): void {
  if (active) {
    button.style.background = "#1a1a1a";
    button.style.color = "#ffffff";
    button.style.borderColor = "#1a1a1a";
  } else {
    button.style.background = "rgba(255,255,255,0.62)";
    button.style.color = "rgba(26,26,26,0.82)";
    button.style.borderColor = "rgba(26,26,26,0.16)";
  }
}

export function updateSceneSelector(
  selector: SceneSelector,
  state: SceneSelectorState,
): void {
  const sig = `${state.activeId}|${state.autoEnabled ? 1 : 0}`;
  if (stateCache.get(selector.element) === sig) {
    return;
  }
  stateCache.set(selector.element, sig);

  const buttons = selector.element.querySelectorAll<HTMLButtonElement>("button");
  buttons.forEach((btn) => {
    const id = btn.dataset.chipId ?? "";
    if (id === selector.autoId) {
      applyActiveStyle(btn, state.autoEnabled);
    } else {
      applyActiveStyle(btn, !state.autoEnabled && id === state.activeId);
    }
  });
}
