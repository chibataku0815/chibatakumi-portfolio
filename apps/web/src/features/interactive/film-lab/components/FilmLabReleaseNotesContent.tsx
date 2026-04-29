"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { releaseRails } from "../release-data";
import type { ChangeType, ReleasePlatform } from "../release-data";

const changeTypeConfig: Record<ChangeType, { labelKey: string; dotClass: string }> = {
  added: { labelKey: "typeAdded", dotClass: "bg-emerald-400" },
  fixed: { labelKey: "typeFixed", dotClass: "bg-amber-400" },
  changed: { labelKey: "typeChanged", dotClass: "bg-blue-400" },
};

/**
 * @description リリース番号を目次リンク用の id に変える。
 * 版番号の "." を "-" に変えて、URL の断片として安全に使う。
 * @param {string} version - 版番号
 * @returns {string} anchor id
 */
const releasePlatforms: ReleasePlatform[] = ["desktop", "ios"];

function filmLabReleaseNoteAnchorId(platform: ReleasePlatform, version: string): string {
  return `release-${platform}-${version.replace(/\./g, "-")}`;
}

/**
 * @description Filmtone の公開リリース履歴を、目次付きの 2 カラムで見やすく出す画面。
 * 左に目次、右に本文カードを置き、スマホでは縦に積む。
 */
export function FilmLabReleaseNotesContent() {
  const t = useTranslations("film-lab.releaseNotes");
  const [activePlatform, setActivePlatform] = useState<ReleasePlatform>("desktop");
  const releases = releaseRails[activePlatform];
  const tocEntries = useMemo(
    () =>
      releases.map((release) => ({
        id: filmLabReleaseNoteAnchorId(release.platform, release.version),
        version: release.version,
        title: t(`entries.${release.titleKey}`),
      })),
    [releases, t],
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-16 sm:px-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
        {t("eyebrow")}
      </p>
      <h1 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
        {t("heroTitle")}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70">
        {t("heroBody")}
      </p>

      <div
        className="mt-8 inline-flex max-w-full flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-1"
        role="tablist"
        aria-label={t("platformTabsLabel")}
      >
        {releasePlatforms.map((platform) => {
          const selected = activePlatform === platform;
          return (
            <button
              key={platform}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`rounded-xl px-4 py-2 text-sm transition-colors ${
                selected
                  ? "bg-white text-neutral-950"
                  : "text-white/65 hover:bg-white/[0.07] hover:text-white"
              }`}
              onClick={() => setActivePlatform(platform)}
            >
              {t(`platforms.${platform}`)}
            </button>
          );
        })}
      </div>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/60">
        {t(`platformIntro.${activePlatform}`)}
      </p>

      <div className="mt-12 flex flex-col gap-8 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-10">
        <aside className="w-full lg:sticky lg:top-24 lg:self-start lg:pr-2">
          <h2
            id="release-notes-toc"
            className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/35"
          >
            {t("tocTitle")}
          </h2>
          <nav aria-labelledby="release-notes-toc" className="mt-4">
            <ol className="border-l border-white/8 pl-4">
              {tocEntries.map((entry) => (
                <li key={entry.id} className="pb-2 last:pb-0">
                  <a
                    href={`#${entry.id}`}
                    className="group block py-1 transition-colors"
                  >
                    <p className="text-sm font-medium text-white/70 transition-colors group-hover:text-white">
                      v{entry.version}
                    </p>
                    <p className="mt-0.5 text-sm leading-snug text-white/55 transition-colors group-hover:text-white/80">
                      {entry.title}
                    </p>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <section className="space-y-8 lg:min-w-0">
          {releases.map((release, index) => (
            <article
              id={filmLabReleaseNoteAnchorId(release.platform, release.version)}
              key={`${release.platform}-${release.version}`}
              className={`scroll-mt-28 rounded-2xl border p-5 sm:p-6 ${
                index === 0
                  ? "border-white/16 bg-white/[0.055]"
                  : "border-white/8 bg-white/[0.035]"
              }`}
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="text-lg font-semibold text-white">
                  v{release.version}
                </h2>
                {index === 0 && (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-400">
                    {t("latestBadge")}
                  </span>
                )}
                <span className="text-xs text-white/40">{release.date}</span>
              </div>
              <p className="mt-1 text-sm text-white/60">
                {t(`entries.${release.titleKey}`)}
              </p>

              <ul className="mt-4 space-y-2">
                {release.changes.map((change) => {
                  const config = changeTypeConfig[change.type];
                  return (
                    <li
                      key={change.key}
                      className="flex items-start gap-2.5 text-sm"
                    >
                      <span className="mt-0.5 flex items-center gap-1.5">
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${config.dotClass}`}
                        />
                        <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">
                          {t(config.labelKey)}
                        </span>
                      </span>
                      <span className="text-white/70">
                        {t(`entries.${change.key}`)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </section>
      </div>

      <div className="mt-8 border-t border-white/10 pt-6">
        <Link
          href="/filmtone"
          className="text-xs text-white/60 transition-colors hover:text-white"
        >
          {t("backToFilmLab")}
        </Link>
      </div>
    </main>
  );
}
