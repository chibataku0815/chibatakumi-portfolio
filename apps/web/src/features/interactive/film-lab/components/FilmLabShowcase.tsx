/**
 * @file Interactive ページ用の Film Lab 埋め込み。
 * @description キャンバスとコントロールを並べ、下に説明文とタグを出す。初見ユーザー向けに「サンプル画像であること」を一文で伝える。
 * @limitations フルページ版（/film-lab）ではない。WebGL は dynamic import でクライアントのみ。セクションの横パディングはモバイルで `px-4`、sm 以上で `px-6`（Film Lab 1B と整合）。
 */
"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import {
  FILMTONE_DEFAULT_BASE_LOOK,
  createFilmtoneDefaultParams,
} from "film-lab-core";
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

/**
 * @description Film Lab のデモ枠。説明の直後に sampleHint で DnD を促す。
 */
export function FilmLabShowcase() {
  const t = useTranslations("interactive.film-lab");
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const initialGradeParams = useMemo(() => createFilmtoneDefaultParams(), []);

  return (
    <section className="px-4 pb-16 sm:px-6 sm:pb-20">
      <div className="mx-auto max-w-5xl">
        {/* Canvas */}
        <FilmLabCanvas
          preset={FILMTONE_DEFAULT_BASE_LOOK}
          initialGradeParams={initialGradeParams}
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
            <p className="mt-2 text-xs leading-relaxed text-[var(--text-base-60)]">
              {t("sampleHint")}
            </p>
            <Link
              href="/filmtone"
              className="mt-3 inline-flex min-h-[44px] max-w-fit items-center justify-center rounded-lg border border-white/15 bg-white/5 px-4 text-sm text-[var(--text-base-70)] transition-colors hover:border-white/25 hover:bg-white/10 hover:text-[var(--text-base)]"
            >
              {t("openFullApp")}
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
