import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { portfolioData } from "@/shared/data/portfolio";

const BASE_URL = portfolioData.site.siteUrl;

type WorkState = "active" | "preview";

type ExperimentWork = {
  slug: "dot" | "grid" | "flow";
  href: "/experiments/dot" | "/experiments/grid" | "/experiments/flow";
  state: WorkState;
  accent: string;
};

/**
 * Renewal 2026 reset (parent plan §5.2, §7.3) — `/experiments` is the works
 * collection for the motion artwork surface. The index lists each motion work
 * with title, short concept, visual state, and an entry link.
 *
 * `state: "preview"` on grid/flow is a curatorial label kept after Package 4
 * landed real visuals on both routes — the destination clients now mount
 * `mountMotionGridApp` / `mountMotionFlowApp`, but they remain ambient-only
 * and side-by-side parity with the original art is deferred. Promote the
 * label to `active` when the curatorial owner accepts the parity.
 */
const works: readonly ExperimentWork[] = [
  {
    slug: "dot",
    href: "/experiments/dot",
    state: "active",
    accent: "#f0b25a",
  },
  {
    slug: "grid",
    href: "/experiments/grid",
    state: "preview",
    accent: "#3a8acd",
  },
  {
    slug: "flow",
    href: "/experiments/flow",
    state: "preview",
    accent: "#b85cba",
  },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "experiments" });
  const isJa = locale === "ja";

  const canonicalUrl = isJa
    ? `${BASE_URL}/experiments`
    : `${BASE_URL}/en/experiments`;

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ja: `${BASE_URL}/experiments`,
        en: `${BASE_URL}/en/experiments`,
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

export default async function ExperimentsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "experiments" });

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
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          {works.map((work, index) => (
            <Link
              key={work.slug}
              href={work.href}
              data-transition="true"
              aria-label={`${t(`works.${work.slug}.title`)} — ${t("openLabel")}`}
              className="group relative isolate flex flex-col overflow-hidden rounded-[var(--radius-panel,1.5rem)] border border-[var(--stroke-subtle)] bg-[var(--surface-1)] p-8 transition-all duration-300 hover:border-[var(--stroke-strong)] hover:bg-[var(--surface-2)] sm:p-10"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, ${work.accent} 50%, transparent 100%)`,
                  opacity: 0.55,
                }}
              />

              <div className="flex items-start justify-between gap-6">
                <div className="flex items-baseline gap-4">
                  <span
                    className="font-mono text-[11px] uppercase tracking-[0.32em]"
                    style={{ color: work.accent }}
                  >
                    {`0${index + 1}`}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-base-60)]">
                    {`/experiments/${work.slug}`}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] ${
                    work.state === "active"
                      ? "border-[var(--stroke-strong)] bg-[var(--surface-2)] text-[var(--text-base)]"
                      : "border-[var(--stroke-subtle)] bg-[var(--surface-3)] text-[var(--text-base-70)]"
                  }`}
                >
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: work.accent }}
                  />
                  {t(`stateLabel.${work.state}`)}
                </span>
              </div>

              <h2 className="mt-6 text-[clamp(1.75rem,4.5vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--text-base)]">
                {t(`works.${work.slug}.title`)}
              </h2>
              <p className="mt-4 max-w-3xl text-[17px] leading-relaxed text-[var(--text-base-80)]">
                {t(`works.${work.slug}.concept`)}
              </p>

              <div className="mt-8 flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.24em] text-[var(--text-base-70)] transition-colors duration-200 group-hover:text-[var(--text-base)]">
                <span>{t("openLabel")}</span>
                <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
