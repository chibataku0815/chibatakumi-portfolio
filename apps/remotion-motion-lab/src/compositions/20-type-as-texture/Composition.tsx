/**
 * #20 Type as Texture — editorial style (v5)
 *
 * Graph paper grid as design foundation.
 * 3 text rows scroll within the grid framework.
 * One red major grid line + red vertical spine = editorial accent.
 * Difference composite creates interference patterns.
 */

import React, { useCallback } from 'react';
import {
  CanvasScene,
  W,
  H,
  quintOut,
  progress,
  sr,
  drawVignette,
} from '../../lib/canvas-primitives';
import { loadFont } from '@remotion/google-fonts/PlayfairDisplay';
import { config } from './config';

const { fontFamily } = loadFont();

// ---------------------------------------------------------------------------
// Film grain
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
  grainAlpha: number,
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
    d[i + 3] = grainAlpha;
  }
  gctx.putImageData(imageData, 0, 0);

  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(gc, 0, 0, W, H);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Graph paper grid
// ---------------------------------------------------------------------------
function drawGrid(ctx: CanvasRenderingContext2D, alpha: number): void {
  const g = config.grid;

  // Minor grid lines
  ctx.save();
  ctx.globalAlpha = g.minorAlpha * alpha;
  ctx.strokeStyle = g.color;
  ctx.lineWidth = g.minorWidth;
  ctx.beginPath();
  for (let x = g.minorGap; x < W; x += g.minorGap) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  for (let y = g.minorGap; y < H; y += g.minorGap) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();
  ctx.restore();

  // Major grid lines
  ctx.save();
  ctx.lineWidth = g.majorWidth;
  ctx.beginPath();
  let majorIndex = 0;
  for (let x = g.majorGap; x < W; x += g.majorGap) {
    ctx.save();
    ctx.globalAlpha = g.majorAlpha * alpha;
    ctx.strokeStyle = g.color;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
    ctx.restore();
  }
  majorIndex = 0;
  for (let y = g.majorGap; y < H; y += g.majorGap) {
    const isAccent = majorIndex === g.accentLineIndex - 1;
    ctx.save();
    if (isAccent) {
      ctx.globalAlpha = 0.6 * alpha;
      ctx.strokeStyle = config.palette.accent;
      ctx.lineWidth = 1.5;
    } else {
      ctx.globalAlpha = g.majorAlpha * alpha;
      ctx.strokeStyle = g.color;
      ctx.lineWidth = g.majorWidth;
    }
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    ctx.restore();
    majorIndex++;
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Scrolling text row
// ---------------------------------------------------------------------------
function drawTextRow(
  ctx: CanvasRenderingContext2D,
  y: number,
  offset: number,
  alpha: number,
  fontSize: number,
  fontWeight: number,
  inverted: boolean,
): void {
  if (alpha <= 0.005) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", serif`;
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = `${config.typography.letterSpacing}em`;
  ctx.fillStyle = config.palette.primary;

  const tw = ctx.measureText(config.text).width;
  const gap = fontSize * 0.12;
  const step = tw + gap;
  const normOffset = ((offset % step) + step) % step;

  ctx.translate(0, y);
  if (inverted) {
    ctx.translate(W / 2, 0);
    ctx.rotate(Math.PI);
    ctx.translate(-W / 2, 0);
  }

  const startX = -step + normOffset;
  for (let x = startX; x < W + step; x += step) {
    ctx.fillText(config.text, x, 0);
  }

  ctx.letterSpacing = '0em';
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Main draw
// ---------------------------------------------------------------------------
const draw = (ctx: CanvasRenderingContext2D, frame: number): void => {
  ctx.fillStyle = config.palette.bg;
  ctx.fillRect(0, 0, W, H);

  const fade = progress(frame, 0, config.fadeInDuration, quintOut);

  // Grid (under everything)
  drawGrid(ctx, fade);

  // Red vertical spine (aligned with first major grid line)
  {
    const sp = config.spine;
    ctx.save();
    ctx.globalAlpha = sp.alpha * fade;
    ctx.strokeStyle = config.palette.accent;
    ctx.lineWidth = sp.lineWidth;
    ctx.beginPath();
    ctx.moveTo(sp.x, sp.yStart);
    ctx.lineTo(sp.x, sp.yEnd);
    ctx.stroke();
    ctx.restore();
  }

  // Annotation
  {
    const a = config.annotation;
    ctx.save();
    ctx.globalAlpha = a.alpha * fade;
    ctx.font = `400 ${a.fontSize}px "${fontFamily}", serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.letterSpacing = `${a.letterSpacing}em`;
    ctx.fillStyle = config.palette.primary;
    ctx.fillText(a.text, a.x, a.y);
    ctx.letterSpacing = '0em';
    ctx.restore();
  }

  // Normal text (source-over)
  ctx.globalCompositeOperation = 'source-over';
  for (const row of config.rows) {
    const rowFade = progress(frame, row.staggerDelay, 18, quintOut);
    const alpha = fade * rowFade * row.normalAlpha;
    const offset = frame * row.speed * row.normalDirection;
    drawTextRow(ctx, row.y, offset, alpha, row.fontSize, row.fontWeight, false);
  }

  // Inverted text (difference)
  ctx.globalCompositeOperation = 'difference';
  for (const row of config.rows) {
    const rowFade = progress(frame, row.staggerDelay, 18, quintOut);
    const alpha = fade * rowFade * row.invertedAlpha;
    const offset = frame * row.speed * -row.normalDirection;
    drawTextRow(ctx, row.y, offset, alpha, row.fontSize, row.fontWeight, true);
  }

  // Finish
  ctx.globalCompositeOperation = 'source-over';
  drawFilmGrain(ctx, frame, config.texture.grain, config.texture.grainAlpha);
  drawVignette(ctx, config.texture.vignette);
};

export const TypeAsTexture: React.FC = () => {
  const stableDraw = useCallback(draw, []);
  return <CanvasScene draw={stableDraw} />;
};
