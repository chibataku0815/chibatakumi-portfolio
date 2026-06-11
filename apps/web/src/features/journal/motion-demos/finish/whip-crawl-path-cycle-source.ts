// Source-frame renderer for the whip-crawl-path-cycle finish demo — the
// canvas2d analogue of the lab's Remotion base render, in the API-finish
// standard light palette. The cell's realization maps the schedule's head
// progress u onto SVG dash space (pathLength=1); canvas has no pathLength,
// so the same dash fractions are multiplied by the flattened arc length the
// vendored geometry carries (sub-pixel equivalent: 256 samples per bezier
// segment). canvas lineDashOffset shares SVG stroke-dashoffset's sign
// convention, so the offset formula is the cell's, scaled. Stroke and dot
// are the single elem ink (single-ink reading as in the cell's queued SNS
// clip — the gap shows the head).
//
// Shared by the live demo (WhipCrawlPathCycleFinishDemo) so the GPU pipeline
// consumes exactly the pixels this painter produces.
import { API_FINISH_LIGHT_PALETTE } from "@bridges/webgpu-finish";
import {
  whipCrawlDemoSchedule,
  whipCrawlDemoGeometry,
  WHIP_CRAWL_VIEWBOX,
  DRAWN_FRACTION,
  PAINT_HEAD_LAG_FRACTION,
  STROKE_WIDTH,
  DOT_RADIUS,
} from "../verbs/whip-crawl-path-cycle.params";

/** Render resolution (device px). Finish params are frame-relative, so this only sets
 * crispness; grain (960-grid) and CA (corner shift) scale with the frame. */
export const FINISH_RENDER_SIZE = 640;

/** Grain stream identity. This cell's drawer SNS clip is queued but the grain
 * stream there is the deliverable's own; the stream id here is the article's —
 * deliberately NOT claiming bit-parity with any deliverable. The finish math itself
 * is the same parity-proven WGSL pipeline as lattice-breath. */
export const FINISH_STREAM_NAMESPACE = "journal-whip-crawl-path-cycle";

let cachedPath: Path2D | null = null;
const carrierPath = (): Path2D => {
  cachedPath ??= new Path2D(whipCrawlDemoGeometry.d);
  return cachedPath;
};

export const drawWhipCrawlSourceFrame = (
  ctx: CanvasRenderingContext2D,
  size: number,
  frame: number,
): void => {
  const scale = size / WHIP_CRAWL_VIEWBOX;
  const { u, dotCx, dotCy } = whipCrawlDemoSchedule(frame);
  const len = whipCrawlDemoGeometry.totalLength;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = API_FINISH_LIGHT_PALETTE.field;
  ctx.fillRect(0, 0, size, size);

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.strokeStyle = API_FINISH_LIGHT_PALETTE.elem;
  ctx.lineWidth = STROKE_WIDTH;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash([DRAWN_FRACTION * len, (1 - DRAWN_FRACTION) * len]);
  ctx.lineDashOffset = (DRAWN_FRACTION + PAINT_HEAD_LAG_FRACTION - u) * len;
  ctx.stroke(carrierPath());
  ctx.setLineDash([]);

  ctx.fillStyle = API_FINISH_LIGHT_PALETTE.elem;
  ctx.beginPath();
  ctx.arc(dotCx, dotCy, DOT_RADIUS, 0, 2 * Math.PI);
  ctx.fill();

  ctx.setTransform(1, 0, 0, 1, 0, 0);
};
