import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AETipFlowingNeonSushi } from "./Composition";
import { AETipFlowingNeonWave } from "./WaveComposition";
import { flowingNeonCaseStudyConfig as config } from "./case-study-config";

const titleFont = '"Futura", "Avenir Next", "Helvetica Neue", sans-serif';
const metaFont = '"IBM Plex Mono", "SFMono-Regular", monospace';

const clampProgress = (value: number) => Math.max(0, Math.min(1, value));

const PanelShell: React.FC<{
  title: string;
  subtitle: string;
  frame: number;
  children: React.ReactNode;
}> = ({ title, subtitle, frame, children }) => {
  const reveal = spring({
    frame,
    fps: config.fps,
    config: {
      damping: 16,
      stiffness: 120,
      mass: 0.9,
    },
  });
  const translateY = interpolate(reveal, [0, 1], [46, 0]);
  const scale = interpolate(reveal, [0, 1], [0.965, 1]);

  return (
    <div
      style={{
        position: "relative",
        flex: 1,
        borderRadius: 34,
        overflow: "hidden",
        border: `1px solid ${config.colors.panelBorder}`,
        background: config.colors.panelFill,
        boxShadow:
          "0 28px 90px rgba(2,6,23,0.42), inset 0 1px 0 rgba(255,255,255,0.08)",
        transform: `translateY(${translateY}px) scale(${scale})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.06), transparent 18%)",
          pointerEvents: "none",
          zIndex: 3,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 26,
          zIndex: 4,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div
          style={{
            color: config.colors.text,
            fontFamily: titleFont,
            fontWeight: 700,
            fontSize: 28,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>
        <div
          style={{
            color: config.colors.textMuted,
            fontFamily: metaFont,
            fontSize: 15,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {subtitle}
        </div>
      </div>
      {children}
    </div>
  );
};

const MetaChip: React.FC<{ label: string }> = ({ label }) => {
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 999,
        border: `1px solid ${config.colors.panelBorder}`,
        background: config.colors.accentSoft,
        color: config.colors.text,
        fontFamily: metaFont,
        fontSize: 14,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
  );
};

const IntroCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleReveal = spring({
    frame,
    fps,
    config: {
      damping: 18,
      stiffness: 110,
      mass: 0.95,
    },
  });
  const bodyReveal = spring({
    frame: frame - 8,
    fps,
    config: {
      damping: 18,
      stiffness: 100,
      mass: 1,
    },
  });

  return (
    <AbsoluteFill
      style={{
        padding: "110px 120px",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          maxWidth: 980,
          transform: `translateY(${interpolate(titleReveal, [0, 1], [32, 0])}px)`,
          opacity: titleReveal,
        }}
      >
        <div
          style={{
            color: config.colors.accent,
            fontFamily: metaFont,
            fontSize: 18,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
          }}
        >
          Motion Graphics Case Study
        </div>
        <div
          style={{
            color: config.colors.text,
            fontFamily: titleFont,
            fontWeight: 700,
            fontSize: 82,
            lineHeight: 1,
            letterSpacing: "-0.03em",
          }}
        >
          After Effects Flowing Neon
          <br />
          recreated and generalized in Remotion
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          maxWidth: 860,
          transform: `translateY(${interpolate(bodyReveal, [0, 1], [24, 0])}px)`,
          opacity: bodyReveal,
        }}
      >
        <div
          style={{
            color: config.colors.textMuted,
            fontFamily: titleFont,
            fontSize: 28,
            lineHeight: 1.45,
          }}
        >
          One original AE-tip recreation, then a second SVG-driven pass using the
          same parser, motion builder, and neon renderer.
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <MetaChip label="Trim Window" />
          <MetaChip label="Loop Offset" />
          <MetaChip label="SVG Parsing" />
          <MetaChip label="Paint Matching" />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SingleShowcase: React.FC<{
  title: string;
  subtitle: string;
  frame: number;
  component: React.ReactNode;
}> = ({ title, subtitle, frame, component }) => {
  return (
    <AbsoluteFill style={{ padding: "72px 76px 84px" }}>
      <PanelShell title={title} subtitle={subtitle} frame={frame}>
        {component}
      </PanelShell>
    </AbsoluteFill>
  );
};

const CompareShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const splitReveal = clampProgress(frame / 18);
  const lineScale = interpolate(splitReveal, [0, 1], [0.2, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ padding: "72px 76px 84px", gap: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          padding: "0 6px",
        }}
      >
        <div
          style={{
            color: config.colors.text,
            fontFamily: titleFont,
            fontWeight: 700,
            fontSize: 48,
            letterSpacing: "-0.02em",
          }}
        >
          Same motion engine, second SVG input
        </div>
        <div
          style={{
            color: config.colors.textMuted,
            fontFamily: metaFont,
            fontSize: 16,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          id selector vs paint selector
        </div>
      </div>

      <div style={{ position: "relative", display: "flex", gap: 24, flex: 1 }}>
        <PanelShell
          title="Sushi Hero"
          subtitle="id prefix mapping"
          frame={frame}
        >
          <AETipFlowingNeonSushi />
        </PanelShell>
        <PanelShell
          title="Wave Demo"
          subtitle="fill-color mapping"
          frame={frame - 4}
        >
          <AETipFlowingNeonWave />
        </PanelShell>

        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 38,
            bottom: 38,
            width: 1,
            background:
              "linear-gradient(180deg, transparent, rgba(255,255,255,0.45), transparent)",
            transform: `translateX(-0.5px) scaleY(${lineScale})`,
            transformOrigin: "center",
            pointerEvents: "none",
            zIndex: 5,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export const AETipFlowingNeonCaseStudy: React.FC = () => {
  const frame = useCurrentFrame();
  const introStart = 0;
  const sushiStart = introStart + config.sections.intro;
  const compareStart = sushiStart + config.sections.sushi;
  const waveStart = compareStart + config.sections.compare;

  const backgroundDrift = interpolate(frame, [0, config.totalFrames], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        background: `
          radial-gradient(circle at ${30 + backgroundDrift * 16}% ${22 + backgroundDrift * 12}%, rgba(103,132,255,0.2), transparent 28%),
          radial-gradient(circle at ${74 - backgroundDrift * 8}% ${68 - backgroundDrift * 10}%, rgba(159,184,255,0.14), transparent 32%),
          linear-gradient(135deg, ${config.colors.backgroundLift}, ${config.colors.background})
        `,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(circle at center, black 50%, transparent 100%)",
          opacity: 0.22,
        }}
      />

      <Sequence from={introStart} durationInFrames={config.sections.intro}>
        <IntroCard />
      </Sequence>

      <Sequence from={sushiStart} durationInFrames={config.sections.sushi}>
        <SingleShowcase
          title="Original Recreation"
          subtitle="AE-style neon sign rebuilt from SVG layers"
          frame={frame - sushiStart}
          component={<AETipFlowingNeonSushi />}
        />
      </Sequence>

      <Sequence from={compareStart} durationInFrames={config.sections.compare}>
        <CompareShowcase />
      </Sequence>

      <Sequence from={waveStart} durationInFrames={config.sections.wave}>
        <SingleShowcase
          title="Generalized Pass"
          subtitle="same renderer, second real SVG, paint-based grouping"
          frame={frame - waveStart}
          component={<AETipFlowingNeonWave />}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
