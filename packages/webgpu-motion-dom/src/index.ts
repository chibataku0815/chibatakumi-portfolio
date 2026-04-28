type StyleMap = Partial<CSSStyleDeclaration>;

function applyStyles<T extends HTMLElement>(element: T, style?: StyleMap): T {
  if (style) {
    Object.assign(element.style, style);
  }

  return element;
}

function appendToParent<T extends HTMLElement>(element: T, parent?: ParentNode): T {
  (parent ?? document.body).appendChild(element);
  return element;
}

export interface OverlayElementOptions {
  parent?: ParentNode;
  className?: string;
  textContent?: string;
  style?: StyleMap;
}

export interface PillButtonOptions extends OverlayElementOptions {
  type?: HTMLButtonElement["type"];
}

export interface HotkeyLegendItem {
  key: string;
  label: string;
}

export interface HotkeyLegendOptions {
  parent?: ParentNode;
  containerStyle?: StyleMap;
  chipStyle?: StyleMap;
  keyStyle?: StyleMap;
  labelStyle?: StyleMap;
}

export interface VisibilityTarget {
  element: HTMLElement;
  display?: string;
}

export type VisibilityInput = HTMLElement | VisibilityTarget;

export interface KeyBinding {
  key?: string;
  code?: string;
  shiftKey?: boolean;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  handler(event: KeyboardEvent): void | Promise<void>;
}

export interface KeymapOptions {
  target?: Window | Document | HTMLElement;
  eventType?: "keydown" | "keyup";
  ignoreRepeat?: boolean;
  ignoreSystemModifiers?: boolean;
}

export function createOverlayRoot(options: OverlayElementOptions = {}): HTMLDivElement {
  const element = document.createElement("div");
  if (options.className) {
    element.className = options.className;
  }
  if (options.textContent) {
    element.textContent = options.textContent;
  }
  return appendToParent(applyStyles(element, options.style), options.parent);
}

export function createOverlayText(options: OverlayElementOptions = {}): HTMLDivElement {
  return createOverlayRoot(options);
}

export function createPillButton(options: PillButtonOptions = {}): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = options.type ?? "button";
  if (options.className) {
    button.className = options.className;
  }
  if (options.textContent) {
    button.textContent = options.textContent;
  }

  return appendToParent(
    applyStyles(button, {
      borderRadius: "999px",
      cursor: "pointer",
      ...options.style,
    }),
    options.parent,
  );
}

export function createHotkeyLegend(
  items: readonly HotkeyLegendItem[],
  options: HotkeyLegendOptions = {},
): HTMLDivElement {
  const legend = createOverlayRoot({
    parent: options.parent,
    style: {
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
      ...options.containerStyle,
    },
  });

  for (const item of items) {
    const chip = applyStyles(document.createElement("div"), {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      ...options.chipStyle,
    });

    const key = applyStyles(document.createElement("span"), {
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      lineHeight: "1",
      ...options.keyStyle,
    });
    key.textContent = item.key;

    const label = applyStyles(document.createElement("span"), {
      textTransform: "uppercase",
      ...options.labelStyle,
    });
    label.textContent = item.label;

    chip.append(key, label);
    legend.appendChild(chip);
  }

  return legend;
}

function resolveVisibilityTarget(target: VisibilityInput): VisibilityTarget {
  if (target instanceof HTMLElement) {
    return {
      element: target,
      display: "",
    };
  }

  return target;
}

export function setVisibility(target: VisibilityInput, visible: boolean): void {
  const resolved = resolveVisibilityTarget(target);
  resolved.element.style.display = visible ? (resolved.display ?? "") : "none";
}

export function setGroupVisibility(
  targets: readonly VisibilityInput[],
  visible: boolean,
): void {
  for (const target of targets) {
    setVisibility(target, visible);
  }
}

function matchesBinding(event: KeyboardEvent, binding: KeyBinding): boolean {
  if (binding.code !== undefined && binding.code !== event.code) {
    return false;
  }
  if (binding.key !== undefined && binding.key !== event.key) {
    return false;
  }
  if (binding.shiftKey !== undefined && binding.shiftKey !== event.shiftKey) {
    return false;
  }
  if (binding.altKey !== undefined && binding.altKey !== event.altKey) {
    return false;
  }
  if (binding.ctrlKey !== undefined && binding.ctrlKey !== event.ctrlKey) {
    return false;
  }
  if (binding.metaKey !== undefined && binding.metaKey !== event.metaKey) {
    return false;
  }

  return true;
}

export function bindKeymap(
  bindings: readonly KeyBinding[],
  options: KeymapOptions = {},
): () => void {
  const target = options.target ?? window;
  const eventType = options.eventType ?? "keydown";

  const handleKeyEvent = async (event: KeyboardEvent): Promise<void> => {
    if (options.ignoreRepeat && event.repeat) {
      return;
    }

    if (options.ignoreSystemModifiers && (event.metaKey || event.ctrlKey || event.altKey)) {
      return;
    }

    for (const binding of bindings) {
      if (!matchesBinding(event, binding)) {
        continue;
      }

      if (binding.preventDefault) {
        event.preventDefault();
      }
      if (binding.stopPropagation) {
        event.stopPropagation();
      }

      await binding.handler(event);
      return;
    }
  };

  const listener: EventListener = (event: Event) => {
    void handleKeyEvent(event as KeyboardEvent);
  };

  target.addEventListener(eventType, listener);
  return () => target.removeEventListener(eventType, listener);
}
