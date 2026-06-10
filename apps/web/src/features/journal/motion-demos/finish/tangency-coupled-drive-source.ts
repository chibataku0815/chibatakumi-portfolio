// Source-frame renderer for the tangency-coupled-drive finish demo — the canvas2d
// analogue of the lab's Remotion base render, in the API-finish standard light
// palette. All three squares are one family, so they paint as elem ink on the field.
//
// Shared by the live demo (TangencyCoupledDriveFinishDemo) so the GPU pipeline
// consumes exactly the pixels this painter produces.
import { API_FINISH_LIGHT_PALETTE } from "@bridges/webgpu-finish";
import {
  tangencyCoupledDriveSchedule,
  TANGENCY_DRIVE_VIEWBOX,
} from "../verbs/tangency-coupled-drive.params";

/** Render resolution (device px). Finish params are frame-relative, so this only sets
 * crispness; grain (960-grid) and CA (corner shift) scale with the frame. */
export const FINISH_RENDER_SIZE = 640;

/** Grain stream identity. This cell has no posted per-cell SNS clip (the drawer
 * "linkage" post is still queued), so the stream id is the article's own —
 * deliberately NOT claiming bit-parity with any deliverable. The finish math itself
 * is the same parity-proven WGSL pipeline as lattice-breath. */
export const FINISH_STREAM_NAMESPACE = "journal-tangency-coupled-drive";

export const drawTangencyCoupledDriveSourceFrame = (
  ctx: CanvasRenderingContext2D,
  size: number,
  frame: number,
): void => {
  const scale = size / TANGENCY_DRIVE_VIEWBOX;
  const { center, neighbors } = tangencyCoupledDriveSchedule(frame);
  const half = center.side / 2;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = API_FINISH_LIGHT_PALETTE.field;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = API_FINISH_LIGHT_PALETTE.elem;
  for (const n of neighbors) {
    ctx.fillRect(
      (n.cx - half) * scale,
      (n.cy - half) * scale,
      n.side * scale,
      n.side * scale,
    );
  }
  ctx.save();
  ctx.translate(center.cx * scale, center.cy * scale);
  ctx.rotate((center.thetaDeg * Math.PI) / 180);
  ctx.fillRect(-half * scale, -half * scale, center.side * scale, center.side * scale);
  ctx.restore();
};
