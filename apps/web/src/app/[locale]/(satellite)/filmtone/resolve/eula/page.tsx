import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { filmtoneResolveCanonicalBaseUrl } from "@/features/interactive/film-lab/resolve-plugin-info";
import {
  ResolveLegalFooter,
  ResolveLegalHeader,
  ResolveLegalMain,
  ResolveLegalSection,
} from "../resolve-legal-ui";

/**
 * @file `Filmtone for DaVinci Resolve` の使用許諾契約（EULA）ページ（`/filmtone/resolve/eula`）。
 * @description filmtone repo の `docs/filmtone/davinci-plugin/monetization/eula.md`（owner レビュー候補）を
 *   忠実に翻訳・構造化したもの。既存 `/filmtone/privacy`（アプリの local-first 通知）とは別プロダクトの契約なので独立ページ。
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "filmtone-resolve.eula.metadata" });
  const isJa = locale === "ja";
  const canonicalUrl = isJa
    ? `${filmtoneResolveCanonicalBaseUrl}/filmtone/resolve/eula`
    : `${filmtoneResolveCanonicalBaseUrl}/en/filmtone/resolve/eula`;

  return {
    title: t("title"),
    description: t("description"),
    icons: {
      icon: [{ url: "/brand/film-lab-symbol.svg", type: "image/svg+xml", sizes: "any" }],
      apple: [{ url: "/brand/film-lab-apple-touch.png", sizes: "180x180", type: "image/png" }],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ja: `${filmtoneResolveCanonicalBaseUrl}/filmtone/resolve/eula`,
        en: `${filmtoneResolveCanonicalBaseUrl}/en/filmtone/resolve/eula`,
      },
    },
  };
}

export default async function FilmtoneResolveEulaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "filmtone-resolve.eula" });
  const restrictionItems = t.raw("restrictions.items") as string[];

  return (
    <ResolveLegalMain>
      <ResolveLegalHeader eyebrow={t("eyebrow")} title={t("title")} note={t("effectiveNote")} />

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
        <p className="text-sm leading-relaxed text-white/70">{t("intro")}</p>
      </section>

      <ResolveLegalSection heading={t("grant.heading")} paragraphs={[t("grant.body")]} />
      <ResolveLegalSection
        heading={t("restrictions.heading")}
        paragraphs={[t("restrictions.intro")]}
        bullets={restrictionItems}
      />
      <ResolveLegalSection heading={t("ownership.heading")} paragraphs={[t("ownership.body")]} />
      <ResolveLegalSection heading={t("trial.heading")} paragraphs={[t("trial.body")]} />
      <ResolveLegalSection heading={t("refund.heading")} paragraphs={[t("refund.body")]} />
      <ResolveLegalSection heading={t("warranty.heading")} paragraphs={[t("warranty.body")]} />
      <ResolveLegalSection heading={t("termination.heading")} paragraphs={[t("termination.body")]} />
      <ResolveLegalSection heading={t("governing.heading")} paragraphs={[t("governing.body")]} />

      <ResolveLegalFooter backLabel={t("backCta")} />
    </ResolveLegalMain>
  );
}
