// Source-frame renderer for the disc-tumble-projection (2D→3D) finish demo — the
// canvas2d analogue of the lab's Remotion base render, in the API-finish light
// palette. Mirrors the cell's three-pass realization: (1) body silhouette with
// the bore punched (even-odd), (2) clipped shading — dark side-wall ellipse first,
// then the lit top-face on top, opacities ∝ edgeOnness, (3) re-punch the bore.
// Three tones (body / lit face / dark side-wall) on the light field — the lab
// deliverable's confirmed remap of the reference blues, preserving the relative
// directions (face slightly lighter, wall slightly darker) from the #1C2024 body.
//
// Shared by the live demo (PlanarToSolidFinishDemo) so the GPU pipeline consumes
// exactly the pixels this painter produces.
import { API_FINISH_LIGHT_PALETTE } from "@bridges/webgpu-finish";
import {
  discTumbleFigureAt,
  DISC_TUMBLE_VIEWBOX,
} from "../verbs/disc-tumble-projection.params";

/** Render resolution (device px). Finish params are frame-relative, so this only
 * sets crispness; grain (960-grid) and CA (corner shift) scale with the frame. */
export const FINISH_RENDER_SIZE = 640;

/** Grain stream identity — the article's own (no posted per-cell clip parity
 * claim). The finish math is the same parity-proven WGSL pipeline as lattice-breath. */
export const FINISH_STREAM_NAMESPACE = "journal-disc-tumble-projection";

// Three-tone light map (lab finish §4): body = elem, lit face slightly lighter,
// dark side-wall slightly darker; bore re-punched with the field. The generic
// 'edge' palette token does not apply here (body/face/wall, not elem/edge).
const BODY = API_FINISH_LIGHT_PALETTE.elem; // #1C2024
const FACE = "#3A4048";
const WALL = "#0C0E10";
const FIELD = API_FINISH_LIGHT_PALETTE.field; // #F4F4F4

const TWO_PI = Math.PI * 2;

export const drawDiscTumbleSourceFrame = (
  ctx: CanvasRenderingContext2D,
  size: number,
  frame: number,
): void => {
  const scale = size / DISC_TUMBLE_VIEWBOX;
  const fig = discTumbleFigureAt(frame);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = FIELD;
  ctx.fillRect(0, 0, size, size);

  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  // 1) body silhouette, bore punched out (even-odd)
  ctx.fillStyle = BODY;
  ctx.fill(new Path2D(fig.bodyPath), "evenodd");

  // 2) shading clipped to the silhouette: dark wall first, lit face on top
  if (fig.shading) {
    ctx.save();
    ctx.clip(new Path2D(fig.outlinePath));
    const { wall, face } = fig.shading;
    ctx.fillStyle = WALL;
    ctx.globalAlpha = wall.opacity;
    ctx.beginPath();
    ctx.ellipse(wall.cx, wall.cy, wall.rx, wall.ry, 0, 0, TWO_PI);
    ctx.fill();
    ctx.fillStyle = FACE;
    ctx.globalAlpha = face.opacity;
    ctx.beginPath();
    ctx.ellipse(face.cx, face.cy, face.rx, face.ry, 0, 0, TWO_PI);
    ctx.fill();
    ctx.restore();
  }

  // 3) re-punch the bore over the shading so the tube interior stays open
  if (fig.hole) {
    ctx.fillStyle = FIELD;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.ellipse(fig.hole.cx, fig.hole.cy, fig.hole.rx, fig.hole.ry, 0, 0, TWO_PI);
    ctx.fill();
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
};
