const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;

export interface OrderedDitherOptions {
  pixelSize?: number;
  threshold?: number;
}

export const applyOrderedDither = (
  source: HTMLCanvasElement,
  target: HTMLCanvasElement,
  options: OrderedDitherOptions = {},
): void => {
  const width = source.width;
  const height = source.height;

  if (target.width !== width) {
    target.width = width;
  }

  if (target.height !== height) {
    target.height = height;
  }

  const sourceContext = source.getContext("2d");
  const targetContext = target.getContext("2d");

  if (!sourceContext || !targetContext) {
    return;
  }

  const pixelSize = Math.max(1, Math.floor(options.pixelSize ?? 1));
  const threshold = Math.max(0, Math.min(1, options.threshold ?? 0.5));
  const thresholdBias = 0.5 - threshold;
  const sourceData = sourceContext.getImageData(0, 0, width, height);
  const output = targetContext.createImageData(width, height);
  const sourcePixels = sourceData.data;
  const outputPixels = output.data;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const alpha = sourcePixels[index + 3] / 255;

      if (alpha <= 0) {
        continue;
      }

      const matrixX = Math.floor(x / pixelSize) % 4;
      const matrixY = Math.floor(y / pixelSize) % 4;
      const matrixThreshold = (BAYER_4X4[matrixY][matrixX] + 0.5) / 16;
      const adjustedAlpha = Math.max(0, Math.min(1, alpha + thresholdBias));

      if (adjustedAlpha < matrixThreshold) {
        continue;
      }

      outputPixels[index] = sourcePixels[index];
      outputPixels[index + 1] = sourcePixels[index + 1];
      outputPixels[index + 2] = sourcePixels[index + 2];
      outputPixels[index + 3] = 255;
    }
  }

  targetContext.clearRect(0, 0, width, height);
  targetContext.putImageData(output, 0, 0);
};
