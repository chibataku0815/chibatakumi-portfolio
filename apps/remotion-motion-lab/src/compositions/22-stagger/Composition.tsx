/**
 * Stagger — Composition #22
 *
 * Style: minimalDark — Weight 200/700 contrast, tech blue separators,
 * subtle grain, gentle vignette.
 *
 * Motion technique: Non-uniform stagger with directional entry.
 * Six text elements ("quiet / precise / luminous .") enter from
 * different directions (left, right, bottom) with backOut easing
 * at hand-tuned delays for an "Award-Worthy Stagger" feel.
 *
 * Phases:
 *   0-48   Stagger in (each element: delay + 18f backOut)
 *   48-119 Hold — all elements visible
 */
import React, { useCallback } from "react";
import {
  CanvasScene,
  W,
  H,
  backOut,
  progress,
  drawDust,
  drawVignette,
  sr,
} from "../../lib/canvas-primitives";
import { config } from "./config";

// ---------------------------------------------------------------------------
// Direction offset vectors
// ---------------------------------------------------------------------------
const OFFSETS: Record<string, { dx: number; dy: number }> = {
  left: { dx: -200, dy: 0 },
  right: { dx: 200, dy: 0 },
  bottom: { dx: 0, dy: 150 },
};

// ---------------------------------------------------------------------------
// Grain — overlay compositing (bg #0a0a0a has enough luminance)
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
    const v = 128 + noise;
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v;
    d[i + 3] = 20;
  }
  gctx.putImageData(imageData, 0, 0);

  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.drawImage(gc, 0, 0, W, H);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Measure element widths and compute layout (called once per draw)
// ---------------------------------------------------------------------------
interface ElementLayout {
  text: string;
  x: number;
  isSeparator: boolean;
  direction: string;
  delay: number;
  weight: string;
}

function computeLayout(ctx: CanvasRenderingContext2D): ElementLayout[] {
  const layouts: ElementLayout[] = [];
  let totalWidth = 0;

  // First pass — measure all widths (with letterSpacing set)
  const widths: number[] = [];
  ctx.letterSpacing = `${config.typography.letterSpacing}em`;
  for (const el of config.elements) {
    const isSep = el.text === "/" || el.text === ".";
    const fontSize = isSep
      ? config.typography.separatorSize
      : config.typography.fontSize;
    ctx.font = `${el.weight} ${fontSize}px ${config.typography.font}`;
    const w = ctx.measureText(el.text).width;
    widths.push(w);
    totalWidth += w;
  }
  ctx.letterSpacing = "0em";

  // Add gaps
  totalWidth += (config.elements.length - 1) * config.gap;

  // Second pass — compute x positions (centered)
  let cursor = (W - totalWidth) / 2;
  for (let i = 0; i < config.elements.length; i++) {
    const el = config.elements[i];
    const isSep = el.text === "/" || el.text === ".";
    layouts.push({
      text: el.text,
      x: cursor,
      isSeparator: isSep,
      direction: el.direction,
      delay: el.delay,
      weight: el.weight,
    });
    cursor += widths[i] + config.gap;
  }

  return layouts;
}

// ---------------------------------------------------------------------------
// Main draw function
// ---------------------------------------------------------------------------
const draw = (ctx: CanvasRenderingContext2D, frame: number): void => {
  // --- Background ---
  ctx.fillStyle = config.palette.bg;
  ctx.fillRect(0, 0, W, H);

  // --- Compute element layout ---
  const layouts = computeLayout(ctx);

  // --- Draw each element with stagger ---
  const centerY = H / 2;

  for (const el of layouts) {
    const t = progress(frame, el.delay, config.animDuration, backOut);
    const offset = OFFSETS[el.direction] ?? { dx: 0, dy: 0 };

    const dx = offset.dx * (1 - t);
    const dy = offset.dy * (1 - t);
    const alpha = t;

    if (alpha < 0.001) continue;

    const fontSize = el.isSeparator
      ? config.typography.separatorSize
      : config.typography.fontSize;
    const color = el.isSeparator
      ? config.palette.accent
      : config.palette.primary;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `${el.weight} ${fontSize}px ${config.typography.font}`;
    ctx.letterSpacing = `${config.typography.letterSpacing}em`;
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(el.text, el.x + dx, centerY + dy);
    ctx.restore();
  }

  // --- Structural rule — draws in from left after all elements settle ---
  // Starts at frame 52 (after last stagger lands at 30+18=48), draws over 28f
  const RULE_START = 52;
  const RULE_DURATION = 28;
  const RULE_W = 880; // 46% of 1920
  const ruleT = Math.min(1, Math.max(0, (frame - RULE_START) / RULE_DURATION));
  if (ruleT > 0.001) {
    const ruleY = centerY - 76; // above the text block
    ctx.save();
    ctx.fillStyle = `${config.palette.primary}22`;
    ctx.fillRect((W - RULE_W) / 2, ruleY, ruleT * RULE_W, 1);
    ctx.restore();
  }

  // --- Screen-space finishing (after content) ---
  drawGrain(ctx, frame, config.texture.grain);
  drawVignette(ctx, config.texture.vignette);
  drawDust(ctx, frame, 4, `${config.palette.primary}12`);
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const Stagger: React.FC = () => {
  const stableDraw = useCallback(draw, []);
  return <CanvasScene draw={stableDraw} />;
};
