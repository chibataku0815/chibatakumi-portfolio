import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { portfolioData } from "@/shared/data/portfolio";

const BASE_URL = portfolioData.site.siteUrl;

type MotionStudyEntry = {
  key:
    | "signalStrokeRelay"
    | "anchoredProgressResolve"
    | "boilingPosterAperture"
    | "motifLoopBackground"
    | "stagedEmphasisPayoff"
    | "temporalEchoResidue";
  slug:
    | "signal-stroke-relay"
    | "anchored-progress-resolve"
    | "boiling-poster-aperture"
    | "motif-loop-background"
    | "staged-emphasis-payoff"
    | "temporal-echo-residue";
  accent: string;
};

const motionStudies: readonly MotionStudyEntry[] = [
  { key: "signalStrokeRelay", slug: "signal-stroke-relay", accent: "#f0b25a" },
  {
    key: "anchoredProgressResolve",
    slug: "anchored-progress-resolve",
    accent: "#3a8acd",
  },
  {
    key: "boilingPosterAperture",
    slug: "boiling-poster-aperture",
    accent: "#b85cba",
  },
  {
    key: "motifLoopBackground",
    slug: "motif-loop-background",
    accent: "#5cb88a",
  },
  {
    key: "stagedEmphasisPayoff",
    slug: "staged-emphasis-payoff",
    accent: "#d96b6b",
  },
  {
    key: "temporalEchoResidue",
    slug: "temporal-echo-residue",
    accent: "#7a7af0",
  },
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
    <main className="relative min-h-screen bg-[var(--bg-dark)] text-[var(--text-base)]">
      <section className="relative px-6 pt-32 pb-12 sm:pt-36 sm:pb-16">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--text-base-60)]">
            {t("eyebrow")}
          </p>
          <h1 className="mt-6 text-[clamp(2.75rem,8vw,5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--text-base)]">
            {t("title")}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--text-muted)]">
            {t("description")}
          </p>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--text-base-70)]">
            {t("intro")}
          </p>
        </div>
      </section>

      <section className="px-6 pb-32">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--text-base-60)]">
              {t("motionStudies.eyebrow")}
            </p>
            <h2 className="text-[clamp(1.75rem,4.5vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--text-base)]">
              {t("motionStudies.title")}
            </h2>
            <p className="mt-2 max-w-3xl text-base leading-relaxed text-[var(--text-base-70)]">
              {t("motionStudies.intro")}
            </p>
          </div>

          <ul className="mt-10 flex flex-col gap-6">
            {motionStudies.map((entry, index) => (
              <li key={entry.slug}>
                <Link
                  href={`/journal/motion-studies/${entry.slug}`}
                  data-transition="true"
                  aria-label={`${t(`motionStudies.entries.${entry.key}.title`)} — ${t("motionStudies.openLabel")}`}
                  className="group relative isolate flex flex-col overflow-hidden rounded-[var(--radius-panel,1.5rem)] border border-[var(--stroke-subtle)] bg-[var(--surface-1)] p-8 transition-all duration-300 hover:border-[var(--stroke-strong)] hover:bg-[var(--surface-2)] sm:p-10"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-px"
                    style={{
                      background: `linear-gradient(90deg, transparent 0%, ${entry.accent} 50%, transparent 100%)`,
                      opacity: 0.55,
                    }}
                  />

                  <div className="flex items-start justify-between gap-6">
                    <div className="flex items-baseline gap-4">
                      <span
                        className="font-mono text-[11px] uppercase tracking-[0.32em]"
                        style={{ color: entry.accent }}
                      >
                        {`0${index + 1}`}
                      </span>
                      <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-base-60)]">
                        {`/journal/motion-studies/${entry.slug}`}
                      </span>
                    </div>
                  </div>

                  <h3 className="mt-6 text-[clamp(1.5rem,3.5vw,2rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--text-base)]">
                    {t(`motionStudies.entries.${entry.key}.title`)}
                  </h3>
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text-base-70)]">
                    {t(`motionStudies.entries.${entry.key}.context`)}
                  </p>
                  <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-[var(--text-base-80)]">
                    {t(`motionStudies.entries.${entry.key}.summary`)}
                  </p>

                  <div className="mt-8 flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.24em] text-[var(--text-base-70)] transition-colors duration-200 group-hover:text-[var(--text-base)]">
                    <span>{t("motionStudies.openLabel")}</span>
                    <span
                      aria-hidden="true"
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
