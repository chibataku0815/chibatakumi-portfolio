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
};

export default withNextIntl(nextConfig);
