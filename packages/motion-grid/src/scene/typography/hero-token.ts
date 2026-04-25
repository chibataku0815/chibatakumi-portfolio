export interface GridGlyphDefinition {
  readonly char: string;
  readonly rows: readonly string[];
}

export interface HeroTokenSpec {
  readonly token: string;
  readonly glyphs: readonly GridGlyphDefinition[];
  readonly width: number;
  readonly height: number;
  readonly blockCount: number;
}

export const GLYPH_WIDTH = 4;
export const GLYPH_HEIGHT = 6;
export const GLYPH_SPACING = 1;
export const MAX_HERO_TOKEN_BLOCKS = 280;
export const MAX_RENDER_BLOCKS = 1024;

export const MIN_HERO_TOKEN_CHARS = 3;
export const MAX_HERO_TOKEN_CHARS = 14;
const DEFAULT_FALLBACK_TOKEN = "GRID";

export const DEFAULT_HERO_TOKEN = DEFAULT_FALLBACK_TOKEN;

const GLYPH_LIBRARY: Readonly<Record<string, GridGlyphDefinition>> = {
  A: { char: "A", rows: ["0110", "1001", "1001", "1111", "1001", "1001"] },
  B: { char: "B", rows: ["1110", "1001", "1110", "1001", "1001", "1110"] },
  C: { char: "C", rows: ["0111", "1000", "1000", "1000", "1000", "0111"] },
  D: { char: "D", rows: ["1110", "1001", "1001", "1001", "1001", "1110"] },
  E: { char: "E", rows: ["1111", "1000", "1110", "1000", "1000", "1111"] },
  F: { char: "F", rows: ["1111", "1000", "1110", "1000", "1000", "1000"] },
  G: { char: "G", rows: ["0111", "1000", "1011", "1001", "1001", "0111"] },
  H: { char: "H", rows: ["1001", "1001", "1111", "1001", "1001", "1001"] },
  I: { char: "I", rows: ["1111", "0110", "0110", "0110", "0110", "1111"] },
  J: { char: "J", rows: ["0011", "0001", "0001", "0001", "1001", "0110"] },
  K: { char: "K", rows: ["1001", "1010", "1100", "1010", "1010", "1001"] },
  L: { char: "L", rows: ["1000", "1000", "1000", "1000", "1000", "1111"] },
  M: { char: "M", rows: ["1001", "1111", "1111", "1001", "1001", "1001"] },
  N: { char: "N", rows: ["1001", "1101", "1111", "1011", "1001", "1001"] },
  O: { char: "O", rows: ["0110", "1001", "1001", "1001", "1001", "0110"] },
  P: { char: "P", rows: ["1110", "1001", "1001", "1110", "1000", "1000"] },
  Q: { char: "Q", rows: ["0110", "1001", "1001", "1001", "1011", "0111"] },
  R: { char: "R", rows: ["1110", "1001", "1001", "1110", "1010", "1001"] },
  S: { char: "S", rows: ["0111", "1000", "0110", "0001", "0001", "1110"] },
  T: { char: "T", rows: ["1111", "0110", "0110", "0110", "0110", "0110"] },
  U: { char: "U", rows: ["1001", "1001", "1001", "1001", "1001", "0110"] },
  V: { char: "V", rows: ["1001", "1001", "1001", "1001", "0110", "0110"] },
  W: { char: "W", rows: ["1001", "1001", "1001", "1111", "1111", "1001"] },
  X: { char: "X", rows: ["1001", "1001", "0110", "0110", "1001", "1001"] },
  Y: { char: "Y", rows: ["1001", "1001", "0110", "0110", "0110", "0110"] },
  Z: { char: "Z", rows: ["1111", "0001", "0010", "0100", "1000", "1111"] },
  0: { char: "0", rows: ["0110", "1001", "1011", "1101", "1001", "0110"] },
  1: { char: "1", rows: ["0010", "0110", "0010", "0010", "0010", "0111"] },
  2: { char: "2", rows: ["1110", "0001", "0010", "0100", "1000", "1111"] },
  3: { char: "3", rows: ["1110", "0001", "0110", "0001", "0001", "1110"] },
  4: { char: "4", rows: ["1001", "1001", "1111", "0001", "0001", "0001"] },
  5: { char: "5", rows: ["1111", "1000", "1110", "0001", "0001", "1110"] },
  6: { char: "6", rows: ["0111", "1000", "1110", "1001", "1001", "0110"] },
  7: { char: "7", rows: ["1111", "0001", "0010", "0100", "0100", "0100"] },
  8: { char: "8", rows: ["0110", "1001", "0110", "1001", "1001", "0110"] },
  9: { char: "9", rows: ["0110", "1001", "1001", "0111", "0001", "1110"] },
  ".": { char: ".", rows: ["0000", "0000", "0000", "0000", "0000", "0010"] },
  " ": { char: " ", rows: ["0000", "0000", "0000", "0000", "0000", "0000"] },
};

export function sanitizeHeroTokenInput(token: string): string {
  return token
    .toUpperCase()
    .replace(/[^A-Z0-9. ]/g, "")
    .replace(/ +/g, " ");
}

export function normalizeHeroToken(token: string): string {
  const normalized = sanitizeHeroTokenInput(token).slice(0, MAX_HERO_TOKEN_CHARS);

  if (normalized.length >= MIN_HERO_TOKEN_CHARS && normalized.length <= MAX_HERO_TOKEN_CHARS) {
    return normalized;
  }

  return DEFAULT_FALLBACK_TOKEN;
}

function countGlyphCells(glyph: GridGlyphDefinition): number {
  return glyph.rows.reduce((count, row) => {
    for (let index = 0; index < row.length; index += 1) {
      if (row[index] === "1") {
        count += 1;
      }
    }

    return count;
  }, 0);
}

export function resolveHeroTokenSpec(
  token: string,
  glyphSpacing: number = GLYPH_SPACING,
): HeroTokenSpec {
  const normalizedToken = normalizeHeroToken(token);
  const glyphs = [...normalizedToken].map((char) => GLYPH_LIBRARY[char] ?? GLYPH_LIBRARY[" "]);
  const blockCount = glyphs.reduce((count, glyph) => count + countGlyphCells(glyph), 0);

  return {
    token: normalizedToken,
    glyphs,
    width: glyphs.length * GLYPH_WIDTH + Math.max(glyphs.length - 1, 0) * glyphSpacing,
    height: GLYPH_HEIGHT,
    blockCount,
  };
}
