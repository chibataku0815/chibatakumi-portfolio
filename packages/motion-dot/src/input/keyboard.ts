import type { TransitionPhase } from "../transition/kinetic-handoff";
import { bindKeymap } from "webgpu-motion-dom";
import { shouldIgnoreShortcutTarget } from "webgpu-motion-input";

export interface KeyboardDeps {
  getSceneIndex(): number;
  getSceneCount(): number;
  setSceneIndex(nextIdx: number): void;
  disableGallery(): boolean;
  toggleOptionsVisibility(): void;
  toggleAudioPanel(): void;
  isTransitionActive(): boolean;
  getTransitionPhase(): TransitionPhase;
  startTransition(sourceIdx: number): void;
  stopTransition(): void;
  resetCurrentScene(): void;
  toggleFilm(): void;
  cycleGallery(): void;
  cycleGalleryReverse(): void;
  isGalleryEnabled(): boolean;
  shiftGalleryBase(delta: number): void;
  toggleAudio(): Promise<void>;
  openAudioPicker(): void;
  changeTypographyText(): void;
  syncOverlay(): void;
}

export function bindKeyboardShortcuts(deps: KeyboardDeps): () => void {
  let lastTPress = 0;

  function advanceScene(delta: number): void {
    if (deps.isTransitionActive()) {
      return;
    }

    if (deps.isGalleryEnabled()) {
      deps.shiftGalleryBase(delta);
    } else {
      deps.setSceneIndex(
        (deps.getSceneIndex() + delta + deps.getSceneCount()) % deps.getSceneCount(),
      );
    }

    deps.syncOverlay();
  }

  return bindKeymap([
    {
      code: "Digit0",
      handler: (event) => {
        if (shouldIgnoreShortcutTarget(event)) {
          return;
        }
        if (deps.disableGallery()) {
          deps.syncOverlay();
        }
      },
    },
    {
      code: "ArrowRight",
      handler: (event) => {
        if (shouldIgnoreShortcutTarget(event)) {
          return;
        }
        advanceScene(1);
      },
    },
    {
      code: "ArrowDown",
      handler: (event) => {
        if (shouldIgnoreShortcutTarget(event)) {
          return;
        }
        advanceScene(1);
      },
    },
    {
      code: "ArrowLeft",
      handler: (event) => {
        if (shouldIgnoreShortcutTarget(event)) {
          return;
        }
        advanceScene(-1);
      },
    },
    {
      code: "ArrowUp",
      handler: (event) => {
        if (shouldIgnoreShortcutTarget(event)) {
          return;
        }
        advanceScene(-1);
      },
    },
    {
      code: "KeyR",
      handler: (event) => {
        if (shouldIgnoreShortcutTarget(event)) {
          return;
        }
        if (deps.isTransitionActive()) {
          return;
        }

        deps.resetCurrentScene();
      },
    },
    {
      code: "KeyF",
      handler: (event) => {
        if (shouldIgnoreShortcutTarget(event)) {
          return;
        }
        deps.toggleFilm();
        deps.syncOverlay();
      },
    },
    {
      code: "KeyD",
      handler: (event) => {
        if (shouldIgnoreShortcutTarget(event)) {
          return;
        }
        if (event.shiftKey) {
          deps.cycleGalleryReverse();
        } else {
          deps.cycleGallery();
        }
        deps.syncOverlay();
      },
    },
    {
      code: "KeyA",
      handler: async (event) => {
        if (shouldIgnoreShortcutTarget(event)) {
          return;
        }
        await deps.toggleAudio();
        deps.syncOverlay();
      },
    },
    {
      code: "KeyH",
      handler: (event) => {
        if (shouldIgnoreShortcutTarget(event)) {
          return;
        }
        deps.toggleOptionsVisibility();
        deps.syncOverlay();
      },
    },
    {
      code: "KeyT",
      handler: (event) => {
        if (shouldIgnoreShortcutTarget(event)) {
          return;
        }
        const now = performance.now();
        if (now - lastTPress < 300) {
          return;
        }

        lastTPress = now;
        if (!deps.isTransitionActive()) {
          deps.startTransition(deps.getSceneIndex());
        } else if (deps.getTransitionPhase() !== "handoff_pending") {
          deps.stopTransition();
        }
        deps.syncOverlay();
      },
    },
    {
      code: "KeyI",
      handler: (event) => {
        if (shouldIgnoreShortcutTarget(event)) {
          return;
        }
        deps.toggleAudioPanel();
        deps.syncOverlay();
      },
    },
    {
      code: "KeyM",
      handler: (event) => {
        if (shouldIgnoreShortcutTarget(event)) {
          return;
        }
        deps.openAudioPicker();
      },
    },
    {
      code: "KeyW",
      handler: (event) => {
        if (shouldIgnoreShortcutTarget(event)) {
          return;
        }
        deps.changeTypographyText();
      },
    },
  ]);
}
