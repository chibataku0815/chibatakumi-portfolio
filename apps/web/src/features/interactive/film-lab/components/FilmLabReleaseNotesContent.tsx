"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { releases } from "../release-data";
import type { ChangeType } from "../release-data";

const changeTypeConfig: Record<ChangeType, { labelKey: string; dotClass: string }> = {
  added: { labelKey: "typeAdded", dotClass: "bg-emerald-400" },
  fixed: { labelKey: "typeFixed", dotClass: "bg-amber-400" },
  changed: { labelKey: "typeChanged", dotClass: "bg-blue-400" },
};

export function FilmLabReleaseNotesContent() {
  const t = useTranslations("film-lab.releaseNotes");

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
        {t("eyebrow")}
      </p>
      <h1 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
        {t("heroTitle")}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70">
        {t("heroBody")}
      </p>

      <div className="mt-12 space-y-8">
        {releases.map((release, index) => (
          <article
            key={release.version}
            className={`rounded-2xl border p-5 sm:p-6 ${
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
                  <li key={change.key} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-0.5 flex items-center gap-1.5">
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
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
      </div>

      <div className="mt-8 border-t border-white/10 pt-6">
        <Link
          href="/film-lab"
          className="text-xs text-white/60 transition-colors hover:text-white"
        >
          {t("backToFilmLab")}
        </Link>
      </div>
    </main>
  );
}
