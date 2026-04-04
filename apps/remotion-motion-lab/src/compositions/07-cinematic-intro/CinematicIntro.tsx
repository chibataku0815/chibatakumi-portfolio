import React, { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "../../lib/colors";
import { FILMTONE_POP } from "../../lib/springs";
import { filmtoneFadeIn } from "../../lib/transitions";
import { FONTS, TYPE_SCALE } from "../../lib/typography";

/**
 * 画面サイズの正本です。
 *
 * 主な仕様:
 * - 16:9 の 1920x1080 固定
 * - Root.tsx の Composition 設定と一致させる
 *
 * 制限事項:
 * - 他サイズへの自動追従はしない
 */
const width = 1920;
const height = 1080;

/**
 * Phase 3 の Cinematic Intro で使う粒子の数です。
 *
 * 主な仕様:
 * - ブランドガードレールに合わせて 5-15 粒に抑える
 * - 今回は 10 粒で、密度を低めに固定する
 *
 * 制限事項:
 * - 画面サイズが変わっても自動では増減しない
 */
const particleCount = 10;

/**
 * ロゴの pop-in を始めるフレームです。
 *
 * 主な仕様:
 * - 冒頭の空気感を少し見せてからロゴを出す
 * - `FILMTONE_POP` の 1 回だけの揺れを活かす
 *
 * 制限事項:
 * - 動きの長さは固定
 */
const logoStartFrame = 18;

/**
 * スキャナー線の開始フレームです。
 *
 * 主な仕様:
 * - ロゴが着地したあとに、左から右へ静かに流す
 *
 * 制限事項:
 * - 今回は 1 回だけ走査する
 */
const scannerStartFrame = 86;

/**
 * 粒子 1 個分の設計値です。
 *
 * @property {number} x 初期の横位置です。
 * @property {number} y 初期の縦位置です。
 * @property {number} size 粒の大きさです。
 * @property {number} speed 粒の移動速度です。
 * @property {number} angle 粒の移動角度です。
 * @property {number} opacity 粒の見えやすさです。
 * @property {number} blur 奥行きを見せるためのぼかし量です。
 */
interface ParticleConfig {
  x: number;
  y: number;
  size: number;
  speed: number;
  angle: number;
  opacity: number;
  blur: number;
}

/**
 * 粒子の配置を決めます。
 *
 * 概要:
 * - 毎回同じ見た目になるように決定論的に並べる
 * - LaunchVideo の粒子パターンを、より上品で遅い設定に寄せている
 *
 * 主な仕様:
 * - 密度は低くする
 * - 速度は 0.2-0.8 px/frame に収める
 * - 奥の粒子だけぼかす
 *
 * 制限事項:
 * - ランダムではないので、毎回同じ軌跡になる
 *
 * @param {number} count 生成する粒子数です。
 * @returns {ParticleConfig[]} 粒子の設定一覧です。
 */
function createParticles(count: number): ParticleConfig[] {
  return Array.from({ length: count }, (_, index) => ({
    x: (index * 181.7) % width,
    y: 120 + ((index * 113.9) % (height - 240)),
    size: 1 + (index % 4),
    speed: 0.22 + (index % 5) * 0.12,
    angle: ((index * 41 + 35) % 360) * (Math.PI / 180),
    opacity: 0.12 + (index % 3) * 0.1,
    blur: index % 3 === 0 ? 1.8 : index % 4 === 0 ? 1 : 0,
  }));
}

/**
 * 浮遊パーティクルを描画します。
 *
 * 概要:
 * - Cut 6 の grain-like な空気感を検証するレイヤーです
 * - 主役になりすぎないよう、粒・速度・明るさを抑えています
 *
 * 主な仕様:
 * - 低密度
 * - 被写界深度ぼかし
 * - 暖色寄りの白粒子
 *
 * 制限事項:
 * - 1 粒ずつの挙動は物理シミュレーションではない
 */
function FloatingParticles(): React.ReactElement {
  const frame = useCurrentFrame();
  const particles = useMemo(() => createParticles(particleCount), []);

  return (
    <>
      {particles.map((particle, index) => {
        const currentX =
          ((particle.x + Math.cos(particle.angle) * particle.speed * frame) % width +
            width) %
          width;
        const currentY =
          ((particle.y + Math.sin(particle.angle) * particle.speed * frame) % height +
            height) %
          height;

        return (
          <div
            key={`cinematic-particle-${index}`}
            style={{
              position: "absolute",
              left: currentX,
              top: currentY,
              width: particle.size,
              height: particle.size,
              borderRadius: "50%",
              backgroundColor: index % 2 === 0 ? COLORS.cream : COLORS.warmWhite,
              opacity: particle.opacity,
              filter: particle.blur > 0 ? `blur(${particle.blur}px)` : undefined,
              boxShadow:
                particle.blur > 0
                  ? `0 0 10px ${COLORS.amberMuted}`
                  : `0 0 6px ${COLORS.cream}`,
            }}
          />
        );
      })}
    </>
  );
}

/**
 * 左から右へ流れる細いスキャナー線です。
 *
 * 概要:
 * - 原プロンプトの中から scanner line だけを cherry-pick する
 * - 線は主役ではなく、ロゴを軽くなぞる補助演出に留める
 *
 * 主な仕様:
 * - 薄い縦線
 * - 1 回だけ走る
 * - amber 系の柔らかい光
 *
 * 制限事項:
 * - グリッチや HUD は入れない
 */
function ScannerLine(): React.ReactElement | null {
  const frame = useCurrentFrame();

  if (frame < scannerStartFrame) {
    return null;
  }

  const scannerLeft = interpolate(
    frame,
    [scannerStartFrame, scannerStartFrame + 120],
    [-80, width + 80],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const scannerOpacity = Math.min(
    interpolate(frame, [scannerStartFrame, scannerStartFrame + 18], [0, 0.45], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    interpolate(
      frame,
      [scannerStartFrame + 92, scannerStartFrame + 130],
      [0.45, 0],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    ),
  );

  return (
    <div
      style={{
        position: "absolute",
        top: 112,
        left: scannerLeft,
        width: 2,
        height: height - 224,
        opacity: scannerOpacity,
        background: `linear-gradient(180deg, transparent 0%, ${COLORS.cream} 20%, ${COLORS.amber} 50%, ${COLORS.cream} 80%, transparent 100%)`,
        boxShadow: `0 0 16px ${COLORS.cream}, 0 0 30px ${COLORS.amberMuted}`,
      }}
    />
  );
}

/**
 * 中央のロゴロックアップです。
 *
 * 概要:
 * - Cut 10 の logo pop を検証する主役レイヤーです
 * - 3x から 1x へ縮みながら、1 回だけ小さく行き過ぎてから止まります
 *
 * 主な仕様:
 * - `FILMTONE_POP` をそのまま使う
 * - scale 3x → 1x
 * - overshoot を小さく保つ
 *
 * 制限事項:
 * - バッジや複数 UI は足さない
 */
function LogoLockup(): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSpring = spring({
    frame: Math.max(0, frame - logoStartFrame),
    fps,
    config: FILMTONE_POP,
    durationInFrames: 42,
  });

  const rawScale = interpolate(logoSpring, [0, 1], [3, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "extend",
  });
  const scale = Math.max(0.92, rawScale);
  const logoOpacity = filmtoneFadeIn(frame, logoStartFrame, fps, 0.85);
  const eyebrowOpacity = filmtoneFadeIn(frame, logoStartFrame + 14, fps, 0.7);
  const captionOpacity = filmtoneFadeIn(frame, logoStartFrame + 40, fps, 0.8);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.inter,
          fontSize: TYPE_SCALE.label,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: COLORS.textMuted,
          opacity: eyebrowOpacity,
        }}
      >
        Motion Lab Phase 3
      </div>

      <div
        style={{
          fontFamily: FONTS.inter,
          fontSize: 124,
          fontWeight: 700,
          color: COLORS.warmWhite,
          opacity: logoOpacity,
          transform: `scale(${scale})`,
          textShadow: `0 0 28px rgba(254, 243, 199, 0.18), 0 0 64px rgba(217, 119, 6, 0.10)`,
          letterSpacing: "-0.03em",
        }}
      >
        Filmtone
      </div>

      <div
        style={{
          fontFamily: FONTS.mixed,
          fontSize: TYPE_SCALE.body,
          fontWeight: 400,
          color: COLORS.textPrimary,
          opacity: captionOpacity,
          maxWidth: 900,
          textAlign: "center",
          lineHeight: 1.35,
        }}
      >
        Grain-like particles と静かな scanner line だけで、
        写真の前に出すぎないロゴ導入を作る。
      </div>
    </AbsoluteFill>
  );
}

/**
 * 右下の用途メモです。
 *
 * 概要:
 * - どの launch cut の検証かを、映像内でも見失わないためのメモです
 *
 * 主な仕様:
 * - Cut 6 / Cut 10 の対応を明示する
 * - 主張しすぎない大きさにする
 *
 * 制限事項:
 * - 説明量は最小限
 */
function CutMappingCaption(): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const captionOpacity = filmtoneFadeIn(frame, 80, fps, 0.8);

  return (
    <div
      style={{
        position: "absolute",
        right: 72,
        bottom: 64,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        opacity: captionOpacity,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.inter,
          fontSize: 22,
          fontWeight: 600,
          color: COLORS.cream,
          letterSpacing: "0.04em",
        }}
      >
        Cut 6 / Cut 10
      </div>
      <div
        style={{
          fontFamily: FONTS.mixed,
          fontSize: 18,
          color: COLORS.textMuted,
          lineHeight: 1.5,
        }}
      >
        Grain particles
        <br />
        Logo pop
      </div>
    </div>
  );
}

/**
 * #7 Cinematic Intro の本体です。
 *
 * 概要:
 * - Phase 3 で cherry-pick するのは 3 要素だけです
 * - spring pop-in、floating particles、scanner line を検証します
 *
 * 主な仕様:
 * - glitch / HUD / matrix / dashed rings は不採用
 * - 10 秒 / 1920x1080 / 30fps
 * - 写真や本編の前座として使える落ち着いた導入
 *
 * 制限事項:
 * - 背景画像は使わず、空気感の検証に集中する
 */
export function CinematicIntro(): React.ReactElement {
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 50% 42%, rgba(41, 37, 36, 0.95) 0%, rgba(12, 10, 9, 1) 58%, rgba(7, 6, 5, 1) 100%)",
      }}
    >
      <FloatingParticles />
      <ScannerLine />
      <LogoLockup />
      <CutMappingCaption />
    </AbsoluteFill>
  );
}
