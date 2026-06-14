// Demo parameters + realization for the difference (差) motion study.
//
// These are the ORIGIN cell's measurement-bound constants (drawer cell #15
// "difference"/差 — six equal circles sharing four scalar channels driven by
// ONE palindrome clock that folds at the mirror frame: a quartet at the four
// quadrant sign placements (±u(t), ±v(t)) of one shared trajectory, and an
// axial pair at (±s(t), 0) carrying a band-width scalar w; nothing is keyed
// between members. 90-frame / 3s loop @ 30fps), copied from motion-grammar-lab
// studies/puttimw-motion-drawers/src/verbs/difference.ts. The schedule math
// lives in the vendored ./quadrant-sign-excursion
// (createQuadrantSignExcursionSchedule); this file supplies the measured rig,
// the render-only recentring, and the cell's realization (evenodd compound fill
// + Merge-Paths-union outline stroke).
//
// Deliberate adaptations for this embedded demo (the allowed three only):
//   1. Recentring: the cell reserves a lower band for its "差" kana label, so
//      the figure sits high. This label-free demo adds a render-only shift so
//      the motion's full-loop bbox centre lands on the 324-square centre. It is
//      derived by sweeping the schedule (no magic number) and added LAST per
//      position, so every value equals the schedule's value plus one constant;
//      the mechanism is untouched (the design-space base is what the article
//      skeleton is proven equal to).
//   2. No calibration to strip: the cell draws raw schedule cx/cy/r (it bakes
//      no registration or AA bias into the schedule), so there is nothing to
//      preserve or zero beyond the recentre.
//   3. Colours are NOT carried. The cell binds a study-side blue the schedule
//      never reads; all six circles share ONE tone. The SVG demo paints with
//      the page ink (currentColor), the finish demo with the API-finish light
//      palette.

import {
  createQuadrantSignExcursionSchedule,
  type QuadrantSignExcursionCircleState,
  type QuadrantSignExcursionParams,
} from "./quadrant-sign-excursion";

export type DifferenceFigure = {
  /** evenodd compound path of the 4 quadrant circles (the symmetric-difference look) */
  fillPath: string;
  /** union outline of the 2 axial circles (the peanut ring) */
  peanutPath: string;
  /** stroke width of the peanut outline at this frame */
  bandWidth: number;
};

export const DIFFERENCE_VIEWBOX = 324;
export const DIFFERENCE_PERIOD_FRAMES = 90;
export const DIFFERENCE_FPS = 30; // design contract: 90f = 3s loop

/**
 * Static fallback frame for prefers-reduced-motion: near the v apex, the four
 * quadrant circles are spread into a clear symmetric-difference figure and the
 * axial pair has opened into a peanut, so the whole construction reads in one
 * still. (At the mirror frame the v channel is back at base, so the fill
 * extinguishes — a poor still.)
 */
export const DIFFERENCE_POSTER_FRAME = 30;

// Measured rig (no calibration baked, adaptation 2). One palindrome clock
// (mirror at frame 44: param(t>44) = param(88−t)) drives four channels —
// u (2-key ease ramp) and v (apex bump) for the quartet trajectory, s (2-key
// ease ramp, lagging u) and w (apex bump) for the axial pair's separation and
// band width — through one 45° axis frame. Six equal circles are placed at the
// sign placements of those shared channels; nothing is derived between them.
export const DIFFERENCE_RIG: QuadrantSignExcursionParams = {
  periodFrames: 90,
  mirrorFrame: 44,
  quadrantRadius: 66.47,
  axialRadius: 66.98,
  u: { t0: 1.45, endF: 44, end: 27.69, ease: [0.671, 0.23, 0.281, 0.658] },
  v: {
    t0: 1.45,
    apexF: 29.3,
    apex: 14.41,
    endF: 44,
    base: 0,
    e1: [0.909, 0.479, 0.632, 0.942],
    e2: [0.516, 0.0, 1.0, 0.709],
  },
  s: { t0: 2.92, endF: 42.5, end: 25.88, ease: [0.627, 0.095, 0.241, 0.455] },
  w: {
    t0: 0,
    apexF: 35.4,
    apex: 8.68,
    endF: 44,
    base: 4.5,
    e1: [0.848, 0.415, 0.188, 1.0],
    e2: [1.0, 0.169, 0.77, 0.0],
  },
  center: [169.6, 127.3],
  axisDeg: 45.0,
};

const baseSchedule = createQuadrantSignExcursionSchedule(DIFFERENCE_RIG);

// Render-only recentring (adaptation 1): sweep the whole loop, take the bbox of
// every circle over all frames, and shift its midpoint to the 324-square centre.
// The motion is sign-symmetric so the midpoint ~ the cell centre; the shift just
// drops the label band the cell reserved.
const computeRecenterShift = () => {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let f = 0; f < DIFFERENCE_RIG.periodFrames; f += 1) {
    const s = baseSchedule(f);
    for (const c of [...s.quadrantCircles, ...s.axialCircles]) {
      minX = Math.min(minX, c.cx - c.r);
      maxX = Math.max(maxX, c.cx + c.r);
      minY = Math.min(minY, c.cy - c.r);
      maxY = Math.max(maxY, c.cy + c.r);
    }
  }
  const half = DIFFERENCE_VIEWBOX / 2;
  return { x: half - (minX + maxX) / 2, y: half - (minY + maxY) / 2 };
};

const SHIFT = computeRecenterShift();

const shifted = (c: QuadrantSignExcursionCircleState) => ({
  cx: c.cx + SHIFT.x,
  cy: c.cy + SHIFT.y,
  r: c.r,
});

// ---- Realization (renderer-side, NOT the schedule). Vendored verbatim from
// studies/puttimw-motion-drawers/src/cells/DifferenceCell.tsx: the cell paints
// the 4 quadrant circles as ONE compound path with fill-rule evenodd (= the
// symmetric-difference "difference" look), and the 2 axial circles as their
// Merge-Paths union outline (a peanut), stroked at the band width. ----

/** one circle as a 2-arc subpath (for evenodd compositing) */
const circleSubpath = (c: QuadrantSignExcursionCircleState): string => {
  const x0 = (c.cx - c.r).toFixed(4);
  const x1 = (c.cx + c.r).toFixed(4);
  const y = c.cy.toFixed(4);
  const r = c.r.toFixed(4);
  return `M ${x0} ${y} A ${r} ${r} 0 1 0 ${x1} ${y} A ${r} ${r} 0 1 0 ${x0} ${y} Z`;
};

/**
 * union (Merge Paths "add") outline of two equal circles = a peanut path: the
 * two "far" major arcs joined at the intersection points. The SVG arc centre is
 * fixed by the F.6.5 sign rule, so the sweep flag is chosen numerically (the one
 * whose implied centre lands on this circle's centre). Degenerates to a single
 * circle when the two are concentric.
 */
const unionPeanutPath = (
  a: QuadrantSignExcursionCircleState,
  b: QuadrantSignExcursionCircleState,
): string => {
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  const d = Math.hypot(dx, dy);
  if (d < 1e-6) return circleSubpath(a);
  if (d >= a.r + b.r) return `${circleSubpath(a)} ${circleSubpath(b)}`;
  const r = a.r; // the cell's axial pair is equal-radius
  const ux = dx / d;
  const uy = dy / d;
  const mx = (a.cx + b.cx) / 2;
  const my = (a.cy + b.cy) / 2;
  const h = Math.sqrt(Math.max(r * r - (d / 2) * (d / 2), 0));
  const p1 = { x: mx - uy * h, y: my + ux * h };
  const p2 = { x: mx + uy * h, y: my - ux * h };
  const sweepFor = (
    from: { x: number; y: number },
    to: { x: number; y: number },
    cx: number,
    cy: number,
  ): number => {
    const hx = (from.x - to.x) / 2;
    const hy = (from.y - to.y) / 2;
    const l2 = hx * hx + hy * hy;
    const q = Math.sqrt(Math.max(r * r - l2, 0) / Math.max(l2, 1e-12));
    const c0x = q * hy + (from.x + to.x) / 2;
    const c0y = -q * hx + (from.y + to.y) / 2;
    const d0 = Math.hypot(c0x - cx, c0y - cy);
    const c1x = -q * hy + (from.x + to.x) / 2;
    const c1y = q * hx + (from.y + to.y) / 2;
    const d1 = Math.hypot(c1x - cx, c1y - cy);
    return d0 <= d1 ? 0 : 1;
  };
  const s1 = sweepFor(p1, p2, a.cx, a.cy);
  const s2 = sweepFor(p2, p1, b.cx, b.cy);
  const rs = r.toFixed(4);
  return (
    `M ${p1.x.toFixed(4)} ${p1.y.toFixed(4)} ` +
    `A ${rs} ${rs} 0 1 ${s1} ${p2.x.toFixed(4)} ${p2.y.toFixed(4)} ` +
    `A ${rs} ${rs} 0 1 ${s2} ${p1.x.toFixed(4)} ${p1.y.toFixed(4)} Z`
  );
};

/**
 * The whole figure at a loop frame, recentred for the demo stage. The fill is
 * the four quadrant circles composited evenodd; the peanut is the two axial
 * circles' union outline; bandWidth is the schedule's w(t). The shift is added
 * to every circle centre first, so the realization is the schedule's geometry
 * plus the same constant — render-only, the mechanism is untouched.
 */
export const differenceFigureAt = (frame: number): DifferenceFigure => {
  const s = baseSchedule(frame);
  const quad = s.quadrantCircles.map(shifted);
  const axial = s.axialCircles.map(shifted);
  return {
    fillPath: quad.map(circleSubpath).join(" "),
    peanutPath: unionPeanutPath(axial[0], axial[1]),
    bandWidth: s.axialBandWidth,
  };
};
