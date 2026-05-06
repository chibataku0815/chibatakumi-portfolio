"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  filmLabDesktopDownloadRoute,
  filmLabDesktopMinimumMacos,
} from "../desktop-release-info";
import {
  filmLabIosAppStoreUrl,
  filmLabIosMinimumVersion,
} from "../ios-release-info";

const SURFACES = [
  ["surfaceWebTitle", "surfaceWebBody"],
  ["surfaceMacTitle", "surfaceMacBody"],
  ["surfaceIosTitle", "surfaceIosBody"],
] as const;

const CAPABILITIES = [
  ["capability1Title", "capability1Body"],
  ["capability2Title", "capability2Body"],
] as const;

const CARDS = [
  ["card1Title", "card1Body"],
  ["card2Title", "card2Body"],
  ["card3Title", "card3Body"],
  ["card4Title", "card4Body"],
] as const;

const WORKFLOW_BULLETS = ["workflowBullet1", "workflowBullet2", "workflowBullet3"] as const;

const FAQ_ENTRIES = [
  ["faqQformats", "faqAformats"],
  ["faqQpresets", "faqApresets"],
  ["faqQvideo", "faqAvideo"],
] as const;

/**
 * @description Filmtone の機能を 3 面 / 仕上がり / 4 ヶ条 / 写真展開 / FAQ / CTA で深掘りする補助ページ。
 *   LP は awareness 入口、ここは「もう一歩踏み込んで知りたい」読者のための補助面。
 *   `next-intl` の `film-lab.features` namespace を SSOT として参照。
 */
export function FilmtoneFeaturesContent() {
  const t = useTranslations("film-lab.features");
  const locale = useLocale();
  const appStoreBadgeSrc =
    locale === "ja"
      ? "/brand/download-on-the-app-store-ja.svg"
      : "/brand/download-on-the-app-store-en.svg";

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      {/* Hero */}
      <section aria-labelledby="filmtone-features-hero-title">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
          {t("heroEyebrow")}
        </p>
        <h1
          id="filmtone-features-hero-title"
          className="mt-3 max-w-3xl whitespace-pre-line text-3xl font-semibold text-white sm:text-4xl md:text-5xl"
        >
          {t("heroTitle")}
        </h1>
        <p className="film-lab-lp-body mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
          {t("heroLead")}
        </p>
        <div className="mt-6">
          <Link
            href="/filmtone"
            className="film-lab-lp-body inline-flex items-center gap-2 text-sm font-medium text-white/70 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
          >
            {t("heroBackToLpLabel")}
          </Link>
        </div>
      </section>

      {/* Surfaces */}
      <section
        className="mt-16 sm:mt-20"
        aria-labelledby="filmtone-features-surfaces-title"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
          {t("surfacesEyebrow")}
        </p>
        <h2
          id="filmtone-features-surfaces-title"
          className="mt-2 max-w-3xl text-2xl font-semibold text-white sm:text-3xl"
        >
          {t("surfacesTitle")}
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {SURFACES.map(([titleKey, bodyKey]) => (
            <div
              key={titleKey}
              className="film-lab-liquid-glass relative z-10 rounded-2xl p-5 sm:p-6"
            >
              <h3 className="text-lg font-semibold text-white sm:text-xl">
                {t(titleKey)}
              </h3>
              <p className="film-lab-lp-body mt-3 text-sm leading-relaxed text-white/65">
                {t(bodyKey)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section
        className="mt-16 sm:mt-20"
        aria-labelledby="filmtone-features-capabilities-title"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
          {t("capabilitiesEyebrow")}
        </p>
        <h2
          id="filmtone-features-capabilities-title"
          className="mt-2 max-w-3xl text-2xl font-semibold text-white sm:text-3xl"
        >
          {t("capabilitiesTitle")}
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {CAPABILITIES.map(([titleKey, bodyKey]) => (
            <div
              key={titleKey}
              className="film-lab-liquid-glass relative z-10 rounded-2xl p-5 sm:p-6 sm:p-7"
            >
              <h3 className="text-lg font-semibold text-white sm:text-xl">
                {t(titleKey)}
              </h3>
              <p className="film-lab-lp-body mt-3 text-sm leading-relaxed text-white/65">
                {t(bodyKey)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4 Cards */}
      <section
        className="mt-16 sm:mt-20"
        aria-labelledby="filmtone-features-cards-title"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
          {t("cardsEyebrow")}
        </p>
        <h2
          id="filmtone-features-cards-title"
          className="mt-2 max-w-3xl text-2xl font-semibold text-white sm:text-3xl"
        >
          {t("cardsTitle")}
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-6">
          {CARDS.map(([titleKey, bodyKey]) => (
            <div
              key={titleKey}
              className="film-lab-liquid-glass relative z-10 rounded-2xl p-5 sm:p-6"
            >
              <h3 className="text-lg font-semibold text-white sm:text-xl">
                {t(titleKey)}
              </h3>
              <p className="film-lab-lp-body mt-3 text-sm leading-relaxed text-white/65">
                {t(bodyKey)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section
        className="mt-16 sm:mt-20"
        aria-labelledby="filmtone-features-workflow-title"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
          {t("workflowEyebrow")}
        </p>
        <h2
          id="filmtone-features-workflow-title"
          className="mt-2 max-w-3xl text-2xl font-semibold text-white sm:text-3xl"
        >
          {t("workflowTitle")}
        </h2>
        <p className="film-lab-lp-body mt-4 max-w-3xl text-base leading-relaxed text-white/70">
          {t("workflowLead")}
        </p>
        <ul className="mt-6 max-w-3xl space-y-3 text-sm leading-relaxed text-white/70 sm:text-base">
          {WORKFLOW_BULLETS.map((key) => (
            <li key={key} className="flex items-start gap-3">
              <span
                aria-hidden
                className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-white/45"
              />
              <span className="film-lab-lp-body">{t(key)}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Extended FAQ */}
      <section
        className="mt-16 sm:mt-20"
        aria-labelledby="filmtone-features-faq-title"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
          {t("faqEyebrow")}
        </p>
        <h2
          id="filmtone-features-faq-title"
          className="mt-2 max-w-3xl text-2xl font-semibold text-white sm:text-3xl"
        >
          {t("faqTitle")}
        </h2>
        <dl className="film-lab-lp-body mt-8 space-y-6 text-sm leading-relaxed">
          {FAQ_ENTRIES.map(([qKey, aKey]) => (
            <div
              key={qKey}
              className="film-lab-liquid-glass relative z-10 rounded-2xl p-5 sm:p-6"
            >
              <dt className="font-medium text-white">{t(qKey)}</dt>
              <dd className="mt-2 text-white/65">{t(aKey)}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* CTA */}
      <section
        className="mt-16 sm:mt-20"
        aria-labelledby="filmtone-features-cta-title"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
          {t("ctaEyebrow")}
        </p>
        <h2
          id="filmtone-features-cta-title"
          className="mt-2 max-w-3xl text-2xl font-semibold text-white sm:text-3xl"
        >
          {t("ctaTitle")}
        </h2>
        <p className="film-lab-lp-body mt-4 max-w-2xl text-base leading-relaxed text-white/70">
          {t("ctaLead")}
        </p>

        <div className="relative z-10 mt-8 flex max-w-xl flex-col gap-5">
          {/* App Store zone — mobile order-1 / desktop order-3 */}
          <div className="order-1 flex flex-col items-start gap-2 sm:order-3">
            <a
              href={filmLabIosAppStoreUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-start transition-opacity hover:opacity-90"
              aria-label={t("ctaIosLabel")}
            >
              <Image
                src={appStoreBadgeSrc}
                alt={t("ctaIosLabel")}
                width={144}
                height={48}
                className="h-12"
                unoptimized
              />
            </a>
            <p className="text-xs text-white/45">
              {t("ctaIosSubLine", { minIos: filmLabIosMinimumVersion })}
            </p>
          </div>

          {/* Visual zone separator */}
          <div
            className="order-2 h-px w-full max-w-[200px] bg-white/10"
            aria-hidden
          />

          {/* macOS zone — mobile order-3 / desktop order-1 */}
          <div className="order-3 flex flex-col items-start gap-2 sm:order-1">
            <Link
              href={filmLabDesktopDownloadRoute}
              className="film-lab-liquid-glass-strong inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-95"
            >
              {t("ctaMacLabel")}
            </Link>
            <p className="text-xs text-white/45">
              {t("ctaMacSubLine", { minMacos: filmLabDesktopMinimumMacos })}
            </p>
          </div>

          {/* Subordinate Web demo link */}
          <Link
            href="/filmtone#film-lab-demo"
            className="order-4 mt-2 inline-flex w-fit items-center gap-2 text-sm font-medium text-white/70 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
          >
            {t("ctaWebDemoLabel")}
          </Link>
        </div>
      </section>

      {/* Footer nav */}
      <nav className="mt-16 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-8 sm:mt-20">
        <Link
          href="/filmtone"
          className="film-lab-lp-body text-xs text-[var(--text-base-60)] transition-colors hover:text-[var(--text-base)]"
        >
          {t("footerHomeLabel")}
        </Link>
        <Link
          href="/filmtone/roadmap"
          className="film-lab-lp-body text-xs text-[var(--text-base-60)] transition-colors hover:text-[var(--text-base)]"
        >
          {t("footerRoadmapLabel")}
        </Link>
        <Link
          href="/filmtone/release-notes"
          className="film-lab-lp-body text-xs text-[var(--text-base-60)] transition-colors hover:text-[var(--text-base)]"
        >
          {t("footerReleaseNotesLabel")}
        </Link>
      </nav>
    </main>
  );
}
