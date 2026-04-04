/**
 * #9 Bar + Line Chart — Phase 1 R&D
 *
 * Source: remotion.dev/prompts/bar-line-chart-combined
 * Duration: 4s (120 frames @ 30fps)
 * Resolution: 1920x1080
 *
 * 習得技法:
 * - spring timing (sequential bar animation)
 * - interpolate (progressive line draw)
 * - glow effect (CSS filter)
 *
 * Launch video カット対応:
 * - Cut 6 (テクスチャ接写): glow/bloom effect
 * - Cut 8 (プリセット一覧): sequential animation timing
 */
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Easing } from "remotion";
import { COLORS } from "../../lib/colors";
import { FILMTONE_SPRING } from "../../lib/springs";

/* ---------- Data ---------- */
const REVENUE_DATA = [
  { month: "Jan", value: 8000 },
  { month: "Feb", value: 12000 },
  { month: "Mar", value: 15000 },
  { month: "Apr", value: 11000 },
  { month: "May", value: 18000 },
  { month: "Jun", value: 22000 },
] as const;

const CONVERSION_DATA = [2.1, 2.8, 3.2, 2.9, 3.8, 4.2] as const;

const MAX_REVENUE = 22000;
const MAX_CONVERSION = 5.0; // ceiling for Y-axis scaling

/* ---------- Layout constants ---------- */
const CHART_LEFT = 200;
const CHART_RIGHT = 1720;
const CHART_TOP = 120;
const CHART_BOTTOM = 880;
const CHART_WIDTH = CHART_RIGHT - CHART_LEFT;
const CHART_HEIGHT = CHART_BOTTOM - CHART_TOP;
const BAR_COUNT = REVENUE_DATA.length;
const BAR_GAP = CHART_WIDTH / BAR_COUNT;
const BAR_WIDTH = BAR_GAP * 0.55;

/* ---------- Timing ---------- */
const BAR_STAGGER = 3; // frames between each bar start
const BAR_START_FRAME = 8; // slight delay before first bar
const LINE_START_FRAME = 55; // line begins after bars are mostly grown
const LINE_DURATION = 40; // frames for full line draw
const DOT_PULSE_START = LINE_START_FRAME + LINE_DURATION;

/* ---------- Helpers ---------- */
function getBarX(index: number): number {
  return CHART_LEFT + BAR_GAP * index + BAR_GAP / 2;
}

function getConversionY(value: number): number {
  return CHART_BOTTOM - (value / MAX_CONVERSION) * CHART_HEIGHT;
}

function getRevenueY(value: number): number {
  return CHART_BOTTOM - (value / MAX_REVENUE) * CHART_HEIGHT;
}

function formatCurrency(value: number): string {
  return `$${(value / 1000).toFixed(0)}K`;
}

export const BarLineChart: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  /* --- Title fade-in --- */
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  /* --- Line draw progress (0..1) --- */
  const lineProgress = interpolate(
    frame,
    [LINE_START_FRAME, LINE_START_FRAME + LINE_DURATION],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) },
  );

  /* --- Dot pulse (endpoint marker) --- */
  const dotPulseRaw = interpolate(
    frame,
    [DOT_PULSE_START, DOT_PULSE_START + 30],
    [0, Math.PI * 4], // 2 full pulse cycles
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const dotScale = frame >= DOT_PULSE_START ? 1 + Math.sin(dotPulseRaw) * 0.25 : 0;

  /* --- Build line points --- */
  const linePoints = CONVERSION_DATA.map((v, i) => ({
    x: getBarX(i),
    y: getConversionY(v),
  }));

  /* --- Build visible portion of polyline based on lineProgress --- */
  const visibleLinePoints = buildProgressiveLine(linePoints, lineProgress);

  /* --- Y-axis grid lines (revenue side) --- */
  const gridValues = [0, 5000, 10000, 15000, 20000];

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDeep }}>
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 36,
          left: CHART_LEFT,
          opacity: titleOpacity,
          fontFamily: "Inter, sans-serif",
          fontSize: 32,
          fontWeight: 700,
          color: COLORS.textPrimary,
          letterSpacing: "0.02em",
        }}
      >
        Monthly Revenue & Conversion Rate
      </div>

      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {/* Grid lines */}
        {gridValues.map((gv) => {
          const y = getRevenueY(gv);
          return (
            <g key={gv}>
              <line
                x1={CHART_LEFT}
                y1={y}
                x2={CHART_RIGHT}
                y2={y}
                stroke={COLORS.bgBorder}
                strokeWidth={1}
              />
              <text
                x={CHART_LEFT - 16}
                y={y + 5}
                textAnchor="end"
                fill={COLORS.textSubtle}
                fontSize={20}
                fontFamily="Inter, sans-serif"
              >
                {formatCurrency(gv)}
              </text>
            </g>
          );
        })}

        {/* Baseline */}
        <line
          x1={CHART_LEFT}
          y1={CHART_BOTTOM}
          x2={CHART_RIGHT}
          y2={CHART_BOTTOM}
          stroke={COLORS.bgBorder}
          strokeWidth={2}
        />

        {/* Bars */}
        {REVENUE_DATA.map((d, i) => {
          const barDelay = BAR_START_FRAME + i * BAR_STAGGER;
          const barProgress = spring({
            frame: frame - barDelay,
            fps,
            config: FILMTONE_SPRING,
            durationInFrames: 40,
          });
          const barH = (d.value / MAX_REVENUE) * CHART_HEIGHT * barProgress;
          const x = getBarX(i) - BAR_WIDTH / 2;
          const y = CHART_BOTTOM - barH;

          return (
            <g key={d.month}>
              {/* Bar body */}
              <rect
                x={x}
                y={y}
                width={BAR_WIDTH}
                height={Math.max(barH, 0)}
                rx={6}
                ry={6}
                fill={COLORS.amber}
                opacity={0.9}
              />
              {/* Value label above bar */}
              <text
                x={getBarX(i)}
                y={y - 12}
                textAnchor="middle"
                fill={COLORS.cream}
                fontSize={20}
                fontFamily="Inter, sans-serif"
                fontWeight={600}
                opacity={barProgress}
              >
                {formatCurrency(d.value)}
              </text>
              {/* Month label below baseline */}
              <text
                x={getBarX(i)}
                y={CHART_BOTTOM + 36}
                textAnchor="middle"
                fill={COLORS.textMuted}
                fontSize={22}
                fontFamily="Inter, sans-serif"
                fontWeight={500}
              >
                {d.month}
              </text>
            </g>
          );
        })}

        {/* Line overlay with glow effect */}
        {visibleLinePoints.length >= 2 && (
          <g filter="url(#lineGlow)">
            <polyline
              points={visibleLinePoints.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={COLORS.cream}
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}

        {/* Data point dots on the line */}
        {linePoints.map((pt, i) => {
          // Each dot appears when line progress reaches it
          const dotThreshold = i / (linePoints.length - 1);
          const dotVisible = lineProgress >= dotThreshold;
          const isLast = i === linePoints.length - 1;
          const scale = isLast ? dotScale : dotVisible ? 1 : 0;

          return (
            <g key={`dot-${i}`}>
              {dotVisible && (
                <>
                  {/* Outer glow ring for endpoint */}
                  {isLast && frame >= DOT_PULSE_START && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={12 * dotScale}
                      fill="none"
                      stroke={COLORS.cream}
                      strokeWidth={1.5}
                      opacity={0.4}
                    />
                  )}
                  {/* Dot — scale from center via SVG transform-origin */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={6 * scale}
                    fill={COLORS.cream}
                  />
                  {/* Conversion label */}
                  <text
                    x={pt.x}
                    y={pt.y - 18}
                    textAnchor="middle"
                    fill={COLORS.cream}
                    fontSize={18}
                    fontFamily="Inter, sans-serif"
                    fontWeight={600}
                    opacity={scale}
                  >
                    {CONVERSION_DATA[i]}%
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* SVG filter for line glow */}
        <defs>
          <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx={0} dy={0} stdDeviation={6} floodColor={COLORS.amber} floodOpacity={0.7} />
            <feDropShadow dx={0} dy={0} stdDeviation={12} floodColor={COLORS.amber} floodOpacity={0.3} />
          </filter>
        </defs>

        {/* Right-side Y-axis label for conversion */}
        <text
          x={CHART_RIGHT + 24}
          y={CHART_TOP + CHART_HEIGHT / 2}
          textAnchor="middle"
          fill={COLORS.cream}
          fontSize={18}
          fontFamily="Inter, sans-serif"
          fontWeight={500}
          opacity={lineProgress}
          transform={`rotate(-90, ${CHART_RIGHT + 24}, ${CHART_TOP + CHART_HEIGHT / 2})`}
        >
          Conversion Rate (%)
        </text>

        {/* Left-side Y-axis label for revenue */}
        <text
          x={CHART_LEFT - 60}
          y={CHART_TOP + CHART_HEIGHT / 2}
          textAnchor="middle"
          fill={COLORS.textMuted}
          fontSize={18}
          fontFamily="Inter, sans-serif"
          fontWeight={500}
          opacity={titleOpacity}
          transform={`rotate(-90, ${CHART_LEFT - 60}, ${CHART_TOP + CHART_HEIGHT / 2})`}
        >
          Revenue ($)
        </text>
      </svg>
    </AbsoluteFill>
  );
};

/**
 * Build a set of points representing the visible portion of the line
 * based on a 0..1 progress value. Interpolates between segment endpoints
 * so the line draws smoothly rather than jumping point-to-point.
 */
function buildProgressiveLine(
  points: { x: number; y: number }[],
  progress: number,
): { x: number; y: number }[] {
  if (points.length < 2 || progress <= 0) return [];

  // Calculate total line length for proportional progress
  const segments: number[] = [];
  let totalLength = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    segments.push(len);
    totalLength += len;
  }

  const targetLength = progress * totalLength;
  const result: { x: number; y: number }[] = [points[0]];
  let accumulated = 0;

  for (let i = 0; i < segments.length; i++) {
    if (accumulated + segments[i] <= targetLength) {
      result.push(points[i + 1]);
      accumulated += segments[i];
    } else {
      // Partial segment: interpolate the endpoint
      const remaining = targetLength - accumulated;
      const t = remaining / segments[i];
      result.push({
        x: points[i].x + (points[i + 1].x - points[i].x) * t,
        y: points[i].y + (points[i + 1].y - points[i].y) * t,
      });
      break;
    }
  }

  return result;
}
