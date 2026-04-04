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
