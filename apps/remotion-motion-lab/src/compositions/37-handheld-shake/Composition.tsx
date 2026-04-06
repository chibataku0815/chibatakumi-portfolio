/**
 * Handheld Shake — Composition #37
 *
 * Style: retro — Warm documentary feel with Fraunces serif,
 * heavy film grain (60/100), and vintage viewfinder overlay.
 *
 * Camera motion technique: Continuous organic camera shake using
 * summed sine waves. A static viewfinder overlay provides the
 * visual anchor that makes the shake perceivable as camera motion.
 *
 * Shake is ALWAYS active — no phases, continuous throughout.
 */
import React, { useCallback } from 'react';
import {
  CanvasScene,
  W,
  H,
  sr,
  drawDust,
  drawVignette,
} from '../../lib/canvas-primitives';
import {
  applyCameraTransform,
  getHandheldShake,
} from '../../lib/canvas-camera';
import { loadFont as loadFraunces } from '@remotion/google-fonts/Fraunces';
import { loadFont as loadBaskerville } from '@remotion/google-fonts/LibreBaskerville';
import { config } from './config';

// ---------------------------------------------------------------------------
// Font setup
// ---------------------------------------------------------------------------
const { fontFamily: fraunces } = loadFraunces();
const { fontFamily: baskerville } = loadBaskerville();

// ---------------------------------------------------------------------------
// Film grain — 1/4 resolution warm-tinted temporal noise
// ---------------------------------------------------------------------------
const GRAIN_W = 480;
const GRAIN_H = 270;

const getGrainCanvas = (() => {
  let gc: HTMLCanvasElement | null = null;
  return () => {
    if (!gc) {
      gc = document.createElement('canvas');
      gc.width = GRAIN_W;
      gc.height = GRAIN_H;
    }
    return gc;
  };
})();

function drawFilmGrain(
  ctx: CanvasRenderingContext2D,
  frame: number,
  intensity: number,
): void {
  const gc = getGrainCanvas();
  const gctx = gc.getContext('2d')!;
  const imageData = gctx.createImageData(GRAIN_W, GRAIN_H);
  const d = imageData.data;
  const scale = intensity / 100;

  for (let i = 0; i < d.length; i += 4) {
    const noise = (sr(frame * 130000 + i) - 0.5) * 255 * scale;
    const v = 128 + noise;
    // Warm-tinted grain: slightly orange bias
    d[i] = v + 3;       // R — warm shift
    d[i + 1] = v;       // G
    d[i + 2] = v - 2;   // B — cooler
    d[i + 3] = 28;       // slightly higher alpha for heavier grain
  }
  gctx.putImageData(imageData, 0, 0);

  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(gc, 0, 0, W, H);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Pre-computed registration mark positions
// ---------------------------------------------------------------------------
interface RegMark {
  x: number;
  y: number;
  alpha: number;
}

const REG_MARKS: RegMark[] = Array.from(
  { length: config.registrationMarkCount },
  (_, i) => ({
    x: sr(i * 3 + 500) * (W - 200) + 100,
    y: sr(i * 3 + 501) * (H - 200) + 100,
    alpha: 0.15 + sr(i * 3 + 502) * 0.2,
  }),
);

// ---------------------------------------------------------------------------
// Draw the demo scene (camera will transform this)
// ---------------------------------------------------------------------------
function drawDemoScene(ctx: CanvasRenderingContext2D): void {
  const { palette, typography } = config;

  // Background — extended for camera shake
  ctx.fillStyle = palette.bg;
  ctx.fillRect(-200, -200, W + 400, H + 400);

  // Registration marks (+ cross marks — film alignment aesthetic)
  const markSize = 6;
  ctx.lineWidth = 0.8;
  for (const mark of REG_MARKS) {
    ctx.strokeStyle = `rgba(184,169,154,${mark.alpha})`;
    ctx.beginPath();
    ctx.moveTo(mark.x - markSize, mark.y);
    ctx.lineTo(mark.x + markSize, mark.y);
    ctx.moveTo(mark.x, mark.y - markSize);
    ctx.lineTo(mark.x, mark.y + markSize);
    ctx.stroke();
  }

  // Subtitle — "A FILM BY" above main text
  ctx.font = `${typography.headingWeight} ${typography.headingSize}px ${baskerville}, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = `${typography.letterSpacing}em`;
  ctx.fillStyle = palette.secondary;
  ctx.fillText(config.subtitle, W / 2, H / 2 - 100);

  // Main text — "MEMORY" in Fraunces serif
  ctx.font = `${typography.heroWeight} ${typography.heroSize}px ${fraunces}, serif`;
  ctx.fillStyle = palette.primary;
  ctx.fillText(config.text, W / 2, H / 2);

  // Accent line — thin burnt orange
  const textWidth = ctx.measureText(config.text).width;
  ctx.fillStyle = palette.accent;
  ctx.fillRect(W / 2 - textWidth / 2, H / 2 + 70, textWidth, 1.5);

  // Caption — "SUPER 8 × 2026" at bottom
  ctx.font = `${typography.headingWeight} ${typography.captionSize}px ${baskerville}, serif`;
  ctx.fillStyle = palette.accent;
  ctx.fillText(config.caption, W / 2, H - 120);
  ctx.letterSpacing = '0em';
}

// ---------------------------------------------------------------------------
// Viewfinder overlay functions (screen-space — static visual anchor)
// ---------------------------------------------------------------------------
function drawLetterbox(ctx: CanvasRenderingContext2D): void {
  const h = config.viewfinder.letterboxHeight;
  ctx.fillStyle = config.viewfinder.letterboxColor;
  ctx.fillRect(0, 0, W, h);
  ctx.fillRect(0, H - h, W, h);
}

function drawCornerMarks(ctx: CanvasRenderingContext2D): void {
  const { cornerMarkLength: len, cornerMarkThickness: lw, cornerMarkInset: inset } =
    config.viewfinder;
  ctx.strokeStyle = config.palette.primary;
  ctx.lineWidth = lw;
  ctx.lineCap = 'butt';

  const corners = [
    { x: inset, y: inset, dx: 1, dy: 1 },
    { x: W - inset, y: inset, dx: -1, dy: 1 },
    { x: inset, y: H - inset, dx: 1, dy: -1 },
    { x: W - inset, y: H - inset, dx: -1, dy: -1 },
  ];

  ctx.beginPath();
  for (const c of corners) {
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x + len * c.dx, c.y);
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x, c.y + len * c.dy);
  }
  ctx.stroke();
}

function drawCrosshair(ctx: CanvasRenderingContext2D): void {
  const { crosshairSize: size, crosshairThickness: lw } = config.viewfinder;
  const cx = W / 2;
  const cy = H / 2;
  ctx.strokeStyle = `${config.palette.primary}20`;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(cx - size, cy);
  ctx.lineTo(cx + size, cy);
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx, cy + size);
  ctx.stroke();
}

function drawRecIndicator(
  ctx: CanvasRenderingContext2D,
  frame: number,
): void {
  const { recDotRadius: r } = config.viewfinder;
  const x = 80;
  const y = config.viewfinder.letterboxHeight + 36;

  // Blink: visible 2/3 of the time (1-second cycle at 30fps)
  const blink = (frame % 30) < 20;
  if (!blink) return;

  // Warm orange dot
  ctx.fillStyle = config.palette.rec;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // "REC" text — warm orange
  ctx.font = `700 18px ${fraunces}, serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = config.palette.rec;
  ctx.fillText('REC', x + r + 8, y);
}

function drawTimecode(
  ctx: CanvasRenderingContext2D,
  frame: number,
): void {
  const fps = config.fps;
  const totalSeconds = frame / fps;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const frames = frame % fps;

  const tc = [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
    String(frames).padStart(2, '0'),
  ].join(':');

  const x = W - 80;
  const y = config.viewfinder.letterboxHeight + 36;

  ctx.font = '500 18px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = config.palette.primary;
  ctx.fillText(tc, x, y);
}

function drawSafeAreaGuide(ctx: CanvasRenderingContext2D): void {
  const ratio = config.viewfinder.safeAreaRatio;
  const insetX = (W * (1 - ratio)) / 2;
  const insetY = (H * (1 - ratio)) / 2;

  ctx.strokeStyle = config.palette.guide;
  ctx.lineWidth = 0.5;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(insetX, insetY, W * ratio, H * ratio);
  ctx.setLineDash([]);
}

function drawViewfinderOverlay(
  ctx: CanvasRenderingContext2D,
  frame: number,
): void {
  drawSafeAreaGuide(ctx);
  drawCornerMarks(ctx);
  drawCrosshair(ctx);
  drawRecIndicator(ctx, frame);
  drawTimecode(ctx, frame);
  drawLetterbox(ctx);
}

// ---------------------------------------------------------------------------
// Main draw function
// ---------------------------------------------------------------------------
const draw = (ctx: CanvasRenderingContext2D, frame: number): void => {
  // 1. Camera-space content with continuous handheld shake
  const camera = getHandheldShake(frame, {
    intensity: config.intensity,
  });
  ctx.save();
  applyCameraTransform(ctx, camera);
  drawDemoScene(ctx);
  ctx.restore();

  // 2. Screen-space finishing (stays fixed)
  drawFilmGrain(ctx, frame, config.texture.grain);
  drawVignette(ctx, config.texture.vignette);
  drawDust(ctx, frame, 4, `${config.palette.primary}10`);

  // 3. Viewfinder overlay (stays fixed — the critical visual anchor)
  drawViewfinderOverlay(ctx, frame);
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const HandheldShake: React.FC = () => {
  const stableDraw = useCallback(draw, []);
  return <CanvasScene draw={stableDraw} />;
};
