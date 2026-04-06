/**
 * Cross Dissolve — Composition #32
 *
 * Motion technique: Cinematic opacity crossfade between two acts.
 * Style: CinemaScope letterbox, EB Garamond 300 lower-third typography,
 * 35mm film grain (overlay blend), warm light-leak (screen blend),
 * rule-of-thirds composition lines, teal-orange accent palette.
 *
 * Phases:
 *   0-14   Act One static
 *   15-35  Crossfade dissolve (cubicInOut) + light-leak + Scene B text fade-in
 *   36-59  Act Two static
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
import { cubicInOut, quintOut } from '../../lib/canvas-easing';
import { loadFont } from '@remotion/google-fonts/EBGaramond';
import { config } from './config';

// ---------------------------------------------------------------------------
// Font setup
// ---------------------------------------------------------------------------
const { fontFamily } = loadFont();

// ---------------------------------------------------------------------------
// Grain dimensions (quarter-res for performance, scaled up)
// ---------------------------------------------------------------------------
const GRAIN_W = 480;
const GRAIN_H = 270;

// ---------------------------------------------------------------------------
// Draw rule-of-thirds composition lines (subtle, cinematic)
// ---------------------------------------------------------------------------
function drawRuleOfThirds(ctx: CanvasRenderingContext2D) {
  const { letterboxHeight } = config;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  // Vertical thirds
  ctx.moveTo(W / 3, letterboxHeight);
  ctx.lineTo(W / 3, H - letterboxHeight);
  ctx.moveTo((2 * W) / 3, letterboxHeight);
  ctx.lineTo((2 * W) / 3, H - letterboxHeight);
  // Horizontal thirds (within safe area)
  const safeH = H - 2 * letterboxHeight;
  ctx.moveTo(0, letterboxHeight + safeH / 3);
  ctx.lineTo(W, letterboxHeight + safeH / 3);
  ctx.moveTo(0, letterboxHeight + (2 * safeH) / 3);
  ctx.lineTo(W, letterboxHeight + (2 * safeH) / 3);
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Draw spaced text (Canvas 2D letterSpacing emulation)
// ---------------------------------------------------------------------------
function drawSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
  color: string,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  // Measure total width with spacing
  const chars = text.split('');
  const charWidths = chars.map((c) => ctx.measureText(c).width);
  const totalWidth =
    charWidths.reduce((sum, w) => sum + w, 0) +
    spacing * (chars.length - 1);

  let cx = x - totalWidth / 2;
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], cx, y);
    cx += charWidths[i] + spacing;
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Draw a cinematic scene: near-black bg + rule-of-thirds + lower-third title
// ---------------------------------------------------------------------------
function drawScene(
  ctx: CanvasRenderingContext2D,
  color: string,
  label: string,
  textAlpha: number,
) {
  const { letterboxHeight } = config;

  // Background fill
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);

  // Rule-of-thirds composition lines
  drawRuleOfThirds(ctx);

  // Accent teal line — thin horizontal at lower-third marker
  const safeH = H - 2 * letterboxHeight;
  const lowerThirdY = letterboxHeight + safeH * 0.72;
  ctx.save();
  ctx.strokeStyle = config.palette.teal;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W * 0.32, lowerThirdY - 60);
  ctx.lineTo(W * 0.68, lowerThirdY - 60);
  ctx.stroke();
  ctx.restore();

  // Title text — EB Garamond 300 120px, lower-third position
  ctx.save();
  ctx.font = `300 120px '${fontFamily}', serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // 0.08em letter-spacing: measure one em then multiply
  const emWidth = ctx.measureText('M').width;
  const spacing = emWidth * 0.08;

  drawSpacedText(
    ctx,
    label,
    W / 2,
    lowerThirdY,
    spacing,
    config.palette.primary,
    textAlpha,
  );
  ctx.restore();

  // Secondary subtitle — warm grey, smaller
  ctx.save();
  ctx.font = `300 32px '${fontFamily}', serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const subSpacing = ctx.measureText('M').width * 0.12;
  drawSpacedText(
    ctx,
    'CROSS DISSOLVE',
    W / 2,
    lowerThirdY + 48,
    subSpacing,
    config.palette.secondary,
    textAlpha * 0.7,
  );
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Film grain (overlay blend, seeded per-frame)
// ---------------------------------------------------------------------------
function drawGrain(ctx: CanvasRenderingContext2D, frame: number) {
  const grainCanvas = new OffscreenCanvas(GRAIN_W, GRAIN_H);
  const gCtx = grainCanvas.getContext('2d')!;
  const gData = gCtx.createImageData(GRAIN_W, GRAIN_H);
  const { grain } = config.texture;

  for (let i = 0; i < GRAIN_W * GRAIN_H; i++) {
    const v = sr(frame * 130000 + i) * 255;
    const idx = i * 4;
    gData.data[idx] = v;
    gData.data[idx + 1] = v;
    gData.data[idx + 2] = v;
    gData.data[idx + 3] = grain; // exact style dict value: 35
  }
  gCtx.putImageData(gData, 0, 0);

  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(grainCanvas, 0, 0, W, H);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Light-leak during dissolve (screen blend, warm orange radial)
// ---------------------------------------------------------------------------
function drawLightLeak(
  ctx: CanvasRenderingContext2D,
  frame: number,
  transitionStart: number,
  transitionEnd: number,
) {
  if (frame < transitionStart || frame >= transitionEnd) return;

  const rawT = (frame - transitionStart) / (transitionEnd - transitionStart);
  // Bell curve: strongest at mid-dissolve
  const leakIntensity = Math.sin(rawT * Math.PI);

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const leak = ctx.createRadialGradient(
    W * 0.15, H * 0.2, 0,
    W * 0.15, H * 0.2, W * 0.6,
  );
  // Scale alpha by bell curve — peak 0.12 at mid-dissolve (visible on dark bg)
  const peakAlpha = 0.12 * leakIntensity;
  const midAlpha = 0.05 * leakIntensity;
  leak.addColorStop(0, `rgba(212,118,58,${peakAlpha.toFixed(3)})`);
  leak.addColorStop(0.5, `rgba(212,118,58,${midAlpha.toFixed(3)})`);
  leak.addColorStop(1, 'rgba(212,118,58,0)');
  ctx.fillStyle = leak;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// CinemaScope letterbox bars (2.35:1)
// ---------------------------------------------------------------------------
function drawLetterbox(ctx: CanvasRenderingContext2D) {
  const { letterboxHeight } = config;
  ctx.save();
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, letterboxHeight);
  ctx.fillRect(0, H - letterboxHeight, W, letterboxHeight);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Main draw
// ---------------------------------------------------------------------------
const draw = (ctx: CanvasRenderingContext2D, frame: number): void => {
  const { transitionStart, transitionDuration, sceneA, sceneB } = config;
  const transitionEnd = transitionStart + transitionDuration;

  if (frame < transitionStart) {
    // --- Act One static ---
    drawScene(ctx, sceneA.color, sceneA.label, 1.0);
  } else if (frame < transitionEnd) {
    // --- Crossfade dissolve ---
    const rawT = (frame - transitionStart) / transitionDuration;
    const t = cubicInOut(Math.max(0, Math.min(1, rawT)));

    // Scene A fading out
    ctx.save();
    ctx.globalAlpha = 1 - t;
    drawScene(ctx, sceneA.color, sceneA.label, 1.0);
    ctx.restore();

    // Scene B fading in
    ctx.save();
    ctx.globalAlpha = t;
    // Scene B text appears with delayed fade (second half of dissolve)
    const textT = Math.max(0, (rawT - 0.4) / 0.6);
    const textAlpha = quintOut(Math.min(1, textT));
    drawScene(ctx, sceneB.color, sceneB.label, textAlpha);
    ctx.restore();

    // Light-leak overlay during transition
    drawLightLeak(ctx, frame, transitionStart, transitionEnd);
  } else {
    // --- Act Two static ---
    drawScene(ctx, sceneB.color, sceneB.label, 1.0);
  }

  // --- Ambient layers (composited on top) ---
  drawDust(ctx, frame, 3, 'rgba(232,228,220,0.08)');
  drawGrain(ctx, frame);
  drawVignette(ctx, config.texture.vignette);

  // --- CinemaScope letterbox (LAST — covers everything) ---
  drawLetterbox(ctx);
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const CrossDissolve: React.FC = () => {
  const stableDraw = useCallback(draw, []);
  return <CanvasScene draw={stableDraw} />;
};
