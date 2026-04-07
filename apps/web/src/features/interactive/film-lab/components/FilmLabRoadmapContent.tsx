"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type RoadmapStatus = "released" | "inDevelopment" | "planned" | "considering";

interface RoadmapItem {
  key: string;
  status: RoadmapStatus;
}

const items: RoadmapItem[] = [
  // Released
  { key: "batchJpegPng", status: "released" },
  { key: "singleVideoExport", status: "released" },
  { key: "fourPresets", status: "released" },
  { key: "browserDemo", status: "released" },
  { key: "shareLook", status: "released" },
  { key: "desktopExportWorkflow033", status: "released" },
  { key: "webFilmLabPreview033", status: "released" },
  { key: "desktopFilmProcess040", status: "released" },
  { key: "quickProFilmStock040", status: "released" },
  { key: "videoTransport042", status: "released" },
  { key: "proPanelVocabulary042", status: "released" },
  { key: "fasterVideoExport043", status: "released" },
  { key: "progressivePreview051", status: "released" },
  { key: "portraitMotionBlur051", status: "released" },
  { key: "crossFilter060", status: "released" },
  { key: "proxyCacheAndVideoUx060", status: "released" },
  // In Development
  { key: "presetExpansion", status: "inDevelopment" },
  { key: "exportQuality", status: "inDevelopment" },
  { key: "verticalVideoExportQuality", status: "inDevelopment" },
  // Planned
  { key: "smartLookAi", status: "planned" },
  { key: "dngRawSupport", status: "planned" },
  { key: "windowsSupport", status: "planned" },
  { key: "lutExport", status: "planned" },
  { key: "filmDeveloperFuture", status: "planned" },
  // Considering
  { key: "mobileApp", status: "considering" },
  { key: "cloudSync", status: "considering" },
  { key: "pluginIntegration", status: "considering" },
];

const statusConfig: Record<RoadmapStatus, { badge: string; badgeClass: string }> = {
  released: {
    badge: "\u2705",
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
  inDevelopment: {
    badge: "\uD83D\uDD04",
    badgeClass: "border-blue-400/30 bg-blue-400/10 text-blue-400",
  },
  planned: {
    badge: "\uD83D\uDCCB",
    badgeClass: "border-amber-400/30 bg-amber-400/10 text-amber-400",
  },
  considering: {
    badge: "\uD83D\uDCA1",
    badgeClass: "border-purple-400/30 bg-purple-400/10 text-purple-400",
  },
};

const statusOrder: RoadmapStatus[] = ["released", "inDevelopment", "planned", "considering"];

export function FilmLabRoadmapContent() {
  const t = useTranslations("film-lab.roadmap");

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

      <div className="mt-12 space-y-10">
        {statusOrder.map((status) => {
          const group = items.filter((i) => i.status === status);
          if (group.length === 0) return null;
          const config = statusConfig[status];

          return (
            <section key={status}>
              <h2 className="flex items-center gap-2 text-lg font-medium text-white">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.badgeClass}`}
                >
                  {config.badge} {t(`categories.${status}`)}
                </span>
              </h2>
              <ul className="mt-4 space-y-3">
                {group.map((item) => (
                  <li
                    key={item.key}
                    className="rounded-2xl border border-white/8 bg-white/[0.035] p-4 sm:p-5"
                  >
                    <p className="text-sm font-medium text-white">
                      {t(`items.${item.key}.title`)}
                    </p>
                    <p className="mt-1 text-sm text-white/55">
                      {t(`items.${item.key}.description`)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <p className="mt-12 text-xs text-white/40">
        {t("disclaimer")}
      </p>

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
