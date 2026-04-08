export const TAU = Math.PI * 2;

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const clamp01 = (value: number) => clamp(value, 0, 1);

export const lerp = (start: number, end: number, progress: number) =>
  start + (end - start) * progress;

export const smoothstep = (edge0: number, edge1: number, value: number) => {
  if (edge0 === edge1) {
    return value < edge0 ? 0 : 1;
  }

  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

export const wrap = (value: number, size: number) => {
  const remainder = value % size;
  return remainder < 0 ? remainder + size : remainder;
};

export const degToRad = (degrees: number) => (degrees * Math.PI) / 180;

export const seeded = (seed: number) => {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453123;
  return value - Math.floor(value);
};
