"use client";

/**
 * @file Film Lab の任意寄付 UI（フッター・保存後モーダル・LUT バナー・プレゼン用ヒント）。
 * @description 表示条件は親が持ち、本コンポーネントは描画とクリック計測のみ担当する。
 * @limitations Phase 1 は外部 URL へのリンクのみ。決済成功のサーバ検証はない。
 */

import { useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { trackFilmLabDonationEvent } from "@/shared/analytics";
import {
  filmLabDonationBmcUrl,
  filmLabDonationStripeUrl,
} from "../film-lab-donation-config";
import { filmLabMarkPresetSaveModalNever } from "../film-lab-donation-logic";

const VARIANT = "v1";

export type FilmLabDonationLayerProps = {
  /** ロケール（analytics 用） */
  locale: string;
  /** プレゼンモード ON のときは寄付 UI を一切出さない */
  presentMode: boolean;
  saveModalOpen: boolean;
  onSaveModalClose: () => void;
  lutBannerOpen: boolean;
  onLutBannerDismiss: () => void;
  /** 初回のみの「画面共有」ヒント */
  showPresentHint: boolean;
  onDismissPresentHint: () => void;
};

/**
 * 寄付用のフッター・モーダル・バナーをまとめたレイヤー。
 */
export function FilmLabDonationLayer({
  locale,
  presentMode,
  saveModalOpen,
  onSaveModalClose,
  lutBannerOpen,
  onLutBannerDismiss,
  showPresentHint,
  onDismissPresentHint,
}: FilmLabDonationLayerProps) {
  const t = useTranslations("film-lab.donation");
  const footerImpressionSent = useRef(false);

  const stripeUrl = filmLabDonationStripeUrl;
  const bmcUrl = filmLabDonationBmcUrl;

  useEffect(() => {
    if (presentMode || footerImpressionSent.current) return;
    if (!stripeUrl && !bmcUrl) return;
    footerImpressionSent.current = true;
    trackFilmLabDonationEvent("donation_nudge_impression", {
      surface: "footer",
      locale,
      variant: VARIANT,
    });
  }, [presentMode, stripeUrl, bmcUrl, locale]);

  useEffect(() => {
    if (!saveModalOpen) return;
    trackFilmLabDonationEvent("donation_nudge_impression", {
      surface: "preset_save_modal",
      locale,
      variant: VARIANT,
    });
  }, [saveModalOpen, locale]);

  const openStripe = useCallback(
    (surface: "footer" | "preset_save_modal" | "lut_banner") => {
      if (!stripeUrl) return;
      trackFilmLabDonationEvent("donation_nudge_cta_click", {
        surface,
        locale,
        variant: VARIANT,
        provider: "stripe",
      });
      window.open(stripeUrl, "_blank", "noopener,noreferrer");
    },
    [locale, stripeUrl],
  );

  const openBmc = useCallback(
    (surface: "footer" | "preset_save_modal" | "lut_banner") => {
      if (!bmcUrl) return;
      trackFilmLabDonationEvent("donation_nudge_cta_click", {
        surface,
        locale,
        variant: VARIANT,
        provider: "bmc",
      });
      window.open(bmcUrl, "_blank", "noopener,noreferrer");
    },
    [locale, bmcUrl],
  );

  const dismissModal = useCallback(
    (method: string) => {
      trackFilmLabDonationEvent("donation_nudge_dismiss", {
        surface: "preset_save_modal",
        locale,
        variant: VARIANT,
        method,
      });
      onSaveModalClose();
    },
    [locale, onSaveModalClose],
  );

  useEffect(() => {
    if (!saveModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissModal("escape");
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [saveModalOpen, dismissModal]);

  if (presentMode) {
    return null;
  }

  return (
    <>
      {(stripeUrl || bmcUrl) && (
        <footer
          className="mt-6 border-t border-[var(--text-base-20)] pt-4"
          aria-label={t("footer.ariaSupportSection")}
        >
          <p className="mb-2 text-xs leading-relaxed text-[var(--text-base-60)]">
            {t("footer.shortLine")}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            {stripeUrl ? (
              <button
                type="button"
                onClick={() => openStripe("footer")}
                className="text-[var(--accent-amber1)] underline decoration-white/20 underline-offset-2 transition-colors hover:decoration-[var(--accent-amber1)]"
                aria-label={t("footer.ariaOpenStripe")}
              >
                {t("footer.linkStripe")}
              </button>
            ) : null}
            {bmcUrl ? (
              <button
                type="button"
                onClick={() => openBmc("footer")}
                className="text-[var(--text-base-60)] underline decoration-white/15 underline-offset-2 transition-colors hover:text-[var(--text-base)]"
                aria-label={t("footer.ariaOpenBmc")}
              >
                {t("footer.linkBmc")}
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-[10px] leading-snug text-[var(--text-base-40)]">
            {t("legal_footer_short")}
          </p>
        </footer>
      )}

      {saveModalOpen ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) dismissModal("close");
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="film-lab-donation-modal-title"
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#0d0d0d] p-5 shadow-2xl"
          >
            <h2
              id="film-lab-donation-modal-title"
              className="text-base font-semibold text-[var(--text-base)]"
            >
              {t("preset_save_modal.title")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-base-70)]">
              {t("preset_save_modal.body")}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {stripeUrl ? (
                <button
                  type="button"
                  onClick={() => openStripe("preset_save_modal")}
                  className="rounded-xl bg-[var(--accent-amber1)] px-4 py-2.5 text-center text-sm font-medium text-black transition-opacity hover:opacity-90"
                >
                  {t("preset_save_modal.primaryStripe")}
                </button>
              ) : null}
              {bmcUrl ? (
                <button
                  type="button"
                  onClick={() => openBmc("preset_save_modal")}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-center text-sm text-white/85 transition-colors hover:bg-white/10"
                >
                  {t("preset_save_modal.secondaryBmc")}
                </button>
              ) : null}
            </div>
            <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => dismissModal("close")}
                className="text-left text-sm text-[var(--text-base-60)] hover:text-[var(--text-base)]"
              >
                {t("preset_save_modal.dismiss")}
              </button>
              <button
                type="button"
                onClick={() => {
                  filmLabMarkPresetSaveModalNever();
                  dismissModal("never");
                }}
                className="text-left text-sm text-[var(--text-base-40)] hover:text-[var(--text-base-60)]"
              >
                {t("preset_save_modal.neverShowAgain")}
              </button>
            </div>
            <p className="mt-3 text-[10px] text-[var(--text-base-40)]">
              {t("legal_footer_short")}
            </p>
          </div>
        </div>
      ) : null}

      {lutBannerOpen ? (
        <div
          className="fixed bottom-0 left-0 right-0 z-[190] border-t border-white/10 bg-black/85 px-4 py-3 backdrop-blur-md"
          role="status"
        >
          <div className="mx-auto flex max-w-6xl items-start justify-between gap-3 sm:items-center">
            <p className="text-xs leading-snug text-white/80">{t("lut_banner.message")}</p>
            <div className="flex shrink-0 items-center gap-2">
              {stripeUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    openStripe("lut_banner");
                  }}
                  className="rounded-lg bg-white/10 px-2 py-1 text-[10px] text-[var(--accent-amber1)]"
                >
                  {t("footer.linkStripe")}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  trackFilmLabDonationEvent("donation_nudge_dismiss", {
                    surface: "lut_banner",
                    locale,
                    variant: VARIANT,
                    method: "banner_dismiss",
                  });
                  onLutBannerDismiss();
                }}
                className="rounded-lg px-2 py-1 text-[10px] text-white/50 hover:text-white/80"
              >
                {t("lut_banner.dismiss")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showPresentHint && !presentMode ? (
        <div
          className="fixed bottom-3 left-3 right-3 z-[180] rounded-xl border border-white/10 bg-black/90 p-3 shadow-lg sm:left-auto sm:right-4 sm:max-w-md"
          role="status"
        >
          <p className="text-xs leading-relaxed text-white/85">{t("present_hint.body")}</p>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onDismissPresentHint}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-[11px] text-white/90 hover:bg-white/15"
            >
              {t("present_hint.dismiss")}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
