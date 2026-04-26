import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { portfolioData } from "@/shared/data/portfolio";
import { ExperimentsSceneCycle } from "./scene-cycle";

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
    <main className="relative min-h-screen w-full">
      <ExperimentsSceneCycle />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(12,12,14,0.88) 0%, rgba(12,12,14,0.45) 45%, rgba(12,12,14,0.12) 70%, transparent 100%)",
        }}
      />

      <section className="relative px-6 pt-32 pb-12 sm:pt-40 sm:pb-16">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--text-base-60)]">
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 text-[clamp(2.4rem,7vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--text-base)]">
            {t("title")}
          </h1>
        </div>
      </section>

      <section className="relative px-6 pb-32 sm:pb-40">
        <div className="mx-auto max-w-5xl">
          <div
            className="mb-6 h-px w-full"
            style={{
              background:
                "var(--hairline-gradient, linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent))",
            }}
          />
          <div className="flex flex-col divide-y divide-white/[0.07]">
            {works.map((work, index) => (
              <Link
                key={work.slug}
                href={work.href}
                data-transition="true"
                aria-label={`${t(`works.${work.slug}.title`)} — ${t("openLabel")}`}
                className="group flex items-center justify-between gap-6 py-5 transition-opacity duration-200 hover:opacity-100 sm:py-6"
                style={{ opacity: work.state === "active" ? 1 : 0.72 }}
              >
                <div className="flex min-w-0 items-center gap-5">
                  <span
                    className="shrink-0 font-mono text-[11px] tabular-nums"
                    style={{ color: work.accent }}
                  >
                    {`0${index + 1}`}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[clamp(1.1rem,3vw,1.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--text-base)] transition-colors duration-200 group-hover:text-white">
                      {t(`works.${work.slug}.title`)}
                    </p>
                    <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--text-base-40)]">
                      {`/experiments/${work.slug}`}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span
                    className="hidden font-mono text-[10px] uppercase tracking-[0.2em] sm:inline"
                    style={{
                      color:
                        work.state === "active"
                          ? work.accent
                          : "var(--text-base-50, rgba(237,237,239,0.5))",
                    }}
                  >
                    {t(`stateLabel.${work.state}`)}
                  </span>
                  <span
                    aria-hidden="true"
                    className="font-mono text-[14px] text-[var(--text-base-60)] transition-transform duration-200 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
