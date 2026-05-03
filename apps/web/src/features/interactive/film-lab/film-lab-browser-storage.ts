/**
 * Film Lab — ブラウザ（localStorage）へのセッション保存
 *
 * 概要: スロット A/B のルック・比較フラグ・Bloom/Halation トグル用の記憶値を JSON で保存する。
 * 仕様: キーはバージョン付き。LUT テクスチャやメディアファイル本体は保存しない。
 * 制限: プライベートモードや容量制限で書き込みが失敗しうる（呼び出し側で try/catch）。
 */

import { BASE_LOOKS, type BaseLookName } from "./preset-data";
import { coerceParams } from "./params-codec";
import type { GradeSlotState, PresentState } from "./components/film-lab-reducer";

/** localStorage キー（スキーマを変えたら version を上げる） */
export const FILM_LAB_STORAGE_KEY = "film-lab.session.v1";

const STORAGE_VERSION = 1 as const;

export interface FilmLabStoredSessionV1 {
  version: typeof STORAGE_VERSION;
  present: PresentState;
  /** Bloom をオフにする前に覚えておく強さ（ControlPanel の state と同期） */
  savedBloomStrength: number;
  /** Halation をオフにする前に覚えておく強さ */
  savedHalationIntensity: number;
}

/**
 * オブジェクトが BASE_LOOKS のキーかどうか
 * @param value - 検査する値
 */
function isBaseLookName(value: unknown): value is BaseLookName {
  return typeof value === "string" && value in BASE_LOOKS;
}

/**
 * 1 スロット分の JSON を検証して GradeSlotState にする。不正なら null。
 * @param raw - 不明なオブジェクト
 */
function parseGradeSlot(raw: unknown): GradeSlotState | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const params = coerceParams(o.params);
  if (!params) return null;
  // Look Unification: 新 `baseLook` を優先、旧 localStorage の `basePreset` も読む
  const rawBaseLook = o.baseLook ?? o.basePreset;
  const baseLook = rawBaseLook === null || rawBaseLook === undefined ? null : rawBaseLook;
  if (baseLook !== null && !isBaseLookName(baseLook)) return null;
  const intensity = o.intensity;
  if (typeof intensity !== "number" || !Number.isFinite(intensity)) return null;
  const clampedIntensity = Math.max(0, Math.min(1, intensity));
  return {
    params,
    baseLook,
    intensity: clampedIntensity,
  };
}

/**
 * 保存 JSON 全体を検証する
 * @param raw - JSON.parse 済み
 */
export function parseStoredSession(raw: unknown): FilmLabStoredSessionV1 | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== STORAGE_VERSION) return null;
  const presentRaw = o.present;
  if (!presentRaw || typeof presentRaw !== "object") return null;
  const pr = presentRaw as Record<string, unknown>;
  const slotA = parseGradeSlot(pr.slotA);
  const slotB = parseGradeSlot(pr.slotB);
  if (!slotA || !slotB) return null;
  if (pr.compareMode !== true && pr.compareMode !== false) return null;
  if (pr.activeSlot !== "A" && pr.activeSlot !== "B") return null;
  const savedBloomStrength = o.savedBloomStrength;
  const savedHalationIntensity = o.savedHalationIntensity;
  if (typeof savedBloomStrength !== "number" || !Number.isFinite(savedBloomStrength)) return null;
  if (typeof savedHalationIntensity !== "number" || !Number.isFinite(savedHalationIntensity)) return null;
  return {
    version: STORAGE_VERSION,
    present: {
      slotA,
      slotB,
      compareMode: pr.compareMode,
      activeSlot: pr.activeSlot,
    },
    savedBloomStrength: Math.max(0, savedBloomStrength),
    savedHalationIntensity: Math.max(0, savedHalationIntensity),
  };
}

/**
 * localStorage に保存済みセッションがあるか（クライアントのみ）
 */
export function hasFilmLabStoredSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const s = window.localStorage.getItem(FILM_LAB_STORAGE_KEY);
    return Boolean(s && s.length > 0);
  } catch {
    return false;
  }
}

/**
 * 保存を読み取り検証する。無い・不正なら null。
 */
export function loadFilmLabStoredSession(): FilmLabStoredSessionV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FILM_LAB_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return parseStoredSession(parsed);
  } catch (err) {
    console.error("loadFilmLabStoredSession: 読み取りまたは検証に失敗", err);
    return null;
  }
}

/**
 * セッションを保存する
 * @param session - 検証済みのペイロード
 */
export function saveFilmLabStoredSession(session: FilmLabStoredSessionV1): void {
  if (typeof window === "undefined") return;
  const json = JSON.stringify(session);
  window.localStorage.setItem(FILM_LAB_STORAGE_KEY, json);
}

/**
 * 保存を削除する
 */
export function clearFilmLabStoredSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(FILM_LAB_STORAGE_KEY);
  } catch (err) {
    console.error("clearFilmLabStoredSession: 削除に失敗", err);
  }
}
