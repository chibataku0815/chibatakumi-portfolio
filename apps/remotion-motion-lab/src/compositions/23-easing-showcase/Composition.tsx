/**
 * Easing Showcase — Composition #23
 *
 * Style: techHud — JetBrains Mono, cyan/magenta palette,
 * digital grain, scanlines, monitor vignette.
 *
 * Visual comparison of three easing curves (quintOut, expOut, backOut).
 * Each curve drives a dot along a horizontal track with ghost trails,
 * plus a small mathematical curve plot below.
 *
 * Uses the shared CanvasScene wrapper from canvas-primitives.
 */
import React, { useCallback } from "react";
import {
  quintOut,
  expOut,
  backOut,
  lerp,
  progress,
  drawDust,
  drawVignette,
  CanvasScene,
  W,
  H,
  sr,
} from "../../lib/canvas-primitives";
import { loadFont } from "@remotion/google-fonts/JetBrainsMono";
import { config } from "./config";

// ---------------------------------------------------------------------------
// Font setup
// ---------------------------------------------------------------------------
const { fontFamily } = loadFont();

// ---------------------------------------------------------------------------
// Grain — overlay compositing (bg #0a0a12 has enough luminance)
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
// Scanlines — persistent CRT monitor effect
// ---------------------------------------------------------------------------
function drawScanlines(ctx: CanvasRenderingContext2D, frame: number): void {
  const { scanlineGap, scanlineAlpha } = config.texture;
  if (scanlineAlpha < 0.001) return;

  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${scanlineAlpha})`;
  const yOffset = (frame * 1) % scanlineGap;
  for (let y = yOffset; y < H; y += scanlineGap) {
    ctx.fillRect(0, y, W, 1);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Easing resolver — maps config name to function
// ---------------------------------------------------------------------------
const EASING_MAP: Record<string, (t: number) => number> = {
  quintOut,
  expOut,
  backOut,
};

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------
const TRACK_WIDTH = 800;
const TRACK_X = (W - TRACK_WIDTH) / 2;
const TRACK_SPACING = 200;
const DOT_RADIUS = 12;
const GHOST_COUNT = 7;

const TRACKS_BLOCK_TOP =
  H / 2 - ((config.curves.length - 1) * TRACK_SPACING) / 2 + 30;

const PLOT_W = 200;
const PLOT_H = 80;
const PLOT_TOP =
  TRACKS_BLOCK_TOP + (config.curves.length - 1) * TRACK_SPACING + 80;

// ---------------------------------------------------------------------------
// Hex color to rgba helper
// ---------------------------------------------------------------------------
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ---------------------------------------------------------------------------
// Draw function — called every frame by CanvasScene
// ---------------------------------------------------------------------------
function draw(ctx: CanvasRenderingContext2D, frame: number, _fps: number) {
  const { animStart, animDuration, curves } = config;

  // ----- Background -----
  ctx.fillStyle = config.palette.bg;
  ctx.fillRect(0, 0, W, H);

  // ----- Title: "MOVE" -----
  const titleAlpha = progress(frame, 0, 15, quintOut);
  ctx.save();
  ctx.font = `${config.typography.heroWeight} ${config.typography.heroSize}px ${fontFamily}, monospace`;
  ctx.letterSpacing = `${config.typography.letterSpacing}em`;
  ctx.fillStyle = hexToRgba(config.palette.primary, titleAlpha);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(config.text, W / 2, TRACKS_BLOCK_TOP - 140);
  ctx.restore();

  // ----- Linear playhead -----
  const linearT = Math.max(
    0,
    Math.min(1, (frame - animStart) / animDuration),
  );
  if (frame >= animStart) {
    const playX = TRACK_X + linearT * TRACK_WIDTH;
    ctx.save();
    ctx.strokeStyle = hexToRgba(config.palette.secondary, 0.25);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(playX, TRACKS_BLOCK_TOP - 40);
    ctx.lineTo(
      playX,
      TRACKS_BLOCK_TOP + (curves.length - 1) * TRACK_SPACING + 40,
    );
    ctx.stroke();
    ctx.restore();
  }

  // ----- Per-curve tracks -----
  for (let i = 0; i < curves.length; i++) {
    const curve = curves[i];
    const easingFn = EASING_MAP[curve.name] ?? quintOut;
    const trackY = TRACKS_BLOCK_TOP + i * TRACK_SPACING;

    // Label
    ctx.save();
    ctx.font = `${config.typography.labelWeight} ${config.typography.labelSize}px ${fontFamily}, monospace`;
    ctx.letterSpacing = `${config.typography.letterSpacing}em`;
    ctx.fillStyle = hexToRgba(curve.color, 1.0);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(curve.label, TRACK_X - 30, trackY);
    ctx.restore();

    // Track line
    ctx.save();
    ctx.strokeStyle = hexToRgba(config.palette.secondary, 0.15);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(TRACK_X, trackY);
    ctx.lineTo(TRACK_X + TRACK_WIDTH, trackY);
    ctx.stroke();
    ctx.restore();

    // Raw progress (0..1 linear within anim window)
    const rawT = Math.max(
      0,
      Math.min(1, (frame - animStart) / animDuration),
    );
    const easedT = rawT > 0 ? easingFn(rawT) : 0;
    const dotX = TRACK_X + easedT * TRACK_WIDTH;

    // Ghost trail — previous positions at decreasing alpha
    for (let g = GHOST_COUNT; g >= 1; g--) {
      const ghostFrame = frame - g * 2;
      const ghostRawT = Math.max(
        0,
        Math.min(1, (ghostFrame - animStart) / animDuration),
      );
      if (ghostRawT <= 0) continue;
      const ghostEased = easingFn(ghostRawT);
      const ghostX = TRACK_X + ghostEased * TRACK_WIDTH;
      const ghostAlpha = (1 - g / (GHOST_COUNT + 1)) * 0.35;

      ctx.save();
      ctx.fillStyle = hexToRgba(curve.color, ghostAlpha);
      ctx.beginPath();
      ctx.arc(ghostX, trackY, DOT_RADIUS * (1 - g * 0.08), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Main dot
    if (frame >= animStart || rawT > 0) {
      ctx.save();
      ctx.fillStyle = curve.color;
      ctx.shadowColor = curve.color;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(dotX, trackY, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Static dot at start position
      ctx.save();
      ctx.fillStyle = hexToRgba(curve.color, 0.5);
      ctx.beginPath();
      ctx.arc(TRACK_X, trackY, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ----- Mathematical curve plots -----
  const plotSpacing =
    (TRACK_WIDTH - curves.length * PLOT_W) / (curves.length - 1);

  for (let i = 0; i < curves.length; i++) {
    const curve = curves[i];
    const easingFn = EASING_MAP[curve.name] ?? quintOut;
    const plotX = TRACK_X + i * (PLOT_W + plotSpacing);
    const plotY = PLOT_TOP;

    // Plot border
    ctx.save();
    ctx.strokeStyle = hexToRgba(config.palette.secondary, 0.12);
    ctx.lineWidth = 0.5;
    ctx.strokeRect(plotX, plotY, PLOT_W, PLOT_H);
    ctx.restore();

    // Curve name under the plot
    ctx.save();
    ctx.font = `${config.typography.labelWeight} 14px ${fontFamily}, monospace`;
    ctx.letterSpacing = `${config.typography.letterSpacing}em`;
    ctx.fillStyle = hexToRgba(curve.color, 0.5);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(curve.name, plotX + PLOT_W / 2, plotY + PLOT_H + 8);
    ctx.restore();

    // Draw the easing curve
    ctx.save();
    ctx.strokeStyle = hexToRgba(curve.color, 0.8);
    ctx.lineWidth = 2;
    ctx.beginPath();

    const steps = 80;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const val = easingFn(t);
      const px = plotX + t * PLOT_W;
      const py = plotY + PLOT_H - val * PLOT_H;
      if (s === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    ctx.restore();

    // Animated cursor dot on the curve (follows playhead)
    if (frame >= animStart) {
      const cursorT = Math.max(
        0,
        Math.min(1, (frame - animStart) / animDuration),
      );
      const cursorVal = easingFn(cursorT);
      const cx = plotX + cursorT * PLOT_W;
      const cy = plotY + PLOT_H - cursorVal * PLOT_H;

      ctx.save();
      ctx.fillStyle = curve.color;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ----- Screen-space finishing (after all content) -----
  drawScanlines(ctx, frame);
  drawGrain(ctx, frame, config.texture.grain);
  drawVignette(ctx, config.texture.vignette);
  drawDust(ctx, frame, 2, `${config.palette.secondary}10`);
}

// ---------------------------------------------------------------------------
// Exported component
// ---------------------------------------------------------------------------
export const EasingShowcase: React.FC = () => {
  const stableDraw = useCallback(draw, []);
  return <CanvasScene draw={stableDraw} />;
};
