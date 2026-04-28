// Keymap HUD: toggle-visible help overlay listing all keyboard bindings.
// Consumers pass an array of {key, label} pairs at construction time and
// call updateKeymapHud(hud, { visible }) to show/hide.

import { createOverlayText } from "webgpu-motion-dom";

export type KeymapEntry = {
  readonly key: string;
  readonly label: string;
};

export type CreateKeymapHudOptions = {
  readonly parent?: ParentNode;
  readonly entries: readonly KeymapEntry[];
  readonly title?: string;
};

export type KeymapHudState = {
  readonly visible: boolean;
};

export type KeymapHud = {
  readonly element: HTMLDivElement;
};

const TOKEN = {
  fontMono: "ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

export function createKeymapHud(options: CreateKeymapHudOptions): KeymapHud {
  const element = createOverlayText({
    parent: options.parent,
    style: {
      position: "fixed",
      right: "16px",
      bottom: "16px",
      padding: "12px 14px",
      background: "rgba(26,26,26,0.86)",
      border: "1px solid rgba(255,255,255,0.14)",
      borderRadius: "4px",
      color: "rgba(244,244,244,0.92)",
      fontFamily: TOKEN.fontMono,
      fontSize: "11px",
      letterSpacing: "0.04em",
      lineHeight: "1.6",
      pointerEvents: "none",
      userSelect: "none",
      display: "none",
      maxWidth: "min(320px, calc(100vw - 32px))",
    },
  });

  if (options.title) {
    const title = document.createElement("div");
    title.textContent = options.title;
    Object.assign(title.style, {
      fontSize: "10px",
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      opacity: "0.62",
      marginBottom: "6px",
    } satisfies Partial<CSSStyleDeclaration>);
    element.appendChild(title);
  }

  const list = document.createElement("div");
  Object.assign(list.style, {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    columnGap: "12px",
    rowGap: "2px",
  } satisfies Partial<CSSStyleDeclaration>);

  for (const entry of options.entries) {
    const keyEl = document.createElement("span");
    keyEl.textContent = entry.key;
    keyEl.style.fontWeight = "700";
    keyEl.style.opacity = "0.92";

    const labelEl = document.createElement("span");
    labelEl.textContent = entry.label;
    labelEl.style.opacity = "0.72";

    list.append(keyEl, labelEl);
  }

  element.appendChild(list);
  return { element };
}

export function updateKeymapHud(hud: KeymapHud, state: KeymapHudState): void {
  const next = state.visible ? "block" : "none";
  if (hud.element.style.display !== next) {
    hud.element.style.display = next;
  }
}
