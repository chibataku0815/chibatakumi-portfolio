import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["film-lab-core", "film-lab-smart-look"],
  env: {
    /**
     * Phase 1 T1-1: Web build locks to WebGL backend so the `WebGPUBackend`
     * dynamic import is tree-shaken out of the client bundle.
     */
    FILMTONE_BACKEND: "webgl",
  },
};

export default withNextIntl(nextConfig);
