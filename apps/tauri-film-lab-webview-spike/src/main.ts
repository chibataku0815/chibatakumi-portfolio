/**
 * @fileoverview Film Lab WebView 能力スパイクのエントリ。
 * DOM 読み込み後に `runWebviewCapabilityProbe` を実行し、結果を画面に表示する。
 */

import { invoke } from "@tauri-apps/api/core";
import { runWebviewCapabilityProbe } from "./webviewCapabilityProbe";

/**
 * Tauri 起動時のみ、同じレポートを Rust 経由で stderr にコピーする（自動検証向け）。
 *
 * @param report {string} プローブ文字列
 * @returns {Promise<void>}
 */
async function maybeMirrorProbeToStderr(report: string): Promise<void> {
  try {
    await invoke("emit_probe_report", { report });
  } catch {
    /* ブラウザ単体・Playwright 等では無視 */
  }
}

/**
 * レポートを #report に書き込む。
 *
 * @returns {Promise<void>}
 */
async function renderReport(): Promise<void> {
  const el = document.querySelector("#report");
  if (!(el instanceof HTMLElement)) {
    console.error("renderReport: #report が見つかりません");
    return;
  }
  el.textContent = "計測中…";
  try {
    const text = await runWebviewCapabilityProbe();
    el.textContent = text;
    await maybeMirrorProbeToStderr(text);
  } catch (err) {
    const message =
      err instanceof Error ? err.stack ?? err.message : String(err);
    el.textContent = `プローブ例外:\n${message}`;
    console.error("runWebviewCapabilityProbe failed", err);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  void renderReport();
  document.querySelector("#reload")?.addEventListener("click", () => {
    void renderReport();
  });
});
