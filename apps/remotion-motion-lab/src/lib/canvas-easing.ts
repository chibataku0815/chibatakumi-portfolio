/**
 * Canvas Easing — Robert Penner's Complete 30 Easing Functions
 *
 * 10 families x 3 variants (In / Out / InOut) = 30 functions.
 * All functions accept t in [0,1] and return a value in [0,1]
 * (Back/Elastic/Bounce may temporarily exceed this range).
 *
 * canvas-primitives.tsx retains its 4 legacy easings for backward compat.
 * New compositions (Phase 2+) should import from this file.
 */

export type EasingFn = (t: number) => number;

// ---------------------------------------------------------------------------
// Sine
// ---------------------------------------------------------------------------
export function sineIn(t: number): number {
  return 1 - Math.cos((t * Math.PI) / 2);
}
export function sineOut(t: number): number {
  return Math.sin((t * Math.PI) / 2);
}
export function sineInOut(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

// ---------------------------------------------------------------------------
// Quad
// ---------------------------------------------------------------------------
export function quadIn(t: number): number {
  return t * t;
}
export function quadOut(t: number): number {
  return 1 - (1 - t) * (1 - t);
}
export function quadInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// ---------------------------------------------------------------------------
// Cubic
// ---------------------------------------------------------------------------
export function cubicIn(t: number): number {
  return t * t * t;
}
export function cubicOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
export function cubicInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ---------------------------------------------------------------------------
// Quart
// ---------------------------------------------------------------------------
export function quartIn(t: number): number {
  return t * t * t * t;
}
export function quartOut(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}
export function quartInOut(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

// ---------------------------------------------------------------------------
// Quint
// ---------------------------------------------------------------------------
export function quintIn(t: number): number {
  return t * t * t * t * t;
}
export function quintOut(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}
export function quintInOut(t: number): number {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

// ---------------------------------------------------------------------------
// Expo
// ---------------------------------------------------------------------------
export function expoIn(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
}
export function expoOut(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}
export function expoInOut(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return t < 0.5
    ? Math.pow(2, 20 * t - 10) / 2
    : (2 - Math.pow(2, -20 * t + 10)) / 2;
}

// ---------------------------------------------------------------------------
// Circ
// ---------------------------------------------------------------------------
export function circIn(t: number): number {
  return 1 - Math.sqrt(1 - t * t);
}
export function circOut(t: number): number {
  return Math.sqrt(1 - Math.pow(t - 1, 2));
}
export function circInOut(t: number): number {
  return t < 0.5
    ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
    : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
}

// ---------------------------------------------------------------------------
// Back
// ---------------------------------------------------------------------------
const c1 = 1.70158;
const c2 = c1 * 1.525;
const c3 = c1 + 1;

export function backIn(t: number): number {
  return c3 * t * t * t - c1 * t * t;
}
export function backOut(t: number): number {
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
export function backInOut(t: number): number {
  return t < 0.5
    ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
    : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
}

// ---------------------------------------------------------------------------
// Elastic
// ---------------------------------------------------------------------------
const c4 = (2 * Math.PI) / 3;
const c5 = (2 * Math.PI) / 4.5;

export function elasticIn(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
}
export function elasticOut(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}
export function elasticInOut(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return t < 0.5
    ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
    : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
}

// ---------------------------------------------------------------------------
// Bounce
// ---------------------------------------------------------------------------
export function bounceOut(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
}
export function bounceIn(t: number): number {
  return 1 - bounceOut(1 - t);
}
export function bounceInOut(t: number): number {
  return t < 0.5
    ? (1 - bounceOut(1 - 2 * t)) / 2
    : (1 + bounceOut(2 * t - 1)) / 2;
}

// ---------------------------------------------------------------------------
// Name-based lookup map (config-driven usage)
// ---------------------------------------------------------------------------
export const EASINGS: Record<string, EasingFn> = {
  sineIn,
  sineOut,
  sineInOut,
  quadIn,
  quadOut,
  quadInOut,
  cubicIn,
  cubicOut,
  cubicInOut,
  quartIn,
  quartOut,
  quartInOut,
  quintIn,
  quintOut,
  quintInOut,
  expoIn,
  expoOut,
  expoInOut,
  circIn,
  circOut,
  circInOut,
  backIn,
  backOut,
  backInOut,
  elasticIn,
  elasticOut,
  elasticInOut,
  bounceIn,
  bounceOut,
  bounceInOut,
};
