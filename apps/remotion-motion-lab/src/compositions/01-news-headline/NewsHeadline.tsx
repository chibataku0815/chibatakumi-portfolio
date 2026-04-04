import React, { useMemo } from "react";
import rough from "roughjs/bin/rough";
import type { PathInfo } from "roughjs/bin/core";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "../../lib/colors";
import { FILMTONE_GENTLE } from "../../lib/springs";
import { blurReveal, filmtoneFadeIn } from "../../lib/transitions";
import { FONTS, TYPE_SCALE } from "../../lib/typography";

/**
 * #1 News Headline のレイアウト幅です。
 *
 * 主な仕様:
 * - 3 枚カードを横並びで置くための固定値です
 *
 * 制限事項:
 * - 今回は 16:9 のみ対象です
 */
const cardWidth = 460;
const cardHeight = 294;

/**
 * reveal を始める基準フレームです。
 *
 * 主な仕様:
 * - 3 枚とも少しずつずらして表示する
 * - 0.4-0.6s の blur→unblur を守る
 *
 * 制限事項:
 * - reveal の秒数は composition 内で固定です
 */
const revealBaseFrame = 20;

/**
 * 3 つの検証カードの内容です。
 *
 * @property {"hero" | "warm" | "mono"} variant カードの演出種類です。
 * @property {string} cutLabel 対応する launch cut の名前です。
 * @property {string} helperText 何を検証しているかの補足です。
 * @property {[string, string]} beforeColors Before レイヤーの色です。
 * @property {[string, string]} afterColors After レイヤーの色です。
 * @property {number} revealOffset reveal の開始遅延です。
 */
interface RevealCardConfig {
  variant: "hero" | "warm" | "mono";
  cutLabel: string;
  helperText: string;
  beforeColors: [string, string];
  afterColors: [string, string];
  revealOffset: number;
}

/**
 * カード設定の一覧です。
 *
 * 主な仕様:
 * - Cut 1 / 3 / 7 を 1 本の composition で同時に比較する
 * - 後から実素材に差し替えやすいよう、見た目の差だけを構成要素にする
 *
 * 制限事項:
 * - 今回は placeholder のため、実写真はまだ使わない
 */
const revealCards: RevealCardConfig[] = [
  {
    variant: "hero",
    cutLabel: "Cut 1 Hero",
    helperText: "blurred before -> clean hero",
    beforeColors: ["#2b2a28", "#4b5563"],
    afterColors: [COLORS.cream, COLORS.amber],
    revealOffset: 0,
  },
  {
    variant: "warm",
    cutLabel: "Cut 3 Warm Shift",
    helperText: "cool before -> warm after",
    beforeColors: ["#1f2937", "#0f766e"],
    afterColors: ["#f59e0b", "#7c2d12"],
    revealOffset: 10,
  },
  {
    variant: "mono",
    cutLabel: "Cut 7 Mono Reveal",
    helperText: "color before -> monochrome after",
    beforeColors: ["#92400e", "#78350f"],
    afterColors: ["#d6d3d1", "#44403c"],
    revealOffset: 20,
  },
];

/**
 * hand-drawn highlighter のパスを作ります。
 *
 * 概要:
 * - rough.js を使って、均一すぎないハイライト帯を作ります
 * - 教材コンテンツ用の「ここを見てほしい」を再現します
 *
 * 主な仕様:
 * - 毎回同じ形になるように seed を固定する
 * - fill と stroke の両方を持つパスを返す
 *
 * 制限事項:
 * - 実際のニュース文面や OCR はまだ扱いません
 *
 * @returns {PathInfo[]} SVG へ流し込むための rough.js パス配列です。
 */
function createHighlightPaths(): PathInfo[] {
  const generator = rough.generator();
  const drawable = generator.rectangle(0, 0, 420, 70, {
    seed: 20260404,
    roughness: 1.4,
    stroke: COLORS.amberMuted,
    strokeWidth: 2,
    fill: COLORS.amber,
    fillStyle: "solid",
    disableMultiStroke: true,
    preserveVertices: true,
  });

  return generator.toPaths(drawable);
}

/**
 * 見出しの背後に出す hand-drawn highlighter です。
 *
 * 概要:
 * - rough.js を使う場所を 1 箇所に絞ることで、映像全体を教材モードに寄せすぎないようにします
 *
 * 主な仕様:
 * - headline の下にだけ置く
 * - opacity を低めにして本文を邪魔しない
 *
 * 制限事項:
 * - 実プロダクト UI には使わない前提です
 */
function HeadlineHighlighter(): React.ReactElement {
  const highlightPaths = useMemo(() => createHighlightPaths(), []);

  return (
    <svg
      width={440}
      height={88}
      viewBox="0 0 440 88"
      style={{
        position: "absolute",
        left: "50%",
        top: 172,
        transform: "translateX(-50%)",
        overflow: "visible",
      }}
    >
      <g transform="translate(10 8)">
        {highlightPaths.map((pathInfo, index) => (
          <path
            key={`headline-highlight-${index}`}
            d={pathInfo.d}
            fill={pathInfo.fill}
            fillOpacity={0.22}
            stroke={pathInfo.stroke}
            strokeWidth={pathInfo.strokeWidth}
            strokeOpacity={0.5}
          />
        ))}
      </g>
    </svg>
  );
}

/**
 * カード内の placeholder レイヤーです。
 *
 * 概要:
 * - 実写真の代わりに、色・光・構図の差だけを見られる抽象レイヤーを作ります
 * - 後で `staticFile()` の実素材へ差し替えるときも、カード構造はそのまま使えます
 *
 * 主な仕様:
 * - 2 色グラデーション
 * - 円と矩形で「写真っぽい面」を作る
 *
 * 制限事項:
 * - 今は写真内容を表現しない
 *
 * @param {Object} props レイヤーの見た目設定です。
 * @param {[string, string]} props.colors 背景グラデーションの 2 色です。
 * @param {number} props.opacity レイヤーの不透明度です。
 * @param {string | undefined} props.filter CSS filter です。
 * @returns {React.ReactElement} プレースホルダーの見た目レイヤーです。
 */
function PlaceholderLayer(props: {
  colors: [string, string];
  opacity: number;
  filter?: string;
}): React.ReactElement {
  const { colors, opacity, filter } = props;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        filter,
        background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 28,
          borderRadius: 24,
          background: "rgba(255, 255, 255, 0.06)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 38,
          right: 42,
          width: 132,
          height: 132,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.14)",
          filter: "blur(1px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 42,
          bottom: 52,
          width: 220,
          height: 34,
          borderRadius: 17,
          background: "rgba(255, 255, 255, 0.18)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 42,
          bottom: 96,
          width: 280,
          height: 22,
          borderRadius: 11,
          background: "rgba(255, 255, 255, 0.12)",
        }}
      />
    </div>
  );
}

/**
 * 1 枚分の reveal preview card です。
 *
 * 概要:
 * - blur→unblur の速度と、Before/After の入れ替わり方を 1 枚ずつ検証します
 * - 3D rotation は入れません
 *
 * 主な仕様:
 * - `blurReveal()` をそのまま使う
 * - 3 カードを少しずつ遅らせて出す
 * - mono variant だけ After に grayscale をかける
 *
 * 制限事項:
 * - OCR や本物のニュース見出し抽出はしない
 *
 * @param {Object} props カード描画に必要な情報です。
 * @param {RevealCardConfig} props.config 1 枚分の設定です。
 * @param {number} props.index 並び順です。
 * @returns {React.ReactElement} 1 枚分の reveal card です。
 */
function RevealPreviewCard(props: {
  config: RevealCardConfig;
  index: number;
}): React.ReactElement {
  const { config, index } = props;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const revealFrame = revealBaseFrame + config.revealOffset;
  const afterOpacity = filmtoneFadeIn(frame, revealFrame + 2, fps, 0.5);
  const revealBlur = blurReveal(frame, revealFrame, fps, 0.5);
  const cardOpacity = filmtoneFadeIn(frame, 6 + index * 5, fps, 0.7);
  const cardSpring = spring({
    frame: Math.max(0, frame - index * 5),
    fps,
    config: FILMTONE_GENTLE,
    durationInFrames: 26,
  });
  const cardScale = interpolate(cardSpring, [0, 1], [0.96, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: cardWidth,
        opacity: cardOpacity,
        transform: `scale(${cardScale})`,
      }}
    >
      <div
        style={{
          position: "relative",
          height: cardHeight,
          borderRadius: 28,
          overflow: "hidden",
          backgroundColor: COLORS.bgSurface,
          border: `1px solid ${COLORS.bgBorder}`,
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.24)",
        }}
      >
        <PlaceholderLayer
          colors={config.beforeColors}
          opacity={1}
          filter={`blur(${revealBlur}px) saturate(0.78)`}
        />
        <PlaceholderLayer
          colors={config.afterColors}
          opacity={afterOpacity}
          filter={config.variant === "mono" ? "grayscale(1)" : undefined}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(12, 10, 9, 0.08) 0%, rgba(12, 10, 9, 0.30) 100%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: 24,
            right: 24,
            top: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontFamily: FONTS.inter,
              fontSize: 18,
              fontWeight: 600,
              color: COLORS.warmWhite,
              letterSpacing: "0.04em",
            }}
          >
            {config.cutLabel}
          </div>
          <div
            style={{
              fontFamily: FONTS.inter,
              fontSize: 14,
              color: COLORS.textMuted,
              backgroundColor: "rgba(12, 10, 9, 0.45)",
              border: "1px solid rgba(255, 255, 255, 0.10)",
              borderRadius: 999,
              padding: "6px 12px",
            }}
          >
            blur -&gt; reveal
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 24,
            right: 24,
            bottom: 24,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.inter,
              fontSize: 26,
              fontWeight: 700,
              color: COLORS.warmWhite,
            }}
          >
            Grade reveal
          </div>
          <div
            style={{
              fontFamily: FONTS.inter,
              fontSize: 17,
              color: COLORS.textPrimary,
              lineHeight: 1.45,
            }}
          >
            {config.helperText}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * #1 News Headline Highlight の本体です。
 *
 * 概要:
 * - News 文法から必要なものだけを抜き出し、教育用の reveal study として作ります
 * - 今回は placeholder の Before/After で blur→unblur を最優先に検証します
 *
 * 主な仕様:
 * - rough.js の highlighter を headline にだけ使う
 * - Cut 1 / 3 / 7 を 3 枚カードで比較する
 * - 3D rotation は入れない
 *
 * 制限事項:
 * - OCR や本物のニュース UI は今回のスコープ外です
 */
export function NewsHeadline(): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = filmtoneFadeIn(frame, 0, fps, 0.8);
  const subtitleOpacity = filmtoneFadeIn(frame, 10, fps, 0.8);

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 50% 0%, rgba(41, 37, 36, 0.42) 0%, rgba(12, 10, 9, 1) 52%, rgba(8, 7, 6, 1) 100%)",
        padding: "92px 72px 84px",
      }}
    >
      <HeadlineHighlighter />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          opacity: titleOpacity,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.inter,
            fontSize: TYPE_SCALE.heading,
            fontWeight: 700,
            color: COLORS.warmWhite,
            letterSpacing: "-0.02em",
          }}
        >
          Blur to unblur
        </div>
        <div
          style={{
            fontFamily: FONTS.mixed,
            fontSize: TYPE_SCALE.body,
            fontWeight: 400,
            color: COLORS.textPrimary,
            opacity: subtitleOpacity,
            textAlign: "center",
            maxWidth: 980,
            lineHeight: 1.45,
          }}
        >
          rough.js の hand-drawn highlight を最小限だけ使い、
          3 つの grade reveal パターンを 0.4-0.6 秒で見比べる。
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
          marginTop: 34,
        }}
      >
        {revealCards.map((config, index) => (
          <RevealPreviewCard
            key={config.cutLabel}
            config={config}
            index={index}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
}
