import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "../../lib/colors";
import {
  FILMTONE_GENTLE,
  FILMTONE_POP,
  FILMTONE_SPRING,
} from "../../lib/springs";
import { filmtoneFadeIn, filmtoneFadeOut } from "../../lib/transitions";
import { SAFE_ZONE } from "../../lib/safeZone";
import { FONTS, TYPE_SCALE } from "../../lib/typography";

/**
 * #3 Product Demo (Presscut) の実装です。
 *
 * 概要:
 * - Presscut の「founder demo の構造」だけを学び、見た目は実際の Film Lab UI に寄せます
 * - `FilmLabFullPage` の hero visual、`ControlPanel`、`FilmLabControlPanelCore` の語彙を借ります
 *
 * 主な仕様:
 * - 4 scene 構成で、preview -> controls -> compare -> close を見せます
 * - fake search box や、実装に存在しない SaaS 風 UI は作りません
 *
 * 制限事項:
 * - 実レンダラの画面キャプチャは使わず、既存 UI をもとにした静的 mockup で構造だけ検証します
 * - 実画像アセットはまだ使わず、placeholder gradient で timing を先に固めます
 */

/**
 * preset strip で使う swatch 定義です。
 *
 * @property {string} name プリセット名です。
 * @property {string} color swatch の色です。
 */
interface PresetSwatch {
  name: string;
  color: string;
}

/**
 * control panel の section 定義です。
 *
 * @property {string} title 実 UI に合わせた section 名です。
 * @property {readonly string[]} sliders section に含める slider 名です。
 */
interface ControlSection {
  title: string;
  sliders: readonly string[];
}

/**
 * closing scene の bullet 定義です。
 *
 * @property {string} title 1 行目の見出しです。
 * @property {string} detail 2 行目の補足です。
 */
interface ClosingBullet {
  title: string;
  detail: string;
}

/**
 * scene の出入り timing です。
 *
 * 主な仕様:
 * - 既存 composition に合わせて 4 秒ずつ区切ります
 * - 少し遅い Filmtone pace を守るため、scene 境界でも急に切り替えません
 */
const sceneDuration = 120;
const totalFrames = sceneDuration * 4;
const previewWidth = 920;
const previewHeight = 560;

/**
 * 実 UI で使っているプリセット語彙を模した strip です。
 *
 * 制限事項:
 * - 色は hero visual に出てくる warm palette を参考にした static swatch です
 */
const presetSwatches: readonly PresetSwatch[] = [
  { name: "Cinematic", color: "#b87a3a" },
  { name: "Portra", color: "#c9a08e" },
  { name: "Gold", color: "#b89a4a" },
  { name: "Pro 400H", color: "#7a98aa" },
  { name: "Ektar", color: "#b85a3e" },
  { name: "Superia", color: "#6a906a" },
  { name: "CineStill", color: "#c48a42" },
  { name: "B&W", color: "#888888" },
] as const;

/**
 * 実 UI の control panel 語彙です。
 *
 * 制限事項:
 * - section 名と slider 名は `FilmLabControlPanelCore` にあるものだけへ寄せます
 */
const controlSections: readonly ControlSection[] = [
  { title: "Presets", sliders: ["Preset intensity", "Exposure"] },
  { title: "Artifacts", sliders: ["Film grain", "Vignette"] },
  { title: "Bloom", sliders: ["Strength", "Threshold"] },
  { title: "Halation", sliders: ["Intensity", "Spread"] },
  { title: "Compare", sliders: ["Before / After", "Slot A / B"] },
] as const;

/**
 * closing scene で見せる feature 要約です。
 *
 * 制限事項:
 * - Web と Desktop の実際の語彙から外れないようにしています
 */
const closingBullets: readonly ClosingBullet[] = [
  { title: "Preview in browser", detail: "実プレビューで tone と contrast をすぐ確認" },
  { title: "Compare A / B", detail: "slot 切替と before / after で差分を見る" },
  { title: "Desktop export", detail: "最後は高品質な書き出しへつなぐ" },
] as const;

/**
 * scene 共通の wrapper です。
 *
 * 概要:
 * - entry と exit の opacity / scale を軽く付けて scene をつなぎます
 *
 * @param {Object} props wrapper の props です。
 * @param {React.ReactNode} props.children scene 本体です。
 * @param {number} props.durationInFrames scene の長さです。
 * @returns {React.ReactElement} scene を包む共通 wrapper です。
 */
function SceneFrame(props: {
  children: React.ReactNode;
  durationInFrames: number;
}): React.ReactElement {
  const { children, durationInFrames } = props;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = filmtoneFadeIn(frame, 0, fps, 0.7);
  const fadeOut = filmtoneFadeOut(frame, durationInFrames - 22, fps, 0.55);
  const opacity = Math.min(fadeIn, fadeOut);
  const scale = interpolate(opacity, [0, 1], [0.985, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

/**
 * macOS window 風の外枠です。
 *
 * @param {Object} props wrapper の props です。
 * @param {React.ReactNode} props.children window 内の内容です。
 * @param {string} props.caption 右上に置く小さな caption です。
 * @returns {React.ReactElement} window 風のカードです。
 */
function MacWindowFrame(props: {
  children: React.ReactNode;
  caption: string;
}): React.ReactElement {
  const { children, caption } = props;

  return (
    <div
      style={{
        width: previewWidth,
        borderRadius: 28,
        overflow: "hidden",
        background:
          "linear-gradient(180deg, rgba(28, 25, 23, 0.98) 0%, rgba(16, 14, 13, 0.98) 100%)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 30px 80px rgba(0, 0, 0, 0.34)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "14px 18px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.16)" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.16)" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.16)" }} />
        <div
          style={{
            marginLeft: "auto",
            fontFamily: FONTS.inter,
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.28)",
          }}
        >
          {caption}
        </div>
      </div>
      {children}
    </div>
  );
}

/**
 * before / after preview です。
 *
 * @param {Object} props preview の props です。
 * @param {number} props.dividerProgress divider の位置を決める 0-1 値です。
 * @param {string} props.rightLabel 右側に出す preset 名です。
 * @returns {React.ReactElement} 実 UI に寄せた compare preview です。
 */
function ComparePreview(props: {
  dividerProgress: number;
  rightLabel: string;
}): React.ReactElement {
  const { dividerProgress, rightLabel } = props;
  const dividerX = interpolate(dividerProgress, [0, 1], [0.42, 0.62], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "relative",
        height: previewHeight - 82,
        margin: "16px 16px 0",
        borderRadius: 22,
        overflow: "hidden",
        backgroundColor: "#171412",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(120, 136, 166, 0.36) 0%, rgba(64, 74, 92, 0.90) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: `inset(0 0 0 ${dividerX * 100}%)`,
          background:
            "linear-gradient(135deg, rgba(230, 192, 126, 0.88) 0%, rgba(125, 72, 28, 0.90) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: `calc(${dividerX * 100}% - 1px)`,
          top: 0,
          bottom: 0,
          width: 2,
          backgroundColor: "rgba(255,255,255,0.74)",
          boxShadow: "0 0 18px rgba(255,255,255,0.18)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 24,
          top: 20,
          fontFamily: FONTS.inter,
          fontSize: 14,
          fontWeight: 600,
          color: "rgba(255,255,255,0.64)",
        }}
      >
        Original
      </div>
      <div
        style={{
          position: "absolute",
          right: 24,
          top: 20,
          fontFamily: FONTS.inter,
          fontSize: 14,
          fontWeight: 600,
          color: "rgba(255,255,255,0.64)",
        }}
      >
        {rightLabel}
      </div>
    </div>
  );
}

/**
 * 実 UI に寄せた preset strip です。
 *
 * @param {Object} props strip の props です。
 * @param {number} props.offsetFrame stagger 計算の起点フレームです。
 * @returns {React.ReactElement} preset strip です。
 */
function PresetStrip(props: { offsetFrame: number }): React.ReactElement {
  const { offsetFrame } = props;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "18px 18px 20px",
      }}
    >
      {presetSwatches.map((swatch, index) => {
        const chipProgress = spring({
          frame: Math.max(0, frame - offsetFrame - index * 3),
          fps,
          config: FILMTONE_SPRING,
        });
        const chipScale = interpolate(chipProgress, [0, 1], [0.8, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={swatch.name}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              opacity: chipProgress,
              transform: `scale(${chipScale})`,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                backgroundColor: swatch.color,
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            />
            <div
              style={{
                fontFamily: FONTS.inter,
                fontSize: 9,
                color: "rgba(255,255,255,0.28)",
              }}
            >
              {swatch.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * control panel の 1 section です。
 *
 * @param {Object} props panel の props です。
 * @param {ControlSection} props.section section 定義です。
 * @param {number} props.index section の並び順です。
 * @returns {React.ReactElement} 実 UI 風の control section です。
 */
function ControlSectionCard(props: {
  section: ControlSection;
  index: number;
}): React.ReactElement {
  const { section, index } = props;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entry = spring({
    frame: Math.max(0, frame - 10 - index * 6),
    fps,
    config: FILMTONE_GENTLE,
  });

  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.07)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.10) 100%)",
        padding: "16px 16px 14px",
        opacity: entry,
        transform: `translateY(${interpolate(entry, [0, 1], [10, 0])}px)`,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.inter,
          fontSize: 13,
          fontWeight: 600,
          color: COLORS.warmWhite,
          marginBottom: 12,
        }}
      >
        {section.title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {section.sliders.map((label, sliderIndex) => {
          const fill = 0.28 + ((index * 17 + sliderIndex * 19) % 45) / 100;
          return (
            <div key={label}>
              <div
                style={{
                  fontFamily: FONTS.inter,
                  fontSize: 11,
                  color: COLORS.textMuted,
                  marginBottom: 6,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  height: 6,
                  borderRadius: 999,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${fill * 100}%`,
                    height: "100%",
                    borderRadius: 999,
                    background:
                      "linear-gradient(90deg, rgba(217,119,6,0.86) 0%, rgba(254,243,199,0.86) 100%)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * scene 1 です。
 *
 * 概要:
 * - LP の hero visual を Remotion 内で再構成します
 * - founder demo の導入として「まず何が見えるか」を整理します
 *
 * @returns {React.ReactElement} hero scene です。
 */
function HeroScene(): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleProgress = spring({
    frame,
    fps,
    config: FILMTONE_GENTLE,
  });
  const copyOpacity = filmtoneFadeIn(frame, 10, fps, 0.8);

  return (
    <SceneFrame durationInFrames={sceneDuration}>
      <AbsoluteFill
        style={{
          padding: `${SAFE_ZONE.horizontal.top}px ${SAFE_ZONE.horizontal.left}px`,
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 44,
          background:
            "radial-gradient(circle at 20% 0%, rgba(133, 94, 66, 0.16) 0%, rgba(12, 10, 9, 0) 38%), #0c0a09",
        }}
      >
        <div style={{ width: previewWidth }}>
          <MacWindowFrame caption="film-lab / hero visual">
            <ComparePreview dividerProgress={0.62} rightLabel="Gold 200" />
            <PresetStrip offsetFrame={8} />
          </MacWindowFrame>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 20,
            paddingRight: 24,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.inter,
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: COLORS.amber,
              opacity: copyOpacity,
            }}
          >
            product demo study
          </div>
          <div
            style={{
              fontFamily: FONTS.inter,
              fontSize: TYPE_SCALE.heading + 10,
              lineHeight: 1.02,
              fontWeight: 700,
              color: COLORS.warmWhite,
              maxWidth: 520,
              opacity: titleProgress,
              transform: `translateY(${interpolate(titleProgress, [0, 1], [14, 0])}px)`,
            }}
          >
            Show the real
            <br />
            Film Lab shape.
          </div>
          <div
            style={{
              fontFamily: FONTS.mixed,
              fontSize: TYPE_SCALE.body - 2,
              lineHeight: 1.5,
              color: COLORS.textPrimary,
              opacity: copyOpacity,
              maxWidth: 560,
            }}
          >
            実 UI にある preview、preset palette、before / after の関係をそのまま見せる。
            派手さではなく、何が使えるのかを静かに伝える。
          </div>
        </div>
      </AbsoluteFill>
    </SceneFrame>
  );
}

/**
 * scene 2 です。
 *
 * 概要:
 * - control panel の section 語彙を使って「触れる場所」を見せます
 * - 実 UI に存在する slider 群だけを残し、装飾的な UI は足しません
 *
 * @returns {React.ReactElement} controls scene です。
 */
function ControlsScene(): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const previewProgress = spring({
    frame,
    fps,
    config: FILMTONE_SPRING,
  });

  return (
    <SceneFrame durationInFrames={sceneDuration}>
      <AbsoluteFill
        style={{
          padding: `${SAFE_ZONE.horizontal.top}px ${SAFE_ZONE.horizontal.left}px`,
          backgroundColor: COLORS.bgDeep,
          display: "flex",
          flexDirection: "row",
          gap: 30,
        }}
      >
        <div
          style={{
            flex: 1.18,
            opacity: previewProgress,
            transform: `translateY(${interpolate(previewProgress, [0, 1], [12, 0])}px)`,
          }}
        >
          <MacWindowFrame caption="film-lab / control panel">
            <ComparePreview dividerProgress={0.56} rightLabel="Cinematic" />
          </MacWindowFrame>
        </div>
        <div
          style={{
            width: 430,
            borderRadius: 26,
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(180deg, rgba(28, 25, 23, 0.96) 0%, rgba(18, 15, 14, 0.96) 100%)",
            padding: "22px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.inter,
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: COLORS.textSubtle,
              marginBottom: 4,
            }}
          >
            control panel
          </div>
          {controlSections.map((section, index) => (
            <ControlSectionCard key={section.title} section={section} index={index} />
          ))}
        </div>
      </AbsoluteFill>
    </SceneFrame>
  );
}

/**
 * scene 3 です。
 *
 * 概要:
 * - compare / slot A/B の存在を、divider motion で静かに見せます
 * - fake interaction ではなく、実在する compare 機能の骨格だけを見せます
 *
 * @returns {React.ReactElement} compare scene です。
 */
function CompareScene(): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dividerMotion = spring({
    frame,
    fps,
    config: FILMTONE_SPRING,
    durationInFrames: 80,
  });
  const dividerProgress = interpolate(dividerMotion, [0, 1], [0.18, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const slotOpacity = filmtoneFadeIn(frame, 10, fps, 0.7);

  return (
    <SceneFrame durationInFrames={sceneDuration}>
      <AbsoluteFill
        style={{
          padding: `${SAFE_ZONE.horizontal.top}px ${SAFE_ZONE.horizontal.left}px`,
          background:
            "radial-gradient(circle at 80% 10%, rgba(217, 119, 6, 0.14) 0%, rgba(12, 10, 9, 0) 38%), #0c0a09",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 28,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: FONTS.inter,
                fontSize: 14,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: COLORS.amber,
                opacity: slotOpacity,
              }}
            >
              compare flow
            </div>
            <div
              style={{
                fontFamily: FONTS.inter,
                fontSize: TYPE_SCALE.heading + 4,
                fontWeight: 700,
                color: COLORS.warmWhite,
                marginTop: 10,
              }}
            >
              Keep the decision visible.
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              opacity: slotOpacity,
            }}
          >
            {["Slot A", "Slot B"].map((slot, index) => (
              <div
                key={slot}
                style={{
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.10)",
                  backgroundColor:
                    index === 1 ? "rgba(217,119,6,0.24)" : "rgba(255,255,255,0.04)",
                  color: COLORS.warmWhite,
                  fontFamily: FONTS.inter,
                  fontSize: 13,
                  padding: "10px 16px",
                }}
              >
                {slot}
              </div>
            ))}
          </div>
        </div>
        <MacWindowFrame caption="film-lab / compare">
          <ComparePreview dividerProgress={dividerProgress} rightLabel="Slot B · CineStill" />
          <PresetStrip offsetFrame={20} />
        </MacWindowFrame>
      </AbsoluteFill>
    </SceneFrame>
  );
}

/**
 * scene 4 です。
 *
 * 概要:
 * - founder demo の締めとして、実際に伝えたい価値だけを 3 bullet で閉じます
 * - CTA というより、10 cut launch video に戻せる message の粒度へ整えます
 *
 * @returns {React.ReactElement} closing scene です。
 */
function ClosingScene(): React.ReactElement {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleOpacity = filmtoneFadeIn(frame, 0, fps, 0.8);

  return (
    <SceneFrame durationInFrames={sceneDuration}>
      <AbsoluteFill
        style={{
          padding: `${SAFE_ZONE.horizontal.top}px ${SAFE_ZONE.horizontal.left}px`,
          backgroundColor: COLORS.bgDeep,
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          gap: 30,
        }}
      >
        <div
          style={{
            width: 760,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 22,
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
            close
          </div>
          <div
            style={{
              fontFamily: FONTS.inter,
              fontSize: TYPE_SCALE.heading + 8,
              lineHeight: 1.04,
              fontWeight: 700,
              color: COLORS.warmWhite,
              opacity: titleOpacity,
            }}
          >
            Preview first.
            <br />
            Keep control.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {closingBullets.map((bullet, index) => {
              const bulletProgress = spring({
                frame: Math.max(0, frame - 12 - index * 6),
                fps,
                config: FILMTONE_POP,
              });
              return (
                <div
                  key={bullet.title}
                  style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "flex-start",
                    opacity: bulletProgress,
                    transform: `translateY(${interpolate(bulletProgress, [0, 1], [12, 0])}px)`,
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      marginTop: 12,
                      borderRadius: "50%",
                      backgroundColor: COLORS.amber,
                      boxShadow: "0 0 14px rgba(217, 119, 6, 0.35)",
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontFamily: FONTS.inter,
                        fontSize: 28,
                        fontWeight: 600,
                        color: COLORS.textPrimary,
                      }}
                    >
                      {bullet.title}
                    </div>
                    <div
                      style={{
                        fontFamily: FONTS.mixed,
                        fontSize: 18,
                        lineHeight: 1.5,
                        color: COLORS.textMuted,
                        marginTop: 4,
                      }}
                    >
                      {bullet.detail}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MacWindowFrame caption="film-lab / presets">
            <ComparePreview dividerProgress={0.58} rightLabel="Portra" />
            <PresetStrip offsetFrame={10} />
          </MacWindowFrame>
        </div>
      </AbsoluteFill>
    </SceneFrame>
  );
}

/**
 * Product demo の本体です。
 *
 * 概要:
 * - 4 scene を順番に切り替え、real UI based demo の pacing を検証します
 *
 * @returns {React.ReactElement} Product demo composition です。
 */
export function ProductDemo(): React.ReactElement {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDeep }}>
      <Sequence from={0} durationInFrames={sceneDuration}>
        <HeroScene />
      </Sequence>
      <Sequence from={sceneDuration} durationInFrames={sceneDuration}>
        <ControlsScene />
      </Sequence>
      <Sequence from={sceneDuration * 2} durationInFrames={sceneDuration}>
        <CompareScene />
      </Sequence>
      <Sequence from={sceneDuration * 3} durationInFrames={sceneDuration}>
        <ClosingScene />
      </Sequence>
    </AbsoluteFill>
  );
}

/**
 * render script や registry 側と duration を合わせるための定数です。
 *
 * 制限事項:
 * - Root.tsx 側では number literal を使うため、ここは文書的な参照用途です
 */
export const productDemoDurationInFrames = totalFrames;
