import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { config } from "./config";

type Point = {
  x: number;
  y: number;
};

type PopState = {
  holdProgress: number;
  punchProgress: number;
  dissolveProgress: number;
  roughProgress: number;
  distortionScale: number;
  bubbleOpacity: number;
  membraneOpacity: number;
  debrisOpacity: number;
  ringOpacity: number;
};

const SERIF_FONT = '"Iowan Old Style", Georgia, serif';
const SANS_FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const MONO_FONT = '"Courier New", monospace';

const seeded = (seed: number) => {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453123;
  return value - Math.floor(value);
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const mix = (start: number, end: number, progress: number) =>
  start + (end - start) * progress;

const expOut = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

const cubicOut = (t: number) => 1 - Math.pow(1 - t, 3);

const quintOut = (t: number) => 1 - Math.pow(1 - t, 5);

const phaseProgress = (
  frame: number,
  start: number,
  duration: number,
  easing: (value: number) => number,
) => easing(clamp01((frame - start) / duration));

const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
): Point => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const describeArc = (
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) => {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M",
    start.x.toFixed(1),
    start.y.toFixed(1),
    "A",
    radius.toFixed(1),
    radius.toFixed(1),
    "0",
    largeArcFlag,
    "0",
    end.x.toFixed(1),
    end.y.toFixed(1),
  ].join(" ");
};

const describeSector = (
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) => {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M",
    centerX.toFixed(1),
    centerY.toFixed(1),
    "L",
    start.x.toFixed(1),
    start.y.toFixed(1),
    "A",
    radius.toFixed(1),
    radius.toFixed(1),
    "0",
    largeArcFlag,
    "0",
    end.x.toFixed(1),
    end.y.toFixed(1),
    "Z",
  ].join(" ");
};

const fourPointStarPath = (size: number) =>
  `M 0 ${-size} L ${size * 0.3} ${-size * 0.3} L ${size} 0 L ${
    size * 0.3
  } ${size * 0.3} L 0 ${size} L ${-size * 0.3} ${size * 0.3} L ${-size} 0 L ${
    -size * 0.3
  } ${-size * 0.3} Z`;

const speckles = Array.from({ length: config.texture.speckleCount }, (_, index) => ({
  left: seeded(index * 4 + 1) * config.width,
  top: seeded(index * 4 + 2) * config.height,
  size: 0.8 + seeded(index * 4 + 3) * 2.8,
  opacity: 0.05 + seeded(index * 4 + 4) * 0.13,
}));

const stageSpeckles = Array.from(
  { length: config.texture.stageSpeckleCount },
  (_, index) => ({
    x: seeded(index * 5 + 1) * config.heroStage.width,
    y: seeded(index * 5 + 2) * config.heroStage.height,
    size: 1.4 + seeded(index * 5 + 3) * 4.8,
    opacity: 0.04 + seeded(index * 5 + 4) * 0.12,
  }),
);

const punchBursts = [
  { dx: 0, dy: 0, scale: 0.98, delay: 0 },
  { dx: 116, dy: -48, scale: 0.46, delay: 1 },
  { dx: -122, dy: 66, scale: 0.42, delay: 1 },
  { dx: 58, dy: 144, scale: 0.36, delay: 2 },
  { dx: 178, dy: 82, scale: 0.34, delay: 2 },
  { dx: -170, dy: -98, scale: 0.28, delay: 3 },
  { dx: 92, dy: -172, scale: 0.22, delay: 3 },
];

const breakupSeeds = Array.from({ length: 26 }, (_, index) => ({
  angle: seeded(index * 7 + 1) * 360,
  radial: 0.82 + seeded(index * 7 + 2) * 0.28,
  size: 4 + seeded(index * 7 + 3) * 16,
  delay: Math.floor(seeded(index * 7 + 4) * 18),
}));

const debrisSeeds = Array.from({ length: 24 }, (_, index) => ({
  angle: seeded(index * 6 + 1) * 360,
  travel: 72 + seeded(index * 6 + 2) * 190,
  size: 12 + seeded(index * 6 + 3) * 28,
  delay: Math.floor(seeded(index * 6 + 4) * 15),
  spin: -110 + seeded(index * 6 + 5) * 220,
  colorIndex: Math.floor(seeded(index * 6 + 6) * 3),
}));

const membraneShardSeeds = Array.from({ length: 18 }, (_, index) => ({
  angle: seeded(index * 8 + 1) * 360,
  innerRadius: 48 + seeded(index * 8 + 2) * 118,
  outerRadius: 18 + seeded(index * 8 + 3) * 46,
  span: 10 + seeded(index * 8 + 4) * 32,
  delay: Math.floor(seeded(index * 8 + 5) * 18),
  colorIndex: Math.floor(seeded(index * 8 + 6) * 3),
  strokeOnly: seeded(index * 8 + 7) > 0.55,
}));

const paletteCycle = [
  config.colors.accentBlue,
  config.colors.accentYellow,
  config.colors.accentLilac,
];

const getPopState = (frame: number): PopState => {
  const holdProgress = phaseProgress(frame, 0, config.pop.frame, quintOut);
  const punchProgress = phaseProgress(
    frame,
    config.pop.frame,
    config.pop.punchDurationFrames,
    expOut,
  );
  const dissolveProgress = phaseProgress(
    frame,
    config.pop.frame + 2,
    config.pop.dissolveDurationFrames,
    cubicOut,
  );
  const roughProgress = phaseProgress(
    frame,
    config.pop.frame + config.pop.roughDelayFrames,
    config.pop.roughDurationFrames,
    cubicOut,
  );

  const distortionRise = phaseProgress(
    frame,
    config.pop.frame,
    config.pop.distortionPeakFrames,
    expOut,
  );
  const distortionFall = phaseProgress(
    frame,
    config.pop.frame + config.pop.distortionPeakFrames,
    config.pop.distortionDecayFrames,
    cubicOut,
  );
  const distortionScale =
    config.pop.distortionPeak * distortionRise * (1 - distortionFall * 0.92);
  const bubbleOpacity = clamp01(1 - dissolveProgress * 1.08);
  const membraneOpacity = clamp01(1 - dissolveProgress * 1.18);
  const debrisOpacity = clamp01(
    phaseProgress(frame, config.pop.frame - 1, 8, expOut) *
      (1 - phaseProgress(frame, config.pop.frame + 20, 72, cubicOut)),
  );
  const ringOpacity = clamp01((1 - punchProgress * 0.78) * (1 - dissolveProgress * 0.45));

  return {
    holdProgress,
    punchProgress,
    dissolveProgress,
    roughProgress,
    distortionScale,
    bubbleOpacity,
    membraneOpacity,
    debrisOpacity,
    ringOpacity,
  };
};

const paperTextureStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: `
    radial-gradient(circle at 15% 20%, rgba(255,255,255,0.32), transparent 24%),
    radial-gradient(circle at 84% 16%, rgba(0,0,0,0.05), transparent 18%),
    radial-gradient(circle at 68% 74%, rgba(0,0,0,0.04), transparent 18%),
    linear-gradient(145deg, ${config.colors.paper} 0%, ${config.colors.paperShade} 100%)
  `,
};

const FrameMarks: React.FC = () => {
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: config.frameInset,
          border: `24px solid ${config.colors.frameBlack}`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: config.frameInset + 14,
          border: `1px solid ${config.colors.lightInk}`,
          pointerEvents: "none",
        }}
      />
    </>
  );
};

const PaperTexture: React.FC = () => {
  return (
    <>
      <div style={paperTextureStyle} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: config.texture.paperNoiseOpacity,
          backgroundImage: `
            radial-gradient(circle at 20% 18%, rgba(20,17,15,0.18) 0 1px, transparent 1px),
            radial-gradient(circle at 76% 22%, rgba(20,17,15,0.12) 0 1px, transparent 1px),
            radial-gradient(circle at 40% 78%, rgba(255,255,255,0.24) 0 1px, transparent 1px)
          `,
          backgroundSize: "26px 26px, 32px 32px, 18px 18px",
          mixBlendMode: "multiply",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: config.texture.printDirtOpacity,
          backgroundImage: `
            radial-gradient(circle at 8% 12%, rgba(20,17,15,0.16) 0 1px, transparent 1px),
            radial-gradient(circle at 92% 8%, rgba(20,17,15,0.14) 0 1px, transparent 1px),
            radial-gradient(circle at 88% 88%, rgba(20,17,15,0.12) 0 1px, transparent 1px),
            radial-gradient(circle at 14% 90%, rgba(20,17,15,0.15) 0 1px, transparent 1px),
            linear-gradient(90deg, rgba(20,17,15,0.06), transparent 12%, transparent 88%, rgba(20,17,15,0.06))
          `,
          backgroundSize: "18px 18px, 22px 22px, 16px 16px, 20px 20px, 100% 100%",
          mixBlendMode: "multiply",
        }}
      />
      {speckles.map((speckle, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            left: speckle.left,
            top: speckle.top,
            width: speckle.size,
            height: speckle.size,
            borderRadius: "50%",
            background: config.colors.ink,
            opacity: speckle.opacity,
          }}
        />
      ))}
    </>
  );
};

const PaletteSwatch: React.FC<{ color: string; label: string }> = ({
  color,
  label,
}) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: color,
          border: `2px solid ${config.colors.ink}`,
          flexShrink: 0,
        }}
      />
      <div
        style={{
          fontFamily: MONO_FONT,
          fontSize: 13,
          letterSpacing: "0.04em",
          color: config.colors.mutedInk,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
};

const MetricBar: React.FC<{
  label: string;
  value: number;
  color: string;
}> = ({ label, value, color }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          fontFamily: MONO_FONT,
          fontSize: 13,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: config.colors.mutedInk,
        }}
      >
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <div
        style={{
          position: "relative",
          height: 12,
          borderRadius: 999,
          overflow: "hidden",
          border: `2px solid ${config.colors.ink}`,
          background: "rgba(20,17,15,0.08)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${Math.max(4, value * 100)}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
};

const HeroStage: React.FC<{ frame: number }> = ({ frame }) => {
  const state = getPopState(frame);
  const centerX = config.heroStage.width * 0.48;
  const centerY = config.heroStage.height * 0.54;
  const idleY = Math.sin(frame * 0.05) * 10 - state.holdProgress * 6;
  const jitterX = Math.sin(frame * 0.85) * state.roughProgress * 3.2;
  const jitterY = Math.cos(frame * 0.66) * state.roughProgress * 2.8;
  const punchRingRadius = 14 + state.punchProgress * config.pop.ringEndRadius;
  const secondaryRingRadius = 8 + state.punchProgress * (config.pop.ringEndRadius * 0.68);
  const stageHalftoneX = config.heroStage.width * 0.66 + Math.sin(frame * 0.03) * 14;
  const stageHalftoneY = config.heroStage.height * 0.28 + Math.cos(frame * 0.028) * 10;
  const residueLife = clamp01(
    phaseProgress(frame, config.pop.frame + 4, 10, expOut) *
      (1 - phaseProgress(frame, config.pop.frame + 44, 78, cubicOut)),
  );
  const bubbleScale = 1 + Math.sin(frame * 0.06) * 0.008 - state.punchProgress * 0.032;
  const registrationShiftX = state.punchProgress * 9 + Math.sin(frame * 0.09) * 1.4;
  const registrationShiftY = -state.punchProgress * 6 + Math.cos(frame * 0.07) * 1.2;

  return (
    <div
      style={{
        position: "absolute",
        left: config.heroStage.x,
        top: config.heroStage.y,
        width: config.heroStage.width,
        height: config.heroStage.height,
        border: `4px solid ${config.colors.ink}`,
        background: config.colors.panelPaper,
        boxShadow: "0 16px 34px rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}
    >
      <svg
        width={config.heroStage.width}
        height={config.heroStage.height}
        viewBox={`0 0 ${config.heroStage.width} ${config.heroStage.height}`}
      >
        <defs>
          <pattern
            id="bubble-pop-halftone"
            width={config.texture.halftoneDotSize}
            height={config.texture.halftoneDotSize}
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx={config.texture.halftoneDotSize / 2}
              cy={config.texture.halftoneDotSize / 2}
              r={config.texture.halftoneDotSize * 0.22}
              fill="rgba(20,17,15,0.78)"
            />
          </pattern>

          <pattern
            id="bubble-pop-halftone-fine"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
            patternTransform={`rotate(${12 + Math.sin(frame * 0.03) * 4})`}
          >
            <circle cx="5" cy="5" r="1.4" fill="rgba(20,17,15,0.65)" />
          </pattern>

          <filter id="bubble-pop-displace" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={`${0.016 + state.roughProgress * 0.008} ${
                0.028 + state.roughProgress * 0.008
              }`}
              numOctaves={3}
              seed={7}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={state.distortionScale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          <filter id="bubble-pop-residue" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={`${0.022 + state.roughProgress * 0.01} ${
                0.032 + state.roughProgress * 0.012
              }`}
              numOctaves={2}
              seed={19}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={8 + state.roughProgress * 20}
              xChannelSelector="R"
              yChannelSelector="G"
              result="distorted"
            />
            <feGaussianBlur in="distorted" stdDeviation="0.22" />
          </filter>

          <clipPath id="bubble-pop-clip">
            <circle cx={centerX} cy={centerY} r={config.bubble.innerRadius} />
          </clipPath>

          <mask id="bubble-pop-mask">
            <rect
              x="0"
              y="0"
              width={config.heroStage.width}
              height={config.heroStage.height}
              fill="black"
            />
            <circle cx={centerX} cy={centerY} r={config.bubble.radius} fill="white" />
            {punchBursts.map((burst, index) => {
              const local = phaseProgress(
                frame,
                config.pop.frame + burst.delay,
                config.pop.punchDurationFrames,
                expOut,
              );

              if (local <= 0) {
                return null;
              }

              return (
                <circle
                  key={index}
                  cx={centerX + burst.dx * (0.22 + local)}
                  cy={centerY + burst.dy * (0.22 + local)}
                  r={config.bubble.radius * (0.04 + local * burst.scale)}
                  fill="black"
                />
              );
            })}
            {breakupSeeds.map((seed, index) => {
              const local = phaseProgress(
                frame,
                config.pop.frame + config.pop.roughDelayFrames + seed.delay,
                config.pop.roughDurationFrames,
                cubicOut,
              );

              if (local <= 0) {
                return null;
              }

              const point = polarToCartesian(
                centerX,
                centerY,
                config.bubble.radius * seed.radial,
                seed.angle,
              );

              return (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r={seed.size * local}
                  fill="black"
                  opacity={0.9}
                />
              );
            })}
          </mask>
        </defs>

        <rect
          x="0"
          y="0"
          width={config.heroStage.width}
          height={config.heroStage.height}
          fill={config.colors.panelPaper}
        />

        <rect
          x="36"
          y="36"
          width={config.heroStage.width - 72}
          height={config.heroStage.height - 72}
          fill="none"
          stroke={config.colors.stageLine}
          strokeWidth="1"
        />

        <ellipse
          cx={stageHalftoneX}
          cy={stageHalftoneY}
          rx="220"
          ry="156"
          fill="url(#bubble-pop-halftone)"
          opacity={config.texture.halftoneOpacity}
        />

        <ellipse
          cx={config.heroStage.width * 0.24}
          cy={config.heroStage.height * 0.76}
          rx="160"
          ry="120"
          fill={config.colors.accentLilac}
          opacity={0.1}
        />

        {stageSpeckles.map((speckle, index) => (
          <circle
            key={index}
            cx={speckle.x}
            cy={speckle.y}
            r={speckle.size * 0.5}
            fill={config.colors.ink}
            opacity={speckle.opacity}
          />
        ))}

        <path
          d={describeArc(
            centerX - 24,
            centerY + idleY + 8,
            config.bubble.orbitRadiusX,
            212,
            348,
          )}
          fill="none"
          stroke={config.colors.ink}
          strokeWidth="4"
          opacity="0.92"
        />

        <path
          d={describeArc(
            centerX + 118,
            centerY - 134 + idleY,
            86,
            200,
            342,
          )}
          fill="none"
          stroke={config.colors.ink}
          strokeWidth="4"
          opacity="0.78"
        />

        <g
          transform={`translate(${registrationShiftX.toFixed(1)} ${registrationShiftY.toFixed(
            1,
          )}) scale(${(bubbleScale * 0.998).toFixed(4)})`}
          opacity={state.bubbleOpacity * 0.24}
          mask="url(#bubble-pop-mask)"
        >
          <circle
            cx={centerX}
            cy={centerY}
            r={config.bubble.radius}
            fill={config.colors.accentLilac}
          />
          <circle
            cx={centerX - 8}
            cy={centerY + 10}
            r={config.bubble.radius - 12}
            fill="none"
            stroke={config.colors.accentYellow}
            strokeWidth="8"
          />
        </g>

        <g
          transform={`translate(${jitterX.toFixed(1)} ${(
            idleY + jitterY
          ).toFixed(1)}) scale(${bubbleScale.toFixed(4)})`}
          mask="url(#bubble-pop-mask)"
          filter="url(#bubble-pop-displace)"
          opacity={state.bubbleOpacity}
        >
          <circle
            cx={centerX}
            cy={centerY}
            r={config.bubble.radius}
            fill={config.colors.paper}
          />
          <g clipPath="url(#bubble-pop-clip)">
            <circle
              cx={centerX}
              cy={centerY}
              r={config.bubble.innerRadius}
              fill={config.colors.paper}
            />
            <path
              d={describeSector(centerX, centerY, config.bubble.innerRadius + 26, 206, 338)}
              fill={config.colors.accentBlue}
            />
            <path
              d={describeSector(centerX, centerY, config.bubble.innerRadius + 18, 24, 164)}
              fill={config.colors.accentYellow}
            />
            <rect
              x={centerX - 66}
              y={centerY - config.bubble.innerRadius}
              width="132"
              height={config.bubble.innerRadius * 2}
              fill={config.colors.ink}
              opacity="0.08"
            />
            <rect
              x={centerX - 176}
              y={centerY - 30}
              width="220"
              height="64"
              rx="32"
              fill={config.colors.panelPaper}
              stroke={config.colors.ink}
              strokeWidth="6"
            />
            <path
              d={describeArc(centerX - 58, centerY - 60, 150, 228, 340)}
              fill="none"
              stroke={config.colors.ink}
              strokeWidth="8"
            />
            <ellipse
              cx={centerX + 112}
              cy={centerY + 12}
              rx="118"
              ry="146"
              fill="url(#bubble-pop-halftone)"
              opacity={0.4}
            />
            <ellipse
              cx={centerX - 72}
              cy={centerY - 120}
              rx="70"
              ry="34"
              fill={config.colors.accentLilac}
              opacity="0.78"
            />
            <path
              d={describeSector(centerX - 126, centerY + 104, 126, 304, 44)}
              fill={config.colors.accentLilac}
              opacity="0.85"
            />
            <path
              d={describeArc(centerX + 24, centerY + 42, 116, 118, 226)}
              fill="none"
              stroke={config.colors.paper}
              strokeWidth="18"
              opacity="0.42"
            />
            <ellipse
              cx={centerX - 102}
              cy={centerY + 84}
              rx="94"
              ry="72"
              fill="url(#bubble-pop-halftone-fine)"
              opacity="0.18"
            />
          </g>

          <circle
            cx={centerX}
            cy={centerY}
            r={config.bubble.radius - 16}
            fill="none"
            stroke={config.colors.panelPaper}
            strokeWidth="5"
            opacity={state.membraneOpacity * 0.92}
          />
          <circle
            cx={centerX}
            cy={centerY}
            r={config.bubble.radius}
            fill="none"
            stroke={config.colors.ink}
            strokeWidth={config.bubble.outlineWidth}
            opacity={state.membraneOpacity}
          />
        </g>

        <g opacity={state.ringOpacity}>
          <circle
            cx={centerX}
            cy={centerY + idleY * 0.4}
            r={punchRingRadius}
            fill="none"
            stroke={config.colors.ink}
            strokeWidth="6"
            strokeDasharray="24 20"
          />
          <circle
            cx={centerX}
            cy={centerY + idleY * 0.4}
            r={secondaryRingRadius}
            fill="none"
            stroke={config.colors.accentLilac}
            strokeWidth="10"
            opacity="0.92"
          />
          <circle
            cx={centerX}
            cy={centerY + idleY * 0.4}
            r={secondaryRingRadius + 16}
            fill="none"
            stroke={config.colors.accentYellow}
            strokeWidth="4"
            opacity="0.78"
            strokeDasharray="12 18"
          />
        </g>

        <g opacity={residueLife} filter="url(#bubble-pop-residue)">
          {breakupSeeds.slice(0, 12).map((seed, index) => {
            const radius = config.bubble.radius * (0.72 + (index % 3) * 0.12);
            const startAngle = seed.angle;
            const endAngle = seed.angle + 18 + seeded(index + 41) * 34;

            return (
              <path
                key={index}
                d={describeArc(centerX, centerY + idleY * 0.4, radius, startAngle, endAngle)}
                fill="none"
                stroke={index % 2 === 0 ? config.colors.ink : config.colors.accentLilac}
                strokeWidth={index % 2 === 0 ? 4 : 6}
                strokeDasharray={index % 3 === 0 ? "8 10" : undefined}
                opacity={0.22 + (index % 5) * 0.12}
              />
            );
          })}

          {membraneShardSeeds.map((seed, index) => {
            const local = phaseProgress(
              frame,
              config.pop.frame + 5 + seed.delay,
              18,
              expOut,
            );
            if (local <= 0) {
              return null;
            }

            const point = polarToCartesian(
              centerX,
              centerY + idleY * 0.4,
              seed.innerRadius + local * 18,
              seed.angle,
            );
            const fill = paletteCycle[seed.colorIndex];
            const rotation = seed.angle + local * 36;
            const opacity = (0.22 + local * 0.48) * (1 - state.roughProgress * 0.38);

            if (seed.strokeOnly) {
              return (
                <path
                  key={`stroke-${index}`}
                  d={describeArc(
                    centerX,
                    centerY + idleY * 0.4,
                    seed.innerRadius + local * 12,
                    seed.angle,
                    seed.angle + seed.span,
                  )}
                  fill="none"
                  stroke={fill}
                  strokeWidth={3 + seed.outerRadius * 0.08}
                  opacity={opacity}
                />
              );
            }

            return (
              <g
                key={`shard-${index}`}
                transform={`translate(${point.x.toFixed(1)} ${point.y.toFixed(
                  1,
                )}) rotate(${rotation.toFixed(1)})`}
                opacity={opacity}
              >
                <path
                  d={`M ${-seed.outerRadius * 0.7} ${-seed.outerRadius * 0.18} L ${
                    seed.outerRadius * 0.9
                  } ${-seed.outerRadius * 0.42} L ${seed.outerRadius * 0.62} ${
                    seed.outerRadius * 0.44
                  } L ${-seed.outerRadius * 0.92} ${seed.outerRadius * 0.24} Z`}
                  fill={fill}
                  stroke={config.colors.ink}
                  strokeWidth="3.5"
                />
              </g>
            );
          })}

          {breakupSeeds.slice(12, 20).map((seed, index) => {
            const point = polarToCartesian(
              centerX,
              centerY + idleY * 0.4,
              config.bubble.radius * (0.38 + seed.radial * 0.38),
              seed.angle,
            );

            return (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r={2 + seed.size * 0.14}
                fill={index % 2 === 0 ? config.colors.accentYellow : config.colors.ink}
                opacity={0.26 + (index % 4) * 0.12}
              />
            );
          })}
        </g>

        {debrisSeeds.map((seed, index) => {
          const local = phaseProgress(
            frame,
            config.pop.frame + seed.delay,
            config.pop.debrisDurationFrames,
            quintOut,
          );

          if (local <= 0) {
            return null;
          }

          const point = polarToCartesian(
            centerX,
            centerY + idleY * 0.4,
            config.bubble.radius + mix(14, seed.travel, local),
            seed.angle,
          );
          const opacity = state.debrisOpacity * (1 - local * 0.9);
          const scale = 0.45 + local * 0.92;
          const rotation = seed.angle + seed.spin * local;
          const fill = paletteCycle[seed.colorIndex];

          return (
            <g
              key={index}
              transform={`translate(${point.x.toFixed(1)} ${point.y.toFixed(
                1,
              )}) rotate(${rotation.toFixed(1)}) scale(${scale.toFixed(2)})`}
              opacity={opacity}
            >
              <path
                d={`M ${-seed.size * 0.7} ${-seed.size * 0.18} L ${
                  seed.size * 0.76
                } ${-seed.size * 0.36} L ${seed.size * 0.46} ${seed.size * 0.32} L ${
                  -seed.size * 0.9
                } ${seed.size * 0.28} Z`}
                fill={fill}
                stroke={config.colors.ink}
                strokeWidth="4"
              />
            </g>
          );
        })}

        <g opacity={0.94}>
          <g transform={`translate(${centerX + 340} ${centerY - 176}) rotate(18)`}>
            <path d={fourPointStarPath(22)} fill={config.colors.ink} />
          </g>
          <g transform={`translate(${centerX - 352} ${centerY - 164}) rotate(-12)`}>
            <path d={fourPointStarPath(16)} fill={config.colors.ink} />
          </g>
          <g transform={`translate(${centerX + 264} ${centerY + 198}) rotate(8)`}>
            <path d={fourPointStarPath(18)} fill={config.colors.ink} />
          </g>
        </g>

        <text
          x="44"
          y="58"
          fill={config.colors.ink}
          style={{
            fontFamily: MONO_FONT,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          SILHOUETTE ALPHA / TURBULENT DISPLACE / ROUGH EDGE
        </text>

        <text
          x="44"
          y="108"
          fill={config.colors.ink}
          style={{
            fontFamily: SERIF_FONT,
            fontSize: 54,
            fontWeight: 700,
            letterSpacing: "0.03em",
          }}
        >
          Bubble Pop
        </text>

        <text
          x="44"
          y="146"
          fill={config.colors.mutedInk}
          style={{
            fontFamily: SANS_FONT,
            fontSize: 17,
            fontWeight: 500,
          }}
        >
          Modular bubble object, print-textured membrane breakup, and a hard editorial poster frame.
        </text>
      </svg>
    </div>
  );
};

const Sidebar: React.FC<{ frame: number }> = ({ frame }) => {
  const state = getPopState(frame);
  const accentBlockOffset = Math.sin(frame * 0.04) * 12;

  return (
    <div
      style={{
        position: "absolute",
        left: config.sidebar.x,
        top: config.sidebar.y,
        width: config.sidebar.width,
        height: config.sidebar.height,
        border: `4px solid ${config.colors.ink}`,
        background: config.colors.panelPaper,
        boxShadow: "0 16px 34px rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 24,
          border: `1px solid ${config.colors.lightInk}`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          right: -98,
          top: 178,
          transform: "rotate(90deg)",
          transformOrigin: "top right",
          fontFamily: MONO_FONT,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.28em",
          color: config.colors.mutedInk,
        }}
      >
        PRINT-LIKE EDITORIAL NEO-BRUTALISM
      </div>

      <div
        style={{
          position: "absolute",
          left: 46,
          top: 44,
          fontFamily: MONO_FONT,
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: config.colors.ink,
        }}
      >
        {config.label}
      </div>

      <div
        style={{
          position: "absolute",
          left: 46,
          top: 84,
          right: 46,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div
          style={{
            fontFamily: SERIF_FONT,
            fontSize: 54,
            lineHeight: 0.92,
            fontWeight: 700,
            color: config.colors.ink,
          }}
        >
          {config.subtitle}
        </div>

        <div
          style={{
            fontFamily: SANS_FONT,
            fontSize: 17,
            lineHeight: 1.5,
            color: config.colors.mutedInk,
          }}
        >
          The membrane is removed by expanding mask circles, then displaced and roughened so the pop
          reads as torn print matter instead of a clean digital fade.
        </div>

        <div
          style={{
            position: "relative",
            marginTop: 10,
            height: 110,
            border: `4px solid ${config.colors.ink}`,
            overflow: "hidden",
            background: config.colors.paper,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 18 + accentBlockOffset,
              top: 20,
              width: 92,
              height: 28,
              borderRadius: 999,
              background: config.colors.accentBlue,
              border: `4px solid ${config.colors.ink}`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 122,
              top: 18,
              width: 138,
              height: 72,
              background: config.colors.accentYellow,
              clipPath: "polygon(0% 10%, 100% 0%, 72% 100%, 0% 88%)",
              border: `4px solid ${config.colors.ink}`,
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 18,
              bottom: 16,
              width: 126,
              height: 54,
              background: config.colors.accentLilac,
              borderTopLeftRadius: 90,
              borderTopRightRadius: 90,
              border: `4px solid ${config.colors.ink}`,
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <MetricBar
            label="Punch Mask"
            value={state.punchProgress}
            color={config.colors.accentBlue}
          />
          <MetricBar
            label="Displace"
            value={clamp01(state.distortionScale / config.pop.distortionPeak)}
            color={config.colors.accentYellow}
          />
          <MetricBar
            label="Rough Breakup"
            value={state.roughProgress}
            color={config.colors.accentLilac}
          />
        </div>

        <div
          style={{
            marginTop: 6,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <PaletteSwatch color={config.colors.ink} label="ink" />
          <PaletteSwatch color={config.colors.paper} label="paper" />
          <PaletteSwatch color={config.colors.accentYellow} label="acid yellow" />
          <PaletteSwatch color={config.colors.accentLilac} label="lilac" />
          <PaletteSwatch color={config.colors.accentBlue} label="periwinkle" />
        </div>

        <div
          style={{
            marginTop: 2,
            paddingTop: 18,
            borderTop: `1px solid ${config.colors.lightInk}`,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            fontFamily: MONO_FONT,
            fontSize: 13,
            letterSpacing: "0.04em",
            color: config.colors.mutedInk,
            textTransform: "uppercase",
          }}
        >
          <div>Texture stack: halftone + paper grain + dust + print dirt</div>
          <div>Object grammar: circle / ring / wedge / arch / star / bar</div>
          <div>Anti-patterns rejected: glossy soap bubble / clean flat only</div>
        </div>
      </div>
    </div>
  );
};

const BottomBand: React.FC<{ frame: number }> = ({ frame }) => {
  const state = getPopState(frame);
  const segmentWidth = (config.bottomBand.width - 48) / 3;
  const cards = [
    {
      title: "01 Membrane",
      note: "poster bubble object",
      value: clamp01(1 - state.punchProgress * 0.8),
      color: config.colors.accentBlue,
    },
    {
      title: "02 Punch-Out",
      note: "silhouette alpha burst",
      value: state.punchProgress,
      color: config.colors.accentYellow,
    },
    {
      title: "03 Breakup",
      note: "rough edge residue",
      value: state.roughProgress,
      color: config.colors.accentLilac,
    },
  ];

  return (
    <div
      style={{
        position: "absolute",
        left: config.bottomBand.x,
        top: config.bottomBand.y,
        width: config.bottomBand.width,
        height: config.bottomBand.height,
        background: config.colors.frameBlack,
        border: `4px solid ${config.colors.ink}`,
        display: "flex",
        alignItems: "stretch",
        padding: 24,
        boxSizing: "border-box",
        gap: 12,
      }}
    >
      {cards.map((card, index) => (
        <div
          key={card.title}
          style={{
            width: segmentWidth,
            border: "1px solid rgba(243,236,217,0.18)",
            padding: "16px 18px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background:
              index === 1 ? "rgba(243,236,217,0.03)" : "rgba(243,236,217,0.02)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                fontFamily: MONO_FONT,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "#f3ecd9",
                textTransform: "uppercase",
              }}
            >
              {card.title}
            </div>
            <div
              style={{
                fontFamily: SERIF_FONT,
                fontSize: 28,
                fontWeight: 700,
                color: "#f7f1e4",
              }}
            >
              {card.note}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                height: 12,
                borderRadius: 999,
                border: "2px solid rgba(243,236,217,0.28)",
                overflow: "hidden",
                background: "rgba(243,236,217,0.08)",
              }}
            >
              <div
                style={{
                  width: `${Math.max(4, card.value * 100)}%`,
                  height: "100%",
                  background: card.color,
                }}
              />
            </div>
            <div
              style={{
                fontFamily: MONO_FONT,
                fontSize: 12,
                color: "rgba(243,236,217,0.7)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              frame {String(frame).padStart(3, "0")}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const AETipBubblePopSilhouetteBurst: React.FC = () => {
  const frame = useCurrentFrame();
  const titleYOffset = interpolate(frame, [0, 32], [-14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: config.colors.paper }}>
      <PaperTexture />
      <FrameMarks />

      <div
        style={{
          position: "absolute",
          left: config.pagePaddingX,
          top: 64 + titleYOffset,
          opacity: titleOpacity,
          display: "flex",
          justifyContent: "space-between",
          width: config.width - config.pagePaddingX * 2,
          alignItems: "flex-start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              fontFamily: MONO_FONT,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: config.colors.ink,
            }}
          >
            After Effects Tip Reconstruction
          </div>
          <div
            style={{
              fontFamily: SERIF_FONT,
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 0.94,
              color: config.colors.ink,
            }}
          >
            Bubble membrane
            <br />
            burst study
          </div>
        </div>

        <div
          style={{
            marginTop: 8,
            fontFamily: MONO_FONT,
            fontSize: 13,
            lineHeight: 1.6,
            textAlign: "right",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: config.colors.mutedInk,
          }}
        >
          off-white paper
          <br />
          halftone + grain + dust + print dirt
          <br />
          no clean flat fallback
        </div>
      </div>

      <HeroStage frame={frame} />
      <Sidebar frame={frame} />
      <BottomBand frame={frame} />
    </AbsoluteFill>
  );
};
