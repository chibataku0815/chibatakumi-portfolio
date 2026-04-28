// Tailwind 4 config — wires the renewal 2026 design system plugin so the
// canonical CSS variables (--bg-primary / --fg-primary / --accent) and
// utility classes (`bg-bg-primary`, `text-fg-primary`, …) are available to
// the web app.
//
// Tailwind 4 prefers a CSS-first config via `@import "tailwindcss"` +
// `@source` directives in globals.css. This file exists for plugin
// registration only — content paths stay declared in CSS.
//
// Reference: plan §2.3 (D3.1).

import type { Config } from "tailwindcss";
import designSystemPlugin from "@chibatakumi/design-system/tailwind";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/design-system/src/**/*.{ts,tsx}",
  ],
  plugins: [designSystemPlugin],
};

export default config;
