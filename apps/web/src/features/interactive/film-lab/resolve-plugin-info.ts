/**
 * @file `Filmtone for DaVinci Resolve` の公開導線で使う固定情報とデプロイ環境変数の読み取り。
 * @description Desktop / iOS の `*-release-info.ts` と同じ流儀で、DaVinci Resolve プラグインの
 *   product page・trial form・購入 CTA が同じ公開条件（価格・シート・動作確認済み構成・技術識別子・
 *   backend endpoint）を 1 か所から参照できるようにする。
 * @limitations 価格・動作確認済みの構成は owner 承認済みの確定値。ここを起点に page 側で再導出しないこと。
 *   Turnstile site key / Polar checkout URL / 配布 pkg URL はデプロイ環境（Vercel）側で設定する owner 手順。
 */

/** 公開表記の製品名（DaVinci Resolve を明示する必要がある文脈で使う） */
export const filmtoneResolveProductName = "Filmtone for DaVinci Resolve";
/** 配布・ライセンス・不具合の窓口 */
export const filmtoneResolveSupportEmail = "chiba@fores-tone.co.jp";
/** canonical / OGP 用の site 起点（既存 Filmtone サーフェスと同一ホスト） */
export const filmtoneResolveCanonicalBaseUrl = "https://www.chibatakumi.studio";

// --- 価格（owner 承認 2026-07-18・再導出禁止） ------------------------------
/** 通常価格（USD・買い切り） */
export const filmtoneResolveNormalPriceUsd = 49;
/** ローンチ価格（USD・固定 $10 引きクーポンで実現。% 引きにしないのは $39.20 を避けるため） */
export const filmtoneResolveLaunchPriceUsd = 39;
/** ローンチクーポンの固定割引額（USD） */
export const filmtoneResolveLaunchDiscountUsd = 10;
/** ローンチ価格の適用期間（launch から日数） */
export const filmtoneResolveLaunchWindowDays = 30;
/** ライセンスのユーザー数 */
export const filmtoneResolveSeatUsers = 1;
/** ライセンスの端末数 */
export const filmtoneResolveSeatMachines = 2;
/** clean trial の日数 */
export const filmtoneResolveTrialDays = 14;

// --- 動作確認済み構成（owner 承認の narrow claim・broaden 禁止） --------------
/**
 * 動作確認済みの macOS バージョン。
 * @remarks これは「検証済みの構成」であって互換性の下限保証ではない。`26.x` / `以降` 等に広げないこと。
 */
export const filmtoneResolveVerifiedMacos = "macOS 26.5.1";
/**
 * 動作確認済みの DaVinci Resolve バージョン。
 * @remarks `21.x` / `以降` 等に広げないこと。ビルドの deployment target（14.0）を下限として提示しない。
 */
export const filmtoneResolveVerifiedResolve = "DaVinci Resolve Studio 21.0.2";

// --- 技術識別子 --------------------------------------------------------------
/** OFX plugin identifier */
export const filmtoneResolveOfxIdentifier = "com.chibatakumi.filmtone.resolve";
/** インストール後の bundle 配置先 */
export const filmtoneResolveBundlePath = "/Library/OFX/Plugins/Filmtone.ofx.bundle";
/** ライセンスファイルの配置先（購入版・trial 版で共通） */
export const filmtoneResolveLicensePath =
  "~/Library/Application Support/Filmtone/Filmtone.license";
/** 配布 pkg のファイル名パターン（実バージョンは配布時に確定・TBD） */
export const filmtoneResolvePkgNamePattern = "Filmtone-<version>.pkg";

// --- Trial backend（本番稼働中の Worker） ------------------------------------
/** trial 請求の既定 endpoint（デプロイ環境で上書き可） */
const FILMTONE_RESOLVE_TRIAL_ENDPOINT_DEFAULT =
  "https://filmtone-license-worker.chiba-4f9.workers.dev/trial";
/**
 * Turnstile の action 値。
 * @remarks Worker はこの値以外の action を拒否するため、widget の `action` はこの定数と一致させること。
 */
export const filmtoneResolveTurnstileAction = "filmtone_trial";

/**
 * trial 請求 endpoint を読む。
 * @returns {string} `NEXT_PUBLIC_FILMTONE_RESOLVE_TRIAL_ENDPOINT` があれば優先、なければ本番 Worker の既定 URL。
 */
export function filmtoneResolveReadTrialEndpoint(): string {
  return (
    process.env.NEXT_PUBLIC_FILMTONE_RESOLVE_TRIAL_ENDPOINT?.trim() ||
    FILMTONE_RESOLVE_TRIAL_ENDPOINT_DEFAULT
  );
}

/**
 * Turnstile の site key を読む（client 埋め込み前提）。
 * @returns {string} 未設定なら空文字。空のときは form 側で widget を描画せず「一時的に利用不可」を表示する。
 */
export function filmtoneResolveReadTurnstileSiteKey(): string {
  return process.env.NEXT_PUBLIC_FILMTONE_RESOLVE_TURNSTILE_SITE_KEY?.trim() ?? "";
}

/**
 * Polar checkout URL を読む。
 * @returns {string} 未設定なら空文字。空のときは購入 CTA を「近日公開」の無効状態にする。
 * @todo owner: `NEXT_PUBLIC_FILMTONE_RESOLVE_POLAR_CHECKOUT_URL` に実際の Polar checkout URL を設定する（Vercel）。
 */
export function filmtoneResolveReadPolarCheckoutUrl(): string {
  return process.env.NEXT_PUBLIC_FILMTONE_RESOLVE_POLAR_CHECKOUT_URL?.trim() ?? "";
}

/**
 * 配布 pkg の HTTPS 直リンクを読む。
 * @returns {string} 未設定なら空文字。空のときは install 手順で pkg 名パターンのみ提示する。
 * @todo owner: 署名・notarize・staple 済み pkg の公開 URL を設定する（TBD）。
 */
export function filmtoneResolveReadPkgDownloadUrl(): string {
  return process.env.NEXT_PUBLIC_FILMTONE_RESOLVE_PKG_DOWNLOAD_URL?.trim() ?? "";
}
