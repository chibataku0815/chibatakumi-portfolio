// ============================================================
// motion-flowline-webgpu — Phase 14 parametric shape curves
//
// Pure TS mirrors of the WGSL parametric formulas in flowline-update.wgsl §2c.
// Host-side helpers for unit tests and for potential CPU-side preset tuning;
// the runtime path lives in the shader, not here.
// ============================================================

/**
 * Hypotrochoid — inner circle of radius `r` rolls inside outer circle of
 * radius `R`. Pen is at offset `d` from the inner centre. Produces rosette
 * curves; petal count = (R-r)/gcd(R,r) when R/r is rational.
 *
 *   x(θ) = (R - r) · cos(θ) + d · cos((R-r)/r · θ)
 *   y(θ) = (R - r) · sin(θ) - d · sin((R-r)/r · θ)
 *
 * At θ=0 this evaluates to (R - r + d, 0), which the Spirograph classic
 * "pen-on-major-axis" starting point.
 */
export function hypotrochoid(
  theta: number,
  R: number,
  r: number,
  d: number,
): [number, number] {
  const k = (R - r) / Math.max(r, 1e-5);
  return [
    (R - r) * Math.cos(theta) + d * Math.cos(k * theta),
    (R - r) * Math.sin(theta) - d * Math.sin(k * theta),
  ];
}

/**
 * Epitrochoid — inner circle of radius `r` rolls OUTSIDE outer of radius `R`.
 * Star-form rosette. At θ=0 the pen is at (R + r - d, 0).
 *
 *   x(θ) = (R + r) · cos(θ) - d · cos((R+r)/r · θ)
 *   y(θ) = (R + r) · sin(θ) - d · sin((R+r)/r · θ)
 */
export function epitrochoid(
  theta: number,
  R: number,
  r: number,
  d: number,
): [number, number] {
  const k = (R + r) / Math.max(r, 1e-5);
  return [
    (R + r) * Math.cos(theta) - d * Math.cos(k * theta),
    (R + r) * Math.sin(theta) - d * Math.sin(k * theta),
  ];
}

/**
 * Lissajous — orthogonal sinusoids on X and Y. `a` is the X frequency, Y is
 * fixed at 1. Phase offset π/2 on X so the curve enters the canvas along the
 * +X axis (classic oscilloscope reading).
 *
 *   x(θ) = Ax · sin(a · θ + π/2) = Ax · cos(a · θ)
 *   y(θ) = Ay · sin(θ)
 *
 * At θ=0: x = Ax, y = 0.
 * a=1 produces a circle (trivially, the identity form); a=2 gives a figure-8
 * along +X; a=3 gives three horizontal lobes (the Spirograph-adjacent look).
 */
export function lissajous(
  theta: number,
  Ax: number,
  Ay: number,
  a: number,
): [number, number] {
  return [
    Ax * Math.sin(a * theta + Math.PI / 2),
    Ay * Math.sin(theta),
  ];
}
