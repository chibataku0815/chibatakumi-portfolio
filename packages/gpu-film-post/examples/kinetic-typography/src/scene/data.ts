// ── Scene constants and easing functions ────────────────────────────

export const PHRASES = ['ささやかな毎日', '思い出の場所', '帰りたい場所', 'わたしだけの秘密'];
export const ROMAJI  = ['SASAYAKA NA MAINICHI', 'OMOIDE NO BASHO', 'KAERITAI BASHO', 'WATASHI DAKE NO HIMITSU'];
export const MEANING = ['MODEST \u00B7 EVERYDAY', 'PLACE \u00B7 OF \u00B7 MEMORIES', 'PLACE \u00B7 TO \u00B7 RETURN', 'MY \u00B7 OWN \u00B7 SECRET'];

export const clamp = (x: number, a: number, b: number): number =>
  Math.max(a, Math.min(b, x));

export const easeOutCubic = (t: number): number =>
  1 - Math.pow(1 - t, 3);

export const easeInCubic = (t: number): number =>
  t * t * t;

export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const sstep = (a: number, b: number, x: number): number => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
