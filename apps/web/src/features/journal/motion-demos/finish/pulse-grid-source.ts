// Source-frame renderer for the pulse-grid finish demo — the canvas2d analogue of the
// lab's Remotion base render, in the API-finish standard light palette. All nine dots
// are one family, so they paint as elem ink on the field (no two-tone mapping).
//
// Shared by the live demo (PulseGridFinishDemo) so the GPU pipeline consumes exactly
// the pixels this painter produces.
import { API_FINISH_LIGHT_PALETTE } from "@bridges/webgpu-finish";
import {
  pulseGridSchedule,
  PULSE_GRID_VIEWBOX,
} from "../verbs/pulse-grid.params";

/** Render resolution (device px). Finish params are frame-relative, so this only sets
 * crispness; grain (960-grid) and CA (corner shift) scale with the frame. */
export const FINISH_RENDER_SIZE = 640;

/** Grain stream identity. This cell has no posted per-cell SNS clip (the drawer
 * "random" shipped only inside the 18-cell one-sheet), so the stream id is the
 * article's own — deliberately NOT claiming bit-parity with any deliverable. The
 * finish math itself is the same parity-proven WGSL pipeline as lattice-breath. */
export const FINISH_STREAM_NAMESPACE = "journal-pulse-grid";

export const drawPulseGridSourceFrame = (
  ctx: CanvasRenderingContext2D,
  size: number,
  frame: number,
): void => {
  const scale = size / PULSE_GRID_VIEWBOX;
  const dots = pulseGridSchedule(frame);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = API_FINISH_LIGHT_PALETTE.field;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = API_FINISH_LIGHT_PALETTE.elem;
  for (const dot of dots) {
    ctx.beginPath();
    ctx.arc(dot.cx * scale, dot.cy * scale, dot.r * scale, 0, Math.PI * 2);
    ctx.fill();
  }
};
