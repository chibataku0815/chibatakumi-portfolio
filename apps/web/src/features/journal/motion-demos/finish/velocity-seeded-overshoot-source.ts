// Source-frame renderer for the velocity-seeded-overshoot finish demo — the
// canvas2d analogue of the lab's Remotion base render, in the API-finish
// standard light palette. A thick round-capped stem stroke plus the lagging
// dot, both in the single elem ink. The eye-marks the schedule returns are a
// glyph decoration and are not drawn, so the motion reads in one ink.
//
// Shared by the live demo (VelocitySeededOvershootFinishDemo) so the GPU
// pipeline consumes exactly the pixels this painter produces.
import { API_FINISH_LIGHT_PALETTE } from "@bridges/webgpu-finish";
import {
  vsoGlyphSchedule,
  VSO_VIEWBOX,
} from "../verbs/velocity-seeded-overshoot.params";

/** Render resolution (device px). Finish params are frame-relative, so this only
 * sets crispness; grain (960-grid) and CA (corner shift) scale with the frame. */
export const FINISH_RENDER_SIZE = 640;

/** Grain stream identity. This cell has a queued drawer SNS clip, but the grain
 * stream there is the deliverable's own; the stream id here is the article's —
 * deliberately NOT claiming bit-parity with any deliverable. The finish math
 * itself is the same parity-proven WGSL pipeline as lattice-breath. */
export const FINISH_STREAM_NAMESPACE = "journal-velocity-seeded-overshoot";

export const drawVsoSourceFrame = (
  ctx: CanvasRenderingContext2D,
  size: number,
  frame: number,
): void => {
  const scale = size / VSO_VIEWBOX;
  const { stemTop, stemBot, stemWidth, dot } = vsoGlyphSchedule(frame);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = API_FINISH_LIGHT_PALETTE.field;
  ctx.fillRect(0, 0, size, size);

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.strokeStyle = API_FINISH_LIGHT_PALETTE.elem;
  ctx.fillStyle = API_FINISH_LIGHT_PALETTE.elem;
  ctx.lineWidth = stemWidth;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(stemBot.x, stemBot.y);
  ctx.lineTo(stemTop.x, stemTop.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(dot.cx, dot.cy, dot.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.setTransform(1, 0, 0, 1, 0, 0);
};
