import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { portfolioData } from "@/shared/data/portfolio";

const BASE_URL = portfolioData.site.siteUrl;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "journal" });
  const isJa = locale === "ja";
  const canonicalUrl = isJa ? `${BASE_URL}/journal` : `${BASE_URL}/en/journal`;

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ja: `${BASE_URL}/journal`,
        en: `${BASE_URL}/en/journal`,
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: canonicalUrl,
      type: "website",
      locale: isJa ? "ja_JP" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  };
}

export default async function JournalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "journal" });

  return (
    <main className="min-h-screen bg-[var(--bg-dark)] pt-32 pb-24 text-[var(--text-base)]">
      <article>
        <header className="px-6 pb-20">
          <div className="mx-auto max-w-4xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-base-60)]">
              {t("eyebrow")}
            </p>
            <h1 className="mt-12 text-[clamp(3.5rem,11vw,7rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
              {t("title")}
            </h1>
            <p className="mt-12 max-w-[44ch] text-[1.25rem] leading-[1.7] text-[var(--text-muted)]">
              {t("description")}
            </p>
          </div>
        </header>

        <section className="px-6">
          <div className="mx-auto max-w-4xl">
            <p className="max-w-[42rem] text-[1rem] leading-[1.85] text-[var(--text-base-80)]">
              {t("intro")}
            </p>
          </div>
        </section>
      </article>
    </main>
  );
}
