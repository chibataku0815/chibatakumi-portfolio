// Design tokens — extracted from motion-dot-new (Canvas2D legacy) palette + grid.
// Reference: plan §2.3 (D3.1) and §5.6.

export const PALETTE = {
  bgPrimary: "#D2D2D2",
  bgSecondary: "#E8EAED",
  fgPrimary: "#1A1A1A",
  fgSecondary: "#202124",
  accent: "#FFFFFF",
} as const;

export const HEX_GRID = {
  rows: [7, 6, 7] as const,
  sizes: { S: 5, M: 9, L: 15 } as const,
  gap: 88,
  rowOffset: 44,
} as const;

export const MOTION_GRAMMAR = {
  // Re-exported by name from ./motion (easing curves) and consumed by the
  // Tailwind plugin as motion duration/ease tokens.
  primary: ["easeOutQuint", "smootherstep", "springScaleSimple"] as const,
} as const;

/**
 * Theme token — Light is the default for renewal 2026. Dark is the legacy
 * Filmtone surface, opted in via `[data-theme="dark"]`.
 *
 * Light values mirror PALETTE; Dark values mirror the Radix slate-dark + amber
 * accents that ship in apps/web/src/app/globals.css. Keeping both sets here
 * (instead of only the css variable names) lets non-Tailwind consumers — RSC
 * fragments, Storybook mocks, tests — read the resolved colors directly.
 */
export const THEME = {
  light: {
    bgPrimary: "#D2D2D2",
    bgSecondary: "#E8EAED",
    fgPrimary: "#1A1A1A",
    fgSecondary: "#202124",
    accent: "#FFFFFF",
  },
  dark: {
    // Resolved from --slate-1 / --slate-2 / --slate-12 / --slate-11 / --amber-9
    // at the time of writing. The Tailwind plugin emits CSS variables under
    // `[data-theme="dark"]`, so consumers should prefer var(--bg-primary) over
    // these literal hex values when rendering inside the app shell.
    bgPrimary: "#0F1115",
    bgSecondary: "#16181D",
    fgPrimary: "#ECEDEE",
    fgSecondary: "#B4B4B4",
    accent: "#FFB224",
  },
} as const;

export type ThemeName = keyof typeof THEME;

/** Spacing scale — matches Tailwind 4 default (rem-based). Listed for tooling. */
export const SPACING = {
  px: "1px",
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
  32: "8rem",
} as const;

export const RADIUS = {
  none: "0",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "1rem",
  /** Editorial panel radius — matches `--radius-panel`. */
  panel: "1.6rem",
  /** Pill / fully rounded — matches `--radius-pill`. */
  pill: "999px",
} as const;

export const Z_INDEX = {
  base: 0,
  raised: 1,
  sticky: 10,
  overlay: 100,
  modal: 1000,
  /** Page transition overlay — matches `.transition-overlay`. */
  pageTransitionOverlay: 9998,
  /** Page transition logo — matches `.logo-overlay`. */
  pageTransitionLogo: 9999,
} as const;

// Re-exports — typography + motion grammar live in dedicated files.
export {
  TYPOGRAPHY,
  FONT_FAMILY,
  FONT_WEIGHT,
  LETTER_SPACING,
  LINE_HEIGHT,
} from "./typography";
export type { TypographyToken } from "./typography";

export {
  easeOutQuint,
  smootherstep,
  springScaleSimple,
  MOTION_EASE,
  MOTION_DURATION,
} from "./motion";
