import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FilmLabFullPage } from "@/features/interactive/film-lab";

const BASE_URL = "https://www.chibatakumi.studio";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "film-lab.metadata" });
  const isJa = locale === "ja";

  const canonicalUrl = isJa
    ? `${BASE_URL}/film-lab`
    : `${BASE_URL}/en/film-lab`;

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
        ja: `${BASE_URL}/film-lab`,
        en: `${BASE_URL}/en/film-lab`,
      },
    },
  };
}

function getJsonLd(locale: string) {
  const isJa = locale === "ja";
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Film Lab",
    description: isJa
      ? "ブラウザで動くリアルタイムカラーグレーディングツール"
      : "A real-time color grading tool in the browser",
    url: isJa ? `${BASE_URL}/film-lab` : `${BASE_URL}/en/film-lab`,
    applicationCategory: "PhotographyApplication",
    operatingSystem: "Any",
    browserRequirements: "WebGL2",
    inLanguage: isJa ? "ja" : "en",
    image: `${BASE_URL}/film-lab/og-image.jpg`,
    screenshot: `${BASE_URL}/film-lab/og-image.jpg`,
    author: {
      "@type": "Person",
      name: "Takumi Chiba",
      url: BASE_URL,
    },
  };
}

export default async function FilmLabPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getJsonLd(locale)) }}
      />
      <FilmLabFullPage />
    </>
  );
}
