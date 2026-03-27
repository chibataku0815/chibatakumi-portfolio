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

export function FilmLabFullPage() {
  const t = useTranslations("film-lab");
  const [viewport, setViewport] = useState<Viewport | null>(null);

  return (
    <div className="mx-auto max-w-6xl px-6 pt-32 pb-12">
      {/* Canvas */}
      <FilmLabCanvas
        preset="cinematic"
        onViewportReady={setViewport}
      />

      {/* ControlPanel */}
      <div className="mt-3">
        <ControlPanel viewport={viewport} />
      </div>

      {/* Back link */}
      <div className="mt-6">
        <Link
          href="/interactive"
          className="text-xs text-[var(--text-base-60)] transition-colors hover:text-[var(--text-base)]"
        >
          {t("back")}
        </Link>
      </div>
    </div>
  );
}
