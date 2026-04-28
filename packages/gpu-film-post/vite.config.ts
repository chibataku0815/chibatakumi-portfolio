import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => ({
  assetsInclude: ["**/*.wgsl"],
  resolve: {
    alias: {
      "gpu-film-post": path.resolve(root, "src/index.ts"),
    },
  },
  ...(command === "build"
    ? {
        build: {
          lib: {
            entry: path.resolve(root, "src/index.ts"),
            formats: ["es" as const],
            fileName: "index",
          },
          outDir: "dist",
        },
      }
    : {
        root: path.resolve(root, "examples/kinetic-typography"),
        server: {
          fs: {
            allow: [root],
          },
        },
      }),
}));
