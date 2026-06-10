// Source-frame renderer for the complement-tangent-pair finish demo — the
// canvas2d analogue of the lab's Remotion base render, in the API-finish
// standard light palette. Both circles are one family, so they paint as elem
// ink on the field (no two-tone mapping).
//
// Shared by the live demo (ComplementTangentPairFinishDemo) so the GPU
// pipeline consumes exactly the pixels this painter produces.
import { API_FINISH_LIGHT_PALETTE } from "@bridges/webgpu-finish";
import {
  complementTangentPairSchedule,
  COMPLEMENT_TANGENT_VIEWBOX,
} from "../verbs/complement-tangent-pair.params";

/** Render resolution (device px). Finish params are frame-relative, so this only sets
 * crispness; grain (960-grid) and CA (corner shift) scale with the frame. */
export const FINISH_RENDER_SIZE = 640;

/** Grain stream identity. This cell has no posted per-cell SNS clip (the drawer
 * "inverse-proportion" shipped only inside the 18-cell one-sheet), so the stream
 * id is the article's own — deliberately NOT claiming bit-parity with any
 * deliverable. The finish math itself is the same parity-proven WGSL pipeline
 * as lattice-breath. */
export const FINISH_STREAM_NAMESPACE = "journal-complement-tangent-pair";

export const drawComplementTangentPairSourceFrame = (
  ctx: CanvasRenderingContext2D,
  size: number,
  frame: number,
): void => {
  const scale = size / COMPLEMENT_TANGENT_VIEWBOX;
  const { tl, br } = complementTangentPairSchedule(frame);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = API_FINISH_LIGHT_PALETTE.field;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = API_FINISH_LIGHT_PALETTE.elem;
  for (const circle of [tl, br]) {
    ctx.beginPath();
    ctx.arc(
      circle.cx * scale,
      circle.cy * scale,
      circle.r * scale,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
};
