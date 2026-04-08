export type TextureTransform = {
  offsetX: number;
  offsetY: number;
  rotationRad: number;
  scale: number;
};

type SteppedLoopOptions = {
  frame: number;
  holdFrames: number;
  seed: number;
  variantCount: number;
  offsetAmplitude: number;
  minScale: number;
  maxScale: number;
  rotationAmplitudeDeg: number;
};

type PosterizedWiggleOptions = {
  frame: number;
  fps: number;
  posterizeFps: number;
  seed: number;
  offsetAmplitude: number;
  rotationAmplitudeDeg: number;
  scaleBase: number;
  scaleJitter: number;
};

type DrawRepeatedTileOptions = {
  ctx: CanvasRenderingContext2D;
  tile: HTMLCanvasElement;
  width: number;
  height: number;
  transform: TextureTransform;
  opacity: number;
  compositeOperation?: GlobalCompositeOperation;
};

type FabricTileOptions = {
  size: number;
  seed: number;
  threadColor: string;
  crossThreadColor: string;
};

type DustTileOptions = {
  size: number;
  seed: number;
  dotColor: string;
  smudgeColor: string;
};

const TAU = Math.PI * 2;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const lerp = (start: number, end: number, progress: number) =>
  start + (end - start) * progress;

const seeded = (seed: number) => {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453123;
  return value - Math.floor(value);
};

const canvasPool = new Map<string, HTMLCanvasElement>();

const getReusableCanvas = (key: string, width: number, height: number) => {
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

export const sampleSteppedLoopTransform = ({
  frame,
  holdFrames,
  seed,
  variantCount,
  offsetAmplitude,
  minScale,
  maxScale,
  rotationAmplitudeDeg,
}: SteppedLoopOptions): TextureTransform => {
  const variantIndex = Math.floor(frame / Math.max(1, holdFrames)) % variantCount;
  const baseSeed = seed * 100 + variantIndex * 17;

  return {
    offsetX: lerp(-offsetAmplitude, offsetAmplitude, seeded(baseSeed + 1)),
    offsetY: lerp(-offsetAmplitude, offsetAmplitude, seeded(baseSeed + 2)),
    rotationRad:
      lerp(-rotationAmplitudeDeg, rotationAmplitudeDeg, seeded(baseSeed + 3)) *
      (Math.PI / 180),
    scale: lerp(minScale, maxScale, seeded(baseSeed + 4)),
  };
};

export const samplePosterizedWiggleTransform = ({
  frame,
  fps,
  posterizeFps,
  seed,
  offsetAmplitude,
  rotationAmplitudeDeg,
  scaleBase,
  scaleJitter,
}: PosterizedWiggleOptions): TextureTransform => {
  const framesPerStep = Math.max(1, Math.round(fps / posterizeFps));
  const sampleIndex = Math.floor(frame / framesPerStep);
  const baseSeed = seed * 1000 + sampleIndex * 29;

  return {
    offsetX: lerp(-offsetAmplitude, offsetAmplitude, seeded(baseSeed + 1)),
    offsetY: lerp(-offsetAmplitude, offsetAmplitude, seeded(baseSeed + 2)),
    rotationRad:
      lerp(-rotationAmplitudeDeg, rotationAmplitudeDeg, seeded(baseSeed + 3)) *
      (Math.PI / 180),
    scale: scaleBase + lerp(-scaleJitter, scaleJitter, seeded(baseSeed + 4)),
  };
};

export const getFabricTile = ({
  size,
  seed,
  threadColor,
  crossThreadColor,
}: FabricTileOptions) => {
  const canvas = getReusableCanvas(
    `67-fabric-${size}-${seed}-${threadColor}-${crossThreadColor}`,
    size,
    size,
  );

  if (!canvas) {
    return null;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas;
  }

  ctx.clearRect(0, 0, size, size);

  const cell = Math.max(9, Math.round(size / 18));

  for (let x = 0; x <= size + cell; x += cell) {
    const alpha = 0.03 + seeded(seed * 13 + x * 0.3) * 0.05;
    ctx.fillStyle = threadColor.replace("__ALPHA__", alpha.toFixed(3));
    ctx.fillRect(x, 0, 1 + Math.floor(seeded(seed + x) * 2), size);
  }

  for (let y = 0; y <= size + cell; y += cell) {
    const alpha = 0.025 + seeded(seed * 19 + y * 0.27) * 0.05;
    ctx.fillStyle = crossThreadColor.replace("__ALPHA__", alpha.toFixed(3));
    ctx.fillRect(0, y, size, 1 + Math.floor(seeded(seed + y + 11) * 2));
  }

  for (let index = 0; index < 64; index += 1) {
    const x = seeded(seed * 41 + index * 3.1) * size;
    const y = seeded(seed * 43 + index * 3.7) * size;
    const width = 2 + seeded(seed * 47 + index * 5.1) * 9;
    const height = 1 + seeded(seed * 53 + index * 4.9) * 2;

    ctx.fillStyle = `rgba(255,255,255,${(0.008 + seeded(seed * 59 + index) * 0.018).toFixed(3)})`;
    ctx.fillRect(x, y, width, height);
  }

  return canvas;
};

export const getDustTile = ({
  size,
  seed,
  dotColor,
  smudgeColor,
}: DustTileOptions) => {
  const canvas = getReusableCanvas(
    `67-dust-${size}-${seed}-${dotColor}-${smudgeColor}`,
    size,
    size,
  );

  if (!canvas) {
    return null;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas;
  }

  ctx.clearRect(0, 0, size, size);

  for (let index = 0; index < 116; index += 1) {
    const x = seeded(seed * 61 + index * 7.1) * size;
    const y = seeded(seed * 67 + index * 5.3) * size;
    const radius = 0.45 + seeded(seed * 71 + index * 2.7) * 1.6;
    const alpha = 0.08 + seeded(seed * 73 + index * 4.4) * 0.22;

    ctx.fillStyle = dotColor.replace("__ALPHA__", alpha.toFixed(3));
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.fill();
  }

  for (let index = 0; index < 8; index += 1) {
    const x = seeded(seed * 79 + index * 11.3) * size;
    const y = seeded(seed * 83 + index * 9.7) * size;
    const radiusX = 6 + seeded(seed * 89 + index * 3.9) * 12;
    const radiusY = 3 + seeded(seed * 97 + index * 4.7) * 6;
    const rotation = seeded(seed * 101 + index * 5.9) * TAU;
    const alpha = 0.02 + seeded(seed * 103 + index * 3.2) * 0.045;

    ctx.fillStyle = smudgeColor.replace("__ALPHA__", alpha.toFixed(3));
    ctx.beginPath();
    ctx.ellipse(x, y, radiusX, radiusY, rotation, 0, TAU);
    ctx.fill();
  }

  return canvas;
};

export const drawRepeatedTile = ({
  ctx,
  tile,
  width,
  height,
  transform,
  opacity,
  compositeOperation = "source-over",
}: DrawRepeatedTileOptions) => {
  const drawSize = Math.max(width, height) * 1.8;

  ctx.save();
  ctx.globalAlpha = clamp01(opacity);
  ctx.globalCompositeOperation = compositeOperation;
  ctx.translate(width / 2 + transform.offsetX, height / 2 + transform.offsetY);
  ctx.rotate(transform.rotationRad);
  ctx.scale(transform.scale, transform.scale);

  for (let y = -drawSize; y <= drawSize; y += tile.height) {
    for (let x = -drawSize; x <= drawSize; x += tile.width) {
      ctx.drawImage(tile, x, y);
    }
  }

  ctx.restore();
};

export const createCirclePath = (cx: number, cy: number, radius: number) => {
  const path = new Path2D();
  path.arc(cx, cy, radius, 0, TAU);
  return path;
};

export const createRectPath = ({
  cx,
  cy,
  width,
  height,
  rotationDeg,
}: {
  cx: number;
  cy: number;
  width: number;
  height: number;
  rotationDeg: number;
}) => {
  const path = new Path2D();
  const angle = (rotationDeg * Math.PI) / 180;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const corners = [
    { x: -halfWidth, y: -halfHeight },
    { x: halfWidth, y: -halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: -halfWidth, y: halfHeight },
  ];

  corners.forEach((corner, index) => {
    const x = cx + corner.x * Math.cos(angle) - corner.y * Math.sin(angle);
    const y = cy + corner.x * Math.sin(angle) + corner.y * Math.cos(angle);

    if (index === 0) {
      path.moveTo(x, y);
    } else {
      path.lineTo(x, y);
    }
  });

  path.closePath();
  return path;
};

export const createTrianglePath = (
  points: Array<{ x: number; y: number }>,
) => {
  const path = new Path2D();
  points.forEach((point, index) => {
    if (index === 0) {
      path.moveTo(point.x, point.y);
    } else {
      path.lineTo(point.x, point.y);
    }
  });
  path.closePath();
  return path;
};
