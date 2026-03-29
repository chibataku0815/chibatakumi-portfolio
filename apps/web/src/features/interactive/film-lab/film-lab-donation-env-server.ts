/**
 * @file Film Lab 寄付設定のサーバー専用読み取り（`film-lab/page.tsx` のみ import）。
 * @description ローカルでは `apps/web/.env.local` が **Node の process.env に読み込まれる**。
 *   ここで `NEXT_PUBLIC_FILM_LAB_STRIPE_SUPPORT_URL` も読み、`donationRuntime` としてクライアントへ渡す。
 *   クライアントバンドルに URL が焼き込まれていなくても（Turbopack / cwd の揺れで empty でも）寄付 UI は動く。
 *   本番 Vercel で `NEXT_PUBLIC` だけビルド後に足した場合は従来どおり `FILM_LAB_*` で上書き可。
 * @limitations クライアントコンポーネントから import しないこと。
 */

import {
  filmLabBuildStripeTiersFromUrls,
  type FilmLabDonationRuntimeConfig,
} from "./film-lab-donation-config";

/**
 * @description env キーの値をトリムして返す。
 */
function filmLabEnvTrim(key: string): string {
  const raw = process.env[key];
  return typeof raw === "string" ? raw.trim() : "";
}

/**
 * @description 左から最初の非空を採用（先頭のキーが優先）。
 */
function filmLabFirstNonEmpty(keys: string[]): string {
  for (const key of keys) {
    const v = filmLabEnvTrim(key);
    if (v.length > 0) return v;
  }
  return "";
}

/**
 * @description 寄付用の公開 URL・UI フラグをサーバー上の `process.env` から組み立てる。
 * `FILM_LAB_*` と `NEXT_PUBLIC_FILM_LAB_*` の**両方**を見る（同じ `.env.local` に書くだけでよい）。
 * @returns URL または UI フラグのいずれかが設定されていれば非 null。すべて空なら null。
 */
export function filmLabReadDonationEnvOnServer(): FilmLabDonationRuntimeConfig | null {
  const u3 = filmLabFirstNonEmpty([
    "FILM_LAB_STRIPE_SUPPORT_URL",
    "NEXT_PUBLIC_FILM_LAB_STRIPE_SUPPORT_URL",
  ]);
  const u9 = filmLabFirstNonEmpty([
    "FILM_LAB_STRIPE_SUPPORT_URL_9",
    "NEXT_PUBLIC_FILM_LAB_STRIPE_SUPPORT_URL_9",
  ]);
  const u25 = filmLabFirstNonEmpty([
    "FILM_LAB_STRIPE_SUPPORT_URL_25",
    "NEXT_PUBLIC_FILM_LAB_STRIPE_SUPPORT_URL_25",
  ]);
  const bmc = filmLabFirstNonEmpty([
    "FILM_LAB_BMC_URL",
    "NEXT_PUBLIC_FILM_LAB_BMC_URL",
  ]);
  const uiFil = filmLabEnvTrim("FILM_LAB_DONATION_UI");
  const uiPub = filmLabEnvTrim("NEXT_PUBLIC_FILM_LAB_DONATION_UI");
  /** FILM_LAB の UI フラグを優先（本番で上書きしやすくする） */
  const uiRaw = uiFil.length > 0 ? uiFil : uiPub;

  const anyConfigured =
    u3.length > 0 ||
    u9.length > 0 ||
    u25.length > 0 ||
    bmc.length > 0 ||
    uiRaw.length > 0;
  if (!anyConfigured) return null;

  return {
    stripeTiers: filmLabBuildStripeTiersFromUrls(u3, u9, u25),
    bmcUrl: bmc,
    uiExplicitOff: uiRaw.toLowerCase() === "false",
  };
}
