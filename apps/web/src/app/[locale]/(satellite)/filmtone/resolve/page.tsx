import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  filmtoneResolveBundlePath,
  filmtoneResolveCanonicalBaseUrl,
  filmtoneResolveLaunchDiscountUsd,
  filmtoneResolveLaunchPriceUsd,
  filmtoneResolveLaunchWindowDays,
  filmtoneResolveLicensePath,
  filmtoneResolveNormalPriceUsd,
  filmtoneResolveOfxIdentifier,
  filmtoneResolvePkgNamePattern,
  filmtoneResolveReadPkgDownloadUrl,
  filmtoneResolveReadPolarCheckoutUrl,
  filmtoneResolveReadTrialEndpoint,
  filmtoneResolveReadTurnstileSiteKey,
  filmtoneResolveSeatMachines,
  filmtoneResolveSeatUsers,
  filmtoneResolveSupportEmail,
  filmtoneResolveTrialDays,
  filmtoneResolveTurnstileAction,
  filmtoneResolveVerifiedMacos,
  filmtoneResolveVerifiedResolve,
} from "@/features/interactive/film-lab/resolve-plugin-info";
import { FilmtoneResolveTrialForm } from "./FilmtoneResolveTrialForm";

/**
 * @file `Filmtone for DaVinci Resolve` の公開プロダクトページ（`/filmtone/resolve`）。
 * @description 既存 Filmtone サーフェス（Desktop / iOS）とは別の買い切りプロダクト（OFX カラーグレーディング
 *   プラグイン）の LP。ホストは既存 `/filmtone` 起点（chibatakumi.studio）に載せ、Worker の PRODUCT_URL /
 *   Turnstile ALLOWED_ORIGIN をそのまま満たす。公開クレームは Film Damage のみ(v1 マーケティングスコープ)。
 * @limitations 価格・動作確認済み構成は `resolve-plugin-info.ts` の owner 承認済み値を参照する（ここで再導出しない）。
 *   購入 CTA / trial site key / 配布 pkg URL はデプロイ環境変数（未設定時は無効表示にフォールバック）。
 */

const OG_IMAGE_PATH = "/filmtone/og-image.jpg";

/** 未ライセンス時にプラグインが出力へ入れる watermark ラベル（product UI 文言） */
const WATERMARK_LABEL = "FILMTONE — TRIAL";
/** プラグインが表示するステータス行の例（product UI 文言・英語のまま提示） */
const STATUS_LINES = [
  "Licensed to <name>",
  "Trial — expires YYYY-MM-DD",
  "Trial mode (watermarked)",
] as const;

const filmDamageKeys = ["character", "families", "deterministic"] as const;
const installStepKeys = ["pkg", "restart", "locate", "license", "confirm"] as const;
const includedKeys = ["seats", "commercial", "updates", "major"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "filmtone-resolve.metadata" });
  const isJa = locale === "ja";
  const canonicalUrl = isJa
    ? `${filmtoneResolveCanonicalBaseUrl}/filmtone/resolve`
    : `${filmtoneResolveCanonicalBaseUrl}/en/filmtone/resolve`;

  return {
    title: t("title"),
    description: t("description"),
    icons: {
      icon: [{ url: "/brand/film-lab-symbol.svg", type: "image/svg+xml", sizes: "any" }],
      apple: [{ url: "/brand/film-lab-apple-touch.png", sizes: "180x180", type: "image/png" }],
    },
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: [{ url: OG_IMAGE_PATH, width: 1200, height: 630, alt: t("ogImageAlt") }],
      type: "website",
      locale: isJa ? "ja_JP" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: [OG_IMAGE_PATH],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ja: `${filmtoneResolveCanonicalBaseUrl}/filmtone/resolve`,
        en: `${filmtoneResolveCanonicalBaseUrl}/en/filmtone/resolve`,
      },
    },
  };
}

function FactCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</p>
      <div className="mt-1 text-sm leading-relaxed text-white/85">{children}</div>
    </div>
  );
}

export default async function FilmtoneResolvePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "filmtone-resolve.landing" });

  const siteKey = filmtoneResolveReadTurnstileSiteKey();
  const trialEndpoint = filmtoneResolveReadTrialEndpoint();
  const polarCheckoutUrl = filmtoneResolveReadPolarCheckoutUrl();
  const hasCheckoutUrl = polarCheckoutUrl.length > 0;
  const pkgDownloadUrl = filmtoneResolveReadPkgDownloadUrl();
  const hasPkgDownload = pkgDownloadUrl.length > 0;

  const priceValues = {
    normalPrice: filmtoneResolveNormalPriceUsd,
    launchPrice: filmtoneResolveLaunchPriceUsd,
    discount: filmtoneResolveLaunchDiscountUsd,
    days: filmtoneResolveLaunchWindowDays,
  };
  const seatValues = {
    users: filmtoneResolveSeatUsers,
    machines: filmtoneResolveSeatMachines,
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-16 sm:px-6">
      {/* Hero */}
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
        {t("hero.eyebrow")}
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">{t("hero.title")}</h1>
      <p className="mt-3 text-base font-medium text-white/80">{t("hero.tagline")}</p>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70">{t("hero.body")}</p>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        {hasCheckoutUrl ? (
          <a
            href={polarCheckoutUrl}
            className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90"
          >
            {t("hero.buyCta", { launchPrice: priceValues.launchPrice })}
          </a>
        ) : (
          <span
            aria-disabled="true"
            className="inline-flex cursor-not-allowed items-center justify-center rounded-full border border-white/12 bg-white/8 px-5 py-2.5 text-sm font-medium text-white/50"
          >
            {t("hero.buyComingSoon")}
          </span>
        )}
        <a
          href="#trial"
          className="inline-flex items-center justify-center rounded-full border border-white/14 bg-transparent px-5 py-2.5 text-sm text-white transition-colors hover:bg-white/8"
        >
          {t("hero.trialCta", { trialDays: filmtoneResolveTrialDays })}
        </a>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-white/45">{t("hero.watermarkFloor")}</p>

      {/* Fact cards */}
      <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <FactCard label={t("facts.priceLabel")}>
          {t("facts.priceValue", priceValues)}
        </FactCard>
        <FactCard label={t("facts.purchaseLabel")}>{t("facts.purchaseValue")}</FactCard>
        <FactCard label={t("facts.seatsLabel")}>{t("facts.seatsValue", seatValues)}</FactCard>
        <FactCard label={t("facts.verifiedLabel")}>
          {t("facts.verifiedValue", {
            macos: filmtoneResolveVerifiedMacos,
            resolve: filmtoneResolveVerifiedResolve,
          })}
        </FactCard>
      </div>

      {/* Film Damage */}
      <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
          {t("filmDamage.eyebrow")}
        </p>
        <h2 className="mt-3 text-xl font-semibold text-white sm:text-2xl">
          {t("filmDamage.title")}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/70">
          {t("filmDamage.body")}
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {filmDamageKeys.map((key) => (
            <div key={key} className="rounded-2xl border border-white/8 bg-black/20 p-5">
              <p className="text-sm font-medium text-white">
                {t(`filmDamage.items.${key}.title`)}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                {t(`filmDamage.items.${key}.body`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Positioning: one-time purchase vs subscription */}
      <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
          {t("positioning.eyebrow")}
        </p>
        <h2 className="mt-3 text-xl font-semibold text-white sm:text-2xl">
          {t("positioning.title")}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/70">
          {t("positioning.body")}
        </p>
      </section>

      {/* Trial: two tiers */}
      <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
          {t("trial.eyebrow")}
        </p>
        <h2 className="mt-3 text-xl font-semibold text-white sm:text-2xl">
          {t("trial.title", { trialDays: filmtoneResolveTrialDays })}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/70">
          {t("trial.body", { trialDays: filmtoneResolveTrialDays })}
        </p>

        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-black/20 p-5">
            <p className="text-sm font-medium text-white">{t("trial.permanent.title")}</p>
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              {t("trial.permanent.body", { watermark: WATERMARK_LABEL })}
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-black/20 p-5">
            <p className="text-sm font-medium text-white">{t("trial.clean.title")}</p>
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              {t("trial.clean.body", { trialDays: filmtoneResolveTrialDays })}
            </p>
          </div>
        </div>
      </section>

      {/* Pricing + Buy */}
      <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
          {t("pricing.eyebrow")}
        </p>
        <h2 className="mt-3 text-xl font-semibold text-white sm:text-2xl">{t("pricing.title")}</h2>

        <div className="mt-5 flex flex-wrap items-baseline gap-3">
          <span className="text-3xl font-semibold text-white">
            {t("pricing.launchAmount", { launchPrice: priceValues.launchPrice })}
          </span>
          <span className="text-base text-white/40 line-through">
            {t("pricing.normalAmount", { normalPrice: priceValues.normalPrice })}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-white/65">
          {t("pricing.launchNote", priceValues)}
        </p>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {includedKeys.map((key) => (
            <li
              key={key}
              className="flex gap-2 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm leading-relaxed text-white/70"
            >
              <span className="mt-[0.4rem] h-1.5 w-1.5 shrink-0 rounded-full bg-white/35" />
              <span>{t(`pricing.included.${key}`, { ...seatValues })}</span>
            </li>
          ))}
        </ul>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          {hasCheckoutUrl ? (
            <a
              href={polarCheckoutUrl}
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90"
            >
              {t("pricing.buyCta", { launchPrice: priceValues.launchPrice })}
            </a>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex cursor-not-allowed items-center justify-center rounded-full border border-white/12 bg-white/8 px-5 py-2.5 text-sm font-medium text-white/50"
            >
              {t("pricing.buyComingSoon")}
            </span>
          )}
          <Link
            href="/filmtone/resolve/refund"
            className="text-sm text-white/60 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
          >
            {t("pricing.refundLink")}
          </Link>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-white/60">{t("pricing.deliveryNote")}</p>
      </section>

      {/* Trial request form */}
      <section
        id="trial"
        className="mt-6 scroll-mt-24 rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8"
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
              {t("trialRequest.eyebrow")}
            </p>
            <h2 className="mt-3 text-xl font-semibold text-white sm:text-2xl">
              {t("trialRequest.title")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              {t("trialRequest.body", { trialDays: filmtoneResolveTrialDays })}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/55">
              {t("trialRequest.emailNote")}
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-black/20 p-5">
            <FilmtoneResolveTrialForm
              siteKey={siteKey}
              endpoint={trialEndpoint}
              action={filmtoneResolveTurnstileAction}
            />
          </div>
        </div>
      </section>

      {/* Compatibility */}
      <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
          {t("compat.eyebrow")}
        </p>
        <h2 className="mt-3 text-xl font-semibold text-white sm:text-2xl">{t("compat.title")}</h2>
        <p className="mt-4 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm font-medium text-white/85">
          {t("compat.verifiedLine", {
            macos: filmtoneResolveVerifiedMacos,
            resolve: filmtoneResolveVerifiedResolve,
          })}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/60">{t("compat.note")}</p>
      </section>

      {/* Install */}
      <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
          {t("install.eyebrow")}
        </p>
        <h2 className="mt-3 text-xl font-semibold text-white sm:text-2xl">{t("install.title")}</h2>

        {hasPkgDownload ? (
          <div className="mt-6">
            <a
              href={pkgDownloadUrl}
              download
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90"
            >
              {t("install.downloadCta")}
            </a>
          </div>
        ) : null}

        <ol className="mt-6 grid gap-3">
          {installStepKeys.map((key, index) => (
            <li key={key} className="flex gap-3 rounded-2xl border border-white/8 bg-black/20 p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/14 bg-white/8 text-xs font-semibold text-white/85">
                {index + 1}
              </span>
              <p className="text-sm leading-relaxed text-white/75">
                {t(`install.steps.${key}`, {
                  pkg: filmtoneResolvePkgNamePattern,
                  bundlePath: filmtoneResolveBundlePath,
                  licensePath: filmtoneResolveLicensePath,
                })}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-black/20 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
              {t("install.identifierLabel")}
            </p>
            <p className="mt-2 break-all font-mono text-xs text-white/75">
              {filmtoneResolveOfxIdentifier}
            </p>
            <p className="mt-1 break-all font-mono text-xs text-white/55">
              {filmtoneResolveBundlePath}
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-black/20 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
              {t("install.statusLabel")}
            </p>
            <ul className="mt-2 space-y-1">
              {STATUS_LINES.map((line) => (
                <li key={line} className="font-mono text-xs text-white/70">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-white/55">
          {/* TODO(owner): 詳細インストールガイド公開後にリンク先を差し替える。
              現時点では filmtone repo の apps/filmtone-resolve-ofx/docs/installation-guide.md は未作成。 */}
          {t("install.fullGuideNote")}
        </p>
      </section>

      {/* Footer links */}
      <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-white/10 pt-6">
        <Link
          href="/filmtone/resolve/eula"
          className="text-sm text-white/60 transition-colors hover:text-white"
        >
          {t("footer.eula")}
        </Link>
        <Link
          href="/filmtone/resolve/refund"
          className="text-sm text-white/60 transition-colors hover:text-white"
        >
          {t("footer.refund")}
        </Link>
        <Link
          href="/filmtone/resolve/trial-privacy"
          className="text-sm text-white/60 transition-colors hover:text-white"
        >
          {t("footer.trialPrivacy")}
        </Link>
        <a
          href={`mailto:${filmtoneResolveSupportEmail}`}
          className="text-sm text-white/60 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
        >
          {t("footer.support")}
        </a>
        <Link href="/filmtone" className="text-sm text-white/50 transition-colors hover:text-white">
          {t("footer.backToFilmtone")}
        </Link>
      </div>
    </main>
  );
}
