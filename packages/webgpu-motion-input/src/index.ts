// webgpu-motion-input — keyboard shortcut helpers shared across motion apps.
//
// Deliberately minimal: only the two helpers both apps (dot, grid) want.
// The keymap action tables themselves stay per-app — they diverge meaningfully
// (dot uses webgpu-motion-dom's bindKeymap, grid runs a modal input-mode state
// machine with addEventListener). We do NOT try to paper over that divergence.

export { shouldIgnoreShortcutTarget } from "./shortcut-target";
export { isPrintableChar, HERO_TOKEN_CHAR_RE } from "./printable-char";
