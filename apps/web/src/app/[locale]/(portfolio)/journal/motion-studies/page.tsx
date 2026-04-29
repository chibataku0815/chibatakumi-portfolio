import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { JournalIndexCard } from "@/features/journal/JournalIndexCard";
import { publishedMotionStudyEntries } from "@/shared/data/journal";
import { portfolioData } from "@/shared/data/portfolio";

const BASE_URL = portfolioData.site.siteUrl;
const PATH = "/journal/motion-studies";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "journal" });
  const isJa = locale === "ja";

  const canonicalUrl = isJa ? `${BASE_URL}${PATH}` : `${BASE_URL}/en${PATH}`;
  const title = t("motionStudies.indexTitle");
  const description = t("motionStudies.metaDescription");

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ja: `${BASE_URL}${PATH}`,
        en: `${BASE_URL}/en${PATH}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      locale: isJa ? "ja_JP" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function MotionStudiesHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "journal" });

  return (
    <main className="relative min-h-screen text-[var(--text-base)]">
      <article>
        <header
          data-readability="focus"
          className="px-6 pt-32 pb-16 sm:px-12 sm:pt-44 sm:pb-24 lg:px-20"
        >
          <div className="mx-auto max-w-6xl">
            <p className="font-sans font-medium text-[10px] uppercase tracking-[0.18em] text-[var(--text-base-60)]">
              {t("motionStudies.indexEyebrow")}
            </p>
            <h1
              className="mt-10 max-w-[24ch] text-[clamp(2.4rem,7vw,4.5rem)] font-medium leading-[1.05] tracking-[-0.03em] text-[var(--text-base)]"
              style={{ fontFamily: "var(--font-family-display)" }}
            >
              {t("motionStudies.indexTitle")}
            </h1>
            <p className="mt-10 max-w-[44ch] text-[1.15rem] leading-[1.7] text-[var(--text-muted)]">
              {t("motionStudies.indexSummary")}
            </p>
          </div>
        </header>

        <section
          data-readability="reading"
          className="px-6 pb-32 sm:px-12 lg:px-20"
        >
          <div className="mx-auto max-w-6xl">
            <ul>
              {publishedMotionStudyEntries.map((entry) => (
                <li key={entry.slug}>
                  <JournalIndexCard
                    href={entry.href}
                    eyebrow={t(
                      `motionStudies.entries.${entry.slug}.eyebrow`,
                    )}
                    title={t(`motionStudies.entries.${entry.slug}.title`)}
                    summary={t(
                      `motionStudies.entries.${entry.slug}.summary`,
                    )}
                    tags={entry.tags}
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      </article>
    </main>
  );
}
