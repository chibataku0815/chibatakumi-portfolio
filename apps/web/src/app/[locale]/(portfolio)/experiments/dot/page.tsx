import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { portfolioData } from "@/shared/data/portfolio";
import ExperimentsDotClient from "./client";

const BASE_URL = portfolioData.site.siteUrl;
const PATH = "/experiments/dot";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "experiments" });
  const isJa = locale === "ja";

  const title = t("works.dot.title");
  const description = t("works.dot.concept");
  const canonicalUrl = isJa ? `${BASE_URL}${PATH}` : `${BASE_URL}/en${PATH}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ja: `${BASE_URL}${PATH}`,
        en: `${BASE_URL}/en${PATH}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      locale: isJa ? "ja_JP" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ExperimentsDotPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ExperimentsDotClient />;
}
