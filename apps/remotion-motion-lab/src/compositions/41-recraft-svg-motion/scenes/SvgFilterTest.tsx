/**
 * Scene 7: Dynamic SVG Filters
 *
 * Tests animated SVG filter effects:
 * - First half: feGaussianBlur from 20 -> 0 (blur reveal)
 * - Second half: feDropShadow with pulsing glow
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

export const SvgFilterTest: React.FC<{
  startFrame: number;
  duration: number;
}> = ({ startFrame, duration }) => {
  const frame = useCurrentFrame();
  const f = frame - startFrame;
  if (f < 0 || f >= duration) return null;

  const halfDuration = duration / 2;

  // First half: blur from 20 to 0
  const blurAmount = interpolate(f, [0, halfDuration], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Second half: drop shadow pulse
  const shadowPhase = Math.max(0, f - halfDuration);
  const shadowSpread = interpolate(
    Math.sin((shadowPhase / 10) * Math.PI),
    [-1, 1],
    [3, 15],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const shadowOpacity = interpolate(
    shadowPhase,
    [0, 10],
    [0, 0.7],
    { extrapolateRight: "clamp" }
  );

  const isBlurPhase = f < halfDuration;
  const filterId = isBlurPhase ? "dynamic-blur" : "dynamic-shadow";

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
        Scene 7: SVG Filters —{" "}
        {isBlurPhase
          ? `Gaussian blur: ${blurAmount.toFixed(1)}`
          : `Drop shadow spread: ${shadowSpread.toFixed(1)}`}
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

            <filter id="dynamic-blur">
              <feGaussianBlur stdDeviation={blurAmount} />
            </filter>

            <filter id="dynamic-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation={shadowSpread}
                floodColor={config.palette.accent}
                floodOpacity={shadowOpacity}
              />
            </filter>
          </defs>

          <g filter={`url(#${filterId})`}>
            {flamingoPaths.map((path, i) => (
              <path key={i} d={path.d} fill={path.fill} />
            ))}
          </g>
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
        {isBlurPhase ? "Phase: Blur Reveal" : "Phase: Shadow Pulse"}
      </div>
    </AbsoluteFill>
  );
};
