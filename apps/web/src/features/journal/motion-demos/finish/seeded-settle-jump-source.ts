// Source-frame renderer for the seeded-settle-jump finish demo — the canvas2d
// analogue of the lab's Remotion base render, in the API-finish standard light
// palette. Five capsules running one staggered jump-and-settle profile, plus
// landing satellites, all in the single elem ink.
//
// Shared by the live demo (SeededSettleJumpFinishDemo) so the GPU pipeline
// consumes exactly the pixels this painter produces.
import { API_FINISH_LIGHT_PALETTE } from "@bridges/webgpu-finish";
import {
  seededSettleDotsAt,
  SEEDED_SETTLE_VIEWBOX,
} from "../verbs/seeded-settle-jump.params";

/** Render resolution (device px). Finish params are frame-relative, so this only
 * sets crispness; grain (960-grid) and CA (corner shift) scale with the frame. */
export const FINISH_RENDER_SIZE = 640;

/** Grain stream identity — the article's own (no posted per-cell clip parity
 * claim). The finish math is the same parity-proven WGSL pipeline as lattice-breath. */
export const FINISH_STREAM_NAMESPACE = "journal-seeded-settle-jump";

const roundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

export const drawSeededSettleSourceFrame = (
  ctx: CanvasRenderingContext2D,
  size: number,
  frame: number,
): void => {
  const scale = size / SEEDED_SETTLE_VIEWBOX;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = API_FINISH_LIGHT_PALETTE.field;
  ctx.fillRect(0, 0, size, size);

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = API_FINISH_LIGHT_PALETTE.elem;
  seededSettleDotsAt(frame).forEach((d) => {
    const corner = Math.min(d.width, d.height) / 2;
    roundedRect(ctx, d.cx - d.width / 2, d.cy - d.height / 2, d.width, d.height, corner);
    ctx.fill();
    if (d.satellite) {
      ctx.beginPath();
      ctx.arc(d.satellite.cx, d.satellite.cy, d.satellite.r, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  ctx.setTransform(1, 0, 0, 1, 0, 0);
};
