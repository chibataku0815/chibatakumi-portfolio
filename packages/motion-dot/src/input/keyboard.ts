import { bindKeymap } from "webgpu-motion-dom";
import { shouldIgnoreShortcutTarget } from "webgpu-motion-input";

export interface KeyboardDeps {
  setSingleMode(): void;
  advanceScene(delta: number): void;
  toggleOptionsVisibility(): void;
  toggleAudioPanel(): void;
  triggerTransition(): void;
  resetCurrentScene(): void;
  toggleFilm(): void;
  cycleGallery(delta: 1 | -1): void;
  toggleAudio(): Promise<void>;
  openAudioPicker(): void;
  changeTypographyText(): void;
}

export function bindKeyboardShortcuts(deps: KeyboardDeps): () => void {
  let lastTPress = 0;

  return bindKeymap([
    {
      code: "Digit0",
      handler: (event) => {
        if (shouldIgnoreShortcutTarget(event)) {
          return;
        }
        deps.setSingleMode();
      },
    },
    {
      code: "ArrowRight",
      handler: (event) => {
        if (shouldIgnoreShortcutTarget(event)) {
          return;
        }
        deps.advanceScene(1);
      },
    },
    {
      code: "ArrowDown",
      handler: (event) => {
        if (shouldIgnoreShortcutTarget(event)) {
          return;
        }
        deps.advanceScene(1);
      },
    },
    {
      code: "ArrowLeft",
      handler: (event) => {
        if (shouldIgnoreShortcutTarget(event)) {
          return;
        }
        deps.advanceScene(-1);
      },
    },
    {
      code: "ArrowUp",
      handler: (event) => {
        if (shouldIgnoreShortcutTarget(event)) {
          return;
        }
        deps.advanceScene(-1);
      },
    },
    {
      code: "KeyR",
      handler: (event) => {
        if (shouldIgnoreShortcutTarget(event)) {
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
      },
    },
    {
      code: "KeyD",
      handler: (event) => {
        if (shouldIgnoreShortcutTarget(event)) {
          return;
        }
        if (event.shiftKey) {
          deps.cycleGallery(-1);
        } else {
          deps.cycleGallery(1);
        }
      },
    },
    {
      code: "KeyA",
      handler: async (event) => {
        if (shouldIgnoreShortcutTarget(event)) {
          return;
        }
        await deps.toggleAudio();
      },
    },
    {
      code: "KeyH",
      handler: (event) => {
        if (shouldIgnoreShortcutTarget(event)) {
          return;
        }
        deps.toggleOptionsVisibility();
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
        deps.triggerTransition();
      },
    },
    {
      code: "KeyI",
      handler: (event) => {
        if (shouldIgnoreShortcutTarget(event)) {
          return;
        }
        deps.toggleAudioPanel();
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
