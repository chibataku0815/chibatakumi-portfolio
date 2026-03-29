/**
 * @file Film Lab 寄付「検証済み支援者」Cookie の署名・検証（サーバー専用）。
 * @description Payment Intent ID と有効期限を HMAC で包み、`httpOnly` Cookie に載せる。クライアントから import しないこと。
 * @limitations 返金後の無効化は別途 Webhook + ストレージがないと完璧にはできない（Cookie は maxAge まで残る）。
 */

import { createHmac, timingSafeEqual } from "crypto";

/** Cookie 名。`verify` Route と `film-lab/page` で共通。 */
export const FILM_LAB_SUPPORTER_COOKIE_NAME = "film_lab_supporter_v1";

const MAX_AGE_SEC = 60 * 60 * 24 * 90;

export type FilmLabSupporterCookiePayload = {
  /** @description Stripe PaymentIntent ID（`pi_`） */
  pi: string;
  /** @description Unix 秒の失効時刻 */
  exp: number;
};

/**
 * @description `paymentIntentId` から署名付きトークン文字列を作る。
 * @param {string} paymentIntentId - Stripe `pi_` ID
 * @param {string} secret - `FILM_LAB_DONATION_SIGNING_SECRET`（十分長いランダム文字列）
 * @returns {string} `<base64url(json)>.<base64url(hmac)>`
 */
export function filmLabSignSupporterCookie(
  paymentIntentId: string,
  secret: string,
): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const payload: FilmLabSupporterCookiePayload = { pi: paymentIntentId, exp };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = createHmac("sha256", secret).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

/**
 * @description Cookie 値を検証し、有効ならペイロードを返す。
 * @param {string} token - Cookie の生の値
 * @param {string} secret - 署名と同じシークレット
 * @returns {FilmLabSupporterCookiePayload | null} 改ざん・期限切れ・形式不良なら null
 */
export function filmLabVerifySupporterCookieValue(
  token: string,
  secret: string,
): FilmLabSupporterCookiePayload | null {
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!payloadB64 || !sig) return null;
  const expected = createHmac("sha256", secret).update(payloadB64).digest("base64url");
  try {
    if (!timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expected, "utf8"))) {
      return null;
    }
  } catch {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as FilmLabSupporterCookiePayload).pi !== "string" ||
    typeof (parsed as FilmLabSupporterCookiePayload).exp !== "number"
  ) {
    return null;
  }
  const data = parsed as FilmLabSupporterCookiePayload;
  if (data.exp < Math.floor(Date.now() / 1000)) return null;
  if (!data.pi.startsWith("pi_")) return null;
  return data;
}
