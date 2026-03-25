import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@shared": resolve(__dirname, "./shared"),
    },
  },
  assetsInclude: ["**/*.glb", "**/*.gltf", "**/*.hdr"],
  optimizeDeps: {
    include: ["three"],
  },
});
