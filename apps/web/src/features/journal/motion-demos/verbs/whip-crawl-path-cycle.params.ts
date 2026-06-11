// Demo parameters for the whip-crawl-path-cycle motion study.
//
// These are the ORIGIN cell's measurement-bound constants (drawer cell #4
// "cycle"/循環 — a thick trim-window stroke and a head dot lapping a
// pen-tool infinity path, 90-frame / 3s loop @ 30fps), copied from
// motion-grammar-lab studies/puttimw-motion-drawers/src/verbs/cycle.ts
// (cycleParams). Deliberate adaptations for this embedded demo (the allowed
// three only):
//   1. Recentring: the upstream cell reserves a label band at the bottom of
//      its 324 design square, so the path generator sits at cy = 128.9.
//      Only that ONE value shifts (+33.1 → 162) to center the figure
//      vertically; cx = 162.3 is already the measured horizontal center
//      (0.3px off the geometric center — kept as measured). Half-width 87.9,
//      tip handle 4.6, center handle 105.3, crossing angle 54.8°, every
//      timing value and the bezier stay exactly as measured.
//   2. No raster-calibration artifact existed on this cell's schedule
//      (strokeWidth 15.6 inherits an upstream AA calibration, but it is a
//      realization width, not a schedule constant) — nothing to zero out.
//   3. Colours are NOT carried. Upstream pairs the schedule with study-local
//      realization meta (strokeRgb/dotRgb/backgroundRgb) the schedule itself
//      never reads. The SVG demo paints with the site's substrate ink
//      (currentColor), the finish demo with the API-finish light palette;
//      both render stroke and dot in the single ink (the trim-window gap
//      keeps the head readable — same single-ink reading as the cell's
//      queued SNS clip).
// The master phase (whip start frame 3, whip 51 frames covering 0.901 of
// the lap from u = 0.357, crawl rate forced by loop closure: 0.099/39 per
// frame toward u = 1.357 ≡ 0.357), the 4-anchor generator and the
// trim-window fractions — the motion knowledge itself — are kept faithful.
// Article key-table constants: u at whip end = 0.357 + 0.901 = 1.258; u at
// loop close = 0.357 + 1 = 1.357 (crawl spans frames 54 → 93 ≡ 3).

import {
  createWhipCrawlCycle,
  pointAtFraction,
  whipCrawlMasterU,
} from "./whip-crawl-path-cycle";
import type {
  PathGeometry,
  WhipCrawlCycleParams,
  WhipCrawlCycleState,
} from "./whip-crawl-path-cycle";

export const WHIP_CRAWL_VIEWBOX = 324;
export const WHIP_CRAWL_PERIOD_FRAMES = 90;
export const WHIP_CRAWL_FPS = 30; // design contract: 90f = 3s loop

/**
 * The static fallback frame for prefers-reduced-motion: mid-crawl, the
 * mechanism's distinguishing stretch — the dot creeping through the slow
 * stretch with the trim-window gap straddling it.
 */
export const WHIP_CRAWL_POSTER_FRAME = 70;

export const whipCrawlParams: WhipCrawlCycleParams = {
  periodFrames: 90,
  whipStartFrame: 3,
  whipDurFrames: 51, // crawl = frame 54 → 93 ≡ 3 (39f linear, rate forced: 0.099/39)
  uAtWhipStart: 0.357,
  whipSpan: 0.901,
  whipBezier: [0.85, 0.191, 0.349, 0.833],
  generator: {
    cx: 162.3,
    cy: 162, // upstream 128.9 → recentred (adaptation 1 above)
    a: 87.9,
    tipHandle: 4.6,
    centerHandle: 105.3,
    crossingAngleDeg: 54.8,
  },
};

// Realization constants (study-local in upstream cycleParams — the dash
// window the cell maps u onto, plus stroke/dot sizes). Carried verbatim.
export const DRAWN_FRACTION = 0.896; // un-stroked window 0.0735 − 2 round caps (0.0155 each)
export const PAINT_HEAD_LAG_FRACTION = 0.054; // ink edge behind dot 0.039 + cap 0.0155
export const STROKE_WIDTH = 15.6;
export const DOT_RADIUS = 13.5;

/** Cell-faithful schedule (4-anchor measured carrier) — kept as the
 * provenance anchor for the vendor-parity sweep; the demos do NOT render
 * this carrier (see below). */
export const whipCrawlSchedule = createWhipCrawlCycle(whipCrawlParams);

// ----------------------------------------------------------------------------
// Demo carrier — the user-approved idealized infinity (2026-06-09).
//
// The measured 4-anchor generator is a faithful centerline fit, so its tips
// run thin and its lobes bulge ("歪"); a 4-anchor build cannot make truly
// round lobes. For every public-facing artifact of this cell (the queued SNS
// post, the drawers-grid one-sheet) the user selected the classic round-lobe
// infinity instead: a Bernoulli lemniscate, rational parametrization, with
// the cell's footprint (tips at cx ± A) and the y-flip the post uses. The
// builder below is copied verbatim from the post artifact
// (motion-grammar-lab studies/puttimw-motion-drawers/src/demos/
// CycleReproFinishDemo.tsx, buildBernoulliGeometry) — only cy is recentred
// (post crop 128.9 → 162), the same single-value adaptation as above.
//
// What stays faithful is the TEMPORAL schedule: u(frame) is path-independent
// (whipCrawlMasterU never reads the generator), so the whip-crawl pacing on
// this idealized track is bit-identical to the cell's. The article discloses
// the shape idealization explicitly.
const BERNOULLI = { A: 87.9, cx: 162.3, cy: 162 } as const;

const buildBernoulliGeometry = (
  A: number,
  cx: number,
  cy: number,
  n = 1024,
): PathGeometry => {
  const points: [number, number][] = [];
  for (let i = 0; i < n; i += 1) {
    const t = (2 * Math.PI * i) / n;
    const den = 1 + Math.sin(t) * Math.sin(t);
    const x = cx + (A * Math.cos(t)) / den;
    const y = cy - (A * Math.cos(t) * Math.sin(t)) / den; // −= down-first（原典の周回向き）
    points.push([x, y]);
  }
  const cumulative: number[] = [0];
  for (let i = 1; i <= n; i += 1) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i % n];
    cumulative.push(cumulative[i - 1] + Math.hypot(x1 - x0, y1 - y0));
  }
  const d =
    "M" +
    points.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join("L") +
    "Z";
  return { d, points, cumulative, totalLength: cumulative[n] };
};

/** The carrier the demos actually render — approved round-lobe infinity. */
export const whipCrawlDemoGeometry = buildBernoulliGeometry(
  BERNOULLI.A,
  BERNOULLI.cx,
  BERNOULLI.cy,
);

/** Demo schedule: the cell's exact u(frame) riding the idealized carrier —
 * mirrors the post artifact's cyclePostSchedule. */
export const whipCrawlDemoSchedule = (frame: number): WhipCrawlCycleState => {
  const period = whipCrawlParams.periodFrames;
  const local = ((frame % period) + period) % period;
  const u = whipCrawlMasterU(local, whipCrawlParams);
  const [dotCx, dotCy] = pointAtFraction(whipCrawlDemoGeometry, u);
  return { u, dotCx, dotCy };
};
