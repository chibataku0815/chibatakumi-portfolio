/**
 * @file /film-lab 専用のフルレイアウト。
 * @description ヒストグラム・共有パラメータ・比較 UI を含む。任意寄付（Stripe / BMC）・プレゼンモードは環境変数で有効化する。
 * @limitations 寄付 Phase 1 はリンクアウトのみ。決済成功のサーバ検証はない。
 */
"use client";

import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { trackFilmLabDonationEvent } from "@/shared/analytics";
import type { Viewport } from "../core/Viewport";
import type { Params } from "../types";
import {
  filmLabDonationBmcUrl,
  filmLabDonationClientPublicEnvStatus,
  filmLabDonationStripeTiers,
  filmLabDonationUiEnabled,
  filmLabDonationUiEnabledFromRuntimePartial,
  type FilmLabDonationRuntimeConfig,
} from "../film-lab-donation-config";
import {
  filmLabDiagnosePresetSaveModal,
  filmLabDonationDebugLog,
  filmLabDonationDebugUserFlag,
  filmLabDonationDevTrace,
} from "../film-lab-donation-debug";
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
import { FilmLabDonationDebugPanel } from "./FilmLabDonationDebugPanel";

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
 * @description `useSyncExternalStore` 用の空購読（外部ソース無し・常に再描画しない）。
 * @returns {() => void} unsubscribe 関数（no-op）
 */
function filmLabEmptySubscribe(): () => void {
  return () => {};
}

/**
 * @description Canvas / ControlPanel など `dynamic(..., ssr: false)` だけだとサーバーは Suspense 系、
 *   クライアントは別ツリーになりハイドレーションが壊れる。サーバーと「ハイドレーション初回」の描画を
 *   同じプレースホルダに揃え、マウント完了後に本 UI を出す。
 */
function FilmLabFullPageHydrationPlaceholder() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-20 pb-8 sm:px-6 sm:pt-32 sm:pb-12">
      <p className="sr-only">Film Lab を読み込み中</p>
      <div
        className="relative min-h-[min(70vh,560px)] w-full rounded-xl bg-white/[0.03]"
        aria-hidden
      />
      <div className="mt-3 space-y-2">
        <div className="h-3 w-2/3 max-w-md rounded bg-white/[0.06]" aria-hidden />
        <div className="min-h-[220px] w-full rounded-xl bg-white/[0.03]" aria-hidden />
      </div>
    </div>
  );
}

/**
 * @description Film Lab フルページ。コントロール直上に sampleHint を置く。コンテナは `max-w-7xl`（ナビと揃えつつ横幅を確保）。
 * @param root0 - ルート props
 * @param root0.initialSharedParams - URL 共有から復元したグレード。null のときは通常の初期状態。
 * @param root0.donationRuntime - Vercel 実行時 env（`FILM_LAB_*`）。null のときはクライアントの NEXT_PUBLIC 埋め込みを使う。
 */
export function FilmLabFullPage({
  initialSharedParams = null,
  donationRuntime = null,
}: {
  /** サーバーでデコードした ?p= の grade（子へ渡して hydration を揃える） */
  initialSharedParams?: Params | null;
  /** `film-lab/page.tsx` が `filmLabReadDonationEnvOnServer()` の結果を渡す（本番の再ビルドなし env 用） */
  donationRuntime?: FilmLabDonationRuntimeConfig | null;
} = {}) {
  const t = useTranslations("film-lab");
  const locale = useLocale();
  const resolvedDonation = useMemo(() => {
    if (donationRuntime != null) {
      return {
        enabled: filmLabDonationUiEnabledFromRuntimePartial(donationRuntime),
        stripeTiers: donationRuntime.stripeTiers,
        bmcUrl: donationRuntime.bmcUrl,
      };
    }
    return {
      enabled: filmLabDonationUiEnabled(),
      stripeTiers: filmLabDonationStripeTiers,
      bmcUrl: filmLabDonationBmcUrl,
    };
  }, [donationRuntime]);
  const donationEnabled = resolvedDonation.enabled;

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
  const filmLabDevClientUiLoggedRef = useRef(false);
  /**
   * 詳細パネル＋`[FilmLab donation debug]` ログ — URL / localStorage / NEXT_PUBLIC で ON。
   * SSR・ハイドレーション初回は false（getServerSnapshot）。
   */
  const donationDebugOn = useSyncExternalStore(
    filmLabEmptySubscribe,
    () => filmLabDonationDebugUserFlag(),
    () => false,
  );

  const toggleHistogram = useCallback(() => {
    setHistogramVisible((prev) => !prev);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    /* eslint-disable react-hooks/set-state-in-effect -- URL / localStorage はクライアント専用のためマウント後に同期 */
    const params = new URLSearchParams(window.location.search);
    const p = params.get("present");
    /** URL で明示 OFF（寄付 UI 無効時でもプレゼン解除できるようにする） */
    if (p === "0" || p === "false") {
      setPresentMode(false);
      filmLabWritePresentMode(false);
    } else if (p === "1" || p === "true") {
      setPresentMode(true);
      filmLabWritePresentMode(true);
    } else {
      setPresentMode(filmLabReadPresentMode());
    }
    const presentOn =
      p === "1" || p === "true" || (p !== "0" && p !== "false" && filmLabReadPresentMode());
    if (!presentOn && !filmLabReadPresentHintDismissed()) {
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
    filmLabDonationDevTrace("onBrowserSaveSuccess: 呼び出し", {
      donationEnabled,
      presentMode,
    });
    const diagBefore = donationDebugOn ? filmLabDiagnosePresetSaveModal() : null;
    if (donationDebugOn) {
      filmLabDonationDebugLog("onBrowserSaveSuccess: 呼ばれた", {
        donationEnabled,
        presentMode,
        diagnoseBeforeTimeout: diagBefore,
      });
    }
    if (!donationEnabled) {
      filmLabDonationDevTrace("onBrowserSaveSuccess: ここで終了（寄付 UI OFF のためコールバック未接続の可能性）", {
        hint: "NEXT_PUBLIC_* または Vercel の FILM_LAB_* を確認",
      });
      if (donationDebugOn) {
        filmLabDonationDebugLog(
          "onBrowserSaveSuccess: 中止 — donationEnabled=false（env / FILM_LAB_* を確認）",
        );
      }
      return;
    }
    if (presentMode) {
      filmLabDonationDevTrace("onBrowserSaveSuccess: ここで終了（プレゼンモード ON）");
      if (donationDebugOn) {
        filmLabDonationDebugLog("onBrowserSaveSuccess: 中止 — プレゼンモード ON");
      }
      return;
    }
    window.setTimeout(() => {
      const d = filmLabDiagnosePresetSaveModal();
      filmLabDonationDevTrace("onBrowserSaveSuccess: 400ms 後", {
        canOpenModal: filmLabCanShowPresetSaveModal(),
        diagnose: d,
      });
      if (donationDebugOn) {
        filmLabDonationDebugLog("onBrowserSaveSuccess: 400ms 後のゲート", d);
      }
      if (!filmLabCanShowPresetSaveModal()) return;
      setSaveModalOpen(true);
      filmLabMarkPresetSaveModalOpened();
    }, 400);
  }, [donationDebugOn, donationEnabled, presentMode]);

  const dismissSaveModal = useCallback(() => setSaveModalOpen(false), []);

  const openDonationModalForDebug = useCallback(() => {
    setSaveModalOpen(true);
  }, []);

  const dismissPresentHint = useCallback(() => {
    filmLabDismissPresentHint();
    setShowPresentHint(false);
  }, []);

  const filmLabClientReady = useSyncExternalStore(
    filmLabEmptySubscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!filmLabClientReady || filmLabDevClientUiLoggedRef.current) return;
    filmLabDevClientUiLoggedRef.current = true;
    filmLabDonationDevTrace("Film Lab クライアント UI をマウントしました", {
      donationEnabled,
      stripeTierCount: resolvedDonation.stripeTiers.length,
      runtimeFromServer: donationRuntime != null,
      embeddedPublicEnv: filmLabDonationClientPublicEnvStatus(),
      ifDonationOff:
        "apps/web/.env.local に NEXT_PUBLIC_FILM_LAB_STRIPE_SUPPORT_URL（または FILM_LAB_STRIPE_SUPPORT_URL）を入れて dev 再起動。サーバーが読んで donationRuntime で渡す（パネルの embedded が empty でも donationEnabled は true になりうる）",
      howToVerboseDebug:
        "?filmLabDebugDonation=1 または localStorage.setItem('filmLabDebugDonation','1') でパネル表示",
    });
  }, [
    filmLabClientReady,
    donationEnabled,
    donationRuntime,
    resolvedDonation.stripeTiers.length,
  ]);

  useEffect(() => {
    if (!donationDebugOn) return;
    filmLabDonationDebugLog("Film Lab 寄付デバッグ ON", {
      donationEnabled,
      stripeTierCount: resolvedDonation.stripeTiers.length,
      hasBmc: resolvedDonation.bmcUrl.length > 0,
      donationRuntimeFromServer: donationRuntime != null,
      presentMode,
      diagnose: filmLabDiagnosePresetSaveModal(),
    });
  }, [donationDebugOn, donationEnabled, donationRuntime, presentMode, resolvedDonation]);

  /**
   * プレゼンモードは寄付より独立: env で寄付を止めてもコントロールパネルから OFF にできないと
   * localStorage が ON のまま固定され、寄付フッター・保存後モーダルが永続的に出ない。
   */
  const presentModeBinding = {
    presentMode,
    onPresentModeChange: setPresentMode,
  };

  if (!filmLabClientReady) {
    return <FilmLabFullPageHydrationPlaceholder />;
  }

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
          donationUi={presentModeBinding}
          onLutLoadSuccess={donationEnabled ? onLutLoadSuccess : undefined}
          onBrowserSaveSuccess={onBrowserSaveSuccess}
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
          stripeTiers={resolvedDonation.stripeTiers}
          bmcUrl={resolvedDonation.bmcUrl}
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

      {donationDebugOn ? (
        <FilmLabDonationDebugPanel
          donationEnabled={donationEnabled}
          stripeTierCount={resolvedDonation.stripeTiers.length}
          hasBmc={resolvedDonation.bmcUrl.length > 0}
          runtimeFromServer={donationRuntime != null}
          presentMode={presentMode}
          saveModalOpen={saveModalOpen}
          onTestOpenModal={openDonationModalForDebug}
        />
      ) : null}
    </div>
  );
}
