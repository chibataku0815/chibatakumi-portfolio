// Source-frame renderer for the difference finish demo — the canvas2d analogue
// of the lab's Remotion base render, in the API-finish standard light palette.
// The four quadrant circles are filled as ONE compound path with the evenodd
// rule (the symmetric-difference look) and the two axial circles are stroked as
// their union outline (a peanut), both in the single elem ink.
//
// Shared by the live demo (DifferenceFinishDemo) so the GPU pipeline consumes
// exactly the pixels this painter produces.
import { API_FINISH_LIGHT_PALETTE } from "@bridges/webgpu-finish";
import {
  differenceFigureAt,
  DIFFERENCE_VIEWBOX,
} from "../verbs/quadrant-sign-excursion.params";

/** Render resolution (device px). Finish params are frame-relative, so this only
 * sets crispness; grain (960-grid) and CA (corner shift) scale with the frame. */
export const FINISH_RENDER_SIZE = 640;

/** Grain stream identity — the article's own (no posted per-cell clip parity
 * claim). The finish math is the same parity-proven WGSL pipeline as lattice-breath. */
export const FINISH_STREAM_NAMESPACE = "journal-difference";

export const drawDifferenceSourceFrame = (
  ctx: CanvasRenderingContext2D,
  size: number,
  frame: number,
): void => {
  const scale = size / DIFFERENCE_VIEWBOX;
  const { fillPath, peanutPath, bandWidth } = differenceFigureAt(frame);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = API_FINISH_LIGHT_PALETTE.field;
  ctx.fillRect(0, 0, size, size);

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = API_FINISH_LIGHT_PALETTE.elem;
  ctx.fill(new Path2D(fillPath), "evenodd");

  ctx.strokeStyle = API_FINISH_LIGHT_PALETTE.elem;
  ctx.lineWidth = bandWidth;
  ctx.stroke(new Path2D(peanutPath));

  ctx.setTransform(1, 0, 0, 1, 0, 0);
};
