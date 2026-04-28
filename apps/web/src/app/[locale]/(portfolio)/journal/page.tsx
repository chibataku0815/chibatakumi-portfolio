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
    <main className="relative min-h-screen text-[var(--text-base)]">
      <article>
        {/* HERO: editorial cover, motion-dot focus dim */}
        <header
          data-readability="focus"
          className="px-6 pt-32 pb-20 sm:px-12 sm:pt-44 sm:pb-32 lg:px-20"
        >
          <div className="mx-auto max-w-6xl">
            <p className="font-sans font-medium text-[10px] uppercase tracking-[0.18em] text-[var(--text-base-60)]">
              {t("eyebrow")}
            </p>
            <h1
              className="mt-12 text-[clamp(3.5rem,11vw,7rem)] font-medium leading-[0.95] tracking-[-0.04em] text-[var(--text-base)]"
              style={{ fontFamily: "var(--font-family-display)" }}
            >
              {t("title")}
            </h1>
            <p className="mt-12 max-w-[44ch] text-[1.25rem] leading-[1.7] text-[var(--text-muted)]">
              {t("description")}
            </p>
          </div>
        </header>

        {/* BODY: editorial spread (1fr + sidebar), reading dim */}
        <section
          data-readability="reading"
          className="px-6 pb-32 sm:px-12 lg:px-20"
        >
          <div className="mx-auto grid max-w-6xl gap-y-16 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-x-20">
            {/* LEFT: intro */}
            <div>
              <p className="max-w-[42rem] text-[1rem] leading-[1.85] text-[var(--text-base-80)]">
                {t("intro")}
              </p>
            </div>

            {/* RIGHT: masthead meta */}
            <aside className="space-y-12 lg:sticky lg:top-32 lg:self-start">
              <div>
                <p className="font-sans font-medium text-[10px] uppercase tracking-[0.18em] text-[var(--text-base-50)]">
                  Edition
                </p>
                <dl className="mt-4 space-y-2 font-sans font-medium tabular-nums text-[10px] tracking-[0.10em] text-[var(--text-base-70)]">
                  <div className="flex justify-between gap-4">
                    <dt>Vol</dt>
                    <dd className="text-[var(--text-base)]">01</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Updated</dt>
                    <dd className="text-[var(--text-base)]">2026.04</dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        </section>
      </article>
    </main>
  );
}
