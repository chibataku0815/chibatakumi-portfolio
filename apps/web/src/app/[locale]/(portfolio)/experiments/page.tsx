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
};

const works: readonly ExperimentWork[] = [
  { slug: "dot", href: "/experiments/dot", state: "active" },
  { slug: "grid", href: "/experiments/grid", state: "active" },
  { slug: "flow", href: "/experiments/flow", state: "active" },
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
    <main className="relative min-h-[var(--vvh,100dvh)] w-full">
      <ExperimentsSceneCycle />

      <section className="relative px-6 pt-32 pb-12 sm:pt-40 sm:pb-16" data-readability="focus">
        <div className="mx-auto max-w-5xl">
          <p className="font-sans font-medium text-[10px] uppercase tracking-[0.18em] text-[var(--text-base-60)]">
            {t("eyebrow")}
          </p>
          <h1
            className="mt-4 text-[clamp(2.4rem,7vw,4.5rem)] font-medium leading-[1.05] tracking-[-0.03em] text-[var(--text-base)]"
            style={{ fontFamily: "var(--font-family-display)" }}
          >
            {t("title")}
          </h1>
        </div>
      </section>

      <section className="relative px-6 pb-32 sm:pb-40" data-readability="reading">
        <div className="mx-auto max-w-5xl">
          <div
            className="mb-6 h-px w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(0,0,0,0.22), transparent)",
            }}
          />
          <div className="flex flex-col divide-y divide-black/[0.08]">
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
                  <span className="shrink-0 font-sans font-medium text-[10px] uppercase tabular-nums tracking-[0.16em] text-[var(--text-base-40)]">
                    {`0${index + 1}`}
                  </span>
                  <div className="min-w-0">
                    <p
                      className="text-[clamp(1.1rem,3vw,1.5rem)] font-medium leading-[1.1] tracking-[-0.02em] text-[var(--text-base)] transition-colors duration-200 group-hover:text-black"
                      style={{ fontFamily: "var(--font-family-display)" }}
                    >
                      {t(`works.${work.slug}.title`)}
                    </p>
                    <p className="mt-1 truncate font-sans font-medium text-[10px] uppercase tracking-[0.14em] text-[var(--text-base-50)]">
                      {`/experiments/${work.slug}`}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span
                    className="hidden font-sans font-medium text-[10px] uppercase tracking-[0.14em] sm:inline"
                    style={{
                      color:
                        work.state === "active"
                          ? "var(--text-base-60)"
                          : "var(--text-base-40)",
                    }}
                  >
                    {t(`stateLabel.${work.state}`)}
                  </span>
                  <span
                    aria-hidden="true"
                    className="font-sans text-[14px] text-[var(--text-base-60)] transition-transform duration-200 group-hover:translate-x-1"
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
