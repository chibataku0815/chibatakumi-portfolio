/**
 * Scene 5: ClipPath Progressive Reveal
 *
 * Uses SVG <clipPath> with an animated <rect> to progressively
 * reveal the flamingo from left to right.
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

export const SvgClipReveal: React.FC<{
  startFrame: number;
  duration: number;
}> = ({ startFrame, duration }) => {
  const frame = useCurrentFrame();
  const f = frame - startFrame;
  if (f < 0 || f >= duration) return null;

  const revealWidth = interpolate(f, [5, duration - 10], [0, 2048], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const revealPercent = Math.round((revealWidth / 2048) * 100);

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
        Scene 5: ClipPath Reveal — left-to-right wipe
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
            <clipPath id="reveal-clip">
              <rect x="0" y="0" width={revealWidth} height="2048" />
            </clipPath>
          </defs>

          {/* Ghost outline (faint) behind clip */}
          <g opacity={0.08}>
            {flamingoPaths.map((path, i) => (
              <path key={`ghost-${i}`} d={path.d} fill={path.fill} />
            ))}
          </g>

          {/* Revealed area */}
          <g clipPath="url(#reveal-clip)">
            {flamingoPaths.map((path, i) => (
              <path key={i} d={path.d} fill={path.fill} />
            ))}
          </g>

          {/* Reveal edge line */}
          <line
            x1={revealWidth}
            y1={0}
            x2={revealWidth}
            y2={2048}
            stroke="#d97706"
            strokeWidth={6}
            opacity={revealWidth > 0 && revealWidth < 2048 ? 0.8 : 0}
          />
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
        Reveal: {revealPercent}%
      </div>
    </AbsoluteFill>
  );
};
