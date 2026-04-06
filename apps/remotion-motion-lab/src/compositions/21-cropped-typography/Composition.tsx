/**
 * #21 Cropped Typography — brutalist style (v2)
 *
 * 5-layer composition:
 *   Layer 1: Massive "MOTION" (1500px) — frame-bleeding with ghost misregistration
 *   Layer 2: Subtext "ANALOG TEXTURE" (64px) + page number "021"
 *   Layer 3: Dual accent lines (#ccff00, 5px) — horizontal slashes
 *   Layer 4: Bold registration marks — crosshairs with filled center dots
 *   Layer 5: Scanlines — brutalist background texture
 *
 * v2 improvements:
 *   - Ghost alpha 0.05→0.15, offset 3→6px (visible misregistration)
 *   - Registration marks 0.4→0.65 alpha, 1→2px stroke (bold and present)
 *   - Accent lines 2→5px, dual lines for rhythm
 *   - Y micro-drift 10→25px (visible organic motion)
 *   - Exit scale 1.08→1.10 (dramatic push-out)
 *   - Scanlines for brutalist density
 */

import React, { useCallback } from 'react';
import {
  CanvasScene,
  W,
  H,
  quintOut,
  cubicOut,
  lerp,
  progress,
  sr,
} from '../../lib/canvas-primitives';
import { expoOut, quadOut } from '../../lib/canvas-easing';
import { loadFont } from '@remotion/google-fonts/BebasNeue';
import { config } from './config';

// ---------------------------------------------------------------------------
// Font setup
// ---------------------------------------------------------------------------
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
// Scanlines
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
// Registration marks — bold crosshairs with filled center dots
// ---------------------------------------------------------------------------
function drawRegistrationMarks(
  ctx: CanvasRenderingContext2D,
  alpha: number,
  scale: number,
): void {
  const halfArm = config.regMarkSize / 2;
  const corners = [
    { x: config.regMarkInset, y: config.regMarkInset },
    { x: W - config.regMarkInset, y: config.regMarkInset },
    { x: config.regMarkInset, y: H - config.regMarkInset },
    { x: W - config.regMarkInset, y: H - config.regMarkInset },
  ];

  for (const pos of corners) {
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = config.accent;
    ctx.fillStyle = config.accent;
    ctx.lineWidth = config.regMarkStrokeWidth;

    // Cross
    ctx.beginPath();
    ctx.moveTo(-halfArm, 0);
    ctx.lineTo(halfArm, 0);
    ctx.moveTo(0, -halfArm);
    ctx.lineTo(0, halfArm);
    ctx.stroke();

    // Circle outline
    ctx.beginPath();
    ctx.arc(0, 0, config.regMarkCircleRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Filled center dot
    ctx.beginPath();
    ctx.arc(0, 0, config.regMarkDotRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Side tick marks (longer, bolder)
  const sideTicks = [
    { x: 25, y: H / 2 },
    { x: W - 25, y: H / 2 },
  ];
  for (const pos of sideTicks) {
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = config.accent;
    ctx.lineWidth = config.regMarkStrokeWidth;
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(12, 0);
    ctx.moveTo(0, -12);
    ctx.lineTo(0, 12);
    ctx.stroke();
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Main draw function
// ---------------------------------------------------------------------------
const draw = (ctx: CanvasRenderingContext2D, frame: number): void => {
  // === 1. Background + scanlines ===
  ctx.fillStyle = config.bg;
  ctx.fillRect(0, 0, W, H);
  drawScanlines(ctx);

  // === 2. Compute main text position ===
  const driftT = progress(frame, 0, config.driftDuration, quintOut);
  const mainX = lerp(config.mainStartX, config.mainEndX, driftT);
  const mainY =
    H * config.mainY +
    Math.sin(frame * config.yMicroDriftFrequency) * config.yMicroDriftAmplitude;

  // === 3. Fade-in alpha ===
  const fadeIn = progress(frame, 0, config.fadeInDuration, quintOut);

  // === 4. Main text exit ===
  let mainExitT = 0;
  let mainScale = 1.0;
  let mainAlpha = fadeIn;
  if (frame >= config.exitStart) {
    mainExitT = progress(
      frame, config.exitStart, config.mainExitDuration, expoOut,
    );
    mainScale = lerp(1.0, config.mainExitScale, mainExitT);
    mainAlpha = fadeIn * (1 - mainExitT);
  }

  // === 5. Layer 1 — Main text with ghost misregistration ===
  if (mainAlpha > 0.01) {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(mainScale, mainScale);
    ctx.translate(-W / 2, -H / 2);

    ctx.font = `400 ${config.mainFontSize}px "${fontFamily}", sans-serif`;
    ctx.textBaseline = 'alphabetic';

    // Ghost copies (visible misregistration)
    ctx.globalAlpha = config.ghostAlpha * mainAlpha;
    ctx.fillStyle = config.accent;
    ctx.fillText(config.mainText, mainX, mainY - config.ghostOffsetY);
    ctx.fillText(
      config.mainText,
      mainX + config.ghostOffsetX,
      mainY + config.ghostOffsetY,
    );

    // Main text
    ctx.globalAlpha = mainAlpha;
    ctx.fillStyle = config.primary;
    ctx.fillText(config.mainText, mainX, mainY);

    // Stroke outline in accent
    ctx.globalAlpha = mainAlpha * config.mainStrokeAlpha;
    ctx.strokeStyle = config.accent;
    ctx.lineWidth = config.mainStrokeWidth;
    ctx.strokeText(config.mainText, mainX, mainY);

    ctx.restore();
  }

  // === 6. Layer 3 — Dual accent lines ===
  const lineAlpha = mainAlpha;
  if (lineAlpha > 0.01) {
    const lineProg = progress(
      frame, config.lineDrawStart, config.lineDrawDuration, expoOut,
    );
    const lineEndX = W * lineProg;

    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(mainScale, mainScale);
    ctx.translate(-W / 2, -H / 2);
    ctx.globalAlpha = lineAlpha;
    ctx.strokeStyle = config.accent;
    ctx.lineWidth = config.lineWidth;

    // Line 1
    ctx.beginPath();
    ctx.moveTo(0, config.line1Y);
    ctx.lineTo(lineEndX, config.line1Y);
    ctx.stroke();

    // Line 2 (draws from right side, slightly delayed)
    const line2Prog = progress(
      frame, config.lineDrawStart + 3, config.lineDrawDuration, expoOut,
    );
    ctx.beginPath();
    ctx.moveTo(W, config.line2Y);
    ctx.lineTo(W - W * line2Prog, config.line2Y);
    ctx.stroke();

    ctx.restore();
  }

  // === 7. Layer 4 — Registration marks ===
  const regFadeIn = progress(
    frame, config.regMarkFadeInStart, config.regMarkFadeInDuration, cubicOut,
  );
  let regScale = 1.0;
  let regAlpha = regFadeIn * config.regMarkAlpha;
  if (frame >= config.exitStart + config.regMarkExitDelay) {
    const regExitT = progress(
      frame,
      config.exitStart + config.regMarkExitDelay,
      config.regMarkExitDuration,
      quadOut,
    );
    regScale = lerp(1.0, config.regMarkExitScale, regExitT);
    regAlpha = regFadeIn * config.regMarkAlpha * (1 - regExitT);
  }
  if (regAlpha > 0.01) {
    drawRegistrationMarks(ctx, regAlpha, regScale);
  }

  // === 8. Layer 2 — Subtext + page number ===
  const subFadeIn = progress(
    frame, config.subFadeInStart, config.subFadeInDuration, cubicOut,
  );
  let subAlpha = subFadeIn;
  if (frame >= config.exitStart + config.subExitDelay) {
    const subExitT = progress(
      frame,
      config.exitStart + config.subExitDelay,
      config.subExitDuration,
      expoOut,
    );
    subAlpha = subFadeIn * (1 - subExitT);
  }
  if (subAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = subAlpha;

    // Subtext — bottom right
    ctx.font = `400 ${config.subFontSize}px "${fontFamily}", sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.letterSpacing = `${config.subLetterSpacing}em`;
    ctx.fillStyle = config.accent;
    ctx.fillText(config.subText, config.subX, config.subY);

    // Page number — bottom left
    ctx.font = `400 ${config.pageNumFontSize}px "${fontFamily}", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.letterSpacing = '0.3em';
    ctx.fillStyle = config.primary;
    ctx.globalAlpha = subAlpha * 0.5;
    ctx.fillText(config.pageNum, config.pageNumX, config.pageNumY);

    ctx.letterSpacing = '0em';
    ctx.restore();
  }

  // === 9. Film grain (final pass) ===
  ctx.globalAlpha = 1;
  drawFilmGrain(ctx, frame, config.grain);
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const CroppedTypography: React.FC = () => {
  const stableDraw = useCallback(draw, []);
  return <CanvasScene draw={stableDraw} />;
};
