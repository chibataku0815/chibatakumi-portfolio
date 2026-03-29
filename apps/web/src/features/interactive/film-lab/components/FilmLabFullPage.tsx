/**
 * @file /film-lab 専用のフルレイアウト。
 * @description ヒストグラム・共有パラメータ・比較 UI を含む。任意寄付（Stripe / BMC）・プレゼンモードは環境変数で有効化する。
 * @limitations 寄付 Phase 1 はリンクアウトのみ。決済成功のサーバ検証はない。
 */
"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { trackFilmLabDonationEvent } from "@/shared/analytics";
import type { Viewport } from "../core/Viewport";
import type { Params } from "../types";
import { filmLabDonationUiEnabled } from "../film-lab-donation-config";
import {
  filmLabCanShowLutBanner,
  filmLabCanShowPresetSaveModal,
  filmLabClearLutBannerPending,
  filmLabDismissPresentHint,
  filmLabHasLutBannerPending,
  filmLabMarkLutBannerShown,
  filmLabMarkPresetSaveModalOpened,
  filmLabReadPresentHintDismissed,
  filmLabReadPresentMode,
  filmLabSetLutBannerPending,
  filmLabWritePresentMode,
} from "../film-lab-donation-logic";

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

const FilmLabDonationLayer = dynamic(
  () => import("./FilmLabDonationLayer").then((m) => ({ default: m.FilmLabDonationLayer })),
  { ssr: false },
);

/**
 * @description Film Lab フルページ。コントロール直上に sampleHint を置く。コンテナは `max-w-7xl`（ナビと揃えつつ横幅を確保）。
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
  const locale = useLocale();
  const donationEnabled = useMemo(() => filmLabDonationUiEnabled(), []);

  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [histogramVisible, setHistogramVisible] = useState(true);
  /** 比較オン・編集スロット（キャンバス HUD 用） */
  const [compareUi, setCompareUi] = useState<{
    compareMode: boolean;
    activeSlot: "A" | "B";
  }>({ compareMode: false, activeSlot: "A" });

  const [presentMode, setPresentMode] = useState(false);
  const [presentHydrated, setPresentHydrated] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [lutBannerOpen, setLutBannerOpen] = useState(false);
  const [lutWaitInteraction, setLutWaitInteraction] = useState(false);
  const [showPresentHint, setShowPresentHint] = useState(false);

  const toggleHistogram = useCallback(() => {
    setHistogramVisible((prev) => !prev);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    /* eslint-disable react-hooks/set-state-in-effect -- URL / localStorage はクライアント専用のためマウント後に同期 */
    const params = new URLSearchParams(window.location.search);
    const p = params.get("present");
    if (p === "1" || p === "true") {
      setPresentMode(true);
      filmLabWritePresentMode(true);
    } else {
      setPresentMode(filmLabReadPresentMode());
    }
    if (p !== "1" && p !== "true" && !filmLabReadPresentMode() && !filmLabReadPresentHintDismissed()) {
      setShowPresentHint(true);
    }
    setPresentHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!presentHydrated) return;
    filmLabWritePresentMode(presentMode);
  }, [presentMode, presentHydrated]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- プレゼン ON 時に LUT 待ちを即リセット */
    if (presentMode) setLutWaitInteraction(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [presentMode]);

  const onLutLoadSuccess = useCallback(() => {
    if (!donationEnabled || presentMode) return;
    filmLabSetLutBannerPending();
    setLutWaitInteraction(true);
  }, [donationEnabled, presentMode]);

  useEffect(() => {
    if (!donationEnabled || presentMode || !lutWaitInteraction) return;

    const onFirstInteract = () => {
      if (!filmLabHasLutBannerPending()) {
        setLutWaitInteraction(false);
        return;
      }
      filmLabClearLutBannerPending();
      setLutWaitInteraction(false);
      if (!filmLabCanShowLutBanner()) return;
      setLutBannerOpen(true);
      filmLabMarkLutBannerShown();
      trackFilmLabDonationEvent("donation_nudge_impression", {
        surface: "lut_banner",
        locale,
        variant: "v1",
      });
    };

    const opts = { capture: true } as const;
    document.addEventListener("pointerdown", onFirstInteract, opts);
    document.addEventListener("keydown", onFirstInteract, opts);
    document.addEventListener("touchstart", onFirstInteract, opts);
    return () => {
      document.removeEventListener("pointerdown", onFirstInteract, opts);
      document.removeEventListener("keydown", onFirstInteract, opts);
      document.removeEventListener("touchstart", onFirstInteract, opts);
    };
  }, [donationEnabled, presentMode, lutWaitInteraction, locale]);

  const onBrowserSaveSuccess = useCallback(() => {
    if (!donationEnabled || presentMode) return;
    window.setTimeout(() => {
      if (!filmLabCanShowPresetSaveModal()) return;
      setSaveModalOpen(true);
      filmLabMarkPresetSaveModalOpened();
    }, 400);
  }, [donationEnabled, presentMode]);

  const dismissSaveModal = useCallback(() => setSaveModalOpen(false), []);

  const dismissPresentHint = useCallback(() => {
    filmLabDismissPresentHint();
    setShowPresentHint(false);
  }, []);

  const donationBinding = donationEnabled
    ? { presentMode, onPresentModeChange: setPresentMode }
    : undefined;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-20 pb-8 sm:px-6 sm:pt-32 sm:pb-12">
      {/* Canvas + Histogram overlay */}
      <div className="relative">
        <FilmLabCanvas
          preset="cinematic"
          initialGradeParams={initialSharedParams}
          onViewportReady={setViewport}
          compareHud={
            compareUi.compareMode ? { activeSlot: compareUi.activeSlot } : null
          }
          onCubeLutLoaded={donationEnabled ? onLutLoadSuccess : undefined}
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
          donationUi={donationBinding}
          onLutLoadSuccess={donationEnabled ? onLutLoadSuccess : undefined}
          onBrowserSaveSuccess={donationEnabled ? onBrowserSaveSuccess : undefined}
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

      {donationEnabled ? (
        <FilmLabDonationLayer
          locale={locale}
          presentMode={presentMode}
          saveModalOpen={saveModalOpen}
          onSaveModalClose={dismissSaveModal}
          lutBannerOpen={lutBannerOpen}
          onLutBannerDismiss={() => setLutBannerOpen(false)}
          showPresentHint={showPresentHint}
          onDismissPresentHint={dismissPresentHint}
        />
      ) : null}
    </div>
  );
}
