// Source-frame renderer for the ring-orbit-3d (auto-orient) finish demo — the
// canvas2d analogue of the lab's Remotion base render, in the API-finish standard
// light palette. Eight depth-sorted dots are filled as plain arcs, two tones
// alternating: dark cohort = elem ink, light cohort = edge tone (the lab's
// user-confirmed remap of the reference red/pink to #1C2024 / #60646C).
//
// Shared by the live demo (AutoOrientFinishDemo) so the GPU pipeline consumes
// exactly the pixels this painter produces.
import { API_FINISH_LIGHT_PALETTE } from "@bridges/webgpu-finish";
import {
  ringOrbitDotsAt,
  RING_ORBIT_VIEWBOX,
} from "../verbs/ring-orbit-3d.params";

/** Render resolution (device px). Finish params are frame-relative, so this only
 * sets crispness; grain (960-grid) and CA (corner shift) scale with the frame. */
export const FINISH_RENDER_SIZE = 640;

/** Grain stream identity — the article's own (no posted per-cell clip parity
 * claim). The finish math is the same parity-proven WGSL pipeline as lattice-breath. */
export const FINISH_STREAM_NAMESPACE = "journal-ring-orbit-3d";

export const drawRingOrbitSourceFrame = (
  ctx: CanvasRenderingContext2D,
  size: number,
  frame: number,
): void => {
  const scale = size / RING_ORBIT_VIEWBOX;
  const dots = ringOrbitDotsAt(frame);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = API_FINISH_LIGHT_PALETTE.field;
  ctx.fillRect(0, 0, size, size);

  for (const d of dots) {
    ctx.fillStyle = d.dark
      ? API_FINISH_LIGHT_PALETTE.elem
      : API_FINISH_LIGHT_PALETTE.edge;
    ctx.beginPath();
    ctx.arc(d.cx * scale, d.cy * scale, d.r * scale, 0, Math.PI * 2);
    ctx.fill();
  }
};
