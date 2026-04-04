import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "../../lib/colors";
import { filmtoneFadeIn } from "../../lib/transitions";
import { SAFE_ZONE } from "../../lib/safeZone";
import { FONTS, TYPE_SCALE } from "../../lib/typography";

/**
 * #5 Rocket launches timeline の実装です。
 *
 * 概要:
 * - prompt 全体を再現するのではなく、parabolic trajectory と fading trail を学ぶための study に絞ります
 * - ロケットの図像化より、timeline sequencing と trail decay の上品さを優先します
 *
 * 主な仕様:
 * - 2015-2025 の年を底辺 timeline に並べます
 * - 各年区間ごとに 1 本の arc を流し、trail の残り方を検証します
 *
 * 制限事項:
 * - 実際の打ち上げ回数や mission 名を厳密に再現するものではありません
 * - 追加 dependency は使わず、SVG と数式で軌道を描きます
 */

/**
 * 1 本分の trajectory 設定です。
 *
 * @property {number} year 表示用の年です。
 * @property {number} startX arc の始点 X 座標です。
 * @property {number} endX arc の終点 X 座標です。
 * @property {number} apexY arc の頂点 Y 座標です。
 * @property {number} startFrame reveal の開始フレームです。
 */
interface LaunchStudy {
  year: number;
  startX: number;
  endX: number;
  apexY: number;
  startFrame: number;
}

/**
 * 年ラベルだけを持つ marker です。
 *
 * @property {number} year timeline に出す年です。
 * @property {number} x marker の X 座標です。
 */
interface YearMarker {
  year: number;
  x: number;
}

/**
 * composition 全体の固定値です。
 *
 * 制限事項:
 * - 8 秒で sequence を終えるため、1 arc ごとの見せ時間は短めです
 */
const width = 1920;
const height = 1080;
const baseY = 780;
const timelineLeft = 240;
const timelineRight = 1680;
const yearValues = [
  2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
] as const;

/**
 * 底辺の年 marker 一覧です。
 *
 * 概要:
 * - 等間隔の timeline を先に定めて、そこから arc を作ります
 */
const yearMarkers: readonly YearMarker[] = yearValues.map((year, index) => ({
  year,
  x:
    timelineLeft +
    ((timelineRight - timelineLeft) / (yearValues.length - 1)) * index,
}));

/**
 * arc 一覧です。
 *
 * 主な仕様:
 * - 隣の年へ向かって 1 本流す構造で chronology を見せます
 * - apexY を少しずつ揺らして、同じ高さの単調さを避けます
 */
const launchStudies: readonly LaunchStudy[] = yearMarkers
  .slice(0, yearMarkers.length - 1)
  .map((marker, index) => ({
    year: marker.year,
    startX: marker.x,
    endX: yearMarkers[index + 1].x,
    apexY: 410 - (index % 3) * 54,
    startFrame: 16 + index * 18,
  }));

/**
 * 2 点と頂点から quadratic curve 上の点を返します。
 *
 * @param {number} startX 始点の X 座標です。
 * @param {number} endX 終点の X 座標です。
 * @param {number} arcApexY 頂点の Y 座標です。
 * @param {number} t 0-1 の進行度です。
 * @returns {{ x: number; y: number }} 軌道上の点です。
 */
function getArcPoint(
  startX: number,
  endX: number,
  arcApexY: number,
  t: number,
): { x: number; y: number } {
  const controlX = (startX + endX) / 2;
  const controlY = arcApexY;
  const oneMinusT = 1 - t;

  return {
    x:
      oneMinusT * oneMinusT * startX +
      2 * oneMinusT * t * controlX +
      t * t * endX,
    y:
      oneMinusT * oneMinusT * baseY +
      2 * oneMinusT * t * controlY +
      t * t * baseY,
  };
}

/**
 * SVG 用の arc path を作ります。
 *
 * @param {LaunchStudy} study 1 本分の設定です。
 * @returns {string} SVG path 文字列です。
 */
function buildArcPath(study: LaunchStudy): string {
  const controlX = (study.startX + study.endX) / 2;
  return `M ${study.startX} ${baseY} Q ${controlX} ${study.apexY} ${study.endX} ${baseY}`;
}

/**
 * 1 本分の trajectory を描画します。
 *
 * @param {Object} props trajectory の props です。
 * @param {LaunchStudy} props.study 1 本分の設定です。
 * @returns {React.ReactElement} 軌道と trail の描画です。
 */
function LaunchTrajectory(props: {
  study: LaunchStudy;
}): React.ReactElement {
  const { study } = props;
  const frame = useCurrentFrame();
  const activeFrame = frame - study.startFrame;
  const drawDuration = 36;
  const fadeDuration = 28;

  const rawProgress = interpolate(activeFrame, [0, drawDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const guideOpacity = interpolate(activeFrame, [-4, drawDuration + fadeDuration], [0, 0.34], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const trailOpacity = interpolate(
    activeFrame,
    [0, drawDuration, drawDuration + fadeDuration],
    [0.1, 0.82, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const trailSteps = [0.0, 0.12, 0.24, 0.36, 0.48];
  const yearOpacity = filmtoneFadeIn(frame, study.startFrame - 6, 30, 0.5);
  const arcPath = buildArcPath(study);

  return (
    <>
      <path
        d={arcPath}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={1}
      />
      <path
        d={arcPath}
        fill="none"
        stroke={COLORS.amber}
        strokeWidth={2.5}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={`${rawProgress} 1`}
        opacity={guideOpacity}
      />
      {trailSteps.map((step, index) => {
        const trailT = Math.max(0, rawProgress - step);
        const point = getArcPoint(
          study.startX,
          study.endX,
          study.apexY,
          trailT,
        );
        const pointOpacity = trailOpacity * (1 - index * 0.18);
        const radius = 10 - index * 1.5;

        return (
          <circle
            key={`${study.year}-${step}`}
            cx={point.x}
            cy={point.y}
            r={radius}
            fill={index === 0 ? COLORS.cream : COLORS.amber}
            opacity={pointOpacity}
          />
        );
      })}
      <text
        x={study.startX}
        y={baseY + 46}
        textAnchor="middle"
        fill="rgba(255,255,255,0.46)"
        fontFamily={FONTS.inter}
        fontSize="15"
        opacity={yearOpacity}
      >
        {study.year}
      </text>
    </>
  );
}

/**
 * 右下の small caption です。
 *
 * @returns {React.ReactElement} minimal な補助キャプションです。
 */
function StudyCaption(): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = filmtoneFadeIn(frame, 70, fps, 0.8);

  return (
    <div
      style={{
        position: "absolute",
        right: SAFE_ZONE.horizontal.right,
        bottom: 118,
        width: 290,
        padding: "18px 20px",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(24, 19, 17, 0.78)",
        opacity,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.inter,
          fontSize: 12,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: COLORS.amber,
        }}
      >
        motion extraction
      </div>
      <div
        style={{
          fontFamily: FONTS.mixed,
          fontSize: 17,
          lineHeight: 1.5,
          color: COLORS.textPrimary,
          marginTop: 10,
        }}
      >
        parabolic arc、
        <br />
        fading trail、
        <br />
        chronological reveal
      </div>
    </div>
  );
}

/**
 * Rocket timeline の本体です。
 *
 * 概要:
 * - minimal timeline の上に arc を順番に重ね、trail decay を見ます
 *
 * @returns {React.ReactElement} Rocket timeline composition です。
 */
export function RocketTimeline(): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleOpacity = filmtoneFadeIn(frame, 0, fps, 0.8);
  const subtitleOpacity = filmtoneFadeIn(frame, 10, fps, 0.8);

  return (
    <AbsoluteFill
      style={{
        width,
        height,
        background:
          "radial-gradient(circle at 50% 0%, rgba(217, 119, 6, 0.12) 0%, rgba(12, 10, 9, 0) 32%), #0c0a09",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: SAFE_ZONE.horizontal.left,
          top: SAFE_ZONE.horizontal.top,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.inter,
            fontSize: 14,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: COLORS.amber,
            opacity: titleOpacity,
          }}
        >
          rocket launches timeline
        </div>
        <div
          style={{
            fontFamily: FONTS.inter,
            fontSize: TYPE_SCALE.heading + 2,
            lineHeight: 1.04,
            fontWeight: 700,
            color: COLORS.warmWhite,
            marginTop: 14,
            opacity: titleOpacity,
          }}
        >
          Minimal motion study
        </div>
        <div
          style={{
            fontFamily: FONTS.mixed,
            fontSize: TYPE_SCALE.body - 6,
            lineHeight: 1.5,
            color: COLORS.textMuted,
            marginTop: 16,
            maxWidth: 620,
            opacity: subtitleOpacity,
          }}
        >
          打ち上げの意味より、軌道が残る速さと、
          <br />
          時系列を崩さずに見せる pacing を先に掴む。
        </div>
      </div>

      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
      >
        <line
          x1={timelineLeft}
          y1={baseY}
          x2={timelineRight}
          y2={baseY}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={1.5}
        />
        {yearMarkers.map((marker) => (
          <g key={marker.year}>
            <line
              x1={marker.x}
              y1={baseY - 8}
              x2={marker.x}
              y2={baseY + 8}
              stroke="rgba(255,255,255,0.14)"
              strokeWidth={1}
            />
            <text
              x={marker.x}
              y={baseY + 78}
              textAnchor="middle"
              fill="rgba(255,255,255,0.20)"
              fontFamily={FONTS.inter}
              fontSize="14"
            >
              {marker.year}
            </text>
          </g>
        ))}
        {launchStudies.map((study) => (
          <LaunchTrajectory key={study.year} study={study} />
        ))}
      </svg>

      <StudyCaption />
    </AbsoluteFill>
  );
}
