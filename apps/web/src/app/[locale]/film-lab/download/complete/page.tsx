import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FilmLabDownloadComplete } from "@/features/interactive/film-lab/components/FilmLabDownloadComplete";
import {
  FILM_LAB_SUPPORTER_COOKIE_NAME,
  filmLabVerifySupporterCookieValue,
} from "@/features/interactive/film-lab/film-lab-donation-cookie-signing";
import { filmLabReadDonationEnvOnServer } from "@/features/interactive/film-lab/film-lab-donation-env-server";
import { filmLabReadDesktopDownloadUrl } from "@/features/interactive/film-lab/desktop-release-info";

/**
 * @file ダウンロード完了ページ。DMG ダウンロード開始後にインストール手順・寄付導線を表示する。
 * @description `/film-lab/download` から遷移。DMG は自動ダウンロード（iframe）。
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "film-lab.desktopRelease.downloadComplete",
  });
  return {
    title: t("meta_title"),
    description: t("meta_description"),
  };
}

export default async function FilmLabDownloadCompletePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const downloadUrl = filmLabReadDesktopDownloadUrl();

  const donationRuntime = filmLabReadDonationEnvOnServer();
  const stripeTiers = donationRuntime?.stripeTiers ?? [];
  const bmcUrl = donationRuntime?.bmcUrl ?? "";

  const cookieStore = await cookies();
  const supporterRaw = cookieStore.get(FILM_LAB_SUPPORTER_COOKIE_NAME)?.value;
  const signSecret = process.env.FILM_LAB_DONATION_SIGNING_SECRET?.trim() ?? "";
  const serverVerifiedSupporter = Boolean(
    supporterRaw &&
      signSecret.length > 0 &&
      filmLabVerifySupporterCookieValue(supporterRaw, signSecret) !== null,
  );

  return (
    <FilmLabDownloadComplete
      downloadUrl={downloadUrl}
      stripeTiers={stripeTiers}
      bmcUrl={bmcUrl}
      serverVerifiedSupporter={serverVerifiedSupporter}
    />
  );
}
