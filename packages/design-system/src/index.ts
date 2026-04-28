// @chibatakumi/design-system — Renewal 2026 design system.
//
// Re-exports the canonical tokens (palette, theme, typography, motion grammar,
// spacing, radius, z-index, hex grid) and the four primitive components
// (Logo / Wordmark / SoundToggle / NavRail). The Tailwind 4 plugin lives at
// `@chibatakumi/design-system/tailwind`.
//
// Reference: plan §2.3 (D3.1 – D3.6).

export const DESIGN_SYSTEM_VERSION = "0.1.0-tokens-and-primitives";

// Tokens.
export {
  PALETTE,
  HEX_GRID,
  MOTION_GRAMMAR,
  THEME,
  SPACING,
  RADIUS,
  Z_INDEX,
  TYPOGRAPHY,
  FONT_FAMILY,
  FONT_WEIGHT,
  LETTER_SPACING,
  LINE_HEIGHT,
  easeOutQuint,
  smootherstep,
  springScaleSimple,
  MOTION_EASE,
  MOTION_DURATION,
} from "./tokens";
export type { ThemeName, TypographyToken } from "./tokens";

// Components.
export { Logo, Wordmark, SoundToggle, NavRail } from "./components";
export type {
  LogoProps,
  LogoVariant,
  WordmarkProps,
  SoundToggleProps,
  SoundState,
  NavRailProps,
  NavRailItem,
} from "./components";
