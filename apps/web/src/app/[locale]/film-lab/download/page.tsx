import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  filmLabDesktopArchitecture,
  filmLabDesktopMinimumMacos,
  filmLabDesktopSupportEmail,
  filmLabReadDesktopDownloadUrl,
} from "@/features/interactive/film-lab/desktop-release-info";

/**
 * @file Film Lab Desktop の固定ダウンロード URL ページ。
 * @description 公開アセット URL が設定されているときはその DMG へリダイレクトし、未設定のときは案内ページを返します。
 * @limitations 実アセット自体のホスティングは別途必要です。このページは固定導線だけを提供します。
 */

/**
 * 固定ダウンロード URL の本体ページです。
 *
 * @param {{
 *   params: Promise<{ locale: string }>;
 * }} root0 - Next.js のページ props。
 */
export default async function FilmLabDesktopDownloadPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const downloadUrl = filmLabReadDesktopDownloadUrl();
  if (downloadUrl.length > 0) {
    redirect(downloadUrl);
  }

  const t = await getTranslations({ locale, namespace: "film-lab.desktopRelease.downloadPage" });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-16 sm:px-6">
      <section className="w-full rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
          {t("eyebrow")}
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">{t("title")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/70">{t("body")}</p>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
            <dt className="text-[10px] uppercase tracking-[0.18em] text-white/40">
              {t("specs.minimumMacosLabel")}
            </dt>
            <dd className="mt-1 text-sm text-white/85">
              {t("specs.minimumMacosValuePrefix")} {filmLabDesktopMinimumMacos}+
            </dd>
          </div>
          <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
            <dt className="text-[10px] uppercase tracking-[0.18em] text-white/40">
              {t("specs.architectureLabel")}
            </dt>
            <dd className="mt-1 text-sm text-white/85">{filmLabDesktopArchitecture}</dd>
          </div>
          <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
            <dt className="text-[10px] uppercase tracking-[0.18em] text-white/40">
              {t("specs.platformLabel")}
            </dt>
            <dd className="mt-1 text-sm text-white/85">{t("specs.platformValue")}</dd>
          </div>
          <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
            <dt className="text-[10px] uppercase tracking-[0.18em] text-white/40">
              {t("specs.updatesLabel")}
            </dt>
            <dd className="mt-1 text-sm text-white/85">{t("specs.updatesValue")}</dd>
          </div>
        </dl>

        <p className="mt-6 text-sm leading-relaxed text-white/65">{t("pendingLead")}</p>
        <ul className="mt-3 space-y-1 text-sm leading-relaxed text-white/60">
          <li>{t("notes.releaseNotes")}</li>
          <li>{t("notes.lut")}</li>
          <li>{t("notes.donationAndSharing")}</li>
          <li>{t("notes.smartLook")}</li>
        </ul>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/film-lab"
            className="inline-flex items-center justify-center rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm text-white transition-colors hover:bg-white/14"
          >
            {t("backCta")}
          </Link>
          <a
            href={`mailto:${filmLabDesktopSupportEmail}`}
            className="text-sm text-white/70 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
          >
            {t("supportCtaPrefix")} {filmLabDesktopSupportEmail}
          </a>
        </div>
      </section>
    </main>
  );
}
