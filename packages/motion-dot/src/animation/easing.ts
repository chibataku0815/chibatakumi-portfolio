// ─── Easing Functions (ported from Canvas2D version) ──────────

export function easeOutQuint(t: number): number {
  const t1 = t - 1;
  return 1 + t1 * t1 * t1 * t1 * t1;
}

export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutOvershoot(t: number, overshootAmount: number): number {
  if (t >= 1) return 1;
  if (t <= 0) return 0;
  const base = easeOutQuint(t);
  const overshoot = overshootAmount * Math.sin(t * Math.PI) * (1 - t);
  return base + overshoot;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

export function normalizeTime(elapsed: number, start: number, duration: number): number {
  return clamp((elapsed - start) / duration, 0, 1);
}

export function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

export function easeOutCubic(t: number): number {
  const t1 = t - 1;
  return 1 + t1 * t1 * t1;
}

export function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

export function easeInQuad(t: number): number {
  return t * t;
}

export function springScaleSimple(t: number, peak: number = 1.2): number {
  if (t >= 1) return 1;
  if (t <= 0) return 0;
  const base = easeOutQuint(t);
  const bump = (peak - 1) * Math.exp(-((t - 0.55) ** 2) / 0.08);
  return base + bump;
}

export function smootherstep(t: number): number {
  const tc = clamp(t, 0, 1);
  return tc * tc * tc * (tc * (tc * 6 - 15) + 10);
}
