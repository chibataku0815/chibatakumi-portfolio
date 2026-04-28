import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  filmLabCanonicalBaseUrl,
  filmLabIosOperatorName,
  filmLabIosSupportEmail,
} from "@/features/interactive/film-lab/ios-release-info";

const localFirstKeys = ["editing", "storage", "server"] as const;
const permissionCardKeys = ["photoImport", "photoSave", "files"] as const;
const trackingKeys = ["noAccount", "noAnalytics", "noTracking", "noCollection"] as const;

function LegalCard({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</p>
      <div className="mt-1 text-sm leading-relaxed text-white/85">{children}</div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "film-lab.privacyPage.metadata" });
  const isJa = locale === "ja";
  const canonicalUrl = isJa
    ? `${filmLabCanonicalBaseUrl}/filmtone/privacy`
    : `${filmLabCanonicalBaseUrl}/en/filmtone/privacy`;

  return {
    title: t("title"),
    description: t("description"),
    icons: {
      icon: [{ url: "/brand/film-lab-symbol.svg", type: "image/svg+xml", sizes: "any" }],
      apple: [{ url: "/brand/film-lab-apple-touch.png", sizes: "180x180", type: "image/png" }],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ja: `${filmLabCanonicalBaseUrl}/filmtone/privacy`,
        en: `${filmLabCanonicalBaseUrl}/en/filmtone/privacy`,
      },
    },
  };
}

export default async function FilmtonePrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "film-lab.privacyPage" });

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-16 sm:px-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
        {t("eyebrow")}
      </p>
      <h1 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">{t("heroTitle")}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/70">{t("heroBody")}</p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <LegalCard label={t("facts.localFirstLabel")}>{t("facts.localFirstValue")}</LegalCard>
        <LegalCard label={t("facts.noAccountLabel")}>{t("facts.noAccountValue")}</LegalCard>
        <LegalCard label={t("facts.noAnalyticsLabel")}>{t("facts.noAnalyticsValue")}</LegalCard>
        <LegalCard label={t("facts.noCollectionLabel")}>{t("facts.noCollectionValue")}</LegalCard>
      </div>

      <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
          {t("localFirst.eyebrow")}
        </p>
        <h2 className="mt-3 text-xl font-semibold text-white sm:text-2xl">
          {t("localFirst.title")}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/70">
          {t("localFirst.body")}
        </p>

        <ul className="mt-6 grid gap-3 md:grid-cols-3">
          {localFirstKeys.map((key) => (
            <li
              key={key}
              className="rounded-2xl border border-white/8 bg-black/20 p-5 text-sm leading-relaxed text-white/70"
            >
              <p className="font-medium text-white">{t(`localFirst.items.${key}.title`)}</p>
              <p className="mt-2">{t(`localFirst.items.${key}.body`)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
          {t("permissions.eyebrow")}
        </p>
        <h2 className="mt-3 text-xl font-semibold text-white sm:text-2xl">
          {t("permissions.title")}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/70">
          {t("permissions.body")}
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {permissionCardKeys.map((key) => (
            <div
              key={key}
              className="rounded-2xl border border-white/8 bg-black/20 p-5"
            >
              <p className="text-sm font-medium text-white">{t(`permissions.cards.${key}.title`)}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                {t(`permissions.cards.${key}.body`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
          {t("tracking.eyebrow")}
        </p>
        <h2 className="mt-3 text-xl font-semibold text-white sm:text-2xl">
          {t("tracking.title")}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/70">
          {t("tracking.body")}
        </p>

        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {trackingKeys.map((key) => (
            <li
              key={key}
              className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4 text-sm leading-relaxed text-white/70"
            >
              {t(`tracking.items.${key}`)}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
          {t("contact.eyebrow")}
        </p>
        <h2 className="mt-3 text-xl font-semibold text-white sm:text-2xl">{t("contact.title")}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/70">
          {t("contact.body", { operatorName: filmLabIosOperatorName })}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            {t("contact.emailLabel")}
          </span>
          <a
            href={`mailto:${filmLabIosSupportEmail}`}
            className="text-sm font-medium text-white underline decoration-white/20 underline-offset-4 transition-colors hover:text-white/80"
          >
            {filmLabIosSupportEmail}
          </a>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-white/10 pt-6">
        <Link
          href="/filmtone/support"
          className="inline-flex items-center justify-center rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm text-white transition-colors hover:bg-white/14"
        >
          {t("footer.supportCta")}
        </Link>
        <Link
          href="/filmtone"
          className="text-sm text-white/60 transition-colors hover:text-white"
        >
          {t("footer.backToFilmLab")}
        </Link>
      </div>
    </main>
  );
}
