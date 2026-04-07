/**
 * Scene 8: SVG vs PNG Scale Quality Comparison
 *
 * Side-by-side comparison zooming from 100% to 400%.
 * At high magnification the vector advantage becomes clearly visible.
 */
import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  interpolate,
  useCurrentFrame,
  Easing,
} from "remotion";
import { config } from "../config";

export const ScaleCompareTest: React.FC<{
  startFrame: number;
  duration: number;
}> = ({ startFrame, duration }) => {
  const frame = useCurrentFrame();
  const f = frame - startFrame;
  if (f < 0 || f >= duration) return null;

  const scale = interpolate(f, [10, duration - 10], [1, 4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const opacity = interpolate(f, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: config.palette.bg,
        flexDirection: "row",
        opacity,
      }}
    >
      {/* SVG side */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderRight: "2px solid #292524",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            color: config.palette.accent,
            fontSize: 18,
            fontFamily: "monospace",
            zIndex: 10,
          }}
        >
          SVG (vector)
        </div>
        <Img
          src={staticFile("recraft/flamingo-vector.svg")}
          style={{
            width: 300,
            height: 300,
            transform: `scale(${scale})`,
          }}
        />
      </div>

      {/* PNG side */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            color: config.palette.labelMuted,
            fontSize: 18,
            fontFamily: "monospace",
            zIndex: 10,
          }}
        >
          PNG (raster)
        </div>
        <Img
          src={staticFile("recraft/flamingo-raster.png")}
          style={{
            width: 300,
            height: 300,
            transform: `scale(${scale})`,
          }}
        />
      </div>

      {/* Scene label */}
      <div
        style={{
          position: "absolute",
          top: 40,
          width: "100%",
          textAlign: "center",
          color: config.palette.labelMuted,
          fontSize: config.labelSize,
          fontFamily: "monospace",
          zIndex: 10,
        }}
      >
        Scene 8: Scale Compare — SVG vs PNG at magnification
      </div>

      {/* Scale indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 30,
          width: "100%",
          textAlign: "center",
          color: config.palette.label,
          fontSize: 16,
          fontFamily: "monospace",
        }}
      >
        Scale: {Math.round(scale * 100)}%
      </div>
    </AbsoluteFill>
  );
};
