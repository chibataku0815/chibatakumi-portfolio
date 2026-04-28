/**
 * Returns true when a keyboard event originated from an editable target
 * (form field or contentEditable element). Shortcut handlers should skip
 * their action in this case so the user's typing is not intercepted.
 *
 * Extracted from motion-dot-new-webgpu/src/input/keyboard.ts — identical
 * heuristic to what dot was using inline.
 */
export function shouldIgnoreShortcutTarget(event: KeyboardEvent): boolean {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return !!target.closest("input, textarea, select, button, [contenteditable='true']");
}
