"use client";

/**
 * @file ダウンロード完了ページの UI。
 * @description DMG ダウンロード開始後に表示される。インストール手順・Gatekeeper ガイド・寄付導線を含む。
 * @limitations DMG の自動ダウンロードは親のサーバーコンポーネントが iframe 経由でトリガーする。
 */

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { FilmLabDonationStripeTier } from "@/features/interactive/film-lab/film-lab-donation-config";
import { trackFilmLabDesktopDownloadEvent } from "@/shared/analytics";
import { filmLabDesktopSupportEmail } from "@/features/interactive/film-lab/desktop-release-info";

const DOWNLOAD_VARIANT = "v1";
const DOWNLOAD_DELIVERY = "vercel_blob";

export type FilmLabDownloadCompleteProps = {
  /** ロケール（analytics 用）。 */
  locale: string;
  /** DMG の直リンク。空のときは手動 DL ボタンを非表示。 */
  downloadUrl: string;
  /** 配布アーティファクト basename。空や不明時は `"unknown"`。 */
  artifactName: string;
  /** Stripe Payment Link のティア一覧。 */
  stripeTiers: FilmLabDonationStripeTier[];
  /** Buy Me a Coffee の URL。 */
  bmcUrl: string;
  /** サーバーで Cookie 検証済みの支援者フラグ。 */
  serverVerifiedSupporter: boolean;
};

/**
 * @description ダウンロード完了ページ本体。マウント時に DMG ダウンロードを自動トリガーする。
 */
export function FilmLabDownloadComplete({
  locale,
  downloadUrl,
  artifactName,
  stripeTiers,
  bmcUrl,
  serverVerifiedSupporter,
}: FilmLabDownloadCompleteProps) {
  const t = useTranslations("film-lab.desktopRelease.downloadComplete");
  const completeViewTracked = useRef(false);
  const autostartTracked = useRef(false);

  useEffect(() => {
    if (completeViewTracked.current) return;
    completeViewTracked.current = true;
    trackFilmLabDesktopDownloadEvent("film_lab_desktop_download_complete_view", {
      locale,
      artifactName,
      delivery: DOWNLOAD_DELIVERY,
      variant: DOWNLOAD_VARIANT,
      hasDownloadUrl: downloadUrl.length > 0,
    });
  }, [artifactName, downloadUrl, locale]);

  useEffect(() => {
    if (autostartTracked.current || downloadUrl.length === 0) return;
    autostartTracked.current = true;
    trackFilmLabDesktopDownloadEvent("film_lab_desktop_download_autostart", {
      locale,
      artifactName,
      delivery: DOWNLOAD_DELIVERY,
      variant: DOWNLOAD_VARIANT,
    });
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = downloadUrl;
    document.body.appendChild(iframe);
    return () => {
      iframe.remove();
    };
  }, [artifactName, downloadUrl, locale]);

  const isSupporter = serverVerifiedSupporter;
  const showDonation = !isSupporter && stripeTiers.length > 0;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-16 sm:px-6">
      <div className="w-full space-y-8">
        {/* Success message */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
            {t("eyebrow")}
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            {t("successMessage")}
          </p>
          {downloadUrl.length > 0 ? (
            <a
              href={downloadUrl}
              onClick={() => {
                trackFilmLabDesktopDownloadEvent("film_lab_desktop_download_manual_retry", {
                  locale,
                  artifactName,
                  delivery: DOWNLOAD_DELIVERY,
                  variant: DOWNLOAD_VARIANT,
                });
              }}
              className="mt-4 inline-flex items-center justify-center rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm text-white transition-colors hover:bg-white/14"
            >
              {t("manualDownloadCta")}
            </a>
          ) : null}
        </section>

        {/* Install steps */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-white">
            {t("installSteps.heading")}
          </h2>
          <ol className="mt-4 space-y-3 text-sm leading-relaxed text-white/80">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/14 bg-white/8 text-xs font-medium text-white">
                1
              </span>
              {t("installSteps.step1")}
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/14 bg-white/8 text-xs font-medium text-white">
                2
              </span>
              {t("installSteps.step2")}
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/14 bg-white/8 text-xs font-medium text-white">
                3
              </span>
              {t("installSteps.step3")}
            </li>
          </ol>

          {/* Gatekeeper note */}
          <div className="mt-6 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              {t("gatekeeperNote.heading")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              {t("gatekeeperNote.body")}
            </p>
          </div>
        </section>

        {/* Donation section */}
        {showDonation ? (
          <section
            className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8"
            aria-label={t("donation.heading")}
          >
            <h2 className="text-lg font-semibold text-white">
              {t("donation.heading")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              {t("donation.body")}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {stripeTiers.map((tier) => (
                <a
                  key={tier.amountUsd}
                  href={tier.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-white/14 bg-white/8 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/14"
                >
                  {t("donation.tierLabel", { amountUsd: String(tier.amountUsd) })}
                </a>
              ))}
              {bmcUrl.length > 0 ? (
                <a
                  href={bmcUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/8 hover:text-white"
                >
                  Buy Me a Coffee
                </a>
              ) : null}
            </div>
            <p className="mt-3 text-[10px] leading-snug text-white/40">
              {t("donation.legalNote")}
            </p>
          </section>
        ) : null}

        {/* Supporter acknowledgement */}
        {isSupporter ? (
          <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
            <p className="text-sm leading-relaxed text-white/80">
              {t("donation.supporterMessage")}
            </p>
          </section>
        ) : null}

        {/* Next steps */}
        <section className="flex flex-wrap items-center gap-3">
          <Link
            href="/filmtone"
            className="inline-flex items-center justify-center rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm text-white transition-colors hover:bg-white/14"
          >
            {t("nextSteps.backToFilmtone")}
          </Link>
          <a
            href={`mailto:${filmLabDesktopSupportEmail}`}
            className="text-sm text-white/70 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
          >
            {t("nextSteps.contactPrefix")} {filmLabDesktopSupportEmail}
          </a>
        </section>
      </div>
    </main>
  );
}
