/**
 * Scene 1: <Img> Loading Test
 *
 * Loads the Recraft SVG using Remotion's <Img> component with staticFile().
 * Applies whole-SVG transform + opacity animation.
 * Tests: Can Remotion load and render Recraft SVG as an image asset?
 */
import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import { config } from "../config";

export const SvgImgTest: React.FC<{
  startFrame: number;
  duration: number;
}> = ({ startFrame, duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - startFrame;
  if (f < 0 || f >= duration) return null;

  const opacity = interpolate(f, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const scale = spring({
    frame: f,
    fps,
    config: { damping: 20, stiffness: 140, mass: 1 },
  });
  const rotate = interpolate(f, [0, duration], [0, 15]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: config.palette.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 60,
          color: config.palette.labelMuted,
          fontSize: config.labelSize,
          fontFamily: "monospace",
        }}
      >
        Scene 1: &lt;Img&gt; Loading — staticFile SVG
      </div>
      <Img
        src={staticFile("recraft/flamingo-vector.svg")}
        style={{
          width: 600,
          height: 600,
          opacity,
          transform: `scale(${scale}) rotate(${rotate}deg)`,
        }}
      />
    </AbsoluteFill>
  );
};
