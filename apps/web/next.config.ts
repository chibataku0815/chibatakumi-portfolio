import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const retiredMotionStudySlugs = [
  "boiling-poster-aperture",
  "signal-stroke-relay",
  "staged-emphasis-payoff",
  "temporal-echo-residue",
] as const;

const nextConfig: NextConfig = {
  transpilePackages: ["film-lab-core", "film-lab-smart-look"],
  env: {
    /**
     * Phase 1 T1-1: Web build locks to WebGL backend so the `WebGPUBackend`
     * dynamic import is tree-shaken out of the client bundle.
     */
    FILMTONE_BACKEND: "webgl",
  },
  async redirects() {
    return retiredMotionStudySlugs.flatMap((slug) => [
      {
        source: `/motion/reference-works/${slug}`,
        destination: "/journal",
        permanent: true,
      },
      {
        source: `/:locale(en|ja)/motion/reference-works/${slug}`,
        destination: "/:locale/journal",
        permanent: true,
      },
      {
        source: `/journal/motion-studies/${slug}`,
        destination: "/journal",
        permanent: true,
      },
      {
        source: `/:locale(en|ja)/journal/motion-studies/${slug}`,
        destination: "/:locale/journal",
        permanent: true,
      },
    ]);
  },
};

export default withNextIntl(nextConfig);
