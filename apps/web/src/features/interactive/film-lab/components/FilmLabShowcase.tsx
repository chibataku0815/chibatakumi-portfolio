"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { PresetName } from "./FilmLabCanvas";

const FilmLabCanvas = dynamic(
  () => import("./FilmLabCanvas").then((m) => ({ default: m.FilmLabCanvas })),
  { ssr: false },
);

const FilmLabControls = dynamic(
  () =>
    import("./FilmLabControls").then((m) => ({ default: m.FilmLabControls })),
  { ssr: false },
);

const TAGS = [
  "Three.js",
  "GLSL",
  "WebGL2",
  "GPU",
  "Color Grading",
  "TypeScript",
];

export function FilmLabShowcase() {
  const t = useTranslations("interactive.film-lab");
  const [activePreset, setActivePreset] = useState<PresetName>("cinematic");

  return (
    <section className="px-6 pb-20">
      <div className="mx-auto max-w-5xl">
        {/* WebGL Canvas */}
        <FilmLabCanvas preset={activePreset} />

        {/* Preset Controls */}
        <FilmLabControls onPreset={setActivePreset} activePreset={activePreset} />

        {/* Description + Tags */}
        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <h2 className="text-xl font-semibold tracking-tight text-[var(--text-base)]">
              {t("title")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
              {t("description")}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 md:pt-1">
            {TAGS.map((tag) => (
              <span
                key={tag}
                className="rounded bg-white/5 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--text-base-60)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
