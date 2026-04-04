/**
 * #6 CTA Overlay — Phase 1 R&D
 *
 * Source: remotion.dev/prompts/transparent-call-to-action-overlay
 * Duration: 5s (150 frames @ 30fps)
 * Resolution: 1920x1080
 * Output: ProRes 4444 (alpha channel)
 *
 * 習得技法:
 * - ProRes alpha export (DaVinci Resolve pipeline)
 * - slide-in animation (ease-out from bottom)
 * - spring bounce exit
 *
 * Launch video カット対応:
 * - Cut 10 (エンドカード): logo + URL + CTA spring bounce
 * - 全カットのオーバーレイ部品として再利用
 */
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from "remotion";
import { COLORS } from "../../lib/colors";
import { FILMTONE_SPRING, FILMTONE_GENTLE } from "../../lib/springs";
import { FONTS } from "../../lib/typography";
import { filmtoneFadeIn } from "../../lib/transitions";

/** Slide distance in pixels — panel travels this far from below the frame */
const SLIDE_DISTANCE = 200;

/** Panel geometry */
const PANEL_BOTTOM_OFFSET = 80;
const PANEL_HORIZONTAL_PADDING = 48;
const PANEL_VERTICAL_PADDING = 20;
const PANEL_BORDER_RADIUS = 12;
const ACCENT_LINE_HEIGHT = 2;

/** Timeline keyframes (frame numbers at 30fps) */
const ENTER_START = 0;
const HOLD_START = 30;
const EXIT_START = 105;

export const CtaOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Entry: spring slide-up with FILMTONE_GENTLE (0.8s ease-out feel) ---
  const enterProgress = spring({
    frame,
    fps,
    config: FILMTONE_GENTLE,
    durationInFrames: HOLD_START,
  });

  // --- Exit: spring slide-down with FILMTONE_SPRING (faster, more energy) ---
  const exitProgress = spring({
    frame: frame - EXIT_START,
    fps,
    config: FILMTONE_SPRING,
    durationInFrames: 45, // ~1.5s spring for complete exit
  });

  // Combine: entry drives 0->1, exit drives 1->0
  const isExiting = frame >= EXIT_START;
  const slideProgress = isExiting ? 1 - exitProgress : enterProgress;

  // Map progress to translateY: 1 = fully visible (0px), 0 = off-screen (200px)
  const translateY = interpolate(slideProgress, [0, 1], [SLIDE_DISTANCE, 0]);

  // Panel opacity follows slide but leads by a few frames (CD guardrail)
  const opacity = isExiting
    ? interpolate(
        frame,
        [EXIT_START, EXIT_START + fps * 0.5],
        [1, 0],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.in(Easing.cubic),
        },
      )
    : filmtoneFadeIn(frame, ENTER_START, fps, 0.6);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.transparent }}>
      {/* Lower-third panel */}
      <div
        style={{
          position: "absolute",
          bottom: PANEL_BOTTOM_OFFSET,
          left: "50%",
          transform: `translateX(-50%) translateY(${translateY}px)`,
          opacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
        }}
      >
        {/* Amber accent line — top edge */}
        <div
          style={{
            height: ACCENT_LINE_HEIGHT,
            backgroundColor: COLORS.amber,
            borderRadius: `${PANEL_BORDER_RADIUS}px ${PANEL_BORDER_RADIUS}px 0 0`,
          }}
        />

        {/* Panel body */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 48,
            padding: `${PANEL_VERTICAL_PADDING}px ${PANEL_HORIZONTAL_PADDING}px`,
            backgroundColor: "rgba(12, 10, 9, 0.85)",
            borderRadius: `0 0 ${PANEL_BORDER_RADIUS}px ${PANEL_BORDER_RADIUS}px`,
          }}
        >
          {/* Left: Filmtone logo text */}
          <span
            style={{
              fontFamily: FONTS.inter,
              fontWeight: 600,
              fontSize: 40,
              color: COLORS.cream,
              whiteSpace: "nowrap",
            }}
          >
            Filmtone
          </span>

          {/* Right: CTA text */}
          <span
            style={{
              fontFamily: FONTS.inter,
              fontWeight: 400,
              fontSize: 36,
              color: COLORS.textPrimary,
              whiteSpace: "nowrap",
            }}
          >
            Try free at filmtone.app
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
