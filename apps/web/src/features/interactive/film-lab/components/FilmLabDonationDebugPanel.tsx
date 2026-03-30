"use client";

/**
 * @file 寄付まわりの診断パネル（`?filmLabDebugDonation=1` のときだけ表示）。
 * @description 保存後モーダルが出ない原因を画面に出し、リセットやテスト表示のボタンを付ける。
 * @limitations 本番 URL にクエリを付ければ利用可能。
 */

import { useEffect, useReducer } from "react";
import { filmLabDonationClientPublicEnvStatus } from "../film-lab-donation-config";
import {
  filmLabDebugResetDonationNudgeKeys,
  filmLabDiagnosePresetSaveModal,
  filmLabDonationDebugLog,
  type FilmLabDonationDebugWindowApi,
} from "../film-lab-donation-debug";
import { FILM_LAB_DONATION_STORAGE_KEYS } from "../film-lab-donation-logic";

export type FilmLabDonationDebugPanelProps = {
  /** 寄付ブロックを出しているか（env 合成後） */
  donationEnabled: boolean;
  /** Stripe ティア本数 */
  stripeTierCount: number;
  /** BMC URL が空でないか */
  hasBmc: boolean;
  runtimeFromServer: boolean;
  presentMode: boolean;
  saveModalOpen: boolean;
  onTestOpenModal: () => void;
};

/**
 * @description 右下固定の小さな診断 UI。
 */
export function FilmLabDonationDebugPanel({
  donationEnabled,
  stripeTierCount,
  hasBmc,
  runtimeFromServer,
  presentMode,
  saveModalOpen,
  onTestOpenModal,
}: FilmLabDonationDebugPanelProps) {
  const [, tick] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    const id = window.setInterval(() => tick(), 1200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const api: FilmLabDonationDebugWindowApi = {
      diagnose: filmLabDiagnosePresetSaveModal,
      resetNudge: filmLabDebugResetDonationNudgeKeys,
      log: filmLabDonationDebugLog,
    };
    const w = window as unknown as { __filmLabDonationDebug?: FilmLabDonationDebugWindowApi };
    w.__filmLabDonationDebug = api;
    filmLabDonationDebugLog(
      "window.__filmLabDonationDebug に { diagnose, resetNudge, log } を掛けました",
    );
    return () => {
      delete w.__filmLabDonationDebug;
    };
  }, []);

  const diagnosis = filmLabDiagnosePresetSaveModal();
  const envStatus = filmLabDonationClientPublicEnvStatus();

  return (
    <div
      className="fixed bottom-2 right-2 z-[240] max-h-[min(80vh,420px)] w-[min(96vw,340px)] overflow-y-auto rounded-lg border border-amber-500/40 bg-black/92 p-3 text-[10px] text-amber-100 shadow-xl backdrop-blur-sm"
      role="region"
      aria-label="Filmtone donation debug"
    >
      <p className="mb-2 font-semibold text-amber-300">Donation debug</p>

      {!donationEnabled ? (
        <div className="mb-3 rounded-md border border-red-500/50 bg-red-950/50 p-2 text-[9px] leading-snug text-red-100">
          <p className="font-semibold text-red-200">寄付 UI が OFF の主因</p>
          <p className="mt-1 text-red-100/90">
            <strong>埋め込みが empty でも</strong>、サーバーが{" "}
            <code className="rounded bg-black/40 px-0.5">.env.local</code> の{" "}
            <code className="rounded bg-black/40 px-0.5">NEXT_PUBLIC_*</code> を読んで
            <code className="rounded bg-black/40 px-0.5"> donationRuntime</code>
            を渡せば ON になります。ここが OFF なら
            <strong> Node がその env をまだ読めていない</strong>（ファイル場所・cwd・dev 未再起動）です。
          </p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-red-100/85">
            <li>
              <code className="rounded bg-black/40 px-0.5">apps/web/.env.local</code> に{" "}
              <code className="rounded bg-black/40 px-0.5">
                NEXT_PUBLIC_FILM_LAB_STRIPE_SUPPORT_URL=
              </code>{" "}
              （Payment Link）
            </li>
            <li>
              リポルートで <code className="rounded bg-black/40 px-0.5">bun run dev</code> または{" "}
              <code className="rounded bg-black/40 px-0.5">cd apps/web && bun dev</code>。変えたら dev 再起動
            </li>
            <li>
              <code className="rounded bg-black/40 px-0.5">bun run dev:context</code>（ルート）で cwd / .env.local の有無を確認
            </li>
          </ul>
        </div>
      ) : null}

      <dl className="mb-3 space-y-0.5 rounded-md border border-white/10 bg-white/[0.04] p-2 font-mono text-[9px] text-white/70">
        <dt className="text-white/45">埋め込み NEXT_PUBLIC（set=非空）</dt>
        <dd>STRIPE $3: {envStatus.NEXT_PUBLIC_FILM_LAB_STRIPE_SUPPORT_URL}</dd>
        <dd>$9: {envStatus.NEXT_PUBLIC_FILM_LAB_STRIPE_SUPPORT_URL_9}</dd>
        <dd>$25: {envStatus.NEXT_PUBLIC_FILM_LAB_STRIPE_SUPPORT_URL_25}</dd>
        <dd>BMC: {envStatus.NEXT_PUBLIC_FILM_LAB_BMC_URL}</dd>
        <dd>DONATION_UI: {envStatus.donationUiFlag}</dd>
      </dl>

      <ul className="space-y-1.5 leading-snug">
        <li>
          寄付 UI:{" "}
          <span className={donationEnabled ? "text-green-300" : "text-red-300"}>
            {donationEnabled ? "ON" : "OFF（env 不足または明示オフ）"}
          </span>
        </li>
        <li>
          Stripe ティア: {stripeTierCount} / BMC: {hasBmc ? "あり" : "なし"}
        </li>
        <li>サーバー runtime: {runtimeFromServer ? "使用中 (FILM_LAB_*)" : "未使用（NEXT_PUBLIC のみ）"}</li>
        <li>
          プレゼン:{" "}
          <span className={presentMode ? "text-orange-300" : "text-neutral-400"}>
            {presentMode ? "ON（モーダルは出ません）" : "OFF"}
          </span>
        </li>
        <li>
          保存後モーダル状態:{" "}
          <span className={saveModalOpen ? "text-green-300" : "text-neutral-400"}>
            {saveModalOpen ? "開いています" : "閉じています"}
          </span>
        </li>
        <li className="border-t border-white/10 pt-2">
          ゲート: <span className="font-mono">{diagnosis.reason}</span>
        </li>
        <li className="text-white/80">{diagnosis.hintJa}</li>
      </ul>
      <dl className="mt-2 space-y-0.5 border-t border-white/10 pt-2 font-mono text-[9px] text-white/50">
        <dt className="text-white/40">never</dt>
        <dd className="break-all">{String(diagnosis.details.presetModalNever ?? "—")}</dd>
        <dt className="text-white/40">session modal</dt>
        <dd>{String(diagnosis.details.sessionModalShown ?? "—")}</dd>
        <dt className="text-white/40">lastAt</dt>
        <dd className="break-all">{String(diagnosis.details.presetModalLastAt ?? "—")}</dd>
        <dt className="text-white/40">supporterAck（Thanks 戻り・サーバ未検証）</dt>
        <dd>{String(diagnosis.details.supporterAck ?? "—")}</dd>
      </dl>
      <div className="mt-3 flex flex-col gap-2">
        <button
          type="button"
          className="rounded-md bg-amber-600/80 px-2 py-1.5 text-[11px] font-medium text-black hover:bg-amber-500"
          onClick={() => {
            filmLabDebugResetDonationNudgeKeys();
            tick();
            filmLabDonationDebugLog("パネル: ナッジキー削除後の診断", filmLabDiagnosePresetSaveModal());
          }}
        >
          ナッジ状態をリセット
        </button>
        <button
          type="button"
          className="rounded-md border border-white/20 px-2 py-1.5 text-[11px] text-white/90 hover:bg-white/10 disabled:opacity-40"
          disabled={!donationEnabled}
          onClick={() => {
            filmLabDonationDebugLog("パネル: テストでモーダルを開く");
            onTestOpenModal();
          }}
        >
          テストでモーダルを開く
        </button>
        <button
          type="button"
          className="rounded-md border border-white/15 px-2 py-1 text-[10px] text-white/60 hover:bg-white/5"
          onClick={() => {
            filmLabDonationDebugLog("ストレージキー一覧", { ...FILM_LAB_DONATION_STORAGE_KEYS });
            filmLabDonationDebugLog("再診断", filmLabDiagnosePresetSaveModal());
          }}
        >
          コンソールに再ログ
        </button>
      </div>
      <p className="mt-2 text-[9px] leading-tight text-white/35">
        起動: URL に ?filmLabDebugDonation=1 を付与、またはコンソールで
        localStorage.setItem(&quot;filmLabDebugDonation&quot;,&quot;1&quot;) してリロード。next dev
        では「このブラウザに保存」で常に [FilmLab donation dev] が出ます。
      </p>
    </div>
  );
}
