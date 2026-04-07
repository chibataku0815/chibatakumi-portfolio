/**
 * Scene 4: Stagger Fade
 *
 * All flamingo paths fade in sequentially with 2-frame stagger.
 * Demonstrates individual element control over Recraft-generated SVG.
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

export const SvgOpacityTest: React.FC<{
  startFrame: number;
  duration: number;
}> = ({ startFrame, duration }) => {
  const frame = useCurrentFrame();
  const f = frame - startFrame;
  if (f < 0 || f >= duration) return null;

  // Count how many paths are currently visible for the HUD
  let visibleCount = 0;

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
        Scene 4: Stagger Fade — 2-frame delay per path
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

          {flamingoPaths.map((path, i) => {
            const staggerDelay = i * 2;
            const fadeDuration = 12;
            const pathOpacity = interpolate(
              f,
              [staggerDelay, staggerDelay + fadeDuration],
              [0, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.cubic),
              }
            );

            if (pathOpacity > 0.01) visibleCount++;

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
          display: "flex",
          gap: 40,
          color: config.palette.accent,
          fontSize: 16,
          fontFamily: "monospace",
        }}
      >
        <span>
          Paths visible: {visibleCount}/{flamingoPaths.length}
        </span>
        <span>Frame: {f}</span>
      </div>
    </AbsoluteFill>
  );
};
