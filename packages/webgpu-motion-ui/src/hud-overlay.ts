// Compact HUD overlay: top-left multi-line text panel with cached textContent
// writes. Consumers build an array of label/value pairs; the overlay renders
// them as " LABEL  value  |  LABEL  value …" style lines.

import { createOverlayText } from "webgpu-motion-dom";

export type HudLine = {
  readonly label: string;
  readonly value: string;
};

export type HudOverlay = {
  readonly element: HTMLDivElement;
};

export type CreateHudOverlayOptions = {
  readonly parent?: ParentNode;
  readonly position?: {
    readonly top?: string;
    readonly left?: string;
    readonly right?: string;
    readonly bottom?: string;
  };
};

const cache = new WeakMap<HTMLDivElement, string>();

export function createHudOverlay(options: CreateHudOverlayOptions = {}): HudOverlay {
  const pos = options.position ?? { top: "16px", left: "16px" };
  const element = createOverlayText({
    parent: options.parent,
    style: {
      position: "fixed",
      top: pos.top ?? "",
      left: pos.left ?? "",
      right: pos.right ?? "",
      bottom: pos.bottom ?? "",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: "11px",
      letterSpacing: "0.04em",
      color: "rgba(26,26,26,0.82)",
      pointerEvents: "none",
      userSelect: "none",
      lineHeight: "1.55",
      whiteSpace: "pre",
      textShadow: "0 1px 0 rgba(255,255,255,0.72)",
    },
  });
  return { element };
}

export function updateHudOverlay(
  overlay: HudOverlay,
  lines: readonly HudLine[],
): void {
  const text = lines
    .map((line) => `${line.label.padEnd(6, " ")} ${line.value}`)
    .join("\n");
  if (cache.get(overlay.element) === text) {
    return;
  }
  overlay.element.textContent = text;
  cache.set(overlay.element, text);
}
