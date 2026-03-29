"use client";

/**
 * @file Stripe 決済完了タブから開く「ご支援ありがとう」ページの UI。
 * @description 感謝文・免責・Film Lab への導線。`session_id` があるときは POST verify で httpOnly Cookie を発行する。
 * @limitations verify に必要な env が無いときは Cookie を付けず、従来どおり Film Lab の `donationThanks` フォールバック可。
 */

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { trackFilmLabDonationEvent } from "@/shared/analytics";

export type FilmLabSupportThanksClientProps = {
  /** Stripe が `?session_id={CHECKOUT_SESSION_ID}` で付与する Checkout Session ID */
  checkoutSessionId?: string;
};

/**
 * @description Thanks ページ本体。マウント時に計測し、あればセッション検証を走らせる。
 */
export function FilmLabSupportThanksClient({ checkoutSessionId }: FilmLabSupportThanksClientProps) {
  const t = useTranslations("film-lab.donation.thanks_page");
  const tDonation = useTranslations("film-lab.donation");
  const locale = useLocale();
  const [verifyState, setVerifyState] = useState<"idle" | "pending" | "ok" | "error">("idle");
  /** @description 本番では出さない。verify 失敗時の HTTP と API `code` をローカルで即特定するため。 */
  const [verifyDiag, setVerifyDiag] = useState<{ httpStatus: number; code: string } | null>(null);

  useEffect(() => {
    trackFilmLabDonationEvent("donation_thanks_page_view", {
      locale,
      variant: "v1",
    });
  }, [locale]);

  useEffect(() => {
    if (!checkoutSessionId || !checkoutSessionId.startsWith("cs_")) {
      return;
    }
    let cancelled = false;
    setVerifyState("pending");
    setVerifyDiag(null);
    void (async () => {
      try {
        const res = await fetch("/api/film-lab/donation/verify", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: checkoutSessionId }),
        });
        const rawBody = await res.text();
        let data: { ok?: boolean; code?: string } = {};
        try {
          data = JSON.parse(rawBody) as { ok?: boolean; code?: string };
        } catch {
          data = { ok: false, code: "non_json_body" };
          if (process.env.NODE_ENV === "development") {
            console.warn("FilmLabSupportThanksClient: verify response was not JSON", {
              functionName: "FilmLabSupportThanksClient.useEffect.verify",
              httpStatus: res.status,
              bodySnippet: rawBody.slice(0, 240),
            });
          }
        }
        if (cancelled) return;
        if (data.ok === true) {
          setVerifyState("ok");
          trackFilmLabDonationEvent("donation_checkout_session_verified", {
            locale,
            variant: "v1",
          });
          const url = new URL(window.location.href);
          url.searchParams.delete("session_id");
          const qs = url.searchParams.toString();
          window.history.replaceState({}, "", url.pathname + (qs ? `?${qs}` : "") + url.hash);
        } else {
          setVerifyState("error");
          const apiCode = typeof data.code === "string" && data.code.length > 0 ? data.code : "unknown";
          setVerifyDiag({ httpStatus: res.status, code: apiCode });
          if (process.env.NODE_ENV === "development") {
            console.warn("FilmLabSupportThanksClient: verify did not return ok", {
              functionName: "FilmLabSupportThanksClient.useEffect.verify",
              httpStatus: res.status,
              code: apiCode,
            });
          }
        }
      } catch (err) {
        if (!cancelled) {
          setVerifyState("error");
          setVerifyDiag({ httpStatus: 0, code: "network_or_fetch_error" });
          if (process.env.NODE_ENV === "development") {
            console.warn("FilmLabSupportThanksClient: verify fetch failed", {
              functionName: "FilmLabSupportThanksClient.useEffect.verify",
              error: err instanceof Error ? err.message : String(err),
            });
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [checkoutSessionId, locale]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-16 sm:py-24">
      <h1 className="text-lg font-semibold text-[var(--text-base)]">{t("title")}</h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--text-base-70)]">{t("body")}</p>
      <p className="mt-2 text-xs leading-relaxed text-[var(--text-base-50)]">{t("returnHint")}</p>
      {verifyState === "pending" ? (
        <p className="mt-2 text-xs text-[var(--text-base-50)]">{t("verifyPending")}</p>
      ) : null}
      {verifyState === "error" ? (
        <>
          <p className="mt-2 text-xs text-amber-200/80">{t("verifyFailed")}</p>
          {process.env.NODE_ENV === "development" && verifyDiag ? (
            <p className="mt-1 font-mono text-[10px] text-[var(--text-base-40)]">
              [dev] verify HTTP {verifyDiag.httpStatus} · code {verifyDiag.code}
            </p>
          ) : null}
        </>
      ) : null}
      <Link
        href={verifyState === "ok" ? "/film-lab" : "/film-lab?donationThanks=1"}
        className="mt-6 inline-flex w-fit rounded-xl bg-[var(--accent-amber1)] px-4 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90"
      >
        {t("returnCta")}
      </Link>
      <p className="mt-8 text-[10px] leading-snug text-[var(--text-base-40)]">
        {tDonation("legal_footer_short")}
      </p>
    </div>
  );
}
