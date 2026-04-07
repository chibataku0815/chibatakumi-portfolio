/**
 * @fileoverview Sabrina 系プロンプト P1 の6シーン縦型デモ（25秒・30fps）。
 * セーフゾーン・最小フォントサイズはプロンプト値に合わせ、素材は public/fixtures の SVG。
 */
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  random,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { interFont, useInterFontReady } from "../lib/interFont";
import { safeContentWidth, safeZonePadding } from "../lib/safeZone";

/** ブランドのアクセント（ラジアルグロー用） */
const BRAND_ACCENT = "#6366f1";

/** モック製品名 */
const MOCK_PRODUCT = "Acme Flow";

/** モックタグライン */
const MOCK_TAGLINE = "Ship faster with one click";

/** フック用の痛みクエスチョン */
const MOCK_PAIN = "Still juggling tasks manually?";

/** CTA URL（プレースホルダ） */
const MOCK_URL = "https://your-product-url.com";

/** 擬似デモで打つ文字列 */
const DEMO_INPUT_TEXT = "Launch my week";

/** ソーシャルプルーフの数（カウントアップ用） */
const MOCK_USER_COUNT = 50_000;

/** 画像ごとの見出し（56px 相当） */
const IMAGE_HEADLINES = [
  "Your command center",
  "Clarity at a glance",
  "Delightful workflow",
];

/** 機能3行 */
const FEATURE_LINES = [
  { icon: "check" as const, text: "Fast automations" },
  { icon: "bolt" as const, text: "Secure by default" },
  { icon: "star" as const, text: "Zero busywork" },
];

/** spring の人間っぽいカーソル用（damping 15） */
const springHuman = {
  damping: 15,
};

type SceneFrameProps = {
  /** このシーンの Sequence の from フレーム（ローカル計算用） */
  sceneStart: number;
};

/**
 * シーン1: 痛みの問いかけがスプリングで 2x→1x、2秒ホールド後フェードアウト。
 */
const ProductSceneHook: React.FC<SceneFrameProps> = ({ sceneStart }) => {
  const global = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = global - sceneStart;
  const enter = spring({ frame: f, fps, config: { damping: 14, stiffness: 120 } });
  const scale = interpolate(enter, [0, 1], [2, 1]);
  const opacity =
    f < 60 ? 1 : interpolate(f, [60, 90], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 35%, ${BRAND_ACCENT}44 0%, #0a0a0a 55%)`,
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
          color: "#ffffff",
          textAlign: "center",
          transform: `scale(${scale})`,
          opacity,
          lineHeight: 1.15,
          maxWidth: safeContentWidth(),
        }}
      >
        {MOCK_PAIN}
      </div>
    </AbsoluteFill>
  );
};

/**
 * シーン2: ロゴ相当のタイポが 3x→1x、パーティクルが吹き飛び、タグラインが下から出る。
 */
const ProductSceneIntro: React.FC<SceneFrameProps> = ({ sceneStart }) => {
  const global = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = global - sceneStart;
  const logoSpring = spring({ frame: f - 3, fps, config: { damping: 13, stiffness: 110 } });
  const logoScale = interpolate(logoSpring, [0, 1], [3, 1]);
  const tagY = spring({ frame: f - 12, fps, config: { damping: 16 } });

  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => {
        const angle = (i / 20) * Math.PI * 2 + random(`p-${i}`) * 0.4;
        const dist = 120 + random(`d-${i}`) * 180;
        return { angle, dist };
      }),
    [],
  );

  return (
    <AbsoluteFill
      style={{
        background: "#050505",
        ...safeZonePadding(),
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {particles.map((p, i) => {
        const t = spring({ frame: f - 6 - i * 2, fps, config: { damping: 14 } });
        const r = interpolate(t, [0, 1], [0, 1]);
        const x = Math.cos(p.angle) * p.dist * r;
        const y = Math.sin(p.angle) * p.dist * r;
        const o = interpolate(r, [0, 0.8, 1], [0, 0.55, 0]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "42%",
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: BRAND_ACCENT,
              opacity: o,
              transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
            }}
          />
        );
      })}
      <div
        style={{
          fontFamily: interFont.fontFamily,
          fontWeight: 800,
          fontSize: 72,
          color: "#fff",
          transform: `scale(${logoScale})`,
          textAlign: "center",
        }}
      >
        {MOCK_PRODUCT}
      </div>
      <div
        style={{
          marginTop: 24,
          fontFamily: interFont.fontFamily,
          fontWeight: 400,
          fontSize: 36,
          color: "#cbd5e1",
          textAlign: "center",
          transform: `translateY(${interpolate(tagY, [0, 1], [40, 0])}px)`,
          opacity: interpolate(tagY, [0, 0.3], [0, 1]),
          maxWidth: safeContentWidth(),
        }}
      >
        {MOCK_TAGLINE}
      </div>
    </AbsoluteFill>
  );
};

/**
 * 小さな白いカーソル（12px）とリップル演出付きの擬似 UI デモ。
 */
const ProductSceneDemo: React.FC<SceneFrameProps> = ({ sceneStart }) => {
  const global = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, global - sceneStart);
  const w = safeContentWidth();

  const toInput = spring({ frame: f, fps, config: springHuman });
  const cursorToInput = interpolate(toInput, [0, 1], [0, 1]);

  const inputTop = 380;
  /** safeZonePadding 済みコンテナ内なので左は 0 から */
  const inputLeft = 0;
  const inputW = w;
  const inputH = 72;
  const btnTop = inputTop + inputH + 40;
  const btnH = 64;

  const startCx = 200;
  const startCy = 200;
  const inputCx = inputLeft + inputW / 2;
  const inputCy = inputTop + inputH / 2;
  const btnCx = inputLeft + inputW / 2;
  const btnCy = btnTop + btnH / 2;

  const cx = interpolate(cursorToInput, [0, 1], [startCx, inputCx]);
  const cy = interpolate(cursorToInput, [0, 1], [startCy, inputCy]);

  const clickInputFrame = 42;
  const typeStart = clickInputFrame + 8;
  const charPerFrames = 3;
  const typeLen = Math.min(
    DEMO_INPUT_TEXT.length,
    Math.max(0, Math.floor((f - typeStart) / charPerFrames)),
  );
  const typed = DEMO_INPUT_TEXT.slice(0, typeLen);

  const toButton = spring({ frame: f - 120, fps, config: springHuman });
  const cursorOnButton = interpolate(toButton, [0, 1], [0, 1]);

  const cx2 = interpolate(cursorOnButton, [0, 1], [inputCx, btnCx]);
  const cy2 = interpolate(cursorOnButton, [0, 1], [inputCy, btnCy]);

  const afterMoveToButton = f >= 120;
  const curX = afterMoveToButton ? cx2 : cx;
  const curY = afterMoveToButton ? cy2 : cy;

  const rippleInput = f - clickInputFrame;
  const rippleBtn = f - 158;

  const loadingStart = 168;
  const loading = f >= loadingStart && f < loadingStart + 15;
  const resultsStart = loadingStart + 15;

  const card1 = spring({ frame: f - resultsStart, fps, config: { damping: 14 } });
  const card2 = spring({ frame: f - resultsStart - 6, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill
      style={{
        background: "#070708",
        ...safeZonePadding(),
        fontFamily: interFont.fontFamily,
      }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <div
          style={{
            position: "absolute",
            top: inputTop,
            left: inputLeft,
            width: inputW,
            height: inputH,
            borderRadius: 14,
            border: "2px solid #334155",
            background: "#0f172a",
            display: "flex",
            alignItems: "center",
            paddingLeft: 20,
            fontSize: 36,
            color: "#e2e8f0",
          }}
        >
          {typed}
        </div>
        {rippleInput > 0 && rippleInput < 25 && (
          <div
            style={{
              position: "absolute",
              left: inputCx,
              top: inputCy,
              width: 100,
              height: 100,
              marginLeft: -50,
              marginTop: -50,
              borderRadius: "50%",
              border: `3px solid ${BRAND_ACCENT}`,
              opacity: interpolate(rippleInput, [0, 25], [0.6, 0]),
              transform: `scale(${interpolate(rippleInput, [0, 25], [0.2, 2.2])})`,
            }}
          />
        )}

        <div
          style={{
            position: "absolute",
            top: btnTop,
            left: inputLeft,
            width: inputW,
            height: btnH,
            borderRadius: 14,
            background: BRAND_ACCENT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
            fontWeight: 700,
            color: "#fff",
            transform: `scale(${f >= 158 && f < 165 ? 0.95 : 1})`,
          }}
        >
          Generate
        </div>
        {rippleBtn > 0 && rippleBtn < 22 && (
          <div
            style={{
              position: "absolute",
              left: btnCx,
              top: btnCy,
              width: 120,
              height: 120,
              marginLeft: -60,
              marginTop: -60,
              borderRadius: "50%",
              border: "3px solid rgba(255,255,255,0.5)",
              opacity: interpolate(rippleBtn, [0, 22], [0.55, 0]),
              transform: `scale(${interpolate(rippleBtn, [0, 22], [0.15, 2])})`,
            }}
          />
        )}

        {loading && (
          <div
            style={{
              position: "absolute",
              left: btnCx - 20,
              top: btnCy + 80,
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "4px solid rgba(255,255,255,0.2)",
              borderTopColor: "#fff",
              transform: `rotate(${f * 25}deg)`,
            }}
          />
        )}

        <div
          style={{
            position: "absolute",
            top: btnTop + btnH + 100,
            left: inputLeft,
            width: inputW,
            gap: 16,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: 20,
              borderRadius: 16,
              background: "#111827",
              border: "1px solid #1f2937",
              fontSize: 36,
              color: "#e5e7eb",
              transform: `translateY(${interpolate(card1, [0, 1], [30, 0])}px)`,
              opacity: card1,
            }}
          >
            Result: Campaign ready
          </div>
          <div
            style={{
              padding: 20,
              borderRadius: 16,
              background: "#111827",
              border: "1px solid #1f2937",
              fontSize: 36,
              color: "#e5e7eb",
              transform: `translateY(${interpolate(card2, [0, 1], [30, 0])}px)`,
              opacity: card2,
            }}
          >
            ETA: 12 minutes saved
          </div>
        </div>

        {/* カーソル本体 */}
        <div
          style={{
            position: "absolute",
            left: curX,
            top: curY,
            width: 12,
            height: 12,
            marginLeft: -6,
            marginTop: -6,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.95)",
            boxShadow: "0 0 12px 6px rgba(255,255,255,0.35)",
          }}
        />
        {[8, 16].map((trail, idx) => (
          <div
            key={trail}
            style={{
              position: "absolute",
              left: curX - (idx + 1) * 3,
              top: curY - (idx + 1) * 3,
              width: 12,
              height: 12,
              marginLeft: -6,
              marginTop: -6,
              borderRadius: "50%",
              background: `rgba(255,255,255,${0.15 - idx * 0.05})`,
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

/**
 * シーン4: マーケ用 SVG を大きく表示し、約1.5秒ホールド＋クロスフェードでつなぐ。
 */
const ProductSceneImages: React.FC<SceneFrameProps> = ({ sceneStart }) => {
  const global = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = global - sceneStart;
  /** 各画像ホールド（45f≈1.5s）、合間 15f でクロスフェード */
  const hold = 45;
  const xfade = 15;
  const block = hold + xfade;
  const idx = Math.min(2, Math.floor(f / block));
  const local = f - idx * block;
  const mix = interpolate(local, [hold, hold + xfade], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scaleSpring = spring({ frame: local, fps, config: { damping: 15 } });
  const scale = interpolate(scaleSpring, [0, 1], [0.9, 1]);

  const headlineOpacity = interpolate(local, [4, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /** 各画像の不透明度（Img の src は常に staticFile リテラルで渡す） */
  let op1 = 0;
  let op2 = 0;
  let op3 = 0;
  if (idx === 0) {
    op1 = 1 - mix;
    op2 = mix;
  } else if (idx === 1) {
    op2 = 1 - mix;
    op3 = mix;
  } else {
    op3 = 1;
  }

  const imgStyle = (opacity: number): React.CSSProperties => ({
    position: "absolute",
    width: "100%",
    height: "100%",
    objectFit: "contain",
    borderRadius: 16,
    boxShadow: "0 28px 60px rgba(0,0,0,0.55)",
    transform: `scale(${scale})`,
    opacity,
  });

  return (
    <AbsoluteFill
      style={{
        background: "#020617",
        ...safeZonePadding(),
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontFamily: interFont.fontFamily,
          fontWeight: 700,
          fontSize: 56,
          color: "#f8fafc",
          textAlign: "center",
          marginBottom: 24,
          opacity: headlineOpacity,
          maxWidth: safeContentWidth(),
          lineHeight: 1.1,
        }}
      >
        {IMAGE_HEADLINES[idx]}
      </div>
      <div style={{ position: "relative", width: Math.min(safeContentWidth(), 920), height: 900 }}>
        <Img src={staticFile("fixtures/product-1.svg")} style={imgStyle(op1)} />
        <Img src={staticFile("fixtures/product-2.svg")} style={imgStyle(op2)} />
        <Img src={staticFile("fixtures/product-3.svg")} style={imgStyle(op3)} />
      </div>
    </AbsoluteFill>
  );
};

/** 簡易アイコン（線画） */
const FeatureIcon: React.FC<{ kind: "check" | "bolt" | "star"; color: string }> = ({
  kind,
  color,
}) => {
  const stroke = color;
  if (kind === "check") {
    return (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
        <path d="M5 12l5 5L20 7" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "bolt") {
    return (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
      <path d="M13 2L3 14h7l-1 8 12-14h-7l2-8z" fill={stroke} />
      </svg>
    );
  }
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3l2.2 5.3L20 9l-4.2 3.6L17 18l-5-2.9L7 18l1.2-5.4L4 9l5.8-.7L12 3z"
        stroke={stroke}
        strokeWidth="1.8"
        fill={stroke}
        fillOpacity={0.25}
      />
    </svg>
  );
};

/**
 * シーン5: 画像を上に小さく、下にベネフィット3行をスタッガーで表示。
 */
const ProductSceneFeatures: React.FC<SceneFrameProps> = ({ sceneStart }) => {
  const global = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = global - sceneStart;

  return (
    <AbsoluteFill
      style={{
        background: "#020617",
        ...safeZonePadding(),
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", height: "100%", alignItems: "center" }}>
        <div style={{ marginTop: 20, width: "100%", display: "flex", justifyContent: "center" }}>
          <Img
            src={staticFile("fixtures/product-1.svg")}
            style={{
              width: "40%",
              borderRadius: 16,
              boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
            }}
          />
        </div>
        <div style={{ marginTop: 48, width: "100%", maxWidth: safeContentWidth() }}>
          {FEATURE_LINES.map((line, i) => {
            const st = spring({ frame: f - i * 10, fps, config: { damping: 15 } });
            return (
              <div
                key={line.text}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 20,
                  transform: `translateX(${interpolate(st, [0, 1], [120, 0])}px)`,
                  opacity: st,
                }}
              >
                <FeatureIcon kind={line.icon} color={BRAND_ACCENT} />
                <span
                  style={{
                    fontFamily: interFont.fontFamily,
                    fontSize: 36,
                    fontWeight: 600,
                    color: "#f1f5f9",
                  }}
                >
                  {line.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/**
 * シーン6: カウントアップ + URL パルス + ブラックアウト。
 */
const ProductSceneCta: React.FC<SceneFrameProps> = ({ sceneStart }) => {
  const global = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = global - sceneStart;
  const count = Math.round(
    interpolate(f, [0, 75], [0, MOCK_USER_COUNT], { extrapolateRight: "clamp" }),
  );
  const pulse = spring({ frame: f, fps, config: { damping: 18, stiffness: 90 } });
  const s = interpolate(pulse, [0, 1], [1, 1.03]);
  const fadeBlack = interpolate(f, [60, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "#000",
        ...safeZonePadding(),
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 200,
      }}
    >
      <div
        style={{
          fontFamily: interFont.fontFamily,
          fontSize: 36,
          fontWeight: 700,
          color: "#e2e8f0",
          marginBottom: 24,
        }}
      >
        {count.toLocaleString()}+ users
      </div>
      <div
        style={{
          fontFamily: interFont.fontFamily,
          fontSize: 36,
          fontWeight: 600,
          color: BRAND_ACCENT,
          transform: `scale(${s})`,
          textAlign: "center",
        }}
      >
        {MOCK_URL}
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: fadeBlack, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

/** シーン開始フレーム（0-based、累積） */
const S1 = 0;
const S2 = S1 + 90;
const S3 = S2 + 90;
const S4 = S3 + 240;
const S5 = S4 + 150;
const S6 = S5 + 90;

/**
 * 6シーンを Sequence で直列につなげたメインコンポジション。
 */
export const ProductDemoSabrina: React.FC = () => {
  useInterFontReady();

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence from={S1} durationInFrames={90}>
        <ProductSceneHook sceneStart={S1} />
      </Sequence>
      <Sequence from={S2} durationInFrames={90}>
        <ProductSceneIntro sceneStart={S2} />
      </Sequence>
      <Sequence from={S3} durationInFrames={240}>
        <ProductSceneDemo sceneStart={S3} />
      </Sequence>
      <Sequence from={S4} durationInFrames={150}>
        <ProductSceneImages sceneStart={S4} />
      </Sequence>
      <Sequence from={S5} durationInFrames={90}>
        <ProductSceneFeatures sceneStart={S5} />
      </Sequence>
      <Sequence from={S6} durationInFrames={90}>
        <ProductSceneCta sceneStart={S6} />
      </Sequence>
    </AbsoluteFill>
  );
};
