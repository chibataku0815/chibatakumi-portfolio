// Motion tokens — re-export the canonical easing curves from @chibatakumi/motion-dot
// so the design-system surfaces the same motion grammar as the WebGPU stage.
//
// motion-dot's package.json only exposes `.` (the package root). The easing
// helpers live at `src/animation/easing.ts` but re-exported through
// `src/index.ts`? — they are NOT in the index re-export list. We bring them in
// directly via the package root import path with a deep relative — but cross-
// package deep imports break the workspace contract. Instead, re-implement the
// three canonical curves here. Source of truth remains motion-dot easing.ts;
// design-system's TS types stay decoupled.
//
// Reference: plan §2.3 (D3.2). Source: packages/motion-dot/src/animation/easing.ts.

/** Quintic ease-out (1 - (1 - t)^5). */
export function easeOutQuint(t: number): number {
  const t1 = t - 1;
  return 1 + t1 * t1 * t1 * t1 * t1;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Smootherstep — 6t^5 - 15t^4 + 10t^3 (Perlin's improved smoothstep). */
export function smootherstep(t: number): number {
  const tc = clamp01(t);
  return tc * tc * tc * (tc * (tc * 6 - 15) + 10);
}

/** Spring-like overshoot easing. Defaults to a 1.2x peak. */
export function springScaleSimple(t: number, peak: number = 1.2): number {
  if (t >= 1) return 1;
  if (t <= 0) return 0;
  const base = easeOutQuint(t);
  const bump = (peak - 1) * Math.exp(-((t - 0.55) ** 2) / 0.08);
  return base + bump;
}

/** CSS cubic-bezier strings used in apps/web/src/app/globals.css. */
export const MOTION_EASE = {
  soft: "cubic-bezier(0.22, 1, 0.36, 1)",
  drift: "cubic-bezier(0.19, 1, 0.22, 1)",
  ambient: "cubic-bezier(0.37, 0, 0.18, 1)",
} as const;

export const MOTION_DURATION = {
  xs: "0.34s",
  sm: "0.58s",
  md: "0.88s",
  lg: "1.12s",
} as const;
