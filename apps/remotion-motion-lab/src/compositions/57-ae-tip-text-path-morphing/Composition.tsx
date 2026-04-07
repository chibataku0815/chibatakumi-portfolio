import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { config } from "./config";
import {
  getChannelMorphState,
  getTimelineState,
} from "./lib/morph-letters";

const seeded = (seed: number) => {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453123;
  return value - Math.floor(value);
};

const dustSpeckles = Array.from({ length: config.texture.dustCount }, (_, index) => ({
  left: seeded(index * 4 + 1) * config.width,
  top: seeded(index * 4 + 2) * config.height,
  size: 1 + seeded(index * 4 + 3) * 3.2,
  opacity: 0.04 + seeded(index * 4 + 4) * 0.16,
}));

const dirtMarks = Array.from({ length: config.texture.dirtCount }, (_, index) => ({
  left: 34 + seeded(index * 5 + 1) * (config.width - 68),
  top: 34 + seeded(index * 5 + 2) * (config.height - 68),
  width: 120 + seeded(index * 5 + 3) * 240,
  height: 14 + seeded(index * 5 + 4) * 38,
  rotation: -18 + seeded(index * 5 + 5) * 36,
  opacity: 0.03 + seeded(index * 5 + 6) * 0.06,
}));

const accentObjects = [
  { x: 178, y: 202, width: 188, height: 112, rotation: -10, color: config.colors.accentYellow },
  { x: 1124, y: 216, width: 250, height: 150, rotation: 12, color: config.colors.accentBlue },
  { x: 320, y: 608, width: 198, height: 138, rotation: 8, color: config.colors.accentLilac },
];

const paletteCycle = [
  config.colors.accentBlue,
  config.colors.accentYellow,
  config.colors.accentLilac,
  config.colors.accentBlue,
  config.colors.accentYellow,
  config.colors.accentLilac,
];

const sideLabelStyle: React.CSSProperties = {
  fontFamily: '"Courier New", monospace',
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: config.colors.mutedInk,
};

const bodyStyle: React.CSSProperties = {
  fontFamily: 'Inter, "Helvetica Neue", Arial, sans-serif',
  fontSize: 16,
  lineHeight: 1.45,
  color: config.colors.mutedInk,
};

const serifTitleStyle: React.CSSProperties = {
  fontFamily: '"Iowan Old Style", Georgia, serif',
  fontWeight: 700,
  letterSpacing: "-0.03em",
  color: config.colors.ink,
};

const fourPointStarPath =
  "M 0 -24 L 7 -7 L 24 0 L 7 7 L 0 24 L -7 7 L -24 0 L -7 -7 Z";

const PaperTexture: React.FC<{ frame: number }> = ({ frame }) => {
  const halftoneShift = Math.sin(frame / 72) * 8;
  const grainShift = Math.sin(frame / 80) * 14;

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(circle at 18% 22%, rgba(255,255,255,0.44), transparent 24%),
            radial-gradient(circle at 82% 18%, rgba(255,255,255,0.2), transparent 21%),
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
            radial-gradient(circle at 20% 16%, rgba(21,18,15,0.12) 0 1px, transparent 1px),
            radial-gradient(circle at 80% 32%, rgba(21,18,15,0.09) 0 1px, transparent 1px),
            radial-gradient(circle at 42% 72%, rgba(255,255,255,0.24) 0 1px, transparent 1px)
          `,
          backgroundSize: "22px 22px, 31px 31px, 17px 17px",
          transform: `translate(${grainShift}px, ${-grainShift * 0.35}px)`,
          mixBlendMode: "multiply",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 1026 + halftoneShift,
          top: 140,
          width: 420,
          height: 320,
          borderRadius: "42% 58% 46% 54%",
          opacity: config.texture.halftoneOpacity,
          backgroundImage:
            "radial-gradient(circle, rgba(21,18,15,0.82) 0 30%, transparent 32%)",
          backgroundSize: `${config.texture.halftoneDotSize}px ${config.texture.halftoneDotSize}px`,
          mixBlendMode: "multiply",
          transform: "rotate(-8deg)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 108,
          top: 660 - halftoneShift * 0.5,
          width: 340,
          height: 212,
          borderRadius: "56% 44% 48% 52%",
          opacity: config.texture.halftoneOpacity * 0.74,
          backgroundImage:
            "radial-gradient(circle, rgba(21,18,15,0.78) 0 28%, transparent 30%)",
          backgroundSize: `${config.texture.halftoneDotSize - 2}px ${
            config.texture.halftoneDotSize - 2
          }px`,
          mixBlendMode: "multiply",
          transform: "rotate(12deg)",
        }}
      />

      {dustSpeckles.map((speckle, index) => (
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

      {dirtMarks.map((mark, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            left: mark.left,
            top: mark.top,
            width: mark.width,
            height: mark.height,
            opacity: mark.opacity,
            background:
              "linear-gradient(90deg, rgba(21,18,15,0), rgba(21,18,15,1), rgba(21,18,15,0))",
            transform: `rotate(${mark.rotation}deg)`,
            filter: "blur(6px)",
          }}
        />
      ))}
    </>
  );
};

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
          inset: config.frameInset + 14,
          border: `1px solid ${config.colors.lineInk}`,
          pointerEvents: "none",
        }}
      />
    </>
  );
};

const CurrentWordStrip: React.FC<{ frame: number }> = ({ frame }) => {
  const timeline = getTimelineState(frame);
  const active = timeline.activeWord;

  return (
    <div
      style={{
        position: "absolute",
        left: config.footer.x,
        top: config.footer.y,
        width: config.footer.width,
        height: config.footer.height,
        borderTop: `4px solid ${config.colors.ink}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 28,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 420 }}>
        <div style={sideLabelStyle}>Morph Sequence</div>
        <div style={{ ...serifTitleStyle, fontSize: 54 }}>Path-to-path contour swap</div>
        <div style={bodyStyle}>
          Missing slots do not crossfade out. They route through support geometry,
          then grow into the next glyph.
        </div>
      </div>

      <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
        {config.words.map((word, index) => (
          <div
            key={word}
            style={{
              minWidth: 238,
              padding: "18px 22px",
              border: `3px solid ${config.colors.ink}`,
              background:
                active === word ? paletteCycle[index * 2] : config.colors.panelPaper,
              color: config.colors.ink,
              boxShadow:
                active === word
                  ? `${config.style.shadowOffsetX}px ${config.style.shadowOffsetY}px 0 ${config.colors.ink}`
                  : "none",
            }}
          >
            <div style={sideLabelStyle}>{index === 0 ? "start" : index === 1 ? "bridge" : "end"}</div>
            <div style={{ ...serifTitleStyle, fontSize: 50, marginTop: 4 }}>{word}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Sidebar: React.FC = () => {
  return (
    <div
      style={{
        position: "absolute",
        left: config.sidebar.x,
        top: config.sidebar.y,
        width: config.sidebar.width,
        height: config.sidebar.height,
        padding: "12px 0 0",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <div style={sideLabelStyle}>{config.label}</div>
      <div style={{ ...serifTitleStyle, fontSize: 62, lineHeight: 0.92 }}>
        Morphing
        <br />
        type as
        <br />
        poster object
      </div>

      <div style={bodyStyle}>
        Copy-paste path animation in AE becomes interpolated contour channels in
        Remotion. The word changes shape without hiding behind blur or opacity
        dissolve.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={sideLabelStyle}>Texture Stack</div>
        <div style={bodyStyle}>halftone dot field</div>
        <div style={bodyStyle}>paper grain + dust speckles</div>
        <div style={bodyStyle}>print dirt + roughened edges</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={sideLabelStyle}>Anti-Patterns</div>
        <div style={bodyStyle}>no blur dissolve</div>
        <div style={bodyStyle}>no clean flat vector-only finish</div>
        <div style={bodyStyle}>no glossy UI card language</div>
      </div>

      <svg width="292" height="188" viewBox="0 0 292 188">
        <path
          d="M 24 148 Q 72 42 146 42 Q 220 42 268 148"
          fill="none"
          stroke={config.colors.ink}
          strokeWidth="6"
        />
        <path
          d="M 28 148 H 264"
          fill="none"
          stroke={config.colors.ink}
          strokeWidth="6"
        />
        <circle
          cx="216"
          cy="82"
          r="34"
          fill={config.colors.accentYellow}
          stroke={config.colors.ink}
          strokeWidth="6"
        />
        <path
          d={fourPointStarPath}
          transform="translate(60 52) rotate(12)"
          fill={config.colors.accentLilac}
          stroke={config.colors.ink}
          strokeWidth="4"
        />
      </svg>
    </div>
  );
};

const HeroMorph: React.FC<{ frame: number }> = ({ frame }) => {
  const entryOpacity = interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const entryY = interpolate(frame, [0, 16], [32, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const registrationX = Math.sin(frame / 24) * 2.5;
  const registrationY = Math.cos(frame / 27) * 2;
  const jitterRotate = Math.sin(frame / 44) * 1.6;

  return (
    <svg
      width={config.hero.width}
      height={config.hero.height}
      viewBox={`0 0 ${config.hero.width} ${config.hero.height}`}
      style={{
        position: "absolute",
        left: config.hero.x,
        top: config.hero.y,
        overflow: "visible",
        opacity: entryOpacity,
        transform: `translateY(${entryY}px)`,
      }}
    >
      <defs>
        <pattern
          id="hero-halftone"
          width={config.texture.halftoneDotSize}
          height={config.texture.halftoneDotSize}
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx={config.texture.halftoneDotSize / 2}
            cy={config.texture.halftoneDotSize / 2}
            r={config.texture.halftoneDotSize * 0.18}
            fill="rgba(21,18,15,0.82)"
          />
        </pattern>
        <filter id="rough-print" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.03"
            numOctaves="2"
            seed="7"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="4"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>

      {accentObjects.map((shape, index) => (
        <g
          key={index}
          transform={`translate(${shape.x} ${shape.y}) rotate(${shape.rotation + Math.sin(frame / 30 + index) * 2})`}
          opacity={0.9}
        >
          <rect
            x={-shape.width / 2}
            y={-shape.height / 2}
            width={shape.width}
            height={shape.height}
            rx={index === 0 ? 44 : 18}
            fill={shape.color}
            stroke={config.colors.ink}
            strokeWidth="6"
          />
        </g>
      ))}

      <path
        d="M 114 514 Q 284 446 500 474 Q 676 498 874 448 Q 1054 402 1184 470"
        fill="none"
        stroke={config.colors.ink}
        strokeWidth="6"
        strokeDasharray="10 16"
        opacity="0.22"
      />

      {Array.from({ length: config.stage.channelCount }, (_, channelIndex) => {
        const channel = getChannelMorphState(frame, channelIndex);
        const fill = paletteCycle[channelIndex];
        const clipId = `glyph-clip-${channelIndex}`;
        const baseY = config.hero.centerY + Math.sin(frame / 36 + channelIndex * 0.75) * 8;
        const rotate = Math.sin(frame / 30 + channelIndex * 0.4) * 2.4;

        return (
          <g
            key={channel.key}
            transform={`translate(${config.hero.width / 2 + channel.x} ${baseY}) rotate(${rotate + jitterRotate}) scale(${channel.scale})`}
            opacity={channel.opacity}
          >
            <path
              d={channel.path}
              fill="none"
              stroke={paletteCycle[(channelIndex + 1) % paletteCycle.length]}
              strokeWidth={config.style.outlineWidth * 0.85}
              transform={`translate(${registrationX} ${registrationY})`}
              opacity="0.46"
            />
            <path
              d={channel.path}
              fill={fill}
              stroke={config.colors.ink}
              strokeWidth={config.style.outlineWidth}
              filter="url(#rough-print)"
            />
            <clipPath id={clipId}>
              <path d={channel.path} />
            </clipPath>
            <rect
              x={-140}
              y={-120}
              width="280"
              height="240"
              clipPath={`url(#${clipId})`}
              fill="url(#hero-halftone)"
              opacity="0.28"
              transform={`rotate(${12 - channelIndex * 4})`}
            />
            <path
              d={channel.path}
              fill="none"
              stroke={config.colors.accentSoft}
              strokeWidth={config.style.innerStrokeWidth}
              opacity="0.42"
            />
          </g>
        );
      })}

      {Array.from({ length: config.stage.channelCount }, (_, index) => {
        const x = (config.hero.width / 2) + (-550 + (1100 / (config.stage.channelCount - 1)) * index);
        return (
          <g key={`guide-${index}`} opacity="0.34">
            <line
              x1={x}
              x2={x}
              y1={config.hero.centerY + 120}
              y2={config.hero.centerY + 120 + config.style.slotGuideHeight}
              stroke={config.colors.ink}
              strokeWidth="2"
              strokeDasharray="8 12"
            />
            <circle
              cx={x}
              cy={config.hero.centerY + 120 + config.style.slotGuideHeight}
              r="7"
              fill={paletteCycle[index]}
              stroke={config.colors.ink}
              strokeWidth="3"
            />
          </g>
        );
      })}

      <path
        d={fourPointStarPath}
        transform={`translate(166 140) rotate(${frame * 0.42})`}
        fill={config.colors.accentLilac}
        stroke={config.colors.ink}
        strokeWidth="4"
      />
      <path
        d={fourPointStarPath}
        transform={`translate(1196 128) rotate(${-frame * 0.35}) scale(1.18)`}
        fill={config.colors.accentYellow}
        stroke={config.colors.ink}
        strokeWidth="4"
      />
      <ellipse
        cx="1162"
        cy="510"
        rx="132"
        ry="74"
        fill="none"
        stroke={config.colors.ink}
        strokeWidth="5"
      />
    </svg>
  );
};

export const AETipTextPathMorphing: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: config.colors.paper, color: config.colors.ink }}>
      <PaperTexture frame={frame} />
      <FrameMarks />

      <div
        style={{
          position: "absolute",
          left: 120,
          top: 78,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          width: 1320,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={sideLabelStyle}>{config.label}</div>
          <div style={{ ...serifTitleStyle, fontSize: 96, lineHeight: 0.92 }}>
            Text paths melt
            <br />
            into new words
          </div>
        </div>

        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={sideLabelStyle}>Source</div>
          <div style={bodyStyle}>{"BIG -> MEDIUM -> SMALL"}</div>
          <div style={bodyStyle}>path interpolation, not opacity dissolve</div>
        </div>
      </div>

      <HeroMorph frame={frame} />
      <Sidebar />
      <CurrentWordStrip frame={frame} />
    </AbsoluteFill>
  );
};
