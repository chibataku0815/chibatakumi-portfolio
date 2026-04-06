/**
 * Parallax Drift — Composition #36
 *
 * Style: cinematic — CinemaScope letterbox, 35mm film grain,
 * warm Kodak tones, EB Garamond serif typography.
 *
 * Camera motion: Oscillating elliptical drift on 3 depth planes.
 * Sine-based movement gives natural acceleration at center
 * and smooth deceleration at direction reversals.
 * Every frame has visible motion — no dead stillness zones.
 *
 * Layers:
 *   Background (depth 0.3): sparse grid + glowing particles + "FAR"
 *   Midground  (depth 1.0): main serif text + accent line
 *   Foreground (depth 2.5): large translucent bokeh circles
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
  type CameraTransform,
} from '../../lib/canvas-camera';
import { loadFont } from '@remotion/google-fonts/EBGaramond';
import { config } from './config';

// ---------------------------------------------------------------------------
// Font setup
// ---------------------------------------------------------------------------
const { fontFamily } = loadFont();

// ---------------------------------------------------------------------------
// Per-layer drift — each layer has its own frequency & amplitude
// Different frequencies = layers move in different directions at times
// ---------------------------------------------------------------------------
function getLayerDrift(
  frame: number,
  driftX: { amplitude: number; cycles: number },
  driftY: { amplitude: number; cycles: number },
): CameraTransform {
  const t = frame / config.totalFrames;
  return {
    translateX: -Math.sin(t * Math.PI * 2 * driftX.cycles) * driftX.amplitude,
    translateY: -Math.sin(t * Math.PI * 2 * driftY.cycles) * driftY.amplitude,
    scale: 1,
    rotation: 0,
  };
}

// ---------------------------------------------------------------------------
// Film grain — 1/4 resolution noise upscaled with overlay blending
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
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v;
    d[i + 3] = 25;
  }
  gctx.putImageData(imageData, 0, 0);

  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(gc, 0, 0, W, H);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Draw background layer (depth 0.3) — grid + particles + text
// ---------------------------------------------------------------------------
function drawBackgroundLayer(ctx: CanvasRenderingContext2D): void {
  const layer = config.layers.background;
  const { palette, typography } = config;

  // Sparse wide grid — clear visual anchor for speed difference
  ctx.strokeStyle = `rgba(232,228,220,0.06)`;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = -400; x <= W + 400; x += layer.gridCell) {
    ctx.moveTo(x, -300);
    ctx.lineTo(x, H + 300);
  }
  for (let y = -300; y <= H + 300; y += layer.gridCell) {
    ctx.moveTo(-400, y);
    ctx.lineTo(W + 400, y);
  }
  ctx.stroke();

  // Glowing particles — clearly visible
  for (let i = 0; i < layer.particleCount; i++) {
    const x = sr(i * 5 + 200) * (W + 600) - 300;
    const y = sr(i * 5 + 201) * (H + 400) - 200;
    const radius = 2 + sr(i * 5 + 202) * 4;
    const isTeal = sr(i * 5 + 203) > 0.5;
    const color = isTeal ? palette.teal : palette.accent;

    // Glow halo
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 4);
    glow.addColorStop(0, color + '30');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(x - radius * 4, y - radius * 4, radius * 8, radius * 8);

    // Bright core
    ctx.fillStyle = color + '80';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // "FAR" text
  ctx.font = `${typography.bgTextWeight} ${typography.bgTextSize}px ${fontFamily}, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = `${typography.letterSpacing}em`;
  ctx.fillStyle = palette.secondary;
  ctx.fillText(layer.text, W / 2, H / 2 - 200);
  ctx.letterSpacing = '0em';
}

// ---------------------------------------------------------------------------
// Draw midground layer (depth 1.0) — main serif typography
// ---------------------------------------------------------------------------
function drawMidgroundLayer(ctx: CanvasRenderingContext2D): void {
  const layer = config.layers.midground;
  const { palette, typography } = config;

  ctx.font = `${typography.heroWeight} ${typography.heroSize}px ${fontFamily}, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = `${typography.letterSpacing}em`;
  ctx.fillStyle = palette.primary;
  ctx.fillText(layer.text, W / 2, H / 2);

  const textWidth = ctx.measureText(layer.text).width;
  ctx.fillStyle = palette.accent;
  ctx.fillRect(W / 2 - textWidth / 2, H / 2 + 70, textWidth, 2);

  ctx.font = `${typography.headingWeight} ${typography.headingSize}px ${fontFamily}, serif`;
  ctx.fillStyle = palette.muted;
  ctx.fillText(layer.subtitle, W / 2, H / 2 + 120);
  ctx.letterSpacing = '0em';
}

// ---------------------------------------------------------------------------
// Draw foreground layer (depth 2.5) — large translucent bokeh
// ---------------------------------------------------------------------------
function drawForegroundLayer(ctx: CanvasRenderingContext2D): void {
  const { palette } = config;

  for (let i = 0; i < config.layers.foreground.bokeh.length; i++) {
    const b = config.layers.foreground.bokeh[i];
    const isTeal = i % 2 === 1;
    const color = isTeal ? palette.teal : palette.accent;

    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);

    // Soft fill — brighter toward edge (bokeh characteristic)
    const fill = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
    fill.addColorStop(0, color + '0a');
    fill.addColorStop(0.7, color + '10');
    fill.addColorStop(0.9, color + '25');
    fill.addColorStop(1, color + '08');
    ctx.fillStyle = fill;
    ctx.fill();

    // Bright ring edge
    ctx.strokeStyle = color + '35';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

// ---------------------------------------------------------------------------
// Letterbox — 2.35:1 CinemaScope
// ---------------------------------------------------------------------------
function drawLetterbox(ctx: CanvasRenderingContext2D): void {
  const h = config.letterbox.barHeight;
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, h);
  ctx.fillRect(0, H - h, W, h);
}

// ---------------------------------------------------------------------------
// Main draw function
// ---------------------------------------------------------------------------
const draw = (ctx: CanvasRenderingContext2D, frame: number): void => {
  // 1. Base background
  ctx.fillStyle = config.palette.bg;
  ctx.fillRect(0, 0, W, H);

  // 2. Background layer (slow gentle drift — near-static)
  const bg = config.layers.background;
  ctx.save();
  ctx.globalAlpha = bg.opacity;
  applyCameraTransform(ctx, getLayerDrift(frame, bg.driftX, bg.driftY));
  drawBackgroundLayer(ctx);
  ctx.restore();

  // 3. Midground layer (moderate swing)
  const mg = config.layers.midground;
  ctx.save();
  ctx.globalAlpha = mg.opacity;
  applyCameraTransform(ctx, getLayerDrift(frame, mg.driftX, mg.driftY));
  drawMidgroundLayer(ctx);
  ctx.restore();

  // 4. Foreground layer (fast dramatic sweep — different frequency)
  const fg = config.layers.foreground;
  ctx.save();
  ctx.globalAlpha = fg.opacity;
  applyCameraTransform(ctx, getLayerDrift(frame, fg.driftX, fg.driftY));
  drawForegroundLayer(ctx);
  ctx.restore();

  // 5. Screen-space finishing
  drawFilmGrain(ctx, frame, config.texture.grain);
  drawVignette(ctx, config.texture.vignette);
  drawDust(ctx, frame, 4, `${config.palette.primary}12`);

  // 6. Letterbox (last)
  drawLetterbox(ctx);
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const ParallaxDrift: React.FC = () => {
  const stableDraw = useCallback(draw, []);
  return <CanvasScene draw={stableDraw} />;
};
