/**
 * MOOOGRAPH Geometric — Composition #42
 *
 * Canvas 2D recreation of MOOOGRAPH geometric motion graphics.
 * Halftone blobs + geometric shapes with staggered enter/exit.
 *
 * Layers (z-order):
 *   0. Background fill (#E8E6E0)
 *   1. Halftone blobs (L1)
 *   5. Geometric shapes (L5) — includes Recraft image-based shapes
 *   9. Film grain overlay
 */
import React, { useCallback } from "react";
import { CanvasScene, W, H, sr } from "../../lib/canvas-primitives";
import { useCanvasImages } from "./lib/image-preloader";
import { drawBlobs } from "./layers/L1-blobs";
import { drawShapes } from "./layers/L5-geometric-shapes";
import { PALETTE, IMAGE_SOURCES, config } from "./config";

// ============================================================
// Film grain (lightweight, multiply blend)
// ============================================================
function drawGrain(ctx: CanvasRenderingContext2D, frame: number): void {
  const gs = config.grainSize;
  const alpha = config.grainAlpha / 255;
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = alpha;
  for (let py = 0; py < H; py += gs) {
    for (let px = 0; px < W; px += gs) {
      ctx.fillStyle =
        sr(py * 0xffff + px + frame * 23) < 0.5 ? "#fff" : "#000";
      ctx.fillRect(px, py, gs, gs);
    }
  }
  ctx.restore();
}

// ============================================================
// Main component
// ============================================================
export const MooographGeometric: React.FC = () => {
  // Preload raster assets (non-blocking — renders placeholders if missing)
  const images = useCanvasImages(IMAGE_SOURCES);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, frame: number) => {
      // 0. Background
      ctx.fillStyle = PALETTE.background;
      ctx.fillRect(0, 0, W, H);

      // 1. Halftone blobs
      drawBlobs(ctx, frame);

      // 5. Geometric shapes (pass preloaded images)
      drawShapes(ctx, frame, images);

      // 9. Film grain overlay
      drawGrain(ctx, frame);
    },
    [images],
  );

  return <CanvasScene draw={draw} />;
};
