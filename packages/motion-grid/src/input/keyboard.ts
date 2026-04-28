// Keyboard shortcut bindings for motion-grid — ported verbatim from
// life/output/motion-grid-guided-webgpu/src/input/keyboard.ts.
//
// Changed from original:
//   - bindKeyboardShortcuts now returns a dispose() function (was implicit
//     in the original via the return value, which was already () => void).
//   - Import path adjusted: "webgpu-motion-input" is a workspace dep.
//
// SSR safety: no top-level DOM/window access; all listener registration
// happens inside bindKeyboardShortcuts() which is called from mountMotionGridApp()
// inside useEffect on the client side only.

import { isPrintableChar, HERO_TOKEN_CHAR_RE } from "webgpu-motion-input";

export interface KeyboardDeps {
  cyclePattern(delta: number): void;
  isInputModeActive?(): boolean;
  enterInputMode?(): void;
  cancelInputMode?(): void;
  confirmInputMode?(): void;
  appendInputChar?(char: string): void;
  backspaceInputChar?(): void;
  resetScene(): void;
  zoomIn(): void;
  zoomOut(): void;
  zoomDefault?(): void;
  toggleContinuityMode(): void;
  toggleLoop(): void;
  toggleFilm(): void;
  toggleHud(): void;
  toggleAudio(): Promise<void>;
  openAudioPicker(): void;
  resetAudioToDefault(): Promise<void>;
  syncOverlay(): void;
}

/**
 * Bind keyboard shortcuts for the motion-grid interactive experience.
 *
 * Returns a dispose function that removes the listener. Call it in stop()
 * to clean up when the mount is torn down.
 */
export function bindKeyboardShortcuts(deps: KeyboardDeps): () => void {
  const handleKeyDown = async (event: KeyboardEvent): Promise<void> => {
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    if (deps.isInputModeActive?.() ?? false) {
      switch (event.code) {
        case "Enter":
          event.preventDefault();
          deps.confirmInputMode?.();
          deps.syncOverlay();
          return;
        case "Escape":
          event.preventDefault();
          deps.cancelInputMode?.();
          deps.syncOverlay();
          return;
        case "Backspace":
          event.preventDefault();
          deps.backspaceInputChar?.();
          deps.syncOverlay();
          return;
        default:
          if (isPrintableChar(event.key, HERO_TOKEN_CHAR_RE)) {
            event.preventDefault();
            deps.appendInputChar?.(event.key);
            deps.syncOverlay();
          }
      }

      return;
    }

    switch (event.code) {
      case "ArrowLeft":
        event.preventDefault();
        deps.cyclePattern(-1);
        deps.syncOverlay();
        return;
      case "ArrowRight":
        event.preventDefault();
        deps.cyclePattern(1);
        deps.syncOverlay();
        return;
      case "KeyI":
        event.preventDefault();
        deps.enterInputMode?.();
        deps.syncOverlay();
        return;
      case "KeyR":
        deps.resetScene();
        deps.syncOverlay();
        return;
      case "KeyZ":
        event.preventDefault();
        if (event.shiftKey) {
          deps.zoomOut();
        } else {
          deps.zoomIn();
        }
        deps.syncOverlay();
        return;
      case "Digit0":
        event.preventDefault();
        deps.zoomDefault?.();
        deps.syncOverlay();
        return;
      case "KeyT":
        deps.toggleContinuityMode();
        deps.syncOverlay();
        return;
      case "KeyL":
        deps.toggleLoop();
        deps.syncOverlay();
        return;
      case "KeyF":
        deps.toggleFilm();
        deps.syncOverlay();
        return;
      case "KeyH":
        deps.toggleHud();
        deps.syncOverlay();
        return;
      case "KeyA":
        await deps.toggleAudio();
        deps.syncOverlay();
        return;
      case "KeyM":
        if (event.shiftKey) {
          await deps.resetAudioToDefault();
        } else {
          deps.openAudioPicker();
        }
        deps.syncOverlay();
        return;
      default:
        return;
    }
  };

  const listener = (event: Event): void => {
    void handleKeyDown(event as KeyboardEvent);
  };

  window.addEventListener("keydown", listener);
  return () => window.removeEventListener("keydown", listener);
}
