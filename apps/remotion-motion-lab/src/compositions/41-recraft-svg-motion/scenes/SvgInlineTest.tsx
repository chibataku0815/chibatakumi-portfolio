/**
 * Scene 2: Inline SVG React Component
 *
 * KEY TEST — renders Recraft SVG paths as inline JSX.
 * Each path appears with stagger animation to show individual element control.
 * Gradient preserved, metadata removed, preserveAspectRatio corrected.
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  Easing,
} from "remotion";
import { config } from "../config";
import { flamingoPaths, gradient } from "../flamingoPathData";

export const SvgInlineTest: React.FC<{
  startFrame: number;
  duration: number;
}> = ({ startFrame, duration }) => {
  const frame = useCurrentFrame();
  const f = frame - startFrame;
  if (f < 0 || f >= duration) return null;

  const globalOpacity = interpolate(f, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

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
          zIndex: 10,
        }}
      >
        Scene 2: Inline SVG — {flamingoPaths.length} paths, gradient preserved
      </div>

      <div
        style={{
          width: 700,
          height: 700,
          opacity: globalOpacity,
        }}
      >
        <svg
          viewBox="0 0 2048 2048"
          preserveAspectRatio="xMidYMid meet"
          width="100%"
          height="100%"
        >
          <defs>
            <linearGradient
              id={gradient.id}
              gradientUnits={gradient.gradientUnits}
              x1={gradient.x1}
              x2={gradient.x2}
              y1={gradient.y1}
              y2={gradient.y2}
            >
              {gradient.stops.map((stop, i) => (
                <stop
                  key={i}
                  offset={stop.offset}
                  stopColor={stop.stopColor}
                  stopOpacity={stop.stopOpacity}
                />
              ))}
            </linearGradient>
          </defs>

          {flamingoPaths.map((path, i) => {
            const staggerDelay = i * 2;
            const pathOpacity = interpolate(
              f,
              [staggerDelay, staggerDelay + 15],
              [0, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.cubic),
              }
            );

            return (
              <path
                key={i}
                d={path.d}
                fill={path.fill}
                opacity={pathOpacity}
              />
            );
          })}
        </svg>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 40,
          color: config.palette.accent,
          fontSize: 16,
          fontFamily: "monospace",
        }}
      >
        Paths rendered: {flamingoPaths.length} | Gradients: 1
      </div>
    </AbsoluteFill>
  );
};
