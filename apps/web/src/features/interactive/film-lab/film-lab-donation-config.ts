/**
 * @file Film Lab の任意寄付 UI 用の環境変数（ビルド時に埋め込まれる）。
 * @description Stripe Payment Link と Buy Me a Coffee の URL を公開キーで渡す。どちらも空なら寄付 UI 全体を出さない。
 * @limitations 金額帯や税は Stripe 側設定に依存する。Webhook は Phase 1 では使わない。
 */

/** Stripe の支援用 Payment Link（複数価格を 1 ページにまとめた URL を想定） */
export const filmLabDonationStripeUrl =
  typeof process.env.NEXT_PUBLIC_FILM_LAB_STRIPE_SUPPORT_URL === "string"
    ? process.env.NEXT_PUBLIC_FILM_LAB_STRIPE_SUPPORT_URL.trim()
    : "";

/** Buy Me a Coffee のクリエイター URL */
export const filmLabDonationBmcUrl =
  typeof process.env.NEXT_PUBLIC_FILM_LAB_BMC_URL === "string"
    ? process.env.NEXT_PUBLIC_FILM_LAB_BMC_URL.trim()
    : "";

const donationUiEnv = process.env.NEXT_PUBLIC_FILM_LAB_DONATION_UI?.trim().toLowerCase();

/**
 * 寄付ブロックをマウントしてよいか。
 * `NEXT_PUBLIC_FILM_LAB_DONATION_UI=false` のときだけ明示オフ。URL が 1 本も無ければオフ。
 */
export function filmLabDonationUiEnabled(): boolean {
  if (donationUiEnv === "false") return false;
  return (
    filmLabDonationStripeUrl.length > 0 || filmLabDonationBmcUrl.length > 0
  );
}
