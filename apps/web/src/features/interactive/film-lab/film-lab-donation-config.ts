/**
 * @file Film Lab の任意寄付 UI 用の環境変数とヘルパ。
 * @description `/film-lab` では `film-lab-donation-env-server` がサーバーの `process.env` から
 *   `NEXT_PUBLIC_*` と `FILM_LAB_*` の両方を読み `donationRuntime` で渡す（`.env.local` は dev でサーバーに読まれる）。
 *   このファイルのモジュール定数はフォールバック・デバッグ用（クライアント埋め込みが empty でも寄付はサーバー経路で動く）。
 * @limitations Webhook は Phase 1 では使わない。
 */

/**
 * @description Stripe 寄付の 1 段階（1 Payment Link = 1 価格が安全）。
 */
export type FilmLabDonationStripeTier = {
  amountUsd: 3 | 9 | 25;
  url: string;
};

/**
 * @description サーバーから `FilmLabFullPage` に渡す寄付の公開設定（シークレットを含まない）。
 */
export type FilmLabDonationRuntimeConfig = {
  stripeTiers: FilmLabDonationStripeTier[];
  bmcUrl: string;
  /** `FILM_LAB_DONATION_UI=false` 相当 */
  uiExplicitOff: boolean;
};

/**
 * @description 環境変数の文字列を前後空白だけ整える。
 */
function filmLabTrimPublicEnv(envName: string): string {
  const raw = process.env[envName];
  return typeof raw === "string" ? raw.trim() : "";
}

/**
 * @description 3 本の URL 文字列からティア配列を組み立てる（空はスキップ）。
 */
export function filmLabBuildStripeTiersFromUrls(
  url3: string,
  url9: string,
  url25: string,
): FilmLabDonationStripeTier[] {
  const tiers: FilmLabDonationStripeTier[] = [];
  if (url3.length > 0) tiers.push({ amountUsd: 3, url: url3 });
  if (url9.length > 0) tiers.push({ amountUsd: 9, url: url9 });
  if (url25.length > 0) tiers.push({ amountUsd: 25, url: url25 });
  return tiers;
}

/**
 * @description ティア・BMC・明示オフフラグから寄付 UI を出すか。
 */
export function filmLabDonationUiEnabledFromRuntimePartial(input: {
  stripeTiers: FilmLabDonationStripeTier[];
  bmcUrl: string;
  uiExplicitOff: boolean;
}): boolean {
  if (input.uiExplicitOff) return false;
  return input.stripeTiers.length > 0 || input.bmcUrl.length > 0;
}

/** @description クライアント埋め込み用: NEXT_PUBLIC のティア一覧 */
export const filmLabDonationStripeTiers: FilmLabDonationStripeTier[] =
  filmLabBuildStripeTiersFromUrls(
    filmLabTrimPublicEnv("NEXT_PUBLIC_FILM_LAB_STRIPE_SUPPORT_URL"),
    filmLabTrimPublicEnv("NEXT_PUBLIC_FILM_LAB_STRIPE_SUPPORT_URL_9"),
    filmLabTrimPublicEnv("NEXT_PUBLIC_FILM_LAB_STRIPE_SUPPORT_URL_25"),
  );

/**
 * @description 後方互換: 先頭の Stripe URL。
 * @deprecated 複数段階時は `filmLabDonationStripeTiers` を使う。
 */
export const filmLabDonationStripeUrl =
  filmLabDonationStripeTiers[0]?.url ?? "";

export const filmLabDonationBmcUrl = filmLabTrimPublicEnv(
  "NEXT_PUBLIC_FILM_LAB_BMC_URL",
);

const donationUiEnvClient =
  process.env.NEXT_PUBLIC_FILM_LAB_DONATION_UI?.trim().toLowerCase();

/**
 * @description クライアントのみ NEXT_PUBLIC にフォールバックするときの有効判定。
 */
export function filmLabDonationUiEnabled(): boolean {
  if (donationUiEnvClient === "false") return false;
  return (
    filmLabDonationStripeTiers.length > 0 || filmLabDonationBmcUrl.length > 0
  );
}

/**
 * @description デバッグ用: ビルドに埋め込まれた NEXT_PUBLIC の「空かどうか」だけ返す（URL は出さない）。
 */
export type FilmLabDonationClientPublicEnvStatus = {
  NEXT_PUBLIC_FILM_LAB_STRIPE_SUPPORT_URL: "set" | "empty";
  NEXT_PUBLIC_FILM_LAB_STRIPE_SUPPORT_URL_9: "set" | "empty";
  NEXT_PUBLIC_FILM_LAB_STRIPE_SUPPORT_URL_25: "set" | "empty";
  NEXT_PUBLIC_FILM_LAB_BMC_URL: "set" | "empty";
  /** `NEXT_PUBLIC_FILM_LAB_DONATION_UI` のざっくり分類 */
  donationUiFlag: "explicit_false" | "unset_or_empty" | "other_string";
};

/**
 * @description パネル・dev ログ用。キー名は .env.example と一致。
 * @returns {FilmLabDonationClientPublicEnvStatus} 各変数が空かどうか
 */
export function filmLabDonationClientPublicEnvStatus(): FilmLabDonationClientPublicEnvStatus {
  const nonempty = (key: string): "set" | "empty" =>
    filmLabTrimPublicEnv(key).length > 0 ? "set" : "empty";
  const ui = process.env.NEXT_PUBLIC_FILM_LAB_DONATION_UI?.trim().toLowerCase();
  let donationUiFlag: FilmLabDonationClientPublicEnvStatus["donationUiFlag"] =
    "unset_or_empty";
  if (ui === "false") donationUiFlag = "explicit_false";
  else if (ui !== undefined && ui.length > 0) donationUiFlag = "other_string";
  return {
    NEXT_PUBLIC_FILM_LAB_STRIPE_SUPPORT_URL: nonempty(
      "NEXT_PUBLIC_FILM_LAB_STRIPE_SUPPORT_URL",
    ),
    NEXT_PUBLIC_FILM_LAB_STRIPE_SUPPORT_URL_9: nonempty(
      "NEXT_PUBLIC_FILM_LAB_STRIPE_SUPPORT_URL_9",
    ),
    NEXT_PUBLIC_FILM_LAB_STRIPE_SUPPORT_URL_25: nonempty(
      "NEXT_PUBLIC_FILM_LAB_STRIPE_SUPPORT_URL_25",
    ),
    NEXT_PUBLIC_FILM_LAB_BMC_URL: nonempty("NEXT_PUBLIC_FILM_LAB_BMC_URL"),
    donationUiFlag,
  };
}

