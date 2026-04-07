import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { config } from "./config";
import {
  getEchoTrainState,
  getGuidePath,
  getTemporalEchoSamples,
  type MotionVariant,
  type Point,
  type TemporalEchoSample,
} from "./lib/echo-text-motion";

const seeded = (seed: number) => {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453123;
  return value - Math.floor(value);
};

const speckles = Array.from({ length: config.texture.speckleCount }, (_, index) => ({
  left: seeded(index * 3 + 1) * config.width,
  top: seeded(index * 3 + 2) * config.height,
  size: 1 + seeded(index * 3 + 3) * 3.5,
  opacity: 0.05 + seeded(index * 3 + 4) * 0.16,
}));

const starMarks = [
  { left: 140, top: 116, size: 28, rotation: 12 },
  { left: 1464, top: 128, size: 34, rotation: -10 },
  { left: 1318, top: 712, size: 26, rotation: 16 },
];

const paletteCycle = [
  config.colors.accentBlue,
  config.colors.accentLilac,
  config.colors.accentYellow,
];

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const mix = (start: number, end: number, progress: number) =>
  start + (end - start) * progress;

const estimateWordWidth = (text: string, fontSize: number, letterSpacingEm: number) => {
  const glyphWidth = fontSize * 0.96 * text.length;
  const trackingWidth = fontSize * letterSpacingEm * Math.max(0, text.length - 1);
  return glyphWidth + trackingWidth;
};

const pointToPath = (points: Point[]) =>
  points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");

const panelLabelStyle: React.CSSProperties = {
  fontFamily: '"Courier New", monospace',
  fontSize: 14,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

const wordStyle = (
  fontSize: number,
  letterSpacingEm: number,
): React.CSSProperties => ({
  position: "absolute",
  left: 0,
  top: 0,
  fontFamily: config.typography.fontFamily,
  fontSize,
  fontWeight: config.typography.fontWeight,
  letterSpacing: `${letterSpacingEm}em`,
  lineHeight: 0.85,
  whiteSpace: "nowrap",
  textTransform: "uppercase",
  transformOrigin: "50% 50%",
});

const FrameMarks: React.FC = () => {
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: config.frameInset,
          border: `4px solid ${config.colors.ink}`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: config.frameInset + 12,
          right: config.frameInset + 12,
          top: config.frameInset + 12,
          bottom: config.frameInset + 12,
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
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(circle at 18% 24%, rgba(255,255,255,0.45), transparent 26%),
            radial-gradient(circle at 78% 18%, rgba(255,255,255,0.2), transparent 24%),
            linear-gradient(140deg, ${config.colors.paper} 0%, ${config.colors.paperShade} 100%)
          `,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: config.texture.paperNoiseOpacity,
          backgroundImage: `
            radial-gradient(circle at 22% 20%, rgba(21,17,15,0.12) 0 1px, transparent 1px),
            radial-gradient(circle at 80% 26%, rgba(21,17,15,0.08) 0 1px, transparent 1px),
            radial-gradient(circle at 38% 72%, rgba(255,255,255,0.22) 0 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px, 31px 31px, 17px 17px",
          mixBlendMode: "multiply",
        }}
      />

      <div
        style={{
          position: "absolute",
          right: 150,
          top: 74,
          width: 350,
          height: 262,
          opacity: config.texture.halftoneOpacity,
          backgroundImage:
            "radial-gradient(circle, rgba(21,17,15,0.76) 0 28%, transparent 30%)",
          backgroundSize: `${config.texture.halftoneDotSize}px ${config.texture.halftoneDotSize}px`,
          borderRadius: "42% 58% 42% 58%",
          transform: "rotate(-8deg)",
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

const StarMark: React.FC<{
  left: number;
  top: number;
  size: number;
  rotation: number;
}> = ({ left, top, size, rotation }) => {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: size,
        height: size,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          width: 2,
          height: size,
          background: config.colors.ink,
          transform: "translateX(-50%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "50%",
          width: size,
          height: 2,
          background: config.colors.ink,
          transform: "translateY(-50%)",
        }}
      />
    </div>
  );
};

const EchoGlyph: React.FC<{
  sample: TemporalEchoSample;
  stageWidth: number;
  stageHeight: number;
  fontSize: number;
  letterSpacingEm: number;
  variant: MotionVariant;
  emphasizeCurrent?: boolean;
  safePaddingLeft?: number;
  safePaddingRight?: number;
  safePaddingTop?: number;
  safePaddingBottom?: number;
}> = ({
  sample,
  stageWidth,
  stageHeight,
  fontSize,
  letterSpacingEm,
  variant,
  emphasizeCurrent = false,
  safePaddingLeft = 48,
  safePaddingRight = 48,
  safePaddingTop = 20,
  safePaddingBottom = 20,
}) => {
  const state = getEchoTrainState({
    frame: sample.sampleFrame,
    stageWidth,
    stageHeight,
    startFrame: config.motion.startFrame,
    durationFrames: config.motion.durationFrames,
    depthStart: config.motion.depthStart,
    depthEnd: config.motion.depthEnd,
    perspective: config.motion.perspective,
    waveAmplitude: config.motion.waveAmplitude,
    waveFrequency: config.motion.waveFrequency,
    lateralWobble: config.motion.lateralWobble,
    variant,
  });
  const isCurrent = sample.age === 0;
  const depthOpacity = mix(0.38, 1.02, state.motionProgress);
  const opacity = isCurrent
    ? 1
    : clamp(0.18 + sample.opacity * depthOpacity * 0.82, 0, 0.94);
  const estimatedWidth = estimateWordWidth(
    config.titleWord,
    fontSize,
    letterSpacingEm,
  );
  const estimatedHeight = fontSize * 0.9;
  const fittedX = clamp(
    state.x,
    estimatedWidth * state.scale * 0.5 + safePaddingLeft,
    stageWidth - estimatedWidth * state.scale * 0.5 - safePaddingRight,
  );
  const fittedY = clamp(
    state.y,
    estimatedHeight * state.scale * 0.5 + safePaddingTop,
    stageHeight - estimatedHeight * state.scale * 0.5 - safePaddingBottom,
  );
  const fillColor = isCurrent
    ? config.colors.accentYellow
    : paletteCycle[sample.age % paletteCycle.length];
  const underprintOpacity = isCurrent ? 0.18 : 0.14 + sample.opacity * 0.12;
  const outlineWidth = Math.max(
    1.5,
    config.typography.outlineWidth * (isCurrent ? 1 : 0.8),
  );
  const transform = `
    translate(${fittedX}px, ${fittedY}px)
    translate(-50%, -50%)
    scale(${state.scale})
    rotate(${state.rotateZ}deg)
    skewY(${state.skewY}deg)
  `;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transform,
        transformOrigin: "50% 50%",
        opacity,
        zIndex: 100 - sample.age,
      }}
    >
      <span
        style={{
          ...wordStyle(fontSize, letterSpacingEm),
          color: config.colors.ink,
          opacity: underprintOpacity,
          transform: "translate(12px, 10px)",
        }}
      >
        {config.titleWord}
      </span>
      <span
        style={{
          ...wordStyle(fontSize, letterSpacingEm),
          color: fillColor,
          WebkitTextStroke: `${outlineWidth}px ${config.colors.ink}`,
          textShadow: emphasizeCurrent && isCurrent
            ? "2px 2px 0 rgba(243,236,217,0.55)"
            : "none",
        }}
      >
        {config.titleWord}
      </span>
    </div>
  );
};

const EchoTrainStage: React.FC<{
  frame: number;
  width: number;
  height: number;
  variant: MotionVariant;
  fontSize: number;
  letterSpacingEm: number;
  sampleCount?: number;
  emphasizeCurrent?: boolean;
  safePaddingLeft?: number;
  safePaddingRight?: number;
  safePaddingTop?: number;
  safePaddingBottom?: number;
}> = ({
  frame,
  width,
  height,
  variant,
  fontSize,
  letterSpacingEm,
  sampleCount = config.motion.echoCount,
  emphasizeCurrent = false,
  safePaddingLeft = 48,
  safePaddingRight = 48,
  safePaddingTop = 20,
  safePaddingBottom = 20,
}) => {
  const samples = getTemporalEchoSamples({
    frame,
    echoCount: sampleCount,
    echoStepFrames: config.motion.echoStepFrames,
    decay: config.motion.echoDecay,
  });
  const current = getEchoTrainState({
    frame,
    stageWidth: width,
    stageHeight: height,
    startFrame: config.motion.startFrame,
    durationFrames: config.motion.durationFrames,
    depthStart: config.motion.depthStart,
    depthEnd: config.motion.depthEnd,
    perspective: config.motion.perspective,
    waveAmplitude: config.motion.waveAmplitude,
    waveFrequency: config.motion.waveFrequency,
    lateralWobble: config.motion.lateralWobble,
    variant,
  });
  const guidePoints = getGuidePath(
    {
      stageWidth: width,
      stageHeight: height,
      startFrame: config.motion.startFrame,
      durationFrames: config.motion.durationFrames,
      depthStart: config.motion.depthStart,
      depthEnd: config.motion.depthEnd,
      perspective: config.motion.perspective,
      waveAmplitude: config.motion.waveAmplitude,
      waveFrequency: config.motion.waveFrequency,
      lateralWobble: config.motion.lateralWobble,
      variant,
    },
    24,
  );
  const guidePath = pointToPath(guidePoints);
  const orbitRadius = config.ornaments.orbitRadius * current.scale;

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        overflow: "hidden",
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0 }}
      >
        <path
          d={guidePath}
          fill="none"
          stroke="rgba(21,17,15,0.22)"
          strokeWidth={2}
          strokeDasharray="10 12"
        />
        {guidePoints.filter((_, index) => index % 4 === 0).map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={2.5}
            fill="rgba(21,17,15,0.18)"
          />
        ))}
        <circle
          cx={current.x}
          cy={current.y}
          r={orbitRadius}
          fill="none"
          stroke={config.colors.ink}
          strokeWidth={config.ornaments.orbitStrokeWidth}
          opacity={0.12}
        />
        <circle
          cx={current.x}
          cy={current.y}
          r={orbitRadius * 0.76}
          fill="none"
          stroke={config.colors.accentBlue}
          strokeWidth={2}
          strokeDasharray="18 16"
          opacity={0.34}
        />
      </svg>

      {samples.map((sample) => (
        <EchoGlyph
          key={sample.age}
          sample={sample}
          stageWidth={width}
          stageHeight={height}
          fontSize={fontSize}
          letterSpacingEm={letterSpacingEm}
          variant={variant}
          emphasizeCurrent={emphasizeCurrent}
          safePaddingLeft={safePaddingLeft}
          safePaddingRight={safePaddingRight}
          safePaddingTop={safePaddingTop}
          safePaddingBottom={safePaddingBottom}
        />
      ))}
    </div>
  );
};

const ComparisonTile: React.FC<{
  title: string;
  subtitle: string;
  frame: number;
  variant: MotionVariant;
  left: number;
}> = ({ title, subtitle, frame, variant, left }) => {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: config.comparison.y,
        width: config.comparison.width,
        height: config.comparison.height,
        background: config.colors.paper,
        border: `3px solid ${config.colors.ink}`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 14,
          right: 14,
          top: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <div style={{ ...panelLabelStyle, color: config.colors.ink }}>{title}</div>
        <div
          style={{
            ...panelLabelStyle,
            color: config.colors.sideInk,
            fontSize: 11,
          }}
        >
          {subtitle}
        </div>
      </div>

      <div style={{ position: "absolute", left: 10, top: 34 }}>
        <EchoTrainStage
          frame={frame}
          width={config.comparison.width - 20}
          height={config.comparison.height - 44}
          variant={variant}
          fontSize={config.typography.comparisonFontSize}
          letterSpacingEm={0.16}
          sampleCount={7}
        />
      </div>
    </div>
  );
};

export const AETipEchoTextTrain: React.FC = () => {
  const frame = useCurrentFrame();
  const heroCurrent = getEchoTrainState({
    frame,
    stageWidth: config.heroStage.width,
    stageHeight: config.heroStage.height,
    startFrame: config.motion.startFrame,
    durationFrames: config.motion.durationFrames,
    depthStart: config.motion.depthStart,
    depthEnd: config.motion.depthEnd,
    perspective: config.motion.perspective,
    waveAmplitude: config.motion.waveAmplitude,
    waveFrequency: config.motion.waveFrequency,
    lateralWobble: config.motion.lateralWobble,
    variant: "curved",
  });
  const compareLeftA = config.comparison.x;
  const compareLeftB = compareLeftA + config.comparison.width + config.comparison.gap;

  return (
    <AbsoluteFill style={{ background: config.colors.paper, color: config.colors.ink }}>
      <PaperTexture />
      <FrameMarks />

      <div
        style={{
          position: "absolute",
          right: 124,
          top: 92,
          width: 280,
          height: 280,
          borderRadius: "0 160px 0 160px",
          background: config.colors.accentYellow,
          border: `4px solid ${config.colors.ink}`,
          transform: "rotate(6deg)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 70,
          bottom: config.bottomBand.height - 8,
          width: config.ornaments.capsuleWidth,
          height: config.ornaments.capsuleHeight,
          borderRadius: config.ornaments.capsuleHeight,
          background: config.colors.accentBlue,
          border: `4px solid ${config.colors.ink}`,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 136,
          top: 90,
          width: 208,
          height: 116,
          borderRadius: "116px 116px 0 0",
          background: config.colors.accentLilac,
          border: `4px solid ${config.colors.ink}`,
        }}
      />

      {starMarks.map((star, index) => (
        <StarMark key={index} {...star} />
      ))}

      <div
        style={{
          position: "absolute",
          left: config.pagePaddingX,
          top: 92,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div style={{ ...panelLabelStyle, color: config.colors.ink }}>
          {config.label}
        </div>
        <div
          style={{
            fontFamily: config.typography.fontFamily,
            fontSize: 106,
            lineHeight: 0.86,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            maxWidth: 700,
          }}
        >
          Echo Text
          <br />
          Train
        </div>
        <div
          style={{
            marginTop: 8,
            maxWidth: 620,
            fontFamily: '"Courier New", monospace',
            fontSize: 18,
            lineHeight: 1.45,
            color: config.colors.mutedInk,
          }}
        >
          One text object moves from `Z 1200` to `-300`; temporal samples trail
          behind it and stay readable as a print-like poster object, not generic
          kinetic type.
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: config.heroStage.x,
          top: config.heroStage.y,
          width: config.heroStage.width,
          height: config.heroStage.height,
        }}
      >
        <EchoTrainStage
          frame={frame}
          width={config.heroStage.width}
          height={config.heroStage.height}
          variant="curved"
          fontSize={config.typography.fontSize}
          letterSpacingEm={config.typography.letterSpacingEm}
          emphasizeCurrent
          safePaddingLeft={config.heroStage.safePaddingLeft}
          safePaddingRight={config.heroStage.safePaddingRight}
          safePaddingTop={config.heroStage.safePaddingTop}
          safePaddingBottom={config.heroStage.safePaddingBottom}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: config.sidebar.x,
          top: config.sidebar.y,
          width: config.sidebar.width,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div
          style={{
            ...panelLabelStyle,
            color: config.colors.ink,
            borderBottom: `2px solid ${config.colors.ink}`,
            paddingBottom: 10,
          }}
        >
          Design Block
        </div>

        {[
          "palette: paper / ink / yellow / lilac / blue",
          "object: text train + orbit + arch + capsule + star",
          "texture: halftone, dust, slight mis-registration",
          "layout: editorial poster with right-side labels",
          "motion: composite-in-front echo on a curved 2.5D path",
        ].map((line) => (
          <div
            key={line}
            style={{
              fontFamily: '"Courier New", monospace',
              fontSize: 15,
              lineHeight: 1.5,
              color: config.colors.mutedInk,
            }}
          >
            {line}
          </div>
        ))}

        <div
          style={{
            marginTop: 8,
            padding: "16px 0",
            borderTop: `1px solid ${config.colors.lightInk}`,
            borderBottom: `1px solid ${config.colors.lightInk}`,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            fontFamily: '"Courier New", monospace',
            fontSize: 13,
            color: config.colors.sideInk,
          }}
        >
          <span>echoCount {config.motion.echoCount}</span>
          <span>step {config.motion.echoStepFrames}f</span>
          <span>decay {config.motion.echoDecay.toFixed(2)}</span>
          <span>z {config.motion.depthStart}/{config.motion.depthEnd}</span>
          <span>curve {config.motion.waveAmplitude}px</span>
          <span>scale {heroCurrent.scale.toFixed(2)}x</span>
        </div>

        <div
          style={{
            fontFamily: config.typography.fontFamily,
            fontSize: 74,
            lineHeight: 0.9,
            fontWeight: 700,
            letterSpacing: "-0.04em",
          }}
        >
          Composite
          <br />
          In Front
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: config.frameInset + 16,
          top: 182,
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          fontFamily: '"Courier New", monospace',
          fontSize: 13,
          letterSpacing: "0.18em",
          color: config.colors.sideInk,
          textTransform: "uppercase",
        }}
      >
        editorial neo-brutalism / controlled poster / no glossy gradients
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: config.bottomBand.height,
          background: config.colors.bandInk,
          borderTop: `2px solid ${config.colors.bandLine}`,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: config.comparison.x,
          top: 862,
          display: "flex",
          alignItems: "baseline",
          gap: 18,
          color: config.colors.paper,
        }}
      >
        <div style={{ ...panelLabelStyle, color: config.colors.accentYellow }}>
          Comparison
        </div>
        <div
          style={{
            fontFamily: '"Courier New", monospace',
            fontSize: 15,
            color: "rgba(243,236,217,0.72)",
          }}
        >
          Curved path keeps the duckling-like follow-through legible.
        </div>
      </div>

      <ComparisonTile
        title="straight path"
        subtitle="naive"
        frame={frame}
        variant="straight"
        left={compareLeftA}
      />
      <ComparisonTile
        title="curved path"
        subtitle="target"
        frame={frame}
        variant="curved"
        left={compareLeftB}
      />

      <div
        style={{
          position: "absolute",
          right: 120,
          top: 900,
          width: 620,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div style={{ ...panelLabelStyle, color: config.colors.accentBlue }}>
          Anti-patterns
        </div>
        <div
          style={{
            fontFamily: '"Courier New", monospace',
            fontSize: 15,
            lineHeight: 1.52,
            color: "rgba(243,236,217,0.72)",
          }}
        >
          No spring spam. No shiny 3D extrusion. No glassmorphism. No generic
          kinetic typography dashboard. Texture stays print-like and the black
          outline does real structural work.
        </div>
      </div>
    </AbsoluteFill>
  );
};
