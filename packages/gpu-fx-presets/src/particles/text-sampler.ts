/**
 * Text → coordinate sampler for particle-based typography.
 * Rasterizes text to an off-screen canvas, then samples dark-pixel
 * positions into normalised [0,1] coordinates (aspect-ratio preserved).
 */

function createCanvas(w: number, h: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(w, h);
  }
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

const CANVAS_W = 512;
const CANVAS_H = 512; // Square canvas — equal X/Y mapping
const SAMPLE_STRIDE = 4;
const ALPHA_THRESHOLD = 128;

// Normalisation: map pixel coords → [0.15, 0.85] in both axes (square)
const PAD = 0.15;
const RANGE = 1.0 - PAD * 2; // 0.70

export function sampleTextPositions(
  text: string,
  count: number,
  fontSize: number = 160,
): { x: number; y: number }[] {
  const canvas = createCanvas(CANVAS_W, CANVAS_H);
  const ctx = (canvas as HTMLCanvasElement).getContext("2d")!;

  // Clear to transparent
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Draw text — use opaque white background + black text for reliable alpha
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.font = `900 ${fontSize}px "Helvetica Neue", "Arial Black", system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  // letterSpacing may not be supported on OffscreenCanvasRenderingContext2D
  try {
    (ctx as CanvasRenderingContext2D).letterSpacing = "8px";
  } catch { /* ignore */ }
  ctx.fillStyle = "#000";
  ctx.fillText(text, CANVAS_W / 2, CANVAS_H / 2);

  // Scan pixels: dark pixels = text (check red channel on white bg)
  const imageData = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
  const pixels = imageData.data;
  const candidates: { x: number; y: number }[] = [];

  for (let y = 0; y < CANVAS_H; y += SAMPLE_STRIDE) {
    for (let x = 0; x < CANVAS_W; x += SAMPLE_STRIDE) {
      const idx = (y * CANVAS_W + x) * 4;
      // On white background, text pixels have low R value
      if (pixels[idx] < ALPHA_THRESHOLD) {
        candidates.push({
          x: PAD + (x / CANVAS_W) * RANGE,
          y: PAD + (y / CANVAS_H) * RANGE,
        });
      }
    }
  }

  if (candidates.length === 0) {
    console.warn("[text-sampler] FALLBACK: no text pixels found!");
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i < count; i++) {
      out.push({
        x: PAD + (i / count) * RANGE,
        y: 0.5,
      });
    }
    return out;
  }

  // Uniform stride sub-sample to exactly `count` positions
  const result: { x: number; y: number }[] = [];
  const stride = Math.max(1, Math.floor(candidates.length / count));

  for (let i = 0; i < count; i++) {
    const ci = Math.min(i * stride, candidates.length - 1);
    result.push(candidates[ci]);
  }

  return result;
}

/**
 * Create a GPU texture mask from rendered text.
 * White pixels where text exists, black elsewhere.
 * High resolution (1024×1024) with soft anti-aliased edges.
 */
export function createTextMaskTexture(
  device: GPUDevice,
  text: string,
  fontSize: number = 160,
): GPUTexture {
  const MASK_SIZE = 1024;
  const scale = MASK_SIZE / CANVAS_W; // 2× supersampling
  const scaledFontSize = fontSize * scale;

  const canvas = createCanvas(MASK_SIZE, MASK_SIZE);
  const ctx = (canvas as HTMLCanvasElement).getContext("2d")!;

  // Black background
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, MASK_SIZE, MASK_SIZE);

  // Soft glow layer for anti-aliased edges
  ctx.save();
  ctx.shadowColor = "#fff";
  ctx.shadowBlur = 4 * scale;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.font = `900 ${scaledFontSize}px "Helvetica Neue", "Arial Black", system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  try {
    (ctx as CanvasRenderingContext2D).letterSpacing = `${8 * scale}px`;
  } catch { /* ignore */ }
  ctx.fillStyle = "#fff";
  ctx.fillText(text, MASK_SIZE / 2, MASK_SIZE / 2);
  ctx.restore();

  // Solid fill on top for crisp interior
  ctx.font = `900 ${scaledFontSize}px "Helvetica Neue", "Arial Black", system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  try {
    (ctx as CanvasRenderingContext2D).letterSpacing = `${8 * scale}px`;
  } catch { /* ignore */ }
  ctx.fillStyle = "#fff";
  ctx.fillText(text, MASK_SIZE / 2, MASK_SIZE / 2);

  const imageData = ctx.getImageData(0, 0, MASK_SIZE, MASK_SIZE);

  const texture = device.createTexture({
    label: "text-mask",
    size: [MASK_SIZE, MASK_SIZE],
    format: "rgba8unorm",
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
  });

  device.queue.writeTexture(
    { texture },
    imageData.data,
    { bytesPerRow: MASK_SIZE * 4, rowsPerImage: MASK_SIZE },
    [MASK_SIZE, MASK_SIZE],
  );

  return texture;
}
