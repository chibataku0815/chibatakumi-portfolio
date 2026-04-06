/**
 * Blur Mask Reveal — Composition #29
 *
 * Style: minimalDark — Luxury brand launch on structured grid.
 *
 * Background layers (always visible, no clip):
 *   - Center glow gradient (depth / spotlight)
 *   - Dot grid (editorial structure, 48px spacing)
 *   - Bleed frame (print-like border at 80px margin)
 *   - Watermark ("PREMIUM" at 680px, 4% alpha)
 *
 * Foreground layers:
 *   - Main reveal: "PREMIUM" 220px, blur 14px→0 + left-to-right wipe
 *   - Subtitle: "SERIES  01" fade-in after reveal
 *
 * Phases:
 *   0-7    Pre-delay (grid + watermark visible — scene has depth)
 *   8-36   Reveal: blur + wipe (28 frames, expoOut)
 *   40-64  Subtitle fade-in
 *   64-89  Hold — full composition
 */
import React, { useCallback } from "react";
import {
  CanvasScene,
  W,
  H,
  drawDust,
  drawVignette,
  sr,
  progress,
  quintOut,
} from "../../lib/canvas-primitives";
import { quintInOut } from "../../lib/canvas-easing";
import { config } from "./config";

// ---------------------------------------------------------------------------
// Grain
// ---------------------------------------------------------------------------
const GRAIN_W = 480;
const GRAIN_H = 270;

const getGrainCanvas = (() => {
  let gc: HTMLCanvasElement | null = null;
  return () => {
    if (!gc) {
      gc = document.createElement("canvas");
      gc.width = GRAIN_W;
      gc.height = GRAIN_H;
    }
    return gc;
  };
})();

function drawGrain(
  ctx: CanvasRenderingContext2D,
  frame: number,
  intensity: number,
): void {
  const gc = getGrainCanvas();
  const gctx = gc.getContext("2d")!;
  const imageData = gctx.createImageData(GRAIN_W, GRAIN_H);
  const d = imageData.data;
  const scale = intensity / 100;

  for (let i = 0; i < d.length; i += 4) {
    const noise = (sr(frame * 130000 + i) - 0.5) * 255 * scale;
    const v = 128 + noise;
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v;
    d[i + 3] = 20;
  }
  gctx.putImageData(imageData, 0, 0);

  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.drawImage(gc, 0, 0, W, H);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Background: center glow — subtle radial gradient for depth
// ---------------------------------------------------------------------------
function drawCenterGlow(ctx: CanvasRenderingContext2D): void {
  const gradient = ctx.createRadialGradient(
    W / 2,
    H / 2,
    0,
    W / 2,
    H / 2,
    W * 0.55,
  );
  gradient.addColorStop(0, "#1e1e1e");
  gradient.addColorStop(1, config.palette.bg);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
}

// ---------------------------------------------------------------------------
// Background: dot grid — editorial structural texture
// ---------------------------------------------------------------------------
function drawDotGrid(ctx: CanvasRenderingContext2D): void {
  const CELL = 48;
  const DOT_R = 1.5;
  ctx.save();
  ctx.fillStyle = `${config.palette.primary}1a`; // ~10% alpha
  for (let y = CELL; y < H; y += CELL) {
    for (let x = CELL; x < W; x += CELL) {
      ctx.beginPath();
      ctx.arc(x, y, DOT_R, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Background: bleed frame — editorial border
// ---------------------------------------------------------------------------
function drawBleedFrame(ctx: CanvasRenderingContext2D): void {
  const M = 80;
  ctx.save();
  ctx.strokeStyle = `${config.palette.primary}22`; // ~13% alpha
  ctx.lineWidth = 1;
  ctx.strokeRect(M + 0.5, M + 0.5, W - M * 2, H - M * 2);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Background: watermark — oversized text for depth
// ---------------------------------------------------------------------------
function drawWatermark(ctx: CanvasRenderingContext2D): void {
  const { watermark } = config;
  const alphaHex = Math.round(watermark.alpha * 255)
    .toString(16)
    .padStart(2, "0");
  ctx.save();
  ctx.font = `${watermark.fontWeight} ${watermark.fontSize}px ${config.font}`;
  ctx.letterSpacing = `${config.letterSpacing}em`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = `${config.palette.primary}${alphaHex}`;
  ctx.fillText(watermark.text, W / 2, H / 2 - 20);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Main draw function
// ---------------------------------------------------------------------------
const draw = (ctx: CanvasRenderingContext2D, frame: number): void => {
  const { subtitle } = config;

  // ===== BACKGROUND LAYERS (always visible) =====
  ctx.fillStyle = config.palette.bg;
  ctx.fillRect(0, 0, W, H);

  drawCenterGlow(ctx);
  drawDotGrid(ctx);
  drawBleedFrame(ctx);
  drawWatermark(ctx);

  // ===== FOREGROUND: Main text reveal =====
  const elapsed = frame - config.preDelay;

  if (elapsed >= 0) {
    const rawT = Math.min(1, elapsed / config.revealDuration);
    const t = quintInOut(rawT);

    const blurAmount = config.maxBlur * (1 - t);
    const wipeX = W * t;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, wipeX, H);
    ctx.clip();

    if (blurAmount > 0.1) {
      ctx.filter = `blur(${blurAmount}px)`;
    }

    // Main text
    ctx.font = `${config.fontWeight} ${config.fontSize}px ${config.font}`;
    ctx.letterSpacing = `${config.letterSpacing}em`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = config.palette.primary;
    ctx.fillText(config.text, W / 2, H / 2 - 20);

    ctx.filter = "none";

    // Accent line
    const lineX = W / 2 - config.accentLineWidth / 2;
    const lineY = H / 2 - 20 + config.accentLineOffsetY;
    ctx.fillStyle = config.palette.accent;
    ctx.fillRect(lineX, lineY, config.accentLineWidth, config.accentLineHeight);

    ctx.restore();
  }

  // ===== FOREGROUND: Subtitle fade-in =====
  const revealEnd = config.preDelay + config.revealDuration;
  const subtitleStart = revealEnd + subtitle.fadeDelay;
  const subtitleAlpha = progress(
    frame,
    subtitleStart,
    subtitle.fadeDuration,
    quintOut,
  );

  if (subtitleAlpha > 0.001) {
    ctx.save();
    ctx.globalAlpha = subtitleAlpha * subtitle.alpha;
    ctx.font = `${subtitle.fontWeight} ${subtitle.fontSize}px ${config.font}`;
    ctx.letterSpacing = `${subtitle.letterSpacing}em`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = config.palette.primary;
    const subtitleY = H / 2 - 20 + config.accentLineOffsetY + 36;
    ctx.fillText(subtitle.text, W / 2, subtitleY);
    ctx.restore();
  }

  // ===== SCREEN-SPACE FINISHING =====
  drawGrain(ctx, frame, config.texture.grain);
  drawVignette(ctx, config.texture.vignette);
  drawDust(ctx, frame, 4, `${config.palette.primary}0f`);
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const BlurMaskReveal: React.FC = () => {
  const stableDraw = useCallback(draw, []);
  return <CanvasScene draw={stableDraw} />;
};
