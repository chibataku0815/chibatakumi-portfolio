// apps/web public Logo re-export.
//
// The renewal 2026 design system owns the canonical Logo. New code should
// import from `@chibatakumi/design-system`. This file exists so consumers
// using the conventional `@/components/Logo` path resolve to the same
// component without a package-level rewrite.
//
// Note: the legacy path-based stroke logo lives at
// `apps/web/src/shared/transitions/Logo.tsx` and is still used by
// PageTransition. The two are intentionally distinct primitives — the
// design-system Logo is decoupled from portfolioData and renders the dot
// vocabulary defined by HEX_GRID.
//
// Reference: plan §2.3 (D3.6).

export { Logo as default, Logo } from "@chibatakumi/design-system";
export type { LogoProps, LogoVariant } from "@chibatakumi/design-system";
