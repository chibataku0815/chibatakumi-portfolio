/**
 * @file Film Lab 寄付まわりの開発者向けデバッグ。
 * @description
 *   - **開発 (`next dev`)**: `filmLabDonationDevTrace` がクエリ無しでもコンソールに出る（`[FilmLab donation dev]`）。
 *   - **詳細ログ＋右下パネル**: 次のいずれか — `?filmLabDebugDonation=1` / `localStorage.filmLabDebugDonation='1'` / `NEXT_PUBLIC_FILM_LAB_DEBUG_DONATION=true`
 * @limitations URL・localStorage を知っていればパネルは有効にできる。シークレットは出さない。
 */

import {
  FILM_LAB_DONATION_COOLDOWN_MS,
  FILM_LAB_DONATION_STORAGE_KEYS,
  filmLabCanShowPresetSaveModal,
  filmLabReadSupporterAck,
} from "./film-lab-donation-logic";

/** @description ビルド時に埋め込む。true なら常に「ユーザー向けデバッグ」（パネル＋[FilmLab donation debug] ログ）を ON */
const FILM_LAB_DONATION_DEBUG_FROM_ENV =
  process.env.NEXT_PUBLIC_FILM_LAB_DEBUG_DONATION === "true";

/** @description プリセット保存後モーダルが出ないときの理由コード */
export type FilmLabPresetModalBlockReason =
  | "ok"
  | "never_again"
  | "session_already_shown"
  | "cooldown_72h"
  | "storage_error"
  | "no_window";

/**
 * @description パネル・`filmLabDonationDebugLog` 用の「ユーザーが ON にした」フラグ。
 *   SSR では常に false（ハイドレーションと揃える）。
 * @returns {boolean} URL / localStorage / NEXT_PUBLIC のいずれかで ON のとき true
 */
export function filmLabDonationDebugUserFlag(): boolean {
  if (typeof window === "undefined") return false;
  if (FILM_LAB_DONATION_DEBUG_FROM_ENV) return true;
  try {
    if (
      new URLSearchParams(window.location.search).get("filmLabDebugDonation") ===
      "1"
    ) {
      return true;
    }
    if (localStorage.getItem("filmLabDebugDonation") === "1") {
      return true;
    }
  } catch {
    /* private モードなど */
  }
  return false;
}

/**
 * @description `filmLabDonationDebugLog` 用。`filmLabDonationDebugUserFlag` と同義。
 * @returns {boolean} 詳細デバッグが有効か
 */
export function isFilmLabDonationDebugEnabled(): boolean {
  return filmLabDonationDebugUserFlag();
}

/**
 * @description `next dev` のときだけ、クエリ不要でコンソールに出す軽いトレース。
 * @param {string} message - メッセージ
 * @param {unknown} [data] - 追加データ
 */
export function filmLabDonationDevTrace(message: string, data?: unknown): void {
  if (process.env.NODE_ENV !== "development") return;
  if (data !== undefined) {
    console.info(`[FilmLab donation dev] ${message}`, data);
  } else {
    console.info(`[FilmLab donation dev] ${message}`);
  }
}

/**
 * @description デバッグ（ユーザーフラグ）ON のときだけ console.info する。
 * @param {string} message - 一言メッセージ
 * @param {unknown} [data] - 追加データ
 */
export function filmLabDonationDebugLog(message: string, data?: unknown): void {
  if (!filmLabDonationDebugUserFlag()) return;
  if (data !== undefined) {
    console.info(`[FilmLab donation debug] ${message}`, data);
  } else {
    console.info(`[FilmLab donation debug] ${message}`);
  }
}

function parseStoredMs(iso: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
}

/**
 * @description 「保存後モーダルが出せるか」を分解して返す。パネルとコンソールの両方に使う。
 * @returns {{ canShow: boolean; reason: FilmLabPresetModalBlockReason; details: Record<string, unknown>; hintJa: string }} 診断結果
 */
export function filmLabDiagnosePresetSaveModal(): {
  canShow: boolean;
  reason: FilmLabPresetModalBlockReason;
  details: Record<string, unknown>;
  hintJa: string;
} {
  const details: Record<string, unknown> = {};
  try {
    if (typeof window === "undefined") {
      return {
        canShow: false,
        reason: "no_window",
        details,
        hintJa: "SSR 中（window なし）",
      };
    }
    details.supporterAck = filmLabReadSupporterAck();
    const never = localStorage.getItem(FILM_LAB_DONATION_STORAGE_KEYS.presetModalNever);
    details.presetModalNever = never;
    if (never === "1") {
      return {
        canShow: false,
        reason: "never_again",
        details,
        hintJa:
          "「今後表示しない」を選んだため。デバッグの「リセット」か localStorage のキーを削除してください。",
      };
    }
    const sess = sessionStorage.getItem(
      FILM_LAB_DONATION_STORAGE_KEYS.sessionModalShown,
    );
    details.sessionModalShown = sess;
    if (sess === "1") {
      return {
        canShow: false,
        reason: "session_already_shown",
        details,
        hintJa:
          "このタブのセッションでは既にモーダルを一度出しました。新しいタブか「リセット」後に再試行してください。",
      };
    }
    const lastRaw = localStorage.getItem(
      FILM_LAB_DONATION_STORAGE_KEYS.presetModalLastAt,
    );
    details.presetModalLastAt = lastRaw;
    const lastMs = parseStoredMs(lastRaw);
    if (lastMs != null) {
      const elapsed = Date.now() - lastMs;
      details.cooldownMs = FILM_LAB_DONATION_COOLDOWN_MS;
      details.elapsedSinceLastMs = elapsed;
      if (elapsed < FILM_LAB_DONATION_COOLDOWN_MS) {
        return {
          canShow: false,
          reason: "cooldown_72h",
          details,
          hintJa: `72時間クールダウン中（残り約 ${Math.ceil((FILM_LAB_DONATION_COOLDOWN_MS - elapsed) / 3600000)} 時間）`,
        };
      }
    }
    const can = filmLabCanShowPresetSaveModal();
    if (!can) {
      return {
        canShow: false,
        reason: "storage_error",
        details,
        hintJa:
          "filmLabCanShowPresetSaveModal が false（未分類・private モードで storage 失敗など）",
      };
    }
    return {
      canShow: true,
      reason: "ok",
      details,
      hintJa: "表示可能。コントロールの「このブラウザに保存」を実行すると約 0.4 秒後に開く想定。",
    };
  } catch (err) {
    details.error = String(err);
    return {
      canShow: false,
      reason: "storage_error",
      details,
      hintJa: "localStorage / sessionStorage 読み書きで例外（プライベートブラウズ等）",
    };
  }
}

/**
 * @description ナッジ用ストレージだけ消す（プレゼンモードは触らない）。
 *   デバッグパネルのボタンと `window.__filmLabDonationDebug.resetNudge()` から呼ぶ。
 */
export function filmLabDebugResetDonationNudgeKeys(): void {
  if (typeof window === "undefined") return;
  filmLabDonationDebugLog("ナッジ用キーを削除します", {
    keys: [
      FILM_LAB_DONATION_STORAGE_KEYS.presetModalLastAt,
      FILM_LAB_DONATION_STORAGE_KEYS.presetModalNever,
      FILM_LAB_DONATION_STORAGE_KEYS.sessionModalShown,
      FILM_LAB_DONATION_STORAGE_KEYS.lutBannerLastAt,
      FILM_LAB_DONATION_STORAGE_KEYS.lutBannerSession,
      FILM_LAB_DONATION_STORAGE_KEYS.lutBannerPending,
      FILM_LAB_DONATION_STORAGE_KEYS.supporterAck,
    ],
  });
  try {
    localStorage.removeItem(FILM_LAB_DONATION_STORAGE_KEYS.presetModalLastAt);
    localStorage.removeItem(FILM_LAB_DONATION_STORAGE_KEYS.presetModalNever);
    sessionStorage.removeItem(FILM_LAB_DONATION_STORAGE_KEYS.sessionModalShown);
    localStorage.removeItem(FILM_LAB_DONATION_STORAGE_KEYS.lutBannerLastAt);
    sessionStorage.removeItem(FILM_LAB_DONATION_STORAGE_KEYS.lutBannerSession);
    sessionStorage.removeItem(FILM_LAB_DONATION_STORAGE_KEYS.lutBannerPending);
    localStorage.removeItem(FILM_LAB_DONATION_STORAGE_KEYS.supporterAck);
  } catch (err) {
    console.warn("[FilmLab donation debug] filmLabDebugResetDonationNudgeKeys failed", {
      functionName: "filmLabDebugResetDonationNudgeKeys",
      err: err instanceof Error ? err.message : String(err),
    });
  }
}

export type FilmLabDonationDebugWindowApi = {
  diagnose: typeof filmLabDiagnosePresetSaveModal;
  resetNudge: typeof filmLabDebugResetDonationNudgeKeys;
  log: typeof filmLabDonationDebugLog;
};
