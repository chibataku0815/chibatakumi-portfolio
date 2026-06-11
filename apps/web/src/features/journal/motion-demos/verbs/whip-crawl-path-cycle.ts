// Vendored — verbatim schedule logic from motion-grammar-lab.
//   source: packages/motion-grammar/src/whip-crawl-path-cycle.ts
//   upstream repo: forestone/motion-grammar-lab (private R&D)
//   provenance: promoted from studies/puttimw-motion-drawers cell #4
//     (drawer "cycle"/循環) — see that study's
//     validation/cycle-construction-record.md.
//   why vendored, not imported: the upstream package is private:true with a
//     Remotion-coupled barrel, so it is not consumable from this deployed app.
//     The schedule below is pure (numbers in → numbers out): its only
//     dependency is the cubic-bezier easing primitive in ./unit-bezier, which
//     is mathematically identical to CSS cubic-bezier(). No Remotion, no React,
//     no DOM — safe to run in an rAF loop. Keep in sync with upstream; do not
//     re-derive the math here. Everything below the import line is
//     byte-identical to the upstream file below its import line.
//
// MECHANISM (load-bearing): ONE master phase u(frame) drives a head around a
// closed, arc-length-parametrized path. A single cubic-bezier WHIP covers
// whipSpan of the revolution in whipDurFrames; the remaining span is a LINEAR
// CRAWL whose rate (1 − whipSpan) / (period − whipDur) is FORCED by loop
// closure — it is not a free dial. The carrier path is a symmetric 4-anchor
// pen-tool infinity, flattened to a polyline for arc-length lookup; the dot
// rides the head at fraction u. The two-speed "gear shift" look is one bezier
// plus the arithmetic leftover of closing the lap.

import { unitBezierY } from "./unit-bezier";

/** Symmetric 4-anchor pen-tool infinity — the path GENERATOR (authorable). */
export interface InfinityGeneratorParams {
  /** crossing / self-intersection point, design px */
  cx: number;
  cy: number;
  /** half-width: tips at cx ± a */
  a: number;
  /** vertical handle length at both tips, px */
  tipHandle: number;
  /** handle length at the two center-crossing anchors, px */
  centerHandle: number;
  /** crossing tangent angle from +x axis, deg (screen y-down) */
  crossingAngleDeg: number;
}

export interface WhipCrawlCycleParams {
  periodFrames: number;
  /** loop-local frame where the whip beat starts (keyframe A) */
  whipStartFrame: number;
  /** whip beat length, frames (keyframe B at whipStart+whipDur) */
  whipDurFrames: number;
  /** head path-progress at whip start, arc fraction in [0,1) */
  uAtWhipStart: number;
  /** fraction of the revolution covered by the whip beat */
  whipSpan: number;
  /** whip temporal ease (unit cubic-bezier control points) */
  whipBezier: [number, number, number, number];
  generator: InfinityGeneratorParams;
}

/** master phase: head path-progress u(loop-local frame) ∈ [0, 1) */
export const whipCrawlMasterU = (
  local: number,
  p: WhipCrawlCycleParams,
): number => {
  const period = p.periodFrames;
  const g = (((local - p.whipStartFrame) % period) + period) % period;
  let u: number;
  if (g < p.whipDurFrames) {
    const [p1x, p1y, p2x, p2y] = p.whipBezier;
    u = p.uAtWhipStart + p.whipSpan * unitBezierY(p1x, p1y, p2x, p2y, g / p.whipDurFrames);
  } else {
    u =
      p.uAtWhipStart +
      p.whipSpan +
      ((1 - p.whipSpan) * (g - p.whipDurFrames)) / (period - p.whipDurFrames);
  }
  return ((u % 1) + 1) % 1;
};

export interface PathGeometry {
  /** SVG path data (4 cubic segments, closed) */
  d: string;
  /** flattened polyline: 4 segments × samplesPerSegment points (t=i/N) */
  points: [number, number][];
  /** cumulative arc length per vertex; last entry closes back to points[0] */
  cumulative: number[];
  totalLength: number;
}

/**
 * GENERATOR: build the symmetric 4-anchor infinity. Travel order (u=0 at the
 * right tip, matching the measured parametrization): R tip → down around the
 * lower-right lobe → center (heading up-left) → upper-left lobe → L tip →
 * down around the lower-left lobe → center (heading up-right) →
 * upper-right lobe → back to R tip.
 */
export const buildInfinityPath = (
  g: InfinityGeneratorParams,
  samplesPerSegment = 256,
): PathGeometry => {
  const ang = (g.crossingAngleDeg * Math.PI) / 180;
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const C: [number, number] = [g.cx, g.cy];
  const Rt: [number, number] = [g.cx + g.a, g.cy];
  const Lt: [number, number] = [g.cx - g.a, g.cy];
  // crossing pass directions: d1 = up-left, d2 = up-right (screen y-down)
  const d1: [number, number] = [-c, -s];
  const d2: [number, number] = [c, -s];
  const hc = g.centerHandle;
  const ht = g.tipHandle;
  type Seg = [[number, number], [number, number], [number, number], [number, number]];
  const segs: Seg[] = [
    [Rt, [Rt[0], Rt[1] + ht], [C[0] - hc * d1[0], C[1] - hc * d1[1]], C],
    [C, [C[0] + hc * d1[0], C[1] + hc * d1[1]], [Lt[0], Lt[1] - ht], Lt],
    [Lt, [Lt[0], Lt[1] + ht], [C[0] - hc * d2[0], C[1] - hc * d2[1]], C],
    [C, [C[0] + hc * d2[0], C[1] + hc * d2[1]], [Rt[0], Rt[1] - ht], Rt],
  ];
  const points: [number, number][] = [];
  for (const [p0, p1, p2, p3] of segs) {
    for (let i = 0; i < samplesPerSegment; i += 1) {
      const t = i / samplesPerSegment;
      const omt = 1 - t;
      const w0 = omt * omt * omt;
      const w1 = 3 * omt * omt * t;
      const w2 = 3 * omt * t * t;
      const w3 = t * t * t;
      points.push([
        w0 * p0[0] + w1 * p1[0] + w2 * p2[0] + w3 * p3[0],
        w0 * p0[1] + w1 * p1[1] + w2 * p2[1] + w3 * p3[1],
      ]);
    }
  }
  const n = points.length;
  const cumulative: number[] = [0];
  for (let i = 1; i <= n; i += 1) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i % n];
    cumulative.push(cumulative[i - 1] + Math.hypot(x1 - x0, y1 - y0));
  }
  const fmt = (v: number) => v.toFixed(3);
  const d = segs
    .map(
      ([p0, p1, p2, p3], i) =>
        `${i === 0 ? `M${fmt(p0[0])},${fmt(p0[1])}` : ""}C${fmt(p1[0])},${fmt(p1[1])} ${fmt(p2[0])},${fmt(p2[1])} ${fmt(p3[0])},${fmt(p3[1])}`,
    )
    .join("") + "Z";
  return { d, points, cumulative, totalLength: cumulative[n] };
};

/** arc-length fraction u → point on the flattened path (linear interp) */
export const pointAtFraction = (
  geometry: PathGeometry,
  u: number,
): [number, number] => {
  const n = geometry.points.length;
  const target = (((u % 1) + 1) % 1) * geometry.totalLength;
  let lo = 0;
  let hi = n;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (geometry.cumulative[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  const i = Math.max(1, lo);
  const segStart = geometry.cumulative[i - 1];
  const segLen = geometry.cumulative[i] - segStart;
  const sFrac = segLen > 0 ? (target - segStart) / segLen : 0;
  const [x0, y0] = geometry.points[i - 1];
  const [x1, y1] = geometry.points[i % n];
  return [x0 + (x1 - x0) * sFrac, y0 + (y1 - y0) * sFrac];
};

export interface WhipCrawlCycleState {
  /** head path-progress in [0,1) — arc-length fraction, u=0 at the right tip */
  u: number;
  /** dot position (design px) — the dot rides the head */
  dotCx: number;
  dotCy: number;
}

export const createWhipCrawlCycle = (params: WhipCrawlCycleParams) => {
  const geometry = buildInfinityPath(params.generator);
  return (frame: number): WhipCrawlCycleState => {
    const local =
      ((frame % params.periodFrames) + params.periodFrames) %
      params.periodFrames;
    const u = whipCrawlMasterU(local, params);
    const [dotCx, dotCy] = pointAtFraction(geometry, u);
    return { u, dotCx, dotCy };
  };
};
