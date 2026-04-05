import { LaunchBeatId, launchBeatOrder } from "./launchTimeline";

/**
 * launch video の audio asset 種別です。
 */
export type LaunchAudioAssetType = "bgm" | "sfx";

/**
 * audio 候補の供給元です。
 */
export type LaunchAudioProvider =
  | "soundstripe"
  | "soundstripeSfx"
  | "freesound"
  | "suno"
  | "elevenlabs"
  | "manualReview";

/**
 * AI がどこまで自動で触ってよいかの段階です。
 */
export type LaunchAudioAutomationStage =
  | "candidateOnly"
  | "placementDraft"
  | "humanReviewRequired";

/**
 * guardrail の定義です。
 *
 * @property {string} guardrailId guardrail の識別子です。
 * @property {string} rule 守るルールです。
 * @property {string} reason なぜ必要かです。
 */
export interface LaunchAudioGuardrail {
  guardrailId: string;
  rule: string;
  reason: string;
}

/**
 * API 比較の 1 行です。
 *
 * @property {string} optionId 選択肢の識別子です。
 * @property {string} serviceName サービス名です。
 * @property {string} role どの役割に向くかです。
 * @property {string} publicApiStatus 公開 API の扱いです。
 * @property {string} workflowFit 今回の PoC との相性です。
 * @property {boolean} allowedForPoc 初手の PoC に含めるかどうかです。
 * @property {string} notes 補足です。
 */
export interface LaunchAudioApiOption {
  optionId: string;
  serviceName: string;
  role: string;
  publicApiStatus: string;
  workflowFit: string;
  allowedForPoc: boolean;
  notes: string;
}

/**
 * JSON schema に載せる 1 フィールドです。
 *
 * @property {string} fieldName フィールド名です。
 * @property {string} fieldType 型です。
 * @property {string} meaning 何を表すかです。
 */
export interface LaunchAudioSchemaField {
  fieldName: string;
  fieldType: string;
  meaning: string;
}

/**
 * 成功指標の 1 行です。
 *
 * @property {string} metricId 指標の識別子です。
 * @property {string} metricName 指標名です。
 * @property {string} question 何を確認するかです。
 * @property {string} successTarget 合格ラインです。
 */
export interface LaunchAudioSuccessMetric {
  metricId: string;
  metricName: string;
  question: string;
  successTarget: string;
}

/**
 * audio cue 候補の 1 件です。
 *
 * @property {string} candidateId 候補の識別子です。
 * @property {LaunchBeatId} beatId 属する beat 名です。
 * @property {LaunchAudioAssetType} assetType BGM か SFX かです。
 * @property {LaunchAudioProvider} provider 素材の供給元です。
 * @property {LaunchAudioAutomationStage} automationStage AI が触る上限です。
 * @property {string} assetLabel 人が読む名前です。
 * @property {number} startFrame 配置開始 frame です。
 * @property {number} endFrame 配置終了 frame です。
 * @property {number} volume 仮配置の音量です。
 * @property {boolean} loopAudio preview で loop するかどうかです。
 * @property {string} previewAudioSrc Remotion preview で鳴らす仮音源です。
 * @property {string} reason 選定理由です。
 * @property {string} licenseNote ライセンス上の注意です。
 */
export interface LaunchAudioCueDraft {
  candidateId: string;
  beatId: LaunchBeatId;
  assetType: LaunchAudioAssetType;
  provider: LaunchAudioProvider;
  automationStage: LaunchAudioAutomationStage;
  assetLabel: string;
  startFrame: number;
  endFrame: number;
  volume: number;
  loopAudio: boolean;
  previewAudioSrc: string;
  reason: string;
  licenseNote: string;
}

/**
 * beat ごとの audio draft です。
 *
 * @property {LaunchBeatId} beatId beat 名です。
 * @property {string} creativeIntent この beat で欲しい空気です。
 * @property {string} selectedCandidateId 現在 preview で採用している候補です。
 * @property {readonly LaunchAudioCueDraft[]} candidates 比較用候補一覧です。
 */
export interface LaunchBeatAudioDraft {
  beatId: LaunchBeatId;
  creativeIntent: string;
  selectedCandidateId: string;
  candidates: readonly LaunchAudioCueDraft[];
}

/**
 * launch video 全体の audio plan です。
 *
 * @property {string} planId plan の識別子です。
 * @property {string} version plan の版です。
 * @property {string} reviewStatus 人のレビュー状態です。
 * @property {readonly LaunchBeatAudioDraft[]} beats beat ごとの下書きです。
 */
export interface LaunchAudioPlan {
  planId: string;
  version: string;
  reviewStatus: string;
  beats: readonly LaunchBeatAudioDraft[];
}

/**
 * preview 用の柔らかい bed 音です。
 *
 * 主な仕様:
 * - 実際の Soundstripe 音源ではなく、配置確認だけに使います
 * - 短い tone を loop して BGM の位置関係だけ検証します
 *
 * 制限事項:
 * - 実案件のトーン確認には使えません
 */
const softBedPreviewAudioSrc =
  "data:audio/wav;base64,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";

/**
 * preview 用の短い accent 音です。
 *
 * 主な仕様:
 * - SFX の位置だけを静かに確認できるように、短い click へ寄せます
 */
const accentPreviewAudioSrc =
  "data:audio/wav;base64,UklGRqQCAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YYACAAAAAMoJFg91DacFQfsJ88PwffUK/wcJ4A7lDYoGL/yT86zwzvQU/joImw5HDmYHIP0r9KTwK/Qg/WYHRw6bDjoIFP7O9Kzwk/Mv/IoG5Q3gDgcJCv999cPwCfNB+6cFdQ0WD8oJAAA29urwi/JZ+r8E9ww9D4MK9gD59iDxG/J2+dEDbQxUDzIL7AHG92XxufGa+OAC1QtcD9UL4AKa+LnxZfHG9+wBMgtUD20M0QN2+RvyIPH59vYAgwo9D/cMvwRZ+ovy6vA29gAAygkWD3UNpwVB+wnzw/B99Qr/BwngDuUNigYv/JPzrPDO9BT+OgibDkcOZgcg/Sv0pPAr9CD9ZgdHDpsOOggU/s70rPCT8y/8igblDeAOBwkK/331w/AJ80H7pwV1DRYPygkAADb26vCL8ln6vwT3DD0Pgwr2APn2IPEb8nb50QNtDFQPMgvsAcb3ZfG58Zr44ALVC1wP1QvgApr4ufFl8cb37AEyC1QPbQzRA3b5G/Ig8fn29gCDCj0P9wy/BFn6i/Lq8Db2AADKCRYPdQ2nBUH7CfPD8H31Cv8HCeAO5Q2KBi/8k/Os8M70FP46CJsORw5mByD9K/Sk8Cv0IP1mB0cOmw46CBT+zvSs8JPzL/yKBuUN4A4HCQr/ffXD8AnzQfunBXUNFg/KCQAANvbq8IvyWfq/BPcMPQ+DCvYA+fYg8RvydvnRA20MVA8yC+wBxvdl8bnxmvjgAtULXA/VC+ACmvi58WXxxvfsATILVA9tDNEDdvkb8iDx+fb2AIMKPQ/3DL8EWfqL8urwNvYAAMoJFg91DacFQfsJ88PwffUK/wcJ4A7lDYoGL/yT86zwzvQU/joI";

/**
 * Phase 1 の guardrail 一覧です。
 */
export const launchAudioGuardrails: readonly LaunchAudioGuardrail[] = [
  {
    guardrailId: "guardrail-ai-scope",
    rule: "AI は BGM / SFX 候補の選定と仮配置までに限定する。",
    reason: "Remotion と音源サービスの責務を混ぜず、最小スコープで検証するためです。",
  },
  {
    guardrailId: "guardrail-resolve-finish",
    rule: "final audio mix と master 判断は Resolve 側に残す。",
    reason: "既存の launch-video 正本と整合し、音量やダッキングの最終責任を明確にするためです。",
  },
  {
    guardrailId: "guardrail-suno-boundary",
    rule: "Suno は事前生成した補助素材としてだけ扱い、レンダリング中の直接呼び出しはしない。",
    reason: "生成待ちや利用条件の不確実さを PoC に持ち込まないためです。",
  },
  {
    guardrailId: "guardrail-license-proof",
    rule: "各候補に licenseNote を必ず残し、商用利用の証跡確認を前提にする。",
    reason: "クライアント納品や広告利用で後戻りしないためです。",
  },
] as const;

/**
 * Phase 2 の API 比較表です。
 */
export const launchAudioApiOptions: readonly LaunchAudioApiOption[] = [
  {
    optionId: "soundstripe-main",
    serviceName: "Soundstripe",
    role: "BGM と SFX の検索型主軸",
    publicApiStatus: "公開ドキュメントあり。実運用は契約前提。",
    workflowFit: "Remotion preview に最もつなぎやすい。",
    allowedForPoc: true,
    notes: "最初の PoC では第一候補として扱います。",
  },
  {
    optionId: "freesound-sfx",
    serviceName: "Freesound",
    role: "補助 SFX の比較対象",
    publicApiStatus: "公開 API あり。音源ごとにライセンス差があります。",
    workflowFit: "商用の証跡整理が必要なので補助扱いです。",
    allowedForPoc: true,
    notes: "SFX の探索幅を広げたいときだけ比較に入れます。",
  },
  {
    optionId: "suno-support",
    serviceName: "Suno",
    role: "オリジナル補助素材の事前生成",
    publicApiStatus: "一般向けの第一者公開 API は確認できません。",
    workflowFit: "レンダリング中の自動統合には向きません。",
    allowedForPoc: false,
    notes: "PoC 本線からは外し、手元で生成した素材の持ち込みだけ許可します。",
  },
] as const;

/**
 * Phase 3 の JSON schema 定義です。
 */
export const launchAudioSchemaFields: readonly LaunchAudioSchemaField[] = [
  { fieldName: "role", fieldType: "string", meaning: "beat 内での役割です。例: bed / accent / transition。" },
  { fieldName: "startFrame", fieldType: "number", meaning: "配置開始 frame です。" },
  { fieldName: "endFrame", fieldType: "number", meaning: "配置終了 frame です。" },
  { fieldName: "assetType", fieldType: "string", meaning: "BGM か SFX かです。" },
  { fieldName: "assetIdOrUrl", fieldType: "string", meaning: "後で本番素材へ差し替える識別子です。" },
  { fieldName: "volume", fieldType: "number", meaning: "preview 用の仮音量です。" },
  { fieldName: "reason", fieldType: "string", meaning: "AI がその候補を出した理由です。" },
  { fieldName: "licenseNote", fieldType: "string", meaning: "利用条件の確認メモです。" },
] as const;

/**
 * Phase 5 の成功指標です。
 */
export const launchAudioSuccessMetrics: readonly LaunchAudioSuccessMetric[] = [
  {
    metricId: "time-to-first-draft",
    metricName: "初稿作成時間",
    question: "beat ごとの候補出しと仮配置が手作業より短くなったか。",
    successTarget: "最初の draft を 1 セッションで比較可能にする。",
  },
  {
    metricId: "decision-speed",
    metricName: "意思決定の速さ",
    question: "2-3 案の比較で選ぶ理由がはっきりしたか。",
    successTarget: "Hook / Browser Entry / Production / Close の選定理由をその場で言える。",
  },
  {
    metricId: "license-safety",
    metricName: "ライセンス安全性",
    question: "候補ごとに商用利用の確認メモが残っているか。",
    successTarget: "全候補に licenseNote が入り、曖昧な候補をレビュー対象にできる。",
  },
  {
    metricId: "manual-fix-range",
    metricName: "手修正量",
    question: "人が大きく直すのは重要 beat だけに収まったか。",
    successTarget: "主要 beat 以外では frame 単位の微調整だけで済む。",
  },
] as const;

/**
 * 最小 PoC の audio plan です。
 *
 * 主な仕様:
 * - 各 beat で 2 候補を返します
 * - preview では 1 候補だけ採用し、他は比較情報として HUD に出します
 *
 * 制限事項:
 * - `assetLabel` はライブラリ検索の方向を表す仮名です
 * - `previewAudioSrc` は仮音源なので、本番音の雰囲気までは再現しません
 */
export const defaultLaunchAudioPlan: LaunchAudioPlan = {
  planId: "launch-audio-poc-v1",
  version: "2026-04-04",
  reviewStatus: "draft-for-human-review",
  beats: [
    {
      beatId: "hook",
      creativeIntent: "静かな proof reveal を邪魔しない warm bed を置く。",
      selectedCandidateId: "hook-bed-a",
      candidates: [
        {
          candidateId: "hook-bed-a",
          beatId: "hook",
          assetType: "bgm",
          provider: "soundstripe",
          automationStage: "placementDraft",
          assetLabel: "Soundstripe / warm restrained bed",
          startFrame: 0,
          endFrame: 210,
          volume: 0.1,
          loopAudio: true,
          previewAudioSrc: softBedPreviewAudioSrc,
          reason: "before / after の reveal を押しすぎず、静かな期待感だけを作れるからです。",
          licenseNote: "commercial ad use を前提に plan を確認してください。",
        },
        {
          candidateId: "hook-swell-b",
          beatId: "hook",
          assetType: "sfx",
          provider: "soundstripeSfx",
          automationStage: "candidateOnly",
          assetLabel: "Soundstripe SFX / soft optical swell",
          startFrame: 63,
          endFrame: 112,
          volume: 0.16,
          loopAudio: false,
          previewAudioSrc: accentPreviewAudioSrc,
          reason: "divider sweep と同期しやすい短い accent として使えるからです。",
          licenseNote: "単独採用ではなく BGM 補助として扱います。",
        },
      ],
    },
    {
      beatId: "showcase",
      creativeIntent: "難しさを煽らず、落ち着いた ease を dry な accent と薄い bed で支える。",
      selectedCandidateId: "ease-click-a",
      candidates: [
        {
          candidateId: "ease-click-a",
          beatId: "showcase",
          assetType: "sfx",
          provider: "soundstripeSfx",
          automationStage: "placementDraft",
          assetLabel: "Soundstripe SFX / calm interaction click",
          startFrame: 244,
          endFrame: 268,
          volume: 0.18,
          loopAudio: false,
          previewAudioSrc: accentPreviewAudioSrc,
          reason: "操作が難しくないことを、小さい節度ある click で支えられるからです。",
          licenseNote: "広告利用時の proof を残してください。",
        },
        {
          candidateId: "ease-bed-b",
          beatId: "showcase",
          assetType: "bgm",
          provider: "soundstripe",
          automationStage: "candidateOnly",
          assetLabel: "Soundstripe / muted ease bed",
          startFrame: 210,
          endFrame: 450,
          volume: 0.08,
          loopAudio: true,
          previewAudioSrc: softBedPreviewAudioSrc,
          reason: "単発の click だけでは乾きすぎるとき、静かな余白を足せるからです。",
          licenseNote: "BGM として使う場合は brand fit の最終確認が必要です。",
        },
      ],
    },
    {
      beatId: "scope",
      creativeIntent: "still と motion の両方に広がる scope を、前向きな bed と小さい accent で見せる。",
      selectedCandidateId: "scope-bed-a",
      candidates: [
        {
          candidateId: "scope-bed-a",
          beatId: "scope",
          assetType: "bgm",
          provider: "soundstripe",
          automationStage: "placementDraft",
          assetLabel: "Soundstripe / wide optimistic bed",
          startFrame: 450,
          endFrame: 750,
          volume: 0.12,
          loopAudio: true,
          previewAudioSrc: softBedPreviewAudioSrc,
          reason: "photo + video の広がりを見せたいので、明るすぎず前向きな bed が合うからです。",
          licenseNote: "Web demo 用でも commercial plan を前提に確認します。",
        },
        {
          candidateId: "scope-accent-b",
          beatId: "scope",
          assetType: "sfx",
          provider: "soundstripeSfx",
          automationStage: "candidateOnly",
          assetLabel: "Soundstripe SFX / light scope accent",
          startFrame: 570,
          endFrame: 604,
          volume: 0.14,
          loopAudio: false,
          previewAudioSrc: accentPreviewAudioSrc,
          reason: "Photos / Motion / Proof の切り替わりを軽く支える accent に使いやすいからです。",
          licenseNote: "UI capture に重ねる場合は VO と競合しないよう最終確認が必要です。",
        },
      ],
    },
    {
      beatId: "detail",
      creativeIntent: "detail crop の説得力を邪魔しない、薄い texture を保つ。",
      selectedCandidateId: "detail-bed-a",
      candidates: [
        {
          candidateId: "detail-bed-a",
          beatId: "detail",
          assetType: "bgm",
          provider: "soundstripe",
          automationStage: "placementDraft",
          assetLabel: "Soundstripe / airy detail bed",
          startFrame: 750,
          endFrame: 1050,
          volume: 0.09,
          loopAudio: true,
          previewAudioSrc: softBedPreviewAudioSrc,
          reason: "detail tile の blur reveal を邪魔せず、質感だけ支えられるからです。",
          licenseNote: "brand fit は human review で確定してください。",
        },
        {
          candidateId: "detail-accent-b",
          beatId: "detail",
          assetType: "sfx",
          provider: "freesound",
          automationStage: "humanReviewRequired",
          assetLabel: "Freesound / subtle texture tick",
          startFrame: 825,
          endFrame: 849,
          volume: 0.1,
          loopAudio: false,
          previewAudioSrc: accentPreviewAudioSrc,
          reason: "tile reveal の区切りを少しだけ見せたいときに使えるからです。",
          licenseNote: "音源ごとの license 差が大きいので PoC でも review 必須です。",
        },
      ],
    },
    {
      beatId: "browser",
      creativeIntent: "browser entry の軽さを、明るい bed と小さい UI accent で支える。",
      selectedCandidateId: "browser-bed-a",
      candidates: [
        {
          candidateId: "browser-bed-a",
          beatId: "browser",
          assetType: "bgm",
          provider: "soundstripe",
          automationStage: "placementDraft",
          assetLabel: "Soundstripe / clean browser bed",
          startFrame: 1050,
          endFrame: 1350,
          volume: 0.12,
          loopAudio: true,
          previewAudioSrc: softBedPreviewAudioSrc,
          reason: "入口の軽さを見せたいので、明るいがうるさくない bed が必要だからです。",
          licenseNote: "browser proof を主役にしすぎないか最終確認が必要です。",
        },
        {
          candidateId: "browser-ui-b",
          beatId: "browser",
          assetType: "sfx",
          provider: "soundstripeSfx",
          automationStage: "candidateOnly",
          assetLabel: "Soundstripe SFX / light browser accent",
          startFrame: 1170,
          endFrame: 1203,
          volume: 0.14,
          loopAudio: false,
          previewAudioSrc: accentPreviewAudioSrc,
          reason: "Drop / Preview / Compare の切り替えを軽く支えやすいからです。",
          licenseNote: "VO がある場合は下げる前提です。",
        },
      ],
    },
    {
      beatId: "production",
      creativeIntent: "Desktop serious workflow を静かな confidence で支える。",
      selectedCandidateId: "production-bed-a",
      candidates: [
        {
          candidateId: "production-bed-a",
          beatId: "production",
          assetType: "bgm",
          provider: "soundstripe",
          automationStage: "placementDraft",
          assetLabel: "Soundstripe / serious desktop bed",
          startFrame: 1350,
          endFrame: 1770,
          volume: 0.11,
          loopAudio: true,
          previewAudioSrc: softBedPreviewAudioSrc,
          reason: "production beat は bed 主体の方が workflow を読みやすいからです。",
          licenseNote: "Resolve で final mix を詰める前提の draft です。",
        },
        {
          candidateId: "production-queue-b",
          beatId: "production",
          assetType: "sfx",
          provider: "soundstripeSfx",
          automationStage: "candidateOnly",
          assetLabel: "Soundstripe SFX / queue confirmation tick",
          startFrame: 1531,
          endFrame: 1560,
          volume: 0.12,
          loopAudio: false,
          previewAudioSrc: accentPreviewAudioSrc,
          reason: "Queue ready と Export verified に小さい確信を足せるからです。",
          licenseNote: "VO がある場合は最終で下げる想定です。",
        },
      ],
    },
    {
      beatId: "close",
      creativeIntent: "CTA を静かに締める bed と logo accent を比較する。",
      selectedCandidateId: "close-bed-a",
      candidates: [
        {
          candidateId: "close-bed-a",
          beatId: "close",
          assetType: "bgm",
          provider: "soundstripe",
          automationStage: "placementDraft",
          assetLabel: "Soundstripe / premium CTA bed",
          startFrame: 1770,
          endFrame: 2160,
          volume: 0.12,
          loopAudio: true,
          previewAudioSrc: softBedPreviewAudioSrc,
          reason: "main CTA を calm に保ち、film-look の余韻を残したいからです。",
          licenseNote: "brand-safe な ending か human review で決めます。",
        },
        {
          candidateId: "close-logo-b",
          beatId: "close",
          assetType: "sfx",
          provider: "soundstripeSfx",
          automationStage: "candidateOnly",
          assetLabel: "Soundstripe SFX / logo pop accent",
          startFrame: 1844,
          endFrame: 1875,
          volume: 0.16,
          loopAudio: false,
          previewAudioSrc: accentPreviewAudioSrc,
          reason: "logo reveal に合わせる最小の accent として比較しやすいからです。",
          licenseNote: "CTA の読みやすさを壊すなら不採用にします。",
        },
      ],
    },
  ],
} as const;

/**
 * beat の下書きを返します。
 *
 * @param {LaunchAudioPlan} audioPlan 全体 plan です。
 * @param {LaunchBeatId} beatId 調べたい beat 名です。
 * @returns {LaunchBeatAudioDraft} 一致した beat の下書きです。
 */
export function getLaunchBeatAudioDraft(
  audioPlan: LaunchAudioPlan,
  beatId: LaunchBeatId,
): LaunchBeatAudioDraft {
  const beatDraft = audioPlan.beats.find((currentBeat) => currentBeat.beatId === beatId);

  if (!beatDraft) {
    throw new Error(
      `getLaunchBeatAudioDraft(audioPlan.planId=${audioPlan.planId}, beatId=${beatId}) に一致する beat がありません。`,
    );
  }

  return beatDraft;
}

/**
 * 現在採用中の候補を返します。
 *
 * @param {LaunchAudioPlan} audioPlan 全体 plan です。
 * @param {LaunchBeatId} beatId 調べたい beat 名です。
 * @returns {LaunchAudioCueDraft} 採用中の候補です。
 */
export function getSelectedLaunchAudioCue(
  audioPlan: LaunchAudioPlan,
  beatId: LaunchBeatId,
): LaunchAudioCueDraft {
  const beatDraft = getLaunchBeatAudioDraft(audioPlan, beatId);
  const selectedCandidate = beatDraft.candidates.find(
    (candidate) => candidate.candidateId === beatDraft.selectedCandidateId,
  );

  if (!selectedCandidate) {
    throw new Error(
      `getSelectedLaunchAudioCue(audioPlan.planId=${audioPlan.planId}, beatId=${beatId}, selectedCandidateId=${beatDraft.selectedCandidateId}) に一致する候補がありません。`,
    );
  }

  return selectedCandidate;
}

/**
 * preview で実際に並べる採用済み cue の配列です。
 *
 * @param {LaunchAudioPlan} audioPlan 全体 plan です。
 * @returns {LaunchAudioCueDraft[]} 採用済み cue 一覧です。
 */
export function buildSelectedLaunchAudioCues(
  audioPlan: LaunchAudioPlan,
): LaunchAudioCueDraft[] {
  return launchBeatOrder.map((beatId) => getSelectedLaunchAudioCue(audioPlan, beatId));
}
