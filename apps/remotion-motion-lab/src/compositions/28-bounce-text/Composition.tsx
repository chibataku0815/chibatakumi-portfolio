/**
 * Bounce Text — Composition #28
 *
 * Motion technique: Per-character drop with bounceOut easing.
 * Each character falls from above and bounces to its rest position,
 * staggered by a fixed frame delay. Playful style with per-char
 * colors (coral/teal/yellow), character glow, breathing after settle,
 * radial gradient background, and subtle grain overlay.
 *
 * Phases:
 *   0-~55  Stagger bounce-in (each char: staggerDelay * i offset + 30f bounce)
 *   ~55-89 Breathing hold — all characters visible with ±2% scale pulse
 */
import React, { useCallback } from "react";
import {
  CanvasScene,
  W,
  H,
  sr,
  drawVignette,
} from "../../lib/canvas-primitives";
import { bounceOut } from "../../lib/canvas-easing";
import { loadFont } from "@remotion/google-fonts/Nunito";
import { config } from "./config";

const { fontFamily } = loadFont();

// ---------------------------------------------------------------------------
// Measure individual character widths and compute centered layout
// ---------------------------------------------------------------------------
interface CharLayout {
  char: string;
  x: number;
}

function computeCharLayout(ctx: CanvasRenderingContext2D): CharLayout[] {
  ctx.font = `${config.fontWeight} ${config.fontSize}px ${fontFamily}, sans-serif`;

  const chars = config.text.split("");
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const totalWidth = widths.reduce((sum, w) => sum + w, 0);

  const layouts: CharLayout[] = [];
  let cursor = (W - totalWidth) / 2;

  for (let i = 0; i < chars.length; i++) {
    layouts.push({ char: chars[i], x: cursor });
    cursor += widths[i];
  }

  return layouts;
}

// ---------------------------------------------------------------------------
// Settle frame: when all characters have finished bouncing
// ---------------------------------------------------------------------------
const settleFrame =
  (config.text.length - 1) * config.staggerDelay + config.animDuration;

// ---------------------------------------------------------------------------
// Main draw function
// ---------------------------------------------------------------------------
const draw = (ctx: CanvasRenderingContext2D, frame: number): void => {
  // --- Background: radial gradient ---
  const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
  bgGrad.addColorStop(0, '#1f1f38');          // slightly lighter center
  bgGrad.addColorStop(1, config.palette.bg);  // #1a1a2e edge
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // --- Compute character layout ---
  const layouts = computeCharLayout(ctx);
  const centerY = H / 2;

  // --- Breathing transform (wraps all character drawing) ---
  const isBreathing = frame >= settleFrame;
  if (isBreathing) {
    const breathT = (frame - settleFrame) / 30; // one cycle = 30 frames (1s)
    const breathScale = 1.0 + 0.02 * Math.sin(2 * Math.PI * breathT);
    ctx.save();
    ctx.translate(W / 2, centerY);
    ctx.scale(breathScale, breathScale);
    ctx.translate(-W / 2, -centerY);
  }

  // --- Draw each character with bounce ---
  ctx.font = `${config.fontWeight} ${config.fontSize}px ${fontFamily}, sans-serif`;
  ctx.textBaseline = "middle";

  for (let i = 0; i < layouts.length; i++) {
    const charStart = i * config.staggerDelay;
    const elapsed = frame - charStart;

    if (elapsed < 0) continue;

    // Bounce progress: 0 → 1 over animDuration frames
    const rawT = Math.min(1, elapsed / config.animDuration);
    const bounceT = bounceOut(rawT);

    // Y position: drops from (centerY - dropHeight) to centerY
    const y = centerY - config.dropHeight * (1 - bounceT);

    // Alpha: 0 → 1 over the first alphaFadeFrames of this char's animation
    const alpha = Math.min(1, elapsed / config.alphaFadeFrames);

    if (alpha < 0.001) continue;

    // Per-character color
    const charColor = config.charColors[i % config.charColors.length];

    ctx.save();
    ctx.globalAlpha = alpha;

    // Character glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = charColor + '40'; // 25% alpha hex suffix

    ctx.fillStyle = charColor;
    ctx.fillText(layouts[i].char, layouts[i].x, y);

    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // --- End breathing transform ---
  if (isBreathing) {
    ctx.restore();
  }

  // --- Grain overlay (screen-space, not affected by breathing) ---
  const GRAIN_W = 480;
  const GRAIN_H = 270;
  const grainCanvas = new OffscreenCanvas(GRAIN_W, GRAIN_H);
  const gCtx = grainCanvas.getContext('2d')!;
  const gData = gCtx.createImageData(GRAIN_W, GRAIN_H);
  for (let i = 0; i < GRAIN_W * GRAIN_H; i++) {
    const v = sr(frame * 130000 + i) * 255;
    const idx = i * 4;
    gData.data[idx] = gData.data[idx + 1] = gData.data[idx + 2] = v;
    gData.data[idx + 3] = config.texture.grain; // 3
  }
  gCtx.putImageData(gData, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(grainCanvas, 0, 0, W, H);
  ctx.restore();

  // --- Vignette (screen-space) ---
  drawVignette(ctx, config.texture.vignette);
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const BounceText: React.FC = () => {
  const stableDraw = useCallback(draw, []);
  return <CanvasScene draw={stableDraw} />;
};
