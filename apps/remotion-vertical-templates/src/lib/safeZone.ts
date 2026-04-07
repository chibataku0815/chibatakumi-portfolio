import type { CSSProperties } from "react";

/**
 * @fileoverview 縦型 SNS（1080×1920）向けのセーフゾーン定数。
 * ステータスバーやホームインジケータを避けるため、上下左右に余白を取る。
 * @restrictions 画角が変わったらこの数値だけ更新すれば各シーンに波及する想定。
 */

/** キャンバス幅（px） */
export const CANVAS_WIDTH = 1080;

/** キャンバス高さ（px） */
export const CANVAS_HEIGHT = 1920;

/**
 * プラットフォームの安全マージン（プロンプト指定値と一致）。
 * - top: 検索バー等
 * - bottom: スワイプ UI 等
 * - side: 端での欠け防止
 */
export const SAFE_ZONE = {
  /** 上端からの最小オフセット（px） */
  top: 150,
  /** 下端からの最小オフセット（px） */
  bottom: 170,
  /** 左右の最小オフセット（px） */
  side: 60,
} as const;

/**
 * コンテンツをセーフゾーン内に収めるためのパディング。
 * @returns AbsoluteFill の子にそのまま渡せるスタイル
 */
export function safeZonePadding(): CSSProperties {
  return {
    paddingTop: SAFE_ZONE.top,
    paddingBottom: SAFE_ZONE.bottom,
    paddingLeft: SAFE_ZONE.side,
    paddingRight: SAFE_ZONE.side,
    boxSizing: "border-box",
  };
}

/**
 * セーフゾーン内の利用可能幅（px）。
 * @returns {number} 中央コンテンツの最大幅
 */
export function safeContentWidth(): number {
  return CANVAS_WIDTH - SAFE_ZONE.side * 2;
}
