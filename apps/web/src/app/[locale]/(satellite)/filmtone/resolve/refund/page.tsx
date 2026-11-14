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
 * @file `Filmtone for DaVinci Resolve` の返金ポリシーページ（`/filmtone/resolve/refund`）。
 * @description filmtone repo の `docs/filmtone/davinci-plugin/monetization/refund-policy.md` を忠実に翻訳・構造化。
 *   Merchant of Record は Polar。14 暦日の change-of-mind 返金窓口＋消費者の法定権利を明示する。
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "filmtone-resolve.refund.metadata" });
  const isJa = locale === "ja";
  const canonicalUrl = isJa
    ? `${filmtoneResolveCanonicalBaseUrl}/filmtone/resolve/refund`
    : `${filmtoneResolveCanonicalBaseUrl}/en/filmtone/resolve/refund`;

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
        ja: `${filmtoneResolveCanonicalBaseUrl}/filmtone/resolve/refund`,
        en: `${filmtoneResolveCanonicalBaseUrl}/en/filmtone/resolve/refund`,
      },
    },
  };
}

export default async function FilmtoneResolveRefundPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "filmtone-resolve.refund" });

  return (
    <ResolveLegalMain>
      <ResolveLegalHeader eyebrow={t("eyebrow")} title={t("title")} note={t("effectiveNote")} />

      <ResolveLegalSection
        heading={t("window.heading")}
        paragraphs={[t("window.body"), t("window.request")]}
      />
      <ResolveLegalSection
        heading={t("method.heading")}
        paragraphs={[t("method.body"), t("method.afterRefund")]}
      />
      <ResolveLegalSection heading={t("after.heading")} paragraphs={[t("after.body")]} />
      <ResolveLegalSection
        heading={t("consumerRights.heading")}
        paragraphs={[t("consumerRights.body")]}
      />

      <ResolveLegalFooter backLabel={t("backCta")} />
    </ResolveLegalMain>
  );
}
