import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { buildNeonSushiStrokes, config } from "./config";
import { FlowingNeonLayer, sharedSvgStyle } from "./lib/flowing-neon-svg";
import { useSvgMarkup } from "../../lib/use-svg-markup";

const NoiseOverlay: React.FC = () => {
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(circle at 50% 48%, rgba(255,255,255,0.06), transparent 34%),
            radial-gradient(circle at 50% 50%, rgba(255,255,255,0.025), transparent 62%)
          `,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.2,
          backgroundImage: `
            radial-gradient(${config.colors.grain} 0.7px, transparent 0.9px),
            radial-gradient(rgba(255,255,255,0.025) 0.5px, transparent 0.7px)
          `,
          backgroundSize: "4px 4px, 7px 7px",
          backgroundPosition: "0 0, 2px 1px",
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 50%, transparent 44%, rgba(0,0,0,0.42) 100%)",
          pointerEvents: "none",
        }}
      />
    </>
  );
};

export const AETipFlowingNeonSushi: React.FC = () => {
  const frame = useCurrentFrame();
  const heroMarkup = useSvgMarkup(config.sources.hero, "Flowing Neon Sushi hero");
  const frameMarkup = useSvgMarkup(config.sources.frame, "Flowing Neon Sushi frame");
  const neonSushiStrokes = useMemo(() => {
    if (!heroMarkup || !frameMarkup) {
      return [];
    }

    return buildNeonSushiStrokes({
      heroSvgMarkup: heroMarkup,
      frameSvgMarkup: frameMarkup,
    });
  }, [frameMarkup, heroMarkup]);
  const heroStrokes = neonSushiStrokes.filter((stroke) => stroke.group === "hero");
  const frameStrokes = neonSushiStrokes.filter((stroke) => stroke.group === "frame");

  return (
    <AbsoluteFill
      style={{
        background: `
          radial-gradient(circle at 50% 46%, ${config.colors.backgroundLift}, transparent 38%),
          ${config.colors.background}
        `,
      }}
    >
      <NoiseOverlay />

      <svg
        viewBox={`0 0 ${config.width} ${config.height}`}
        style={sharedSvgStyle}
      >
        {frameStrokes.map((stroke, index) => (
          <FlowingNeonLayer
            key={stroke.id}
            frame={frame}
            seed={index + 1}
            spec={stroke}
          />
        ))}
      </svg>

      <svg
        viewBox={`0 0 ${config.width} ${config.height}`}
        style={sharedSvgStyle}
      >
        <g transform={config.heroTransform}>
          {heroStrokes.map((stroke, index) => (
            <FlowingNeonLayer
              key={stroke.id}
              frame={frame}
              seed={index + 11}
              spec={stroke}
            />
          ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
