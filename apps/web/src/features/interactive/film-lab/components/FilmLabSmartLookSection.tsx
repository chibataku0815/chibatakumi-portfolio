/**
 * @file スマートルック（支援者 + 同意 + 機能フラグ時のみ）。
 * @description キャンバスを JPEG 化して BFF に送り、返ったデルタを現在スロットに適用する。
 * @limitations 比較モードでもアクティブスロットのみ更新。OpenAI はサーバー env に依存。
 */

"use client";

import { useCallback, useState, type RefObject } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { FilmLabCanvasRef } from "./FilmLabCanvas";
import type { PresetName } from "../preset-data";
import type { Params } from "../types";
import type { Action, GradeSlotState } from "./film-lab-reducer";
import {
  FILM_LAB_SMART_LOOK_ERROR_CODES,
  SMART_LOOK_CONSENT_VERSION,
  applySmartLookDelta,
  filmLabReadSmartLookConsent,
  filmLabWriteSmartLookConsent,
  parseAndClampSmartLookDelta,
} from "../film-lab-smart-look";
import { filmLabSmartLookUiEnabled } from "../feature-flags";
import { trackFilmLabSmartLookEvent } from "@/shared/analytics";

export type FilmLabSmartLookSectionProps = {
  /** @description Stripe 検証済み Cookie がサーバーで true のときのみ true */
  serverVerifiedSupporter: boolean;
  filmLabCanvasRef: RefObject<FilmLabCanvasRef | null>;
  activePreset: PresetName;
  activeSlotState: GradeSlotState;
  dispatch: (a: Action) => void;
  /**
   * @description BFF のオリジン（`https://example.com`、末尾スラッシュなし）。未指定なら同一オリジン相対パス。
   */
  smartLookApiBaseUrl?: string;
};

/**
 * @description フルページ Film Lab 用のスマートルック行。
 */
/**
 * @description スマートルック POST の URL。デスクトップは絶対 URL、Web は相対で十分。
 */
function buildSmartLookPostUrl(apiBaseUrl: string | undefined): string {
  const trimmed = apiBaseUrl?.trim().replace(/\/$/, "") ?? "";
  return trimmed.length > 0
    ? `${trimmed}/api/film-lab/ai/smart-look`
    : "/api/film-lab/ai/smart-look";
}

export function FilmLabSmartLookSection({
  serverVerifiedSupporter,
  filmLabCanvasRef,
  activePreset,
  activeSlotState,
  dispatch,
  smartLookApiBaseUrl,
}: FilmLabSmartLookSectionProps) {
  const t = useTranslations("film-lab.smartLook");
  const locale = useLocale();
  const [consentChecked, setConsentChecked] = useState(() => filmLabReadSmartLookConsent());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onApply = useCallback(async () => {
    setError(null);
    if (!serverVerifiedSupporter || !filmLabSmartLookUiEnabled) {
      setError(t("supporterOnly"));
      return;
    }
    if (!consentChecked) {
      setError(t("needConsent"));
      return;
    }
    const hadConsent = filmLabReadSmartLookConsent();
    filmLabWriteSmartLookConsent();
    if (!hadConsent) {
      trackFilmLabSmartLookEvent("film_lab_smart_look_consent", {
        locale,
        version: SMART_LOOK_CONSENT_VERSION,
      });
    }

    const base64 = filmLabCanvasRef.current?.getJpegBase64ForAi(1024);
    if (!base64) {
      setError(t("needImage"));
      return;
    }

    setBusy(true);
    const t0 = typeof performance !== "undefined" ? performance.now() : 0;
    try {
      const res = await fetch(buildSmartLookPostUrl(smartLookApiBaseUrl), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presetId: activePreset,
          imageBase64: base64,
          mimeType: "image/jpeg",
          consentVersion: SMART_LOOK_CONSENT_VERSION,
          consentAcknowledged: true as const,
        }),
      });
      const latencyBucket =
        typeof performance !== "undefined"
          ? performance.now() - t0 < 3000
            ? "fast"
            : performance.now() - t0 < 8000
              ? "mid"
              : "slow"
          : "unknown";
      const json = (await res.json()) as {
        ok?: boolean;
        delta?: unknown;
        model?: string;
        code?: string;
      };

      if (!res.ok || !json.ok || json.delta === undefined) {
        const code = json.code ?? String(res.status);
        trackFilmLabSmartLookEvent("film_lab_smart_look_request", {
          locale,
          ok: false,
          provider: code,
          latency_bucket: latencyBucket,
          preset_id: activePreset,
        });
        if (code === FILM_LAB_SMART_LOOK_ERROR_CODES.rateLimitExceeded) {
          setError(t("errorRateLimit"));
        } else if (code === FILM_LAB_SMART_LOOK_ERROR_CODES.providerError) {
          setError(t("errorProvider"));
        } else if (code === FILM_LAB_SMART_LOOK_ERROR_CODES.smartLookInvalidResponse) {
          setError(t("errorInvalidResponse"));
        } else {
          setError(t("errorGeneric"));
        }
        return;
      }

      const delta = parseAndClampSmartLookDelta(json.delta);
      if (delta == null) {
        setError(t("errorGeneric"));
        return;
      }

      const merged = applySmartLookDelta(activeSlotState.params, delta);
      dispatch({
        type: "APPLY_PARAMS",
        params: merged,
        basePreset: activeSlotState.basePreset,
        intensity: activeSlotState.intensity,
      });

      trackFilmLabSmartLookEvent("film_lab_smart_look_request", {
        locale,
        ok: true,
        provider: json.model ?? "unknown",
        latency_bucket: latencyBucket,
        preset_id: activePreset,
      });
    } catch {
      setError(t("errorGeneric"));
      trackFilmLabSmartLookEvent("film_lab_smart_look_request", {
        locale,
        ok: false,
        provider: "network",
        latency_bucket: "unknown",
        preset_id: activePreset,
      });
    } finally {
      setBusy(false);
    }
  }, [
    activePreset,
    activeSlotState.basePreset,
    activeSlotState.intensity,
    activeSlotState.params,
    consentChecked,
    dispatch,
    filmLabCanvasRef,
    locale,
    serverVerifiedSupporter,
    smartLookApiBaseUrl,
    t,
  ]);

  if (!filmLabSmartLookUiEnabled) {
    return null;
  }

  if (!serverVerifiedSupporter) {
    return (
      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-[10px] leading-snug text-white/40">{t("supporterOnly")}</p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-amber-200/90">
        {t("sectionTitle")}
      </p>
      <p className="mt-1.5 text-[10px] leading-relaxed text-white/45">{t("consentHint")}</p>
      <label className="mt-2 flex cursor-pointer items-start gap-2 text-[10px] text-white/70">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={consentChecked}
          onChange={(e) => setConsentChecked(e.target.checked)}
        />
        <span>{t("consentLabel")}</span>
      </label>
      <button
        type="button"
        disabled={busy || !consentChecked}
        onClick={() => void onApply()}
        className="mt-3 w-full rounded-lg bg-amber-500/25 py-2.5 text-xs font-medium text-amber-100 transition-colors hover:bg-amber-500/35 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? t("busy") : t("applyButton")}
      </button>
      {error ? (
        <p className="mt-2 text-[10px] text-red-300/90" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
