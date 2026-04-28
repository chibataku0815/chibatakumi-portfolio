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
  const t = await getTranslations({ locale, namespace: "about" });
  const isJa = locale === "ja";

  const canonicalUrl = isJa ? `${BASE_URL}/about` : `${BASE_URL}/en/about`;

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ja: `${BASE_URL}/about`,
        en: `${BASE_URL}/en/about`,
      },
    },
  };
}

// TODO(Wave 2 / future chat): port full Profile content (formerly /profile) here.
export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "about" });

  return (
    <main className="min-h-screen bg-[var(--bg-dark)] pt-32 pb-24">
      <section className="px-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-[clamp(2.5rem,8vw,5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--text-base)]">
            {t("title")}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-[var(--text-muted)]">
            {t("description")}
          </p>
        </div>
      </section>
    </main>
  );
}
