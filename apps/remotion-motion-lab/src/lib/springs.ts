/**
 * Filmtone spring presets
 *
 * CD guardrails: damping 15-25, stiffness 100-180, overshoot 5-10%, 1 oscillation only
 * Reference: life/.claude/knowledge/patterns/remotion-motion-lab-brand-guardrails.md
 */

/** Standard — 「置いた」感覚。汎用 */
export const FILMTONE_SPRING = { damping: 20, stiffness: 140, mass: 1.0 };

/** Gentle — テキスト登場、fade 系。ゆっくり着地 */
export const FILMTONE_GENTLE = { damping: 25, stiffness: 100, mass: 1.0 };

/** Pop — ロゴ、バッジ。overshoot 約 8% */
export const FILMTONE_POP = { damping: 15, stiffness: 180, mass: 0.9 };

/** Quick — divider reveal、scope animation。~45f (1.5s) で着地 */
export const FILMTONE_QUICK = { damping: 22, stiffness: 200, mass: 0.8 };

/** Hook Blast — text crash。overshoot ~12-15%、~30f で着地。Hook beat 専用 */
export const HOOK_BLAST = { damping: 12, stiffness: 280, mass: 0.7 };

/** Showcase Snap — proof pair の compare divider。~12f (0.4s) で着地。overshoot ほぼ 0 */
export const SHOWCASE_SNAP = { damping: 28, stiffness: 320, mass: 0.7 };
