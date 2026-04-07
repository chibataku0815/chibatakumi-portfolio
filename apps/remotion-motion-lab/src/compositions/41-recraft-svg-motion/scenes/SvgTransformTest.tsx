/**
 * Scene 3: Per-Path Transform
 *
 * Applies individual transforms to major flamingo paths:
 * - Path 0 (background): static
 * - Path 1 (body-red): translateX with spring
 * - Path 2-3: scale from center with stagger
 * - Path 4-5: rotate around center
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import { config } from "../config";
import { flamingoPaths, gradient } from "../flamingoPathData";

/** Paths used in this scene (indices into flamingoPaths array) */
const SCENE_PATHS = [0, 1, 2, 4, 5, 12, 14, 15, 16, 17];

export const SvgTransformTest: React.FC<{
  startFrame: number;
  duration: number;
}> = ({ startFrame, duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - startFrame;
  if (f < 0 || f >= duration) return null;

  const globalOpacity = interpolate(f, [0, 8], [0, 1], {
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
        Scene 3: Per-Path Transform — spring translate / scale / rotate
      </div>

      <div style={{ width: 700, height: 700, opacity: globalOpacity }}>
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

          {SCENE_PATHS.map((pathIdx, i) => {
            const path = flamingoPaths[pathIdx];
            if (!path) return null;

            const staggerFrame = Math.max(0, f - i * 5);
            let transform = "";

            if (i === 0) {
              // Background: static
              transform = "";
            } else if (i === 1) {
              // Body red: translateX with spring
              const tx = spring({
                frame: staggerFrame,
                fps,
                config: { damping: 18, stiffness: 120, mass: 1 },
              });
              const offset = interpolate(tx, [0, 1], [-200, 0]);
              transform = `translate(${offset}, 0)`;
            } else if (i <= 3) {
              // Scale from center
              const s = spring({
                frame: staggerFrame,
                fps,
                config: { damping: 15, stiffness: 100, mass: 1.2 },
              });
              transform = `translate(1024, 1024) scale(${s}) translate(-1024, -1024)`;
            } else {
              // Rotate around center
              const rot = spring({
                frame: staggerFrame,
                fps,
                config: { damping: 22, stiffness: 80, mass: 0.8 },
              });
              const angle = interpolate(rot, [0, 1], [-15, 0]);
              transform = `rotate(${angle}, 1024, 1024)`;
            }

            return (
              <path
                key={i}
                d={path.d}
                fill={path.fill}
                transform={transform || undefined}
              />
            );
          })}
        </svg>
      </div>
    </AbsoluteFill>
  );
};
