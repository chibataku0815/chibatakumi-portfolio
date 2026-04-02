/**
 * @fileoverview Web 動画書き出し（VideoEncoder）が想定するブラウザかの軽い判定。
 *
 * @overview Filmtone Web のエクスポートは Chromium 系の `VideoEncoder` 実装を主前提とする。
 *   Safari 単体では `isConfigSupported` と `encode` のギャップで失敗しやすい。
 * @limitations UA 依存。iOS の Chrome（CriOS）は Chromium 扱いで Safari 扱いにしない。
 */

/**
 * @description デスクトップ／モバイルの **Apple Safari 相当**で、Chromium 系ではないと判断できるとき true。
 *   （Web 動画書き出しベータをオフにする・警告する用途）
 */
export function isSafariOnlyForWebVideoExport(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // Brave / Arc 等も UA に Chrome を含むことが多い
  const chromiumLike = /Chrome|Chromium|Edg|OPR|CriOS|FxiOS/i.test(ua);
  if (chromiumLike) return false;
  return /Safari/i.test(ua);
}
