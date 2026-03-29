/**
 * @file Film Lab「スマートルック」— クラウド解析用のデルタ JSON とマージ（課金者向け）。
 * @description API 契約・クライアント適用の共通。新しいユーザー向けスライダーは増やさず、既存 Params への加算デルタのみ。
 * @limitations デルタは少数キーに限定。完全な再グレードや LUT 推論はスコープ外。
 */

import { z } from "zod";
import type { Params } from "./types";
import { PRESETS, type PresetName } from "./preset-data";

/** @description 同意文の版。API と localStorage で一致させる。 */
export const SMART_LOOK_CONSENT_VERSION = 1 as const;

const deltaValueSchema = z.number().finite();

/**
 * @description モデル／mock が返す加算デルタ（キー省略可）。
 */
export const filmLabSmartLookDeltaSchema = z
  .object({
    exposure: deltaValueSchema.optional(),
    temperature: deltaValueSchema.optional(),
    tint: deltaValueSchema.optional(),
    saturation: deltaValueSchema.optional(),
    highlights: deltaValueSchema.optional(),
    shadows: deltaValueSchema.optional(),
    fade: deltaValueSchema.optional(),
  })
  .strict();

export type FilmLabSmartLookDelta = z.infer<typeof filmLabSmartLookDeltaSchema>;

/**
 * @description POST ボディ。画像はクライアントで長辺 1024 前後に縮小済みを推奨。
 */
export const filmLabSmartLookRequestSchema = z.object({
  presetId: z.string().min(1).max(64),
  imageBase64: z.string().min(32).max(2_200_000),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  consentVersion: z.literal(SMART_LOOK_CONSENT_VERSION),
  consentAcknowledged: z.literal(true),
});

export type FilmLabSmartLookRequest = z.infer<typeof filmLabSmartLookRequestSchema>;

const DELTA_KEYS = [
  "exposure",
  "temperature",
  "tint",
  "saturation",
  "highlights",
  "shadows",
  "fade",
] as const;

type DeltaKey = (typeof DELTA_KEYS)[number];

/** @description 1 リクエストあたりの加算上限（暴れ防止）。 */
const MAX_ABS_STEP: Record<DeltaKey, number> = {
  exposure: 0.4,
  temperature: 0.15,
  tint: 0.12,
  saturation: 0.2,
  highlights: 0.18,
  shadows: 0.18,
  fade: 0.06,
};

/** @description マージ後の Params 絶対レンジ。 */
const PARAM_RANGE: Record<DeltaKey, readonly [number, number]> = {
  exposure: [-3, 3],
  temperature: [-1, 1],
  tint: [-1, 1],
  saturation: [0, 3],
  highlights: [-1, 1],
  shadows: [-1, 1],
  fade: [0, 0.3],
};

/**
 * @description 生のデルタをスキーマ検証し、ステップ上限でクリップする（サーバーでもクライアントでも使える）。
 * @param {unknown} raw - API 応答の `delta` オブジェクト
 * @returns {FilmLabSmartLookDelta | null} パース失敗時は null
 */
export function parseAndClampSmartLookDelta(raw: unknown): FilmLabSmartLookDelta | null {
  const parsed = filmLabSmartLookDeltaSchema.safeParse(raw);
  if (!parsed.success) return null;
  const out: FilmLabSmartLookDelta = {};
  for (const key of DELTA_KEYS) {
    const v = parsed.data[key];
    if (v === undefined) continue;
    const cap = MAX_ABS_STEP[key];
    const stepped = Math.sign(v) * Math.min(Math.abs(v), cap);
    out[key] = stepped;
  }
  return out;
}

/**
 * @description 現在のグレードにデルタを加算し、レンジ内に収める。
 * @param {Params} base - 現在スロットの Params
 * @param {FilmLabSmartLookDelta} delta - `parseAndClampSmartLookDelta` 済み
 * @returns {Params} 新しい Params（参照は新インスタンス）
 */
export function applySmartLookDelta(base: Params, delta: FilmLabSmartLookDelta): Params {
  const next: Params = { ...base };
  for (const key of DELTA_KEYS) {
    const d = delta[key];
    if (d === undefined) continue;
    const [lo, hi] = PARAM_RANGE[key];
    const sum = base[key] + d;
    next[key] = Math.min(hi, Math.max(lo, sum)) as Params[typeof key];
  }
  return next;
}

/**
 * @description プリセット ID が既知か（API 検証用）。
 * @param {string} id - クライアントから送られた文字列
 * @returns {id is PresetName} 型ガード
 */
export function isFilmLabPresetIdForSmartLook(id: string): id is PresetName {
  return id in PRESETS;
}

/** @description localStorage キー（同意記録）。 */
export const FILM_LAB_SMART_LOOK_CONSENT_STORAGE_KEY = "filmLabAiCloudConsentV1" as const;

export type FilmLabSmartLookConsentRecord = {
  version: typeof SMART_LOOK_CONSENT_VERSION;
  acceptedAt: string;
};

/**
 * @description 同意済みか（クライアントのみ）。
 * @returns {boolean}
 */
export function filmLabReadSmartLookConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(FILM_LAB_SMART_LOOK_CONSENT_STORAGE_KEY);
    if (!raw) return false;
    const o = JSON.parse(raw) as FilmLabSmartLookConsentRecord;
    return o.version === SMART_LOOK_CONSENT_VERSION && typeof o.acceptedAt === "string";
  } catch {
    return false;
  }
}

/**
 * @description 同意を保存する。
 */
export function filmLabWriteSmartLookConsent(): void {
  if (typeof window === "undefined") return;
  const rec: FilmLabSmartLookConsentRecord = {
    version: SMART_LOOK_CONSENT_VERSION,
    acceptedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(FILM_LAB_SMART_LOOK_CONSENT_STORAGE_KEY, JSON.stringify(rec));
  } catch {
    /* private mode 等は無視 */
  }
}
