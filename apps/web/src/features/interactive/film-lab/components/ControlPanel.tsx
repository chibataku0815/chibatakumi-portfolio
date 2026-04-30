"use client";

/**
 * @file Web 版 ControlPanel — FilmLabControlPanelCore の薄いラッパー。
 *
 * Core（film-lab-ui）が reducer・スライダー・Compare・キーボードショートカット等
 * すべてのコア UI を提供し、Web 固有のセクション（BrowserStorage / SmartLook / Share）は
 * Core の render-prop slots に差し込む。
 *
 * Desktop の ControlPanel との構造的パリティを保ち、重複 UI（Open/Save/Histogram ツールバー等）
 * を排除する。キャンバスの overlay ツールバーが Open / Save を提供するため、
 * パネル内には同等の操作を重複して置かない。
 */

import React, {
  forwardRef,
  useState,
  useCallback,
  useEffect,
  startTransition,
  type RefObject,
} from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  FilmLabControlPanelCore,
  type FilmLabCoreRef,
  type FilmLabCoreRenderContext,
  type FilmLabDonationUiBinding,
} from "film-lab-ui";
import { findMatchingPreset, type PresetName } from "film-lab-core";
import type { Viewport } from "../core/Viewport";
import {
  filmLabShareUiEnabled,
  filmLabSmartLookUiEnabled,
} from "../feature-flags";
import { loadFilmLabStoredSession } from "../film-lab-browser-storage";
import type { Params } from "../types";
import { FilmLabBrowserStorageSection } from "./FilmLabBrowserStorageSection";
import { FilmLabShareSection } from "./FilmLabShareSection";
import type { FilmLabCanvasRef } from "./FilmLabCanvas";
import { FilmLabSmartLookSection } from "./FilmLabSmartLookSection";

export type { FilmLabCoreRef, FilmLabDonationUiBinding };

/* ── Props ────────────────────────────────────────────────────── */

interface ControlPanelProps {
  viewport: Viewport | null;
  histogramVisible?: boolean;
  onHistogramToggle?: () => void;
  initialSharedParams?: Params | null;
  onCompareUiChange?: (ui: {
    compareMode: boolean;
    activeSlot: "A" | "B";
  }) => void;
  donationUi?: FilmLabDonationUiBinding;
  onLutLoadSuccess?: () => void;
  onBrowserSaveSuccess?: () => void;
  serverVerifiedSupporter?: boolean;
  filmLabCanvasRef?: RefObject<FilmLabCanvasRef | null>;
  smartLookApiBaseUrl?: string;
  autoRestoreStoredSession?: boolean;
  tryFirstLayout?: boolean;
  /** @description ユーザー動画プレビュー中は Space を再生トグルへ回す（life#75） */
  canvasHasUserVideo?: boolean;
}

/* ── Main Component ───────────────────────────────────────────── */

export const ControlPanel = forwardRef<FilmLabCoreRef, ControlPanelProps>(function ControlPanel({
  viewport,
  histogramVisible = true,
  onHistogramToggle,
  initialSharedParams = null,
  onCompareUiChange,
  donationUi,
  onLutLoadSuccess,
  onBrowserSaveSuccess,
  serverVerifiedSupporter = false,
  filmLabCanvasRef,
  smartLookApiBaseUrl,
  autoRestoreStoredSession = true,
  tryFirstLayout = false,
  canvasHasUserVideo = false,
}: ControlPanelProps, ref: React.Ref<FilmLabCoreRef>) {
  const pathname = usePathname();
  const tFilmLab = useTranslations("film-lab");

  /**
   * LP（tryFirstLayout）でもデュアル LUT などを最初から見せる。クイック用の「補助パネルを閉じた初期状態」は廃止。
   */
  const [auxPanelsOpen, setAuxPanelsOpen] = useState(true);

  /**
   * LP では Quick / Pro を切り替えてもデュアル LUT を畳まない（hideAux を常に外す）。
   */
  const handleUiModeChange = useCallback(() => {
    if (!tryFirstLayout) {
      return;
    }
    setAuxPanelsOpen(true);
  }, [tryFirstLayout]);

  /* Smart Look の可視判定 */
  const smartLookPathOk =
    (pathname.includes("/filmtone") || pathname.includes("/film-lab")) && !pathname.includes("/support");
  const smartLookHasDesktopBff =
    typeof smartLookApiBaseUrl === "string" &&
    smartLookApiBaseUrl.trim().length > 0;
  const smartLookSlotAllowed =
    filmLabSmartLookUiEnabled &&
    filmLabCanvasRef != null &&
    (smartLookPathOk || smartLookHasDesktopBff);
  const smartLookProminent = smartLookHasDesktopBff;

  /* ── render-prop: Presets 直後 ─────────────────────────────── */
  const renderAfterPresets = useCallback(
    (ctx: FilmLabCoreRenderContext) => (
      <>
        {/* Auto-restore: renderAfterPresets は常に描画されるため確実に発火 */}
        <WebSessionAutoRestore
          ctx={ctx}
          initialSharedParams={initialSharedParams}
          autoRestore={autoRestoreStoredSession}
        />
        {smartLookSlotAllowed && smartLookProminent ? (
          <div className="mb-4 min-w-0 border-b border-white/[0.06] pb-4">
            <FilmLabSmartLookSection
              serverVerifiedSupporter={serverVerifiedSupporter}
              filmLabCanvasRef={filmLabCanvasRef!}
              activePreset={ctx.activePreset}
              activeSlotState={ctx.activeSlotState}
              dispatch={ctx.dispatch}
              smartLookApiBaseUrl={smartLookApiBaseUrl}
            />
          </div>
        ) : null}
      </>
    ),
    [
      initialSharedParams,
      autoRestoreStoredSession,
      smartLookSlotAllowed,
      smartLookProminent,
      serverVerifiedSupporter,
      filmLabCanvasRef,
      smartLookApiBaseUrl,
    ],
  );

  /* ── render-prop: LUT 直後 ─────────────────────────────────── */
  const renderAfterLut = useCallback(
    (ctx: FilmLabCoreRenderContext) => (
      <>
        <FilmLabBrowserStorageSection
          state={ctx.state}
          dispatch={ctx.dispatch}
          savedBloomStrength={ctx.savedBloomStrength}
          savedHalationIntensity={ctx.savedHalationIntensity}
          onAfterRestore={(payload) => {
            ctx.setSavedBloomStrength(payload.savedBloomStrength);
            ctx.setSavedHalationIntensity(payload.savedHalationIntensity);
            ctx.setActivePreset(payload.activePreset);
          }}
          onSaveSuccess={onBrowserSaveSuccess}
        />
        {smartLookSlotAllowed && !smartLookProminent ? (
          <FilmLabSmartLookSection
            serverVerifiedSupporter={serverVerifiedSupporter}
            filmLabCanvasRef={filmLabCanvasRef!}
            activePreset={ctx.activePreset}
            activeSlotState={ctx.activeSlotState}
            dispatch={ctx.dispatch}
            smartLookApiBaseUrl={smartLookApiBaseUrl}
          />
        ) : null}
        {filmLabShareUiEnabled ? (
          <FilmLabShareSection
            pathname={pathname}
            params={ctx.activeSlotState.params}
          />
        ) : null}
      </>
    ),
    [
      onBrowserSaveSuccess,
      smartLookSlotAllowed,
      smartLookProminent,
      serverVerifiedSupporter,
      filmLabCanvasRef,
      smartLookApiBaseUrl,
      pathname,
    ],
  );

  /* ── LP Expand Button ──────────────────────────────────────── */
  const lpExpandButton = tryFirstLayout ? (
    <button
      type="button"
      onClick={() => setAuxPanelsOpen(true)}
      className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3.5 text-left transition-colors hover:bg-white/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-amber1)]/50"
    >
      <span className="block text-[11px] font-semibold text-white/88">
        {tFilmLab("lp.expandAuxiliaryPanelsTitle")}
      </span>
      <span className="mt-1 block text-[10px] leading-snug text-white/48">
        {tFilmLab("lp.expandAuxiliaryPanelsHint")}
      </span>
    </button>
  ) : undefined;

  return (
    <FilmLabControlPanelCore
      ref={ref}
      viewport={viewport}
      histogramVisible={histogramVisible}
      onHistogramToggle={onHistogramToggle}
      surface="bare"
      initialSharedParams={initialSharedParams}
      onCompareUiChange={onCompareUiChange}
      onLutLoadSuccess={onLutLoadSuccess}
      defaultUiMode={tryFirstLayout ? "quick" : "pro"}
      onUiModeChange={handleUiModeChange}
      deferSpaceKeyToVideoTransportWhenNoCompare={canvasHasUserVideo}
      slots={{
        donationUi,
        hideAuxPanels: tryFirstLayout && !auxPanelsOpen,
        lpExpandButton,
        renderAfterPresets,
        renderAfterLut,
      }}
    />
  );
});

/* ── Internal: auto-restore localStorage session on mount ──── */

function WebSessionAutoRestore({
  ctx,
  initialSharedParams,
  autoRestore,
}: {
  ctx: FilmLabCoreRenderContext;
  initialSharedParams: Params | null;
  autoRestore: boolean;
}) {
  const { restoreSession } = ctx;

  useEffect(() => {
    if (initialSharedParams != null) return;
    if (!autoRestore) return;
    const session = loadFilmLabStoredSession();
    if (!session) return;
    startTransition(() => {
      const slot =
        session.present.activeSlot === "A"
          ? session.present.slotA
          : session.present.slotB;
      restoreSession({
        present: session.present,
        savedBloomStrength: session.savedBloomStrength,
        savedHalationIntensity: session.savedHalationIntensity,
        activePreset:
          slot.basePreset ??
          (findMatchingPreset(slot.params) as PresetName) ??
          "reset",
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only restore
  }, []);

  return null;
}
