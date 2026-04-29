import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FilmtoneFeaturesContent } from "@/features/interactive/film-lab/components/FilmtoneFeaturesContent";

const BASE_URL = "https://www.chibatakumi.studio";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "film-lab.features" });
  const isJa = locale === "ja";
  const canonicalUrl = isJa
    ? `${BASE_URL}/filmtone/features`
    : `${BASE_URL}/en/filmtone/features`;

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
    icons: {
      icon: [{ url: "/brand/film-lab-symbol.svg", type: "image/svg+xml", sizes: "any" }],
      apple: [{ url: "/brand/film-lab-apple-touch.png", sizes: "180x180", type: "image/png" }],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ja: `${BASE_URL}/filmtone/features`,
        en: `${BASE_URL}/en/filmtone/features`,
      },
    },
  };
}

export default async function FilmtoneFeaturesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <FilmtoneFeaturesContent />;
}
