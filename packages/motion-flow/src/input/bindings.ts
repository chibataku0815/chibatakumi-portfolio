// Flowline keyboard bindings. Dev [1/2/3/0/r] hook is retained as the canonical
// interaction; Phase 10 adds A (audio toggle), F (film toggle), ? (keymap help).

import { shouldIgnoreShortcutTarget } from "webgpu-motion-input";
import type { KeymapEntry } from "webgpu-motion-ui";

export type FlowlineKeybindingDeps = {
  pinScene(idx: number): void;
  resumeAuto(): void;
  reseed(): void;
  toggleAudio(): Promise<void>;
  toggleFilm(): void;
  toggleKeymap(): void;
};

export const FLOWLINE_KEYMAP_ENTRIES: readonly KeymapEntry[] = [
  { key: "1–7", label: "Pin scene" },
  { key: "0",   label: "Resume auto-cycle" },
  { key: "R",       label: "Reseed trails" },
  { key: "A",       label: "Toggle audio" },
  { key: "F",       label: "Toggle film post" },
  { key: "?",       label: "Toggle this help" },
] as const;

export function bindFlowlineKeyboard(deps: FlowlineKeybindingDeps): () => void {
  const handler = async (event: KeyboardEvent): Promise<void> => {
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }
    if (shouldIgnoreShortcutTarget(event)) {
      return;
    }

    switch (event.key) {
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7": {
        const idx = Number(event.key) - 1;
        deps.pinScene(idx);
        return;
      }
      case "0":
        deps.resumeAuto();
        return;
      case "r":
      case "R":
        deps.reseed();
        return;
      case "a":
      case "A":
        await deps.toggleAudio();
        return;
      case "f":
      case "F":
        deps.toggleFilm();
        return;
      case "?":
      case "/": // Shift+/ on US layouts yields "?", plain "/" also triggers
        deps.toggleKeymap();
        return;
      default:
        return;
    }
  };

  const listener = (event: Event): void => {
    void handler(event as KeyboardEvent);
  };
  window.addEventListener("keydown", listener);
  return () => window.removeEventListener("keydown", listener);
}
