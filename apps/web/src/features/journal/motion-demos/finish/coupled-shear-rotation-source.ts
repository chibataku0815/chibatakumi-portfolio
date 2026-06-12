// Source-frame renderer for the coupled-shear-rotation finish demo — the
// canvas2d analogue of the lab's Remotion base render, in the API-finish
// standard light palette. The two half-disc pieces are built as SVG path data
// (the same piecePath the SVG demo uses) and filled via Path2D — both pieces
// in the single elem ink. Single fill is what lets the loop's quarter-turned
// rest read as the same full disc (the seal is union-level).
//
// Shared by the live demo (CoupledShearRotationFinishDemo) so the GPU
// pipeline consumes exactly the pixels this painter produces.
import { API_FINISH_LIGHT_PALETTE } from "@bridges/webgpu-finish";
import {
  coupledShearSchedule,
  piecePath,
  COUPLED_SHEAR_VIEWBOX,
} from "../verbs/coupled-shear-rotation.params";

/** Render resolution (device px). Finish params are frame-relative, so this only sets
 * crispness; grain (960-grid) and CA (corner shift) scale with the frame. */
export const FINISH_RENDER_SIZE = 640;

/** Grain stream identity. This cell has a queued drawer SNS clip, but the
 * grain stream there is the deliverable's own; the stream id here is the
 * article's — deliberately NOT claiming bit-parity with any deliverable. The
 * finish math itself is the same parity-proven WGSL pipeline as
 * lattice-breath. */
export const FINISH_STREAM_NAMESPACE = "journal-coupled-shear-rotation";

export const drawCoupledShearSourceFrame = (
  ctx: CanvasRenderingContext2D,
  size: number,
  frame: number,
): void => {
  const scale = size / COUPLED_SHEAR_VIEWBOX;
  const { pieces } = coupledShearSchedule(frame);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = API_FINISH_LIGHT_PALETTE.field;
  ctx.fillRect(0, 0, size, size);

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = API_FINISH_LIGHT_PALETTE.elem;
  pieces.forEach((piece) => {
    ctx.fill(new Path2D(piecePath(piece)));
  });

  ctx.setTransform(1, 0, 0, 1, 0, 0);
};
