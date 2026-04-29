import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FilmLabFullPage } from "@/features/interactive/film-lab";
import {
  FILM_LAB_SUPPORTER_COOKIE_NAME,
  filmLabVerifySupporterCookieValue,
} from "@/features/interactive/film-lab/film-lab-donation-cookie-signing";
import { filmLabReadDonationEnvOnServer } from "@/features/interactive/film-lab/film-lab-donation-env-server";
import {
  filmLabIosAppStoreUrl,
  filmLabIosMinimumVersion,
} from "@/features/interactive/film-lab/ios-release-info";
import { decodeSharedParamP } from "@/features/interactive/film-lab/params-codec";
import type { Params } from "@/features/interactive/film-lab/types";

/**
 * @file Filmtone case study top page (`/filmtone`).
 * @description Wave 2 D5.1 で `/film-lab` から carry。D5.6 dynamic data isolation: server component が
 *   100% static (case study text + metadata)、cookie / searchParams の解決後に client island
 *   `<FilmLabFullPage />` を Suspense 越しではなく直接 mount。独立ドメイン化時は island の export source
 *   切替で static snapshot 化を容易にする (waitlist / donation を別 island にしたい場合は追って分割)。
 *   D5.7 で `metadata.alternates.canonical` を新パスへ inline。Package 5 で `/works/filmtone` → `/filmtone` へ canonical 移動。
 */

const BASE_URL = "https://www.chibatakumi.studio";

function filmtoneOgPath(locale: string): string {
  return locale === "ja"
    ? "/filmtone/og"
    : `/en/filmtone/og`;
}

/**
 * Filmtone ページ用のメタデータを組み立てて返す。
 *
 * @description
 * - OGP／Twitter カードの画像は、従来どおり写実ヒーローか動的 OG ルート（共有プリセット URL）。
 * - ブラウザタブと Apple Touch 用には、サイト全体の icon ではなく **Filmtone 専用シンボル**（`/brand/film-lab-symbol.svg` 等）を載せる。
 *   life 側の正本: `film-lab-symbol-mark-assets.md`（asset paths は public/brand/, public/film-lab/ のまま維持）。
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

  const canonicalUrl = isJa
    ? `${BASE_URL}/filmtone`
    : `${BASE_URL}/en/filmtone`;

  let ogImageUrl = "/filmtone/og-image.jpg";
  if (searchParams) {
    const sp = await searchParams;
    const pRaw = firstQueryValue(sp.p);
    const vRaw = firstQueryValue(sp.v);
    if (pRaw && decodeSharedParamP(vRaw, pRaw)) {
      const og = new URL(filmtoneOgPath(locale), BASE_URL);
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
        ja: `${BASE_URL}/filmtone`,
        en: `${BASE_URL}/en/filmtone`,
      },
    },
  };
}

/**
 * @description 構造化データ。単独の WebApplication + operatingSystem:Any だけだと browser-first に読まれやすいため、
 *   **Desktop（SoftwareApplication）** と **ブラウザデモ（WebApplication）** を `@graph` で分け、`isRelatedTo` で関連づける。
 * @param locale - next-intl のロケール（`ja` / `en` など）。
 */
async function buildFilmtoneJsonLd(locale: string) {
  const t = await getTranslations({ locale, namespace: "film-lab.jsonLd" });
  const isJa = locale === "ja";
  const pageUrl = isJa
    ? `${BASE_URL}/filmtone`
    : `${BASE_URL}/en/filmtone`;
  const downloadUrl = isJa
    ? `${BASE_URL}/filmtone/download`
    : `${BASE_URL}/en/filmtone/download`;
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
        image: `${BASE_URL}/filmtone/og-image.jpg`,
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
        image: `${BASE_URL}/filmtone/og-image.jpg`,
        isRelatedTo: { "@id": `${pageUrl}#desktop` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${pageUrl}#ios`,
        name: t("iosName"),
        description: t("iosDescription"),
        applicationCategory: "MultimediaApplication",
        operatingSystem: `iOS ${filmLabIosMinimumVersion}+`,
        url: filmLabIosAppStoreUrl,
        downloadUrl: filmLabIosAppStoreUrl,
        image: `${BASE_URL}/filmtone/og-image.jpg`,
        author: {
          "@type": "Person",
          name: "Takumi Chiba",
          url: BASE_URL,
        },
        isRelatedTo: [{ "@id": `${pageUrl}#desktop` }, { "@id": `${pageUrl}#webDemo` }],
      },
    ],
  };
}

function firstQueryValue(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === "string" ? value : value[0];
}

/**
 * @description Filmtone case study top — server component。
 *   D5.6: dynamic state (cookie verified supporter, shared params, donation env) は server で resolve、
 *   client UI は `FilmLabFullPage` 1 island に集約。将来、waitlist / donation / showcase で
 *   多 island 化したい場合は本 component を分割する。
 */
export default async function FilmtonePage({
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

  const jsonLd = await buildFilmtoneJsonLd(locale);

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
