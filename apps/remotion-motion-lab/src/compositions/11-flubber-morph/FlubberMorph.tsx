/**
 * #11 Flubber Morph — Phase 2 R&D
 *
 * Duration: 10s (300 frames @ 30fps)
 * Resolution: 1920x1080
 *
 * Techniques learned:
 * - SVG path morphing via flubber.interpolate()
 * - Ghost trail (afterimage / "消え際の残像") — motion signature
 * - Breathing idle (sin-wave scale)
 * - Spring-based jump + wipe exit
 *
 * 4 phases:
 *   A (0-2s)   Breathing Idle — 6 shapes with gentle scale oscillation
 *   B (2-5s)   Morph Jump    — shapes jump + morph into letters + ghost trails
 *   C (5-7s)   Letter Settle — glow pulse, subtle breathing
 *   D (7-10s)  Wipe Exit     — amber wiper erases letters, "Filmtone" fade-in
 *
 * Launch video cut mapping:
 * - Cut 1, 2, 3, 5, 7 (B/A transitions): morph technique foundation
 * - Ghost trail adapted for Before/After color transition afterimages
 */
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { interpolate as flubberInterpolate } from "flubber";
import type { Interpolator } from "flubber";
import { COLORS } from "../../lib/colors";
import { filmtoneFadeIn } from "../../lib/transitions";
import { FONTS } from "../../lib/typography";

/* ━━ Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const SHAPE_COUNT = 6;
const SHAPE_SPACING = 120;
const TOTAL_WIDTH = (SHAPE_COUNT - 1) * SHAPE_SPACING;

/** Warm fills — Filmtone CD guardrail: amber/cream/warm only */
const SHAPE_FILLS = [
  COLORS.amber,
  COLORS.cream,
  "#c2884d", // warm bronze
  COLORS.warmWhite,
  "#b45309", // amber muted / deep honey
  COLORS.cream,
] as const;

/* ── Phase timing (frame ranges) ─────────────────────────────────────────── */
const PHASE = {
  A: { start: 0, end: 59 },
  B: { start: 60, end: 149 },
  C: { start: 150, end: 209 },
  D: { start: 210, end: 299 },
} as const;

const MORPH_STAGGER = 5; // frames between each shape's morph start

/* ── Ghost trail config ──────────────────────────────────────────────────── */
const GHOST_DELAYS = [2, 5, 9]; // frames behind current
const GHOST_OPACITIES = [0.3, 0.2, 0.1];

/* ━━ SVG Paths — Geometric Shapes (approx 100px bounding) ━━━━━━━━━━━━━━━━ */

/** Circle — r=45 centered at origin */
const CIRCLE_PATH =
  "M 0,-45 C 24.85,-45 45,-24.85 45,0 C 45,24.85 24.85,45 0,45 C -24.85,45 -45,24.85 -45,0 C -45,-24.85 -24.85,-45 0,-45 Z";

/** Pentagon — r=45 */
const PENTAGON_PATH = (() => {
  const pts = Array.from({ length: 5 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    return `${45 * Math.cos(angle)},${45 * Math.sin(angle)}`;
  });
  return `M ${pts[0]} L ${pts[1]} L ${pts[2]} L ${pts[3]} L ${pts[4]} Z`;
})();

/** Hexagon — r=45 */
const HEXAGON_PATH = (() => {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    return `${45 * Math.cos(angle)},${45 * Math.sin(angle)}`;
  });
  return `M ${pts[0]} L ${pts[1]} L ${pts[2]} L ${pts[3]} L ${pts[4]} L ${pts[5]} Z`;
})();

/** Triangle — equilateral, fits in ~90px */
const TRIANGLE_PATH = "M 0,-45 L 39,22.5 L -39,22.5 Z";

/** Square — 80x80 centered */
const SQUARE_PATH = "M -40,-40 L 40,-40 L 40,40 L -40,40 Z";

/** Diamond — 80x90 centered */
const DIAMOND_PATH = "M 0,-45 L 40,0 L 0,45 L -40,0 Z";

const SHAPE_PATHS = [
  CIRCLE_PATH,
  PENTAGON_PATH,
  HEXAGON_PATH,
  TRIANGLE_PATH,
  SQUARE_PATH,
  DIAMOND_PATH,
] as const;

/* ━━ SVG Paths — Block Letters (simplified, ~90px tall, centered at origin) */

/** F — block capital */
const LETTER_F =
  "M -30,-45 L 30,-45 L 30,-30 L -15,-30 L -15,-8 L 20,-8 L 20,7 L -15,7 L -15,45 L -30,45 Z";

/** I — block capital */
const LETTER_I =
  "M -20,-45 L 20,-45 L 20,-30 L 7.5,-30 L 7.5,30 L 20,30 L 20,45 L -20,45 L -20,30 L -7.5,30 L -7.5,-30 L -20,-30 Z";

/** L — block capital */
const LETTER_L =
  "M -25,-45 L -10,-45 L -10,30 L 30,30 L 30,45 L -25,45 Z";

/** M — block capital */
const LETTER_M =
  "M -35,-45 L -18,-45 L 0,-10 L 18,-45 L 35,-45 L 35,45 L 20,45 L 20,-18 L 3,18 L -3,18 L -20,-18 L -20,45 L -35,45 Z";

/** T — block capital */
const LETTER_T =
  "M -30,-45 L 30,-45 L 30,-30 L 7.5,-30 L 7.5,45 L -7.5,45 L -7.5,-30 L -30,-30 Z";

/** O — block capital (with cutout approximated as a single ring) */
const LETTER_O =
  "M -25,-45 L 25,-45 L 35,-35 L 35,35 L 25,45 L -25,45 L -35,35 L -35,-35 Z M -18,-30 L -18,30 L 18,30 L 18,-30 Z";

const LETTER_PATHS = [
  LETTER_F,
  LETTER_I,
  LETTER_L,
  LETTER_M,
  LETTER_T,
  LETTER_O,
] as const;

/* ━━ Pre-computed flubber interpolators ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/**
 * flubber.interpolate is expensive to call repeatedly.
 * We build one interpolator per shape->letter pair at module scope.
 *
 * Note: Letter "O" has a hole (two sub-paths). flubber handles single
 * rings best, so we use splitPathString-safe shapes. For "O" we use
 * the outer ring only to avoid flubber errors with multi-ring paths.
 */
const LETTER_O_OUTER =
  "M -25,-45 L 25,-45 L 35,-35 L 35,35 L 25,45 L -25,45 L -35,35 L -35,-35 Z";

const LETTER_PATHS_SAFE = [
  LETTER_F,
  LETTER_I,
  LETTER_L,
  LETTER_M,
  LETTER_T,
  LETTER_O_OUTER,
] as const;

const morphers: Interpolator[] = SHAPE_PATHS.map((shapePath, i) =>
  flubberInterpolate(shapePath, LETTER_PATHS_SAFE[i], {
    maxSegmentLength: 10,
  }),
);

/* ━━ Subtle Grid Background ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const SubtleGrid: React.FC = () => {
  const gridSize = 60;
  const cols = Math.ceil(1920 / gridSize);
  const rows = Math.ceil(1080 / gridSize);

  const lines: React.ReactElement[] = [];
  for (let c = 1; c < cols; c++) {
    lines.push(
      <line
        key={`v${c}`}
        x1={c * gridSize}
        y1={0}
        x2={c * gridSize}
        y2={1080}
        stroke={COLORS.textPrimary}
        strokeOpacity={0.05}
        strokeWidth={1}
      />,
    );
  }
  for (let r = 1; r < rows; r++) {
    lines.push(
      <line
        key={`h${r}`}
        x1={0}
        y1={r * gridSize}
        x2={1920}
        y2={r * gridSize}
        stroke={COLORS.textPrimary}
        strokeOpacity={0.05}
        strokeWidth={1}
      />,
    );
  }

  return (
    <svg
      width={1920}
      height={1080}
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      {lines}
    </svg>
  );
};

/* ━━ Single Morphing Shape ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const MorphShape: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const morpher = morphers[index];
  const fill = SHAPE_FILLS[index];
  const stagger = index * MORPH_STAGGER;

  // Base X position (centered row)
  const cx = 1920 / 2 - TOTAL_WIDTH / 2 + index * SHAPE_SPACING;
  const cy = 1080 / 2;

  /* ── Phase A: Breathing idle ─────────────────────────────────────────── */
  const breathPhase = index * 0.7; // phase offset per shape
  const breathScale =
    1.0 + 0.05 * Math.sin((frame / fps) * Math.PI * 2 * 0.5 + breathPhase);

  /* ── Phase B: Morph + Jump ───────────────────────────────────────────── */
  const morphStart = PHASE.B.start + stagger;
  const morphDuration = PHASE.B.end - morphStart;

  // Spring for the jump (damping 14 — playful)
  const jumpSpring = spring({
    frame: frame - morphStart,
    fps,
    config: { damping: 14, stiffness: 140, mass: 1.0 },
    durationInFrames: morphDuration,
  });

  // Morph progress (0 -> 1) synchronized with spring
  const morphProgress = interpolate(
    frame,
    [morphStart, morphStart + morphDuration * 0.85],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Determine current path
  const isInOrAfterB = frame >= morphStart;
  const currentPath = isInOrAfterB
    ? morpher(Math.min(morphProgress, 1))
    : SHAPE_PATHS[index];

  // Jump translateY
  const jumpY = isInOrAfterB ? -100 * jumpSpring : 0;

  // Rotation during jump (0 -> 180 degrees)
  const rotation = isInOrAfterB ? 180 * jumpSpring : 0;

  /* ── Phase C: Letter settle — glow pulse + subtle breath ─────────────── */
  const isInC = frame >= PHASE.C.start && frame <= PHASE.C.end;
  const settleBreath =
    1.0 +
    0.02 *
      Math.sin(
        ((frame - PHASE.C.start) / fps) * Math.PI * 2 * 0.8 + breathPhase,
      );
  const glowIntensity = isInC
    ? 4 +
      2 *
        Math.sin(
          ((frame - PHASE.C.start) / fps) * Math.PI * 2 * 0.6 + breathPhase,
        )
    : 0;

  /* ── Phase D: Wipe exit ──────────────────────────────────────────────── */
  const wiperX = interpolate(
    frame,
    [PHASE.D.start, PHASE.D.end - 30],
    [-20, 1940],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Has the wiper passed this shape?
  const wiperPassed = wiperX > cx;

  // Snappy exit spring (damping 300 — very fast)
  const exitFrame = wiperPassed ? frame : 0;
  const exitTriggerFrame = wiperPassed
    ? Math.max(
        0,
        // Approximate frame when wiper reaches this shape
        PHASE.D.start +
          ((cx + 20) / 1960) * (PHASE.D.end - 30 - PHASE.D.start),
      )
    : 999;

  const exitSpring = wiperPassed
    ? spring({
        frame: frame - exitTriggerFrame,
        fps,
        config: { damping: 300, stiffness: 400, mass: 0.5 },
        durationInFrames: 15,
      })
    : 0;

  const exitScale = wiperPassed ? 1 - exitSpring : 1;
  const exitOpacity = wiperPassed ? 1 - exitSpring : 1;

  /* ── Resolve per-phase scale ─────────────────────────────────────────── */
  let scale: number;
  if (frame <= PHASE.A.end) {
    scale = breathScale;
  } else if (frame <= PHASE.B.end) {
    // During morph, settle to 1.0
    scale = 1.0;
  } else if (frame <= PHASE.C.end) {
    scale = settleBreath;
  } else {
    scale = exitScale;
  }

  /* ── Ghost trails (Phase B only) ─────────────────────────────────────── */
  const ghosts: React.ReactElement[] = [];
  if (frame >= morphStart && frame <= PHASE.B.end) {
    for (let g = 0; g < GHOST_DELAYS.length; g++) {
      const ghostFrame = frame - GHOST_DELAYS[g];
      if (ghostFrame < morphStart) continue;

      const ghostMorphDur = PHASE.B.end - morphStart;
      const ghostMorphProgress = interpolate(
        ghostFrame,
        [morphStart, morphStart + ghostMorphDur * 0.85],
        [0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      );
      const ghostPath = morpher(Math.min(ghostMorphProgress, 1));

      const ghostJumpProgress = interpolate(
        ghostFrame - morphStart,
        [0, ghostMorphDur],
        [0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      );
      // Approximate ghost Y offset — simpler than full spring recalculation
      const ghostJumpY = -100 * Math.min(ghostJumpProgress * 1.2, 1);
      const ghostRotation =
        180 * Math.min(ghostJumpProgress * 1.2, 1);

      ghosts.push(
        <g
          key={`ghost-${index}-${g}`}
          transform={`translate(${cx}, ${cy + ghostJumpY}) rotate(${ghostRotation}) scale(${1.0})`}
          opacity={GHOST_OPACITIES[g]}
          filter="url(#ghostBlur)"
        >
          <path d={ghostPath} fill={fill} />
        </g>,
      );
    }
  }

  /* ── Render ──────────────────────────────────────────────────────────── */
  const finalY = cy + jumpY;
  const filterStyle =
    glowIntensity > 0 ? `drop-shadow(0 0 ${glowIntensity}px ${COLORS.amber})` : undefined;

  return (
    <>
      {ghosts}
      <g
        transform={`translate(${cx}, ${finalY}) rotate(${rotation}) scale(${scale})`}
        opacity={exitOpacity}
        filter={filterStyle}
      >
        <path d={currentPath} fill={fill} />
      </g>
    </>
  );
};

/* ━━ Amber Wiper Bar (Phase D) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const AmberWiper: React.FC = () => {
  const frame = useCurrentFrame();

  if (frame < PHASE.D.start) return null;

  const wiperX = interpolate(
    frame,
    [PHASE.D.start, PHASE.D.end - 30],
    [-20, 1940],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Fade out the wiper after it has crossed the screen
  const wiperOpacity = interpolate(
    frame,
    [PHASE.D.end - 40, PHASE.D.end - 20],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: wiperX,
        width: 4,
        height: 1080,
        backgroundColor: COLORS.amber,
        opacity: wiperOpacity,
        boxShadow: `0 0 12px ${COLORS.amber}, 0 0 24px ${COLORS.amberMuted}`,
      }}
    />
  );
};

/* ━━ "Filmtone" End Text (Phase D, after wipe) ━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const FilmtoneEndText: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Start fade-in near the end of the wipe — frame 260
  const textStartFrame = 260;
  if (frame < textStartFrame) return null;

  const opacity = filmtoneFadeIn(frame, textStartFrame, fps, 1.0);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontFamily: FONTS.inter,
          fontSize: 72,
          fontWeight: 700,
          color: COLORS.cream,
          opacity,
          letterSpacing: "0.04em",
        }}
      >
        Filmtone
      </div>
    </AbsoluteFill>
  );
};

/* ━━ Main Composition ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export const FlubberMorph: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDeep }}>
      {/* Subtle grid background */}
      <SubtleGrid />

      {/* SVG layer — shapes, morphs, ghosts */}
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          <filter id="ghostBlur">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>

        {Array.from({ length: SHAPE_COUNT }, (_, i) => (
          <MorphShape key={i} index={i} />
        ))}
      </svg>

      {/* Amber wiper (Phase D) */}
      <AmberWiper />

      {/* "Filmtone" end text (Phase D, after wipe) */}
      <FilmtoneEndText />
    </AbsoluteFill>
  );
};
