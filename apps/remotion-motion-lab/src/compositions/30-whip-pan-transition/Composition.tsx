/**
 * Whip Pan Transition — Composition #30
 *
 * Style: S2 Brutalist Tech — Bebas Neue 200px / 900, pure black,
 * neon lime (#ccff00) accent streaks, halftone-glitch grain,
 * VIOLENT motion smear, zero vignette.
 *
 * Motion technique: High-speed horizontal pan with directional motion blur.
 * Scene A slides out to the left while Scene B enters from the right.
 * Ghost copies at intermediate offsets create aggressive smear effect.
 *
 * Phases:
 *   0-14   Scene A static (DESTROY)
 *   15-27  Transition — whip pan with motion blur ghosts + neon streaks
 *   28-59  Scene B static (CREATE)
 */
import React, { useCallback } from "react";
import {
  CanvasScene,
  W,
  H,
  sr,
  drawDust,
} from "../../lib/canvas-primitives";
import { expoOut, backOut } from "../../lib/canvas-easing";
import { loadFont } from "@remotion/google-fonts/BebasNeue";
import { config } from "./config";

// ---------------------------------------------------------------------------
// Font setup
// ---------------------------------------------------------------------------
const { fontFamily } = loadFont();

// ---------------------------------------------------------------------------
// Grain — overlay compositing on pure black bg
// ---------------------------------------------------------------------------
const GRAIN_W = 480;
const GRAIN_H = 270;

function drawGrain(ctx: CanvasRenderingContext2D, frame: number): void {
  const grainCanvas = new OffscreenCanvas(GRAIN_W, GRAIN_H);
  const gCtx = grainCanvas.getContext("2d")!;
  const gData = gCtx.createImageData(GRAIN_W, GRAIN_H);
  for (let i = 0; i < GRAIN_W * GRAIN_H; i++) {
    const v = sr(frame * 130000 + i) * 255;
    const idx = i * 4;
    gData.data[idx] = v;
    gData.data[idx + 1] = v;
    gData.data[idx + 2] = v;
    gData.data[idx + 3] = config.texture.grain; // 40
  }
  gCtx.putImageData(gData, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.drawImage(grainCanvas, 0, 0, W, H);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Aggressive grid — frame-bleeding, thick lines, high alpha
// ---------------------------------------------------------------------------
function drawBrutalistGrid(ctx: CanvasRenderingContext2D, cell = 64): void {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= W; x += cell) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  for (let y = 0; y <= H; y += cell) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Registration marks — brutalist corner marks in neon lime
// ---------------------------------------------------------------------------
function drawRegistrationMarks(ctx: CanvasRenderingContext2D): void {
  const markLen = 40;
  const markThick = 2;
  const inset = 24;
  const alpha = config.registrationMarkAlpha; // 0.65

  ctx.save();
  ctx.strokeStyle = config.palette.accent;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = markThick;

  // Corners: TL, TR, BL, BR
  const corners = [
    [inset, inset],
    [W - inset, inset],
    [inset, H - inset],
    [W - inset, H - inset],
  ];
  const dirs = [
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ];

  for (let c = 0; c < 4; c++) {
    const [cx, cy] = corners[c];
    const [dx, dy] = dirs[c];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + markLen * dx, cy);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy + markLen * dy);
    ctx.stroke();

    // Small crosshair at corner
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Neon lime underline beneath text
// ---------------------------------------------------------------------------
function drawAccentUnderline(
  ctx: CanvasRenderingContext2D,
  textX: number,
  textY: number,
  textWidth: number,
): void {
  ctx.save();
  ctx.fillStyle = config.palette.accent;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(
    textX - textWidth / 2,
    textY + config.font.sizeHero * 0.35,
    textWidth,
    config.underlineHeight,
  );
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Neon lime streaks during transition
// ---------------------------------------------------------------------------
function drawStreaks(
  ctx: CanvasRenderingContext2D,
  frame: number,
  rawT: number,
): void {
  const { streakCount, streakHeight } = config;

  ctx.save();
  for (let i = 0; i < streakCount; i++) {
    const yBase = sr(i * 31 + 7) * H;
    // Streaks travel with pan direction, slightly offset per streak
    const streakT = expoOut(Math.max(0, Math.min(1, rawT - i * 0.03)));
    const xOffset = -W * streakT * 0.4;
    const alpha = 0.35 * (1 - rawT * 0.7); // fade as transition completes

    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = config.palette.accent;
    // Full-width streak
    ctx.fillRect(xOffset, yBase, W * 1.4, streakHeight + sr(i * 13) * 2);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Draw a scene: near-black bg + brutalist grid + giant centered label
// ---------------------------------------------------------------------------
function drawScene(
  ctx: CanvasRenderingContext2D,
  color: string,
  label: string,
  textColor: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
  drawBrutalistGrid(ctx, 64);

  // Giant brutalist text
  ctx.save();
  ctx.font = `${config.font.weight} ${config.font.sizeHero}px ${fontFamily}, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = `${config.font.letterSpacing}em`;
  ctx.fillStyle = textColor;
  ctx.fillText(label, W / 2, H / 2);

  // Measure text for underline
  const metrics = ctx.measureText(label);
  ctx.restore();

  // Neon accent underline
  drawAccentUnderline(ctx, W / 2, H / 2, metrics.width);

  // Registration marks
  drawRegistrationMarks(ctx);
}

// ---------------------------------------------------------------------------
// Draw a scene offset horizontally (for pan + ghost copies)
// ---------------------------------------------------------------------------
function drawSceneOffset(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  color: string,
  label: string,
  textColor: string,
  alpha: number,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(offsetX, 0);
  drawScene(ctx, color, label, textColor);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Main draw
// ---------------------------------------------------------------------------
const draw = (ctx: CanvasRenderingContext2D, frame: number): void => {
  // Pure black background
  ctx.fillStyle = config.palette.bg;
  ctx.fillRect(0, 0, W, H);

  const { transitionStart, transitionDuration, sceneA, sceneB } = config;
  const transitionEnd = transitionStart + transitionDuration;

  if (frame < transitionStart) {
    // --- Scene A static: DESTROY ---
    drawScene(ctx, sceneA.color, sceneA.label, config.palette.primary);
  } else if (frame < transitionEnd) {
    // --- Transition with VIOLENT motion blur ---
    const rawT = (frame - transitionStart) / transitionDuration;
    const t = expoOut(Math.max(0, Math.min(1, rawT)));

    const offsetA = -W * t;
    const offsetB = W * (1 - t);

    // Ghost copies — aggressive smear with high first alphas (≥0.12)
    for (let i = 0; i < config.ghostCopies; i++) {
      const ghostFrac = (i + 1) / (config.ghostCopies + 1);
      // Mix expoOut (85%) and backOut (15%) for brutal whiplash
      const clampedGhostRaw = Math.max(0, Math.min(1, rawT - ghostFrac * 0.08));
      const ghostT =
        expoOut(clampedGhostRaw) * 0.85 + backOut(clampedGhostRaw) * 0.15;
      const ghostOffsetA = -W * ghostT;
      const ghostOffsetB = W * (1 - ghostT);
      const alpha = config.ghostAlphas[i];

      drawSceneOffset(
        ctx,
        ghostOffsetA,
        sceneA.color,
        sceneA.label,
        config.palette.primary,
        alpha,
      );
      drawSceneOffset(
        ctx,
        ghostOffsetB,
        sceneB.color,
        sceneB.label,
        config.palette.primary,
        alpha,
      );
    }

    // Main scenes (sharp, full alpha)
    drawSceneOffset(
      ctx,
      offsetA,
      sceneA.color,
      sceneA.label,
      config.palette.primary,
      1.0,
    );
    drawSceneOffset(
      ctx,
      offsetB,
      sceneB.color,
      sceneB.label,
      config.palette.primary,
      1.0,
    );

    // Neon lime streaks — ONLY during transition
    drawStreaks(ctx, frame, rawT);
  } else {
    // --- Scene B static: CREATE ---
    drawScene(ctx, sceneB.color, sceneB.label, config.palette.primary);
  }

  // --- Ambient overlay ---
  // Aggressive dust: more particles (7), accent color at low alpha
  drawDust(ctx, frame, config.dustCount, "rgba(204,255,0,0.06)");

  // Grain: alpha 40 overlay on black bg
  drawGrain(ctx, frame);

  // NO vignette — brutalist: uniform harshness (vignette = 0)
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const WhipPanTransition: React.FC = () => {
  const stableDraw = useCallback(draw, []);
  return <CanvasScene draw={stableDraw} />;
};
