"use client";

/**
 * @fileoverview WebGL プレビュー canvas の画をパネル領域に切り出し、2D + CSS blur で「すりガラス」相当を試す最短 PoC。
 *
 * @description
 * `backdrop-filter` は WebGL 背面で壊れやすいため、毎フレーム `drawImage` で取り込み、
 * 小さめバッファへ縮小してから `filter: blur()` を掛ける粗い近似です。
 *
 * @limitations
 * - CPU/GPU 負荷あり。本番品質ではシェーダー 1 パスが望ましい。
 * - パネルとキャンバスが画面内で重ならないときは描画をスキップする。
 */

import { useEffect, useRef, type RefObject } from "react";
import type { FilmLabCanvasRef } from "./FilmLabCanvas";

/** @description lg でデモパネルが WebGL 上に載るとき true。モバイル縦積みではオフ推奨。 */
export type FilmLabWebglPanelBackdropProps = {
  filmLabCanvasRef: RefObject<FilmLabCanvasRef | null>;
  panelRef: RefObject<HTMLElement | null>;
  enabled: boolean;
};

export function FilmLabWebglPanelBackdrop({
  filmLabCanvasRef,
  panelRef,
  enabled,
}: FilmLabWebglPanelBackdropProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let alive = true;
    let rafId = 0;

    const tick = () => {
      if (!alive) {
        return;
      }
      rafId = requestAnimationFrame(tick);

      const canvas = canvasRef.current;
      const src = filmLabCanvasRef.current?.getWebGlCanvas?.();
      const panelEl = panelRef.current;
      if (!canvas || !src || !panelEl) {
        return;
      }

      const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
      if (!ctx) {
        return;
      }

      const srcRect = src.getBoundingClientRect();
      const panelRect = panelEl.getBoundingClientRect();

      const interLeft = Math.max(panelRect.left, srcRect.left);
      const interTop = Math.max(panelRect.top, srcRect.top);
      const interRight = Math.min(panelRect.right, srcRect.right);
      const interBottom = Math.min(panelRect.bottom, srcRect.bottom);
      const interW = interRight - interLeft;
      const interH = interBottom - interTop;
      if (interW < 2 || interH < 2) {
        return;
      }

      const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
      const destW = Math.max(1, Math.floor(panelEl.clientWidth * dpr));
      const destH = Math.max(1, Math.floor(panelEl.clientHeight * dpr));
      if (canvas.width !== destW || canvas.height !== destH) {
        canvas.width = destW;
        canvas.height = destH;
      }

      const sx = ((interLeft - srcRect.left) / srcRect.width) * src.width;
      const sy = ((interTop - srcRect.top) / srcRect.height) * src.height;
      const sw = (interW / srcRect.width) * src.width;
      const sh = (interH / srcRect.height) * src.height;

      try {
        ctx.clearRect(0, 0, destW, destH);
        ctx.drawImage(src, sx, sy, sw, sh, 0, 0, destW, destH);
        ctx.fillStyle = "rgba(10, 12, 18, 0.38)";
        ctx.fillRect(0, 0, destW, destH);
      } catch {
        /* drawImage が弾かれる環境は無視（PoC） */
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(rafId);
    };
  }, [enabled, filmLabCanvasRef, panelRef]);

  if (!enabled) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="film-lab-webgl-backdrop-canvas pointer-events-none absolute inset-0 z-0 rounded-[inherit]"
      style={{
        width: "100%",
        height: "100%",
        filter: "blur(22px) saturate(1.28)",
        transform: "scale(1.06)",
      }}
      aria-hidden
    />
  );
}
