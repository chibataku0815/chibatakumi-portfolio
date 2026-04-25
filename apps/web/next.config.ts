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
   * Wave 1 IA migration (D4.11) — 301 redirects from old paths to new IA.
   *
   * Each logical path is registered twice: once for the bare `/old` form
   * (default locale, unprefixed thanks to `localePrefix: "as-needed"`) and
   * once for the explicit `/(en|ja)/old` form so locale-prefixed bookmarks
   * keep their locale across the redirect.
   *
   * Filmtone (`/film-lab/*`) redirects are deliberately deferred to Wave 2
   * (D5.1). Do not add them here.
   */
  async redirects() {
    return [
      // /photography → /works/photography
      {
        source: "/photography",
        destination: "/works/photography",
        permanent: true,
      },
      {
        source: "/:locale(en|ja)/photography",
        destination: "/:locale/works/photography",
        permanent: true,
      },
      // /interactive → /works
      {
        source: "/interactive",
        destination: "/works",
        permanent: true,
      },
      {
        source: "/:locale(en|ja)/interactive",
        destination: "/:locale/works",
        permanent: true,
      },
      // /installation → /works/installation
      {
        source: "/installation",
        destination: "/works/installation",
        permanent: true,
      },
      {
        source: "/:locale(en|ja)/installation",
        destination: "/:locale/works/installation",
        permanent: true,
      },
      // /motion/reference-works/:slug* → /journal/motion-studies/:slug*
      // (dynamic — must precede /motion catch-all below)
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
      // /motion → /experiments
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
      // /skills → /craft
      {
        source: "/skills",
        destination: "/craft",
        permanent: true,
      },
      {
        source: "/:locale(en|ja)/skills",
        destination: "/:locale/craft",
        permanent: true,
      },
      // /profile → /about
      {
        source: "/profile",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/:locale(en|ja)/profile",
        destination: "/:locale/about",
        permanent: true,
      },
      // /archive → /journal
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
