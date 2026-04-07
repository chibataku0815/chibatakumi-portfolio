/**
 * @fileoverview Sabrina 系プロンプト P2 の5シーン縦型レビュー動画（20秒）。
 * データは src/fixtures/reviews.mock.json（実 GBP ではなくフィクスチャ）。
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import mockRaw from "../fixtures/reviews.mock.json";
import { interFont, useInterFontReady } from "../lib/interFont";
import { safeContentWidth, safeZonePadding } from "../lib/safeZone";

/** JSON モックの型（zod 無しで最小限） */
type ReviewEntry = { stars: number; text: string; firstName: string };

type ReviewsMock = {
  businessName: string;
  category: string;
  rating: number;
  reviewCount: number;
  statsUsers: number;
  cityState: string;
  ctaLabel: string;
  phoneOrUrl: string;
  distribution5: number;
  distribution4: number;
  distribution3: number;
  distribution2: number;
  distribution1: number;
  reviews: ReviewEntry[];
};

const mock = mockRaw as ReviewsMock;

const BG = "#f8f9fa";
const TEXT = "#1a1a1a";
const MUTED = "#64748b";
const GOLD = "#f59e0b";
const CARD_BORDER = "#e2e8f0";
const PEACH = "#fff7ed";

type SceneProps = { sceneStart: number };

/**
 * Google「G」風の4色 SVG（公式ロゴではなく装飾）。
 */
const GoogleMark: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

/** 単一の星（塗りは clip で分数表現可能） */
const StarShape: React.FC<{
  size: number;
  fillFraction: number;
}> = ({ size, fillFraction }) => (
  <div style={{ width: size, height: size, position: "relative" }}>
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ opacity: 0.25 }}>
      <path
        fill={GOLD}
        d="M12 2l2.2 5.3L20 9l-4.2 3.6L17 18l-5-2.9L7 18l1.2-5.4L4 9l5.8-.7L12 2z"
      />
    </svg>
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        width: `${fillFraction * 100}%`,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path
          fill={GOLD}
          d="M12 2l2.2 5.3L20 9l-4.2 3.6L17 18l-5-2.9L7 18l1.2-5.4L4 9l5.8-.7L12 2z"
        />
      </svg>
    </div>
  </div>
);

/** テキストを3行相当にtruncate（単語境界優先） */
function truncateThreeLines(text: string, maxChars: number): string {
  const t = text.trim();
  if (t.length <= maxChars) {
    return t;
  }
  const slice = t.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(" ");
  const base = lastSpace > 20 ? slice.slice(0, lastSpace) : slice;
  return `${base}…`;
}

/**
 * シーン1: ライト背景・装飾星・ビジネス名＋インライン星評価。
 */
const TSceneHook: React.FC<SceneProps> = ({ sceneStart }) => {
  const g = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = g - sceneStart;
  const enter = spring({ frame: f - 2, fps, config: { damping: 15, stiffness: 100 } });
  const y = interpolate(enter, [0, 1], [40, 0]);

  const starsFade = interpolate(f, [10, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${PEACH} 0%, ${BG} 42%)`,
        ...safeZonePadding(),
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {[0, 1, 2].map((i) => (
        <svg
          key={i}
          width={120 + i * 40}
          height={120 + i * 40}
          viewBox="0 0 24 24"
          style={{
            position: "absolute",
            top: 160 + i * 50,
            left: i % 2 === 0 ? 80 : 780,
            opacity: 0.15,
            transform: `rotate(${i * 18}deg)`,
          }}
        >
          <path fill={GOLD} d="M12 2l2.2 5.3L20 9l-4.2 3.6L17 18l-5-2.9L7 18l1.2-5.4L4 9l5.8-.7L12 2z" />
        </svg>
      ))}
      <div style={{ textAlign: "center", transform: `translateY(${y}px)` }}>
        <div
          style={{
            fontFamily: interFont.fontFamily,
            fontWeight: 700,
            fontSize: 44,
            color: TEXT,
            lineHeight: 1.2,
          }}
        >
          What people are saying about
        </div>
        <div
          style={{
            fontFamily: interFont.fontFamily,
            fontWeight: 800,
            fontSize: 56,
            color: GOLD,
            marginTop: 8,
          }}
        >
          {mock.businessName}
        </div>
        <div
          style={{
            marginTop: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            opacity: starsFade,
          }}
        >
          {Array.from({ length: 5 }, (_, i) => (
            <StarShape key={i} size={40} fillFraction={i < 4 ? 1 : Math.max(0, (mock.rating - 4) / 1)} />
          ))}
          <span style={{ fontFamily: interFont.fontFamily, fontWeight: 700, fontSize: 40, color: TEXT }}>
            {mock.rating.toFixed(1)}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/**
 * シーン2: 大きな星が順番に溜まり、数字がカウントアップ。
 */
const TSceneStars: React.FC<SceneProps> = ({ sceneStart }) => {
  const g = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = g - sceneStart;

  const fills = [1, 2, 3, 4, 5].map((i) => {
    const t = spring({ frame: f - (i - 1) * 8, fps, config: { damping: 14 } });
    if (i <= 4) {
      return interpolate(t, [0, 1], [0, 1]);
    }
    return interpolate(t, [0, 1], [0, 0.8]);
  });

  const ratingShown = interpolate(f, [24, 55], [0, mock.rating], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }).toFixed(1);

  const countShown = Math.round(interpolate(f, [40, 80], [0, mock.reviewCount], { extrapolateRight: "clamp" }));

  const reviewsLabelOp = interpolate(f, [55, 72], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: BG,
        ...safeZonePadding(),
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {fills.map((frac, i) => (
          <StarShape key={i} size={60} fillFraction={frac} />
        ))}
      </div>
      <div
        style={{
          fontFamily: interFont.fontFamily,
          fontWeight: 800,
          fontSize: 64,
          color: TEXT,
          marginBottom: 8,
        }}
      >
        {ratingShown}
      </div>
      <div
        style={{
          fontFamily: interFont.fontFamily,
          fontSize: 36,
          color: MUTED,
          opacity: reviewsLabelOp,
        }}
      >
        Based on {countShown.toLocaleString()} reviews
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 40%, ${GOLD}22 0%, transparent 55%)`,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

/** レビューカード1枚 */
const ReviewCard: React.FC<{ review: ReviewEntry }> = ({ review }) => {
  const body = truncateThreeLines(review.text, 96);
  return (
    <div
      style={{
        width: "100%",
        maxWidth: safeContentWidth(),
        background: "#ffffff",
        border: `1px solid ${CARD_BORDER}`,
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {Array.from({ length: 5 }, (_, i) => (
          <StarShape key={i} size={28} fillFraction={i < review.stars ? 1 : 0} />
        ))}
      </div>
      <div
        style={{
          fontFamily: interFont.fontFamily,
          fontWeight: 400,
          fontSize: 36,
          color: TEXT,
          lineHeight: 1.25,
          minHeight: 120,
        }}
      >
        &ldquo;{body}&rdquo;
      </div>
      <div
        style={{
          marginTop: 18,
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: interFont.fontFamily,
          fontSize: 28,
          color: MUTED,
        }}
      >
        <span>{review.firstName}</span>
        <GoogleMark />
        <span>Google Review</span>
      </div>
    </div>
  );
};

/** 星評価バーの装飾（review 1 用） */
const RatingBarsDecor: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const dist = [
    mock.distribution5,
    mock.distribution4,
    mock.distribution3,
    mock.distribution2,
    mock.distribution1,
  ];
  return (
    <div style={{ width: "100%", maxWidth: safeContentWidth(), opacity: 0.45 }}>
      {dist.map((d, i) => {
        const p = spring({ frame: frame - i * 4, fps, config: { damping: 16 } });
        const w = interpolate(p, [0, 1], [0, d * 100]);
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ width: 18, fontSize: 22, color: MUTED }}>{5 - i}</span>
            <div style={{ flex: 1, height: 10, borderRadius: 6, background: "#f1f5f9" }}>
              <div style={{ width: `${w}%`, height: "100%", borderRadius: 6, background: GOLD }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * シーン3: レビュー3枚をスライド切替＋装飾。
 */
const TSceneReviews: React.FC<SceneProps> = ({ sceneStart }) => {
  const g = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = g - sceneStart;
  const slot = Math.min(2, Math.floor(f / 90));
  const local = f - slot * 90;
  const slide = spring({ frame: local, fps, config: { damping: 15 } });
  const x = interpolate(slide, [0, 1], [380, 0]);

  const review = mock.reviews[slot] ?? mock.reviews[0];
  const pinPulse = spring({ frame: local, fps, config: { damping: 12, stiffness: 120 } });
  const pinScale = interpolate(pinPulse, [0, 1], [1, 1.08]);

  return (
    <AbsoluteFill
      style={{
        background: BG,
        ...safeZonePadding(),
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <svg
        width={200}
        height={220}
        viewBox="0 0 200 220"
        style={{
          position: "absolute",
          top: 220,
          left: 72,
          opacity: 0.1,
        }}
      >
        <text x="10" y="160" fontSize={200} fill={GOLD} fontFamily="Georgia, serif">
          &ldquo;
        </text>
      </svg>
      <div style={{ transform: `translateX(${x}px)` }}>
        <ReviewCard review={review} />
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: i === slot ? GOLD : "#cbd5e1",
            }}
          />
        ))}
      </div>
      <div style={{ marginTop: 28, width: "100%", display: "flex", justifyContent: "center" }}>
        {slot === 0 && <RatingBarsDecor frame={local} fps={fps} />}
        {slot === 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: 0.45 }}>
            <svg width="48" height="48" viewBox="0 0 24 24">
              <path
                fill={GOLD}
                d="M2 21h4V9H2v12zm20 1h-4v-9h4v9zM15 11h4v11h-4V11zM7 5h4v17H7V5z"
              />
            </svg>
            <span style={{ fontFamily: interFont.fontFamily, fontSize: 36, color: MUTED }}>
              {Math.round(interpolate(local, [0, 45], [0, mock.reviewCount], { extrapolateRight: "clamp" }))}+
              reviews
            </span>
          </div>
        )}
        {slot === 2 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              opacity: 0.5,
              transform: `scale(${pinScale})`,
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24">
              <path fill={MUTED} d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" fill={BG} />
            </svg>
            <span style={{ fontFamily: interFont.fontFamily, fontSize: 32, color: MUTED }}>{mock.cityState}</span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/**
 * シーン4: 統計3行のスタック。
 */
const TSceneStats: React.FC<SceneProps> = ({ sceneStart }) => {
  const g = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = g - sceneStart;

  const ratingLine = interpolate(f, [0, 36], [2.2, mock.rating], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }).toFixed(1);

  const lines = [
    {
      label: `${ratingLine} star rating`,
      delay: 0,
      icon: "star" as const,
    },
    {
      label: `${Math.round(interpolate(f, [16, 60], [0, mock.statsUsers], { extrapolateRight: "clamp" })).toLocaleString()}+ happy customers`,
      delay: 10,
      icon: "people" as const,
    },
    {
      label: mock.cityState,
      delay: 20,
      icon: "pin" as const,
    },
  ];

  return (
    <AbsoluteFill
      style={{
        background: BG,
        ...safeZonePadding(),
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ width: safeContentWidth() }}>
        {lines.map((line, i) => {
          const st = spring({ frame: f - line.delay, fps, config: { damping: 15 } });
          return (
            <div
              key={line.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 18,
                transform: `translateY(${interpolate(st, [0, 1], [80, 0])}px)`,
                opacity: st,
              }}
            >
              {line.icon === "star" && <StarShape size={36} fillFraction={1} />}
              {line.icon === "people" && (
                <svg width="36" height="36" viewBox="0 0 24 24">
                  <path fill={GOLD} d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
              )}
              {line.icon === "pin" && (
                <svg width="36" height="36" viewBox="0 0 24 24">
                  <path fill={GOLD} d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                </svg>
              )}
              <span style={{ fontFamily: interFont.fontFamily, fontSize: 38, color: TEXT, fontWeight: 600 }}>
                {line.label}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/**
 * シーン5: CTA と連絡先。
 */
const TSceneCta: React.FC<SceneProps> = ({ sceneStart }) => {
  const g = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = g - sceneStart;
  const title = spring({ frame: f, fps, config: { damping: 14 } });
  const btn = spring({ frame: f - 8, fps, config: { damping: 15 } });

  return (
    <AbsoluteFill
      style={{
        background: BG,
        ...safeZonePadding(),
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontFamily: interFont.fontFamily,
          fontWeight: 800,
          fontSize: 56,
          color: TEXT,
          textAlign: "center",
          transform: `scale(${interpolate(title, [0, 1], [0.92, 1])})`,
          opacity: title,
        }}
      >
        {mock.businessName}
      </div>
      <div
        style={{
          marginTop: 32,
          width: safeContentWidth(),
          height: 72,
          borderRadius: 16,
          background: GOLD,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: interFont.fontFamily,
          fontWeight: 700,
          fontSize: 40,
          color: "#fff",
          transform: `translateY(${interpolate(btn, [0, 1], [40, 0])}px)`,
          opacity: btn,
        }}
      >
        {mock.ctaLabel}
      </div>
      <div
        style={{
          marginTop: 20,
          fontFamily: interFont.fontFamily,
          fontWeight: 600,
          fontSize: 36,
          color: MUTED,
          textAlign: "center",
        }}
      >
        {mock.phoneOrUrl}
      </div>
    </AbsoluteFill>
  );
};

const TA = 0;
const TB = TA + 90;
const TC = TB + 90;
const TD = TC + 270;
const TE = TD + 90;

/**
 * 5シーンのメインコンポジション。
 */
export const TestimonialSabrina: React.FC = () => {
  useInterFontReady();

  return (
    <AbsoluteFill style={{ background: BG }}>
      <Sequence from={TA} durationInFrames={90}>
        <TSceneHook sceneStart={TA} />
      </Sequence>
      <Sequence from={TB} durationInFrames={90}>
        <TSceneStars sceneStart={TB} />
      </Sequence>
      <Sequence from={TC} durationInFrames={270}>
        <TSceneReviews sceneStart={TC} />
      </Sequence>
      <Sequence from={TD} durationInFrames={90}>
        <TSceneStats sceneStart={TD} />
      </Sequence>
      <Sequence from={TE} durationInFrames={60}>
        <TSceneCta sceneStart={TE} />
      </Sequence>
    </AbsoluteFill>
  );
};
