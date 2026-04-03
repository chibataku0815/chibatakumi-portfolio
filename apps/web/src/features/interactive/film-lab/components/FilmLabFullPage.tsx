/**
 * @file /film-lab 専用のフルレイアウト（Desktop-first LP + 下段 Web デモ）。
 * @description ヒーロー直下は 1 行ティーザーのみ（未完成の証拠ゾーンは置かない）。続けてデスクトップ価値 → Capabilities / Grid / Workflow → 補助として Web デモ（初期は Quick＋補助パネル折りたたみ）→ Trust / FAQ。任意寄付・プレゼンモードは環境変数で有効化する。
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
  type CSSProperties,
} from "react";
import { flushSync } from "react-dom";
import { FilmLabWebglPanelBackdrop, VideoTransportControls } from "film-lab-ui";
import type { FilmLabCanvasRef } from "./FilmLabCanvas";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { trackFilmLabDonationEvent } from "@/shared/analytics";
import type { Viewport } from "../core/Viewport";
import type { Params } from "../types";
import { FilmLabProofVideoCard } from "./FilmLabProofVideoCard";
import {
  filmLabDesktopArchitecture,
  filmLabDesktopDownloadRoute,
  filmLabDesktopMinimumMacos,
  filmLabDesktopSupportEmail,
} from "../desktop-release-info";
import { filmLabBuildProofVideoUrl } from "../film-lab-proof-videos";
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
import { isSafariOnlyForWebVideoExport } from "../film-lab-web-export-browser";
import {
  runFilmLabWebVideoExport,
  WebFilmLabExportError,
} from "../film-lab-web-video-export";

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
  () =>
    import("./FilmLabDonationLayer").then((m) => ({
      default: m.FilmLabDonationLayer,
    })),
  { ssr: false },
);

/**
 * @description Web `/film-lab` が最初に読む canonical sample asset です。
 * fallback を増やさず、この 1 本を直接読ませて rendering path を追えるようにします。
 */
const FILM_LAB_WEB_CANONICAL_SAMPLE_ASSET_URL = "/images/film-lab/default.jpg";

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
      <p className="sr-only">Filmtone を読み込み中</p>
      <div
        className="relative min-h-[min(70vh,560px)] w-full rounded-xl bg-white/[0.03]"
        aria-hidden
      />
      <div className="mt-3 space-y-2">
        <div
          className="h-3 w-2/3 max-w-md rounded bg-white/[0.06]"
          aria-hidden
        />
        <div
          className="min-h-[220px] w-full rounded-xl bg-white/[0.03]"
          aria-hidden
        />
      </div>
    </div>
  );
}

/**
 * @description Desktop 公開版の条件を Web の Film Lab ページで案内するカード。
 *   公開面は「価値 → 要件 → 行動（DL・問い合わせ）」までに留め、LUT/寄付/製品差分の細部はアプリ内ヘルプ等へ寄せる。
 *   DL 導線の視認性のため `film-lab-desktop-release-notice` でごく弱い box-shadow パルス（`globals.css`、 reduced-motion 時は停止）。
 * @limitations 実ファイル URL は固定ルート `/film-lab/download` 側で環境変数を見て解決します。
 * @param root0 - オプション
 * @param root0.suppressTopMargin - LP 内で trust 見出し直後に置くときなど、上マージンを消す
 */
function FilmLabDesktopReleaseNotice({
  suppressTopMargin = false,
}: { suppressTopMargin?: boolean } = {}) {
  const t = useTranslations("film-lab.desktopRelease");

  return (
    <section
      className={
        "film-lab-desktop-release-notice rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5 " +
        (suppressTopMargin ? "mt-0" : "mt-6")
      }
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
        {t("eyebrow")}
      </p>
      <h2 className="mt-2 text-lg font-semibold text-white">{t("title")}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/70">
        {t("body")}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-3 text-sm leading-relaxed text-white/85">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            {t("essentials.environmentLabel")}
          </p>
          <p className="mt-1 text-pretty">
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
          <p className="mt-1 text-pretty">{t("essentials.distributionBody")}</p>
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
    </section>
  );
}

/** Preset characteristic colors for the hero visual */
const HERO_PRESET_SWATCHES = [
  { n: "Cinematic", c: "#b87a3a" },
  { n: "Portra", c: "#c9a08e" },
  { n: "Gold", c: "#b89a4a" },
  { n: "Pro 400H", c: "#7a98aa" },
  { n: "Ektar", c: "#b85a3e" },
  { n: "Superia", c: "#6a906a" },
  { n: "CineStill", c: "#c48a42" },
  { n: "B&W", c: "#888" },
] as const;

/** Hero visual — stylized product mockup: macOS window + before/after + preset palette */
function FilmLabHeroVisual() {
  return (
    <div className="mx-auto mt-10 max-w-lg lg:max-w-2xl" aria-hidden>
      <div className="film-lab-liquid-glass overflow-hidden rounded-2xl">
        {/* macOS window chrome */}
        <div className="flex items-center gap-1.5 px-4 py-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="ml-auto text-[10px] text-white/25">Filmtone</span>
        </div>
        {/* Before / After split preview */}
        <div className="mx-2 flex overflow-hidden rounded-lg sm:mx-3">
          <div className="flex-1 bg-gradient-to-br from-[#8b9dc3]/20 to-[#6b7b9a]/10 px-3 pb-2 pt-16 sm:pt-20">
            <span className="block text-[10px] font-medium text-white/35">
              Original
            </span>
          </div>
          <div className="w-px bg-white/15" />
          <div className="flex-1 bg-gradient-to-br from-[#c4a35a]/20 to-[#8b6914]/10 px-3 pb-2 pt-16 text-right sm:pt-20">
            <span className="block text-[10px] font-medium text-white/35">
              Gold 200
            </span>
          </div>
        </div>
        {/* Preset palette strip */}
        <div className="flex items-center gap-2 px-3 py-3 sm:px-4">
          {HERO_PRESET_SWATCHES.map(({ n, c }) => (
            <div key={n} className="flex flex-col items-center gap-1">
              <div
                className="h-6 w-6 rounded-md border border-white/[0.06] sm:h-7 sm:w-7"
                style={{ background: c }}
              />
              <span className="hidden text-[7px] leading-none text-white/25 sm:block">
                {n}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
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
  /** LP（ヒーロー〜FAQ）。Hooks は early return より前で呼ぶ */
  const tLp = useTranslations("film-lab.lp");
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
  /** @description 右パネル `section.fl-card--frost` — WebGL 切り出しブラー PoC の矩形用 */
  const frostPanelSectionRef = useRef<HTMLElement | null>(null);
  /** LP では最初はオフ。詳しい調整を開いた人だけヒストグラムトグルが意味を持つ。 */
  const [histogramVisible, setHistogramVisible] = useState(false);
  /**
   * @description Desktop と同じく、広い画面では右パネルを開閉できるようにする。
   * 小さい画面では縦積みになるため、常に表示のまま使う。
   */
  const [editRightPaneExpanded, setEditRightPaneExpanded] = useState(true);
  /**
   * @description `lg` 以上かどうかを持ち、Desktop と同じ absolute overlay レイアウトへ切り替える。
   */
  const [isLgLayout, setIsLgLayout] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 1024px)").matches
      : false,
  );
  /** 比較オン・編集スロット（キャンバス HUD 用） */
  const [compareUi, setCompareUi] = useState<{
    compareMode: boolean;
    activeSlot: "A" | "B";
  }>({ compareMode: false, activeSlot: "A" });
  /** デモでユーザーが動画ファイルを開いているとき true（Web MP4 書き出しボタン用） */
  const [demoHasUserVideo, setDemoHasUserVideo] = useState(false);
  /** Web 動画書き出し中（プレビュー動画を止める） */
  const [webExportBusy, setWebExportBusy] = useState(false);
  const [webExportStatus, setWebExportStatus] = useState<string | null>(null);
  /** @description SSR とのズレを避けつつ、マウント後に Safari 単体か判定（Web VideoEncoder ベータは Chromium 想定） */
  const [clientSafariBlocksWebExport, setClientSafariBlocksWebExport] =
    useState(false);

  useEffect(() => {
    setClientSafariBlocksWebExport(isSafariOnlyForWebVideoExport());
  }, []);
  const demoCanvasStageStyle = useMemo<CSSProperties>(
    () =>
      isLgLayout
        ? {
            position: "absolute",
            inset: 0,
          }
        : {
            position: "relative",
            height: "min(70vh, 540px)",
          },
    [isLgLayout],
  );

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

  const handleWebVideoExport = useCallback(async () => {
    if (clientSafariBlocksWebExport) {
      setWebExportStatus(t("webExport.safariAttempted"));
      window.setTimeout(() => setWebExportStatus(null), 8000);
      return;
    }
    if (compareUi.compareMode) {
      setWebExportStatus(t("webExport.errorCompareMode"));
      return;
    }
    const vid = filmLabCanvasRef.current?.getActiveVideoElement();
    const vp = viewport;
    if (!vid || !vp) {
      setWebExportStatus(t("webExport.errorNoVideo"));
      return;
    }

    /**
     * @description `dynamic()` 越しの子は flushSync だけでは RAF 用 ref がまだ古い場合がある。
     *   `holdPreviewRendering` は同一コールスタックで `previewRenderingHoldRef` を立て、確実に `viewport.render` を止める。
     */
    filmLabCanvasRef.current?.holdPreviewRendering(true);
    /**
     * @description ツールバー無効化・`pauseVideoPreview`・`<video pause>`（useEffect）用。hold と併用。
     */
    flushSync(() => {
      setWebExportBusy(true);
      setWebExportStatus(t("webExport.preparing"));
    });

    try {
      await runFilmLabWebVideoExport({
        sourceVideo: vid,
        sourceViewport: vp,
        maxDurationSec: 90,
        targetFps: 30,
        maxLongEdge: 1920,
        onProgress: (p) => {
          if (p.phase === "encode") {
            setWebExportStatus(
              t("webExport.progressEncode", {
                current: p.frameIndex,
                total: p.frameCount,
              }),
            );
          } else if (p.phase === "finalize") {
            setWebExportStatus(t("webExport.finalizing"));
          }
        },
      });
      setWebExportStatus(t("webExport.done"));
      window.setTimeout(() => setWebExportStatus(null), 4000);
    } catch (err) {
      if (err instanceof WebFilmLabExportError) {
        const key =
          err.code === "TOO_LONG"
            ? "webExport.errorTooLong"
            : err.code === "NO_WEBCODECS"
              ? "webExport.errorNoWebCodecs"
              : "webExport.errorGeneric";
        setWebExportStatus(t(key, { message: err.message }));
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        setWebExportStatus(t("webExport.errorGeneric", { message: msg }));
      }
    } finally {
      setWebExportBusy(false);
      filmLabCanvasRef.current?.holdPreviewRendering(false);
    }
  }, [clientSafariBlocksWebExport, compareUi.compareMode, t, viewport]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQueryList = window.matchMedia("(min-width: 1024px)");
    const syncLayout = () => {
      setIsLgLayout(mediaQueryList.matches);
    };

    syncLayout();
    mediaQueryList.addEventListener("change", syncLayout);

    return () => {
      mediaQueryList.removeEventListener("change", syncLayout);
    };
  }, []);

  useEffect(() => {
    if (!isLgLayout) {
      setEditRightPaneExpanded(true);
    }
  }, [isLgLayout]);

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
      p === "1" ||
      p === "true" ||
      (p !== "0" && p !== "false" && filmLabReadPresentMode());
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
    const diagBefore = donationDebugOn
      ? filmLabDiagnosePresetSaveModal()
      : null;
    if (donationDebugOn) {
      filmLabDonationDebugLog("onBrowserSaveSuccess: 呼ばれた", {
        donationEnabled,
        presentMode,
        diagnoseBeforeTimeout: diagBefore,
      });
    }
    if (!donationEnabled) {
      filmLabDonationDevTrace(
        "onBrowserSaveSuccess: ここで終了（寄付 UI OFF のためコールバック未接続の可能性）",
        {
          hint: "NEXT_PUBLIC_* または Vercel の FILM_LAB_* を確認",
        },
      );
      if (donationDebugOn) {
        filmLabDonationDebugLog(
          "onBrowserSaveSuccess: 中止 — donationEnabled=false（env / FILM_LAB_* を確認）",
        );
      }
      return;
    }
    if (presentMode) {
      filmLabDonationDevTrace(
        "onBrowserSaveSuccess: ここで終了（プレゼンモード ON）",
      );
      if (donationDebugOn) {
        filmLabDonationDebugLog(
          "onBrowserSaveSuccess: 中止 — プレゼンモード ON",
        );
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
    filmLabDonationDevTrace("Filmtone クライアント UI をマウントしました", {
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
    filmLabDonationDebugLog("Filmtone 寄付デバッグ ON", {
      donationEnabled,
      stripeTierCount: resolvedDonation.stripeTiers.length,
      hasBmc: resolvedDonation.bmcUrl.length > 0,
      donationRuntimeFromServer: donationRuntime != null,
      presentMode,
      diagnose: filmLabDiagnosePresetSaveModal(),
    });
  }, [
    donationDebugOn,
    donationEnabled,
    donationRuntime,
    presentMode,
    resolvedDonation,
  ]);

  if (!filmLabClientReady) {
    return <FilmLabFullPageHydrationPlaceholder />;
  }

  return (
    <div className="film-lab-lp-body mx-auto w-full max-w-7xl px-4 pb-14 pt-14 sm:px-6 sm:pb-20 sm:pt-20">
      {/* ヒーロー — オーロラ背景 + liquid glass（/film-lab layout でフォント変数が有効） */}
      <section
        id="film-lab-hero"
        className="relative scroll-mt-28 overflow-hidden rounded-3xl sm:rounded-[2rem]"
        aria-labelledby="film-lab-hero-title"
      >
        <div
          className="film-lab-lp-hero-aurora pointer-events-none absolute inset-0"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-40 bg-gradient-to-b from-transparent to-[var(--bg-dark)]"
          aria-hidden
        />
        <div className="relative z-10 px-5 py-14 sm:px-10 sm:py-20 lg:px-12 lg:py-24">
          <div
            className="film-lab-liquid-glass relative z-10 inline-flex max-w-full flex-wrap items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4"
            aria-label={tLp("premiumHeroBadgeLine")}
          >
            <span className="rounded-full bg-white px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-neutral-950">
              {tLp("premiumHeroBadgeNew")}
            </span>
            <span className="text-xs text-white/85 sm:text-sm">
              {tLp("premiumHeroBadgeLine")}
            </span>
          </div>
          <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/40">
            {tLp("heroEyebrow")}
          </p>
          <h1
            id="film-lab-hero-title"
            className="film-lab-lp-heading-xl mt-3 max-w-4xl text-4xl text-white md:text-6xl lg:text-[4.25rem]"
          >
            {tLp("heroTitle")}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">
            {tLp("heroBody")}
          </p>
          <div className="relative z-10 mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={filmLabDesktopDownloadRoute}
              className="film-lab-liquid-glass-strong relative z-10 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-95"
            >
              {tLp("heroPrimaryCta")}
            </Link>
            <a
              href="#film-lab-demo"
              className="film-lab-liquid-glass relative z-10 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium text-white/90 transition-opacity hover:opacity-90"
            >
              {tLp("premiumCtaTryDemo")}
            </a>
          </div>
          <p className="mt-4 text-xs text-white/45">
            {tLp("heroSecondaryLine", { minMacos: filmLabDesktopMinimumMacos })}
          </p>
          <p className="mt-5 max-w-2xl text-xs leading-relaxed text-white/50 sm:text-sm">
            {tLp("proofTeaserLine")}
          </p>
          <FilmLabHeroVisual />
        </div>
      </section>

      {/* Desktop 価値 — ヒーロー直後で主戦場を肯定形で明示 */}
      <section
        id="film-lab-desktop-value"
        className="mt-16 scroll-mt-28 sm:mt-24"
        aria-labelledby="film-lab-value-title"
      >
        <h2
          id="film-lab-value-title"
          className="film-lab-lp-section-badge mb-6"
        >
          {tLp("valueTitle")}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {(["valueBullet1", "valueBullet2", "valueBullet3"] as const).map(
            (key) => (
              <div
                key={key}
                className="film-lab-liquid-glass relative z-10 rounded-2xl p-5"
              >
                <p className="film-lab-lp-body text-sm leading-relaxed text-white/70">
                  {tLp(key)}
                </p>
              </div>
            ),
          )}
        </div>
      </section>

      {/* Capabilities — 見出し + チェスレイアウト */}
      <section
        className="mt-20 sm:mt-28"
        aria-labelledby="film-lab-capabilities-title"
      >
        <p className="film-lab-lp-section-badge mb-3">
          {tLp("premiumCapabilitiesEyebrow")}
        </p>
        <h2
          id="film-lab-capabilities-title"
          className="film-lab-lp-heading-xl max-w-4xl text-3xl text-white md:text-5xl lg:text-6xl"
        >
          {tLp("premiumCapabilitiesTitle")}
        </h2>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h3 className="film-lab-lp-heading-xl text-2xl text-white md:text-3xl">
              {tLp("premiumFeature1Title")}
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-white/60 md:text-base">
              {tLp("premiumFeature1Body")}
            </p>
          </div>
          <div className="film-lab-liquid-glass relative z-10 overflow-hidden rounded-2xl">
            <FilmLabProofVideoCard
              src={filmLabBuildProofVideoUrl("gradedLookA")}
              title={tLp("premiumFeature1Title")}
            />
            <p className="film-lab-lp-body px-4 py-3 text-center text-xs text-white/45">
              {tLp("premiumMediaProofNote")}
            </p>
          </div>
        </div>

        <div className="mt-16 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="film-lab-liquid-glass relative z-10 order-2 overflow-hidden rounded-2xl lg:order-1">
            <FilmLabProofVideoCard
              src={filmLabBuildProofVideoUrl("gradedLookB")}
              title={tLp("premiumFeature2Title")}
            />
            <p className="film-lab-lp-body px-4 py-3 text-center text-xs text-white/45">
              {tLp("premiumMediaProofNote")}
            </p>
          </div>
          <div className="order-1 lg:order-2">
            <h3 className="film-lab-lp-heading-xl text-2xl text-white md:text-3xl">
              {tLp("premiumFeature2Title")}
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-white/60 md:text-base">
              {tLp("premiumFeature2Body")}
            </p>
          </div>
        </div>
      </section>

      {/* 4 カードグリッド */}
      <section className="mt-24 sm:mt-32" aria-labelledby="film-lab-grid-title">
        <p className="film-lab-lp-section-badge">{tLp("premiumGridEyebrow")}</p>
        <h2
          id="film-lab-grid-title"
          className="film-lab-lp-heading-xl mt-3 max-w-3xl text-3xl text-white md:text-5xl"
        >
          {tLp("premiumGridTitle")}
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["premiumCard1Title", "premiumCard1Body", "#b87a3a"],
              ["premiumCard2Title", "premiumCard2Body", "#c9a08e"],
              ["premiumCard3Title", "premiumCard3Body", "#7a98aa"],
              ["premiumCard4Title", "premiumCard4Body", "#888"],
            ] as const
          ).map(([titleKey, bodyKey, accent]) => (
            <div
              key={titleKey}
              className="film-lab-liquid-glass relative z-10 flex flex-col rounded-2xl p-6"
            >
              <div
                className="mb-3 h-1 w-8 rounded-full"
                style={{ background: accent }}
                aria-hidden
              />
              <h3 className="film-lab-lp-heading-xl text-lg text-white">
                {tLp(titleKey)}
              </h3>
              <p className="film-lab-lp-body mt-3 flex-1 text-sm leading-relaxed text-white/60">
                {tLp(bodyKey)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="film-lab-workflow-proof"
        className="mt-12 scroll-mt-28 sm:mt-16"
        aria-labelledby="film-lab-workflow-title"
      >
        <div className="film-lab-liquid-glass relative z-10 rounded-2xl p-6 sm:p-8">
          <h2
            id="film-lab-workflow-title"
            className="film-lab-lp-heading-xl text-xl text-white md:text-2xl"
          >
            {tLp("workflowTitle")}
          </h2>
          <p className="film-lab-lp-body mt-3 text-sm text-white/60">
            {tLp("workflowLead")}
          </p>
          <ul className="film-lab-lp-body mt-4 list-disc space-y-2 pl-5 text-sm text-white/65">
            <li>{tLp("workflowBullet1")}</li>
            <li>{tLp("workflowBullet2")}</li>
            <li>{tLp("workflowBullet3")}</li>
          </ul>
        </div>
      </section>

      <section
        id="film-lab-demo"
        className="relative left-1/2 right-1/2 mt-12 w-screen -translate-x-1/2 scroll-mt-28 border-t border-white/[0.06] pt-12 sm:mt-16 sm:pt-16"
        aria-labelledby="film-lab-demo-title"
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <p className="film-lab-lp-section-badge">{tLp("demoEyebrow")}</p>
          <h2
            id="film-lab-demo-title"
            className="film-lab-lp-heading-xl mt-3 text-2xl text-white md:text-4xl"
          >
            {tLp("demoTitle")}
          </h2>
          <p className="film-lab-lp-body mt-3 max-w-3xl text-sm leading-relaxed text-white/65 md:text-base">
            {tLp("demoBody")}
          </p>
        </div>

        {/* Desktop 同等: 読み物の container を抜け、canvas を viewport 幅いっぱいで見せる */}
        <div className="relative z-10 mt-8 w-full sm:px-6 lg:px-4">
          <div className="relative overflow-hidden bg-[#080808] shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:rounded-2xl sm:border sm:border-white/[0.06] lg:rounded-3xl">
            <div className="relative flex min-h-[440px] flex-col bg-[#080808] sm:min-h-[540px] lg:block lg:min-h-[720px] xl:min-h-[820px]">
              <section
                className="z-0 w-full min-w-0 overflow-hidden bg-[#080808]"
                style={demoCanvasStageStyle}
              >
                <FilmLabCanvas
                  ref={filmLabCanvasRef}
                  preset="cinematic"
                  chromeLayout="stacked"
                  stackedToolbarVisible={false}
                  defaultSampleAssetUrl={FILM_LAB_WEB_CANONICAL_SAMPLE_ASSET_URL}
                  className="h-full w-full"
                  fullScreen
                  initialGradeParams={initialSharedParams}
                  onViewportReady={setViewport}
                  pauseVideoPreview={webExportBusy}
                  onInteractiveSourceChange={(info) => {
                    if (info.kind === "file") {
                      const lower = info.fileName.toLowerCase();
                      setDemoHasUserVideo(/\.(mp4|webm|m4v|mov)$/.test(lower));
                    } else {
                      setDemoHasUserVideo(false);
                    }
                  }}
                  compareHud={
                    compareUi.compareMode
                      ? { activeSlot: compareUi.activeSlot }
                      : null
                  }
                  onCubeLutLoaded={
                    donationEnabled ? onLutLoadSuccess : undefined
                  }
                />
                <div
                  className={`pointer-events-none absolute left-4 z-10 ${demoHasUserVideo ? "bottom-14" : "bottom-4"}`}
                >
                  <Histogram
                    viewport={viewport}
                    visible={histogramVisible}
                    variant="inline"
                  />
                </div>
                <VideoTransportControls
                  filmLabCanvasRef={filmLabCanvasRef}
                  className="absolute bottom-0 left-0 right-0 z-[18]"
                />
              </section>

              {isLgLayout && !editRightPaneExpanded ? (
                <button
                  type="button"
                  className="fl-edit-pane-toggle-chip"
                  aria-label={t("openParamsPanelAria")}
                  aria-expanded={false}
                  aria-controls="film-lab-web-controls-pane"
                  title={t("openParamsPanelAria")}
                  onClick={() => setEditRightPaneExpanded(true)}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M4.75 5.75h14.5a1 1 0 0 1 1 1v10.5a1 1 0 0 1-1 1H4.75a1 1 0 0 1-1-1V6.75a1 1 0 0 1 1-1Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M15.5 5.75v12.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="m12.5 9.5-3 2.5 3 2.5"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    />
                  </svg>
                </button>
              ) : null}

              <div
                id="film-lab-web-controls-pane"
                role="complementary"
                aria-label={t("paramsPanelAria")}
                aria-hidden={Boolean(isLgLayout && !editRightPaneExpanded)}
                className={`flex min-h-0 w-full min-w-0 flex-1 flex-col max-lg:relative lg:absolute lg:inset-y-0 lg:right-0 lg:z-20 lg:w-[clamp(320px,42vw,680px)] lg:max-w-[min(680px,calc(100%-1.5rem))] lg:min-w-0 lg:flex-none lg:py-4 lg:pr-4 lg:transition-transform lg:duration-300 lg:ease-out motion-reduce:lg:transition-none ${
                  editRightPaneExpanded
                    ? "lg:translate-x-0"
                    : "lg:pointer-events-none lg:translate-x-full"
                }`}
              >
                <section
                  ref={frostPanelSectionRef}
                  className={`fl-card fl-card-muted fl-card--frost flex h-full min-h-0 min-w-0 flex-1 flex-col border-t border-white/[0.07] p-0 sm:border-t-0 lg:rounded-xl lg:border lg:border-white/[0.08] ${
                    isLgLayout && editRightPaneExpanded
                      ? "fl-card--frost-webgl-backdrop"
                      : ""
                  }`}
                >
                  {isLgLayout && editRightPaneExpanded ? (
                    <FilmLabWebglPanelBackdrop
                      filmLabCanvasRef={filmLabCanvasRef}
                      panelRef={frostPanelSectionRef}
                      enabled
                    />
                  ) : null}
                  <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[inherit]">
                  <div className="fl-edit-pane-toolbar hidden lg:flex">
                    <button
                      type="button"
                      className="fl-edit-pane-toolbar-btn"
                      aria-label={t("closeParamsPanelAria")}
                      aria-expanded={editRightPaneExpanded}
                      aria-controls="film-lab-web-controls-pane"
                      title={t("closeParamsPanelAria")}
                      onClick={() => setEditRightPaneExpanded(false)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden
                      >
                        <path
                          d="m9.25 7.5 5 4.5-5 4.5"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.9"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="fl-edit-pane-toolbar-btn"
                      aria-label={t("toolbar.open")}
                      title={t("toolbar.open")}
                      onClick={() => filmLabCanvasRef.current?.openMediaPicker()}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden
                      >
                        <path
                          d="M4 7.5A2.5 2.5 0 0 1 6.5 5H10l2 2H17.5A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z"
                          stroke="currentColor"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="fl-edit-pane-toolbar-btn"
                      aria-label={t("toolbar.savePng")}
                      title={t("toolbar.savePng")}
                      onClick={() => filmLabCanvasRef.current?.saveCurrentPng()}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden
                      >
                        <path
                          d="M12 7.25v7M9.25 11.5 12 14.25 14.75 11.5"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M6.5 19h11A1.5 1.5 0 0 0 19 17.5v-11A1.5 1.5 0 0 0 17.5 5h-11A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="fl-edit-pane-toolbar-btn disabled:opacity-35"
                      disabled={
                        !demoHasUserVideo ||
                        webExportBusy ||
                        compareUi.compareMode ||
                        clientSafariBlocksWebExport
                      }
                      aria-label={
                        clientSafariBlocksWebExport
                          ? t("webExport.exportTitleSafari")
                          : t("toolbar.exportMp4")
                      }
                      title={
                        clientSafariBlocksWebExport
                          ? t("webExport.exportTitleSafari")
                          : t("toolbar.exportMp4")
                      }
                      onClick={() => void handleWebVideoExport()}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden
                      >
                        <path
                          d="M7 4.75h10A2.25 2.25 0 0 1 19.25 7v6.5A2.25 2.25 0 0 1 17 15.75H7A2.25 2.25 0 0 1 4.75 13.5V7A2.25 2.25 0 0 1 7 4.75Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M9.75 18.25v2M14.25 18.25v2M9.5 20.25h5"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="1.5"
                        />
                        <path
                          d="m10.25 9.25 1.75 1.5 2.75-4"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </button>
                    <div className="flex flex-1" />
                  </div>
                  {clientSafariBlocksWebExport ? (
                    <p
                      className="border-b border-amber-500/15 px-3 py-1.5 text-[10px] leading-snug text-amber-200/90"
                      role="note"
                    >
                      {t("webExport.safariBanner")}
                    </p>
                  ) : null}
                  {webExportStatus ? (
                    <p
                      className="border-b border-white/6 px-3 py-1.5 text-[10px] leading-snug text-amber-200/90"
                      role="status"
                    >
                      {webExportStatus}
                    </p>
                  ) : null}
                  <div className="fl-scroll-surface min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 pr-5 lg:pr-8">
                    <ControlPanel
                      viewport={viewport}
                      histogramVisible={histogramVisible}
                      onHistogramToggle={toggleHistogram}
                      initialSharedParams={initialSharedParams}
                      onCompareUiChange={setCompareUi}
                      onLutLoadSuccess={
                        donationEnabled ? onLutLoadSuccess : undefined
                      }
                      onBrowserSaveSuccess={onBrowserSaveSuccess}
                      serverVerifiedSupporter={serverVerifiedSupporter}
                      filmLabCanvasRef={filmLabCanvasRef}
                      tryFirstLayout={initialSharedParams == null}
                      canvasHasUserVideo={demoHasUserVideo}
                    />
                  </div>
                  </div>
                </section>
              </div>
            </div>
            <div className="border-t border-white/[0.06] bg-black/60 px-4 py-2 lg:hidden">
              <p className="film-lab-lp-body text-xs leading-relaxed text-[var(--text-base-60)]">
                {t("sampleHint")}
              </p>
              {clientSafariBlocksWebExport ? (
                <p
                  className="mt-2 text-[10px] leading-snug text-amber-200/90"
                  role="note"
                >
                  {t("webExport.safariBanner")}
                </p>
              ) : null}
              {demoHasUserVideo ? (
                <button
                  type="button"
                  className="mt-2 w-full rounded-lg border border-white/12 bg-white/[0.06] px-3 py-2 text-xs text-white/85 disabled:opacity-40"
                  disabled={
                    webExportBusy ||
                    compareUi.compareMode ||
                    clientSafariBlocksWebExport
                  }
                  title={
                    clientSafariBlocksWebExport
                      ? t("webExport.exportTitleSafari")
                      : undefined
                  }
                  onClick={() => void handleWebVideoExport()}
                >
                  {t("toolbar.exportMp4")}
                </button>
              ) : null}
              {webExportStatus ? (
                <p
                  className="mt-2 text-[10px] leading-snug text-amber-200/90"
                  role="status"
                >
                  {webExportStatus}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section
        id="film-lab-desktop-trust"
        className="mt-16 scroll-mt-28 sm:mt-24"
        aria-labelledby="film-lab-trust-heading"
      >
        <h2
          id="film-lab-trust-heading"
          className="film-lab-lp-heading-xl text-xl text-white md:text-2xl"
        >
          {tLp("trustHeading")}
        </h2>
        <FilmLabDesktopReleaseNotice suppressTopMargin />
      </section>

      <section
        id="film-lab-faq"
        className="mt-14 scroll-mt-28 sm:mt-20"
        aria-labelledby="film-lab-faq-title"
      >
        <h2
          id="film-lab-faq-title"
          className="film-lab-lp-heading-xl text-xl text-white md:text-3xl"
        >
          {tLp("faqTitle")}
        </h2>
        <dl className="film-lab-lp-body mt-8 space-y-6 text-sm leading-relaxed">
          {(
            [
              ["faqQfree", "faqAfree"],
              ["faqQformats", "faqAformats"],
              ["faqQwhichVersion", "faqAwhichVersion"],
              ["faqQpresets", "faqApresets"],
              ["faqQvideo", "faqAvideo"],
              ["faqQwindows", "faqAwindows"],
            ] as const
          ).map(([qKey, aKey]) => (
            <div
              key={qKey}
              className="film-lab-liquid-glass relative z-10 rounded-2xl p-5 sm:p-6"
            >
              <dt className="font-medium text-white">{tLp(qKey)}</dt>
              <dd className="mt-2 text-white/65">{tLp(aKey)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <nav className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-8">
        <Link
          href="/film-lab/roadmap"
          className="film-lab-lp-body text-xs text-[var(--text-base-60)] transition-colors hover:text-[var(--text-base)]"
        >
          {tLp("roadmapLink")}
        </Link>
        <Link
          href="/film-lab/release-notes"
          className="film-lab-lp-body text-xs text-[var(--text-base-60)] transition-colors hover:text-[var(--text-base)]"
        >
          {tLp("releaseNotesLink")}
        </Link>
        <Link
          href="/interactive"
          className="film-lab-lp-body text-xs text-[var(--text-base-60)] transition-colors hover:text-[var(--text-base)]"
        >
          {t("back")}
        </Link>
      </nav>

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
