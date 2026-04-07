/**
 * MooographOverlay — Reference video + reproduction canvas overlay.
 *
 * Validates coordinate alignment and motion timing by layering the
 * 30fps 1920x1080 preprocessed reference video behind the Canvas 2D
 * reproduction at adjustable opacity.
 *
 * Usage:
 *   - Toggle `showRef` prop in Remotion Studio to show/hide reference
 *   - Scrub timeline to compare timing of enter/hold/exit events
 *
 * Reference video spec:
 *   - Source: CleanShot recording, 0.25x slowmo, ffmpeg-converted to 30fps 1920x1080
 *   - Path: public/reference/mooograph-reference-30fps.mp4
 *   - Duration: ~10.1s / 304 frames (target composition: 300 frames)
 */
import React, { useCallback } from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { CanvasScene, W, H, sr } from "../../lib/canvas-primitives";
import { useCanvasImages } from "./lib/image-preloader";
import { drawBlobs } from "./layers/L1-blobs";
import { drawShapes } from "./layers/L5-geometric-shapes";
import { PALETTE, IMAGE_SOURCES, config } from "./config";

function drawGrain(ctx: CanvasRenderingContext2D, frame: number): void {
  const gs = config.grainSize;
  const alpha = config.grainAlpha / 255;
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = alpha;
  for (let py = 0; py < H; py += gs) {
    for (let px = 0; px < W; px += gs) {
      ctx.fillStyle =
        sr(py * 0xffff + px + frame * 23) < 0.5 ? "#fff" : "#000";
      ctx.fillRect(px, py, gs, gs);
    }
  }
  ctx.restore();
}

export const MooographOverlay: React.FC<{
  showRef?: boolean;
}> = ({ showRef = true }) => {
  const images = useCanvasImages(IMAGE_SOURCES);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, frame: number) => {
      // Background
      ctx.fillStyle = PALETTE.background;
      ctx.fillRect(0, 0, W, H);

      // L1: Halftone blobs
      drawBlobs(ctx, frame);

      // L5: Geometric shapes
      drawShapes(ctx, frame, images);

      // Grain
      drawGrain(ctx, frame);
    },
    [images],
  );

  return (
    <AbsoluteFill>
      {/* Layer 0: Reference video (background) */}
      {showRef && (
        <AbsoluteFill style={{ opacity: 0.5 }}>
          <OffthreadVideo
            src={staticFile("reference/mooograph-reference-30fps.mp4")}
            startFrom={0}
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "fill",
            }}
          />
        </AbsoluteFill>
      )}

      {/* Layer 1: Canvas reproduction */}
      <AbsoluteFill style={{ opacity: showRef ? 0.7 : 1 }}>
        <CanvasScene draw={draw} />
      </AbsoluteFill>

      {/* Layer 2: Mode indicator */}
      {showRef && (
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            color: "#FF0000",
            fontSize: 14,
            fontFamily: "monospace",
            background: "rgba(0,0,0,0.7)",
            padding: "4px 8px",
            borderRadius: 4,
          }}
        >
          OVERLAY MODE
        </div>
      )}
    </AbsoluteFill>
  );
};
