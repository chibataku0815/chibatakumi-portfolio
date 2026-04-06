/**
 * Shape Transition — Composition #31
 *
 * Motion technique: Rounded-rectangle iris expanding from center reveals Scene B.
 * Corporate style — white bg, Stripe purple accent, Nunito Sans 600, zero grain/vignette.
 *
 * Phases:
 *   0-14   Scene A static (Stripe purple bg)
 *   15-33  Transition — rounded-rect iris expands from center
 *   34-59  Scene B static (dark navy bg)
 */
import React, { useCallback } from "react";
import {
  CanvasScene,
  W,
  H,
  drawGrid,
} from "../../lib/canvas-primitives";
import { expoOut } from "../../lib/canvas-easing";
import { loadFont as loadNunitoSans } from "@remotion/google-fonts/NunitoSans";
import { loadFont as loadOpenSans } from "@remotion/google-fonts/OpenSans";
import { config } from "./config";

const { fontFamily: nunitoSans } = loadNunitoSans();
const { fontFamily: openSans } = loadOpenSans();

// Maximum diagonal — the iris rect must grow large enough to cover all corners
const MAX_DIAG = Math.sqrt(W * W + H * H);

// ---------------------------------------------------------------------------
// Draw 12-column corporate grid (thin #e5e7eb lines)
// ---------------------------------------------------------------------------
function drawCorpGrid(ctx: CanvasRenderingContext2D) {
  const cols = 12;
  const colW = W / cols;

  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let i = 0; i <= cols; i++) {
    const x = i * colW;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Draw a scene: colored bg + grid + heading + subtitle
// ---------------------------------------------------------------------------
function drawScene(
  ctx: CanvasRenderingContext2D,
  bgColor: string,
  label: string,
  subtitle: string,
  textColor: string,
  isWhiteBg: boolean,
) {
  // Background fill
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);

  // Grid — use drawGrid(light=true) for white bg, custom corp grid otherwise
  if (isWhiteBg) {
    drawCorpGrid(ctx);
  } else {
    // On colored scene bg, draw a subtle light grid
    drawGrid(ctx, false, W / 12);
  }

  // Heading — Nunito Sans 600 72px (corporate: restrained = trust)
  ctx.font = `600 72px ${nunitoSans}, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = textColor;
  ctx.fillText(label, W / 2, H / 2 - 24);

  // Subtitle — Open Sans 400 28px, secondary gray (or light on dark)
  ctx.font = `400 28px ${openSans}, sans-serif`;
  ctx.fillStyle = isWhiteBg ? config.palette.secondary : "rgba(255,255,255,0.6)";
  ctx.fillText(subtitle, W / 2, H / 2 + 36);
}

// ---------------------------------------------------------------------------
// Main draw
// ---------------------------------------------------------------------------
const draw = (ctx: CanvasRenderingContext2D, frame: number): void => {
  const {
    transitionStart,
    transitionDuration,
    sceneA,
    sceneB,
    irisCornerRadius,
  } = config;
  const transitionEnd = transitionStart + transitionDuration;

  // White canvas base (corporate white bg is the differentiator)
  ctx.fillStyle = config.palette.bg;
  ctx.fillRect(0, 0, W, H);

  if (frame < transitionStart) {
    // --- Scene A static ---
    drawScene(ctx, sceneA.color, sceneA.label, sceneA.subtitle, sceneA.textColor, false);
  } else if (frame < transitionEnd) {
    // --- Transition: rounded-rectangle iris wipe ---
    const rawT = (frame - transitionStart) / transitionDuration;
    const t = expoOut(Math.max(0, Math.min(1, rawT)));

    const rectW = t * MAX_DIAG;
    const rectH = t * MAX_DIAG;
    const rx = W / 2 - rectW / 2;
    const ry = H / 2 - rectH / 2;

    // 1. Draw Scene A (full canvas)
    drawScene(ctx, sceneA.color, sceneA.label, sceneA.subtitle, sceneA.textColor, false);

    // 2. Clip to rounded rect and draw Scene B inside
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(rx, ry, rectW, rectH, irisCornerRadius);
    ctx.clip();
    drawScene(ctx, sceneB.color, sceneB.label, sceneB.subtitle, sceneB.textColor, false);
    ctx.restore();

    // 3. Accent stroke ring on the iris edge (drawn AFTER clip restore)
    ctx.save();
    ctx.strokeStyle = config.palette.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(rx, ry, rectW, rectH, irisCornerRadius);
    ctx.stroke();
    ctx.restore();
  } else {
    // --- Scene B static ---
    drawScene(ctx, sceneB.color, sceneB.label, sceneB.subtitle, sceneB.textColor, false);
  }

  // Corporate: NO dust, NO grain, NO vignette — clean and precise
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const ShapeTransition: React.FC = () => {
  const stableDraw = useCallback(draw, []);
  return <CanvasScene draw={stableDraw} />;
};
