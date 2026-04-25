// Re-export shim for webgpu-motion-art.
// Resolves via root workspaces glob; will be backed by
// vendor/webgpu-motion-libs/packages/webgpu-motion-art once Phase A submodule lands.

export {
  PALETTE,
  TYPOGRAPHY,
  paletteRgb,
  paletteGpuColor,
  paletteFloat32,
  FILM_STOCK_CANON,
  PALETTE_WGSL,
} from "webgpu-motion-art";

export type {
  PaletteToken,
  FilmStockBaseline,
} from "webgpu-motion-art";
