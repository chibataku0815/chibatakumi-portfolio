// Tailwind 4 plugin — exposes the renewal 2026 design tokens as CSS variables
// + utility classes. Light mode values land on `:root`; dark mode mirrors them
// under `[data-theme="dark"]`. Auto-dark via `prefers-color-scheme: dark` is
// scoped to `:root:not([data-theme])` so explicit user choices remain
// authoritative.
//
// Reference: plan §2.3 (D3.1) and §5.6.

import plugin from "tailwindcss/plugin";

import { PALETTE, THEME } from "../tokens";

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
    ":root": themeVars(THEME.light),
    // Auto-dark — only when the user has not explicitly chosen a theme.
    // `:root:not([data-theme])` keeps the explicit light/dark toggles
    // authoritative.
    "@media (prefers-color-scheme: dark)": {
      ":root:not([data-theme])": themeVars(THEME.dark),
    },
    '[data-theme="dark"]': themeVars(THEME.dark),
    '[data-theme="light"]': themeVars(THEME.light),
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
