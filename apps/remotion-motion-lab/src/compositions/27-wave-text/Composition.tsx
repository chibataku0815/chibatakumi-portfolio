/**
 * Wave Text — Composition #27
 *
 * Motion technique: Per-character sine-wave vertical oscillation.
 * Each character is offset vertically by a sine function with
 * phase shift based on character index, producing a smooth wave
 * that flows through the text.
 *
 * Style: Retro / analog film — warm palette, film grain,
 * light-leak, and organic motion.
 *
 * Continuous animation — the wave loops seamlessly across all frames.
 */
import React, { useCallback } from "react";
import {
  CanvasScene,
  W,
  H,
  sr,
  drawVignette,
} from "../../lib/canvas-primitives";
import { loadFont } from "@remotion/google-fonts/Fraunces";
import { config } from "./config";

const { fontFamily } = loadFont();

// ---------------------------------------------------------------------------
// Main draw function
// ---------------------------------------------------------------------------
const draw = (ctx: CanvasRenderingContext2D, frame: number): void => {
  // --- Background ---
  ctx.fillStyle = config.palette.bg;
  ctx.fillRect(0, 0, W, H);

  // --- Font setup ---
  ctx.font = `${config.fontWeight} ${config.fontSize}px ${fontFamily}, serif`;
  ctx.textBaseline = "middle";

  // --- Measure each character width for proper spacing ---
  const chars = config.text.split("");
  const charWidths: number[] = chars.map((ch) => ctx.measureText(ch).width);
  const totalWidth = charWidths.reduce((sum, w) => sum + w, 0);

  // --- Starting X for centered text ---
  let cursorX = (W - totalWidth) / 2;
  const baseY = H / 2;

  // --- Draw each character with wave offset ---
  for (let i = 0; i < chars.length; i++) {
    const sineValue = Math.sin(
      i * config.frequency + frame * config.speed,
    );
    const waveOffset = sineValue * config.amplitude;

    // Wider opacity variation — more dramatic light/dark
    const alpha = 0.5 + 0.5 * Math.abs(sineValue);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = config.palette.primary;
    ctx.fillText(chars[i], cursorX, baseY + waveOffset);
    ctx.restore();

    cursorX += charWidths[i];
  }

  // --- Film grain — retro DNA ---
  const GRAIN_W = 480, GRAIN_H = 270;
  const grainCanvas = new OffscreenCanvas(GRAIN_W, GRAIN_H);
  const gCtx = grainCanvas.getContext('2d')!;
  const gData = gCtx.createImageData(GRAIN_W, GRAIN_H);
  for (let i = 0; i < GRAIN_W * GRAIN_H; i++) {
    const v = sr(frame * 130000 + i) * 255;
    const idx = i * 4;
    gData.data[idx] = v * 1.02;      // warm R bias
    gData.data[idx + 1] = v;
    gData.data[idx + 2] = v * 0.97;  // cool B reduction
    gData.data[idx + 3] = config.texture.grain; // 60
  }
  gCtx.putImageData(gData, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(grainCanvas, 0, 0, W, H);
  ctx.restore();

  // --- Light-leak — warm glow from top-left ---
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const leak = ctx.createRadialGradient(
    W * 0.15, H * 0.2, 0,       // center: top-left area
    W * 0.15, H * 0.2, W * 0.6  // radius: covers ~60% of frame
  );
  leak.addColorStop(0, 'rgba(212,118,58,0.10)');   // accent at center
  leak.addColorStop(0.5, 'rgba(212,118,58,0.04)');
  leak.addColorStop(1, 'rgba(212,118,58,0)');
  ctx.fillStyle = leak;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // --- Film particles (warm, larger than dust) ---
  for (let i = 0; i < 10; i++) {
    const px = (sr(i * 7 + 1) * W + frame * 0.3 * (sr(i * 7 + 3) - 0.3)) % W;
    const py = (sr(i * 7 + 2) * H + frame * 0.15 * (sr(i * 7 + 4) - 0.5)) % H;
    const size = 1.5 + sr(i * 7 + 5) * 2.5; // 1.5-4px
    ctx.save();
    ctx.fillStyle = 'rgba(240,236,228,0.15)'; // warm #f0ece4 at 15%
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // --- Vignette (strong) ---
  drawVignette(ctx, config.texture.vignette);
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const WaveText: React.FC = () => {
  const stableDraw = useCallback(draw, []);
  return <CanvasScene draw={stableDraw} />;
};
