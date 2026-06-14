// Demo parameters + realization for the disc-tumble-projection (2D→3D) motion study.
//
// These are the ORIGIN cell's measurement-bound constants (drawer cell #18
// "planar-to-solid"/2D→3D — one thick axis-bored disc on a fixed pivot, tumbling
// 0→180→0° about a tilted in-plane axis with an in-phase symmetric scale pulse;
// width/height/bore EMERGE from the orthographic projection of the rim — no
// measured tables; 90-frame / 3s loop @ 30fps), copied from motion-grammar-lab
// studies/puttimw-motion-drawers/src/verbs/planar-to-solid.ts. The schedule math
// (and its private convexHull / projectAboutTiltedAxis) lives in the vendored
// ./disc-tumble-projection; this file supplies the measured rig, the render-only
// recentring, and the SVG/canvas realization the cell uses.
//
// Deliberate adaptations for this embedded demo (the allowed three only):
//   1. Recentring: the cell reserves a lower band for its "2D→3D" kana label, so
//      the disc sits high. This label-free demo adds a render-only shift that puts
//      the disc's fixed pivot on the 324-square centre — the same recentre the
//      lab's finish deliverable applies. The orthographic projection of a
//      centrosymmetric solid keeps the centroid pinned at the pivot, so this both
//      centres the figure and leaves the schedule values untouched (the shift is
//      added LAST, per vertex).
//   2. No calibration to strip: the cell draws raw schedule coords in pure design
//      space (no +0.5 / registration nudge), so there is nothing to zero.
//   3. Colours are NOT carried. The cell binds study-side blues the schedule never
//      reads (it emits pure geometry + a faceNormal/edgeOnness shading cue). The
//      SVG demo paints the body with the page ink (currentColor, no shading); the
//      finish demo with the API-finish light palette (body / lit face / dark wall).

import {
  createDiscTumbleProjectionSchedule,
  type DiscTumbleProjectionParams,
} from "./disc-tumble-projection";

export const DISC_TUMBLE_VIEWBOX = 324;
export const DISC_TUMBLE_PERIOD_FRAMES = 90;
export const DISC_TUMBLE_FPS = 30; // design contract: 90f = 3s loop

/**
 * Static fallback frame for prefers-reduced-motion: f29 is the peak turnaround —
 * scale 1.0, full tilt, blur-free — the most legible "solid donut" read (the
 * money frame for a motion literally named 2D→3D), and a golden-hash anchor.
 */
export const DISC_TUMBLE_POSTER_FRAME = 29;

// Measured rig (no calibration baked, adaptation 2). Copied from planar-to-solid.ts
// planarToSolidParams, minus the realization-only fps + colours (adaptation 3).
export const DISC_TUMBLE_RIG: DiscTumbleProjectionParams = {
  periodFrames: DISC_TUMBLE_PERIOD_FRAMES,
  pivot: [155.3, 129.0],
  peakOuterR: 80,
  thicknessRatio: 0.3,
  holeRatio: 0.28,
  axisTiltDeg: 25,
  boreOpenCos: 0.74,
  peakFrame: 29,
  riseStartFrame: -3,
  fallEndFrame: 58,
  fallStartFrame: 30,
  fallAxisEndFrame: 56,
  restScale: 0.368,
  restThetaDeg: 3,
  scaleRiseBezier: [0.45, 0.5, 0.5, 0.9],
  scaleFallBezier: [0.45, 0.1, 0.5, 0.25],
  thetaRiseBezier: [0.33, 0.25, 0.8, 0.75],
  thetaFallBezier: [0.2, 0.33, 0.5, 0.33],
};

const baseSchedule = createDiscTumbleProjectionSchedule(DISC_TUMBLE_RIG);

// Render-only recentring (adaptation 1): pivot → 324-square centre. Derived from
// the rig (no magic number); equals the full-loop outline-envelope midpoint
// because the envelope is pivot-symmetric.
const SHIFT = {
  x: DISC_TUMBLE_VIEWBOX / 2 - DISC_TUMBLE_RIG.pivot[0],
  y: DISC_TUMBLE_VIEWBOX / 2 - DISC_TUMBLE_RIG.pivot[1],
};

// --- realization helpers (copied from the cell; render-only) ---

const toPath = (pts: Array<[number, number]>): string =>
  pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ") +
  " Z";

// a closed ellipse as two SVG arcs (for even-odd hole punching into the body `d`)
const ellipsePath = (cx: number, cy: number, rx: number, ry: number): string =>
  `M${(cx - rx).toFixed(2)},${cy.toFixed(2)} ` +
  `a${rx.toFixed(2)},${ry.toFixed(2)} 0 1,0 ${(2 * rx).toFixed(2)},0 ` +
  `a${rx.toFixed(2)},${ry.toFixed(2)} 0 1,0 ${(-2 * rx).toFixed(2)},0 Z`;

export type DiscEllipse = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  opacity: number;
};

export type DiscFigure = {
  /** body silhouette path, hole punched as an even-odd sub-path */
  bodyPath: string;
  /** outline-only path (clip region for the shading group) */
  outlinePath: string;
  /** dark side-wall + lit top-face ellipses, or null near top-down (flat read) */
  shading: { wall: DiscEllipse; face: DiscEllipse } | null;
  /** bore ellipse to re-punch over the shading, or null when occluded */
  hole: DiscEllipse | null;
};

/**
 * One frame's realized figure, recentred for the demo stage. Mirrors the cell's
 * three-pass realization: body (even-odd hole) → clipped wall+face shading →
 * re-punched bore. Shading placement is derived from the recentred outline bbox +
 * the schedule's faceNormal / edgeOnness / wallBandPx.
 */
export const discTumbleFigureAt = (frame: number): DiscFigure => {
  const s = baseSchedule(frame);
  const outline = s.outline.map(([x, y]): [number, number] => [x + SHIFT.x, y + SHIFT.y]);

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [x, y] of outline) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const w = maxX - minX;
  const h = maxY - minY;

  const [nx, ny] = s.faceNormal;
  const e = s.edgeOnness;
  const reach = Math.min(w, h) * 0.5 + s.wallBandPx;
  const shading =
    e > 0.2
      ? {
          wall: {
            cx: cx - nx * (h * 0.18 + s.wallBandPx * 0.6),
            cy: cy - ny * (h * 0.18 + s.wallBandPx * 0.6) + s.wallBandPx * 0.5,
            rx: w * 0.56,
            ry: reach * 0.62,
            opacity: 0.7 * e,
          },
          face: {
            cx: cx + nx * w * 0.16,
            cy: cy + ny * h * 0.16,
            rx: w * 0.46,
            ry: h * 0.4,
            opacity: 0.55 * e,
          },
        }
      : null;

  const hole = s.hole
    ? { cx: s.hole.cx + SHIFT.x, cy: s.hole.cy + SHIFT.y, rx: s.hole.rx, ry: s.hole.ry, opacity: 1 }
    : null;

  const bodyPath =
    hole == null
      ? toPath(outline)
      : `${toPath(outline)} ${ellipsePath(hole.cx, hole.cy, hole.rx, hole.ry)}`;

  return { bodyPath, outlinePath: toPath(outline), shading, hole };
};
