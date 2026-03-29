/**
 * @file /film-lab 専用のフルレイアウト。
 * @description ヒストグラム・共有パラメータ・比較 UI を含む。初回訪問者向けにデフォルトはサンプル画像であることを明示する。
 * @limitations サーバー側の initialSharedParams とクライアント状態の整合に依存する。
 */
"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Viewport } from "../core/Viewport";
import type { Params } from "../types";

const FilmLabCanvas = dynamic(
  () => import("./FilmLabCanvas").then((m) => ({ default: m.FilmLabCanvas })),
  { ssr: false },
);

const ControlPanel = dynamic(
  () => import("./ControlPanel").then((m) => ({ default: m.ControlPanel })),
  { ssr: false },
);

const Histogram = dynamic(
  () => import("./ui/Histogram").then((m) => ({ default: m.Histogram })),
  { ssr: false },
);

/**
 * @description Film Lab フルページ。コントロール直上に sampleHint を置き、自分のメディアへの誘導を行う。
 * @param root0 - ルート props
 * @param root0.initialSharedParams - URL 共有から復元したグレード。null のときは通常の初期状態。
 */
export function FilmLabFullPage({
  initialSharedParams = null,
}: {
  /** サーバーでデコードした ?p= の grade（子へ渡して hydration を揃える） */
  initialSharedParams?: Params | null;
} = {}) {
  const t = useTranslations("film-lab");
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [histogramVisible, setHistogramVisible] = useState(true);
  /** 比較オン・編集スロット（キャンバス HUD 用） */
  const [compareUi, setCompareUi] = useState<{
    compareMode: boolean;
    activeSlot: "A" | "B";
  }>({ compareMode: false, activeSlot: "A" });

  const toggleHistogram = useCallback(() => {
    setHistogramVisible((prev) => !prev);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-20 pb-8 sm:px-6 sm:pt-32 sm:pb-12">
      {/* Canvas + Histogram overlay */}
      <div className="relative">
        <FilmLabCanvas
          preset="cinematic"
          initialGradeParams={initialSharedParams}
          onViewportReady={setViewport}
          compareHud={
            compareUi.compareMode ? { activeSlot: compareUi.activeSlot } : null
          }
        />
        <Histogram viewport={viewport} visible={histogramVisible} />
      </div>

      {/* ControlPanel */}
      <div className="mt-3">
        <p className="mb-2 text-xs leading-relaxed text-[var(--text-base-60)]">
          {t("sampleHint")}
        </p>
        <ControlPanel
          viewport={viewport}
          histogramVisible={histogramVisible}
          onHistogramToggle={toggleHistogram}
          initialSharedParams={initialSharedParams}
          onCompareUiChange={setCompareUi}
        />
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
