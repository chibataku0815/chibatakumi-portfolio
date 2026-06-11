import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Fragment, type ReactNode } from "react";
import { JournalIndexCard } from "@/features/journal/JournalIndexCard";
import { JournalIndexGroup } from "@/features/journal/JournalIndexGroup";
import {
  type JournalEntry,
  publishedJournalEntries,
  publishedMotionStudyEntries,
} from "@/shared/data/journal";
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

  const flagship = publishedJournalEntries.find(
    (entry) => entry.kind === "case-study",
  );
  const engineering = publishedJournalEntries.filter(
    (entry) => entry.kind === "engineering-note",
  );
  const studies = publishedJournalEntries.filter(
    (entry) => entry.kind === "study",
  );

  const newestOf = (entries: readonly JournalEntry[]): string =>
    entries.reduce(
      (max, entry) => (entry.publishedAt > max ? entry.publishedAt : max),
      "",
    );

  // Index groups render in descending date order (each group's newest entry),
  // so the page leads with the latest articles: the motion-study garden keeps
  // growing and must not sit below the static April case studies. Ties keep
  // this editorial order (Array.prototype.sort is stable).
  const groups: { key: string; newest: string; node: ReactNode }[] = [];

  if (flagship) {
    groups.push({
      key: "flagship",
      newest: flagship.publishedAt,
      node: (
        <JournalIndexGroup label={t("indexLabels.flagship")} count={1}>
          <JournalIndexCard
            href={flagship.href}
            eyebrow={t(`entries.${flagship.slug}.eyebrow`)}
            title={t(`entries.${flagship.slug}.title`)}
            summary={t(`entries.${flagship.slug}.summary`)}
            tags={flagship.tags}
            variant="flagship"
          />
        </JournalIndexGroup>
      ),
    });
  }

  if (engineering.length) {
    groups.push({
      key: "engineering",
      newest: newestOf(engineering),
      node: (
        <JournalIndexGroup
          label={t("indexLabels.engineeringNotes")}
          count={engineering.length}
        >
          <ul>
            {engineering.map((entry) => (
              <li key={entry.slug}>
                <JournalIndexCard
                  href={entry.href}
                  eyebrow={t(`entries.${entry.slug}.eyebrow`)}
                  title={t(`entries.${entry.slug}.title`)}
                  summary={t(`entries.${entry.slug}.summary`)}
                  tags={entry.tags}
                />
              </li>
            ))}
          </ul>
        </JournalIndexGroup>
      ),
    });
  }

  if (studies.length) {
    groups.push({
      key: "studies",
      newest: newestOf(studies),
      node: (
        <JournalIndexGroup
          label={t("indexLabels.studies")}
          count={studies.length}
        >
          <ul>
            {studies.map((entry) => (
              <li key={entry.slug}>
                <JournalIndexCard
                  href={entry.href}
                  eyebrow={t(`entries.${entry.slug}.eyebrow`)}
                  title={t(`entries.${entry.slug}.title`)}
                  summary={t(`entries.${entry.slug}.summary`)}
                  tags={entry.tags}
                />
              </li>
            ))}
          </ul>
        </JournalIndexGroup>
      ),
    });
  }

  if (publishedMotionStudyEntries.length) {
    groups.push({
      key: "motion-studies",
      newest: newestOf(publishedMotionStudyEntries),
      node: (
        <JournalIndexGroup
          label={t("indexLabels.motionStudies")}
          count={publishedMotionStudyEntries.length}
          link={{
            href: "/journal/motion-studies",
            label: t("indexLabels.viewAll"),
          }}
        >
          <ul>
            {publishedMotionStudyEntries.map((entry) => (
              <li key={entry.slug}>
                <JournalIndexCard
                  href={entry.href}
                  eyebrow={t(
                    `motionStudies.entries.${entry.slug}.eyebrow`,
                  )}
                  title={t(
                    `motionStudies.entries.${entry.slug}.title`,
                  )}
                  summary={t(
                    `motionStudies.entries.${entry.slug}.summary`,
                  )}
                  tags={entry.tags}
                />
              </li>
            ))}
          </ul>
        </JournalIndexGroup>
      ),
    });
  }

  groups.sort((a, b) => b.newest.localeCompare(a.newest));

  const updatedAt = newestOf([
    ...publishedJournalEntries,
    ...publishedMotionStudyEntries,
  ]);
  const updatedLabel = `${updatedAt.slice(0, 4)}.${updatedAt.slice(5, 7)}`;

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

        {/* INTRO + INDEX: editorial spread (1fr + sidebar), reading dim */}
        <section
          data-readability="reading"
          className="px-6 pb-32 sm:px-12 lg:px-20"
        >
          <div className="mx-auto grid max-w-6xl gap-y-16 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-x-20">
            {/* LEFT: intro + entry groups */}
            <div>
              <p className="max-w-[42rem] text-[1rem] leading-[1.85] text-[var(--text-base-80)]">
                {t("intro")}
              </p>

              {groups.map((group) => (
                <Fragment key={group.key}>{group.node}</Fragment>
              ))}
            </div>

            {/* RIGHT: masthead meta (sticky on lg+) */}
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
                    <dd className="text-[var(--text-base)]">{updatedLabel}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Entries</dt>
                    <dd className="text-[var(--text-base)] tabular-nums">
                      {String(
                        publishedJournalEntries.length +
                          publishedMotionStudyEntries.length,
                      ).padStart(2, "0")}
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
