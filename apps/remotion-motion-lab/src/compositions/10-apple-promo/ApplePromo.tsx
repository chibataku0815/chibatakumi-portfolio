/**
 * #10 Apple-style Promo — Phase 1 R&D
 *
 * Source: remotion.dev/prompts/promotion-video-for-vvterm
 * Duration: 20s (600 frames @ 30fps)
 * Resolution: 1920x1080
 *
 * 習得技法:
 * - Apple 的 fade-in typography (opacity + letter-spacing convergence)
 * - Multi-scene pacing (20s 5-scene structure)
 * - Minimal motion with maximum impact
 *
 * Launch video カット対応:
 * - Cut 4, 9 (UI フラッシュ): minimal motion pacing
 * - Cut 10 (エンドカード): fade-in typography for logo/URL
 * - 全体: multi-scene timing の基準
 */
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  interpolate,
} from "remotion";
import { COLORS } from "../../lib/colors";
import { filmtoneFadeIn, filmtoneFadeOut } from "../../lib/transitions";
import { FONTS } from "../../lib/typography";

/* ── Helper: letter-spacing convergence (0.02em -> 0em over fade-in) ─── */
function letterSpacing(
  frame: number,
  startFrame: number,
  fps: number,
  durationSec = 0.8,
): string {
  const em = interpolate(
    frame,
    [startFrame, startFrame + fps * durationSec],
    [0.02, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return `${em}em`;
}

/* ── Scene 1-3: Single-line hero text ──────────────────────────────────── */
const HeroLine: React.FC<{
  text: string;
  color: string;
  fadeOutStart: number;
  sceneDuration: number;
}> = ({ text, color, fadeOutStart, sceneDuration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = filmtoneFadeIn(frame, 0, fps);
  const fadeOut = filmtoneFadeOut(frame, fadeOutStart, fps);
  const opacity = Math.min(fadeIn, fadeOut);

  return (
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
          fontSize: 72,
          fontWeight: 600,
          color,
          opacity,
          letterSpacing: letterSpacing(frame, 0, fps),
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

/* ── Scene 4: Feature highlights (staggered 3-line stack) ──────────────── */
const FEATURES = [
  "7 classic film stocks",
  "Real-time preview in your browser",
  "No download required",
] as const;

const FeatureHighlights: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Stagger: 3 frames (100ms @ 30fps) between each line
  const staggerFrames = 3;
  // All three fade out together starting at frame 480 relative to scene start
  // Scene 4 starts at frame 360, so relative fade-out start = 480 - 360 = 120
  const fadeOutStartRelative = 120;
  const fadeOut = filmtoneFadeOut(frame, fadeOutStartRelative, fps);

  return (
    <AbsoluteFill
      style={{
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
          gap: 32,
        }}
      >
        {FEATURES.map((text, i) => {
          const lineStart = i * staggerFrames;
          const fadeIn = filmtoneFadeIn(frame, lineStart, fps);
          return (
            <div
              key={text}
              style={{
                fontFamily: FONTS.inter,
                fontSize: 40,
                fontWeight: 400,
                color: COLORS.textPrimary,
                opacity: Math.min(fadeIn, fadeOut),
                letterSpacing: letterSpacing(frame, lineStart, fps),
              }}
            >
              {text}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ── Scene 5: End card (logo + URL, staggered) ─────────────────────────── */
const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoOpacity = filmtoneFadeIn(frame, 0, fps);
  const urlOpacity = filmtoneFadeIn(frame, 10, fps);

  return (
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
          fontSize: 64,
          fontWeight: 700,
          color: COLORS.cream,
          opacity: logoOpacity,
          letterSpacing: letterSpacing(frame, 0, fps),
        }}
      >
        Filmtone
      </div>
      <div
        style={{
          fontFamily: FONTS.inter,
          fontSize: 36,
          fontWeight: 400,
          color: COLORS.textMuted,
          opacity: urlOpacity,
          letterSpacing: letterSpacing(frame, 10, fps),
        }}
      >
        filmtone.app
      </div>
    </AbsoluteFill>
  );
};

/* ── Main composition ──────────────────────────────────────────────────── */
export const ApplePromo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDeep }}>
      {/* Scene 1 (0-4s): "Your photos." */}
      <Sequence from={0} durationInFrames={120}>
        <HeroLine
          text="Your photos."
          color={COLORS.textPrimary}
          fadeOutStart={90}
          sceneDuration={120}
        />
      </Sequence>

      {/* Scene 2 (4-8s): "Film looks." */}
      <Sequence from={120} durationInFrames={120}>
        <HeroLine
          text="Film looks."
          color={COLORS.cream}
          fadeOutStart={90}
          sceneDuration={120}
        />
      </Sequence>

      {/* Scene 3 (8-12s): "Before you pay." — emotional peak (amber) */}
      <Sequence from={240} durationInFrames={120}>
        <HeroLine
          text="Before you pay."
          color={COLORS.amber}
          fadeOutStart={96}
          sceneDuration={120}
        />
      </Sequence>

      {/* Scene 4 (12-17s): Feature highlights */}
      <Sequence from={360} durationInFrames={150}>
        <FeatureHighlights />
      </Sequence>

      {/* Scene 5 (17-20s): End card — holds until video end */}
      <Sequence from={510} durationInFrames={90}>
        <EndCard />
      </Sequence>
    </AbsoluteFill>
  );
};
