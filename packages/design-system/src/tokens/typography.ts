// Typography tokens — fluid clamp() scale aligned with apps/web/src/app/globals.css
// (the existing --type-display-* CSS variables) so the design-system can serve
// as the canonical source going forward. Values are duplicated rather than
// imported to keep the package framework-agnostic.
//
// Reference: plan §2.3 (D3.2).

export const TYPOGRAPHY = {
  display: {
    /** Hero — 56–224px (clamp 3.5rem / 15vw / 14rem). */
    hero: "clamp(3.5rem, 15vw, 14rem)",
    /** Skill title — 40–160px (clamp 2.5rem / 10vw / 10rem). */
    xl: "clamp(2.5rem, 10vw, 10rem)",
    /** Display large — 32–96px (clamp 2rem / 6vw / 6rem). */
    lg: "clamp(2rem, 6vw, 6rem)",
  },
  /** Section heading — 24–48px (clamp 1.5rem / 3.5vw / 3rem). */
  heading: "clamp(1.5rem, 3.5vw, 3rem)",
  /** Body large — 16–22.4px (clamp 1rem / 1.4vw / 1.4rem). */
  bodyLg: "clamp(1rem, 1.4vw, 1.4rem)",
  /** Body — 16px. */
  body: "1rem",
  /** Caption — 14px. */
  caption: "0.875rem",
} as const;

export type TypographyToken = typeof TYPOGRAPHY;

export const FONT_FAMILY = {
  sans:
    "var(--font-geist-sans), var(--font-noto-sans-jp), \"Hiragino Sans\", \"Hiragino Kaku Gothic ProN\", \"Meiryo\", sans-serif",
  mono: "var(--font-geist-mono), \"SFMono-Regular\", \"Consolas\", monospace",
} as const;

export const FONT_WEIGHT = {
  ultraLight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  ultraBold: 800,
} as const;

export const LETTER_SPACING = {
  ultraTight: "-0.06em",
  tighter: "-0.04em",
  tight: "-0.02em",
  normal: "0",
  wide: "0.1em",
  wider: "0.2em",
} as const;

export const LINE_HEIGHT = {
  tight: 1.1,
  normal: 1.6,
} as const;
