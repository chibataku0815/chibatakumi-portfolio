/**
 * Canonical hero-token charset: uppercase/lowercase alphanumerics, period, space.
 * Motion-grid uses this for Hero Word tokens; other apps can reuse.
 */
export const HERO_TOKEN_CHAR_RE = /^[A-Za-z0-9. ]$/;

/**
 * Predicate: does `key` represent a single printable character matching
 * `pattern`? Used by modal text-input handlers (e.g. grid's hero-token entry).
 *
 * `key.length === 1` filters out named keys like "ArrowLeft", "Enter", etc.
 */
export function isPrintableChar(key: string, pattern: RegExp = HERO_TOKEN_CHAR_RE): boolean {
  return key.length === 1 && pattern.test(key);
}
