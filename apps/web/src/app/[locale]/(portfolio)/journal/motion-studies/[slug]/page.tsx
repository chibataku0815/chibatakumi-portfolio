import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { coerceJournalBlocks } from "@/features/journal/article-blocks";
import { JournalArticleBody } from "@/features/journal/JournalArticleBody";
import { JournalArticleHeader } from "@/features/journal/JournalArticleHeader";
import {
  getMotionStudyBySlug,
  motionStudyEntries,
} from "@/shared/data/journal";
import { portfolioData } from "@/shared/data/portfolio";

const BASE_URL = portfolioData.site.siteUrl;

export async function generateStaticParams() {
  return motionStudyEntries.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const entry = getMotionStudyBySlug(slug);
  if (!entry) return {};

  const t = await getTranslations({ locale, namespace: "journal" });
  const isJa = locale === "ja";

  const path = `/journal/motion-studies/${slug}`;
  const canonicalUrl = isJa ? `${BASE_URL}${path}` : `${BASE_URL}/en${path}`;

  const title = t(`motionStudies.entries.${slug}.title`);
  const description = t(`motionStudies.entries.${slug}.metaDescription`);

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

export default async function MotionStudyPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const entry = getMotionStudyBySlug(slug);
  if (!entry) notFound();

  const t = await getTranslations({ locale, namespace: "journal" });

  const blocks = coerceJournalBlocks(
    t.raw(`articles.motion-studies.${slug}.sections`),
  );

  return (
    <main className="relative min-h-screen text-[var(--text-base)]">
      <article>
        <JournalArticleHeader
          eyebrow={t(`motionStudies.entries.${slug}.eyebrow`)}
          title={t(`motionStudies.entries.${slug}.title`)}
          summary={t(`motionStudies.entries.${slug}.summary`)}
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
