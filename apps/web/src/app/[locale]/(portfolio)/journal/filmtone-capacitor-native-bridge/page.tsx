import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { coerceJournalBlocks } from "@/features/journal/article-blocks";
import { JournalArticleBody } from "@/features/journal/JournalArticleBody";
import { JournalArticleHeader } from "@/features/journal/JournalArticleHeader";
import { getJournalEntryBySlug } from "@/shared/data/journal";
import { portfolioData } from "@/shared/data/portfolio";

const SLUG = "filmtone-capacitor-native-bridge";
const BASE_URL = portfolioData.site.siteUrl;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "journal" });
  const isJa = locale === "ja";

  const path = `/journal/${SLUG}`;
  const canonicalUrl = isJa ? `${BASE_URL}${path}` : `${BASE_URL}/en${path}`;

  const title = t(`entries.${SLUG}.title`);
  const description = t(`entries.${SLUG}.metaDescription`);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ja: `${BASE_URL}${path}`,
        en: `${BASE_URL}/en${path}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "article",
      locale: isJa ? "ja_JP" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function FilmtoneCapacitorNativeBridgePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "journal" });

  const entry = getJournalEntryBySlug(SLUG);
  if (!entry || entry.status !== "published") notFound();

  const blocks = coerceJournalBlocks(t.raw(`articles.${SLUG}.sections`));

  return (
    <main className="relative min-h-screen text-[var(--text-base)]">
      <article>
        <JournalArticleHeader
          eyebrow={t(`entries.${SLUG}.eyebrow`)}
          title={t(`entries.${SLUG}.title`)}
          summary={t(`entries.${SLUG}.summary`)}
          publishedAt={entry.publishedAt}
          locale={locale}
          tags={entry.tags}
        />
        <section
          data-readability="reading"
          className="px-6 pb-32 sm:px-12 lg:px-20"
        >
          <JournalArticleBody blocks={blocks} />
        </section>
      </article>
    </main>
  );
}
