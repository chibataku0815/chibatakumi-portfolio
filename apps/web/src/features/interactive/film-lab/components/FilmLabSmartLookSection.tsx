/**
 * @file スマートルック（支援者 + 同意 + 機能フラグ時のみ）。
 * @description 編集プレビューと**参照画像**を BFF に送り、返ったデルタを **`computeSmartLookPresetBaseline` + 加算**で適用。`presetId` はプリセット土台の文脈、**スタイル目標は参照画像**（推奨仕様）。
 * @limitations 比較モードでもアクティブスロットのみ更新。OpenAI はサーバー env に依存。ラスタ差し替え成功時はデルタマージをスキップ。
 */

"use client";

import { useCallback, useRef, useState, type RefObject } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { FilmLabCanvasRef } from "./FilmLabCanvas";
import type { BaseLookName } from "../preset-data";
import type { Params } from "../types";
import type { Action, GradeSlotState } from "./film-lab-reducer";
import {
  FILM_LAB_SMART_LOOK_ERROR_CODES,
  SMART_LOOK_CONSENT_VERSION,
  applySmartLookDelta,
  computeSmartLookPresetBaseline,
  filmLabReadSmartLookConsent,
  filmLabWriteSmartLookConsent,
  parseAndClampSmartLookDelta,
} from "../film-lab-smart-look";
import {
  filmLabSmartLookRasterCorrectionEnabled,
  filmLabSmartLookUiEnabled,
} from "../feature-flags";
import { trackFilmLabSmartLookEvent } from "@/shared/analytics";
import { FilmLabInfoTip } from "./FilmLabInfoTip";

/**
 * @description フルページ Film Lab 用のスマートルック行。
 */
export type FilmLabSmartLookSectionProps = {
  /** @description Stripe 検証済み Cookie がサーバーで true のときのみ true */
  serverVerifiedSupporter: boolean;
  filmLabCanvasRef: RefObject<FilmLabCanvasRef | null>;
  activePreset: BaseLookName;
  activeSlotState: GradeSlotState;
  dispatch: (a: Action) => void;
  /**
   * @description BFF のオリジン（`https://example.com`、末尾スラッシュなし）。未指定なら同一オリジン相対パス。
   */
  smartLookApiBaseUrl?: string;
};

/**
 * @description スマートルック POST の URL。デスクトップは絶対 URL、Web は相対で十分。
 */
function buildSmartLookPostUrl(apiBaseUrl: string | undefined): string {
  const trimmed = apiBaseUrl?.trim().replace(/\/$/, "") ?? "";
  return trimmed.length > 0
    ? `${trimmed}/api/film-lab/ai/smart-look`
    : "/api/film-lab/ai/smart-look";
}

/**
 * @description ユーザーが選んだ参照ファイルを長辺 `maxLongEdge` に合わせて JPEG 化し、Base64 本文（data URL プレフィックスなし）を返す。
 * @param file - 参照スタイル用の画像ファイル
 * @param maxLongEdge - 送信サイズ抑制用の長辺ピクセル（例: 1024）
 */
async function resizeImageFileToJpegBase64ForSmartLook(
  file: File,
  maxLongEdge: number,
): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const w = bitmap.width;
    const h = bitmap.height;
    const scale = Math.min(1, maxLongEdge / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));
    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) {
      bitmap.close();
      return null;
    }
    ctx2d.drawImage(bitmap, 0, 0, tw, th);
    bitmap.close();
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    const comma = dataUrl.indexOf(",");
    if (comma === -1) return null;
    return dataUrl.slice(comma + 1);
  } catch (e) {
    console.error("FilmLabSmartLookSection.resizeImageFileToJpegBase64ForSmartLook", {
      fileName: file.name,
      message: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
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
  const referenceFileInputRef = useRef<HTMLInputElement | null>(null);
  const [consentChecked, setConsentChecked] = useState(() => filmLabReadSmartLookConsent());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** @description 参照スタイル用（JPEG Base64 本文）。未選択なら適用不可。 */
  const [referenceJpegBase64, setReferenceJpegBase64] = useState<string | null>(null);
  const [referenceLabel, setReferenceLabel] = useState<string | null>(null);

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
    if (!referenceJpegBase64) {
      setError(t("needReference"));
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
          currentGrade: activeSlotState.params,
          basePreset: activeSlotState.baseLook,
          intensity: activeSlotState.intensity,
          referenceImageBase64: referenceJpegBase64,
          referenceMimeType: "image/jpeg" as const,
          ...(filmLabSmartLookRasterCorrectionEnabled
            ? { includeRasterCorrection: true as const }
            : {}),
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
        correctedImagePngBase64?: string;
      };

      if (!res.ok || !json.ok || json.delta === undefined) {
        const code = json.code ?? String(res.status);
        trackFilmLabSmartLookEvent("film_lab_smart_look_request", {
          locale,
          ok: false,
          provider: code,
          latency_bucket: latencyBucket,
          preset_id: activePreset,
          reference_attached: true,
        });
        if (code === FILM_LAB_SMART_LOOK_ERROR_CODES.rateLimitExceeded) {
          setError(t("errorRateLimit"));
        } else if (code === FILM_LAB_SMART_LOOK_ERROR_CODES.forbiddenNotSupporter) {
          setError(t("supporterOnly"));
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

      const rasterB64 = json.correctedImagePngBase64;
      if (
        filmLabSmartLookRasterCorrectionEnabled &&
        typeof rasterB64 === "string" &&
        rasterB64.length > 64
      ) {
        const replaced = await filmLabCanvasRef.current?.replaceSourceFromPngBase64Body(rasterB64);
        if (replaced) {
          trackFilmLabSmartLookEvent("film_lab_smart_look_request", {
            locale,
            ok: true,
            provider: json.model ?? "unknown",
            latency_bucket: latencyBucket,
            preset_id: activePreset,
            raster_applied: true,
            reference_attached: true,
          });
          return;
        }
      }

      const mergeBase = computeSmartLookPresetBaseline({
        targetPresetId: activePreset,
        slotBasePreset: activeSlotState.baseLook,
        slotIntensity: activeSlotState.intensity,
      });
      const merged = applySmartLookDelta(mergeBase, delta);
      const alignedToTargetPreset = activeSlotState.baseLook === activePreset;
      dispatch({
        type: "APPLY_PARAMS",
        params: merged,
        baseLook: activePreset,
        intensity: alignedToTargetPreset ? activeSlotState.intensity : 1,
      });

      trackFilmLabSmartLookEvent("film_lab_smart_look_request", {
        locale,
        ok: true,
        provider: json.model ?? "unknown",
        latency_bucket: latencyBucket,
        preset_id: activePreset,
        raster_applied: false,
        reference_attached: true,
      });
    } catch {
      setError(t("errorGeneric"));
      trackFilmLabSmartLookEvent("film_lab_smart_look_request", {
        locale,
        ok: false,
        provider: "network",
        latency_bucket: "unknown",
        preset_id: activePreset,
        reference_attached: referenceJpegBase64 != null,
      });
    } finally {
      setBusy(false);
    }
  }, [
    activePreset,
    activeSlotState.baseLook,
    activeSlotState.intensity,
    activeSlotState.params,
    consentChecked,
    dispatch,
    filmLabCanvasRef,
    locale,
    referenceJpegBase64,
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
      <div className="mt-1.5 flex items-start gap-1.5">
        <p className="min-w-0 flex-1 text-[10px] leading-snug text-white/45">{t("consentSummary")}</p>
        <FilmLabInfoTip tip={t("consentHint")} assistiveLabel={t("consentInfoAria")} />
      </div>
      <input
        ref={referenceFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          void (async () => {
            if (!file) return;
            const out = await resizeImageFileToJpegBase64ForSmartLook(file, 1024);
            if (out) {
              setReferenceJpegBase64(out);
              setReferenceLabel(file.name);
              setError(null);
            } else {
              setError(t("errorReferenceRead"));
            }
          })();
          e.target.value = "";
        }}
      />
      <div className="mt-2 flex items-start gap-1.5">
        <p className="min-w-0 flex-1 text-[10px] leading-snug text-white/50">{t("referenceSummary")}</p>
        <FilmLabInfoTip tip={t("referenceTooltip")} assistiveLabel={t("referenceInfoAria")} />
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => referenceFileInputRef.current?.click()}
          className="rounded-lg border border-white/15 bg-white/[0.06] px-2.5 py-1.5 text-[10px] font-medium text-white/80 hover:bg-white/[0.1] disabled:opacity-40"
        >
          {t("referencePickButton")}
        </button>
        {referenceLabel ? (
          <span className="max-w-[180px] truncate text-[10px] text-amber-100/80" title={referenceLabel}>
            {referenceLabel}
          </span>
        ) : null}
        {referenceJpegBase64 ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setReferenceJpegBase64(null);
              setReferenceLabel(null);
            }}
            className="text-[10px] text-white/40 underline hover:text-white/60 disabled:opacity-40"
          >
            {t("referenceClear")}
          </button>
        ) : null}
      </div>
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
        disabled={busy || !consentChecked || !referenceJpegBase64}
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
