import { seeded } from "./math";

const canvasPool = new Map<string, HTMLCanvasElement>();

export const getReusableCanvas = (
  key: string,
  width: number,
  height: number,
) => {
  if (typeof document === "undefined") {
    return null;
  }

  let canvas = canvasPool.get(key);
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvasPool.set(key, canvas);
  }

  if (canvas.width !== width) {
    canvas.width = width;
  }

  if (canvas.height !== height) {
    canvas.height = height;
  }

  return canvas;
};

export const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
};

export const drawGrainOverlay = ({
  ctx,
  x,
  y,
  width,
  height,
  density,
  seed,
}: {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  width: number;
  height: number;
  density: number;
  seed: number;
}) => {
  const dotCount = Math.max(24, Math.round(width * height * density * 0.0026));

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();

  for (let index = 0; index < dotCount; index += 1) {
    const localSeed = seed * 1000 + index * 13;
    const px = x + seeded(localSeed + 1) * width;
    const py = y + seeded(localSeed + 2) * height;
    const alpha = 0.025 + seeded(localSeed + 3) * density * 0.16;
    const size = 0.6 + seeded(localSeed + 4) * 1.6;

    ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
    ctx.fillRect(px, py, size, size);
  }

  ctx.restore();
};
