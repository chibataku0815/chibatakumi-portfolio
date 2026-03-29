/**
 * @file Film Lab 共通 — 優先度の低い長文を OS ネイティブ `title` ツールチップへ逃がす補助ボタン
 * @description Radix 等は使わず、ブラウザ標準のツールチップに任せる（依存とバンドル増を避ける）
 * @limitations キーボードのみの環境では `title` が出ない場合あり。重要な注意は本文に残す
 */

"use client";

/**
 * @description `?` ボタン。`tip` をホバー・フォーカス時に表示
 */
export type FilmLabInfoTipProps = {
  /** @description ツールチップ全文 */
  tip: string;
  /** @description aria-label（`tip` と同じ長文を繰り返さない） */
  assistiveLabel: string;
  /** @description 追加 class */
  className?: string;
};

/**
 * @description 小型の補足ボタン。見た目は `?` 1 文字
 */
export function FilmLabInfoTip(props: FilmLabInfoTipProps) {
  const { tip, assistiveLabel, className = "" } = props;
  return (
    <button
      type="button"
      className={`inline-flex size-[18px] shrink-0 items-center justify-center rounded text-white/40 outline-none hover:bg-white/10 hover:text-amber-200/90 focus-visible:ring-1 focus-visible:ring-amber-400/60 ${className}`}
      title={tip}
      aria-label={`${assistiveLabel}（ホバーで詳細）`}
    >
      <span className="text-[11px] font-semibold leading-none" aria-hidden>
        ?
      </span>
    </button>
  );
}
