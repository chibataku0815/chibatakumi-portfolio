// Source-frame renderer for the shared-hold-pulse finish demo — the canvas2d
// analogue of the lab's Remotion base render, in the API-finish standard
// light palette. All five elements are one family of elem ink on the field
// (the origin cell is single-fill); the center square's spin is realized
// with a translate/rotate transform about its own center — the canvas2d
// analogue of the SVG rotate(angle cx cy) the cell uses.
//
// Shared by the live demo (SharedHoldPulseFinishDemo) so the GPU pipeline
// consumes exactly the pixels this painter produces.
import { API_FINISH_LIGHT_PALETTE } from "@bridges/webgpu-finish";
import {
  sharedHoldPulseSchedule,
  SHARED_HOLD_PULSE_VIEWBOX,
} from "../verbs/shared-hold-pulse.params";

/** Render resolution (device px). Finish params are frame-relative, so this only sets
 * crispness; grain (960-grid) and CA (corner shift) scale with the frame. */
export const FINISH_RENDER_SIZE = 640;

/** Grain stream identity. This cell has no posted per-cell SNS clip (the drawer
 * "symmetry" post is still queued), so the stream id is the article's own —
 * deliberately NOT claiming bit-parity with any deliverable. The finish math itself
 * is the same parity-proven WGSL pipeline as lattice-breath. */
export const FINISH_STREAM_NAMESPACE = "journal-shared-hold-pulse";

const RAD_PER_DEG = Math.PI / 180;

export const drawSharedHoldPulseSourceFrame = (
  ctx: CanvasRenderingContext2D,
  size: number,
  frame: number,
): void => {
  const scale = size / SHARED_HOLD_PULSE_VIEWBOX;
  const elements = sharedHoldPulseSchedule(frame);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = API_FINISH_LIGHT_PALETTE.field;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = API_FINISH_LIGHT_PALETTE.elem;
  for (const e of elements) {
    ctx.setTransform(scale, 0, 0, scale, e.cx * scale, e.cy * scale);
    if (e.rotationDeg !== 0) ctx.rotate(e.rotationDeg * RAD_PER_DEG);
    ctx.beginPath();
    ctx.roundRect(
      -e.width / 2,
      -e.height / 2,
      e.width,
      e.height,
      e.cornerRadius,
    );
    ctx.fill();
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};
