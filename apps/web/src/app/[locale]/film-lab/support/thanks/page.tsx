import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FilmLabSupportThanksClient } from "./FilmLabSupportThanksClient";

/**
 * @description Film Lab 任意寄付の支払い後ランディング（Payment Link の after_completion 先）。
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
export default async function FilmLabSupportThanksPage({
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

  return <FilmLabSupportThanksClient checkoutSessionId={checkoutSessionId} />;
}
