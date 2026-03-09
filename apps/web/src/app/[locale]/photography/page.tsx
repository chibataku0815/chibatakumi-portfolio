import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PhotographyClient from "@/features/photography/PhotographyClient";

const BASE_URL = "https://www.chibatakumi.studio";

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

  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: [
        {
          url: "/photography/og-image.jpg",
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
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ja: `${BASE_URL}/photography`,
        en: `${BASE_URL}/en/photography`,
      },
    },
  };
}

// JSON-LD Structured Data
function getJsonLd(locale: string) {
  const isJa = locale === "ja";
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        name: "Takumi Chiba Photography",
        description: isJa
          ? "東京拠点のイベントフォトグラファー。当日プレビュー、72時間以内に全データ納品。英語テキスト対応。"
          : "Editorial event photographer in Tokyo. Same-day previews, full delivery in 72 hours. Text-based English support.",
        url: isJa
          ? `${BASE_URL}/photography`
          : `${BASE_URL}/en/photography`,
        image: `${BASE_URL}/photography/og-image.jpg`,
        inLanguage: isJa ? "ja" : "en",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Tokyo",
          addressCountry: "JP",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 35.6762,
          longitude: 139.6503,
        },
        priceRange: "$$",
        serviceType: isJa
          ? ["イベント撮影", "企業撮影", "ハイライト動画", "当日写真納品"]
          : ["Event Photography", "Corporate Photography", "Highlight Videos", "Same-Day Photo Delivery"],
        areaServed: {
          "@type": "City",
          name: "Tokyo",
        },
        founder: {
          "@type": "Person",
          name: "Takumi Chiba",
          jobTitle: isJa
            ? "イベントフォトグラファー & ソフトウェアエンジニア"
            : "Event Photographer & Software Engineer",
          url: BASE_URL,
        },
      },
      {
        "@type": "ImageGallery",
        name: "Cafe Cursor Tokyo — March 2026",
        description: isJa
          ? "Cursor（Anysphere）初の東京コミュニティミートアップの公式撮影。"
          : "Official photography from the first Cursor (by Anysphere) Tokyo community meetup.",
        inLanguage: isJa ? "ja" : "en",
        dateCreated: "2026-03-05",
        about: {
          "@type": "Event",
          name: "Cursor Tokyo Meetup",
          startDate: "2026-03-05",
          location: {
            "@type": "Place",
            name: "Tokyo",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Tokyo",
              addressCountry: "JP",
            },
          },
          organizer: { "@type": "Organization", name: "Anysphere" },
        },
      },
    ],
  };
}

export default async function PhotographyPage({
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
      <PhotographyClient />
    </>
  );
}
