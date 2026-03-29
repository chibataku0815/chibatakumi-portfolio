"use client";

/**
 * @file Film Lab の任意寄付 UI（フッター・保存後モーダル・LUT バナー・プレゼン用ヒント）。
 * @description 表示条件は親が持ち、本コンポーネントは描画とクリック計測のみ担当する。
 * @limitations Phase 1 は外部 URL へのリンクのみ。Phase 1.5 は supporterAck で主 CTA を弱める（サーバ未検証）。
 */

import { useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { trackFilmLabDonationEvent } from "@/shared/analytics";
import type { FilmLabDonationStripeTier } from "../film-lab-donation-config";
import { filmLabMarkPresetSaveModalNever } from "../film-lab-donation-logic";

const VARIANT = "v1";

export type FilmLabDonationLayerProps = {
  /** Stripe 寄付リンク（親が env 埋め込み or サーバーから解決した配列を渡す） */
  stripeTiers: FilmLabDonationStripeTier[];
  /** Buy Me a Coffee URL（空なら非表示） */
  bmcUrl: string;
  /** ロケール（analytics 用） */
  locale: string;
  /** プレゼンモード ON のときは寄付 UI を一切出さない */
  presentMode: boolean;
  /** Thanks 戻り等で主ナッジ（黄 Stripe）を出さないモード */
  supporterAck: boolean;
  saveModalOpen: boolean;
  onSaveModalClose: () => void;
  lutBannerOpen: boolean;
  onLutBannerDismiss: () => void;
  /** 初回のみの「画面共有」ヒント */
  showPresentHint: boolean;
  onDismissPresentHint: () => void;
};

/**
 * @description 寄付用のフッター・モーダル・バナーをまとめたレイヤー。
 */
export function FilmLabDonationLayer({
  stripeTiers,
  bmcUrl,
  locale,
  presentMode,
  supporterAck,
  saveModalOpen,
  onSaveModalClose,
  lutBannerOpen,
  onLutBannerDismiss,
  showPresentHint,
  onDismissPresentHint,
}: FilmLabDonationLayerProps) {
  const t = useTranslations("film-lab.donation");
  const footerImpressionSent = useRef(false);
  const supporterFooterImpressionSent = useRef(false);

  const hasStripe = stripeTiers.length > 0;
  /** LUT バナーはスリムのため、既定は最も低い金額のリンクだけ出す */
  const lutBannerTier = stripeTiers[0] ?? null;

  useEffect(() => {
    if (presentMode) return;
    if (supporterAck) {
      if (supporterFooterImpressionSent.current) return;
      supporterFooterImpressionSent.current = true;
      trackFilmLabDonationEvent("donation_nudge_impression", {
        surface: "footer",
        locale,
        variant: VARIANT,
        nudge_mode: "supporter",
      });
      return;
    }
    if (footerImpressionSent.current) return;
    if (!hasStripe && !bmcUrl) return;
    footerImpressionSent.current = true;
    trackFilmLabDonationEvent("donation_nudge_impression", {
      surface: "footer",
      locale,
      variant: VARIANT,
      nudge_mode: "default",
    });
  }, [presentMode, supporterAck, hasStripe, bmcUrl, locale]);

  useEffect(() => {
    if (!saveModalOpen) return;
    trackFilmLabDonationEvent("donation_nudge_impression", {
      surface: "preset_save_modal",
      locale,
      variant: VARIANT,
      nudge_mode: supporterAck ? "supporter" : "default",
    });
  }, [saveModalOpen, locale, supporterAck]);

  const openStripeTier = useCallback(
    (
      surface: "footer" | "preset_save_modal" | "lut_banner",
      tier: FilmLabDonationStripeTier,
    ) => {
      trackFilmLabDonationEvent("donation_nudge_cta_click", {
        surface,
        locale,
        variant: VARIANT,
        nudge_mode: supporterAck ? "supporter" : "default",
        provider: "stripe",
        stripeTierUsd: String(tier.amountUsd),
      });
      window.open(tier.url, "_blank", "noopener,noreferrer");
    },
    [locale, supporterAck],
  );

  const openBmc = useCallback(
    (surface: "footer" | "preset_save_modal" | "lut_banner") => {
      if (!bmcUrl) return;
      trackFilmLabDonationEvent("donation_nudge_cta_click", {
        surface,
        locale,
        variant: VARIANT,
        nudge_mode: supporterAck ? "supporter" : "default",
        provider: "bmc",
      });
      window.open(bmcUrl, "_blank", "noopener,noreferrer");
    },
    [locale, bmcUrl, supporterAck],
  );

  const dismissModal = useCallback(
    (method: string) => {
      trackFilmLabDonationEvent("donation_nudge_dismiss", {
        surface: "preset_save_modal",
        locale,
        variant: VARIANT,
        nudge_mode: supporterAck ? "supporter" : "default",
        method,
      });
      onSaveModalClose();
    },
    [locale, onSaveModalClose, supporterAck],
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
      {(supporterAck || hasStripe || bmcUrl) && (
        <footer
          className="mt-6 border-t border-[var(--text-base-20)] pt-4"
          aria-label={t("footer.ariaSupportSection")}
        >
          <p className="mb-2 text-xs leading-relaxed text-[var(--text-base-60)]">
            {supporterAck ? t("supporter.footer_shortLine") : t("footer.shortLine")}
          </p>
          {!supporterAck ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              {stripeTiers.length === 1 ? (
                <button
                  type="button"
                  onClick={() => openStripeTier("footer", stripeTiers[0])}
                  className="text-[var(--accent-amber1)] underline decoration-white/20 underline-offset-2 transition-colors hover:decoration-[var(--accent-amber1)]"
                  aria-label={t("footer.ariaOpenStripe")}
                >
                  {t("footer.linkStripe")}
                </button>
              ) : (
                stripeTiers.map((tier) => (
                  <button
                    key={tier.amountUsd}
                    type="button"
                    onClick={() => openStripeTier("footer", tier)}
                    className="text-[var(--accent-amber1)] underline decoration-white/20 underline-offset-2 transition-colors hover:decoration-[var(--accent-amber1)]"
                    aria-label={t("footer.ariaOpenStripeTier", {
                      amountUsd: tier.amountUsd,
                    })}
                  >
                    {t("footer.linkStripeAmount", { amountUsd: tier.amountUsd })}
                  </button>
                ))
              )}
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
          ) : bmcUrl ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <button
                type="button"
                onClick={() => openBmc("footer")}
                className="text-[var(--text-base-60)] underline decoration-white/15 underline-offset-2 transition-colors hover:text-[var(--text-base)]"
                aria-label={t("footer.ariaOpenBmc")}
              >
                {t("footer.linkBmc")}
              </button>
            </div>
          ) : null}
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
              {supporterAck
                ? t("supporter.preset_save_modal_body")
                : t("preset_save_modal.body")}
            </p>
            {!supporterAck ? (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {stripeTiers.length === 1 ? (
                  <button
                    type="button"
                    onClick={() => openStripeTier("preset_save_modal", stripeTiers[0])}
                    className="rounded-xl bg-[var(--accent-amber1)] px-4 py-2.5 text-center text-sm font-medium text-black transition-opacity hover:opacity-90"
                  >
                    {t("preset_save_modal.primaryStripe")}
                  </button>
                ) : (
                  stripeTiers.map((tier) => (
                    <button
                      key={tier.amountUsd}
                      type="button"
                      onClick={() =>
                        openStripeTier("preset_save_modal", tier)
                      }
                      className="rounded-xl bg-[var(--accent-amber1)] px-4 py-2.5 text-center text-sm font-medium text-black transition-opacity hover:opacity-90"
                    >
                      {t("preset_save_modal.stripeTierLabel", {
                        amountUsd: tier.amountUsd,
                      })}
                    </button>
                  ))
                )}
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
            ) : bmcUrl ? (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => openBmc("preset_save_modal")}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-center text-sm text-white/85 transition-colors hover:bg-white/10"
                >
                  {t("preset_save_modal.secondaryBmc")}
                </button>
              </div>
            ) : null}
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
              {lutBannerTier ? (
                <button
                  type="button"
                  onClick={() => {
                    openStripeTier("lut_banner", lutBannerTier);
                  }}
                  className="rounded-lg bg-white/10 px-2 py-1 text-[10px] text-[var(--accent-amber1)]"
                >
                  {stripeTiers.length === 1
                    ? t("footer.linkStripe")
                    : t("footer.linkStripeAmount", {
                        amountUsd: lutBannerTier.amountUsd,
                      })}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  trackFilmLabDonationEvent("donation_nudge_dismiss", {
                    surface: "lut_banner",
                    locale,
                    variant: VARIANT,
                    nudge_mode: "default",
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
