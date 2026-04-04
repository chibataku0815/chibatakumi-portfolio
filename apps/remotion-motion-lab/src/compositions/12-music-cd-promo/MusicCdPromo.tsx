import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  useAudioData,
  useWindowedAudioData,
  visualizeAudio,
} from "@remotion/media-utils";
import { COLORS } from "../../lib/colors";
import {
  FILMTONE_GENTLE,
  FILMTONE_POP,
  FILMTONE_SPRING,
} from "../../lib/springs";
import { filmtoneFadeIn } from "../../lib/transitions";
import { FONTS, TYPE_SCALE } from "../../lib/typography";

/**
 * audio-reactive 検証で使う fallback 音源です。
 *
 * 主な仕様:
 * - `staticFile()` は文字列リテラルで呼ぶ
 * - public 配下の生成済み wav を参照する
 *
 * 制限事項:
 * - 本番 BGM ではなく、render と reactivity の確認用です
 */
const musicAudioSrc = staticFile("phase3-fallback-tone.wav");

/**
 * Scene の長さです。
 *
 * 主な仕様:
 * - Hook → Logo → Counter → Showcase → CTA の 5 scene を固定する
 * - 合計 900 frames = 30 秒に揃える
 *
 * 制限事項:
 * - 今回は scene 数を増やさない
 */
const sceneFrames = {
  hook: 150,
  logo: 150,
  counter: 150,
  showcase: 240,
  cta: 210,
} as const;

/**
 * Count-up で使う数字カードです。
 *
 * @property {string} label 何の数字かを説明する名前です。
 * @property {number} target 最終的に見せたい数字です。
 * @property {string} suffix 数字の後ろにつける記号です。
 */
interface CounterCardConfig {
  label: string;
  target: number;
  suffix: string;
}

/**
 * Showcase で使う preset card の設定です。
 *
 * @property {string} title カード名です。
 * @property {[string, string]} colors 背景グラデーションです。
 * @property {string} note 補足コピーです。
 */
interface ShowcaseCardConfig {
  title: string;
  colors: [string, string];
  note: string;
}

/**
 * Counter に表示する数字群です。
 *
 * 主な仕様:
 * - Music CD promo の count-up 学習を、Filmtone 用の数字訴求に置き換える
 *
 * 制限事項:
 * - 今回は 3 枚だけに絞る
 */
const counterCards: CounterCardConfig[] = [
  { label: "Photos batched", target: 12000, suffix: "+" },
  { label: "Free presets", target: 4, suffix: "" },
  { label: "Desktop export", target: 100, suffix: "%" },
];

/**
 * Showcase 用のカード一覧です。
 *
 * 主な仕様:
 * - アルバムカバーの代わりに preset thumbnail を使う
 * - 色温度の違いを scene 内で見比べられるようにする
 *
 * 制限事項:
 * - 実写真はまだ使わない
 */
const showcaseCards: ShowcaseCardConfig[] = [
  {
    title: "Portra 400",
    colors: ["#fbbf24", "#78350f"],
    note: "warm portrait lift",
  },
  {
    title: "Cinestill 800T",
    colors: ["#115e59", "#f97316"],
    note: "teal to tungsten",
  },
  {
    title: "Velvia 50",
    colors: ["#dc2626", "#fb923c"],
    note: "contrast and vivid reds",
  },
  {
    title: "Tri-X 400",
    colors: ["#d6d3d1", "#44403c"],
    note: "soft monochrome grain",
  },
];

/**
 * 配列の平均値を計算します。
 *
 * 概要:
 * - audio sample 群から「今どれくらい反応させるか」の 1 つの数字を作ります
 *
 * 主な仕様:
 * - 配列が空なら 0 を返す
 *
 * 制限事項:
 * - ピーク値ではなく平均値なので、激しい跳ねは出しません
 *
 * @param {number[]} values 平均をとる数値配列です。
 * @returns {number} 平均値です。
 */
function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const total = values.reduce((sum, current) => sum + current, 0);
  return total / values.length;
}

/**
 * audio sample の平均を、穏やかな 0-1 スケールへ丸めます。
 *
 * 概要:
 * - Audio-Reactive Carnival を避けるため、反応量を小さく制限します
 *
 * 主な仕様:
 * - 上限を 1 に clamp する
 * - 小さい音でも少しだけ動くよう倍率をかける
 *
 * 制限事項:
 * - 大きい音でも派手に跳ねない
 *
 * @param {number[]} values 可視化済みの sample 配列です。
 * @returns {number} 0-1 に正規化した反応量です。
 */
function normalizeAudioLevel(values: number[]): number {
  return Math.min(1, average(values) * 3.2);
}

/**
 * 現在フレームの audio-reactive 値をまとめて返す custom hook です。
 *
 * 概要:
 * - `useAudioData()` で全体の音を取得する
 * - `useWindowedAudioData()` で今の周辺だけを切り出す
 * - 両方を使い分けて、全体のうねりと近接反応を分ける
 *
 * 主な仕様:
 * - 音がまだ読めないときは fallback の正弦波で動かす
 * - 詳細メッセージを返し、画面に理由を出せるようにする
 *
 * 制限事項:
 * - fallback は本物の BGM 解析ではない
 *
 * @returns {{globalLevel: number; localLevel: number; audioReady: boolean; statusMessage: string | null}} 反応量と状態です。
 */
function useReactiveAudioLevels(): {
  globalLevel: number;
  localLevel: number;
  audioReady: boolean;
  statusMessage: string | null;
} {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fullAudioData = useAudioData(musicAudioSrc);
  const windowedAudioData = useWindowedAudioData({
    src: musicAudioSrc,
    frame,
    fps,
    windowInSeconds: 0.35,
  });

  const fallbackLevel = 0.18 + 0.08 * Math.sin((frame / fps) * Math.PI * 2 * 0.55);

  const fullSamples = fullAudioData
    ? visualizeAudio({
        audioData: fullAudioData,
        frame,
        fps,
        numberOfSamples: 16,
      })
    : [];

  const windowedSamples = windowedAudioData.audioData
    ? visualizeAudio({
        audioData: windowedAudioData.audioData,
        frame,
        fps,
        numberOfSamples: 8,
        dataOffsetInSeconds: windowedAudioData.dataOffsetInSeconds,
      })
    : [];

  const audioReady = Boolean(fullAudioData && windowedAudioData.audioData);
  const statusMessage = audioReady
    ? null
    : `MusicCdPromo: useAudioData(src=${musicAudioSrc}) または useWindowedAudioData(src=${musicAudioSrc}, frame=${frame}, fps=${fps}, windowInSeconds=0.35) がまだ null を返しています。fallback reactive level を使用します。`;

  return {
    globalLevel: audioReady ? normalizeAudioLevel(fullSamples) : fallbackLevel,
    localLevel: audioReady ? normalizeAudioLevel(windowedSamples) : fallbackLevel * 0.9,
    audioReady,
    statusMessage,
  };
}

/**
 * 画面上部の section label です。
 *
 * 概要:
 * - 今どの scene かを静かに伝える補助ラベルです
 *
 * @param {Object} props 表示内容です。
 * @param {string} props.text 表示するラベル文字です。
 * @returns {React.ReactElement} ラベル要素です。
 */
function SceneLabel(props: { text: string }): React.ReactElement {
  return (
    <div
      style={{
        fontFamily: FONTS.inter,
        fontSize: 18,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: COLORS.textMuted,
      }}
    >
      {props.text}
    </div>
  );
}

/**
 * Hook scene です。
 *
 * 概要:
 * - 最初の 5 秒で「音に合わせて全部は動かさないが、空気は揺れている」ことを見せます
 *
 * 主な仕様:
 * - タイトル
 * - 細い accent line
 * - 小さな glow
 *
 * 制限事項:
 * - 波形バーのような賑やかな表現はしない
 *
 * @param {Object} props scene に必要な反応量です。
 * @param {number} props.globalLevel 全体の反応量です。
 * @param {number} props.localLevel 近接フレームの反応量です。
 * @returns {React.ReactElement} Hook scene です。
 */
function HookScene(props: {
  globalLevel: number;
  localLevel: number;
}): React.ReactElement {
  const { globalLevel, localLevel } = props;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = filmtoneFadeIn(frame, 0, fps, 0.9);
  const subtitleOpacity = filmtoneFadeIn(frame, 14, fps, 0.8);
  const lineScale = 0.78 + localLevel * 0.18;

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
          gap: 22,
          opacity: titleOpacity,
        }}
      >
        <SceneLabel text="Hook" />
        <div
          style={{
            fontFamily: FONTS.inter,
            fontSize: 88,
            fontWeight: 700,
            color: COLORS.warmWhite,
            textAlign: "center",
            lineHeight: 1.05,
            textShadow: `0 0 ${14 + globalLevel * 24}px rgba(254, 243, 199, 0.12)`,
          }}
        >
          Your color
          <br />
          has a pulse.
        </div>
        <div
          style={{
            width: 420,
            height: 4,
            transform: `scaleX(${lineScale})`,
            transformOrigin: "center",
            borderRadius: 999,
            background: `linear-gradient(90deg, ${COLORS.transparent} 0%, ${COLORS.cream} 20%, ${COLORS.amber} 50%, ${COLORS.cream} 80%, ${COLORS.transparent} 100%)`,
            boxShadow: `0 0 ${10 + globalLevel * 20}px rgba(217, 119, 6, 0.22)`,
          }}
        />
        <div
          style={{
            fontFamily: FONTS.mixed,
            fontSize: TYPE_SCALE.body,
            color: COLORS.textPrimary,
            opacity: subtitleOpacity,
            maxWidth: 820,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Music reactive は背景と光だけをゆっくり揺らし、
          写真やカードが主役のまま残るように抑える。
        </div>
      </div>
    </AbsoluteFill>
  );
}

/**
 * Logo scene です。
 *
 * 概要:
 * - Hook の次に、ロゴとブランドの温度感を静かに置く scene です
 *
 * 主な仕様:
 * - ロゴの gentle settle
 * - 背後の glow が少しだけ音に反応する
 *
 * 制限事項:
 * - 過度な bounce は入れない
 *
 * @param {Object} props scene に必要な反応量です。
 * @param {number} props.localLevel 近接フレームの反応量です。
 * @returns {React.ReactElement} Logo scene です。
 */
function LogoScene(props: { localLevel: number }): React.ReactElement {
  const { localLevel } = props;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSpring = spring({
    frame,
    fps,
    config: FILMTONE_GENTLE,
    durationInFrames: 36,
  });
  const logoScale = interpolate(logoSpring, [0, 1], [1.08, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const orbScale = 1 + localLevel * 0.12;

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
          position: "absolute",
          width: 380,
          height: 380,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(254, 243, 199, 0.24) 0%, rgba(217, 119, 6, 0.10) 42%, rgba(217, 119, 6, 0) 72%)",
          transform: `scale(${orbScale})`,
          filter: "blur(10px)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
          transform: `scale(${logoScale})`,
        }}
      >
        <SceneLabel text="Logo" />
        <div
          style={{
            fontFamily: FONTS.inter,
            fontSize: 118,
            fontWeight: 700,
            color: COLORS.warmWhite,
            letterSpacing: "-0.03em",
          }}
        >
          Filmtone
        </div>
        <div
          style={{
            fontFamily: FONTS.inter,
            fontSize: 28,
            color: COLORS.textPrimary,
            letterSpacing: "0.06em",
          }}
        >
          Audio-reactive warmth, not noise
        </div>
      </div>
    </AbsoluteFill>
  );
}

/**
 * Counter scene の 1 枚分カードです。
 *
 * 概要:
 * - count-up animation を Filmtone 用の数字訴求へ置き換えます
 *
 * @param {Object} props カード描画に必要な情報です。
 * @param {CounterCardConfig} props.config 表示内容です。
 * @param {number} props.index 表示順です。
 * @param {number} props.localLevel 近接フレームの反応量です。
 * @returns {React.ReactElement} 数字カードです。
 */
function CounterCard(props: {
  config: CounterCardConfig;
  index: number;
  localLevel: number;
}): React.ReactElement {
  const { config, index, localLevel } = props;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const valueSpring = spring({
    frame: Math.max(0, frame - index * 8),
    fps,
    config: FILMTONE_POP,
    durationInFrames: 34,
  });
  const displayValue = Math.min(
    config.target,
    Math.round(interpolate(valueSpring, [0, 1], [0, config.target])),
  );
  const cardGlow = 0.14 + localLevel * 0.08;

  return (
    <div
      style={{
        width: 300,
        padding: "28px 26px",
        borderRadius: 24,
        backgroundColor: "rgba(28, 25, 23, 0.68)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: `0 0 24px rgba(217, 119, 6, ${cardGlow})`,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.inter,
          fontSize: 64,
          fontWeight: 700,
          color: COLORS.warmWhite,
        }}
      >
        {displayValue.toLocaleString()}
        {config.suffix}
      </div>
      <div
        style={{
          fontFamily: FONTS.inter,
          fontSize: 22,
          color: COLORS.textMuted,
        }}
      >
        {config.label}
      </div>
    </div>
  );
}

/**
 * Counter scene です。
 *
 * 概要:
 * - 5 scene の真ん中で count-up animation を検証します
 *
 * @param {Object} props scene に必要な反応量です。
 * @param {number} props.localLevel 近接フレームの反応量です。
 * @returns {React.ReactElement} Counter scene です。
 */
function CounterScene(props: { localLevel: number }): React.ReactElement {
  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 30,
      }}
    >
      <SceneLabel text="Counter" />
      <div
        style={{
          fontFamily: FONTS.inter,
          fontSize: 44,
          fontWeight: 600,
          color: COLORS.textPrimary,
        }}
      >
        Numbers that support the motion
      </div>
      <div
        style={{
          display: "flex",
          gap: 22,
        }}
      >
        {counterCards.map((config, index) => (
          <CounterCard
            key={config.label}
            config={config}
            index={index}
            localLevel={props.localLevel}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
}

/**
 * Showcase scene の 1 枚カードです。
 *
 * 概要:
 * - preset thumbnail を 1 枚ずつ主役にしながら見せます
 *
 * @param {Object} props 描画に必要な情報です。
 * @param {ShowcaseCardConfig} props.config カード設定です。
 * @param {boolean} props.isActive 今そのカードを主役にするかどうかです。
 * @param {number} props.localLevel 近接フレームの反応量です。
 * @returns {React.ReactElement} Showcase 用カードです。
 */
function ShowcaseCard(props: {
  config: ShowcaseCardConfig;
  isActive: boolean;
  localLevel: number;
}): React.ReactElement {
  const { config, isActive, localLevel } = props;

  const scale = isActive ? 1 + localLevel * 0.05 : 0.96;
  const opacity = isActive ? 1 : 0.54;

  return (
    <div
      style={{
        width: 220,
        opacity,
        transform: `scale(${scale})`,
        transition: "transform 180ms linear, opacity 180ms linear",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div
        style={{
          height: 300,
          borderRadius: 28,
          background: `linear-gradient(145deg, ${config.colors[0]} 0%, ${config.colors[1]} 100%)`,
          boxShadow: isActive
            ? `0 0 34px rgba(217, 119, 6, ${0.18 + localLevel * 0.16})`
            : "none",
        }}
      />
      <div
        style={{
          fontFamily: FONTS.inter,
          fontSize: 24,
          fontWeight: 600,
          color: COLORS.warmWhite,
        }}
      >
        {config.title}
      </div>
      <div
        style={{
          fontFamily: FONTS.inter,
          fontSize: 18,
          color: COLORS.textMuted,
          lineHeight: 1.45,
        }}
      >
        {config.note}
      </div>
    </div>
  );
}

/**
 * Showcase scene です。
 *
 * 概要:
 * - 4 枚の preset thumbnail を順に主役へ切り替えます
 *
 * @param {Object} props scene に必要な反応量です。
 * @param {number} props.localLevel 近接フレームの反応量です。
 * @returns {React.ReactElement} Showcase scene です。
 */
function ShowcaseScene(props: { localLevel: number }): React.ReactElement {
  const frame = useCurrentFrame();
  const activeIndex = Math.floor(frame / 60) % showcaseCards.length;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
      }}
    >
      <SceneLabel text="Showcase" />
      <div
        style={{
          fontFamily: FONTS.inter,
          fontSize: 42,
          fontWeight: 600,
          color: COLORS.textPrimary,
        }}
      >
        Warm gradients as scene glue
      </div>
      <div
        style={{
          display: "flex",
          gap: 22,
        }}
      >
        {showcaseCards.map((config, index) => (
          <ShowcaseCard
            key={config.title}
            config={config}
            isActive={index === activeIndex}
            localLevel={props.localLevel}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
}

/**
 * CTA scene です。
 *
 * 概要:
 * - 最後に URL と行動を静かに置きます
 * - 音源の読み込みに問題がある場合だけ、詳細メッセージも小さく出します
 *
 * @param {Object} props scene に必要な情報です。
 * @param {number} props.globalLevel 全体の反応量です。
 * @param {boolean} props.audioReady 音が読めているかどうかです。
 * @param {string | null} props.statusMessage 読み込み状況の詳細です。
 * @returns {React.ReactElement} CTA scene です。
 */
function CtaScene(props: {
  globalLevel: number;
  audioReady: boolean;
  statusMessage: string | null;
}): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = filmtoneFadeIn(frame, 0, fps, 0.8);
  const subtitleOpacity = filmtoneFadeIn(frame, 10, fps, 0.8);
  const buttonScale = 1 + props.globalLevel * 0.03;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
      }}
    >
      <SceneLabel text="CTA" />
      <div
        style={{
          fontFamily: FONTS.inter,
          fontSize: 72,
          fontWeight: 700,
          color: COLORS.warmWhite,
          opacity: titleOpacity,
        }}
      >
        filmtone.app
      </div>
      <div
        style={{
          fontFamily: FONTS.mixed,
          fontSize: TYPE_SCALE.body,
          color: COLORS.textPrimary,
          opacity: subtitleOpacity,
          textAlign: "center",
        }}
      >
        Try free. Keep the motion quiet.
      </div>
      <div
        style={{
          marginTop: 14,
          padding: "16px 30px",
          borderRadius: 999,
          border: `1px solid rgba(254, 243, 199, 0.22)`,
          backgroundColor: "rgba(28, 25, 23, 0.65)",
          color: COLORS.cream,
          fontFamily: FONTS.inter,
          fontSize: 24,
          fontWeight: 600,
          transform: `scale(${buttonScale})`,
          boxShadow: `0 0 ${18 + props.globalLevel * 24}px rgba(217, 119, 6, 0.16)`,
        }}
      >
        Try before you pay
      </div>

      {!props.audioReady && props.statusMessage ? (
        <div
          style={{
            marginTop: 22,
            maxWidth: 960,
            fontFamily: FONTS.mixed,
            fontSize: 16,
            color: COLORS.textMuted,
            lineHeight: 1.5,
            textAlign: "center",
          }}
        >
          {props.statusMessage}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}

/**
 * 現在フレームの背景グラデーションを決めます。
 *
 * 概要:
 * - scene 間の色温度遷移を、この helper 1 つで管理します
 *
 * 主な仕様:
 * - 上下で別色を補間する
 * - 音量に応じて glow を少しだけ足す
 *
 * 制限事項:
 * - 大きな色ジャンプは避ける
 *
 * @param {number} frame 現在フレームです。
 * @param {number} globalLevel 全体の反応量です。
 * @returns {React.CSSProperties} 背景用の style です。
 */
function resolveBackgroundStyle(
  frame: number,
  globalLevel: number,
): React.CSSProperties {
  const topColor = interpolateColors(
    frame,
    [0, 150, 300, 450, 690, 899],
    ["#18110d", "#201512", "#1f1a17", "#25140e", "#180f0c", "#120c0a"],
  );
  const bottomColor = interpolateColors(
    frame,
    [0, 150, 300, 450, 690, 899],
    ["#0c0a09", "#120d0b", "#17110f", "#1c120d", "#120d0b", "#090807"],
  );

  return {
    background: `linear-gradient(180deg, ${topColor} 0%, ${bottomColor} 100%)`,
    boxShadow: `inset 0 0 ${80 + globalLevel * 90}px rgba(217, 119, 6, 0.08)`,
  };
}

/**
 * #12 Music CD Store Promo の本体です。
 *
 * 概要:
 * - 5 scene 構造を守りながら、audio-reactive と gradient transition を Filmtone 用に控えめに検証します
 *
 * 主な仕様:
 * - `useAudioData()` と `useWindowedAudioData()` の両方を使う
 * - `Audio` で fallback 音源を載せる
 * - count-up と showcase を 1 本にまとめる
 *
 * 制限事項:
 * - 実 BGM と実素材は後差し替え前提です
 */
export function MusicCdPromo(): React.ReactElement {
  const frame = useCurrentFrame();
  const reactive = useReactiveAudioLevels();
  const backgroundStyle = resolveBackgroundStyle(frame, reactive.globalLevel);

  const hookFrom = 0;
  const logoFrom = hookFrom + sceneFrames.hook;
  const counterFrom = logoFrom + sceneFrames.logo;
  const showcaseFrom = counterFrom + sceneFrames.counter;
  const ctaFrom = showcaseFrom + sceneFrames.showcase;

  return (
    <AbsoluteFill style={backgroundStyle}>
      <Audio src={musicAudioSrc} volume={0.38} />

      <Sequence from={hookFrom} durationInFrames={sceneFrames.hook}>
        <HookScene
          globalLevel={reactive.globalLevel}
          localLevel={reactive.localLevel}
        />
      </Sequence>

      <Sequence from={logoFrom} durationInFrames={sceneFrames.logo}>
        <LogoScene localLevel={reactive.localLevel} />
      </Sequence>

      <Sequence from={counterFrom} durationInFrames={sceneFrames.counter}>
        <CounterScene localLevel={reactive.localLevel} />
      </Sequence>

      <Sequence from={showcaseFrom} durationInFrames={sceneFrames.showcase}>
        <ShowcaseScene localLevel={reactive.localLevel} />
      </Sequence>

      <Sequence from={ctaFrom} durationInFrames={sceneFrames.cta}>
        <CtaScene
          globalLevel={reactive.globalLevel}
          audioReady={reactive.audioReady}
          statusMessage={reactive.statusMessage}
        />
      </Sequence>
    </AbsoluteFill>
  );
}
