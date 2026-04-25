// ============================================================
// motion-flowline-webgpu — Phase 11 SDF generator
//
// Rasterizes a short hero string into a Float32Array signed distance field
// via Canvas 2D → binary mask → 8SSEDT → box-filter downsample.
//
// Handoff: docs/guides/2026-04-18-motion-flowline-webgpu-phase11-onward-handoff.md §6.2
// Pattern: memory feedback_sdf_precision_r32float (uint8 禁止 → r32float only)
//
// Design notes
// ------------
// - Supersample factor is 4× (16× area precision). The §6.2 guidance reads
//   "8× supersample" but 8× at 1024×256 output yields 8192×2048 = 16.7 M
//   source pixels, whose dx/dy scratch buffers peak ≈200 MB — fragile in the
//   browser. 4× gives ~50 MB peak and remains well above the subpixel
//   threshold needed once the agent samples through linear filtering.
//   If M5 finds edge jaggies, §12.5 allows bumping to 8×.
// - Distance transform: 8SSEDT (Leymarie & Levine 1992). O(n), simple, and
//   well within the 5 % Euclidean error that is invisible after downsample.
// - Signed: outsideDist − insideDist, then scale from source-pixel units
//   into world units so shader thresholds stay intuitive.
// ============================================================

const SUPERSAMPLE = 4;

export type SdfGenerateOptions = {
  /** Final texture width in pixels (consumed by WebGPU sampler). */
  readonly outputWidth: number;
  /** Final texture height in pixels. */
  readonly outputHeight: number;
  /** Hero text to rasterize. */
  readonly text: string;
  /**
   * CSS font family/weight string WITHOUT size. The generator prepends a
   * computed pixel size so the glyph fills ~78 % of the supersample canvas
   * height regardless of supersample factor.
   */
  readonly fontStack: string;
  /** Font weight (e.g., 900 for extra-bold). */
  readonly fontWeight: number;
  /** World-space width the SDF texture maps to. */
  readonly worldWidth: number;
};

export type GeneratedSdf = {
  /**
   * Signed distance in WORLD units, row-major.
   * Negative = inside glyph, positive = outside, 0 on the boundary.
   */
  readonly data: Float32Array;
  readonly width: number;
  readonly height: number;
  /** Used by downstream tests and debug logging. */
  readonly sourceWidth: number;
  readonly sourceHeight: number;
};

export function generateGlyphSdf(options: SdfGenerateOptions): GeneratedSdf {
  const { outputWidth, outputHeight, text, fontStack, fontWeight, worldWidth } = options;
  const sourceW = outputWidth * SUPERSAMPLE;
  const sourceH = outputHeight * SUPERSAMPLE;

  // 1. Rasterize text on an offscreen canvas
  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(sourceW, sourceH)
      : (() => {
          const c = document.createElement("canvas");
          c.width = sourceW;
          c.height = sourceH;
          return c;
        })();
  const ctx = canvas.getContext("2d") as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null;
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, sourceW, sourceH);

  const fontPx = Math.floor(sourceH * 0.78);
  ctx.fillStyle = "#fff";
  ctx.font = `${fontWeight} ${fontPx}px ${fontStack}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, sourceW / 2, sourceH / 2);

  const imageData = ctx.getImageData(0, 0, sourceW, sourceH);
  const pixels = imageData.data;

  // 2. Binary mask at supersample resolution (alpha > 128 = inside glyph)
  const sourceSize = sourceW * sourceH;
  const mask = new Uint8Array(sourceSize);
  for (let i = 0; i < sourceSize; i++) {
    mask[i] = pixels[i * 4] > 128 ? 1 : 0;
  }

  // 3. Signed EDT via 8SSEDT on both masks
  const distOutside = edt8ssedt(mask, sourceW, sourceH, /* foreground = */ 1);
  const distInside = edt8ssedt(mask, sourceW, sourceH, /* foreground = */ 0);

  // 4. Signed source-pixel distances, then box-filter downsample to output size
  //    and convert to world units (distWorld = distSrcPx * worldWidth / sourceW)
  const pixelToWorld = worldWidth / sourceW;
  const output = new Float32Array(outputWidth * outputHeight);
  const blockArea = SUPERSAMPLE * SUPERSAMPLE;
  for (let y = 0; y < outputHeight; y++) {
    for (let x = 0; x < outputWidth; x++) {
      let sum = 0;
      for (let dy = 0; dy < SUPERSAMPLE; dy++) {
        const srcY = y * SUPERSAMPLE + dy;
        for (let dx = 0; dx < SUPERSAMPLE; dx++) {
          const srcX = x * SUPERSAMPLE + dx;
          const idx = srcY * sourceW + srcX;
          sum += distOutside[idx] - distInside[idx];
        }
      }
      output[y * outputWidth + x] = (sum / blockArea) * pixelToWorld;
    }
  }

  return {
    data: output,
    width: outputWidth,
    height: outputHeight,
    sourceWidth: sourceW,
    sourceHeight: sourceH,
  };
}

// ── 8SSEDT (Leymarie-Levine 1992) ──────────────────────────────
// Two-pass sweep, O(n). Returns Euclidean distance in source pixels
// from each pixel to the nearest foreground pixel.

const EDT_INF = 1e6;

function edt8ssedt(
  mask: Uint8Array,
  w: number,
  h: number,
  foregroundValue: number,
): Float32Array {
  const size = w * h;
  const dx = new Float32Array(size);
  const dy = new Float32Array(size);

  for (let i = 0; i < size; i++) {
    if (mask[i] === foregroundValue) {
      dx[i] = 0;
      dy[i] = 0;
    } else {
      dx[i] = EDT_INF;
      dy[i] = EDT_INF;
    }
  }

  const compare = (i: number, j: number, offX: number, offY: number): void => {
    const newX = dx[j] + offX;
    const newY = dy[j] + offY;
    const newDist2 = newX * newX + newY * newY;
    const curDist2 = dx[i] * dx[i] + dy[i] * dy[i];
    if (newDist2 < curDist2) {
      dx[i] = newX;
      dy[i] = newY;
    }
  };

  // Forward pass: top-left → bottom-right, with a left-to-right intra-row
  // cleanup second half.
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (y > 0) {
        if (x > 0)     compare(i, i - w - 1, 1, 1);
        compare(i, i - w, 0, 1);
        if (x < w - 1) compare(i, i - w + 1, 1, 1);
      }
      if (x > 0) compare(i, i - 1, 1, 0);
    }
    for (let x = w - 2; x >= 0; x--) {
      const i = y * w + x;
      compare(i, i + 1, 1, 0);
    }
  }

  // Backward pass
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      if (y < h - 1) {
        if (x < w - 1) compare(i, i + w + 1, 1, 1);
        compare(i, i + w, 0, 1);
        if (x > 0)     compare(i, i + w - 1, 1, 1);
      }
      if (x < w - 1) compare(i, i + 1, 1, 0);
    }
    for (let x = 1; x < w; x++) {
      const i = y * w + x;
      compare(i, i - 1, 1, 0);
    }
  }

  const dist = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    dist[i] = Math.sqrt(dx[i] * dx[i] + dy[i] * dy[i]);
  }
  return dist;
}

/** Constant exported so glyph-registry and tests share one definition. */
export const SDF_SUPERSAMPLE = SUPERSAMPLE;
