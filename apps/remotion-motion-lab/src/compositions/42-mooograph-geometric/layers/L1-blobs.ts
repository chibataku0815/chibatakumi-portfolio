/**
 * MOOOGRAPH Geometric — Layer 1: Halftone Blobs
 *
 * Draws 4 morphing halftone blobs behind the geometric shapes.
 * Each blob enters and exits with scale + alpha animation.
 */
import {
  generateBlobPath,
  drawBlobWithHalftone,
} from "../lib/blob-generator";
import { progress } from "../../../lib/canvas-primitives";
import { sineOut, sineIn } from "../../../lib/canvas-easing";
import { BLOBS, BLOB_CONFIG, config } from "../config";

const BLOB_POINTS = 64;
const BLOB_OCTAVES = 5;
const ENTER_DURATION = 24; // frames for blob to scale in
const EXIT_DURATION = 20; // frames for blob to scale out

export function drawBlobs(
  ctx: CanvasRenderingContext2D,
  frame: number,
): void {
  for (const blob of BLOBS) {
    // Calculate entrance alpha + scale
    const enterP = progress(
      frame,
      blob.enterFrame,
      ENTER_DURATION,
      sineOut,
    );
    // Calculate exit (reverse: 1→0)
    const exitStart = blob.exitFrame - EXIT_DURATION;
    const exitP =
      frame >= exitStart
        ? progress(frame, exitStart, EXIT_DURATION, sineIn)
        : 0;

    // Not visible yet or already gone
    if (enterP <= 0) continue;
    const alpha = Math.max(0, enterP * (1 - exitP));
    if (alpha < 0.001) continue;

    const scale = alpha; // scale matches alpha for smooth morph

    ctx.save();
    ctx.globalAlpha = alpha;

    // Apply scale from blob center
    ctx.translate(blob.cx, blob.cy);
    ctx.scale(scale, scale);
    ctx.translate(-blob.cx, -blob.cy);

    // Generate morphing blob path
    const morphT = frame * config.blobMorphRate;
    const blobPath = generateBlobPath(
      {
        cx: blob.cx,
        cy: blob.cy,
        baseRadius: blob.baseRadius,
        points: BLOB_POINTS,
        octaves: BLOB_OCTAVES,
        seed: blob.seed,
      },
      morphT,
    );

    // Compute bounding box for halftone grid
    const bounds = {
      x: blob.cx - blob.baseRadius * 1.4,
      y: blob.cy - blob.baseRadius * 1.4,
      w: blob.baseRadius * 2.8,
      h: blob.baseRadius * 2.8,
    };

    drawBlobWithHalftone(
      ctx,
      blobPath,
      bounds,
      BLOB_CONFIG.dotSpacing,
      BLOB_CONFIG.dotRadius,
      BLOB_CONFIG.baseColor,
      BLOB_CONFIG.dotColor,
    );

    ctx.restore();
  }
}
