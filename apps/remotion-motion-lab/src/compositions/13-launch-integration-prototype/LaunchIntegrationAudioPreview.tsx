import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { COLORS } from "../../lib/colors";
import { FONTS } from "../../lib/typography";
import { LaunchIntegrationPrototype } from "./LaunchIntegrationPrototype";
import {
  buildSelectedLaunchAudioCues,
  defaultLaunchAudioPlan,
  getLaunchBeatAudioDraft,
  getSelectedLaunchAudioCue,
  LaunchAudioApiOption,
  LaunchAudioPlan,
  LaunchAudioSchemaField,
  LaunchAudioSuccessMetric,
  launchAudioApiOptions,
  launchAudioGuardrails,
  launchAudioSchemaFields,
  launchAudioSuccessMetrics,
} from "./launchAudioPlan";
import {
  getLaunchBeatIdForFrame,
  getLaunchBeatWindow,
  launchBeatOrder,
  LaunchBeatId,
} from "./launchTimeline";

/**
 * ElevenLabs で生成した real SFX の参照です。
 * beat ごとに staticFile() で public/sfx/ 配下のファイルを指します。
 * ここに登録がない beat は無音になります。
 */
const realSfxSources: Partial<Record<LaunchBeatId, { src: string; volume: number }>> = {
  hook: { src: staticFile("sfx/hook-sfx.mp3"), volume: 0.8 },
  showcase: { src: staticFile("sfx/ease-sfx.mp3"), volume: 0.9 },
  close: { src: staticFile("sfx/close-sfx.mp3"), volume: 0.7 },
};

/**
 * audio preview composition の props です。
 *
 * @property {LaunchAudioPlan | undefined} audioPlan AI が返した audio plan です。
 * @property {boolean | undefined} showHud HUD を見せるかどうかです。
 */
export interface LaunchIntegrationAudioPreviewProps {
  audioPlan?: LaunchAudioPlan;
  showHud?: boolean;
}

const beatLabels: Record<LaunchBeatId, string> = {
  hook: "Hook",
  showcase: "Showcase",
  scope: "Scope",
  detail: "Detail",
  browser: "Browser",
  production: "Production",
  close: "Close",
};

/**
 * 小さいラベル pill です。
 *
 * @param {Object} props 表示内容です。
 * @param {string} props.label ラベル文字です。
 * @param {string | undefined} props.tone 色味です。
 * @returns {React.ReactElement} 小さい pill です。
 */
function HudPill(props: {
  label: string;
  tone?: "accent" | "muted";
}): React.ReactElement {
  const { label, tone = "muted" } = props;

  return (
    <div
      style={{
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.08)",
        backgroundColor:
          tone === "accent" ? "rgba(217,119,6,0.20)" : "rgba(255,255,255,0.04)",
        color: tone === "accent" ? COLORS.cream : COLORS.textMuted,
        fontFamily: FONTS.inter,
        fontSize: 11,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: "8px 10px",
      }}
    >
      {label}
    </div>
  );
}

/**
 * 右カラムの section title です。
 *
 * @param {Object} props 表示内容です。
 * @param {string} props.title タイトルです。
 * @returns {React.ReactElement} タイトルです。
 */
function HudSectionTitle(props: { title: string }): React.ReactElement {
  return (
    <div
      style={{
        fontFamily: FONTS.inter,
        fontSize: 12,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: COLORS.amber,
        marginBottom: 10,
      }}
    >
      {props.title}
    </div>
  );
}

/**
 * real SFX を鳴らすレイヤーです。
 *
 * 概要:
 * - realSfxSources に登録がある beat だけ、ElevenLabs 生成の MP3 を再生します
 * - 登録がない beat は無音です（fake tone は使いません）
 *
 * @param {Object} _props レイヤーの props です。
 * @returns {React.ReactElement} audio cue レイヤーです。
 */
function AudioCueLayer(_props: { audioPlan: LaunchAudioPlan }): React.ReactElement {
  return (
    <>
      {launchBeatOrder.map((beatId) => {
        const sfx = realSfxSources[beatId];
        if (!sfx) return null;
        const { startFrame, endFrame } = getLaunchBeatWindow(beatId);
        return (
          <Sequence
            key={`real-sfx-${beatId}`}
            from={startFrame}
            durationInFrames={Math.max(1, endFrame - startFrame)}
          >
            <Audio src={sfx.src} volume={sfx.volume} />
          </Sequence>
        );
      })}
    </>
  );
}

/**
 * API 比較の表示です。
 *
 * @param {Object} props 表示内容です。
 * @param {readonly LaunchAudioApiOption[]} props.options 比較表です。
 * @returns {React.ReactElement} API 比較の一覧です。
 */
function ApiOptionList(props: {
  options: readonly LaunchAudioApiOption[];
}): React.ReactElement {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {props.options.map((option) => (
        <div
          key={option.optionId}
          style={{
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(255,255,255,0.03)",
            padding: "12px 14px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontFamily: FONTS.inter,
                fontSize: 15,
                fontWeight: 600,
                color: COLORS.warmWhite,
              }}
            >
              {option.serviceName}
            </div>
            <HudPill
              label={option.allowedForPoc ? "PoC Mainline" : "Review Only"}
              tone={option.allowedForPoc ? "accent" : "muted"}
            />
          </div>
          <div
            style={{
              fontFamily: FONTS.mixed,
              fontSize: 14,
              lineHeight: 1.5,
              color: COLORS.textMuted,
              marginTop: 8,
            }}
          >
            {option.role}
          </div>
          <div
            style={{
              fontFamily: FONTS.inter,
              fontSize: 12,
              lineHeight: 1.5,
              color: COLORS.textSubtle,
              marginTop: 6,
            }}
          >
            API: {option.publicApiStatus}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * schema field 一覧です。
 *
 * @param {Object} props 表示内容です。
 * @param {readonly LaunchAudioSchemaField[]} props.fields field 定義です。
 * @returns {React.ReactElement} field 一覧です。
 */
function SchemaFieldList(props: {
  fields: readonly LaunchAudioSchemaField[];
}): React.ReactElement {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {props.fields.map((field) => (
        <div
          key={field.fieldName}
          style={{
            display: "grid",
            gridTemplateColumns: "140px 90px 1fr",
            gap: 10,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            paddingBottom: 8,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.inter,
              fontSize: 13,
              color: COLORS.warmWhite,
            }}
          >
            {field.fieldName}
          </div>
          <div
            style={{
              fontFamily: FONTS.inter,
              fontSize: 12,
              color: COLORS.amberMuted,
            }}
          >
            {field.fieldType}
          </div>
          <div
            style={{
              fontFamily: FONTS.mixed,
              fontSize: 13,
              lineHeight: 1.5,
              color: COLORS.textMuted,
            }}
          >
            {field.meaning}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 成功指標の一覧です。
 *
 * @param {Object} props 表示内容です。
 * @param {readonly LaunchAudioSuccessMetric[]} props.metrics 成功指標です。
 * @returns {React.ReactElement} 指標一覧です。
 */
function MetricList(props: {
  metrics: readonly LaunchAudioSuccessMetric[];
}): React.ReactElement {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {props.metrics.map((metric) => (
        <div
          key={metric.metricId}
          style={{
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(255,255,255,0.03)",
            padding: "12px 14px",
          }}
        >
          <div
            style={{
              fontFamily: FONTS.inter,
              fontSize: 14,
              fontWeight: 600,
              color: COLORS.warmWhite,
            }}
          >
            {metric.metricName}
          </div>
          <div
            style={{
              fontFamily: FONTS.mixed,
              fontSize: 13,
              lineHeight: 1.5,
              color: COLORS.textMuted,
              marginTop: 6,
            }}
          >
            {metric.question}
          </div>
          <div
            style={{
              fontFamily: FONTS.inter,
              fontSize: 12,
              lineHeight: 1.5,
              color: COLORS.textSubtle,
              marginTop: 6,
            }}
          >
            Target: {metric.successTarget}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * beat ごとに見せる contextual panel です。
 *
 * @param {Object} props 表示内容です。
 * @param {LaunchBeatId} props.activeBeatId 現在の beat 名です。
 * @returns {React.ReactElement} 補助パネルです。
 */
function ContextPanel(props: { activeBeatId: LaunchBeatId }): React.ReactElement {
  const { activeBeatId } = props;

  if (activeBeatId === "hook" || activeBeatId === "showcase") {
    return (
      <>
        <HudSectionTitle title="Guardrails" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {launchAudioGuardrails.map((guardrail) => (
            <div
              key={guardrail.guardrailId}
              style={{
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
                backgroundColor: "rgba(255,255,255,0.03)",
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  fontFamily: FONTS.inter,
                  fontSize: 14,
                  fontWeight: 600,
                  color: COLORS.warmWhite,
                }}
              >
                {guardrail.rule}
              </div>
              <div
                style={{
                  fontFamily: FONTS.mixed,
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: COLORS.textMuted,
                  marginTop: 6,
                }}
              >
                {guardrail.reason}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (activeBeatId === "scope" || activeBeatId === "detail") {
    return (
      <>
        <HudSectionTitle title="API Compare" />
        <ApiOptionList options={launchAudioApiOptions} />
      </>
    );
  }

  if (activeBeatId === "browser" || activeBeatId === "production") {
    return (
      <>
        <HudSectionTitle title="JSON Schema" />
        <SchemaFieldList fields={launchAudioSchemaFields} />
      </>
    );
  }

  return (
    <>
      <HudSectionTitle title="Success Metrics" />
      <MetricList metrics={launchAudioSuccessMetrics} />
    </>
  );
}

/**
 * audio plan の HUD です。
 *
 * @param {Object} props 表示内容です。
 * @param {LaunchAudioPlan} props.audioPlan 全体 plan です。
 * @returns {React.ReactElement} HUD です。
 */
function LaunchAudioHud(props: { audioPlan: LaunchAudioPlan }): React.ReactElement {
  const { audioPlan } = props;
  const frame = useCurrentFrame();
  const activeBeatId = getLaunchBeatIdForFrame(frame);
  const beatDraft = getLaunchBeatAudioDraft(audioPlan, activeBeatId);
  const selectedCue = getSelectedLaunchAudioCue(audioPlan, activeBeatId);

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        padding: 28,
        display: "grid",
        gridTemplateColumns: "460px 1fr",
        gap: 20,
        alignItems: "end",
      }}
    >
      <div
        style={{
          alignSelf: "end",
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.10)",
          background:
            "linear-gradient(180deg, rgba(14,13,12,0.92) 0%, rgba(9,8,7,0.94) 100%)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.32)",
          padding: "18px 18px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
          }}
        >
          <HudSectionTitle title="AI Audio Draft" />
          <HudPill label={audioPlan.reviewStatus} tone="accent" />
        </div>
        <div
          style={{
            fontFamily: FONTS.inter,
            fontSize: 28,
            fontWeight: 700,
            color: COLORS.warmWhite,
          }}
        >
          {beatLabels[activeBeatId]}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <HudPill label={selectedCue.assetType} />
          <HudPill label={selectedCue.provider} />
          <HudPill label={selectedCue.automationStage} />
        </div>
        <div
          style={{
            fontFamily: FONTS.inter,
            fontSize: 16,
            fontWeight: 600,
            color: COLORS.textPrimary,
          }}
        >
          {selectedCue.assetLabel}
        </div>
        <div
          style={{
            fontFamily: FONTS.mixed,
            fontSize: 15,
            lineHeight: 1.6,
            color: COLORS.textMuted,
          }}
        >
          Intent: {beatDraft.creativeIntent}
        </div>
        <div
          style={{
            fontFamily: FONTS.mixed,
            fontSize: 14,
            lineHeight: 1.55,
            color: COLORS.textMuted,
          }}
        >
          Reason: {selectedCue.reason}
        </div>
        <div
          style={{
            fontFamily: FONTS.inter,
            fontSize: 12,
            lineHeight: 1.5,
            color: COLORS.textSubtle,
          }}
        >
          License: {selectedCue.licenseNote}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {beatDraft.candidates.map((candidate) => (
            <div
              key={candidate.candidateId}
              style={{
                borderRadius: 14,
                border:
                  candidate.candidateId === beatDraft.selectedCandidateId
                    ? "1px solid rgba(217,119,6,0.45)"
                    : "1px solid rgba(255,255,255,0.08)",
                backgroundColor:
                  candidate.candidateId === beatDraft.selectedCandidateId
                    ? "rgba(217,119,6,0.12)"
                    : "rgba(255,255,255,0.03)",
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  fontFamily: FONTS.inter,
                  fontSize: 13,
                  fontWeight: 600,
                  color: COLORS.warmWhite,
                }}
              >
                {candidate.assetLabel}
              </div>
              <div
                style={{
                  fontFamily: FONTS.inter,
                  fontSize: 11,
                  lineHeight: 1.5,
                  color: COLORS.textSubtle,
                  marginTop: 4,
                }}
              >
                {candidate.startFrame}-{candidate.endFrame}f / volume {candidate.volume}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          justifySelf: "stretch",
          alignSelf: "end",
          maxWidth: 860,
          marginLeft: "auto",
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.08)",
          background:
            "linear-gradient(180deg, rgba(14,13,12,0.88) 0%, rgba(9,8,7,0.90) 100%)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.28)",
          padding: "18px 18px 16px",
        }}
      >
        <ContextPanel activeBeatId={activeBeatId} />
      </div>
    </AbsoluteFill>
  );
}

/**
 * Launch Integration Prototype に AI 音 preview を重ねる composition です。
 *
 * 概要:
 * - 元の映像 prototype はそのまま再利用します
 * - audio plan と HUD を重ねて、候補選定と仮配置を 1 画面で確認します
 *
 * 主な仕様:
 * - `audioPlan` 未指定時は `defaultLaunchAudioPlan` を使います
 * - `showHud=false` にすると、音だけ重ねた preview としても使えます
 *
 * 制限事項:
 * - 実音源のトーン確認はしません
 * - final audio mix はここでは扱いません
 *
 * @param {LaunchIntegrationAudioPreviewProps} props preview の props です。
 * @returns {React.ReactElement} audio preview composition です。
 */
export function LaunchIntegrationAudioPreview(
  props: LaunchIntegrationAudioPreviewProps,
): React.ReactElement {
  const { audioPlan = defaultLaunchAudioPlan, showHud = true } = props;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDeep }}>
      <LaunchIntegrationPrototype />
      <AudioCueLayer audioPlan={audioPlan} />
      {showHud ? <LaunchAudioHud audioPlan={audioPlan} /> : null}
    </AbsoluteFill>
  );
}
