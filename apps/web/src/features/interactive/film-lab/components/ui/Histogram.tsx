"use client";

import { useRef, useEffect, useCallback } from "react";
import type { Viewport } from "../../core/Viewport";

interface HistogramProps {
  viewport: Viewport | null;
  visible?: boolean;
}

export function Histogram({ viewport, visible = true }: HistogramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);

  const DEBOUNCE_MS = 150;
  const CANVAS_W = 160;
  const CANVAS_H = 60;

  const updateHistogram = useCallback(() => {
    if (!viewport || !canvasRef.current || !visible) return;

    const now = performance.now();
    if (now - lastUpdateRef.current < DEBOUNCE_MS) {
      rafRef.current = requestAnimationFrame(updateHistogram);
      return;
    }
    lastUpdateRef.current = now;

    const data = viewport.getHistogramPixels();
    if (!data) return;

    const { pixels, width, height } = data;

    // 256 bins x 4 channels (R, G, B, L)
    const binsR = new Uint32Array(256);
    const binsG = new Uint32Array(256);
    const binsB = new Uint32Array(256);
    const binsL = new Uint32Array(256);

    // サンプリング (4ピクセルに1回で高速化)
    const step = 4;
    for (let i = 0; i < width * height * 4; i += 4 * step) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const luma = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
      binsR[r]++;
      binsG[g]++;
      binsB[b]++;
      binsL[Math.min(255, luma)]++;
    }

    // 最大値 (正規化用) — 端の bin (0, 255) を除外してクリッピングの影響を排除
    let maxVal = 1;
    for (let i = 1; i < 255; i++) {
      maxVal = Math.max(maxVal, binsR[i], binsG[i], binsB[i], binsL[i]);
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // 描画関数
    const drawChannel = (bins: Uint32Array, color: string) => {
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_H);
      for (let i = 0; i < 256; i++) {
        const x = (i / 255) * CANVAS_W;
        const h = Math.min(1, bins[i] / maxVal) * CANVAS_H;
        ctx.lineTo(x, CANVAS_H - h);
      }
      ctx.lineTo(CANVAS_W, CANVAS_H);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    // RGB + Luminance 描画 (半透明で重ね合わせ)
    ctx.globalCompositeOperation = "screen";
    drawChannel(binsR, "rgba(255, 60, 60, 0.5)");
    drawChannel(binsG, "rgba(60, 255, 60, 0.5)");
    drawChannel(binsB, "rgba(60, 100, 255, 0.5)");

    // Luminance はオーバーレイ
    ctx.globalCompositeOperation = "source-over";
    drawChannel(binsL, "rgba(255, 255, 255, 0.15)");

    // 次のフレームをスケジュール
    rafRef.current = requestAnimationFrame(updateHistogram);
  }, [viewport, visible]);

  useEffect(() => {
    if (visible && viewport) {
      rafRef.current = requestAnimationFrame(updateHistogram);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [visible, viewport, updateHistogram]);

  if (!visible) return null;

  return (
    <div className="absolute top-3 right-3 z-10 rounded-lg bg-black/40 p-1.5 backdrop-blur-sm">
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="block rounded"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}
