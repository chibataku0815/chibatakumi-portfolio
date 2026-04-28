import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PhotographyClient } from "@/features/photography";
import { portfolioData } from "@/shared/data/portfolio";

const BASE_URL = portfolioData.site.siteUrl;
const OG_IMAGE_PATH = "/photography/og-image.jpg";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "photography.metadata" });
  const isJa = locale === "ja";

  const canonicalUrl = isJa
    ? `${BASE_URL}/photography`
    : `${BASE_URL}/en/photography`;
  const ogImageUrl = `${BASE_URL}${OG_IMAGE_PATH}`;

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ja: `${BASE_URL}/photography`,
        en: `${BASE_URL}/en/photography`,
      },
    },
    openGraph: {
      type: "website",
      url: canonicalUrl,
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: t("ogImageAlt"),
        },
      ],
      locale: isJa ? "ja_JP" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: [ogImageUrl],
    },
  };
}

export default async function PhotographyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PhotographyClient />;
}
