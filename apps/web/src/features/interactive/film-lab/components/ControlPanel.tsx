"use client";

import {
  useReducer,
  useState,
  useCallback,
  useEffect,
  useRef,
  startTransition,
  type RefObject,
} from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ControlSlider } from "./ui/ControlSlider";
import { LUTPanel } from "./LUTPanel";
import { PresetBar } from "./PresetBar";
import type { Viewport } from "../core/Viewport";
import { PRESETS, findMatchingPreset, type PresetName, halationHueToHex } from "../preset-data";
import { filmLabShareUiEnabled, filmLabSmartLookUiEnabled } from "../feature-flags";
import {
  loadFilmLabStoredSession,
  type FilmLabStoredSessionV1,
} from "../film-lab-browser-storage";
import type { Params } from "../types";
import {
  filmLabReducer,
  createInitialState,
  createInitialStateFromSharedParams,
  type GradeSlotState,
} from "./film-lab-reducer";
import { FilmLabBrowserStorageSection } from "./FilmLabBrowserStorageSection";
import { FilmLabShareSection } from "./FilmLabShareSection";
import type { FilmLabCanvasRef } from "./FilmLabCanvas";
import { FilmLabSmartLookSection } from "./FilmLabSmartLookSection";
import { FilmLabInfoTip } from "./FilmLabInfoTip";
import {
  quickMetaDisplayValue,
  quickMetaPatchForValue,
  type QuickMetaAxis,
} from "./quick-meta-sliders";

/** UI の見せ方だけを切り替える。グレードの数値（reducer）は Quick でも Pro でも同じ */
type UiMode = "quick" | "pro";

/**
 * RGB Shift の通常操作で見せる上限。
 * 保存値そのものは変えず、UI だけを実用帯に寄せる。
 */
const RGB_SHIFT_UI_MAX = 0.01;

/** RGB Shift を細かく調整できるようにする刻み幅。 */
const RGB_SHIFT_UI_STEP = 0.0001;

/**
 * 旧 share URL や保存データで 0.01 を超える値が来ても、
 * いまの見た目を壊さずにスライダーへ載せるための上限を返す。
 * ふだんの新規操作では 0.01 が上限になる。
 *
 * @param {number} rgbShift - 現在の保存値
 * @returns {number} スライダーに渡す上限値
 */
function getRgbShiftSliderMax(rgbShift: number): number {
  return Math.max(RGB_SHIFT_UI_MAX, rgbShift);
}

/**
 * 小さい値の差が見えるように、通常上限 0.01 を 100% として表示する。
 * 旧データが 0.01 を超えると 100% を超えて表示される。
 *
 * @param {number} rgbShift - 右側ラベルに出す現在値
 * @returns {string} 表示用のパーセント文字列
 */
function formatRgbShiftValue(rgbShift: number): string {
  return `${Math.round((rgbShift / RGB_SHIFT_UI_MAX) * 100)}%`;
}

/** フルページ用: プレゼンモード（寄付 UI 全消し）のトグルをコントロールパネルに出す */
export type FilmLabDonationUiBinding = {
  presentMode: boolean;
  onPresentModeChange: (next: boolean) => void;
};

interface ControlPanelProps {
  viewport: Viewport | null;
  histogramVisible?: boolean;
  onHistogramToggle?: () => void;
  /** サーバーで ?v=1&p= から復元したパラメータ（hydration 一致・初期表示用） */
  initialSharedParams?: Params | null;
  /**
   * 比較オン・編集スロットを親へ通知（キャンバス上の HUD と同期）。
   * 未指定なら何もしない（ショーケース埋め込みなど）。
   */
  onCompareUiChange?: (ui: { compareMode: boolean; activeSlot: "A" | "B" }) => void;
  /** /film-lab のみ: プレゼンモード切替 */
  donationUi?: FilmLabDonationUiBinding;
  /** .cube 読み込み成功時（親が寄付バナー用） */
  onLutLoadSuccess?: () => void;
  /** 「このブラウザに保存」成功時 */
  onBrowserSaveSuccess?: () => void;
  /** /film-lab フルページ: Stripe 検証済み支援者（サーバー） */
  serverVerifiedSupporter?: boolean;
  /** スマートルック用キャンバスキャプチャ ref（フルページのみ） */
  filmLabCanvasRef?: RefObject<FilmLabCanvasRef | null>;
  /**
   * @description デスクトップ等: BFF のオリジン（末尾スラッシュなし）。未指定時は相対 `/api/film-lab/ai/smart-look`（Web 本番）。
   */
  smartLookApiBaseUrl?: string;
  /**
   * @description `false` のとき、localStorage の Film Lab セッションを起動時に自動復元しない（Electron で Web とストレージを共有するときの compare 残留防止）。
   */
  autoRestoreStoredSession?: boolean;
}

export function ControlPanel({
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
}: ControlPanelProps) {
  const pathname = usePathname();
  const tFilmLab = useTranslations("film-lab");

  /** URL 共有が無いときは Cinematic＋basePreset、あるときはそのスナップショットで初期化 */
  const [state, dispatch] = useReducer(
    filmLabReducer,
    undefined,
    () =>
      initialSharedParams
        ? createInitialStateFromSharedParams(initialSharedParams)
        : createInitialState({ ...PRESETS.cinematic } as Params, "cinematic"),
  );
  const [activePreset, setActivePreset] = useState<PresetName>(() =>
    initialSharedParams ? findMatchingPreset(initialSharedParams) ?? "reset" : "cinematic",
  );
  const [savedBloomStrength, setSavedBloomStrength] = useState(0.3);
  const [savedHalationIntensity, setSavedHalationIntensity] = useState(0.25);
  const [effectsOpen, setEffectsOpen] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  /** Space キーと同じ Before/After を、タッチでも確実に使えるようにするためのフラグ（pointer capture と組み合わせる） */
  const beforeAfterPointerActiveRef = useRef(false);
  /** Viewport の分割線を reducer と同期するための直前フレームの状態 */
  const prevCompareModeRef = useRef(false);
  const prevBeforeAfterActiveRef = useRef(false);
  /** デスクトップは Pro、狭い画面は Quick を初期表示（SSR と一致させるため初回は Pro → effect で Quick に寄せる） */
  const [uiMode, setUiMode] = useState<UiMode>("pro");

  // Mobile: close Effects section by default + Quick モードを既定に
  // matchMedia はクライアント専用のため effect で寄せる（SSR は Pro / Effects 開を仮定しハイドレーション後に修正）
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- intentional client-only media default */
    if (!window.matchMedia("(min-width: 768px)").matches) {
      setEffectsOpen(false);
      setUiMode("quick");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  /**
   * localStorage から読んだセッションを盤面と UI 補助 state に反映する。
   * @param session - 検証済みの保存データ
   */
  const restoreFromStoredSession = useCallback((session: FilmLabStoredSessionV1) => {
    dispatch({ type: "RESTORE_PRESENT", present: session.present });
    setSavedBloomStrength(session.savedBloomStrength);
    setSavedHalationIntensity(session.savedHalationIntensity);
    const slot =
      session.present.activeSlot === "A" ? session.present.slotA : session.present.slotB;
    setActivePreset(slot.basePreset ?? findMatchingPreset(slot.params) ?? "reset");
  }, []);

  /** 共有 URL が無いとき、前回「ブラウザに保存」したルックを自動復元 */
  useEffect(() => {
    if (initialSharedParams != null) return;
    if (!autoRestoreStoredSession) return;
    const session = loadFilmLabStoredSession();
    if (!session) return;
    startTransition(() => {
      restoreFromStoredSession(session);
    });
  }, [initialSharedParams, restoreFromStoredSession, autoRestoreStoredSession]);

  const handleBrowserRestoreUi = useCallback(
    (payload: {
      savedBloomStrength: number;
      savedHalationIntensity: number;
      activePreset: PresetName;
    }) => {
      setSavedBloomStrength(payload.savedBloomStrength);
      setSavedHalationIntensity(payload.savedHalationIntensity);
      setActivePreset(payload.activePreset);
    },
    [],
  );

  const isPro = uiMode === "pro";

  const activeSlotState = state.activeSlot === "A" ? state.slotA : state.slotB;
  const params = activeSlotState.params;

  /** reset 以外のフィルムプリセット選択中だけ、reset→preset のブレンド率を変えられる */
  const presetIntensityAvailable =
    activeSlotState.basePreset != null && activeSlotState.basePreset !== "reset";

  /**
   * プリセットボタンのリング表示: Undo 後も reducer の basePreset を優先し、手動編集後は従来どおり activePreset に従う
   */
  const presetBarActive: PresetName =
    presetIntensityAvailable && activeSlotState.basePreset
      ? activeSlotState.basePreset
      : activePreset;

  /** Viewport.setParams / setComparePair 用に Halation の色を hex 文字列へ */
  const gradeToViewportRecord = useCallback((slot: GradeSlotState) => {
    return {
      ...slot.params,
      halationColor: halationHueToHex(slot.params.halationHue),
    } as Record<string, number | string>;
  }, []);

  /**
   * Viewport 同期: A/B 比較・単独編集に加え、合成シェーダーの分割（uSplitPosition）を UI 状態と一致させる。
   * 既定 0.5 のままだと原画／白線／グレードが常時残るため、オフ時は -1、Before/After・Compare 開始時のみ 0.5 を明示する。
   */
  useEffect(() => {
    if (!viewport) return;

    const compareOn = state.compareMode;
    const beforeAfterActive = state.beforeAfterStash != null;

    if (compareOn) {
      viewport.setComparePair(
        true,
        gradeToViewportRecord(state.slotA),
        gradeToViewportRecord(state.slotB),
      );
      if (!prevCompareModeRef.current) {
        viewport.setSplitPosition(0.5);
      }
    } else {
      viewport.setComparePair(false, {}, {});
      const active = state.activeSlot === "A" ? state.slotA : state.slotB;
      viewport.setParams(gradeToViewportRecord(active));

      if (prevCompareModeRef.current && !compareOn) {
        if (!beforeAfterActive) {
          viewport.setSplitPosition(-1.0);
        }
      } else if (beforeAfterActive && !prevBeforeAfterActiveRef.current) {
        viewport.setSplitPosition(0.5);
      } else if (!beforeAfterActive && prevBeforeAfterActiveRef.current) {
        viewport.setSplitPosition(-1.0);
      }
    }

    prevCompareModeRef.current = compareOn;
    prevBeforeAfterActiveRef.current = beforeAfterActive;
  }, [
    viewport,
    state.compareMode,
    state.slotA,
    state.slotB,
    state.activeSlot,
    state.beforeAfterStash,
    gradeToViewportRecord,
  ]);

  /** 親（FilmLabFullPage）でキャンバス HUD と同期 */
  useEffect(() => {
    onCompareUiChange?.({
      compareMode: state.compareMode,
      activeSlot: state.activeSlot,
    });
  }, [state.compareMode, state.activeSlot, onCompareUiChange]);

  /** Bloom/Halation の ON はパラメータが 0 より大きいかどうかで決める（Undo とも自動で一致） */
  const bloomEnabled = params.bloomStrength > 0;
  const halationEnabled = params.halationIntensity > 0;

  const updateParam = useCallback((key: keyof Params, value: number) => {
    dispatch({ type: "SET_PARAM", key, value });
    setActivePreset("reset");
  }, []);

  const commit = useCallback(() => {
    dispatch({ type: "COMMIT" });
  }, []);

  const updateHalationHue = useCallback((hue: number) => {
    dispatch({ type: "SET_PARAM", key: "halationHue", value: hue });
    setActivePreset("reset");
  }, []);

  /**
   * Quick のメタスライダー: ドラッグ中は MERGE_PARAMS のみ（プレビュー）、離したとき COMMIT で Undo 1 単位にまとめる。
   */
  const applyQuickMetaChange = useCallback((axis: QuickMetaAxis, value01: number) => {
    dispatch({ type: "MERGE_PARAMS", patch: quickMetaPatchForValue(axis, value01) });
  }, []);

  const commitQuickMeta = useCallback(() => {
    dispatch({ type: "COMMIT" });
    setActivePreset("reset");
  }, []);

  const toggleBloom = useCallback(
    (on: boolean) => {
      if (on) {
        dispatch({ type: "SET_PARAM", key: "bloomStrength", value: savedBloomStrength || 0.3 });
      } else {
        if (params.bloomStrength > 0) setSavedBloomStrength(params.bloomStrength);
        dispatch({ type: "SET_PARAM", key: "bloomStrength", value: 0 });
      }
      dispatch({ type: "COMMIT" });
      setActivePreset("reset");
    },
    [params.bloomStrength, savedBloomStrength],
  );

  const toggleHalation = useCallback(
    (on: boolean) => {
      if (on) {
        dispatch({ type: "SET_PARAM", key: "halationIntensity", value: savedHalationIntensity || 0.25 });
      } else {
        if (params.halationIntensity > 0) setSavedHalationIntensity(params.halationIntensity);
        dispatch({ type: "SET_PARAM", key: "halationIntensity", value: 0 });
      }
      dispatch({ type: "COMMIT" });
      setActivePreset("reset");
    },
    [params.halationIntensity, savedHalationIntensity],
  );

  const applyPreset = useCallback((name: PresetName) => {
    const preset = PRESETS[name];
    dispatch({ type: "APPLY_PRESET", presetName: name, preset: { ...preset } as Params });
    setActivePreset(name);
  }, []);

  /**
   * モバイル向け Before/After: 押している間だけリセットルックを表示する（キーボードの Space と同じ reducer アクション）。
   * 指が外れたら必ず復帰するよう pointer capture と cancel/lostcapture も処理する。
   */
  const handleBeforeAfterPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    if (!beforeAfterPointerActiveRef.current) {
      beforeAfterPointerActiveRef.current = true;
      dispatch({ type: "BEFORE_AFTER_ON" });
    }
  }, []);

  const handleBeforeAfterPointerEnd = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* capture が既に外れている環境向け（詳細は無視してよい） */
    }
    if (beforeAfterPointerActiveRef.current) {
      beforeAfterPointerActiveRef.current = false;
      dispatch({ type: "BEFORE_AFTER_OFF" });
    }
  }, []);

  const handleBeforeAfterLostCapture = useCallback(() => {
    if (beforeAfterPointerActiveRef.current) {
      beforeAfterPointerActiveRef.current = false;
      dispatch({ type: "BEFORE_AFTER_OFF" });
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const presetKeys: Record<string, PresetName> = {
      "1": "cinematic", "2": "portra", "3": "gold200", "4": "pro400h",
      "5": "ektar100", "6": "superia400", "7": "cinestill800t", "8": "bw", "0": "reset",
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) return;

      const meta = e.metaKey || e.ctrlKey;

      // Redo: Cmd+Shift+Z (check before Undo — allow repeat)
      if (meta && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        dispatch({ type: "REDO" });
        setActivePreset("reset");
        return;
      }
      // Undo: Cmd+Z (allow repeat)
      if (meta && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        dispatch({ type: "UNDO" });
        setActivePreset("reset");
        return;
      }

      // Space: Before/After（長押し）— repeat でも必ず preventDefault（長押し中のページスクロール防止）
      if (e.key === " ") {
        e.preventDefault();
        if (!e.repeat) {
          dispatch({ type: "BEFORE_AFTER_ON" });
        }
        return;
      }

      // For remaining shortcuts, skip key repeat
      if (e.repeat) return;

      // Preset shortcuts: 0-8
      if (presetKeys[e.key]) {
        applyPreset(presetKeys[e.key]);
        return;
      }
      // H: Histogram toggle
      if (e.key === "h" || e.key === "H") {
        onHistogramToggle?.();
        return;
      }
      // Tab: 比較モードでアクティブスロット A/B 切替
      if (e.key === "Tab" && state.compareMode) {
        e.preventDefault();
        dispatch({ type: "SWITCH_SLOT" });
        return;
      }
      // V: A/B 比較のオンオフ
      if (e.key === "v" || e.key === "V") {
        e.preventDefault();
        dispatch({ type: "TOGGLE_COMPARE" });
        return;
      }
      // P: Quick / Pro（入力中は無視）
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        setUiMode((m) => (m === "quick" ? "pro" : "quick"));
        return;
      }
      // ?: Shortcut help
      if (e.key === "?") {
        setShowHelp((prev) => !prev);
        return;
      }
      // Escape: close help
      if (e.key === "Escape") {
        setShowHelp(false);
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key !== " ") return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }
      // keyup でも Space の既定（スクロール等）を抑止
      e.preventDefault();
      dispatch({ type: "BEFORE_AFTER_OFF" });
    };

    document.addEventListener("keydown", handleKeyDown, { capture: true });
    document.addEventListener("keyup", handleKeyUp, { capture: true });
    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
      document.removeEventListener("keyup", handleKeyUp, { capture: true });
    };
  }, [applyPreset, onHistogramToggle, state.compareMode]);

  /**
   * @description Web の /film-lab はパスで判定。Desktop は BFF 絶対 URL が渡るのでそれでも出す（パススタブ不一致の保険）。
   */
  const smartLookPathOk =
    pathname.includes("/film-lab") && !pathname.includes("/support");
  const smartLookHasDesktopBff =
    typeof smartLookApiBaseUrl === "string" &&
    smartLookApiBaseUrl.trim().length > 0;
  /** @description 実装・API は残すが、フラグ OFF 時はセクションをマウントしない（ペンディング時の負荷軽減） */
  const smartLookSlotAllowed =
    filmLabSmartLookUiEnabled &&
    filmLabCanvasRef != null &&
    (smartLookPathOk || smartLookHasDesktopBff);
  /** @description Desktop は Presets 直下に置き、スクロールしなくても見えるようにする */
  const smartLookProminent = smartLookHasDesktopBff;

  return (
    <>
      {/*
        @container + @min-[560px]: Color|Effects の 2 列は「パネル幅」基準。
        ビューポートだけが広いデスクトップ右ペインでは 1 列のままにし、ラベルとスライダーの重なりを防ぐ。
      */}
      <div className="@container w-full min-w-0 rounded-lg border border-white/[0.06] bg-black/60 p-4 backdrop-blur-xl sm:p-5">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="flex rounded-lg border border-white/10 p-0.5"
            role="group"
            aria-label={tFilmLab("mode.hintShort")}
          >
            <button
              type="button"
              onClick={() => setUiMode("quick")}
              className={`flex-1 rounded-md px-3 py-2 text-center text-[11px] font-medium transition-colors sm:flex-none sm:px-4 ${
                uiMode === "quick"
                  ? "bg-[var(--accent-amber1)] text-black"
                  : "text-white/55 hover:text-white/75"
              }`}
            >
              {tFilmLab("mode.quick")}
            </button>
            <button
              type="button"
              onClick={() => setUiMode("pro")}
              className={`flex-1 rounded-md px-3 py-2 text-center text-[11px] font-medium transition-colors sm:flex-none sm:px-4 ${
                uiMode === "pro"
                  ? "bg-[var(--accent-amber1)] text-black"
                  : "text-white/55 hover:text-white/75"
              }`}
            >
              {tFilmLab("mode.pro")}
            </button>
          </div>
          <div className="flex items-start justify-end gap-1 sm:max-w-[260px]">
            <p className="min-w-0 flex-1 text-right text-[10px] leading-snug text-white/35">
              {tFilmLab("mode.hintShort")}
            </p>
            <FilmLabInfoTip
              tip={tFilmLab("mode.hint")}
              assistiveLabel={tFilmLab("mode.hintInfoAria")}
              className="mt-0.5 text-white/35 hover:text-amber-200/80"
            />
          </div>
        </div>

        {donationUi ? (
          <label className="mt-2 flex cursor-pointer items-start gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5">
            <input
              type="checkbox"
              checked={donationUi.presentMode}
              onChange={(e) => donationUi.onPresentModeChange(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-black/40 text-[var(--accent-amber1)] focus:ring-[var(--accent-amber1)]"
            />
            <span className="min-w-0">
              <span className="block text-[11px] font-medium text-white/80">
                {tFilmLab("donation.present_mode.toggleLabel")}
              </span>
              <span className="mt-1 block text-[10px] leading-snug text-white/38">
                {tFilmLab("donation.present_mode.description")}
              </span>
              <span className="mt-0.5 block text-[10px] text-white/28">
                {tFilmLab("donation.present_mode.urlHint")}
              </span>
            </span>
          </label>
        ) : null}

        {/*
          プリセットは Web / Desktop 共通でパネル最上部に置く（スクロールなしで選べる・バッチ反映の起点としても見つけやすい）。
          強度スライダーはフィルムプリセット選択中のみ。
        */}
        <div className="mb-4 min-w-0 border-b border-white/[0.06] pb-4">
          <SectionHeader title={tFilmLab("controls.presets")} />
          <PresetBar activePreset={presetBarActive} onPreset={applyPreset} />
          {presetIntensityAvailable ? (
            <div className="mt-3">
              <ControlSlider
                label={tFilmLab("controls.presetIntensity")}
                value={activeSlotState.intensity}
                min={0}
                max={1}
                step={0.01}
                defaultValue={1}
                formatValue={(v) => `${Math.round(v * 100)}%`}
                onChange={(v) => dispatch({ type: "SET_INTENSITY", value: v })}
                onCommit={() => dispatch({ type: "COMMIT" })}
              />
            </div>
          ) : null}
        </div>

        {smartLookSlotAllowed && smartLookProminent ? (
          <div className="mb-4 min-w-0 border-b border-white/[0.06] pb-4">
            <FilmLabSmartLookSection
              serverVerifiedSupporter={serverVerifiedSupporter}
              filmLabCanvasRef={filmLabCanvasRef}
              activePreset={presetBarActive}
              activeSlotState={activeSlotState}
              dispatch={dispatch}
              smartLookApiBaseUrl={smartLookApiBaseUrl}
            />
          </div>
        ) : null}

        {/*
          レイアウト:
          - Quick: パネル足幅で 2 列（左 ≒ LUT・保存・共有 等 / 右 = Color）。プリセットは上段に移動済み。
          - Pro: 上段 Color | Effects、下段 LUT ほか 全幅（col-span-2）。2 列化もパネル幅ベース（@container）。
        */}
        <div className="grid w-full min-w-0 grid-cols-1 gap-4 @min-[560px]:grid-cols-2 @min-[560px]:gap-6">
          {/* === COLOR GRADING（Quick 時は視覚順を後ろに — order-2） === */}
          <div className={`min-w-0 ${isPro ? "" : "order-2 @min-[560px]:order-2"}`}>
            <SectionHeader title={tFilmLab("controls.color")} />
            {isPro ? (
            <div className="flex flex-col gap-2.5">
              <ControlSlider label={tFilmLab("controls.exposure")} value={params.exposure} min={-3} max={3} step={0.01} defaultValue={0} onChange={(v) => updateParam("exposure", v)} onCommit={commit} />
              <ControlSlider label={tFilmLab("controls.contrast")} value={params.contrast} min={0} max={3} step={0.01} defaultValue={1} onChange={(v) => updateParam("contrast", v)} onCommit={commit} />
              <ControlSlider label={tFilmLab("controls.saturation")} value={params.saturation} min={0} max={3} step={0.01} defaultValue={1} onChange={(v) => updateParam("saturation", v)} onCommit={commit} />
              <ControlSlider label={tFilmLab("controls.temperature")} value={params.temperature} min={-1} max={1} step={0.01} defaultValue={0} onChange={(v) => updateParam("temperature", v)} onCommit={commit} />
              <ControlSlider
                label={tFilmLab("color.tint")}
                value={params.tint}
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                onChange={(v) => updateParam("tint", v)}
                onCommit={commit}
              />
              <ControlSlider label={tFilmLab("controls.highlights")} value={params.highlights} min={-1} max={1} step={0.01} defaultValue={0} onChange={(v) => updateParam("highlights", v)} onCommit={commit} />
              <ControlSlider label={tFilmLab("controls.shadows")} value={params.shadows} min={-1} max={1} step={0.01} defaultValue={0} onChange={(v) => updateParam("shadows", v)} onCommit={commit} />
              <SplitToneHueSlider
                label={tFilmLab("color.shadowHue")}
                value={params.shadowHue}
                onChange={(v) => updateParam("shadowHue", v)}
                onCommit={commit}
              />
              <ControlSlider
                label={tFilmLab("color.shadowTone")}
                value={params.shadowTone}
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                onChange={(v) => updateParam("shadowTone", v)}
                onCommit={commit}
              />
              <SplitToneHueSlider
                label={tFilmLab("color.highlightHue")}
                value={params.highlightHue}
                onChange={(v) => updateParam("highlightHue", v)}
                onCommit={commit}
              />
              <ControlSlider
                label={tFilmLab("color.highlightTone")}
                value={params.highlightTone}
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                onChange={(v) => updateParam("highlightTone", v)}
                onCommit={commit}
              />
              <ControlSlider label={tFilmLab("controls.fade")} value={params.fade} min={0} max={0.3} step={0.01} defaultValue={0} onChange={(v) => updateParam("fade", v)} onCommit={commit} />
            </div>
            ) : (
            <div className="flex flex-col gap-2.5">
              <p className="text-[10px] leading-snug text-white/45">
                {tFilmLab("controls.quick.summary")}
              </p>
              <ControlSlider
                label={tFilmLab("controls.quick.filmLook")}
                hint={tFilmLab("controls.quick.filmLookHint")}
                value={quickMetaDisplayValue("filmLook", params)}
                min={0}
                max={1}
                step={0.01}
                defaultValue={0.5}
                formatValue={(v) => `${Math.round(v * 100)}%`}
                onChange={(v) => applyQuickMetaChange("filmLook", v)}
                onCommit={commitQuickMeta}
              />
              <ControlSlider
                label={tFilmLab("controls.quick.era")}
                hint={tFilmLab("controls.quick.eraHint")}
                value={quickMetaDisplayValue("era", params)}
                min={0}
                max={1}
                step={0.01}
                defaultValue={0.5}
                formatValue={(v) => `${Math.round(v * 100)}%`}
                onChange={(v) => applyQuickMetaChange("era", v)}
                onCommit={commitQuickMeta}
              />
              <ControlSlider
                label={tFilmLab("controls.quick.dynamics")}
                hint={tFilmLab("controls.quick.dynamicsHint")}
                value={quickMetaDisplayValue("dynamics", params)}
                min={0}
                max={1}
                step={0.01}
                defaultValue={0.5}
                formatValue={(v) => `${Math.round(v * 100)}%`}
                onChange={(v) => applyQuickMetaChange("dynamics", v)}
                onCommit={commitQuickMeta}
              />
            </div>
            )}
          </div>

          {/* === EFFECTS（Pro のみ） === */}
          {isPro ? (
          <div className="min-w-0">
            <CollapsibleHeader title={tFilmLab("controls.effects")} open={effectsOpen} onToggle={() => setEffectsOpen(!effectsOpen)} />
            {effectsOpen && (
              <div className="flex flex-col gap-2.5">
                <ControlSlider
                  label={tFilmLab("controls.rgbShift")}
                  hint={tFilmLab("effects.rgbShiftHint")}
                  value={params.rgbShift}
                  min={0}
                  max={getRgbShiftSliderMax(params.rgbShift)}
                  step={RGB_SHIFT_UI_STEP}
                  defaultValue={0}
                  formatValue={formatRgbShiftValue}
                  onChange={(v) => updateParam("rgbShift", v)}
                  onCommit={commit}
                />
                <ControlSlider
                  label={tFilmLab("controls.lensSoftness")}
                  hint={tFilmLab("effects.lensSoftnessHint")}
                  value={params.lensSoftness}
                  min={0}
                  max={1}
                  step={0.01}
                  defaultValue={0}
                  formatValue={(v) => `${Math.round(v * 100)}%`}
                  onChange={(v) => updateParam("lensSoftness", v)}
                  onCommit={commit}
                />
                <ControlSlider label={tFilmLab("controls.filmGrain")} value={params.grainIntensity} min={0} max={0.5} step={0.01} defaultValue={0} onChange={(v) => updateParam("grainIntensity", v)} onCommit={commit} />
                <ControlSlider
                  label={tFilmLab("controls.grainRadialMix")}
                  hint={tFilmLab("controls.grainRadialMixHint")}
                  value={params.grainRadialMix}
                  min={0}
                  max={1}
                  step={0.01}
                  defaultValue={1}
                  onChange={(v) => updateParam("grainRadialMix", v)}
                  onCommit={commit}
                />
                <ControlSlider label={tFilmLab("controls.vignette")} value={params.vignette} min={0} max={1} step={0.01} defaultValue={0} onChange={(v) => updateParam("vignette", v)} onCommit={commit} />
              </div>
            )}

            <ToggleHeader title={tFilmLab("controls.bloom")} enabled={bloomEnabled} onToggle={toggleBloom} />
            <div className={`flex flex-col gap-2.5 ${!bloomEnabled ? "pointer-events-none opacity-30" : ""}`}>
              <ControlSlider label={tFilmLab("controls.strength")} value={params.bloomStrength} min={0} max={3} step={0.01} defaultValue={0} onChange={(v) => updateParam("bloomStrength", v)} onCommit={commit} />
              <ControlSlider label={tFilmLab("controls.threshold")} value={params.bloomThreshold} min={0} max={1} step={0.01} defaultValue={0.8} onChange={(v) => updateParam("bloomThreshold", v)} onCommit={commit} />
              <ControlSlider label={tFilmLab("controls.radius")} value={params.bloomRadius} min={0} max={1} step={0.01} defaultValue={0.4} onChange={(v) => updateParam("bloomRadius", v)} onCommit={commit} />
            </div>

            <ToggleHeader title={tFilmLab("controls.halation")} enabled={halationEnabled} onToggle={toggleHalation} />
            <div className={`flex flex-col gap-2.5 ${!halationEnabled ? "pointer-events-none opacity-30" : ""}`}>
              <ControlSlider label={tFilmLab("controls.intensity")} value={params.halationIntensity} min={0} max={1} step={0.01} defaultValue={0} onChange={(v) => updateParam("halationIntensity", v)} onCommit={commit} />
              <ControlSlider label={tFilmLab("controls.spread")} value={params.halationSpread} min={0} max={50} step={0.5} defaultValue={15} onChange={(v) => updateParam("halationSpread", v)} onCommit={commit} />
              <HueSlider
                label={tFilmLab("controls.halationHue")}
                value={params.halationHue}
                onChange={updateHalationHue}
                onCommit={commit}
              />
            </div>
          </div>
          ) : null}

          {/* === LUT（プリセットはパネル上段へ移動・ここでは .cube のみ） === */}
          <div
            className={`min-w-0 ${isPro ? "@min-[560px]:col-span-2" : "order-1 @min-[560px]:order-1"}`}
          >
            <LUTPanel viewport={viewport} onCubeLutLoaded={onLutLoadSuccess} />
            <FilmLabBrowserStorageSection
              state={state}
              dispatch={dispatch}
              savedBloomStrength={savedBloomStrength}
              savedHalationIntensity={savedHalationIntensity}
              onAfterRestore={handleBrowserRestoreUi}
              onSaveSuccess={onBrowserSaveSuccess}
            />
            {smartLookSlotAllowed && !smartLookProminent ? (
              <FilmLabSmartLookSection
                serverVerifiedSupporter={serverVerifiedSupporter}
                filmLabCanvasRef={filmLabCanvasRef}
                activePreset={presetBarActive}
                activeSlotState={activeSlotState}
                dispatch={dispatch}
                smartLookApiBaseUrl={smartLookApiBaseUrl}
              />
            ) : null}
            <div className="mt-3 rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-black/20 p-3">
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.12em] text-white/60">
                {tFilmLab("compare.sectionTitle")}
              </p>

              <div className="flex gap-3 rounded-lg border border-white/12 bg-[#111]/90 p-2.5">
                <BeforeAfterPreviewIcon />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium leading-snug text-white/85">
                    {tFilmLab("compare.beforeAfterTitle")}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-snug text-white/52">
                    {tFilmLab("compare.beforeAfterHint")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onPointerDown={handleBeforeAfterPointerDown}
                onPointerUp={handleBeforeAfterPointerEnd}
                onPointerCancel={handleBeforeAfterPointerEnd}
                onLostPointerCapture={handleBeforeAfterLostCapture}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left text-[11px] text-white/65 transition-colors hover:bg-white/8 hover:text-white/80 active:bg-white/12 sm:py-2"
              >
                <span className="font-medium text-white/85">{tFilmLab("compare.holdTitle")}</span>
                <span className="mt-0.5 block text-[10px] text-white/52">{tFilmLab("compare.holdHint")}</span>
              </button>

              <div className="my-3 h-px bg-white/[0.08]" />

              <div className="flex gap-3">
                <SplitLooksPreviewIcon />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[11px] font-medium leading-snug text-white/85">
                      {tFilmLab("compare.title")}
                    </h3>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={state.compareMode}
                      onClick={() =>
                        dispatch({ type: state.compareMode ? "COMPARE_OFF" : "COMPARE_ON" })
                      }
                      className={`mt-0.5 h-4 w-7 shrink-0 rounded-full transition-colors ${
                        state.compareMode ? "bg-[var(--accent-amber1)]" : "bg-white/15"
                      }`}
                    >
                      <span className="sr-only">{tFilmLab("compare.title")}</span>
                      <span
                        className={`block h-3 w-3 rounded-full bg-white transition-transform ${
                          state.compareMode ? "translate-x-3.5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                  <p className="mt-1.5 text-[10px] leading-relaxed text-white/52">
                    {state.compareMode ? tFilmLab("compare.taglineOn") : tFilmLab("compare.taglineOff")}
                  </p>
                  {state.compareMode ? (
                    <div className="mt-2 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-[10px] font-medium text-white/55">
                        {tFilmLab("compare.editLabel")}
                      </span>
                      <div
                        className="inline-flex rounded-lg border border-white/18 bg-black/50 p-0.5 shadow-inner shadow-black/30"
                        role="group"
                        aria-label={tFilmLab("compare.editLabel")}
                      >
                        <button
                          type="button"
                          title={tFilmLab("compare.slotTooltipLeft")}
                          onClick={() => dispatch({ type: "SWITCH_SLOT", slot: "A" })}
                          className={`min-w-[3rem] rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors sm:py-1.5 ${
                            state.activeSlot === "A"
                              ? "bg-[var(--accent-amber1)] text-black shadow-sm"
                              : "bg-transparent text-white/88 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {tFilmLab("compare.slotLeft")}
                        </button>
                        <button
                          type="button"
                          title={tFilmLab("compare.slotTooltipRight")}
                          onClick={() => dispatch({ type: "SWITCH_SLOT", slot: "B" })}
                          className={`min-w-[3rem] rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors sm:py-1.5 ${
                            state.activeSlot === "B"
                              ? "bg-[var(--accent-amber1)] text-black shadow-sm"
                              : "bg-transparent text-white/88 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {tFilmLab("compare.slotRight")}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            {filmLabShareUiEnabled ? (
              <FilmLabShareSection pathname={pathname} params={params} />
            ) : null}
            <div className="mt-3 border-t border-white/[0.06] pt-3">
              <ToggleHeader title={tFilmLab("controls.histogram")} enabled={histogramVisible} onToggle={() => onHistogramToggle?.()} />
            </div>
          </div>
        </div>
      </div>
      <ShortcutHelp open={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
}

/* ── Sub-components ───────────────────────────────────────────── */

/**
 * 「元の写真 | いまのルック」の並びを示すミニ図。比べ方カードで視覚的に役割を伝える。
 */
function BeforeAfterPreviewIcon() {
  return (
    <svg
      width={44}
      height={32}
      viewBox="0 0 44 32"
      className="shrink-0 text-white/30"
      aria-hidden
    >
      <rect x="1" y="5" width="19" height="22" rx="3" fill="currentColor" opacity="0.45" />
      <rect x="24" y="5" width="19" height="22" rx="3" fill="var(--accent-amber1)" opacity="0.55" />
    </svg>
  );
}

/**
 * 左右分割で2ルックを並べるモードを示すミニ図（中央に縦線）。
 */
function SplitLooksPreviewIcon() {
  return (
    <svg
      width={44}
      height={32}
      viewBox="0 0 44 32"
      className="shrink-0 text-white/30"
      aria-hidden
    >
      <rect x="1" y="5" width="42" height="22" rx="3" fill="currentColor" opacity="0.15" />
      <rect x="1" y="5" width="20" height="22" rx="3" fill="var(--accent-amber1)" opacity="0.35" />
      <rect x="23" y="5" width="20" height="22" rx="3" fill="var(--accent-amber1)" opacity="0.6" />
      <line x1="22" y1="5" x2="22" y2="27" stroke="white" strokeWidth="1.2" opacity="0.45" />
    </svg>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="mb-2 mt-3 text-[10px] font-medium uppercase tracking-[0.15em] text-white/40 first:mt-0">
      {title}
    </h3>
  );
}

function CollapsibleHeader({
  title,
  open,
  onToggle,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className="mb-2 mt-3 flex w-full items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-white/40 transition-colors hover:text-white/60 first:mt-0"
      onClick={onToggle}
    >
      <span className={`text-[8px] transition-transform duration-150 ${open ? "rotate-90" : ""}`}>
        &#9654;
      </span>
      {title}
    </button>
  );
}

/**
 * スプリットトーン用 0〜360° の色相スライダー（HSL 円周に沿ったプレビュー）
 */
function SplitToneHueSlider({
  label,
  value,
  onChange,
  onCommit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  onCommit?: () => void;
}) {
  const h = ((value % 360) + 360) % 360;
  return (
    <div className="flex min-h-[44px] items-center gap-3 sm:min-h-0">
      <span className="w-16 shrink-0 text-[11px] text-white/50 sm:w-24">{label}</span>
      <div className="relative flex-1">
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={h}
          onChange={(e) => onChange(Number(e.target.value))}
          onPointerUp={() => onCommit?.()}
          onTouchEnd={() => onCommit?.()}
          className="split-tone-hue-slider h-1.5 w-full cursor-pointer appearance-none rounded-full touch-none"
          style={{
            background:
              "linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))",
          }}
        />
      </div>
      <div
        className="h-4 w-4 shrink-0 rounded-full border border-white/20"
        style={{ backgroundColor: `hsl(${h} 100% 50%)` }}
      />
    </div>
  );
}

function HueSlider({
  label,
  value,
  onChange,
  onCommit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  onCommit?: () => void;
}) {
  const hex = halationHueToHex(value);
  return (
    <div className="flex min-h-[44px] items-center gap-3 sm:min-h-0">
      <span className="w-16 shrink-0 text-[11px] text-white/50 sm:w-24">{label}</span>
      <div className="relative flex-1">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onPointerUp={() => onCommit?.()}
          onTouchEnd={() => onCommit?.()}
          className="halation-hue-slider h-1.5 w-full cursor-pointer appearance-none rounded-full touch-none"
          style={{
            background: `linear-gradient(to right, #e81020, #d83818, #c86010)`,
          }}
        />
      </div>
      <div
        className="h-4 w-4 shrink-0 rounded-full border border-white/20"
        style={{ backgroundColor: hex }}
      />
    </div>
  );
}

/**
 * セクション見出しと ON/OFF スイッチを並べる行。
 * スイッチのノブはトラック内で常に左右端に等しい余白になるよう `left/right` で直接固定する。
 * 縦位置は `top` 固定ではなく `inset-y-0 my-auto` で中央揃えにし、
 * 画面倍率やボーダー解釈の差で下方向へずれて見える問題を防ぐ。
 * `translate` で距離を計算すると、ズームや境界線幅の差でノブが端にはみ出して見えることがあるため、
 * ON/OFF は `left-0.5` と `right-0.5` を切り替えるだけにして位置ずれを防ぐ。
 *
 * @param {{ title: string; enabled: boolean; onToggle: (on: boolean) => void }} props
 */
function ToggleHeader({
  title,
  enabled,
  onToggle,
}: {
  title: string;
  enabled: boolean;
  onToggle: (on: boolean) => void;
}) {
  return (
    <div className="mb-2 mt-3 flex items-center justify-between gap-3">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/65">
        {title}
      </h3>
      <button
        type="button"
        onClick={() => onToggle(!enabled)}
        className={`relative box-border h-5 w-9 shrink-0 rounded-full border transition-colors ${
          enabled
            ? "border-[color-mix(in_srgb,var(--accent-amber1)_70%,transparent)] bg-[var(--accent-amber1)]"
            : "border-white/25 bg-[#1c1c1c] hover:border-white/35"
        }`}
        aria-pressed={enabled}
      >
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 my-auto block h-4 w-4 rounded-full bg-white transition-all ${
            enabled ? "right-0.5 left-auto" : "left-0.5 right-auto"
          }`}
        />
      </button>
    </div>
  );
}

/**
 * ショートカット一覧モーダル。文言は next-intl（film-lab.shortcuts）に寄せる。
 */
function ShortcutHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("film-lab.shortcuts");

  if (!open) return null;

  const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  const mod = isMac ? "\u2318" : "Ctrl";

  const shortcuts: { key: string; action: string }[] = [
    { key: "1 \u2013 8", action: t("presetSelect") },
    { key: "0", action: t("reset") },
    { key: "Space", action: t("beforeAfter") },
    { key: "Hold button", action: t("holdButton") },
    { key: "Preset slider", action: t("presetSlider") },
    { key: `${mod}+Z`, action: t("undo") },
    { key: `${mod}+Shift+Z`, action: t("redo") },
    { key: "V", action: t("toggleCompare") },
    { key: "Tab", action: t("switchSlot") },
    { key: "P", action: t("toggleMode") },
    { key: "H", action: t("histogram") },
    { key: "?", action: t("help") },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-w-sm rounded-xl border border-white/10 bg-[#1a1a1a] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-sm font-medium text-white/80">{t("title")}</h2>
        <div className="space-y-2.5">
          {shortcuts.map((s) => (
            <div key={s.key} className="flex items-center justify-between gap-8">
              <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs text-white/60">
                {s.key}
              </kbd>
              <span className="text-xs text-white/50">{s.action}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[10px] text-white/30">{t("closeHint")}</p>
      </div>
    </div>
  );
}
