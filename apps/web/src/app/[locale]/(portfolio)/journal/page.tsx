import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { portfolioData } from "@/shared/data/portfolio";

const BASE_URL = portfolioData.site.siteUrl;

type MotionStudyEntry = {
  key:
    | "stagedEmphasisPayoff"
    | "temporalEchoResidue"
    | "signalStrokeRelay"
    | "boilingPosterAperture";
  slug:
    | "staged-emphasis-payoff"
    | "temporal-echo-residue"
    | "signal-stroke-relay"
    | "boiling-poster-aperture";
};

const motionStudies: readonly MotionStudyEntry[] = [
  { key: "stagedEmphasisPayoff",  slug: "staged-emphasis-payoff" },
  { key: "temporalEchoResidue",   slug: "temporal-echo-residue" },
  { key: "signalStrokeRelay",     slug: "signal-stroke-relay" },
  { key: "boilingPosterAperture", slug: "boiling-poster-aperture" },
] as const;

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
            {/* LEFT: intro + Motion Studies */}
            <div>
              <p className="max-w-[42rem] text-[1rem] leading-[1.85] text-[var(--text-base-80)]">
                {t("intro")}
              </p>

              <hr
                className="my-20 h-px border-0"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(0,0,0,0.22), transparent)",
                }}
              />

              <header className="mb-16">
                <p className="font-sans font-medium text-[10px] uppercase tracking-[0.18em] text-[var(--text-base-60)]">
                  {t("motionStudies.eyebrow")}
                </p>
                <h2
                  className="mt-3 text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.025em] text-[var(--text-base)]"
                  style={{ fontFamily: "var(--font-family-display)" }}
                >
                  {t("motionStudies.title")}
                </h2>
                <p className="mt-4 max-w-[40rem] text-[0.95rem] leading-[1.7] text-[var(--text-base-70)]">
                  {t("motionStudies.intro")}
                </p>
              </header>

              <ol className="space-y-14">
                {motionStudies.map((entry, i) => (
                  <li key={entry.slug} id={entry.slug}>
                    <Link
                      href={`/journal/motion-studies/${entry.slug}`}
                      data-transition="true"
                      aria-label={`${t(`motionStudies.entries.${entry.key}.title`)} — ${t("motionStudies.openLabel")}`}
                      className="group block"
                    >
                      <div className="flex items-baseline gap-5">
                        <span className="font-sans font-medium text-[10px] uppercase tabular-nums tracking-[0.16em] text-[var(--text-base-40)]">
                          {`No. ${String(i + 1).padStart(2, "0")}`}
                        </span>
                        <span className="font-sans font-medium text-[10px] uppercase tracking-[0.14em] text-[var(--text-base-50)]">
                          {entry.slug}
                        </span>
                      </div>
                      <h3
                        className="mt-4 text-[clamp(1.5rem,3.4vw,2.25rem)] font-medium leading-[1.1] tracking-[-0.02em] text-[var(--text-base)] transition-colors duration-300 group-hover:text-black"
                        style={{ fontFamily: "var(--font-family-display)" }}
                      >
                        {t(`motionStudies.entries.${entry.key}.title`)}
                      </h3>
                      <p className="mt-2 font-sans font-medium text-[10px] uppercase tracking-[0.14em] text-[var(--text-base-60)]">
                        {t(`motionStudies.entries.${entry.key}.context`)}
                      </p>
                      <p className="mt-5 max-w-[44rem] text-[0.95rem] leading-[1.75] text-[var(--text-base-80)]">
                        {t(`motionStudies.entries.${entry.key}.summary`)}
                      </p>
                      <span className="mt-6 inline-flex items-center gap-2 font-sans font-medium text-[10px] uppercase tracking-[0.14em] text-[var(--text-base-60)] transition-all duration-300 group-hover:gap-3 group-hover:text-[var(--text-base)]">
                        <span aria-hidden>→</span>
                        <span>{t("motionStudies.openLabel")}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>

            {/* RIGHT: ToC + masthead meta */}
            <aside className="space-y-12 lg:sticky lg:top-32 lg:self-start">
              <div>
                <p className="font-sans font-medium text-[10px] uppercase tracking-[0.18em] text-[var(--text-base-50)]">
                  Contents
                </p>
                <ol className="mt-4 space-y-2.5">
                  {motionStudies.map((entry, i) => (
                    <li key={entry.slug}>
                      <a
                        href={`#${entry.slug}`}
                        className="block font-sans font-medium text-[11px] uppercase tracking-[0.12em] text-[var(--text-base-70)] transition-colors duration-200 hover:text-[var(--text-base)]"
                      >
                        <span className="tabular-nums text-[var(--text-base-40)]">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="ml-3">
                          {t(`motionStudies.entries.${entry.key}.title`)}
                        </span>
                      </a>
                    </li>
                  ))}
                </ol>
              </div>

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
                  <div className="flex justify-between gap-4">
                    <dt>Studies</dt>
                    <dd className="text-[var(--text-base)]">
                      {motionStudies.length}
                    </dd>
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
