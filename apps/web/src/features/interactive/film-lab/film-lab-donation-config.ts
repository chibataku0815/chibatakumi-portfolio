/**
 * @file Film Lab の任意寄付 UI 用の環境変数（ビルド時に埋め込まれる）。
 * @description Stripe Payment Link（段階別は URL を分ける）と Buy Me a Coffee の URLを公開キーで渡す。
 *   Stripe の URL が 1 本も無く、BMC も空なら寄付 UI 全体を出さない。
 * @limitations 金額帯や税は Stripe 側設定に依存する。Webhook は Phase 1 では使わない。
 */

/**
 * @description 環境変数の文字列を前後空白だけ整える。未定義なら空文字。
 * @param {string} envName - `process.env` のキー名
 * @returns {string} トリム後の値または空
 */
function filmLabTrimPublicEnv(envName: string): string {
  const raw = process.env[envName];
  return typeof raw === "string" ? raw.trim() : "";
}

/**
 * @description Stripe 寄付の 1 段階（1 Payment Link = 1 価格が安全。複数 line_items は合計課金になりうる）。
 * @property {3 | 9 | 25} amountUsd - 表示・計測用の USD ラベル（Stripe ダッシュボードの Price と揃える）
 * @property {string} url - Payment Link の公開 URL
 */
export type FilmLabDonationStripeTier = {
  amountUsd: 3 | 9 | 25;
  url: string;
};

/**
 * @description `NEXT_PUBLIC_FILM_LAB_STRIPE_SUPPORT_URL`（$3）と任意の `_9` / `_25` からティア一覧を組み立てる。
 * @returns {FilmLabDonationStripeTier[]} URL が空でないものだけ、金額の昇順（3 → 9 → 25）
 */
function filmLabBuildStripeTiers(): FilmLabDonationStripeTier[] {
  const url3 = filmLabTrimPublicEnv("NEXT_PUBLIC_FILM_LAB_STRIPE_SUPPORT_URL");
  const url9 = filmLabTrimPublicEnv("NEXT_PUBLIC_FILM_LAB_STRIPE_SUPPORT_URL_9");
  const url25 = filmLabTrimPublicEnv("NEXT_PUBLIC_FILM_LAB_STRIPE_SUPPORT_URL_25");
  const tiers: FilmLabDonationStripeTier[] = [];
  if (url3.length > 0) tiers.push({ amountUsd: 3, url: url3 });
  if (url9.length > 0) tiers.push({ amountUsd: 9, url: url9 });
  if (url25.length > 0) tiers.push({ amountUsd: 25, url: url25 });
  return tiers;
}

/** @description 有効な Stripe 寄付リンク（0〜3 件）。 */
export const filmLabDonationStripeTiers: FilmLabDonationStripeTier[] =
  filmLabBuildStripeTiers();

/**
 * @description 後方互換・単一 CTA 向けに先頭の Stripe URL を返す。ティア未設定時は空。
 * @deprecated 複数段階時は `filmLabDonationStripeTiers` を使う。
 */
export const filmLabDonationStripeUrl =
  filmLabDonationStripeTiers[0]?.url ?? "";

/** Buy Me a Coffee のクリエイター URL */
export const filmLabDonationBmcUrl = filmLabTrimPublicEnv(
  "NEXT_PUBLIC_FILM_LAB_BMC_URL",
);

const donationUiEnv =
  process.env.NEXT_PUBLIC_FILM_LAB_DONATION_UI?.trim().toLowerCase();

/**
 * @description 寄付ブロックをマウントしてよいか。
 * `NEXT_PUBLIC_FILM_LAB_DONATION_UI=false` のときだけ明示オフ。
 * Stripe のティアが 1 件以上ある、または BMC URL があればオン（**Stripe だけでも可**。BMC は任意）。
 * @returns {boolean} UI を出してよいとき true
 */
export function filmLabDonationUiEnabled(): boolean {
  if (donationUiEnv === "false") return false;
  return (
    filmLabDonationStripeTiers.length > 0 || filmLabDonationBmcUrl.length > 0
  );
}
