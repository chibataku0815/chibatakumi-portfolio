// Source-frame renderer for the arrangement-turntable finish demo — the canvas2d
// analogue of the lab's Remotion base render, in the API-finish standard light
// palette. Nine dots transiting between two arrangements, all in the single elem
// ink.
//
// Shared by the live demo (ArrangementTurntableFinishDemo) so the GPU pipeline
// consumes exactly the pixels this painter produces.
import { API_FINISH_LIGHT_PALETTE } from "@bridges/webgpu-finish";
import {
  arrangementDotsAt,
  ARRANGEMENT_VIEWBOX,
} from "../verbs/arrangement-turntable.params";

/** Render resolution (device px). Finish params are frame-relative, so this only
 * sets crispness; grain (960-grid) and CA (corner shift) scale with the frame. */
export const FINISH_RENDER_SIZE = 640;

/** Grain stream identity — the article's own (no posted per-cell clip parity
 * claim). The finish math is the same parity-proven WGSL pipeline as lattice-breath. */
export const FINISH_STREAM_NAMESPACE = "journal-arrangement-turntable";

export const drawArrangementSourceFrame = (
  ctx: CanvasRenderingContext2D,
  size: number,
  frame: number,
): void => {
  const scale = size / ARRANGEMENT_VIEWBOX;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = API_FINISH_LIGHT_PALETTE.field;
  ctx.fillRect(0, 0, size, size);

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = API_FINISH_LIGHT_PALETTE.elem;
  arrangementDotsAt(frame).forEach((d) => {
    ctx.beginPath();
    ctx.arc(d.cx, d.cy, d.r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.setTransform(1, 0, 0, 1, 0, 0);
};
