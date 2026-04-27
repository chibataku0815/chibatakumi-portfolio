// Tailwind 4 plugin — exposes the renewal 2026 design tokens as CSS variables
// + utility classes. Wave 4-1 で `data-theme="dark|light"` の二重モードを撤去し、
// 単一のダークエディトリアル基盤として THEME.dark を `:root` に直接適用する。
//
// Reference: plan §2.3 (D3.1) and §5.6; Wave 4-1 consolidation.

import plugin from "tailwindcss/plugin";

import { PALETTE, THEME, TYPOGRAPHY } from "../tokens";

interface ThemeColors {
  readonly bgPrimary: string;
  readonly bgSecondary: string;
  readonly fgPrimary: string;
  readonly fgSecondary: string;
  readonly accent: string;
}

/**
 * Build the CSS variable map for a theme (light/dark).
 * Keys mirror the canonical names consumed by the utility classes below.
 */
function themeVars(theme: ThemeColors): Record<string, string> {
  return {
    "--bg-primary": theme.bgPrimary,
    "--bg-secondary": theme.bgSecondary,
    "--fg-primary": theme.fgPrimary,
    "--fg-secondary": theme.fgSecondary,
    "--accent": theme.accent,
  };
}

/**
 * Build the CSS variable map for the typography scale. Theme-agnostic — the
 * fluid clamp() values are identical regardless of mode, so they live on
 * `:root` alongside the consolidated dark theme.
 *
 * Reference: plan §2.3 (D3.2).
 */
function typographyVars(): Record<string, string> {
  return {
    "--type-display-hero": TYPOGRAPHY.display.hero,
    "--type-display-xl": TYPOGRAPHY.display.xl,
    "--type-display-lg": TYPOGRAPHY.display.lg,
    "--type-heading": TYPOGRAPHY.heading,
    "--type-body-lg": TYPOGRAPHY.bodyLg,
    "--type-body": TYPOGRAPHY.body,
    "--type-caption": TYPOGRAPHY.caption,
  };
}

/**
 * Renewal 2026 design system Tailwind plugin.
 *
 * @example
 *   // tailwind.config.ts
 *   import designSystemPlugin from "@chibatakumi/design-system/tailwind";
 *   export default { plugins: [designSystemPlugin] };
 */
// Explicit annotation needed because `tailwindcss/plugin`'s return type lives
// in a private types file that fails portability (TS2883).
const designSystemPlugin: ReturnType<typeof plugin> = plugin(({
  addBase,
  addUtilities,
}) => {
  addBase({
    ":root": {
      ...themeVars(THEME.dark),
      ...typographyVars(),
    },
  });

  addUtilities({
    ".bg-bg-primary": { "background-color": "var(--bg-primary)" },
    ".bg-bg-secondary": { "background-color": "var(--bg-secondary)" },
    ".bg-accent": { "background-color": "var(--accent)" },
    ".text-fg-primary": { color: "var(--fg-primary)" },
    ".text-fg-secondary": { color: "var(--fg-secondary)" },
    ".text-accent": { color: "var(--accent)" },
    ".border-fg-primary": { "border-color": "var(--fg-primary)" },
    ".border-fg-secondary": { "border-color": "var(--fg-secondary)" },
  });
});

export default designSystemPlugin;
export { PALETTE, THEME };
