"use client";

/**
 * Film Lab — このブラウザへの保存・読み込み・消去 UI
 *
 * 概要: localStorage に盤面を書き出す。Save は明示ボタン、初回訪問時の自動復元は親の useEffect が担当。
 * 制限: LUT は保存されない。容量超過時はエラーメッセージを出す。
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { findMatchingBaseLook, type BaseLookName } from "film-lab-core";
import {
  isFilmLabDonationDebugEnabled,
  filmLabDonationDebugLog,
  filmLabDonationDevTrace,
} from "../film-lab-donation-debug";
import {
  clearFilmLabStoredSession,
  hasFilmLabStoredSession,
  loadFilmLabStoredSession,
  saveFilmLabStoredSession,
} from "../film-lab-browser-storage";
import {
  toPresentSnapshot,
  type Action,
  type PresentState,
  type State,
} from "./film-lab-reducer";
import { SectionHeader } from "film-lab-ui";

interface FilmLabBrowserStorageSectionProps {
  /** reducer の現在状態（保存に使う） */
  state: State;
  dispatch: React.Dispatch<Action>;
  savedBloomStrength: number;
  savedHalationIntensity: number;
  /** 復元後に Base Look 表示・Bloom 記憶を揃える */
  onAfterRestore: (payload: {
    savedBloomStrength: number;
    savedHalationIntensity: number;
    activePreset: BaseLookName;
  }) => void;
  /** 「このブラウザに保存」が成功した直後（任意寄付モーダル用） */
  onSaveSuccess?: () => void;
}

type FeedbackKind = "idle" | "saved" | "loaded" | "cleared" | "error";

/**
 * 復元した盤面から Base Look バー用ラベルを推定する
 * @param present - A/B スロットを含む盤面
 */
function presetHintFromPresent(present: PresentState): BaseLookName {
  const slot = present.activeSlot === "A" ? present.slotA : present.slotB;
  return slot.baseLook ?? findMatchingBaseLook(slot.params) ?? "reset";
}

export function FilmLabBrowserStorageSection({
  state,
  dispatch,
  savedBloomStrength,
  savedHalationIntensity,
  onAfterRestore,
  onSaveSuccess,
}: FilmLabBrowserStorageSectionProps) {
  const t = useTranslations("film-lab.browser");
  const [hasStored, setHasStored] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackKind>("idle");
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- localStorage はクライアント専用のためマウント後に同期 */
    setHasStored(hasFilmLabStoredSession());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(
    () => () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    },
    [],
  );

  const showFeedback = useCallback((kind: FeedbackKind) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedback(kind);
    if (kind === "idle") return;
    feedbackTimerRef.current = setTimeout(() => setFeedback("idle"), 2800);
  }, []);

  const handleSave = useCallback(() => {
    try {
      saveFilmLabStoredSession({
        version: 1,
        present: toPresentSnapshot(state),
        savedBloomStrength,
        savedHalationIntensity,
      });
      setHasStored(true);
      showFeedback("saved");
      filmLabDonationDevTrace("handleSave: ブラウザ保存成功 → onSaveSuccess を呼ぶ", {
        functionName: "FilmLabBrowserStorageSection.handleSave",
        hasOnSaveSuccess: typeof onSaveSuccess === "function",
      });
      if (isFilmLabDonationDebugEnabled()) {
        filmLabDonationDebugLog("handleSave: 成功。onSaveSuccess 呼び出し", {
          functionName: "FilmLabBrowserStorageSection.handleSave",
          hasOnSaveSuccess: typeof onSaveSuccess === "function",
        });
      }
      onSaveSuccess?.();
    } catch (err) {
      console.error("FilmLabBrowserStorageSection.handleSave: localStorage 書き込み失敗", {
        err,
      });
      showFeedback("error");
    }
  }, [state, savedBloomStrength, savedHalationIntensity, showFeedback, onSaveSuccess]);

  const handleLoad = useCallback(() => {
    const session = loadFilmLabStoredSession();
    if (!session) {
      setHasStored(false);
      showFeedback("error");
      return;
    }
    dispatch({ type: "RESTORE_PRESENT", present: session.present });
    onAfterRestore({
      savedBloomStrength: session.savedBloomStrength,
      savedHalationIntensity: session.savedHalationIntensity,
      activePreset: presetHintFromPresent(session.present),
    });
    showFeedback("loaded");
  }, [dispatch, onAfterRestore, showFeedback]);

  const handleClear = useCallback(() => {
    clearFilmLabStoredSession();
    setHasStored(false);
    showFeedback("cleared");
  }, [showFeedback]);

  const feedbackText =
    feedback === "saved"
      ? t("feedbackSaved")
      : feedback === "loaded"
        ? t("feedbackLoaded")
        : feedback === "cleared"
          ? t("feedbackCleared")
          : feedback === "error"
            ? t("feedbackError")
            : null;

  return (
    <div className="mt-3 border-t border-white/[0.06] pt-3">
      <SectionHeader title={t("sectionTitle")} className="!mt-0" />
      <p className="mb-2.5 text-[10px] leading-snug text-white/35">{t("hint")}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center text-[11px] font-medium text-white/80 transition-colors hover:bg-white/10 sm:min-h-0 sm:flex-1 sm:py-2"
        >
          {t("save")}
        </button>
        <button
          type="button"
          disabled={!hasStored}
          onClick={handleLoad}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center text-[11px] font-medium text-white/80 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35 sm:min-h-0 sm:flex-1 sm:py-2"
        >
          {t("load")}
        </button>
        <button
          type="button"
          disabled={!hasStored}
          onClick={handleClear}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center text-[11px] font-medium text-white/55 transition-colors hover:bg-white/10 hover:text-white/75 disabled:cursor-not-allowed disabled:opacity-35 sm:min-h-0 sm:flex-1 sm:py-2"
        >
          {t("clear")}
        </button>
      </div>
      {feedbackText ? (
        <p className="mt-2 text-[10px] text-white/45" role="status">
          {feedbackText}
        </p>
      ) : null}
    </div>
  );
}
