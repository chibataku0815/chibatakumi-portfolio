import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FilmtoneSupportThanksClient } from "./FilmtoneSupportThanksClient";

/**
 * @description Filmtone 任意寄付の支払い後ランディング（Payment Link の after_completion 先）。
 *   Wave 2 D5.1 で `/film-lab/support/thanks` から carry。
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "film-lab.donation.thanks_page",
  });
  return {
    title: t("meta_title"),
    description: t("meta_description"),
  };
}

function firstQueryValue(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === "string" ? value : value[0];
}

/**
 * @description サーバーでロケールと `session_id` を渡し、クライアントで verify。
 */
export default async function FilmtoneSupportThanksPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let checkoutSessionId: string | undefined;
  if (searchParams) {
    const sp = await searchParams;
    checkoutSessionId = firstQueryValue(sp.session_id);
  }

  return <FilmtoneSupportThanksClient checkoutSessionId={checkoutSessionId} />;
}
