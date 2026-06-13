// Source-frame renderer for the gather-return finish demo — the canvas2d
// analogue of the lab's Remotion base render, in the API-finish standard
// light palette. The center disc and the eight ring circles are plain arcs,
// all filled in the single elem ink. Single fill is what makes the merge read
// as a merge: the topology exists only as the union of same-color circles.
//
// Shared by the live demo (GatherReturnFinishDemo) so the GPU pipeline
// consumes exactly the pixels this painter produces.
import { API_FINISH_LIGHT_PALETTE } from "@bridges/webgpu-finish";
import {
  gatherReturnSchedule,
  GATHER_RETURN_VIEWBOX,
} from "../verbs/gather-return.params";

/** Render resolution (device px). Finish params are frame-relative, so this only sets
 * crispness; grain (960-grid) and CA (corner shift) scale with the frame. */
export const FINISH_RENDER_SIZE = 640;

/** Grain stream identity. This cell has a queued drawer SNS clip, but the
 * grain stream there is the deliverable's own; the stream id here is the
 * article's — deliberately NOT claiming bit-parity with any deliverable. The
 * finish math itself is the same parity-proven WGSL pipeline as
 * lattice-breath. */
export const FINISH_STREAM_NAMESPACE = "journal-gather-return";

export const drawGatherReturnSourceFrame = (
  ctx: CanvasRenderingContext2D,
  size: number,
  frame: number,
): void => {
  const scale = size / GATHER_RETURN_VIEWBOX;
  const { core, dots } = gatherReturnSchedule(frame);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = API_FINISH_LIGHT_PALETTE.field;
  ctx.fillRect(0, 0, size, size);

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = API_FINISH_LIGHT_PALETTE.elem;
  [...(core ? [core] : []), ...dots].forEach((c) => {
    ctx.beginPath();
    ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.setTransform(1, 0, 0, 1, 0, 0);
};
