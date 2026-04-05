/**
 * Phase 5 Launch Integration Prototype — WAVE pacing rewrite
 *
 * 7 beat / 1560f / 52s / ~40 visual states / 30fps / 1920x1080
 * hook(150f) showcase(360f) scope(180f) detail(180f) browser(210f) production(270f) close(210f)
 */
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "../../lib/colors";
import {
  getCanvasPan,
  getCanvasZoom,
  getFilmStockFlash,
  getMontageBurstIndex,
  getTypingState,
  isBlackFlash,
} from "../../lib/motions";
import { SAFE_ZONE } from "../../lib/safeZone";
import {
  FILMTONE_GENTLE,
  FILMTONE_POP,
  FILMTONE_QUICK,
  FILMTONE_SPRING,
  SHOWCASE_SNAP,
} from "../../lib/springs";
import {
  filmtoneFadeIn,
  filmtoneFadeOut,
} from "../../lib/transitions";
import { FONTS, TYPE_SCALE } from "../../lib/typography";
import {
  launchBeatFrames as beatFrames,
  launchBeatOffsets as beatOffsets,
  launchIntegrationPrototypeDurationInFrames,
} from "./launchTimeline";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const previewWidth = 1020;
const previewHeight = 612;

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

interface ProofPreviewTone {
  base: [string, string];
  grade: [string, string];
  rightLabel: string;
}

interface PanelCardDefinition {
  title: string;
  rows: readonly string[];
}

interface CloseBulletDefinition {
  title: string;
}

interface AmbientParticle {
  x: number;
  y: number;
  size: number;
  speed: number;
  angle: number;
  opacity: number;
}

type BeatTransition = "soft" | "hardIn" | "hardOut" | "hardBoth";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const presetChips = [
  { name: "Cinematic", color: "#b87a3a" },
  { name: "Portra", color: "#c9a08e" },
  { name: "Gold", color: "#b89a4a" },
  { name: "Pro 400H", color: "#7a98aa" },
  { name: "Ektar", color: "#b85a3e" },
  { name: "Superia", color: "#6a906a" },
  { name: "CineStill", color: "#c48a42" },
  { name: "B&W", color: "#888888" },
] as const;

const panelCards: readonly PanelCardDefinition[] = [
  { title: "Presets", rows: ["Preset intensity", "Exposure", "White balance"] },
  { title: "Artifacts", rows: ["Film grain", "Vignette", "Halation"] },
  { title: "Compare", rows: ["Before / After", "Slot A / Slot B", "Momentary original"] },
] as const;

const productionCards: readonly PanelCardDefinition[] = [
  { title: "Desktop compare", rows: ["Refine CMY", "Print response", "Histogram check"] },
  { title: "Batch flow", rows: ["Queue images", "Keep preset memory", "Export verification"] },
] as const;

const closeBullets: readonly CloseBulletDefinition[] = [
  { title: "Easy film looks" },
  { title: "Photos and video" },
  { title: "Start light, finish deep" },
] as const;

// Showcase proof pair configs
const proofPairConfigs: {
  name: string;
  tone: ProofPreviewTone;
  motion: "zoomIn" | "panSky" | "zoomOut" | "none";
}[] = [
  {
    name: "Portra 400",
    tone: {
      base: ["#3d4a5c", "#1f2937"],
      grade: ["#d8b39a", "#8e5529"],
      rightLabel: "Portra 400",
    },
    motion: "zoomIn",
  },
  {
    name: "Ektar 100",
    tone: {
      base: ["#2d3b2d", "#1a2418"],
      grade: ["#7ab648", "#c87a28"],
      rightLabel: "Ektar 100",
    },
    motion: "panSky",
  },
  {
    name: "CineStill 800T",
    tone: {
      base: ["#1a2230", "#0d1520"],
      grade: ["#2a8a9a", "#c48a42"],
      rightLabel: "CineStill 800T",
    },
    motion: "zoomOut",
  },
  {
    name: "B&W Classic",
    tone: {
      base: ["#3a3a3a", "#1a1a1a"],
      grade: ["#c0c0c0", "#585858"],
      rightLabel: "B&W Classic",
    },
    motion: "none",
  },
];

// 18 montage burst tones for Showcase
const showcaseBurstTones: ProofPreviewTone[] = [
  { base: ["#3d4a5c", "#1f2937"], grade: ["#e8c89a", "#9e6529"], rightLabel: "Warm A" },
  { base: ["#2d3b2d", "#1a2418"], grade: ["#8ac658", "#d89a38"], rightLabel: "Forest" },
  { base: ["#1a2230", "#0d1520"], grade: ["#3a9aaa", "#d49a52"], rightLabel: "Neon A" },
  { base: ["#3a3a3a", "#1a1a1a"], grade: ["#d0d0d0", "#686868"], rightLabel: "Silver" },
  { base: ["#4a3a2a", "#2a1a0a"], grade: ["#f0b86a", "#7a4a1a"], rightLabel: "Gold" },
  { base: ["#2a3a4a", "#0a1a2a"], grade: ["#6a9aba", "#2a5a8a"], rightLabel: "Cool A" },
  { base: ["#3a2a3a", "#1a0a1a"], grade: ["#ba6aba", "#6a2a6a"], rightLabel: "Violet" },
  { base: ["#4a4a3a", "#2a2a1a"], grade: ["#dada8a", "#8a8a3a"], rightLabel: "Olive" },
  { base: ["#3d4a5c", "#1f2937"], grade: ["#c8a87a", "#7e4519"], rightLabel: "Warm B" },
  { base: ["#2d3b2d", "#1a2418"], grade: ["#5a9638", "#a87a18"], rightLabel: "Moss" },
  { base: ["#1a2230", "#0d1520"], grade: ["#1a7a8a", "#a47a32"], rightLabel: "Neon B" },
  { base: ["#3a3a3a", "#1a1a1a"], grade: ["#a0a0a0", "#484848"], rightLabel: "Ash" },
  { base: ["#4a3a2a", "#2a1a0a"], grade: ["#d0985a", "#6a3a0a"], rightLabel: "Amber" },
  { base: ["#2a3a4a", "#0a1a2a"], grade: ["#4a8aaa", "#1a4a7a"], rightLabel: "Cool B" },
  { base: ["#3a2a3a", "#1a0a1a"], grade: ["#9a4a9a", "#5a1a5a"], rightLabel: "Plum" },
  { base: ["#4a4a3a", "#2a2a1a"], grade: ["#baba6a", "#7a7a2a"], rightLabel: "Sage" },
  { base: ["#3d4a5c", "#1f2937"], grade: ["#f0d8aa", "#ae7539"], rightLabel: "Warm C" },
  { base: ["#2d3b2d", "#1a2418"], grade: ["#9ad678", "#e8aa48"], rightLabel: "Spring" },
];

// 10 close burst tones (different from showcase to show different source photos)
const closeBurstTones: ProofPreviewTone[] = [
  { base: ["#4a3040", "#2a1020"], grade: ["#e8a080", "#9a4030"], rightLabel: "Sunset" },
  { base: ["#203a4a", "#001a2a"], grade: ["#80c0e0", "#2070a0"], rightLabel: "Cerulean" },
  { base: ["#3a3020", "#1a1000"], grade: ["#d8c080", "#887030"], rightLabel: "Sepia" },
  { base: ["#2a4030", "#0a2010"], grade: ["#60b080", "#208050"], rightLabel: "Emerald" },
  { base: ["#402a3a", "#200a1a"], grade: ["#c080b0", "#704060"], rightLabel: "Rose" },
  { base: ["#3a3a4a", "#1a1a2a"], grade: ["#a0a0c0", "#505080"], rightLabel: "Slate" },
  { base: ["#4a4030", "#2a2010"], grade: ["#e0c890", "#907840"], rightLabel: "Honey" },
  { base: ["#2a3040", "#0a1020"], grade: ["#70a0c0", "#305080"], rightLabel: "Steel" },
  { base: ["#403a2a", "#201a0a"], grade: ["#c8b890", "#786840"], rightLabel: "Sand" },
  { base: ["#303a30", "#101a10"], grade: ["#90b890", "#408040"], rightLabel: "Fern" },
];

// ---------------------------------------------------------------------------
// BeatFrame — shared wrapper with fade-in/out control
// ---------------------------------------------------------------------------

function BeatFrame(props: {
  children: React.ReactNode;
  durationInFrames: number;
  transition?: BeatTransition;
}): React.ReactElement {
  const { children, durationInFrames, transition = "soft" } = props;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const useFadeIn = transition === "soft" || transition === "hardOut";
  const useFadeOut = transition === "soft" || transition === "hardIn";
  const fadeIn = useFadeIn ? filmtoneFadeIn(frame, 0, fps, 0.5) : 1;
  const fadeOut = useFadeOut
    ? filmtoneFadeOut(frame, durationInFrames - 15, fps, 0.5)
    : 1;
  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <AbsoluteFill style={{ opacity }}>
      {children}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------------------
// WindowShell — macOS window chrome
// ---------------------------------------------------------------------------

function WindowShell(props: {
  children: React.ReactNode;
  caption: string;
  width?: number;
  variant?: "browser" | "desktop";
}): React.ReactElement {
  const { children, caption, width = previewWidth, variant = "browser" } = props;
  const isDesktop = variant === "desktop";

  return (
    <div
      style={{
        width,
        borderRadius: 28,
        overflow: "hidden",
        background: isDesktop
          ? "linear-gradient(180deg, rgba(22, 20, 18, 0.99) 0%, rgba(12, 10, 8, 0.99) 100%)"
          : "linear-gradient(180deg, rgba(28, 25, 23, 0.98) 0%, rgba(16, 14, 13, 0.98) 100%)",
        border: isDesktop
          ? "2px solid rgba(255, 255, 255, 0.10)"
          : "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 30px 90px rgba(0, 0, 0, 0.36)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: isDesktop ? "16px 20px" : "14px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.16)",
          }}
        />
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.16)",
          }}
        />
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.16)",
          }}
        />
        {isDesktop ? (
          <div
            style={{
              marginLeft: 16,
              display: "flex",
              gap: 6,
            }}
          >
            {["File", "Edit", "Process", "View"].map((item) => (
              <div
                key={item}
                style={{
                  fontFamily: FONTS.inter,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.32)",
                  padding: "2px 8px",
                }}
              >
                {item}
              </div>
            ))}
          </div>
        ) : null}
        <div
          style={{
            marginLeft: "auto",
            fontFamily: FONTS.inter,
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.28)",
          }}
        >
          {caption}
        </div>
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PresetStrip
// ---------------------------------------------------------------------------

function PresetStrip(props: { startFrame: number }): React.ReactElement {
  const { startFrame } = props;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "16px 18px 18px",
      }}
    >
      {presetChips.map((chip, index) => {
        const progress = spring({
          frame: Math.max(0, frame - startFrame - index * 3),
          fps,
          config: FILMTONE_SPRING,
        });
        const scale = interpolate(progress, [0, 1], [0.82, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={chip.name}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              opacity: progress,
              transform: `scale(${scale})`,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                backgroundColor: chip.color,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />
            <div
              style={{
                fontFamily: FONTS.inter,
                fontSize: 9,
                color: "rgba(255,255,255,0.28)",
              }}
            >
              {chip.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ComparePlate
// ---------------------------------------------------------------------------

function ComparePlate(props: {
  tone: ProofPreviewTone;
  dividerProgress: number;
  showSweep?: boolean;
}): React.ReactElement {
  const { tone, dividerProgress, showSweep = false } = props;
  const frame = useCurrentFrame();
  const dividerX = interpolate(dividerProgress, [0, 1], [0.34, 0.64], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sweepX = interpolate(frame, [0, 90], [-180, previewWidth + 180], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "relative",
        height: previewHeight - 82,
        margin: "16px 16px 0",
        borderRadius: 24,
        overflow: "hidden",
        backgroundColor: "#151210",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, ${tone.base[0]} 0%, ${tone.base[1]} 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: `inset(0 0 0 ${dividerX * 100}%)`,
          background: `linear-gradient(135deg, ${tone.grade[0]} 0%, ${tone.grade[1]} 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "10% 10% 12%",
          borderRadius: 30,
          border: "1px solid rgba(255,255,255,0.07)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "12%",
          top: "18%",
          width: "28%",
          aspectRatio: "1 / 1.25",
          borderRadius: 999,
          background: "rgba(255,255,255,0.10)",
          filter: "blur(2px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "14%",
          bottom: "16%",
          width: "32%",
          height: "18%",
          borderRadius: 999,
          background: "rgba(255,255,255,0.08)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: `calc(${dividerX * 100}% - 1px)`,
          top: 0,
          bottom: 0,
          width: 2,
          backgroundColor: "rgba(255,255,255,0.78)",
          boxShadow: "0 0 18px rgba(255,255,255,0.20)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 24,
          top: 20,
          fontFamily: FONTS.inter,
          fontSize: 14,
          fontWeight: 600,
          color: "rgba(255,255,255,0.64)",
        }}
      >
        Original
      </div>
      <div
        style={{
          position: "absolute",
          right: 24,
          top: 20,
          fontFamily: FONTS.inter,
          fontSize: 14,
          fontWeight: 600,
          color: "rgba(255,255,255,0.64)",
        }}
      >
        {tone.rightLabel}
      </div>
      {showSweep ? (
        <div
          style={{
            position: "absolute",
            top: -60,
            bottom: -60,
            left: sweepX,
            width: 120,
            background:
              "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0) 100%)",
            transform: "rotate(16deg)",
            mixBlendMode: "screen",
          }}
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PanelCard
// ---------------------------------------------------------------------------

function PanelCard(props: {
  definition: PanelCardDefinition;
  index: number;
}): React.ReactElement {
  const { definition, index } = props;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: Math.max(0, frame - 10 - index * 6),
    fps,
    config: FILMTONE_GENTLE,
  });

  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.08)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.10) 100%)",
        padding: "16px 16px 14px",
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [12, 0])}px)`,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.inter,
          fontSize: 13,
          fontWeight: 600,
          color: COLORS.warmWhite,
          marginBottom: 12,
        }}
      >
        {definition.title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {definition.rows.map((row, rowIndex) => {
          const fill = 0.28 + ((index * 19 + rowIndex * 17) % 44) / 100;
          return (
            <div key={row}>
              <div
                style={{
                  fontFamily: FONTS.inter,
                  fontSize: 11,
                  color: COLORS.textMuted,
                  marginBottom: 6,
                }}
              >
                {row}
              </div>
              <div
                style={{
                  height: 6,
                  borderRadius: 999,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${fill * 100}%`,
                    height: "100%",
                    borderRadius: 999,
                    background:
                      "linear-gradient(90deg, rgba(217,119,6,0.86) 0%, rgba(254,243,199,0.86) 100%)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AmbientDust
// ---------------------------------------------------------------------------

function AmbientDust(props: { count: number }): React.ReactElement {
  const { count } = props;
  const frame = useCurrentFrame();
  const particles = useMemo<AmbientParticle[]>(
    () =>
      Array.from({ length: count }, (_, index) => ({
        x: (index * 173.9) % 1920,
        y: 120 + ((index * 117.7) % 840),
        size: 2 + (index % 3),
        speed: 0.18 + (index % 4) * 0.08,
        angle: ((index * 53 + 21) % 360) * (Math.PI / 180),
        opacity: 0.08 + (index % 3) * 0.06,
      })),
    [count],
  );

  return (
    <>
      {particles.map((particle, index) => {
        const currentX =
          ((particle.x + Math.cos(particle.angle) * particle.speed * frame) %
            1920 +
            1920) %
          1920;
        const currentY =
          ((particle.y + Math.sin(particle.angle) * particle.speed * frame) %
            1080 +
            1080) %
          1080;

        return (
          <div
            key={`ambient-dust-${count}-${index}`}
            style={{
              position: "absolute",
              left: currentX,
              top: currentY,
              width: particle.size,
              height: particle.size,
              borderRadius: "50%",
              backgroundColor:
                index % 2 === 0 ? COLORS.cream : COLORS.warmWhite,
              opacity: particle.opacity,
              filter: "blur(1px)",
            }}
          />
        );
      })}
    </>
  );
}

// ===========================================================================
// Beat 1: HookBeat (150f / 5s)
// Dynamic text pattern: 10 rows "Film looks." center-out shockwave reveal
// Phase A: DARK HOLD 0-3f | B: CENTER BURST 4-22f | C: TEXT HOLD 22-52f
// Phase D: SCATTER EXIT 52-70f + PLATE IN 60-80f | E: SETTLE 82-150f
// ===========================================================================

const SNAP_DECEL = Easing.bezier(0.16, 1, 0.3, 1);
const HEAVY_DECEL = Easing.bezier(0.0, 0.9, 0.1, 1.0);

type HookRowConfig = {
  size: number;
  outline: boolean;
  offset: number;
  revealStart: number;
  revealDuration: number;
  direction: 'ltr' | 'rtl';
  exitStart: number;
  exitDuration: number;
  easing: (t: number) => number;
};

// Center-out shockwave: rows 4,5 fire first (f4), edges 0,9 last (f12)
// Direction: "Converging Curtain" — LTR/RTL alternate with break at rows 4-5, 8-9
const HOOK_TEXT_ROWS: HookRowConfig[] = [
  { size: 86,  outline: false, offset: -140, revealStart: 12, revealDuration: 12, direction: 'ltr', exitStart: 60, exitDuration: 12, easing: SNAP_DECEL },
  { size: 64,  outline: true,  offset: 80,   revealStart: 10, revealDuration: 12, direction: 'rtl', exitStart: 58, exitDuration: 12, easing: SNAP_DECEL },
  { size: 118, outline: false, offset: -220, revealStart: 8,  revealDuration: 13, direction: 'ltr', exitStart: 56, exitDuration: 13, easing: HEAVY_DECEL },
  { size: 56,  outline: true,  offset: 160,  revealStart: 6,  revealDuration: 12, direction: 'rtl', exitStart: 54, exitDuration: 12, easing: SNAP_DECEL },
  { size: 148, outline: false, offset: -60,  revealStart: 4,  revealDuration: 14, direction: 'rtl', exitStart: 52, exitDuration: 14, easing: HEAVY_DECEL },
  { size: 62,  outline: true,  offset: 50,   revealStart: 4,  revealDuration: 14, direction: 'ltr', exitStart: 52, exitDuration: 14, easing: HEAVY_DECEL },
  { size: 106, outline: false, offset: -180, revealStart: 6,  revealDuration: 13, direction: 'ltr', exitStart: 54, exitDuration: 13, easing: HEAVY_DECEL },
  { size: 68,  outline: true,  offset: 120,  revealStart: 8,  revealDuration: 12, direction: 'rtl', exitStart: 56, exitDuration: 12, easing: SNAP_DECEL },
  { size: 136, outline: false, offset: -30,  revealStart: 10, revealDuration: 13, direction: 'rtl', exitStart: 58, exitDuration: 13, easing: HEAVY_DECEL },
  { size: 54,  outline: true,  offset: 200,  revealStart: 12, revealDuration: 12, direction: 'ltr', exitStart: 60, exitDuration: 12, easing: SNAP_DECEL },
];

function getRowClipPath(direction: 'ltr' | 'rtl', progress: number): string {
  const p = progress * 100;
  return direction === 'ltr'
    ? `inset(0 ${100 - p}% 0 0)`
    : `inset(0 0 0 ${100 - p}%)`;
}

function HookBeat(): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Settled header (frame 82-92) ---
  const headerOpacity = interpolate(frame, [82, 92], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // --- Compare plate reveal (frame 60-80, blur-to-sharp entrance) ---
  const plateOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const plateScale = interpolate(frame, [62, 88], [0.93, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const plateBlur = interpolate(frame, [60, 72], [6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // --- Phase F: Divider snap (only spring in HookBeat) ---
  const dividerSpring = spring({
    frame: Math.max(0, frame - 92),
    fps,
    config: SHOWCASE_SNAP,
    durationInFrames: 18,
  });
  const dividerBase = interpolate(dividerSpring, [0, 1], [0.18, 0.62], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const microOsc =
    Math.sin((frame * (2 * Math.PI * 0.3)) / fps) * 0.005;
  const dividerProgress =
    dividerBase + (dividerSpring >= 0.99 ? microOsc : 0);

  // --- Ambient warmth (text phase only, fades before plate sharpens) ---
  const warmthOpacity = interpolate(frame, [0, 15, 50, 68], [0, 0.2, 0.2, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ===== RENDER =====
  return (
    <BeatFrame durationInFrames={beatFrames.hook} transition="hardIn">
      <AbsoluteFill style={{ backgroundColor: COLORS.bgDeep }}>

        {/* Ambient warmth — barely perceptible, fades before plate */}
        <AbsoluteFill
          style={{
            opacity: warmthOpacity,
            background: `radial-gradient(
              ellipse 65% 55% at 50% 45%,
              rgba(245, 180, 60, 0.25) 0%,
              rgba(180, 83, 9, 0.06) 35%,
              transparent 65%
            )`,
          }}
        />

        {/* Dynamic text pattern — center-out shockwave reveal, per-row scatter exit */}
        {frame < 75 && (
          <AbsoluteFill
            style={{
              overflow: "hidden",
              zIndex: 3,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: `translate(-50%, -50%)`,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                width: 2800,
              }}
            >
              {HOOK_TEXT_ROWS.map((row, rowIdx) => {
                // Reveal: Z-axis approach — scale up from depth + blur-to-sharp + fade in
                const rowReveal = interpolate(
                  frame,
                  [row.revealStart, row.revealStart + row.revealDuration],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: row.easing },
                );
                const revealScale = interpolate(
                  frame,
                  [row.revealStart, row.revealStart + row.revealDuration],
                  [0.5, 1.0],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: row.easing },
                );
                const revealBlur = interpolate(
                  frame,
                  [row.revealStart, row.revealStart + row.revealDuration],
                  [6, 0],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: row.easing },
                );

                // Exit: scatter out with blur + drift
                const exitProgress = interpolate(
                  frame,
                  [row.exitStart, row.exitStart + row.exitDuration],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) },
                );
                const rowExit = 1 - exitProgress;
                const exitBlur = exitProgress * (row.outline ? 8 : 14);
                const driftDirection = row.direction === 'ltr' ? 1 : -1;
                const exitDrift = exitProgress * 100 * driftDirection;

                const totalBlur = revealBlur + exitBlur;
                const reps = Math.ceil(2800 / (row.size * 5.5)) + 1;
                return (
                  <div
                    key={rowIdx}
                    style={{
                      display: "flex",
                      gap: row.size * 0.5,
                      whiteSpace: "nowrap",
                      marginLeft: row.offset,
                      opacity: Math.min(rowReveal, rowExit),
                      transform: `scale(${revealScale}) translateX(${exitDrift}px)`,
                      filter: totalBlur > 0.5 ? `blur(${totalBlur}px)` : undefined,
                    }}
                  >
                    {Array.from({ length: reps }, (_, i) => (
                      <span
                        key={i}
                        style={{
                          fontFamily: FONTS.inter,
                          fontSize: row.size,
                          fontWeight: 700,
                          letterSpacing: "-0.02em",
                          lineHeight: 1.0,
                          color: row.outline ? "transparent" : COLORS.warmWhite,
                          WebkitTextStroke: row.outline
                            ? `2px ${COLORS.warmWhite}`
                            : "none",
                        }}
                      >
                        Film looks.
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
          </AbsoluteFill>
        )}

        {/* Settled header "Film looks." */}
        <div
          style={{
            position: "absolute",
            top: 48,
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: headerOpacity,
            zIndex: 4,
          }}
        >
          <span
            style={{
              fontFamily: FONTS.inter,
              fontSize: 42,
              fontWeight: 700,
              color: COLORS.warmWhite,
              textShadow: "0 2px 20px rgba(0,0,0,0.5)",
            }}
          >
            Film looks.
          </span>
        </div>

        {/* Compare plate — blur-to-sharp entrance overlapping text scatter */}
        <div
          style={{
            position: "absolute",
            bottom: SAFE_ZONE.horizontal.bottom,
            left: SAFE_ZONE.horizontal.left,
            right: SAFE_ZONE.horizontal.left,
            opacity: plateOpacity,
            transform: `scale(${plateScale})`,
            filter: plateBlur > 0.2 ? `blur(${plateBlur}px)` : undefined,
            zIndex: 1,
          }}
        >
          <WindowShell caption="Filmtone" width={1680}>
            <ComparePlate
              tone={{
                base: ["#455468", "#242d39"],
                grade: ["#f0ce8f", "#8e5529"],
                rightLabel: "Gold 200",
              }}
              dividerProgress={dividerProgress}
              showSweep
            />
            <PresetStrip startFrame={10} />
          </WindowShell>
        </div>
      </AbsoluteFill>
    </BeatFrame>
  );
}

// ===========================================================================
// Beat 2: ShowcaseBeat (270f / 9s)
// 4 proof pairs (15f flash + 45f plate + 2f gap each = 248f) + 22f hold
// Pair layout: PP1 0-62, PP2 62-124, PP3 124-186, PP4 186-248
// ===========================================================================

function ShowcaseBeat(): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Proof pair timing: flash(15f) + plate(45f) + gap(2f) = 62f each
  const FLASH_DURATION = 15;
  const PLATE_DURATION = 45;
  const GAP_DURATION = 2;
  const PAIR_DURATION = FLASH_DURATION + PLATE_DURATION + GAP_DURATION; // 62f

  // Determine which proof pair we are in
  const pairIndex = Math.min(3, Math.floor(frame / PAIR_DURATION));
  const pairLocalFrame = frame - pairIndex * PAIR_DURATION;

  // Film stock name flash
  const currentPair = proofPairConfigs[Math.min(pairIndex, 3)];
  const flashState = getFilmStockFlash(frame, {
    text: currentPair.name,
    startFrame: pairIndex * PAIR_DURATION,
    holdFrames: FLASH_DURATION,
  });

  // ComparePlate divider within each pair
  const plateStart = pairIndex * PAIR_DURATION + FLASH_DURATION;
  const dividerSpring = spring({
    frame: Math.max(0, frame - plateStart),
    fps,
    config: SHOWCASE_SNAP,
  });
  const dividerProgress = interpolate(dividerSpring, [0, 1], [0, 0.62], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Canvas motion per pair
  const motionType = currentPair.motion;
  const zoomIn = getCanvasZoom(frame, {
    startFrame: plateStart,
    endFrame: plateStart + PLATE_DURATION,
    startScale: 1.0,
    endScale: 1.35,
    originXPercent: 35,
    originYPercent: 40,
    direction: "in",
  });
  const panSky = getCanvasPan(frame, {
    startFrame: plateStart,
    endFrame: plateStart + PLATE_DURATION,
    startX: 0,
    endX: -80,
    startY: 0,
    endY: 0,
  });
  const zoomOut = getCanvasZoom(frame, {
    startFrame: plateStart,
    endFrame: plateStart + PLATE_DURATION,
    startScale: 1.4,
    endScale: 1.0,
    originXPercent: 50,
    originYPercent: 50,
    direction: "out",
  });

  let plateTransform = "";
  let plateOrigin = "50% 50%";
  if (motionType === "zoomIn") {
    plateTransform = `scale(${zoomIn.scale})`;
    plateOrigin = `${zoomIn.originX} ${zoomIn.originY}`;
  } else if (motionType === "panSky") {
    plateTransform = `translateX(${panSky.translateX}px)`;
  } else if (motionType === "zoomOut") {
    plateTransform = `scale(${zoomOut.scale})`;
    plateOrigin = `${zoomOut.originX} ${zoomOut.originY}`;
  }

  // In plate phase?
  const inPlatePhase =
    pairLocalFrame >= FLASH_DURATION &&
    pairLocalFrame < FLASH_DURATION + PLATE_DURATION;

  // In gap phase?
  const inGap =
    pairLocalFrame >= FLASH_DURATION + PLATE_DURATION;

  return (
    <BeatFrame durationInFrames={beatFrames.showcase} transition="hardIn">
      <AbsoluteFill style={{ backgroundColor: "#0c0a09" }}>
        {/* Film stock name flash */}
        {flashState.visible && !inGap ? (
          <AbsoluteFill
            style={{
              backgroundColor: "#000000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontFamily: FONTS.inter,
                fontSize: 90,
                fontWeight: 700,
                color: COLORS.warmWhite,
                transform: `scale(${flashState.scale})`,
                textShadow: "0 0 60px rgba(254,243,199,0.12)",
              }}
            >
              {currentPair.name}
            </div>
          </AbsoluteFill>
        ) : null}

        {/* ComparePlate with motion — shown during plate phase */}
        {inPlatePhase ? (
          <AbsoluteFill
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: `${SAFE_ZONE.horizontal.top}px ${SAFE_ZONE.horizontal.left}px`,
            }}
          >
            <div
              style={{
                width: "100%",
                overflow: "hidden",
                borderRadius: 28,
                transform: plateTransform,
                transformOrigin: plateOrigin,
              }}
            >
              <WindowShell caption={currentPair.name} width={1760}>
                <ComparePlate
                  tone={currentPair.tone}
                  dividerProgress={dividerProgress}
                  showSweep
                />
              </WindowShell>
            </div>
          </AbsoluteFill>
        ) : null}

        {/* Black gap between pairs */}
        {inGap ? (
          <AbsoluteFill style={{ backgroundColor: "#000000" }} />
        ) : null}
      </AbsoluteFill>
    </BeatFrame>
  );
}

// ===========================================================================
// Beat 3: ScopeBeat (180f / 6s)
// 0-75f: photo compare, 75-77f: black flash, 77-135f: video compare,
// 135-180f: "One language." split comp
// ===========================================================================

function ScopeBeat(): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const photoTone: ProofPreviewTone = {
    base: ["#394760", "#1f2937"],
    grade: ["#d8b39a", "#8e5529"],
    rightLabel: "Portrait",
  };
  const videoTone: ProofPreviewTone = {
    base: ["#263240", "#1a1d24"],
    grade: ["#f4d58e", "#6b3d1c"],
    rightLabel: "Cinematic",
  };

  const blackFlashActive = isBlackFlash(frame, 75, 2);

  // Photo plate divider
  const photoDivider = spring({
    frame,
    fps,
    config: SHOWCASE_SNAP,
  });
  const photoDividerProgress = interpolate(photoDivider, [0, 1], [0, 0.60], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Video plate divider
  const videoDivider = spring({
    frame: Math.max(0, frame - 77),
    fps,
    config: SHOWCASE_SNAP,
  });
  const videoDividerProgress = interpolate(videoDivider, [0, 1], [0, 0.58], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "One language." text
  const oneLanguageOpacity = interpolate(frame, [135, 148], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const oneLanguageScale = interpolate(frame, [135, 150], [0.9, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // In final split phase
  const inSplit = frame >= 135;

  // Photo label
  const photoLabelOpacity = filmtoneFadeIn(frame, 8, fps, 0.4);
  // Video label
  const videoLabelOpacity = filmtoneFadeIn(frame, 82, fps, 0.4);

  return (
    <BeatFrame durationInFrames={beatFrames.scope} transition="hardIn">
      <AbsoluteFill style={{ backgroundColor: "#0c0a09" }}>
        <AmbientDust count={8} />

        {/* Black flash */}
        {blackFlashActive ? (
          <AbsoluteFill style={{ backgroundColor: "#000000", zIndex: 10 }} />
        ) : null}

        {/* Phase 1: Full-screen photo compare (0-75f) */}
        {frame < 75 && !blackFlashActive ? (
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              padding: `${SAFE_ZONE.horizontal.top}px ${SAFE_ZONE.horizontal.left}px`,
            }}
          >
            <div style={{ flex: 1, position: "relative" }}>
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 28,
                  overflow: "hidden",
                }}
              >
                <div style={{ transform: "scale(1)", width: "100%", height: "100%", position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: `linear-gradient(135deg, ${photoTone.base[0]} 0%, ${photoTone.base[1]} 100%)`,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      clipPath: `inset(0 0 0 ${photoDividerProgress * 100}%)`,
                      background: `linear-gradient(135deg, ${photoTone.grade[0]} 0%, ${photoTone.grade[1]} 100%)`,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: `calc(${photoDividerProgress * 100}% - 1px)`,
                      top: 0,
                      bottom: 0,
                      width: 2,
                      backgroundColor: "rgba(255,255,255,0.78)",
                      boxShadow: "0 0 18px rgba(255,255,255,0.20)",
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 32,
                  bottom: 32,
                  fontFamily: FONTS.inter,
                  fontSize: 60,
                  fontWeight: 700,
                  color: COLORS.warmWhite,
                  opacity: photoLabelOpacity,
                  textShadow: "0 4px 30px rgba(0,0,0,0.6)",
                }}
              >
                Photos.
              </div>
            </div>
          </AbsoluteFill>
        ) : null}

        {/* Phase 2: Full-screen video compare (77-135f) */}
        {frame >= 77 && frame < 135 && !blackFlashActive ? (
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              padding: `${SAFE_ZONE.horizontal.top}px ${SAFE_ZONE.horizontal.left}px`,
            }}
          >
            <div style={{ flex: 1, position: "relative" }}>
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 28,
                  overflow: "hidden",
                }}
              >
                <div style={{ width: "100%", height: "100%", position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: `linear-gradient(135deg, ${videoTone.base[0]} 0%, ${videoTone.base[1]} 100%)`,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      clipPath: `inset(0 0 0 ${videoDividerProgress * 100}%)`,
                      background: `linear-gradient(135deg, ${videoTone.grade[0]} 0%, ${videoTone.grade[1]} 100%)`,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: `calc(${videoDividerProgress * 100}% - 1px)`,
                      top: 0,
                      bottom: 0,
                      width: 2,
                      backgroundColor: "rgba(255,255,255,0.78)",
                      boxShadow: "0 0 18px rgba(255,255,255,0.20)",
                    }}
                  />
                  {/* Play icon to indicate video */}
                  <div
                    style={{
                      position: "absolute",
                      right: 40,
                      top: 40,
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      backgroundColor: "rgba(255,255,255,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 0,
                        height: 0,
                        borderLeft: "14px solid rgba(255,255,255,0.7)",
                        borderTop: "9px solid transparent",
                        borderBottom: "9px solid transparent",
                        marginLeft: 4,
                      }}
                    />
                  </div>
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 32,
                  bottom: 32,
                  fontFamily: FONTS.inter,
                  fontSize: 60,
                  fontWeight: 700,
                  color: COLORS.warmWhite,
                  opacity: videoLabelOpacity,
                  textShadow: "0 4px 30px rgba(0,0,0,0.6)",
                }}
              >
                Video.
              </div>
            </div>
          </AbsoluteFill>
        ) : null}

        {/* Phase 3: Split composition + "One language." (135-180f) */}
        {inSplit ? (
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              padding: `${SAFE_ZONE.horizontal.top}px ${SAFE_ZONE.horizontal.left}px`,
            }}
          >
            <div style={{ display: "flex", gap: 16, flex: 1 }}>
              {/* Left: photo */}
              <div
                style={{
                  flex: 1,
                  borderRadius: 24,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(135deg, ${photoTone.base[0]} 0%, ${photoTone.base[1]} 100%)`,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    clipPath: "inset(0 0 0 60%)",
                    background: `linear-gradient(135deg, ${photoTone.grade[0]} 0%, ${photoTone.grade[1]} 100%)`,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: 24,
                    bottom: 24,
                    fontFamily: FONTS.inter,
                    fontSize: 32,
                    fontWeight: 700,
                    color: COLORS.warmWhite,
                    textShadow: "0 2px 20px rgba(0,0,0,0.5)",
                  }}
                >
                  Photos.
                </div>
              </div>
              {/* Right: video */}
              <div
                style={{
                  flex: 1,
                  borderRadius: 24,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(135deg, ${videoTone.base[0]} 0%, ${videoTone.base[1]} 100%)`,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    clipPath: "inset(0 0 0 58%)",
                    background: `linear-gradient(135deg, ${videoTone.grade[0]} 0%, ${videoTone.grade[1]} 100%)`,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: 24,
                    bottom: 24,
                    fontFamily: FONTS.inter,
                    fontSize: 32,
                    fontWeight: 700,
                    color: COLORS.warmWhite,
                    textShadow: "0 2px 20px rgba(0,0,0,0.5)",
                  }}
                >
                  Video.
                </div>
              </div>
            </div>
            {/* Center text overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  fontFamily: FONTS.inter,
                  fontSize: 80,
                  fontWeight: 700,
                  color: COLORS.warmWhite,
                  opacity: oneLanguageOpacity,
                  transform: `scale(${oneLanguageScale})`,
                  textShadow: "0 0 60px rgba(0,0,0,0.8), 0 4px 40px rgba(0,0,0,0.7)",
                }}
              >
                One language.
              </div>
            </div>
          </AbsoluteFill>
        ) : null}
      </AbsoluteFill>
    </BeatFrame>
  );
}

// ===========================================================================
// Beat 4: DetailBeat (180f / 6s)
// Text-only — sequential quality labels + closing statement
// 0-55f:    "Skin." fade in, hold, fade out
// 55-110f:  "Highlights." fade in, hold, fade out
// 110-150f: "Texture." fade in, hold, fade out
// 150-180f: "See it in the details." closing hero text
// ===========================================================================

function DetailBeat(): React.ReactElement {
  const frame = useCurrentFrame();

  // --- Per-label animation helper ---
  const labelAnim = (start: number, end: number) => {
    const fadeInEnd = start + 15;
    const fadeOutStart = end - 12;
    const inOp = interpolate(frame, [start, fadeInEnd], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    const outOp = interpolate(frame, [fadeOutStart, end], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    });
    const opacity = Math.min(inOp, outOp);
    const translateY = interpolate(inOp, [0, 1], [14, 0]);
    return { opacity, translateY };
  };

  const skin = labelAnim(0, 55);
  const highlights = labelAnim(55, 110);
  const texture = labelAnim(110, 150);

  // --- Closing hero text ---
  const heroOpacity = interpolate(frame, [150, 168], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const heroTranslateY = interpolate(frame, [150, 168], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // --- Active label ---
  let activeText = "";
  let activeOpacity = 0;
  let activeTranslateY = 0;
  if (frame < 55) {
    activeText = "Skin.";
    activeOpacity = skin.opacity;
    activeTranslateY = skin.translateY;
  } else if (frame < 110) {
    activeText = "Highlights.";
    activeOpacity = highlights.opacity;
    activeTranslateY = highlights.translateY;
  } else if (frame < 150) {
    activeText = "Texture.";
    activeOpacity = texture.opacity;
    activeTranslateY = texture.translateY;
  }

  return (
    <BeatFrame durationInFrames={beatFrames.detail} transition="soft">
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 0%, rgba(255, 243, 199, 0.09) 0%, rgba(12, 10, 9, 0) 30%), #0c0a09",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Sequential quality labels */}
        {activeOpacity > 0 ? (
          <div
            style={{
              fontFamily: FONTS.inter,
              fontSize: 96,
              fontWeight: 700,
              color: COLORS.warmWhite,
              letterSpacing: "-0.02em",
              opacity: activeOpacity,
              transform: `translateY(${activeTranslateY}px)`,
            }}
          >
            {activeText}
          </div>
        ) : null}

        {/* Closing hero text */}
        {frame >= 150 ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontFamily: FONTS.inter,
                fontSize: 52,
                fontWeight: 700,
                color: COLORS.warmWhite,
                letterSpacing: "-0.02em",
                opacity: heroOpacity,
                transform: `translateY(${heroTranslateY}px)`,
              }}
            >
              See it in the details.
            </div>
          </div>
        ) : null}
      </AbsoluteFill>
    </BeatFrame>
  );
}

// ===========================================================================
// Beat 5: BrowserBeat (210f / 7s)
// 0-30f: shell scales in, URL types
// 30-75f: image drops in
// 75-120f: preset chips + divider snap
// 120-180f: canvas zoom into detail
// 180-210f: control panel slides in
// ===========================================================================

function BrowserBeat(): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Shell entrance
  const shellSpring = spring({
    frame,
    fps,
    config: FILMTONE_SPRING,
  });
  const shellScale = interpolate(shellSpring, [0, 1], [0.88, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // URL typing
  const typing = getTypingState("filmtone.app", frame, 0, fps, 15);

  // Image drop (placeholder rect slides down)
  const imageDropProgress = spring({
    frame: Math.max(0, frame - 30),
    fps,
    config: FILMTONE_SPRING,
  });
  const imageDropY = interpolate(imageDropProgress, [0, 1], [-200, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Divider snap
  const dividerSnap = spring({
    frame: Math.max(0, frame - 75),
    fps,
    config: SHOWCASE_SNAP,
  });
  const dividerProgress = interpolate(dividerSnap, [0, 1], [0, 0.62], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Canvas zoom
  const canvasZoom = getCanvasZoom(frame, {
    startFrame: 120,
    endFrame: 180,
    startScale: 1.0,
    endScale: 1.3,
    originXPercent: 50,
    originYPercent: 40,
    direction: "in",
  });

  // Control panel slide
  const panelSlide = spring({
    frame: Math.max(0, frame - 180),
    fps,
    config: FILMTONE_SPRING,
  });
  const panelTranslateX = interpolate(panelSlide, [0, 1], [200, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const browserTone: ProofPreviewTone = {
    base: ["#394760", "#1f2937"],
    grade: ["#f0cc84", "#7c4820"],
    rightLabel: "Cinematic",
  };

  return (
    <BeatFrame durationInFrames={beatFrames.browser} transition="hardIn">
      <AbsoluteFill
        style={{
          padding: `${SAFE_ZONE.horizontal.top}px ${SAFE_ZONE.horizontal.left}px`,
          background:
            "radial-gradient(circle at 70% 0%, rgba(217, 119, 6, 0.16) 0%, rgba(12, 10, 9, 0) 34%), #0c0a09",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontFamily: FONTS.inter,
            fontSize: TYPE_SCALE.heading + 6,
            lineHeight: 1.02,
            fontWeight: 700,
            color: COLORS.warmWhite,
            maxWidth: 720,
          }}
        >
          Start in your browser.
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            gap: 28,
            flex: 1,
            alignItems: "stretch",
          }}
        >
          {/* Browser window */}
          <div
            style={{
              flex: 1.2,
              transform: `scale(${shellScale})`,
              transformOrigin: "center center",
            }}
          >
            <WindowShell caption="web / filmtone" variant="browser">
              {/* URL bar */}
              <div
                style={{
                  padding: "8px 18px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(255,255,255,0.04)",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontFamily: FONTS.inter,
                    fontSize: 13,
                    color: "rgba(255,255,255,0.5)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span>{typing.visibleText}</span>
                  {typing.showCursor ? (
                    <span
                      style={{
                        display: "inline-block",
                        width: 1,
                        height: 14,
                        backgroundColor: COLORS.amber,
                        marginLeft: 1,
                      }}
                    />
                  ) : null}
                </div>
              </div>

              {/* Canvas with zoom */}
              <div
                style={{
                  overflow: "hidden",
                  transform:
                    frame >= 120
                      ? `scale(${canvasZoom.scale})`
                      : undefined,
                  transformOrigin:
                    frame >= 120
                      ? `${canvasZoom.originX} ${canvasZoom.originY}`
                      : undefined,
                }}
              >
                {/* Image drop animation */}
                <div
                  style={{
                    transform: `translateY(${imageDropY}px)`,
                    opacity: imageDropProgress,
                  }}
                >
                  <ComparePlate
                    tone={browserTone}
                    dividerProgress={dividerProgress}
                    showSweep={frame >= 75 && frame < 120}
                  />
                </div>
              </div>

              {/* Preset strip */}
              <PresetStrip startFrame={75} />
            </WindowShell>
          </div>

          {/* Control panel — slides in from right */}
          <div
            style={{
              width: 420,
              borderRadius: 28,
              border: "1px solid rgba(255,255,255,0.08)",
              background:
                "linear-gradient(180deg, rgba(28, 25, 23, 0.96) 0%, rgba(18, 15, 14, 0.96) 100%)",
              padding: "20px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              opacity: panelSlide,
              transform: `translateX(${panelTranslateX}px)`,
            }}
          >
            <div
              style={{
                fontFamily: FONTS.inter,
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: COLORS.textSubtle,
                marginBottom: 4,
              }}
            >
              control panel
            </div>
            {panelCards.map((card, index) => (
              <PanelCard key={card.title} definition={card} index={index} />
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </BeatFrame>
  );
}

// ===========================================================================
// Beat 6: ProductionBeat (270f / 9s)
// 0-45f: desktop shell appears
// 45-120f: batch queue animation (6 rects, ~100ms stagger = 3f at 30fps)
// 120-180f: compare plate with slow FILMTONE_GENTLE sweep
// 180-225f: status chips pop (5f stagger)
// 225-270f: full result + vignette
// ===========================================================================

function ProductionBeat(): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Desktop shell entrance
  const shellEntrance = spring({
    frame,
    fps,
    config: FILMTONE_SPRING,
  });
  const shellOpacity = interpolate(shellEntrance, [0, 0.3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shellScale = interpolate(shellEntrance, [0, 1], [0.92, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title appear
  const titleOpacity = filmtoneFadeIn(frame, 12, fps, 0.5);

  // Batch queue items
  const batchItems = [
    "IMG_2847.jpg",
    "IMG_2848.jpg",
    "IMG_2849.jpg",
    "DSC_0012.jpg",
    "DSC_0013.jpg",
    "DSC_0014.jpg",
  ];

  // Compare plate with slow sweep
  const slowDivider = spring({
    frame: Math.max(0, frame - 120),
    fps,
    config: FILMTONE_GENTLE,
    durationInFrames: 90,
  });
  const slowDividerProgress = interpolate(slowDivider, [0, 1], [0.15, 0.62], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Status chips
  const statusChips = ["ProRes 422 HQ", "Batch Complete", "Export verified"];

  // Typing animation for "Processing..."
  const processingTyping = getTypingState(
    "Processing...",
    frame,
    60,
    fps,
    12,
  );

  // Vignette
  const vignetteOpacity = interpolate(frame, [225, 270], [0, 0.12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const productionToneLocal: ProofPreviewTone = {
    base: ["#263240", "#1a1d24"],
    grade: ["#f4d58e", "#6b3d1c"],
    rightLabel: "Desktop refine",
  };

  return (
    <BeatFrame durationInFrames={beatFrames.production} transition="soft">
      <AbsoluteFill
        style={{
          padding: `${SAFE_ZONE.horizontal.top}px ${SAFE_ZONE.horizontal.left}px`,
          backgroundColor: COLORS.bgDeep,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontFamily: FONTS.inter,
            fontSize: TYPE_SCALE.heading + 6,
            lineHeight: 1.02,
            fontWeight: 700,
            color: COLORS.warmWhite,
            maxWidth: 720,
            opacity: titleOpacity,
          }}
        >
          Go deeper in Desktop.
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            gap: 28,
            flex: 1,
            alignItems: "stretch",
            opacity: shellOpacity,
            transform: `scale(${shellScale})`,
            transformOrigin: "center top",
          }}
        >
          {/* Desktop window */}
          <div style={{ flex: 1.1, display: "flex", flexDirection: "column" }}>
            <WindowShell caption="desktop / production" variant="desktop">
              {/* Batch queue (45-120f) */}
              {frame >= 45 && frame < 180 ? (
                <div
                  style={{
                    padding: "12px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONTS.inter,
                      fontSize: 11,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: COLORS.textSubtle,
                      marginBottom: 4,
                    }}
                  >
                    batch queue
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {batchItems.map((item, index) => {
                      const itemEntrance = spring({
                        frame: Math.max(0, frame - 45 - index * 3),
                        fps,
                        config: FILMTONE_QUICK,
                      });
                      return (
                        <div
                          key={item}
                          style={{
                            height: 36,
                            borderRadius: 10,
                            border: "1px solid rgba(255,255,255,0.08)",
                            backgroundColor: "rgba(255,255,255,0.03)",
                            padding: "0 12px",
                            display: "flex",
                            alignItems: "center",
                            fontFamily: FONTS.inter,
                            fontSize: 11,
                            color: COLORS.textMuted,
                            opacity: itemEntrance,
                            transform: `translateX(${interpolate(itemEntrance, [0, 1], [20, 0])}px)`,
                          }}
                        >
                          {item}
                        </div>
                      );
                    })}
                  </div>
                  {/* Processing text */}
                  {frame >= 60 ? (
                    <div
                      style={{
                        fontFamily: FONTS.inter,
                        fontSize: 12,
                        color: COLORS.amber,
                        marginTop: 4,
                      }}
                    >
                      {processingTyping.visibleText}
                      {processingTyping.showCursor ? (
                        <span
                          style={{
                            display: "inline-block",
                            width: 1,
                            height: 12,
                            backgroundColor: COLORS.amber,
                            marginLeft: 1,
                            verticalAlign: "middle",
                          }}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Compare plate with slow sweep (120-270f) */}
              {frame >= 120 ? (
                <ComparePlate
                  tone={productionToneLocal}
                  dividerProgress={slowDividerProgress}
                />
              ) : null}

              {/* Status chips (180-225f) */}
              {frame >= 180 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 10,
                    padding: "16px 18px 18px",
                  }}
                >
                  {statusChips.map((chip, index) => {
                    const chipProgress = spring({
                      frame: Math.max(0, frame - 180 - index * 5),
                      fps,
                      config: FILMTONE_POP,
                    });
                    return (
                      <div
                        key={chip}
                        style={{
                          borderRadius: 14,
                          border: "1px solid rgba(255,255,255,0.08)",
                          background:
                            index === 2
                              ? "rgba(217,119,6,0.18)"
                              : "rgba(255,255,255,0.04)",
                          padding: "10px 12px",
                          fontFamily: FONTS.inter,
                          fontSize: 13,
                          color: COLORS.textPrimary,
                          opacity: chipProgress,
                          transform: `scale(${interpolate(chipProgress, [0, 1], [0.8, 1])})`,
                        }}
                      >
                        {chip}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </WindowShell>
          </div>

          {/* Side cards */}
          <div
            style={{
              width: 420,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {productionCards.map((card, index) => (
              <PanelCard key={card.title} definition={card} index={index} />
            ))}
          </div>
        </div>
      </AbsoluteFill>

      {/* Vignette overlay */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,1) 100%)",
          opacity: vignetteOpacity,
          pointerEvents: "none",
        }}
      />
    </BeatFrame>
  );
}

// ===========================================================================
// Beat 7: CloseBeat (210f / 7s)
// 0-2f: black flash (from Production boundary)
// 2-47f: montage burst (10 tones, 2f each = 20f + some hold)
// 47-107f: FILMTONE logo pop + amber line
// 107-180f: tagline + bullets
// 180-210f: final hold
// ===========================================================================

function CloseBeat(): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Black flash at boundary
  const blackFlashActive = isBlackFlash(frame, 0, 2);

  // Montage burst (2-47f)
  const CLOSE_BURST_START = 2;
  const CLOSE_BURST_COUNT = 10;
  const closeBurstIndex = getMontageBurstIndex(
    frame,
    CLOSE_BURST_START,
    CLOSE_BURST_COUNT,
    2,
  );
  const inCloseBurst = frame >= CLOSE_BURST_START && frame < 47;
  const activeBurstTone =
    closeBurstIndex >= 0
      ? closeBurstTones[Math.min(closeBurstIndex, closeBurstTones.length - 1)]
      : null;

  // Hold on last burst tone for remaining burst frames
  const burstHoldStart = CLOSE_BURST_START + CLOSE_BURST_COUNT * 2; // frame 22
  const inBurstHold = frame >= burstHoldStart && frame < 47;

  // Logo pop (FILMTONE_POP, scale 3 -> 1)
  const logoProgress = spring({
    frame: Math.max(0, frame - 47),
    fps,
    config: FILMTONE_POP,
  });
  const logoScale = interpolate(logoProgress, [0, 1], [3, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Amber line width
  const lineWidth = interpolate(frame, [47, 90], [0, 280], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Tagline
  const taglineOpacity = filmtoneFadeIn(frame, 75, fps, 0.5);

  // CTA
  const ctaOpacity = filmtoneFadeIn(frame, 110, fps, 0.5);

  // Varying dividers for close burst
  const closeBurstDividers = [
    0.58, 0.62, 0.55, 0.60, 0.63, 0.57, 0.61, 0.59, 0.64, 0.56,
  ];

  return (
    <BeatFrame durationInFrames={beatFrames.close} transition="hardOut">
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 10%, rgba(255, 243, 199, 0.10) 0%, rgba(12, 10, 9, 0) 34%), #0c0a09",
          overflow: "hidden",
        }}
      >
        <AmbientDust count={10} />

        {/* Black flash */}
        {blackFlashActive ? (
          <AbsoluteFill style={{ backgroundColor: "#000000", zIndex: 10 }} />
        ) : null}

        {/* Montage burst (2-47f) */}
        {inCloseBurst && !blackFlashActive && activeBurstTone ? (
          <AbsoluteFill
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: `${SAFE_ZONE.horizontal.top}px ${SAFE_ZONE.horizontal.left}px`,
            }}
          >
            <div
              style={{
                width: "100%",
                borderRadius: 28,
                overflow: "hidden",
              }}
            >
              <WindowShell caption={activeBurstTone.rightLabel} width={1760}>
                <ComparePlate
                  tone={
                    inBurstHold
                      ? closeBurstTones[closeBurstTones.length - 1]
                      : activeBurstTone
                  }
                  dividerProgress={
                    closeBurstDividers[
                      Math.max(0, Math.min(closeBurstIndex, closeBurstDividers.length - 1))
                    ] ?? 0.58
                  }
                  showSweep={false}
                />
              </WindowShell>
            </div>
          </AbsoluteFill>
        ) : null}

        {/* Logo + text section (47f onwards) */}
        {frame >= 47 && !inCloseBurst ? (
          <AbsoluteFill
            style={{
              padding: `${SAFE_ZONE.horizontal.top}px ${SAFE_ZONE.horizontal.left}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 24,
              }}
            >
              {/* Amber line */}
              <div
                style={{
                  height: 2,
                  width: lineWidth,
                  background:
                    "linear-gradient(90deg, rgba(217,119,6,0.95) 0%, rgba(254,243,199,0.95) 100%)",
                }}
              />

              {/* FILMTONE logo */}
              <div
                style={{
                  fontFamily: FONTS.inter,
                  fontSize: 96,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: COLORS.warmWhite,
                  opacity: logoProgress,
                  transform: `scale(${logoScale})`,
                  textShadow:
                    "0 0 60px rgba(254,243,199,0.15), 0 4px 40px rgba(0,0,0,0.6)",
                }}
              >
                FILMTONE
              </div>

              {/* Tagline */}
              <div
                style={{
                  fontFamily: FONTS.inter,
                  fontSize: 32,
                  color: COLORS.textPrimary,
                  opacity: taglineOpacity,
                  marginTop: -4,
                }}
              >
                Film looks for photos and video.
              </div>

              {/* CTA */}
              <div
                style={{
                  fontFamily: FONTS.inter,
                  fontSize: 28,
                  color: COLORS.warmWhite,
                  opacity: ctaOpacity,
                  marginTop: 16,
                }}
              >
                Try it free. See it first.
              </div>

              {/* Bullets */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  alignItems: "center",
                  marginTop: 8,
                }}
              >
                {closeBullets.map((bullet, index) => {
                  const opacity = filmtoneFadeIn(
                    frame,
                    110 + index * 5,
                    fps,
                    0.6,
                  );
                  return (
                    <div
                      key={bullet.title}
                      style={{
                        opacity,
                        display: "flex",
                        gap: 14,
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: "50%",
                          backgroundColor: COLORS.amber,
                        }}
                      />
                      <div
                        style={{
                          fontFamily: FONTS.inter,
                          fontSize: 24,
                          fontWeight: 600,
                          color: COLORS.textPrimary,
                        }}
                      >
                        {bullet.title}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </AbsoluteFill>
        ) : null}
      </AbsoluteFill>
    </BeatFrame>
  );
}

// ===========================================================================
// Master Composition
// ===========================================================================

export function LaunchIntegrationPrototype(): React.ReactElement {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDeep }}>
      <Sequence from={beatOffsets.hook} durationInFrames={beatFrames.hook}>
        <HookBeat />
      </Sequence>
      <Sequence
        from={beatOffsets.showcase}
        durationInFrames={beatFrames.showcase}
      >
        <ShowcaseBeat />
      </Sequence>
      <Sequence from={beatOffsets.scope} durationInFrames={beatFrames.scope}>
        <ScopeBeat />
      </Sequence>
      <Sequence from={beatOffsets.detail} durationInFrames={beatFrames.detail}>
        <DetailBeat />
      </Sequence>
      <Sequence
        from={beatOffsets.browser}
        durationInFrames={beatFrames.browser}
      >
        <BrowserBeat />
      </Sequence>
      <Sequence
        from={beatOffsets.production}
        durationInFrames={beatFrames.production}
      >
        <ProductionBeat />
      </Sequence>
      <Sequence from={beatOffsets.close} durationInFrames={beatFrames.close}>
        <CloseBeat />
      </Sequence>
    </AbsoluteFill>
  );
}

export { launchIntegrationPrototypeDurationInFrames };
