/**
 * IsshinReelPackageOverlay — Reference + reproduction overlay.
 *
 * Background: reference video at full opacity
 * Foreground: reproduction canvas at 25% opacity
 *
 * CSS crop derivation: see CalibrationOverlay.tsx
 */
import React, { useCallback } from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { CanvasScene, W, H } from "../../lib/canvas-primitives";
import { draw } from "./Composition";

// Reference video geometry
const REF_VIDEO_W = 2832;
const CANVAS_OFFSET_X = 40;
const CANVAS_REGION_W = 2752;

const VIDEO_DISPLAY_W = (REF_VIDEO_W / CANVAS_REGION_W) * W;
const VIDEO_OFFSET_X = -(CANVAS_OFFSET_X / CANVAS_REGION_W) * W;

export const IsshinReelPackageOverlay: React.FC = () => {
  const stableDraw = useCallback(draw, []);
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Background: Reference video (full opacity) */}
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <OffthreadVideo
          src={staticFile("reference/cleanshot-reference.mp4")}
          startFrom={750}
          muted
          style={{
            position: "absolute",
            width: VIDEO_DISPLAY_W,
            height: H,
            left: VIDEO_OFFSET_X,
            top: 0,
            objectFit: "fill",
          }}
        />
      </AbsoluteFill>

      {/* Foreground: Reproduction canvas (25% opacity) */}
      <AbsoluteFill style={{ opacity: 0.25 }}>
        <CanvasScene draw={stableDraw} />
      </AbsoluteFill>

      {/* Frame counter */}
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          color: "#FF0000",
          fontSize: 14,
          fontFamily: "monospace",
          background: "rgba(0,0,0,0.7)",
          padding: "4px 8px",
          borderRadius: 4,
        }}
      >
        f{frame} / t{(frame / 50).toFixed(2)}s
      </div>
    </AbsoluteFill>
  );
};
