/**
 * @file Film Lab 寄付ナッジの表示条件と localStorage / sessionStorage の読み書き。
 * @description life リポの Eng 実行稿と同じキー名・72 時間クールダウンを使う。
 * @limitations SSR では呼ばない。`typeof window` を前提にした関数はクライアントからのみ。
 */

/** 72 時間（ミリ秒）。ナッジの再表示間隔。 */
export const FILM_LAB_DONATION_COOLDOWN_MS = 72 * 60 * 60 * 1000;

const KEY_PRESET_LAST = "filmLabDonationPresetModalLastAt";
const KEY_PRESET_NEVER = "filmLabDonationPresetModalNever";
const KEY_SESSION_MODAL = "filmLabDonationModalShownSession";

const KEY_LUT_LAST = "filmLabDonationLutBannerLastAt";
const KEY_LUT_SESSION = "filmLabDonationLutBannerShownSession";
const KEY_LUT_PENDING = "filmLabDonationLutBannerPending";

const KEY_PRESENT = "filmLabPresentMode";
const KEY_PRESENT_HINT = "filmLabPresentModeHintDismissed";

/**
 * @description デバッグ用にキー名だけ外部公開（値の読み書きロジックは変えない）。
 *   開発者ツールや診断パネルで「どのキーがブロックしているか」を示す。
 */
export const FILM_LAB_DONATION_STORAGE_KEYS = {
  presetModalLastAt: KEY_PRESET_LAST,
  presetModalNever: KEY_PRESET_NEVER,
  sessionModalShown: KEY_SESSION_MODAL,
  lutBannerLastAt: KEY_LUT_LAST,
  lutBannerSession: KEY_LUT_SESSION,
  lutBannerPending: KEY_LUT_PENDING,
  presentMode: KEY_PRESENT,
  presentHintDismissed: KEY_PRESENT_HINT,
} as const;

function parseStoredTime(iso: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
}

function withinCooldown(lastAt: number | null): boolean {
  if (lastAt == null) return false;
  return Date.now() - lastAt < FILM_LAB_DONATION_COOLDOWN_MS;
}

/**
 * プリセット保存後モーダルを出してよいか（プレゼンモード OFF 前提は呼び出し側）。
 */
export function filmLabCanShowPresetSaveModal(): boolean {
  try {
    if (typeof window === "undefined") return false;
    if (localStorage.getItem(KEY_PRESET_NEVER) === "1") return false;
    if (sessionStorage.getItem(KEY_SESSION_MODAL) === "1") return false;
    const last = parseStoredTime(localStorage.getItem(KEY_PRESET_LAST));
    return !withinCooldown(last);
  } catch {
    return false;
  }
}

/**
 * モーダルを開いたあとに呼ぶ。セッション枠と最終表示時刻を記録する。
 */
export function filmLabMarkPresetSaveModalOpened(): void {
  try {
    sessionStorage.setItem(KEY_SESSION_MODAL, "1");
    localStorage.setItem(KEY_PRESET_LAST, new Date().toISOString());
  } catch {
    /* private mode 等は握りつぶす */
  }
}

/** 「今後表示しない」で永続的にプリセット保存モーダルを止める */
export function filmLabMarkPresetSaveModalNever(): void {
  try {
    localStorage.setItem(KEY_PRESET_NEVER, "1");
  } catch {
    /* noop */
  }
}

/**
 * LUT 読み込み成功後、次のユーザー操作でバナーを出す予約をする。
 */
export function filmLabSetLutBannerPending(): void {
  try {
    sessionStorage.setItem(KEY_LUT_PENDING, "1");
  } catch {
    /* noop */
  }
}

/** LUT 成功後の「次の操作でバナー検討」フラグを消す（操作 1 回目で必ず呼ぶ） */
export function filmLabClearLutBannerPending(): void {
  try {
    sessionStorage.removeItem(KEY_LUT_PENDING);
  } catch {
    /* noop */
  }
}

export function filmLabHasLutBannerPending(): boolean {
  try {
    return sessionStorage.getItem(KEY_LUT_PENDING) === "1";
  } catch {
    return false;
  }
}

/**
 * LUT スリムバナーを表示してよいか。
 */
export function filmLabCanShowLutBanner(): boolean {
  try {
    if (typeof window === "undefined") return false;
    if (sessionStorage.getItem(KEY_LUT_SESSION) === "1") return false;
    const last = parseStoredTime(localStorage.getItem(KEY_LUT_LAST));
    return !withinCooldown(last);
  } catch {
    return false;
  }
}

/** LUT バナーを表示したあとに呼ぶ */
export function filmLabMarkLutBannerShown(): void {
  try {
    sessionStorage.setItem(KEY_LUT_SESSION, "1");
    localStorage.setItem(KEY_LUT_LAST, new Date().toISOString());
  } catch {
    /* noop */
  }
}

/** プレゼンモード（寄付 UI 全非表示）が ON か */
export function filmLabReadPresentMode(): boolean {
  try {
    return localStorage.getItem(KEY_PRESENT) === "1";
  } catch {
    return false;
  }
}

export function filmLabWritePresentMode(on: boolean): void {
  try {
    if (on) localStorage.setItem(KEY_PRESENT, "1");
    else localStorage.removeItem(KEY_PRESENT);
  } catch {
    /* noop */
  }
}

/** 初回「画面共有のヒント」を消したか */
export function filmLabReadPresentHintDismissed(): boolean {
  try {
    return localStorage.getItem(KEY_PRESENT_HINT) === "1";
  } catch {
    return false;
  }
}

export function filmLabDismissPresentHint(): void {
  try {
    localStorage.setItem(KEY_PRESENT_HINT, "1");
  } catch {
    /* noop */
  }
}
