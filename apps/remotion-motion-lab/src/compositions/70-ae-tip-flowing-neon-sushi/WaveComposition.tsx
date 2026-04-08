import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { useSvgMarkup } from "../../lib/use-svg-markup";
import {
  buildFlowingNeonWaveSpecs,
  flowingNeonWaveConfig,
} from "./wave-config";
import { FlowingNeonLayer, sharedSvgStyle } from "./lib/flowing-neon-svg";

const WaveAtmosphere: React.FC = () => {
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(circle at 50% 46%, rgba(159,188,255,0.16), transparent 36%),
            radial-gradient(circle at 50% 62%, rgba(79,116,255,0.18), transparent 44%)
          `,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.22,
          backgroundImage: `
            radial-gradient(rgba(255,255,255,0.12) 0.7px, transparent 0.9px),
            radial-gradient(rgba(132,170,255,0.1) 0.6px, transparent 0.8px)
          `,
          backgroundSize: "4px 4px, 9px 9px",
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
            "radial-gradient(circle at 50% 50%, transparent 46%, rgba(2,6,23,0.58) 100%)",
          pointerEvents: "none",
        }}
      />
    </>
  );
};

export const AETipFlowingNeonWave: React.FC = () => {
  const frame = useCurrentFrame();
  const svgMarkup = useSvgMarkup(
    flowingNeonWaveConfig.source,
    "Flowing Neon Wave",
  );
  const neonWave = useMemo(() => {
    if (!svgMarkup) {
      return null;
    }

    return buildFlowingNeonWaveSpecs(svgMarkup);
  }, [svgMarkup]);

  const viewBox = neonWave?.viewBox ?? {
    minX: 0,
    minY: 0,
    width: flowingNeonWaveConfig.width,
    height: flowingNeonWaveConfig.height,
  };

  return (
    <AbsoluteFill
      style={{
        background: `
          radial-gradient(circle at 50% 45%, rgba(128,165,255,0.12), transparent 30%),
          ${flowingNeonWaveConfig.colors.background}
        `,
      }}
    >
      <WaveAtmosphere />

      <svg
        viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`}
        preserveAspectRatio="xMidYMid meet"
        style={sharedSvgStyle}
      >
        {(neonWave?.specs ?? []).map((stroke, index) => (
          <FlowingNeonLayer
            key={stroke.id}
            frame={frame}
            seed={index + 101}
            spec={stroke}
          />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
