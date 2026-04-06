/**
 * Push-in / Pull-out — Composition #35
 *
 * Style: minimalDark — Quiet refinement. Whitespace is the hero.
 *
 * Camera motion technique: Scale-based push-in then pull-out,
 * with text cross-fade during hold phase (FOCUS -> CLARITY).
 * Center-weighted grid, 65% whitespace, Inter weight 200 hero.
 *
 * Phases:
 *   0-59   Push-in:  scale 1.0 -> 1.08 (expoOut)
 *   60-74  Hold:     cross-fade FOCUS -> CLARITY
 *   75-119 Pull-out: scale 1.08 -> 1.0 (quintOut)
 */
import React, { useCallback } from 'react';
import {
  CanvasScene,
  W,
  H,
  drawDust,
  drawVignette,
  sr,
} from '../../lib/canvas-primitives';
import { expoOut, quintOut } from '../../lib/canvas-easing';
import {
  applyCameraTransform,
  getPushIn,
  type CameraTransform,
} from '../../lib/canvas-camera';
import { loadFont } from '@remotion/google-fonts/Inter';
import { config } from './config';

const { fontFamily } = loadFont();

// ---------------------------------------------------------------------------
// Corner index labels — design system aesthetic
// ---------------------------------------------------------------------------
const CORNERS = [
  { label: '001', x: 160, y: 80 },
  { label: '002', x: W - 160, y: 80 },
  { label: '003', x: 160, y: H - 80 },
  { label: '004', x: W - 160, y: H - 80 },
] as const;

// ---------------------------------------------------------------------------
// Grain — 1/4 resolution noise upscaled with overlay blending
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

function drawGrain(
  ctx: CanvasRenderingContext2D,
  frame: number,
  intensity: number,
): void {
  const gc = getGrainCanvas();
  const gctx = gc.getContext('2d')!;
  const imageData = gctx.createImageData(GRAIN_W, GRAIN_H);
  const d = imageData.data;

  for (let i = 0; i < d.length; i += 4) {
    const v = sr(frame * 130000 + i) * 255;
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v;
    d[i + 3] = intensity; // grain=5 — essentially invisible
  }
  gctx.putImageData(imageData, 0, 0);

  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(gc, 0, 0, W, H);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Center-weighted grid — crosshairs at center + thirds, alpha 0.04
// ---------------------------------------------------------------------------
function drawCenterGrid(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.strokeStyle = `${config.palette.primary}0a`; // ~4% alpha
  ctx.lineWidth = 0.5;
  ctx.beginPath();

  // Vertical thirds
  const thirdX1 = W / 3;
  const thirdX2 = (W * 2) / 3;
  ctx.moveTo(thirdX1, 0);
  ctx.lineTo(thirdX1, H);
  ctx.moveTo(thirdX2, 0);
  ctx.lineTo(thirdX2, H);

  // Horizontal thirds
  const thirdY1 = H / 3;
  const thirdY2 = (H * 2) / 3;
  ctx.moveTo(0, thirdY1);
  ctx.lineTo(W, thirdY1);
  ctx.moveTo(0, thirdY2);
  ctx.lineTo(W, thirdY2);

  // Center crosshair
  const cx = W / 2;
  const cy = H / 2;
  const crossLen = 40;
  ctx.moveTo(cx - crossLen, cy);
  ctx.lineTo(cx + crossLen, cy);
  ctx.moveTo(cx, cy - crossLen);
  ctx.lineTo(cx, cy + crossLen);

  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Draw hero text with letterSpacing
// ---------------------------------------------------------------------------
function drawHeroText(
  ctx: CanvasRenderingContext2D,
  text: string,
  alpha: number,
): void {
  if (alpha < 0.005) return;

  const { hero } = config;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `${hero.weight} ${hero.size}px ${fontFamily}, sans-serif`;
  ctx.letterSpacing = `${hero.letterSpacing}em`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = config.palette.primary;
  ctx.fillText(text, W / 2, H / 2);
  ctx.letterSpacing = '0em';
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Draw the static demo scene (camera will transform this)
// ---------------------------------------------------------------------------
function drawDemoScene(
  ctx: CanvasRenderingContext2D,
  frame: number,
): void {
  const { pushDuration, holdDuration, pullDuration } = config;
  const holdStart = pushDuration;
  const pullStart = holdStart + holdDuration;

  // Background — extra padding for camera movement
  ctx.fillStyle = config.palette.bg;
  ctx.fillRect(-200, -200, W + 400, H + 400);

  // Center-weighted grid
  drawCenterGrid(ctx);

  // --- Text cross-fade logic ---
  // Push phase: FOCUS at full alpha
  // Hold phase: cross-fade FOCUS -> CLARITY
  // Pull phase: CLARITY at full alpha
  if (frame < holdStart) {
    // Push-in: FOCUS visible
    drawHeroText(ctx, config.textPush, 1.0);
  } else if (frame < pullStart) {
    // Hold: cross-fade
    const holdT = (frame - holdStart) / holdDuration;
    const fadeT = expoOut(Math.max(0, Math.min(1, holdT)));
    drawHeroText(ctx, config.textPush, 1.0 - fadeT);
    drawHeroText(ctx, config.textPull, fadeT);
  } else {
    // Pull-out: CLARITY visible
    drawHeroText(ctx, config.textPull, 1.0);
  }

  // Accent underline — sparse usage, 60% of text width
  ctx.save();
  ctx.font = `${config.hero.weight} ${config.hero.size}px ${fontFamily}, sans-serif`;
  ctx.letterSpacing = `${config.hero.letterSpacing}em`;
  // Measure against the currently visible text
  const measureText = frame < pullStart ? config.textPush : config.textPull;
  const textWidth = ctx.measureText(measureText).width;
  ctx.letterSpacing = '0em';
  const lineW = textWidth * config.accentLineRatio;
  ctx.fillStyle = config.palette.accent;
  ctx.fillRect(
    W / 2 - lineW / 2,
    H / 2 + config.hero.size * 0.5 + 12,
    lineW,
    config.accentLineHeight,
  );
  ctx.restore();

  // Corner labels — design system index numbers
  ctx.save();
  ctx.font = `${config.corner.weight} ${config.corner.size}px ${fontFamily}, sans-serif`;
  ctx.fillStyle = config.palette.secondary;
  for (const corner of CORNERS) {
    ctx.textAlign = corner.x < W / 2 ? 'left' : 'right';
    ctx.textBaseline = corner.y < H / 2 ? 'top' : 'bottom';
    ctx.fillText(corner.label, corner.x, corner.y);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Compute camera transform for current frame
// ---------------------------------------------------------------------------
function getCameraForFrame(frame: number): CameraTransform {
  const { pushDuration, holdDuration, pullDuration, pushScale } = config;
  const holdStart = pushDuration;
  const pullStart = holdStart + holdDuration;

  if (frame < holdStart) {
    // Push-in phase — expoOut: decisive entry, 90% scale reached early
    return getPushIn(frame, {
      startFrame: 0,
      duration: pushDuration,
      startScale: 1.0,
      endScale: pushScale,
      easing: expoOut,
    });
  }

  if (frame < pullStart) {
    // Hold phase — locked at push scale
    return { translateX: 0, translateY: 0, scale: pushScale, rotation: 0 };
  }

  // Pull-out phase — quintOut: smooth, unhurried retreat
  return getPushIn(frame, {
    startFrame: pullStart,
    duration: pullDuration,
    startScale: pushScale,
    endScale: 1.0,
    easing: quintOut,
  });
}

// ---------------------------------------------------------------------------
// Main draw function
// ---------------------------------------------------------------------------
const draw = (ctx: CanvasRenderingContext2D, frame: number): void => {
  // Camera-space content
  const camera = getCameraForFrame(frame);
  ctx.save();
  applyCameraTransform(ctx, camera);
  drawDemoScene(ctx, frame);
  ctx.restore();

  // Screen-space overlays (post-camera)
  drawDust(ctx, frame, 3, `${config.palette.primary}0f`); // 3 particles, alpha ~6%
  drawGrain(ctx, frame, config.texture.grain);
  drawVignette(ctx, config.texture.vignette);
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const PushInPullOut: React.FC = () => {
  const stableDraw = useCallback(draw, []);
  return <CanvasScene draw={stableDraw} />;
};
