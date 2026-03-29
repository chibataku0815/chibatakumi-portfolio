import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FilmLabFullPage } from "@/features/interactive/film-lab";
import { decodeSharedParamP } from "@/features/interactive/film-lab/params-codec";
import type { Params } from "@/features/interactive/film-lab/types";

const BASE_URL = "https://www.chibatakumi.studio";

function filmLabOgPath(locale: string): string {
  return locale === "ja" ? "/film-lab/og" : `/en/film-lab/og`;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "film-lab.metadata" });
  const isJa = locale === "ja";

  const canonicalUrl = isJa
    ? `${BASE_URL}/film-lab`
    : `${BASE_URL}/en/film-lab`;

  let ogImageUrl = "/film-lab/og-image.jpg";
  if (searchParams) {
    const sp = await searchParams;
    const pRaw = firstQueryValue(sp.p);
    const vRaw = firstQueryValue(sp.v);
    if (pRaw && decodeSharedParamP(vRaw, pRaw)) {
      const og = new URL(filmLabOgPath(locale), BASE_URL);
      og.searchParams.set("v", vRaw?.trim() || "1");
      og.searchParams.set("p", pRaw);
      ogImageUrl = `${og.pathname}${og.search}`;
    }
  }

  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
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
      type: "website",
      locale: isJa ? "ja_JP" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: [ogImageUrl],
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

function firstQueryValue(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === "string" ? value : value[0];
}

export default async function FilmLabPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let initialSharedParams: Params | null = null;
  if (searchParams) {
    const sp = await searchParams;
    const pRaw = firstQueryValue(sp.p);
    const vRaw = firstQueryValue(sp.v);
    if (pRaw) {
      initialSharedParams = decodeSharedParamP(vRaw, pRaw);
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getJsonLd(locale)) }}
      />
      <FilmLabFullPage initialSharedParams={initialSharedParams} />
    </>
  );
}
