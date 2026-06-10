// Source-frame renderer for the lattice-breath finish demo — the canvas2d analogue of the
// lab's Remotion base render, in the API-finish standard light palette (count-growth
// two-tone precedent: core families = elem ink, edge family = #60646C).
//
// Shared by the live demo (LatticeBreathFinishDemo) and the parity harness so the GPU
// pipeline and the CPU oracle consume IDENTICAL source pixels.
import { API_FINISH_LIGHT_PALETTE } from "@bridges/webgpu-finish";
import {
  latticeBreathSchedule,
  LATTICE_BREATH_VIEWBOX,
} from "../verbs/lattice-breath.params";

/** Render resolution (device px). Finish params are frame-relative, so this only sets
 * crispness; grain (960-grid) and CA (corner shift) scale with the frame. */
export const FINISH_RENDER_SIZE = 640;

/** Grain stream identity — SAME namespace as the SNS deliverable (count-growth-post),
 * so the live field sequence is bit-identical to the posted clip's. */
export const FINISH_STREAM_NAMESPACE = "api-finish-count-growth-post";

export const drawLatticeBreathSourceFrame = (
  ctx: CanvasRenderingContext2D,
  size: number,
  frame: number,
): void => {
  const scale = size / LATTICE_BREATH_VIEWBOX;
  const state = latticeBreathSchedule(frame);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = API_FINISH_LIGHT_PALETTE.field;
  ctx.fillRect(0, 0, size, size);
  for (const dot of state.dots) {
    ctx.fillStyle =
      dot.role === "edge" ? API_FINISH_LIGHT_PALETTE.edge : API_FINISH_LIGHT_PALETTE.elem;
    ctx.beginPath();
    ctx.arc(dot.cx * scale, dot.cy * scale, dot.r * scale, 0, Math.PI * 2);
    ctx.fill();
  }
};
