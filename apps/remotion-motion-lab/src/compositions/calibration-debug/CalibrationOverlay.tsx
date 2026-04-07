/**
 * CalibrationOverlay — Reference video + calibration markers overlay.
 *
 * Validates that the CSS crop correctly maps the 2832x1548 recording
 * to the 1920x1080 canvas coordinate system.
 *
 * CSS crop derivation:
 *   Canvas in recording: x=40, y=0, w=2752, h=1548
 *   Scale = 1920 / 2752 = 30/43
 *   displayW = 2832 * 30/43 = 1975.81px
 *   displayH = 1548 * 30/43 = 1080.00px (exact)
 *   offsetX  = -40  * 30/43 = -27.91px
 */
import React, { useCallback } from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { CanvasScene, W } from "../../lib/canvas-primitives";
import { drawCalibration } from "./Composition";

// Reference video geometry
const REF_VIDEO_W = 2832;
const CANVAS_OFFSET_X = 40;
const CANVAS_REGION_W = 2752;

// Derived display values
const VIDEO_DISPLAY_W = (REF_VIDEO_W / CANVAS_REGION_W) * W; // 1975.81px
const VIDEO_OFFSET_X = -(CANVAS_OFFSET_X / CANVAS_REGION_W) * W; // -27.91px

export const CalibrationOverlay: React.FC = () => {
  const stableDraw = useCallback(drawCalibration, []);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Layer 1: Reference video (cropped to canvas region) */}
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <OffthreadVideo
          src={staticFile("reference/cleanshot-reference.mp4")}
          startFrom={750}
          muted
          style={{
            position: "absolute",
            width: VIDEO_DISPLAY_W,
            height: 1080,
            left: VIDEO_OFFSET_X,
            top: 0,
            objectFit: "fill",
          }}
        />
      </AbsoluteFill>

      {/* Layer 2: Calibration markers (50% opacity) */}
      <AbsoluteFill style={{ opacity: 0.5 }}>
        <CanvasScene draw={stableDraw} />
      </AbsoluteFill>

      {/* Layer 3: Mode label */}
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
        CALIBRATION OVERLAY
      </div>
    </AbsoluteFill>
  );
};
