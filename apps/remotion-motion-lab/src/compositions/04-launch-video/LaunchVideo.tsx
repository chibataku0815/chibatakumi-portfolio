/**
 * #4 Launch Video — Phase 2 R&D
 *
 * Duration: 37s (1110 frames @ 30fps)
 * Resolution: 1080x700 (X/Twitter optimized landscape)
 *
 * Techniques learned:
 * - 8-scene orchestration with Sequence
 * - Particle systems (deterministic, golden-ratio distribution)
 * - Character-by-character typing animation
 * - Spring stagger reveals (cards, chips, stats)
 * - SceneWrapper entry/exit transitions
 * - Converging line animation for logo reveal
 *
 * Launch video cut mapping:
 * - Cut 4, 9 (UI flash): Scene 1 terminal + Scene 4 preset showcase
 * - Cut 8 (preset grid): Scene 3 feature grid + Scene 4 preset showcase
 * - Scene 6 particles -> Cut 6 (texture close-up) grain/halation effect
 */
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  interpolate,
  spring,
} from "remotion";
import { COLORS } from "../../lib/colors";
import { filmtoneFadeIn } from "../../lib/transitions";
import { FONTS } from "../../lib/typography";
import {
  FILMTONE_SPRING,
  FILMTONE_GENTLE,
  FILMTONE_POP,
} from "../../lib/springs";

/* ── Constants ────────────────────────────────────────────────────────── */
const WIDTH = 1080;
const HEIGHT = 700;
const MONO_FONT = "SF Mono, Menlo, monospace";
const GREEN_CHECK = "#4ade80";

/* ── Particle type ────────────────────────────────────────────────────── */
interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  angle: number;
  opacity: number;
  blur: number;
}

/* ── Particle generator (deterministic, golden-ratio distribution) ──── */
function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    x: (i * 137.5) % WIDTH,
    y: (i * 89.3) % HEIGHT,
    size: 2 + (i % 4) * 1.5,
    speed: 0.3 + (i % 5) * 0.12,
    angle: ((i * 47) % 360) * (Math.PI / 180),
    opacity: 0.1 + (i % 3) * 0.1,
    blur: i % 4 === 0 ? 1.5 : 0,
  }));
}

/* ── Particle layer component ─────────────────────────────────────── */
const ParticleLayer: React.FC<{ count: number }> = ({ count }) => {
  const frame = useCurrentFrame();
  const particles = useMemo(() => generateParticles(count), [count]);

  return (
    <>
      {particles.map((p, i) => {
        const px = ((p.x + Math.cos(p.angle) * p.speed * frame) % WIDTH + WIDTH) % WIDTH;
        const py = ((p.y + Math.sin(p.angle) * p.speed * frame) % HEIGHT + HEIGHT) % HEIGHT;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: px,
              top: py,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: COLORS.cream,
              opacity: p.opacity,
              filter: p.blur > 0 ? `blur(${p.blur}px)` : undefined,
            }}
          />
        );
      })}
    </>
  );
};

/* ── SceneWrapper: entry/exit spring transitions ──────────────────── */
const TRANSITION_FRAMES = 12;

const SceneWrapper: React.FC<{
  children: React.ReactNode;
  durationInFrames: number;
}> = ({ children, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entry spring (first 12 frames)
  const entryProgress = spring({
    frame,
    fps,
    config: FILMTONE_SPRING,
    durationInFrames: TRANSITION_FRAMES,
  });

  // Exit spring (last 12 frames)
  const exitFrame = Math.max(0, frame - (durationInFrames - TRANSITION_FRAMES));
  const exitProgress = spring({
    frame: exitFrame,
    fps,
    config: FILMTONE_SPRING,
    durationInFrames: TRANSITION_FRAMES,
  });

  const isExiting = frame >= durationInFrames - TRANSITION_FRAMES;

  const scale = isExiting
    ? interpolate(exitProgress, [0, 1], [1, 0.95])
    : interpolate(entryProgress, [0, 1], [0.95, 1]);

  const opacity = isExiting
    ? interpolate(exitProgress, [0, 1], [1, 0])
    : interpolate(entryProgress, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/* ── Scene 1: Terminal Install (0-4s, 0-119) ─────────────────────── */
const TERMINAL_COMMAND = "$ npx filmtone init";
const TERMINAL_OUTPUTS = [
  { icon: "\u2713", text: "Installing dependencies..." },
  { icon: "\u2713", text: "Configuring presets..." },
  { icon: "\u2713", text: "Ready! Open http://localhost:3000" },
];
const CHAR_INTERVAL = 1.5; // frames per character (~50ms at 30fps)
const TYPING_TOTAL = TERMINAL_COMMAND.length * CHAR_INTERVAL; // ~30 frames = 1s
const OUTPUT_START = TYPING_TOTAL + 15; // pause after typing

const TerminalInstall: React.FC = () => {
  const frame = useCurrentFrame();

  // Characters visible so far
  const charsVisible = Math.min(
    Math.floor(frame / CHAR_INTERVAL),
    TERMINAL_COMMAND.length,
  );
  const displayedText = TERMINAL_COMMAND.slice(0, charsVisible);

  // Blinking cursor
  const showCursor = charsVisible < TERMINAL_COMMAND.length || Math.floor(frame / 15) % 2 === 0;

  return (
    <SceneWrapper durationInFrames={120}>
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Terminal window */}
        <div
          style={{
            width: 720,
            backgroundColor: COLORS.bgSurface,
            border: `1px solid ${COLORS.bgBorder}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {/* Title bar with traffic light dots */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 16px",
              borderBottom: `1px solid ${COLORS.bgBorder}`,
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#ef4444" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#eab308" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#22c55e" }} />
          </div>

          {/* Terminal body */}
          <div style={{ padding: "20px 24px", minHeight: 200 }}>
            {/* Command line */}
            <div
              style={{
                fontFamily: MONO_FONT,
                fontSize: 22,
                color: COLORS.cream,
                lineHeight: 1.6,
              }}
            >
              {displayedText}
              {showCursor && (
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 22,
                    backgroundColor: COLORS.cream,
                    marginLeft: 2,
                    verticalAlign: "text-bottom",
                  }}
                />
              )}
            </div>

            {/* Output lines */}
            {TERMINAL_OUTPUTS.map((line, i) => {
              const lineFrame = OUTPUT_START + i * 12;
              const visible = frame >= lineFrame;
              if (!visible) return null;

              const lineOpacity = filmtoneFadeIn(frame, lineFrame, 30, 0.4);

              return (
                <div
                  key={i}
                  style={{
                    fontFamily: MONO_FONT,
                    fontSize: 20,
                    lineHeight: 1.8,
                    opacity: lineOpacity,
                  }}
                >
                  <span style={{ color: GREEN_CHECK }}>{line.icon} </span>
                  <span style={{ color: COLORS.textMuted }}>{line.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </SceneWrapper>
  );
};

/* ── Scene 2: Hero Title (4-9s, 120-269) ─────────────────────────── */
const PRESET_CHIPS = ["Portra 400", "Cinestill 800T", "Velvia 50", "Tri-X 400"];

const HeroTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Staggered springs: title at 0, tagline at +8, input at +16
  const titleProgress = spring({ frame, fps, config: FILMTONE_GENTLE });
  const taglineProgress = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: FILMTONE_GENTLE,
  });
  const inputProgress = spring({
    frame: Math.max(0, frame - 16),
    fps,
    config: FILMTONE_GENTLE,
  });

  return (
    <SceneWrapper durationInFrames={150}>
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontFamily: FONTS.inter,
            fontSize: 64,
            fontWeight: 700,
            color: COLORS.cream,
            opacity: titleProgress,
            transform: `translateY(${interpolate(titleProgress, [0, 1], [12, 0])}px)`,
          }}
        >
          Filmtone
        </div>

        {/* Tagline */}
        <div
          style={{
            fontFamily: FONTS.inter,
            fontSize: 28,
            fontWeight: 400,
            color: COLORS.textMuted,
            opacity: taglineProgress,
            transform: `translateY(${interpolate(taglineProgress, [0, 1], [8, 0])}px)`,
            marginTop: 12,
          }}
        >
          Film color grading in your browser
        </div>

        {/* Fake search input */}
        <div
          style={{
            width: 480,
            height: 48,
            borderRadius: 24,
            border: `1px solid ${COLORS.bgBorder}`,
            backgroundColor: COLORS.bgSurface,
            opacity: inputProgress,
            transform: `translateY(${interpolate(inputProgress, [0, 1], [8, 0])}px)`,
            marginTop: 28,
            display: "flex",
            alignItems: "center",
            paddingLeft: 20,
          }}
        >
          <span
            style={{
              fontFamily: FONTS.inter,
              fontSize: 18,
              color: COLORS.textSubtle,
            }}
          >
            Describe the look you want...
          </span>
        </div>

        {/* Preset chips */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 20,
          }}
        >
          {PRESET_CHIPS.map((chip, i) => {
            const chipDelay = 20 + i * 3; // start after input, 3-frame stagger
            const chipProgress = spring({
              frame: Math.max(0, frame - chipDelay),
              fps,
              config: FILMTONE_SPRING,
            });
            return (
              <div
                key={chip}
                style={{
                  fontFamily: FONTS.inter,
                  fontSize: 15,
                  color: COLORS.textMuted,
                  backgroundColor: COLORS.bgSurface,
                  border: `1px solid ${COLORS.bgBorder}`,
                  borderRadius: 16,
                  padding: "6px 14px",
                  opacity: chipProgress,
                  transform: `scale(${interpolate(chipProgress, [0, 1], [0.8, 1])})`,
                }}
              >
                {chip}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </SceneWrapper>
  );
};

/* ── Scene 3: Feature Grid (9-14s, 270-419) ──────────────────────── */
const FEATURES = [
  { icon: "\uD83C\uDFAC", label: "7 Film Stocks" },
  { icon: "\u2728", label: "Smart Look AI" },
  { icon: "\uD83D\uDC41", label: "Real-time Preview" },
  { icon: "\u2B07\uFE0F", label: "Desktop Export" },
];

const FeatureGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <SceneWrapper durationInFrames={150}>
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            width: 560,
          }}
        >
          {FEATURES.map((feat, i) => {
            const cardProgress = spring({
              frame: Math.max(0, frame - i * 5),
              fps,
              config: FILMTONE_SPRING,
            });
            return (
              <div
                key={feat.label}
                style={{
                  backgroundColor: COLORS.bgSurface,
                  border: `1px solid ${COLORS.bgBorder}`,
                  borderRadius: 12,
                  padding: "28px 24px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                  opacity: cardProgress,
                  transform: `scale(${interpolate(cardProgress, [0, 1], [0.95, 1])})`,
                }}
              >
                <div style={{ fontSize: 36 }}>{feat.icon}</div>
                <div
                  style={{
                    fontFamily: FONTS.inter,
                    fontSize: 22,
                    fontWeight: 600,
                    color: COLORS.textPrimary,
                  }}
                >
                  {feat.label}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </SceneWrapper>
  );
};

/* ── Scene 4: Preset Showcase (14-18s, 420-539) ──────────────────── */
const PRESETS = [
  { name: "Portra 400", from: "#fbbf24", to: "#f59e0b" },
  { name: "Cinestill 800T", from: "#0d9488", to: "#d97706" },
  { name: "Velvia 50", from: "#dc2626", to: "#f97316" },
  { name: "Tri-X 400", from: "#a8a29e", to: "#57534e" },
];

const PresetShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <SceneWrapper durationInFrames={120}>
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", gap: 20 }}>
          {PRESETS.map((preset, i) => {
            const slideProgress = spring({
              frame: Math.max(0, frame - i * 5),
              fps,
              config: FILMTONE_SPRING,
            });
            const translateX = interpolate(slideProgress, [0, 1], [120, 0]);

            return (
              <div
                key={preset.name}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                  opacity: slideProgress,
                  transform: `translateX(${translateX}px)`,
                }}
              >
                <div
                  style={{
                    width: 180,
                    height: 240,
                    borderRadius: 12,
                    background: `linear-gradient(135deg, ${preset.from}, ${preset.to})`,
                  }}
                />
                <div
                  style={{
                    fontFamily: FONTS.inter,
                    fontSize: 18,
                    color: COLORS.textMuted,
                  }}
                >
                  {preset.name}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </SceneWrapper>
  );
};

/* ── Scene 5: Stats Counter (18-22s, 540-659) ────────────────────── */
const STATS = [
  { value: 7, suffix: "", label: "Film Stocks" },
  { value: 100, suffix: "+", label: "Photos per batch" },
  { value: 0, suffix: "", label: "Cost to try" },
];

const StatsCounter: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <SceneWrapper durationInFrames={120}>
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", gap: 80 }}>
          {STATS.map((stat, i) => {
            const numberProgress = spring({
              frame: Math.max(0, frame - i * 8),
              fps,
              config: FILMTONE_POP,
            });
            const labelOpacity = filmtoneFadeIn(frame, 20 + i * 8, fps, 0.6);
            const displayValue = Math.round(stat.value * numberProgress);

            return (
              <div
                key={stat.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontFamily: FONTS.inter,
                    fontSize: 64,
                    fontWeight: 700,
                    color: COLORS.cream,
                    opacity: numberProgress,
                  }}
                >
                  {displayValue}
                  {stat.suffix}
                </div>
                <div
                  style={{
                    fontFamily: FONTS.inter,
                    fontSize: 22,
                    color: COLORS.textMuted,
                    opacity: labelOpacity,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </SceneWrapper>
  );
};

/* ── Scene 6: Particle Background Transition (22-26s, 660-779) ──── */
const ParticleTransition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textOpacity = filmtoneFadeIn(frame, 10, fps, 1.0);

  return (
    <SceneWrapper durationInFrames={120}>
      <AbsoluteFill style={{ backgroundColor: COLORS.bgDeep }}>
        <ParticleLayer count={18} />
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontFamily: FONTS.inter,
              fontSize: 48,
              fontWeight: 700,
              color: COLORS.amber,
              opacity: textOpacity,
            }}
          >
            Try before you buy
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </SceneWrapper>
  );
};

/* ── Scene 7: Logo Reveal (26-33s, 780-989) ──────────────────────── */
const LOGO_TEXT = "Filmtone";
const PRESET_DOTS = [
  { color: "#fbbf24" }, // Portra 400 warm
  { color: "#0d9488" }, // Cinestill teal
  { color: "#f97316" }, // Velvia vivid
  { color: "#78716c" }, // Tri-X gray
];

const LogoReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: Converging lines (frames 0-59 relative)
  const lineProgress = spring({
    frame: Math.min(frame, 59),
    fps,
    config: FILMTONE_SPRING,
  });

  // Phase 2: Character reveal (frames 60-149 relative)
  const charRevealStart = 60;

  // Phase 3: Preset dots (frames 150-209 relative)
  const dotStart = 150;

  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;

  // Line endpoints: from corners converging to center
  const lines = [
    { x1: 0, y1: 0 },
    { x1: WIDTH, y1: 0 },
    { x1: 0, y1: HEIGHT },
    { x1: WIDTH, y1: HEIGHT },
  ];

  return (
    <SceneWrapper durationInFrames={210}>
      <AbsoluteFill style={{ backgroundColor: COLORS.bgDeep }}>
        {/* Phase 1: Converging lines */}
        <svg
          width={WIDTH}
          height={HEIGHT}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {lines.map((line, i) => {
            const x = interpolate(lineProgress, [0, 1], [line.x1, cx]);
            const y = interpolate(lineProgress, [0, 1], [line.y1, cy]);
            const lineOpacity = frame < 60
              ? lineProgress
              : Math.max(0, 1 - (frame - 60) / 20);
            return (
              <line
                key={i}
                x1={line.x1}
                y1={line.y1}
                x2={x}
                y2={y}
                stroke={COLORS.amber}
                strokeWidth={2}
                opacity={lineOpacity}
              />
            );
          })}
        </svg>

        {/* Phase 2: Character-by-character text reveal */}
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div style={{ display: "flex" }}>
            {LOGO_TEXT.split("").map((char, i) => {
              const charFrame = Math.max(0, frame - charRevealStart - i * 2);
              const charProgress = spring({
                frame: charFrame,
                fps,
                config: FILMTONE_GENTLE,
              });
              return (
                <span
                  key={i}
                  style={{
                    fontFamily: FONTS.inter,
                    fontSize: 72,
                    fontWeight: 700,
                    color: COLORS.cream,
                    opacity: charProgress,
                    transform: `translateY(${interpolate(charProgress, [0, 1], [16, 0])}px)`,
                    display: "inline-block",
                  }}
                >
                  {char}
                </span>
              );
            })}
          </div>

          {/* Phase 3: Preset dot row */}
          <div style={{ display: "flex", gap: 16 }}>
            {PRESET_DOTS.map((dot, i) => {
              const dotProgress = spring({
                frame: Math.max(0, frame - dotStart - i * 4),
                fps,
                config: FILMTONE_SPRING,
              });
              return (
                <div
                  key={i}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    backgroundColor: dot.color,
                    opacity: dotProgress,
                    transform: `scale(${interpolate(dotProgress, [0, 1], [0, 1])})`,
                  }}
                />
              );
            })}
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </SceneWrapper>
  );
};

/* ── Scene 8: CTA End Card (33-37s, 990-1109) ────────────────────── */
const CtaEndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const urlOpacity = filmtoneFadeIn(frame, 0, fps, 0.8);
  const subtitleOpacity = filmtoneFadeIn(frame, 10, fps, 0.8);

  // Pulsing scale: 1.0 -> 1.02 -> 1.0 over 2s (60 frames) using sin
  const pulse = 1 + 0.02 * Math.sin((frame / 60) * Math.PI * 2);

  return (
    <SceneWrapper durationInFrames={120}>
      <AbsoluteFill style={{ backgroundColor: COLORS.bgDeep }}>
        {/* Background particles (fewer) */}
        <ParticleLayer count={4} />

        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.inter,
              fontSize: 48,
              fontWeight: 700,
              color: COLORS.cream,
              opacity: urlOpacity,
              transform: `scale(${pulse})`,
            }}
          >
            filmtone.app
          </div>
          <div
            style={{
              fontFamily: FONTS.inter,
              fontSize: 28,
              fontWeight: 400,
              color: COLORS.textMuted,
              opacity: subtitleOpacity,
            }}
          >
            Try free in your browser
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </SceneWrapper>
  );
};

/* ── Main composition ─────────────────────────────────────────────── */
export const LaunchVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDeep }}>
      {/* Scene 1: Terminal Install (0-4s, frames 0-119) */}
      <Sequence from={0} durationInFrames={120}>
        <TerminalInstall />
      </Sequence>

      {/* Scene 2: Hero Title (4-9s, frames 120-269) */}
      <Sequence from={120} durationInFrames={150}>
        <HeroTitle />
      </Sequence>

      {/* Scene 3: Feature Grid (9-14s, frames 270-419) */}
      <Sequence from={270} durationInFrames={150}>
        <FeatureGrid />
      </Sequence>

      {/* Scene 4: Preset Showcase (14-18s, frames 420-539) */}
      <Sequence from={420} durationInFrames={120}>
        <PresetShowcase />
      </Sequence>

      {/* Scene 5: Stats Counter (18-22s, frames 540-659) */}
      <Sequence from={540} durationInFrames={120}>
        <StatsCounter />
      </Sequence>

      {/* Scene 6: Particle Background Transition (22-26s, frames 660-779) */}
      <Sequence from={660} durationInFrames={120}>
        <ParticleTransition />
      </Sequence>

      {/* Scene 7: Logo Reveal (26-33s, frames 780-989) */}
      <Sequence from={780} durationInFrames={210}>
        <LogoReveal />
      </Sequence>

      {/* Scene 8: CTA End Card (33-37s, frames 990-1109) */}
      <Sequence from={990} durationInFrames={120}>
        <CtaEndCard />
      </Sequence>
    </AbsoluteFill>
  );
};
