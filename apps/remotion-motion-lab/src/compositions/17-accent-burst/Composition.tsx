/**
 * #17 Accent Burst — brutalist style (v2)
 *
 * Motion vocabulary:
 *   - Center "C" slams in with backOut overshoot (frames 0-9)
 *   - Pulsing ring around monogram (continuous)
 *   - 35 elements (incl. 5 hero-scale) burst outward (frames 6-28)
 *   - Hold with AGGRESSIVE secondary motion: ±15° rotation, ±8% breathing (frames 30-67)
 *   - Exit with strong outward drift (70px) (frames 68-87)
 *   - Background scanlines for brutalist texture density
 *
 * Style: brutalist — #000000 bg, #ffffff/#ccff00, Bebas Neue 320px,
 *        grain=40, vignette=0, 95% density.
 */

import React, { useCallback } from 'react';
import {
  CanvasScene,
  W,
  H,
  progress,
  sr,
  quintOut,
  backOut,
} from '../../lib/canvas-primitives';
import { expoOut } from '../../lib/canvas-easing';
import { loadFont } from '@remotion/google-fonts/BebasNeue';
import { config } from './config';

// ---------------------------------------------------------------------------
// Font setup
// ---------------------------------------------------------------------------
const { fontFamily } = loadFont();

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
// Scanlines — subtle horizontal lines for brutalist texture
// ---------------------------------------------------------------------------
function drawScanlines(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.fillStyle = `rgba(255,255,255,${config.scanlineAlpha})`;
  for (let y = 0; y < H; y += config.scanlineGap) {
    ctx.fillRect(0, y, W, 1);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Shape types
// ---------------------------------------------------------------------------
type ShapeKind = 'circle' | 'square' | 'line' | 'strokeCircle' | 'hero';

interface ElementData {
  angle: number;
  distance: number;
  shape: ShapeKind;
  renderMode: 'fill' | 'stroke' | 'fillStroke';
  color: string;
  size: number;
  lineWidth: number;
  rotationTarget: number;
  staggerDelay: number;
  baseAlpha: number;
  breathingPhase: number;
}

// ---------------------------------------------------------------------------
// Pre-computed per-element data (deterministic via sr)
// ---------------------------------------------------------------------------
function buildElements(): ElementData[] {
  const elements: ElementData[] = [];
  const goldenAngleDeg = 137.5;
  const DEG = Math.PI / 180;
  const total = config.elementCount;

  for (let i = 0; i < total; i++) {
    const perturbation = (sr(i * 13 + 7) - 0.5) * 16 * DEG;
    const angle = i * goldenAngleDeg * DEG + perturbation;
    const distance = config.maxDistance * (0.55 + sr(i) * 0.8);

    // Shape: first heroElementCount are hero-scale, rest distributed
    let shape: ShapeKind;
    if (i < config.heroElementCount) {
      shape = 'hero';
    } else {
      const mod5 = (i - config.heroElementCount) % 5;
      if (mod5 === 0 || mod5 === 1) shape = 'circle';
      else if (mod5 === 2) shape = 'square';
      else if (mod5 === 4) shape = 'line';
      else shape = i >= 25 ? 'strokeCircle' : 'square';
    }

    // Color: hero elements always accent, rest by ratio
    const color =
      shape === 'hero'
        ? (i % 2 === 0 ? config.accent : config.primary)
        : sr(i * 11 + 3) < config.colorRatio
          ? config.primary
          : config.accent;

    // Size
    let size: number;
    let lineWidth = 2;
    const ranges = config.sizeRanges;
    switch (shape) {
      case 'hero':
        size = ranges.hero.min + sr(i * 3 + 20) * (ranges.hero.max - ranges.hero.min);
        lineWidth = 3;
        break;
      case 'circle':
        size = ranges.circle.min + sr(i * 3 + 1) * (ranges.circle.max - ranges.circle.min);
        break;
      case 'square':
        size = ranges.square.min + sr(i * 3 + 2) * (ranges.square.max - ranges.square.min);
        break;
      case 'line':
        size = ranges.line.minLength + sr(i * 3 + 3) * (ranges.line.maxLength - ranges.line.minLength);
        lineWidth = ranges.line.minWidth + sr(i * 3 + 4) * (ranges.line.maxWidth - ranges.line.minWidth);
        break;
      case 'strokeCircle':
        size = ranges.strokeCircle.min + sr(i * 3 + 5) * (ranges.strokeCircle.max - ranges.strokeCircle.min);
        lineWidth = ranges.strokeCircle.minWidth + sr(i * 3 + 6) * (ranges.strokeCircle.maxWidth - ranges.strokeCircle.minWidth);
        break;
    }

    // Render mode: hero elements are fillStroke, strokeCircle is stroke, some circles are fillStroke
    let renderMode: 'fill' | 'stroke' | 'fillStroke';
    if (shape === 'hero') renderMode = 'fillStroke';
    else if (shape === 'strokeCircle') renderMode = 'stroke';
    else if (shape === 'circle' && sr(i * 17 + 5) < 0.25) renderMode = 'fillStroke';
    else renderMode = 'fill';

    const rotationTarget = sr(i * 5 + 11) * 360;
    const staggerDelay = i * config.staggerInterval;
    const baseAlpha = config.alphaRange.min + sr(i * 7 + 9) * (config.alphaRange.max - config.alphaRange.min);
    const breathingPhase = sr(i * 19 + 13) * Math.PI * 2;

    elements.push({
      angle, distance, shape, renderMode, color, size, lineWidth,
      rotationTarget, staggerDelay, baseAlpha, breathingPhase,
    });
  }
  return elements;
}

const ELEMENTS = buildElements();
const DEG_TO_RAD = Math.PI / 180;

// ---------------------------------------------------------------------------
// Draw helpers
// ---------------------------------------------------------------------------
function drawShape(ctx: CanvasRenderingContext2D, el: ElementData) {
  switch (el.shape) {
    case 'hero': {
      // Hero elements: large filled circle with thick stroke ring
      ctx.beginPath();
      ctx.arc(0, 0, el.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = el.lineWidth;
      ctx.globalAlpha *= 0.6;
      ctx.stroke();
      break;
    }
    case 'circle':
      ctx.beginPath();
      ctx.arc(0, 0, el.size, 0, Math.PI * 2);
      if (el.renderMode === 'fillStroke') {
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        ctx.fill();
      }
      break;
    case 'square':
      ctx.fillRect(-el.size, -el.size, el.size * 2, el.size * 2);
      if (el.renderMode === 'fillStroke') {
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-el.size, -el.size, el.size * 2, el.size * 2);
      }
      break;
    case 'line':
      ctx.lineWidth = el.lineWidth;
      ctx.beginPath();
      ctx.moveTo(-el.size, 0);
      ctx.lineTo(el.size, 0);
      ctx.stroke();
      break;
    case 'strokeCircle':
      ctx.lineWidth = el.lineWidth;
      ctx.beginPath();
      ctx.arc(0, 0, el.size, 0, Math.PI * 2);
      ctx.stroke();
      break;
  }
}

// ---------------------------------------------------------------------------
// Main draw function
// ---------------------------------------------------------------------------
function draw(ctx: CanvasRenderingContext2D, frame: number, _fps: number) {
  const cx = W / 2;
  const cy = H / 2;

  // -- Background
  ctx.fillStyle = config.bg;
  ctx.fillRect(0, 0, W, H);

  // -- Scanlines (brutalist texture)
  drawScanlines(ctx);

  // -- Pulsing ring around center
  {
    const ringAlpha =
      0.1 +
      Math.sin(frame * 0.1) * config.centerRingPulseAmplitude;
    const ringScale = 1 + Math.sin(frame * 0.07) * 0.05;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(ringScale, ringScale);
    ctx.globalAlpha = Math.max(0, ringAlpha);
    ctx.strokeStyle = config.accent;
    ctx.lineWidth = config.centerRingStrokeWidth;
    ctx.beginPath();
    ctx.arc(0, 0, config.centerRingRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // -- Center monogram
  {
    const scaleT = progress(
      frame, 0, config.centerScaleInFrames,
      (t: number) => backOut(t, config.centerScaleOvershoot),
    );

    let monoAlpha = 1;
    let monoExitScale = 1;
    if (frame >= config.exitStart) {
      const exitT = progress(frame, config.exitStart, config.exitDuration, quintOut);
      monoAlpha = 1 - exitT;
      monoExitScale = 1 + exitT * 0.08;
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scaleT * monoExitScale, scaleT * monoExitScale);
    ctx.globalAlpha = monoAlpha;
    ctx.font = `400 ${config.centerFontSize}px "${fontFamily}", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = config.primary;
    ctx.fillText(config.centerText, 0, 0);

    // Accent stroke outline
    if (frame >= config.holdStart) {
      ctx.strokeStyle = `rgba(204,255,0,${config.centerStrokeAlpha})`;
      ctx.lineWidth = config.centerStrokeWidth;
      ctx.strokeText(config.centerText, 0, 0);
    }
    ctx.restore();
  }

  // -- Burst elements
  for (let i = 0; i < ELEMENTS.length; i++) {
    const el = ELEMENTS[i];
    const elStart = config.burstStart + el.staggerDelay;

    if (frame < elStart) continue;

    const burstT = progress(frame, elStart, config.burstDuration, expoOut);

    let exitT = 0;
    if (frame >= config.exitStart) {
      exitT = progress(frame, config.exitStart, config.exitDuration, quintOut);
    }

    // Position
    const drift = exitT * config.exitDrift;
    const dist = burstT * el.distance + drift;
    const x = cx + Math.cos(el.angle) * dist;
    const y = cy + Math.sin(el.angle) * dist;

    // Rotation: burst + aggressive secondary oscillation
    const burstRotation = burstT * el.rotationTarget * DEG_TO_RAD;
    let secondaryRotation = 0;
    if (frame >= config.holdStart && frame <= config.holdEnd) {
      const holdFrame = frame - config.holdStart;
      secondaryRotation =
        Math.sin(holdFrame * config.rotationFrequency + el.breathingPhase) *
        config.rotationAmplitudeDeg * DEG_TO_RAD;
    }

    // Scale: 0.2 → 1.0 during burst + aggressive breathing during hold
    const burstScale = 0.2 + burstT * 0.8;
    let breathScale = 1.0;
    if (frame >= config.holdStart && frame <= config.holdEnd) {
      const holdFrame = frame - config.holdStart;
      breathScale =
        1.0 +
        Math.sin(
          holdFrame * config.breathingFrequency +
          el.breathingPhase + Math.PI / 3,
        ) * config.breathingAmplitude;
    }

    // Alpha
    const alpha = el.baseAlpha * (1 - exitT);
    if (alpha <= 0.01) continue;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(burstRotation + secondaryRotation);
    ctx.scale(burstScale * breathScale, burstScale * breathScale);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = el.color;
    ctx.strokeStyle = el.color;

    drawShape(ctx, el);
    ctx.restore();
  }

  // -- Film grain (final pass)
  ctx.globalAlpha = 1;
  drawFilmGrain(ctx, frame, config.grain);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const AccentBurst: React.FC = () => {
  const drawCb = useCallback(
    (ctx: CanvasRenderingContext2D, frame: number, fps: number) => {
      draw(ctx, frame, fps);
    },
    [],
  );
  return <CanvasScene draw={drawCb} />;
};
