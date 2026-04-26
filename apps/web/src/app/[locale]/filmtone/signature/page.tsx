import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FilmtoneSignatureWaitlistClient } from "@/features/interactive/film-lab/filmtone-signature-waitlist-client";

const BASE_URL = "https://www.chibatakumi.studio";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "filmtone-signature.metadata",
  });
  const isJa = locale === "ja";
  const canonicalUrl = isJa
    ? `${BASE_URL}/filmtone/signature`
    : `${BASE_URL}/en/filmtone/signature`;

  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: [
        {
          url: "/film-lab/og-image.jpg",
          width: 1200,
          height: 630,
          alt: t("ogImageAlt"),
        },
      ],
      type: "website",
      locale: isJa ? "ja_JP" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: ["/film-lab/og-image.jpg"],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ja: `${BASE_URL}/filmtone/signature`,
        en: `${BASE_URL}/en/filmtone/signature`,
      },
    },
  };
}

export default async function FilmtoneSignatureWaitlistPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <FilmtoneSignatureWaitlistClient locale={locale} />;
}
