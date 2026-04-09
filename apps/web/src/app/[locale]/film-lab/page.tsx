import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FilmLabFullPage } from "@/features/interactive/film-lab";
import {
  FILM_LAB_SUPPORTER_COOKIE_NAME,
  filmLabVerifySupporterCookieValue,
} from "@/features/interactive/film-lab/film-lab-donation-cookie-signing";
import { filmLabReadDonationEnvOnServer } from "@/features/interactive/film-lab/film-lab-donation-env-server";
import { decodeSharedParamP } from "@/features/interactive/film-lab/params-codec";
import type { Params } from "@/features/interactive/film-lab/types";

const BASE_URL = "https://www.chibatakumi.studio";

function filmLabOgPath(locale: string): string {
  return locale === "ja" ? "/film-lab/og" : `/en/film-lab/og`;
}

/**
 * Film Lab ページ用のメタデータを組み立てて返す。
 *
 * @description
 * - OGP／Twitter カードの画像は、従来どおり写実ヒーローか動的 OG ルート（共有プリセット URL）。
 * - ブラウザタブと Apple Touch 用には、サイト全体の icon ではなく **Film Lab 専用シンボル**（`/brand/film-lab-symbol.svg` 等）を載せる。
 *   life 側の正本: `film-lab-symbol-mark-assets.md`。
 *
 * @param params - Next.js のルート `params`。`locale` で言語を切り替える。
 * @param searchParams - クエリ `p` / `v`。共有ルックが解読できたときだけ動的 OG パスを選ぶ。
 */
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

  const canonicalUrl = isJa ? `${BASE_URL}/film-lab` : `${BASE_URL}/en/film-lab`;

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
    icons: {
      icon: [{ url: "/brand/film-lab-symbol.svg", type: "image/svg+xml", sizes: "any" }],
      apple: [
        { url: "/brand/film-lab-apple-touch.png", sizes: "180x180", type: "image/png" },
      ],
    },
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

/**
 * @description 構造化データ。単独の WebApplication + operatingSystem:Any だけだと browser-first に読まれやすいため、
 *   **Desktop（SoftwareApplication）** と **ブラウザデモ（WebApplication）** を `@graph` で分け、`isRelatedTo` で関連づける。
 * @param locale - next-intl のロケール（`ja` / `en` など）。
 */
async function buildFilmLabJsonLd(locale: string) {
  const t = await getTranslations({ locale, namespace: "film-lab.jsonLd" });
  const isJa = locale === "ja";
  const pageUrl = isJa ? `${BASE_URL}/film-lab` : `${BASE_URL}/en/film-lab`;
  const downloadUrl = isJa
    ? `${BASE_URL}/film-lab/download`
    : `${BASE_URL}/en/film-lab/download`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${pageUrl}#desktop`,
        name: t("desktopName"),
        description: t("desktopDescription"),
        applicationCategory: "MultimediaApplication",
        operatingSystem: t("desktopOperatingSystem"),
        url: downloadUrl,
        image: `${BASE_URL}/film-lab/og-image.jpg`,
        author: {
          "@type": "Person",
          name: "Takumi Chiba",
          url: BASE_URL,
        },
      },
      {
        "@type": "WebApplication",
        "@id": `${pageUrl}#webDemo`,
        name: t("webDemoName"),
        description: t("webDemoDescription"),
        applicationCategory: "MultimediaApplication",
        url: pageUrl,
        browserRequirements: t("webDemoBrowserRequirements"),
        operatingSystem: t("webDemoOperatingSystem"),
        inLanguage: isJa ? "ja" : "en",
        image: `${BASE_URL}/film-lab/og-image.jpg`,
        isRelatedTo: { "@id": `${pageUrl}#desktop` },
      },
    ],
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

  const donationRuntime = filmLabReadDonationEnvOnServer();

  const cookieStore = await cookies();
  const supporterRaw = cookieStore.get(FILM_LAB_SUPPORTER_COOKIE_NAME)?.value;
  const signSecret = process.env.FILM_LAB_DONATION_SIGNING_SECRET?.trim() ?? "";
  const serverVerifiedSupporter = Boolean(
    supporterRaw &&
      signSecret.length > 0 &&
      filmLabVerifySupporterCookieValue(supporterRaw, signSecret) !== null,
  );

  const jsonLd = await buildFilmLabJsonLd(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FilmLabFullPage
        initialSharedParams={initialSharedParams}
        donationRuntime={donationRuntime}
        serverVerifiedSupporter={serverVerifiedSupporter}
      />
    </>
  );
}
