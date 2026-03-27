"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Viewport } from "../core/Viewport";

const FilmLabCanvas = dynamic(
  () => import("./FilmLabCanvas").then((m) => ({ default: m.FilmLabCanvas })),
  { ssr: false },
);

const ControlPanel = dynamic(
  () => import("./ControlPanel").then((m) => ({ default: m.ControlPanel })),
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
  const [viewport, setViewport] = useState<Viewport | null>(null);

  return (
    <section className="px-6 pb-20">
      <div className="mx-auto max-w-5xl">
        {/* Canvas */}
        <FilmLabCanvas
          preset="cinematic"
          onViewportReady={setViewport}
        />

        {/* ControlPanel（Canvas 直下） */}
        <div className="mt-3">
          <ControlPanel viewport={viewport} />
        </div>

        {/* Description + Tags（下） */}
        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <h2 className="text-xl font-semibold tracking-tight text-[var(--text-base)]">
              {t("title")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
              {t("description")}
            </p>
            <Link
              href="/film-lab"
              className="mt-3 inline-flex items-center gap-1 text-sm text-[var(--text-base-60)] transition-colors hover:text-[var(--text-base)]"
            >
              Open Full App →
            </Link>
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
