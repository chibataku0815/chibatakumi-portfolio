// Source-frame renderer for the master-rotation-echo finish demo — the
// canvas2d analogue of the lab's Remotion base render, in the API-finish
// standard light palette. Every dot is one family of elem ink on the field;
// the echo stack is realized with per-copy globalAlpha (the canvas2d analogue
// of the SVG fill-opacity the cell uses), drawn deepest-first so the lead
// lands on top.
//
// Shared by the live demo (MasterRotationEchoFinishDemo) so the GPU pipeline
// consumes exactly the pixels this painter produces.
import { API_FINISH_LIGHT_PALETTE } from "@bridges/webgpu-finish";
import {
  masterRotationEchoSchedule,
  MASTER_ROTATION_ECHO_VIEWBOX,
} from "../verbs/master-rotation-echo.params";

/** Render resolution (device px). Finish params are frame-relative, so this only sets
 * crispness; grain (960-grid) and CA (corner shift) scale with the frame. */
export const FINISH_RENDER_SIZE = 640;

/** Grain stream identity. This cell has no posted per-cell SNS clip (the drawer
 * "afterimage" post is still queued), so the stream id is the article's own —
 * deliberately NOT claiming bit-parity with any deliverable. The finish math itself
 * is the same parity-proven WGSL pipeline as lattice-breath. */
export const FINISH_STREAM_NAMESPACE = "journal-master-rotation-echo";

const RAD_PER_DEG = Math.PI / 180;

export const drawMasterRotationEchoSourceFrame = (
  ctx: CanvasRenderingContext2D,
  size: number,
  frame: number,
): void => {
  const scale = size / MASTER_ROTATION_ECHO_VIEWBOX;
  const s = masterRotationEchoSchedule(frame);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = API_FINISH_LIGHT_PALETTE.field;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = API_FINISH_LIGHT_PALETTE.elem;
  for (const copies of s.arms) {
    for (let i = copies.length - 1; i >= 0; i -= 1) {
      const copy = copies[i];
      const a = copy.angleDeg * RAD_PER_DEG;
      ctx.globalAlpha = copy.opacity;
      ctx.beginPath();
      ctx.arc(
        (s.centerX + s.orbitRadius * Math.cos(a)) * scale,
        (s.centerY + s.orbitRadius * Math.sin(a)) * scale,
        s.dotRadius * scale,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
};
