/**
 * @file /film-lab 専用のフルレイアウト。
 * @description ヒストグラム・共有パラメータ・比較 UI を含む。任意寄付（Stripe / BMC）・プレゼンモードは環境変数で有効化する。
 * @limitations Phase 2 は Checkout 検証 Cookie（任意 env）。未設定時は Phase 1.5 の localStorage と同じ見え方。
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
import type { FilmLabCanvasRef } from "./FilmLabCanvas";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { trackFilmLabDonationEvent } from "@/shared/analytics";
import type { Viewport } from "../core/Viewport";
import type { Params } from "../types";
import {
  filmLabDesktopArchitecture,
  filmLabDesktopDownloadRoute,
  filmLabDesktopMinimumMacos,
  filmLabDesktopSupportEmail,
} from "../desktop-release-info";
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
  filmLabReadSupporterAck,
  filmLabSetLutBannerPending,
  filmLabWritePresentMode,
  filmLabWriteSupporterAck,
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
 * @description Desktop 公開版の条件を Web の Film Lab ページで案内するカード。情報順は
 *   「価値 → 要件 → 行動（DL・問い合わせ）→ 補足（3 点）→ リリースノート（SHA-256）」で、末尾が免責の羅列に見えないようにする。
 * @limitations 実ファイル URL は固定ルート `/film-lab/download` 側で環境変数を見て解決します。
 */
function FilmLabDesktopReleaseNotice() {
  const t = useTranslations("film-lab.desktopRelease");

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
        {t("eyebrow")}
      </p>
      <h2 className="mt-2 text-lg font-semibold text-white">{t("title")}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/70">{t("body")}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-3 text-sm leading-relaxed text-white/85">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            {t("essentials.environmentLabel")}
          </p>
          <p className="mt-1">
            {t("essentials.environmentBody", {
              minMacos: filmLabDesktopMinimumMacos,
              arch: filmLabDesktopArchitecture,
            })}
          </p>
        </div>
        <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-3 text-sm leading-relaxed text-white/85">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            {t("essentials.distributionLabel")}
          </p>
          <p className="mt-1">{t("essentials.distributionBody")}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link
          href={filmLabDesktopDownloadRoute}
          className="inline-flex items-center justify-center rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm text-white transition-colors hover:bg-white/14"
        >
          {t("downloadCta")}
        </Link>
        <a
          href={`mailto:${filmLabDesktopSupportEmail}`}
          className="text-sm text-white/70 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
        >
          {t("supportCtaPrefix")} {filmLabDesktopSupportEmail}
        </a>
      </div>

      <div className="mt-5 border-t border-white/10 pt-4">
        <h3 className="text-xs font-semibold text-white/75">{t("supplement.title")}</h3>
        <ul className="mt-2 list-disc space-y-2 pl-4 text-xs leading-relaxed text-white/60 marker:text-white/35">
          <li>{t("supplement.trust")}</li>
          <li>{t("supplement.handoff")}</li>
          <li>{t("supplement.browserAndDesktop")}</li>
        </ul>
      </div>

      <div className="mt-4 rounded-xl border border-white/6 bg-black/10 px-3 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
          {t("releaseNotesEyebrow")}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-white/55">{t("releaseNotesLead")}</p>
      </div>
    </section>
  );
}

/**
 * @description Film Lab フルページ。コントロール直上に sampleHint を置く。コンテナは `max-w-7xl`（ナビと揃えつつ横幅を確保）。
 * @param root0 - ルート props
 * @param root0.initialSharedParams - URL 共有から復元したグレード。null のときは通常の初期状態。
 * @param root0.donationRuntime - Vercel 実行時 env（`FILM_LAB_*`）。null のときはクライアントの NEXT_PUBLIC 埋め込みを使う。
 * @param root0.serverVerifiedSupporter - `verify` API で発行した httpOnly Cookie がサーバーで有効なとき true。
 */
export function FilmLabFullPage({
  initialSharedParams = null,
  donationRuntime = null,
  serverVerifiedSupporter = false,
}: {
  /** サーバーでデコードした ?p= の grade（子へ渡して hydration を揃える） */
  initialSharedParams?: Params | null;
  /** `film-lab/page.tsx` が `filmLabReadDonationEnvOnServer()` の結果を渡す（本番の再ビルドなし env 用） */
  donationRuntime?: FilmLabDonationRuntimeConfig | null;
  /** Phase 2: Checkout Session 検証済み Cookie（`FILM_LAB_DONATION_SIGNING_SECRET` 設定時のみ意味を持つ） */
  serverVerifiedSupporter?: boolean;
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
  const filmLabCanvasRef = useRef<FilmLabCanvasRef | null>(null);
  const [histogramVisible, setHistogramVisible] = useState(true);
  /** 比較オン・編集スロット（キャンバス HUD 用） */
  const [compareUi, setCompareUi] = useState<{
    compareMode: boolean;
    activeSlot: "A" | "B";
  }>({ compareMode: false, activeSlot: "A" });

  const [presentMode, setPresentMode] = useState(false);
  const [presentHydrated, setPresentHydrated] = useState(false);
  /** Phase 1.5: Thanks `donationThanks` または localStorage。Phase 2 Cookie とは別（`serverVerifiedSupporter`）。 */
  const [supporterAck, setSupporterAck] = useState(() =>
    typeof window !== "undefined" ? filmLabReadSupporterAck() : false,
  );
  /** Cookie 検証（サーバー）または Thanks クエリ / localStorage（クライアント）のいずれかでナッジ弱め。 */
  const supporterUi = useMemo(
    () => serverVerifiedSupporter || supporterAck,
    [serverVerifiedSupporter, supporterAck],
  );
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
    const thanksRaw = params.get("donationThanks");
    if (thanksRaw === "1" || thanksRaw === "true") {
      filmLabWriteSupporterAck();
      setSupporterAck(true);
      trackFilmLabDonationEvent("donation_supporter_ack", {
        locale,
        variant: "v1",
      });
      params.delete("donationThanks");
      const qs = params.toString();
      window.history.replaceState(
        {},
        "",
        window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash,
      );
    } else {
      setSupporterAck(filmLabReadSupporterAck());
    }

    const paramsAfterThanks = new URLSearchParams(window.location.search);
    const p = paramsAfterThanks.get("present");
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
  }, [locale]);

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
      if (supporterUi) return;
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
  }, [donationEnabled, presentMode, lutWaitInteraction, locale, supporterUi]);

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
          ref={filmLabCanvasRef}
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
          serverVerifiedSupporter={serverVerifiedSupporter}
          filmLabCanvasRef={filmLabCanvasRef}
        />
      </div>

      <FilmLabDesktopReleaseNotice />

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
          supporterAck={supporterUi}
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
