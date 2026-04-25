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
  const t = await getTranslations({ locale, namespace: "works.photography" });
  const isJa = locale === "ja";

  const canonicalUrl = isJa
    ? `${BASE_URL}/works/photography`
    : `${BASE_URL}/en/works/photography`;

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ja: `${BASE_URL}/works/photography`,
        en: `${BASE_URL}/en/works/photography`,
      },
    },
  };
}

export default async function WorksPhotographyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "works.photography" });

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
