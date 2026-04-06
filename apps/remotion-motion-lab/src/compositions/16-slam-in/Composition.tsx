/**
 * Slam In — Composition #16
 *
 * Style: brutalist — Bebas Neue 320px, pure black bg, screen grain.
 *
 * Motion technique: Scale slam with directional motion blur smear
 * and lingering ghost-trail exit.
 *
 * Phases:
 *   0-17  Slam: text scales from 400% -> 100% with expOut + blur samples
 *   18-64 Hold: sharp text at 100%
 *   65-89 Exit: fade out with ghost afterimage copies
 */
import React, { useCallback } from "react";
import {
  CanvasScene,
  W,
  H,
  expOut,
  cubicOut,
  progress,
  drawDust,
  drawVignette,
  lerp,
  sr,
} from "../../lib/canvas-primitives";
import { loadFont } from "@remotion/google-fonts/BebasNeue";
import { config } from "./config";

// ---------------------------------------------------------------------------
// Font setup
// ---------------------------------------------------------------------------
const { fontFamily } = loadFont();

// ---------------------------------------------------------------------------
// Grain — screen compositing (overlay is invisible on pure black bg)
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
    const v = 128 + noise; // full range grain
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v;
    d[i + 3] = 35; // higher alpha for visibility on pure black via screen
  }
  gctx.putImageData(imageData, 0, 0);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.drawImage(gc, 0, 0, W, H);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Scale at a given frame (clamped to slam phase)
// ---------------------------------------------------------------------------
function scaleAt(frame: number): number {
  if (frame < 0) return config.startScale;
  if (frame >= config.slamDuration) return config.endScale;
  const t = expOut(frame / config.slamDuration);
  return lerp(config.startScale, config.endScale, t);
}

// ---------------------------------------------------------------------------
// Draw the text at a given scale and alpha
// ---------------------------------------------------------------------------
function drawText(
  ctx: CanvasRenderingContext2D,
  scale: number,
  alpha: number,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(W / 2, H / 2);
  ctx.scale(scale, scale);
  ctx.font = `${config.fontWeight} ${config.fontSize}px ${fontFamily}`;
  ctx.letterSpacing = `${config.letterSpacing}em`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = config.palette.primary;
  ctx.fillText(config.text, 0, 0);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Main draw function
// ---------------------------------------------------------------------------
const draw = (ctx: CanvasRenderingContext2D, frame: number): void => {
  // --- Background ---
  ctx.fillStyle = config.palette.bg;
  ctx.fillRect(0, 0, W, H);

  // --- Phase routing (no early returns — finishing layers always draw) ---
  if (frame < config.holdStart) {
    // Slam phase
    const currentScale = scaleAt(frame);
    const prevScale = scaleAt(frame - 1);
    const scaleDelta = Math.abs(currentScale - prevScale);

    // Motion blur samples — only when scale is changing fast enough
    if (scaleDelta > 0.02) {
      const blurAlphas = [0.15, 0.1, 0.07, 0.04];
      for (let i = 0; i < config.blurSamples; i++) {
        const frac = (i + 1) / (config.blurSamples + 1);
        const sampleScale = lerp(prevScale, currentScale, frac);
        drawText(ctx, sampleScale, blurAlphas[i]);
      }
    }

    // Main text (sharp, full alpha)
    drawText(ctx, currentScale, 1.0);
  } else if (frame < config.exitStart) {
    // Hold phase
    drawText(ctx, config.endScale, 1.0);

    // Impact flash — accent line at slam landing (frame holdStart), fades over 10f
    const flashT = Math.min(1, (frame - config.holdStart) / 10);
    const flashAlpha = (1 - flashT) * 0.85;
    if (flashAlpha > 0.001) {
      ctx.save();
      ctx.globalAlpha = flashAlpha;
      ctx.fillStyle = config.palette.accent;
      ctx.fillRect(0, H / 2 - 2, W, 4);
      ctx.restore();
    }
  } else {
    // Exit phase — ghost trail with boosted alphas (S2 lesson: >=10% effective)
    const exitT = progress(
      frame,
      config.exitStart,
      config.exitDuration,
      cubicOut,
    );
    const mainAlpha = 1 - exitT;

    const ghosts = [
      { scale: 1.02, alpha: 0.16 },
      { scale: 1.05, alpha: 0.08 },
      { scale: 1.09, alpha: 0.04 },
    ];
    for (const ghost of ghosts) {
      const ghostAlpha = ghost.alpha * (1 - exitT);
      if (ghostAlpha > 0.001) {
        drawText(ctx, ghost.scale, ghostAlpha);
      }
    }

    if (mainAlpha > 0.001) {
      drawText(ctx, config.endScale, mainAlpha);
    }
  }

  // --- Screen-space finishing (ALWAYS drawn after content) ---
  drawGrain(ctx, frame, config.texture.grain);
  if (config.texture.vignette > 0) {
    drawVignette(ctx, config.texture.vignette);
  }
  drawDust(ctx, frame, 4, `${config.palette.accent}20`);
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const SlamIn: React.FC = () => {
  const stableDraw = useCallback(draw, []);
  return <CanvasScene draw={stableDraw} />;
};
