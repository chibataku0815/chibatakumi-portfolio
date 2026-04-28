import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FilmLabReleaseNotesContent } from "@/features/interactive/film-lab/components/FilmLabReleaseNotesContent";

const BASE_URL = "https://www.chibatakumi.studio";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "film-lab.releaseNotes" });
  const isJa = locale === "ja";
  const canonicalUrl = isJa
    ? `${BASE_URL}/filmtone/release-notes`
    : `${BASE_URL}/en/filmtone/release-notes`;

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
        ja: `${BASE_URL}/filmtone/release-notes`,
        en: `${BASE_URL}/en/filmtone/release-notes`,
      },
    },
  };
}

export default async function FilmtoneReleaseNotesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <FilmLabReleaseNotesContent />;
}
