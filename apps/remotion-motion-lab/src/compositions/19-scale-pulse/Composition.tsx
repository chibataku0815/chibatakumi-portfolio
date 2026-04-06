/**
 * Scale Pulse -- Composition #19
 *
 * Motion technique: The entire canvas content pulses
 * from minScale -> peakScale -> 1.0. Retro film style with
 * warm grain, accent lines, and elastic settle.
 *
 * Phases:
 *   0-23   Ramp up: scale 0.80 -> 1.20 (quintOut)
 *   24-43  Ramp down: scale 1.20 -> 1.00 (elasticOut — spring settle)
 *   44-89  Hold at 1.0
 */
import React, { useCallback } from "react";
import {
  CanvasScene,
  W,
  H,
  quintOut,
  sr,
  lerp,
  drawVignette,
} from "../../lib/canvas-primitives";
import { elasticOut } from "../../lib/canvas-easing";
import { loadFont } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadSubFont } from "@remotion/google-fonts/LibreBaskerville";
import { config } from "./config";

const { fontFamily: mainFontFamily } = loadFont();
const { fontFamily: subFontFamily } = loadSubFont();

// ---------------------------------------------------------------------------
// Compute scale value at a given frame
// ---------------------------------------------------------------------------
function scaleAt(frame: number): number {
  if (frame < config.rampUpDuration) {
    // Phase 1: ramp up  0.80 -> 1.20
    const t = quintOut(frame / config.rampUpDuration);
    return lerp(config.minScale, config.peakScale, t);
  }
  const downStart = config.rampUpDuration;
  const downEnd = downStart + config.rampDownDuration;
  if (frame < downEnd) {
    // Phase 2: ramp down  1.20 -> 1.00 (elasticOut for spring settle)
    const t = elasticOut((frame - downStart) / config.rampDownDuration);
    return lerp(config.peakScale, 1.0, t);
  }
  // Phase 3: hold at 1.0
  return 1.0;
}

// ---------------------------------------------------------------------------
// Main draw function
// ---------------------------------------------------------------------------
const draw = (ctx: CanvasRenderingContext2D, frame: number): void => {
  // --- Background (unscaled — fills canvas regardless of pulse) ---
  ctx.fillStyle = config.bgColor;
  ctx.fillRect(0, 0, W, H);

  // --- Apply scale pulse to all content ---
  const s = scaleAt(frame);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(s, s);
  ctx.translate(-W / 2, -H / 2);

  // --- Warm accent asymmetric lines (replaces grid) ---
  ctx.strokeStyle = `${config.accentColor}14`; // alpha ~0.08
  ctx.lineWidth = 1;
  const linePositions = [H * 0.25, H * 0.72, H * 0.48];
  for (const y of linePositions) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // --- Film particles (replaces drawDust — 8 warm particles) ---
  for (let i = 0; i < 8; i++) {
    const px = ((sr(i * 7 + 1) + 1) / 2) * W;
    const py = ((sr(i * 13 + 3) + 1) / 2) * H;
    const radius = 2 + sr(i * 19 + 5) * 1; // 2-4px range mapped to 1-3 offset
    ctx.beginPath();
    ctx.arc(px, py, Math.abs(radius) + 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(240, 236, 228, 0.12)"; // #f0ece4 at alpha 0.12
    ctx.fill();
  }

  // --- Main text ---
  ctx.font = `${config.mainFontWeight} ${config.mainFontSize}px ${mainFontFamily}, serif`;
  ctx.fillStyle = config.mainColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(config.mainText, W / 2, H * 0.45);

  // --- Subtitle ---
  ctx.font = `${config.subFontWeight} ${config.subFontSize}px ${subFontFamily}, serif`;
  ctx.fillStyle = config.subColor;
  ctx.fillText(config.subText, W / 2, H * 0.45 + 140);

  ctx.restore();

  // --- Film-temporal grain (frame-dependent — retro DNA) ---
  const GRAIN_W = 480;
  const GRAIN_H = 270;
  const grainCanvas = new OffscreenCanvas(GRAIN_W, GRAIN_H);
  const gCtx = grainCanvas.getContext("2d")!;
  const gData = gCtx.createImageData(GRAIN_W, GRAIN_H);
  for (let i = 0; i < GRAIN_W * GRAIN_H; i++) {
    const v = sr(frame * 130000 + i) * 255;
    const idx = i * 4;
    gData.data[idx] = v * 1.02; // R slightly warm
    gData.data[idx + 1] = v; // G
    gData.data[idx + 2] = v * 0.97; // B slightly cool (= warm overall)
    gData.data[idx + 3] = config.texture.grain; // alpha = 60
  }
  gCtx.putImageData(gData, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.drawImage(grainCanvas, 0, 0, W, H);
  ctx.restore();

  // --- Vignette ---
  drawVignette(ctx, config.texture.vignette);

  // --- VHS timestamp ---
  ctx.save();
  ctx.font = '14px "Courier New", monospace';
  ctx.fillStyle = config.subColor;
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("APR 2026", W - 80, H - 50);
  ctx.restore();
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const ScalePulse: React.FC = () => {
  const stableDraw = useCallback(draw, []);
  return <CanvasScene draw={stableDraw} />;
};
