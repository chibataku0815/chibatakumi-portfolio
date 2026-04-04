/**
 * Typography setup — Inter + Noto Sans JP (400/700 only)
 *
 * Comm stream: JP font bundle size control — 2 weights max
 * CD guardrail: letter-spacing 0.02em→0em convergence, stagger 80-120ms
 */
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadNotoSansJP } from "@remotion/google-fonts/NotoSansJP";

const { fontFamily: interFamily } = loadInter();
const { fontFamily: notoFamily } = loadNotoSansJP();

export const FONTS = {
  inter: interFamily,
  notoSansJP: notoFamily,
  /** JP/EN 混植用 */
  mixed: `${interFamily}, ${notoFamily}, sans-serif`,
} as const;

export const TYPE_SCALE = {
  /** 見出し: 56px+ (CD minimum) */
  heading: 64,
  /** 本文: 36px+ */
  body: 40,
  /** ラベル: 28px+ */
  label: 32,
  /** CTA: 大きめ */
  cta: 48,
} as const;
