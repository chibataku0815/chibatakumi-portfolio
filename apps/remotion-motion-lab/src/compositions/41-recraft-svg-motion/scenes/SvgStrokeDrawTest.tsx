/**
 * Scene 6: Stroke-dasharray Drawing Animation
 *
 * Recraft paths are FILLED, not stroked. Strategy:
 * 1. Render filled paths at low opacity as background
 * 2. Overlay same paths with fill="none" stroke + strokeDasharray animation
 * 3. Animate strokeDashoffset from 1 to 0 (using pathLength="1")
 *
 * Uses a simplified subset (4 main paths) to avoid performance issues.
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

/** Indices into flamingoPaths for stroke-draw (large, visually distinct paths) */
const STROKE_PATHS = [1, 12, 14, 15, 17, 19];

export const SvgStrokeDrawTest: React.FC<{
  startFrame: number;
  duration: number;
}> = ({ startFrame, duration }) => {
  const frame = useCurrentFrame();
  const f = frame - startFrame;
  if (f < 0 || f >= duration) return null;

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
        Scene 6: Stroke-dasharray Draw — fill paths as stroke animation
      </div>

      <div style={{ width: 700, height: 700 }}>
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

          {/* Background: all paths at low opacity */}
          <g opacity={0.1}>
            {flamingoPaths.map((path, i) => (
              <path key={`bg-${i}`} d={path.d} fill={path.fill} />
            ))}
          </g>

          {/* Stroke-draw overlay on selected paths */}
          {STROKE_PATHS.map((pathIdx, i) => {
            const path = flamingoPaths[pathIdx];
            if (!path) return null;

            const staggerDelay = i * 8;
            const drawProgress = interpolate(
              f,
              [staggerDelay, staggerDelay + 40],
              [1, 0],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.cubic),
              }
            );

            // Fill fades in after stroke is drawn
            const fillOpacity = interpolate(
              f,
              [staggerDelay + 30, staggerDelay + 50],
              [0, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }
            );

            // Resolve stroke color from fill
            const strokeColor =
              path.fill.startsWith("url(") ? "#d97706" : path.fill;

            return (
              <React.Fragment key={i}>
                {/* Fill layer (fades in after draw) */}
                <path
                  d={path.d}
                  fill={path.fill}
                  opacity={fillOpacity}
                />
                {/* Stroke draw layer */}
                <path
                  d={path.d}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={4}
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={drawProgress}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </React.Fragment>
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
        Stroke draw: pathLength=1, dashoffset animation
      </div>
    </AbsoluteFill>
  );
};
