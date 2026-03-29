/**
 * @file Film Lab 寄付まわりの Stripe シークレットキー解決（サーバー専用）。
 * @description Vercel では `STRIPE_SECRET_KEY` を推奨。Film Lab 専用エイリアスも許可する。@limitations クライアントへ渡さない。
 */

/**
 * @description 先頭から最初の非空を返す。
 */
function filmLabStripeSecretFromEnv(): string {
  const keys = ["STRIPE_SECRET_KEY", "FILM_LAB_STRIPE_SECRET_KEY"] as const;
  for (const k of keys) {
    const v = process.env[k];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return "";
}

/**
 * @description Checkout Session 検証・Webhook 用の Stripe シークレット。
 * @returns {string} 未設定なら空文字
 */
export function filmLabStripeSecretKey(): string {
  return filmLabStripeSecretFromEnv();
}
