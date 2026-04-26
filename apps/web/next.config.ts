import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: [
    "film-lab-core",
    "film-lab-smart-look",
    "@chibatakumi/motion-core",
    "@chibatakumi/motion-dot",
    "@chibatakumi/motion-grid",
    "@chibatakumi/motion-flow",
    "webgpu-motion-shell",
    "webgpu-motion-audio",
    "webgpu-motion-post",
    "webgpu-motion-art",
    "webgpu-motion-dom",
    "webgpu-motion-input",
    "webgpu-motion-scene",
    "webgpu-motion-ui",
    "gpu-fx-presets",
    "gpu-2.5d-presets",
    "gpu-film-post",
  ],
  env: {
    /**
     * Phase 1 T1-1: Web build locks to WebGL backend so the `WebGPUBackend`
     * dynamic import is tree-shaken out of the client bundle.
     */
    FILMTONE_BACKEND: "webgl",
  },
  turbopack: {
    rules: {
      "*.wgsl": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
  },
  /**
   * Renewal 2026 reset (parent plan §3.2) — 301 redirects from legacy paths
   * to the canonical IA (`/`, `/experiments`, `/journal`, `/contact`).
   *
   * Each logical path is registered twice: once for the bare `/old` form
   * (default locale, unprefixed thanks to `localePrefix: "as-needed"`) and
   * once for the explicit `/(en|ja)/old` form so locale-prefixed bookmarks
   * keep their locale across the redirect. Wildcard `:path*` collapses the
   * nested-path entries.
   *
   * Satellite canonicalization (`/filmtone`, `/photography`) has landed with
   * the Satellite package (Renewal 2026 §3.2). Canonical routes are now
   * `/[locale]/filmtone` and `/[locale]/photography`; legacy paths
   * `/works/filmtone`, `/works/photography`, and `/film-lab` all 301 to
   * their canonical Satellite destinations.
   *
   * `/motion/reference-works/:slug*` ordering must precede the bare
   * `/motion → /experiments` rule so the dynamic match wins first.
   */
  async redirects() {
    return [
      // /works/photography → /photography (Renewal 2026 §3.2 — Satellite
      // canonicalization landed: /[locale]/photography/page.tsx is now the
      // real route, /works/photography is redirect-only).
      {
        source: "/works/photography",
        destination: "/photography",
        permanent: true,
      },
      {
        source: "/:locale(en|ja)/works/photography",
        destination: "/:locale/photography",
        permanent: true,
      },

      // /works/filmtone(:path*) → /filmtone(:path*) (§3.2 — Filmtone LP and
      // children moved to /[locale]/filmtone; /works/filmtone is redirect-only).
      {
        source: "/works/filmtone",
        destination: "/filmtone",
        permanent: true,
      },
      {
        source: "/works/filmtone/:path*",
        destination: "/filmtone/:path*",
        permanent: true,
      },
      {
        source: "/:locale(en|ja)/works/filmtone",
        destination: "/:locale/filmtone",
        permanent: true,
      },
      {
        source: "/:locale(en|ja)/works/filmtone/:path*",
        destination: "/:locale/filmtone/:path*",
        permanent: true,
      },

      // /film-lab(:path*) → /filmtone(:path*) (§3.2 — legacy product name
      // collapses onto the canonical Satellite path).
      {
        source: "/film-lab",
        destination: "/filmtone",
        permanent: true,
      },
      {
        source: "/film-lab/:path*",
        destination: "/filmtone/:path*",
        permanent: true,
      },
      {
        source: "/:locale(en|ja)/film-lab",
        destination: "/:locale/filmtone",
        permanent: true,
      },
      {
        source: "/:locale(en|ja)/film-lab/:path*",
        destination: "/:locale/filmtone/:path*",
        permanent: true,
      },

      // /works/commercial → /experiments (parent plan §2.3 — removed from
      // core IA; explicit redirect kept separate from /works/:path* wildcard
      // to avoid order-of-evaluation ambiguity with other /works/* entries.)
      {
        source: "/works/commercial",
        destination: "/experiments",
        permanent: true,
      },
      {
        source: "/:locale(en|ja)/works/commercial",
        destination: "/:locale/experiments",
        permanent: true,
      },
      // /works/installation → /experiments (parent plan §2.3 — same as above)
      {
        source: "/works/installation",
        destination: "/experiments",
        permanent: true,
      },
      {
        source: "/:locale(en|ja)/works/installation",
        destination: "/:locale/experiments",
        permanent: true,
      },
      // /works → /experiments (parent plan §3.2)
      {
        source: "/works",
        destination: "/experiments",
        permanent: true,
      },
      {
        source: "/:locale(en|ja)/works",
        destination: "/:locale/experiments",
        permanent: true,
      },
      // /motion/reference-works/:slug* → /journal/motion-studies/:slug*
      // (dynamic — must precede the bare /motion rule below so this wins)
      {
        source: "/motion/reference-works/:slug*",
        destination: "/journal/motion-studies/:slug*",
        permanent: true,
      },
      {
        source: "/:locale(en|ja)/motion/reference-works/:slug*",
        destination: "/:locale/journal/motion-studies/:slug*",
        permanent: true,
      },
      // /motion → /experiments (parent plan §3.2)
      {
        source: "/motion",
        destination: "/experiments",
        permanent: true,
      },
      {
        source: "/:locale(en|ja)/motion",
        destination: "/:locale/experiments",
        permanent: true,
      },
      // /interactive → /experiments (parent plan §3.2)
      {
        source: "/interactive",
        destination: "/experiments",
        permanent: true,
      },
      {
        source: "/:locale(en|ja)/interactive",
        destination: "/:locale/experiments",
        permanent: true,
      },
      // /about → / (parent plan §3.2)
      {
        source: "/about",
        destination: "/",
        permanent: true,
      },
      {
        source: "/:locale(en|ja)/about",
        destination: "/:locale",
        permanent: true,
      },
      // /craft → / (parent plan §3.2)
      {
        source: "/craft",
        destination: "/",
        permanent: true,
      },
      {
        source: "/:locale(en|ja)/craft",
        destination: "/:locale",
        permanent: true,
      },
      // /profile → / (parent plan §3.2)
      {
        source: "/profile",
        destination: "/",
        permanent: true,
      },
      {
        source: "/:locale(en|ja)/profile",
        destination: "/:locale",
        permanent: true,
      },
      // /skills → / (parent plan §3.2)
      {
        source: "/skills",
        destination: "/",
        permanent: true,
      },
      {
        source: "/:locale(en|ja)/skills",
        destination: "/:locale",
        permanent: true,
      },
      // /archive → /journal — kept from pre-reset; not in parent plan §3.2
      // but points to a canonical destination, so retained for old bookmarks.
      {
        source: "/archive",
        destination: "/journal",
        permanent: true,
      },
      {
        source: "/:locale(en|ja)/archive",
        destination: "/:locale/journal",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
