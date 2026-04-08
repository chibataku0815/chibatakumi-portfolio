export type PatternMethod = "motion-tile" | "repetile" | "hex-tile";
export type MirrorMode =
  | "none"
  | "checker"
  | "alternate-columns"
  | "alternate-rows";
export type MotifMotionVariant = "pulse" | "sway" | "spin";

export type PatternSceneSpec = {
  method: PatternMethod;
  tileWidth: number;
  tileHeight: number;
  motifScale: number;
  startX?: number;
  startY?: number;
  rowOffset?: number;
  mirrorMode?: MirrorMode;
  rotationJitterDeg?: number;
};

export type PatternTile = {
  key: string;
  x: number;
  y: number;
  baseScale: number;
  baseRotationDeg: number;
  mirrorX: boolean;
  mirrorY: boolean;
  seed: number;
};

export type MotifTransform = {
  scale: number;
  rotationDeg: number;
  offsetX: number;
  offsetY: number;
};

const TAU = Math.PI * 2;

const lerp = (start: number, end: number, progress: number) =>
  start + (end - start) * progress;

export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export const seeded = (seed: number) => {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453123;
  return value - Math.floor(value);
};

const getMirrorFlags = ({
  row,
  col,
  mode,
}: {
  row: number;
  col: number;
  mode: MirrorMode;
}) => {
  switch (mode) {
    case "checker":
      return {
        mirrorX: (row + col) % 2 !== 0,
        mirrorY: false,
      };
    case "alternate-columns":
      return {
        mirrorX: col % 2 !== 0,
        mirrorY: false,
      };
    case "alternate-rows":
      return {
        mirrorX: false,
        mirrorY: row % 2 !== 0,
      };
    default:
      return { mirrorX: false, mirrorY: false };
  }
};

const createRectPattern = ({
  width,
  height,
  tileWidth,
  tileHeight,
  motifScale,
  startX = 0,
  startY = 0,
  rowOffset = 0,
  mirrorMode = "none",
  rotationJitterDeg = 0,
}: Omit<PatternSceneSpec, "method"> & {
  width: number;
  height: number;
}) => {
  const tiles: PatternTile[] = [];
  const cols = Math.ceil((width + tileWidth * 3) / tileWidth);
  const rows = Math.ceil((height + tileHeight * 3) / tileHeight);

  for (let row = -1; row < rows; row += 1) {
    const offsetX = (row % 2 === 0 ? 0 : tileWidth * rowOffset) + startX;
    const y = startY + row * tileHeight + tileHeight * 0.5;

    for (let col = -1; col < cols; col += 1) {
      const x = offsetX + col * tileWidth + tileWidth * 0.5;
      const seed = row * 101 + col * 31 + 17;
      const mirror = getMirrorFlags({ row, col, mode: mirrorMode });

      tiles.push({
        key: `rect-${row}-${col}`,
        x,
        y,
        baseScale: motifScale * lerp(0.96, 1.04, seeded(seed + 1)),
        baseRotationDeg: lerp(
          -rotationJitterDeg,
          rotationJitterDeg,
          seeded(seed + 2),
        ),
        mirrorX: mirror.mirrorX,
        mirrorY: mirror.mirrorY,
        seed,
      });
    }
  }

  return tiles;
};

const createHexPattern = ({
  width,
  height,
  tileWidth,
  tileHeight,
  motifScale,
  startX = 0,
  startY = 0,
  mirrorMode = "none",
  rotationJitterDeg = 0,
}: Omit<PatternSceneSpec, "method"> & {
  width: number;
  height: number;
}) => {
  const tiles: PatternTile[] = [];
  const xSpacing = tileWidth * 0.94;
  const ySpacing = tileHeight * 0.86;
  const cols = Math.ceil((width + xSpacing * 4) / xSpacing);
  const rows = Math.ceil((height + ySpacing * 4) / ySpacing);

  for (let row = -2; row < rows; row += 1) {
    const offsetX = startX + (row % 2 === 0 ? 0 : xSpacing * 0.5);
    const y = startY + row * ySpacing + tileHeight * 0.52;

    for (let col = -2; col < cols; col += 1) {
      const x = offsetX + col * xSpacing + tileWidth * 0.48;
      const seed = row * 149 + col * 47 + 29;
      const mirror = getMirrorFlags({ row, col, mode: mirrorMode });

      tiles.push({
        key: `hex-${row}-${col}`,
        x,
        y,
        baseScale: motifScale * lerp(0.94, 1.06, seeded(seed + 1)),
        baseRotationDeg:
          lerp(-rotationJitterDeg, rotationJitterDeg, seeded(seed + 2)) +
          ((row + col) % 3) * 4,
        mirrorX: mirror.mirrorX,
        mirrorY: mirror.mirrorY,
        seed,
      });
    }
  }

  return tiles;
};

export const createPatternTiles = ({
  width,
  height,
  spec,
}: {
  width: number;
  height: number;
  spec: PatternSceneSpec;
}) => {
  if (spec.method === "hex-tile") {
    return createHexPattern({
      width,
      height,
      tileWidth: spec.tileWidth,
      tileHeight: spec.tileHeight,
      motifScale: spec.motifScale,
      startX: spec.startX,
      startY: spec.startY,
      mirrorMode: spec.mirrorMode,
      rotationJitterDeg: spec.rotationJitterDeg,
    });
  }

  return createRectPattern({
    width,
    height,
    tileWidth: spec.tileWidth,
    tileHeight: spec.tileHeight,
    motifScale: spec.motifScale,
    startX: spec.startX,
    startY: spec.startY,
    rowOffset: spec.rowOffset,
    mirrorMode: spec.mirrorMode,
    rotationJitterDeg: spec.rotationJitterDeg,
  });
};

export const getMotifTransform = ({
  frame,
  fps,
  seed,
  variant,
}: {
  frame: number;
  fps: number;
  seed: number;
  variant: MotifMotionVariant;
}): MotifTransform => {
  const phase = seeded(seed + 1) * TAU;
  const speed = lerp(0.38, 0.62, seeded(seed + 2));
  const cycle = ((frame / fps) * speed * TAU + phase) % TAU;

  if (variant === "spin") {
    const spinDurationFrames = fps * 6.2;
    const spinProgress =
      ((frame + seeded(seed + 7) * spinDurationFrames) % spinDurationFrames) /
      spinDurationFrames;

    return {
      scale: 1 + Math.sin(cycle) * 0.02,
      rotationDeg: spinProgress * 84 + Math.sin(cycle * 0.5) * 3.2,
      offsetX: Math.cos(cycle * 0.5) * 2.2,
      offsetY: Math.sin(cycle) * 2.8,
    };
  }

  if (variant === "sway") {
    return {
      scale: 1 + Math.sin(cycle) * 0.022,
      rotationDeg: Math.sin(cycle) * 4.2,
      offsetX: Math.cos(cycle) * 3.4,
      offsetY: Math.sin(cycle * 1.4) * 2,
    };
  }

  return {
    scale: 1 + Math.sin(cycle) * 0.03,
    rotationDeg: Math.sin(cycle * 0.9) * 2.8,
    offsetX: Math.cos(cycle * 0.8) * 1.8,
    offsetY: Math.sin(cycle) * 3.4,
  };
};

export type Speck = {
  key: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  blur: number;
};

export const createPaperSpecks = ({
  width,
  height,
  count,
  seed,
  minSize,
  maxSize,
  minOpacity,
  maxOpacity,
  blurRange,
}: {
  width: number;
  height: number;
  count: number;
  seed: number;
  minSize: number;
  maxSize: number;
  minOpacity: number;
  maxOpacity: number;
  blurRange: [number, number];
}) => {
  const specs: Speck[] = [];

  for (let index = 0; index < count; index += 1) {
    const localSeed = seed + index * 17;
    specs.push({
      key: `speck-${seed}-${index}`,
      x: seeded(localSeed + 1) * width,
      y: seeded(localSeed + 2) * height,
      size: lerp(minSize, maxSize, seeded(localSeed + 3)),
      opacity: lerp(minOpacity, maxOpacity, seeded(localSeed + 4)),
      blur: lerp(blurRange[0], blurRange[1], seeded(localSeed + 5)),
    });
  }

  return specs;
};
