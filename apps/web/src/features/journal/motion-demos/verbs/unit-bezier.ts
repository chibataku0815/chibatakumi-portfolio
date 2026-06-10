// Vendored — verbatim from motion-grammar-lab.
//   source: packages/motion-grammar/src/unit-bezier.ts
//   upstream repo: forestone/motion-grammar-lab (private R&D)
//   why vendored, not imported: the upstream package is private:true with raw
//   TS exports + a Remotion-coupled barrel, so it is not consumable from this
//   deployed app. This file is the pure, dependency-free easing primitive only.
//   Keep byte-identical to upstream; do not edit the math here.
//
// Canonical unit cubic-bezier easing solver — y at parametric x for a cubic
// bezier whose implicit endpoints are (0,0) and (1,1) with control points
// (p1x,p1y),(p2x,p2y). Mathematically identical to the CSS cubic-bezier()
// timing function (40-iteration bisection of x(t), endpoint guard).

/** Cubic-bezier control points [p1x, p1y, p2x, p2y] for callers that carry them as a tuple. */
export type UnitBezier = [number, number, number, number];

/** y at parametric x along the cubic bezier (0,0)→(p1)→(p2)→(1,1). x is clamped to [0,1]. */
export const unitBezierY = (
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
  x: number,
): number => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i += 1) {
    const mid = (lo + hi) / 2;
    const omt = 1 - mid;
    const bx = 3 * omt * omt * mid * p1x + 3 * omt * mid * mid * p2x + mid ** 3;
    if (bx < x) lo = mid;
    else hi = mid;
  }
  const t = (lo + hi) / 2;
  const omt = 1 - t;
  return 3 * omt * omt * t * p1y + 3 * omt * t * t * p2y + t ** 3;
};
