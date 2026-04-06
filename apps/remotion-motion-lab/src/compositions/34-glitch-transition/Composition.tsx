/**
 * Glitch Transition — Composition #34
 *
 * Style: techHud — Cyan/magenta HUD aesthetic with JetBrains Mono,
 * corner brackets, data readouts, and persistent scanlines.
 *
 * Motion technique: Digital glitch with true RGB channel separation,
 * slice-based horizontal displacement, scanlines, noise blocks,
 * and temporal posterize.
 *
 * Phases:
 *   0-14   Scene A static (SYS_INIT)
 *   15-30  Glitch transition (16 frames)
 *   31-59  Scene B static (BREACH)
 */
import React, { useCallback } from "react";
import {
  CanvasScene,
  W,
  H,
  sr,
  drawDust,
  drawVignette,
} from "../../lib/canvas-primitives";
import { expoOut } from "../../lib/canvas-easing";
import { loadFont } from "@remotion/google-fonts/JetBrainsMono";
import { config } from "./config";

// ---------------------------------------------------------------------------
// Font setup
// ---------------------------------------------------------------------------
const { fontFamily } = loadFont();

// ---------------------------------------------------------------------------
// Module-level offscreen canvas caches
// ---------------------------------------------------------------------------
const getOffscreen = (() => {
  let oc: HTMLCanvasElement | null = null;
  return () => {
    if (!oc) {
      oc = document.createElement("canvas");
      oc.width = W;
      oc.height = H;
    }
    return oc;
  };
})();

const getRgbOffscreen = (() => {
  let oc: HTMLCanvasElement | null = null;
  return () => {
    if (!oc) {
      oc = document.createElement("canvas");
      oc.width = W;
      oc.height = H;
    }
    return oc;
  };
})();

// ---------------------------------------------------------------------------
// Digital grain — sharp-edged digital noise
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

function drawDigitalGrain(
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
// HUD frame elements
// ---------------------------------------------------------------------------
function drawHudFrame(ctx: CanvasRenderingContext2D): void {
  const { frameInset: inset, frameBorderWidth: bw, cornerBracketLen: len } =
    config.hud;

  // Thin border rectangle
  ctx.strokeStyle = config.palette.secondary;
  ctx.lineWidth = bw;
  ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);

  // Corner brackets
  ctx.strokeStyle = config.palette.primary;
  ctx.lineWidth = 1.5;
  ctx.lineCap = "butt";
  const corners = [
    { x: inset, y: inset, dx: 1, dy: 1 },
    { x: W - inset, y: inset, dx: -1, dy: 1 },
    { x: inset, y: H - inset, dx: 1, dy: -1 },
    { x: W - inset, y: H - inset, dx: -1, dy: -1 },
  ];
  ctx.beginPath();
  for (const c of corners) {
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x + len * c.dx, c.y);
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x, c.y + len * c.dy);
  }
  ctx.stroke();
}

function drawDataLabels(
  ctx: CanvasRenderingContext2D,
  frame: number,
): void {
  const { typography, palette, hud } = config;
  const inset = hud.frameInset + 12;

  ctx.font = `${typography.labelWeight} ${typography.labelSize}px ${fontFamily}, monospace`;
  ctx.letterSpacing = `${typography.letterSpacing}em`;
  ctx.fillStyle = palette.secondary;

  // Top-left: frame counter
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`FRM: ${String(frame).padStart(4, "0")}`, inset, inset);

  // Top-right: timestamp
  ctx.textAlign = "right";
  const s = Math.floor(frame / 30);
  const f = frame % 30;
  ctx.fillText(
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}:${String(f).padStart(2, "0")}`,
    W - inset,
    inset,
  );

  // Bottom-left: resolution
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText("RES: 1920×1080", inset, H - inset);

  // Bottom-right: channel
  ctx.textAlign = "right";
  ctx.fillText("CH: RGB", W - inset, H - inset);

  ctx.letterSpacing = "0em";
}

// ---------------------------------------------------------------------------
// Draw a HUD scene — dark bg + HUD frame + centered label
// ---------------------------------------------------------------------------
function drawHudScene(
  ctx: CanvasRenderingContext2D,
  scene: typeof config.sceneA | typeof config.sceneB,
  frame: number,
): void {
  const { palette, typography } = config;

  // Background
  ctx.fillStyle = scene.color;
  ctx.fillRect(0, 0, W, H);

  // HUD frame
  drawHudFrame(ctx);

  // Data labels
  drawDataLabels(ctx, frame);

  // Faint horizontal dividers
  ctx.strokeStyle = `${palette.secondary}20`;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(config.hud.frameInset, H * 0.33);
  ctx.lineTo(W - config.hud.frameInset, H * 0.33);
  ctx.moveTo(config.hud.frameInset, H * 0.67);
  ctx.lineTo(W - config.hud.frameInset, H * 0.67);
  ctx.stroke();

  // Center label
  const isAlert = "isAlert" in scene && scene.isAlert;
  const textColor = isAlert ? palette.accent : palette.primary;

  ctx.font = `${typography.heroWeight} ${typography.heroSize}px ${fontFamily}, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = `${typography.letterSpacing}em`;
  ctx.fillStyle = textColor;
  ctx.fillText(scene.label, W / 2, H / 2);

  // Sub-label
  ctx.font = `${typography.labelWeight} ${typography.labelSize}px ${fontFamily}, monospace`;
  ctx.fillStyle = isAlert ? palette.accent + "80" : palette.secondary;
  ctx.fillText(scene.sublabel, W / 2, H / 2 + 50);
  ctx.letterSpacing = "0em";
}

// ---------------------------------------------------------------------------
// Draw blended HUD scene (A -> B crossfade at given progress)
// ---------------------------------------------------------------------------
function drawBlendedScene(
  ctx: CanvasRenderingContext2D,
  progressAB: number,
  frame: number,
): void {
  if (progressAB < 1) {
    ctx.save();
    ctx.globalAlpha = 1 - progressAB;
    drawHudScene(ctx, config.sceneA, frame);
    ctx.restore();
  }
  if (progressAB > 0) {
    ctx.save();
    ctx.globalAlpha = progressAB;
    drawHudScene(ctx, config.sceneB, frame);
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// True RGB channel separation via pixel manipulation
// ---------------------------------------------------------------------------
function drawRgbSplit(
  ctx: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  offset: number,
): void {
  const srcCtx = source.getContext("2d")!;
  const src = srcCtx.getImageData(0, 0, W, H);
  const dst = ctx.createImageData(W, H);
  const s = src.data;
  const d = dst.data;
  const ox = Math.round(offset);

  for (let y = 0; y < H; y++) {
    const row = y * W;
    for (let x = 0; x < W; x++) {
      const di = (row + x) * 4;
      const ri = (row + Math.min(W - 1, Math.max(0, x + ox))) * 4;
      d[di] = s[ri];
      d[di + 1] = s[di + 1];
      const bi = (row + Math.min(W - 1, Math.max(0, x - ox))) * 4;
      d[di + 2] = s[bi + 2];
      d[di + 3] = s[di + 3];
    }
  }
  ctx.putImageData(dst, 0, 0);
}

// ---------------------------------------------------------------------------
// Noise effects
// ---------------------------------------------------------------------------
function drawScanlines(
  ctx: CanvasRenderingContext2D,
  intensity: number,
  frame: number,
): void {
  const alpha = config.scanlineAlpha * intensity;
  if (alpha < 0.001) return;
  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  const yOffset = (frame * 1) % config.scanlineGap;
  for (let y = yOffset; y < H; y += config.scanlineGap) {
    ctx.fillRect(0, y, W, 1);
  }
  ctx.restore();
}

function drawNoiseBlocks(
  ctx: CanvasRenderingContext2D,
  intensity: number,
  frame: number,
): void {
  const { palette } = config;
  const blockCount = Math.floor(3 + intensity * 5);
  ctx.save();
  for (let i = 0; i < blockCount; i++) {
    const bx = sr(frame * 13 + i * 7) * W;
    const by = sr(frame * 17 + i * 11) * H;
    const bw = 40 + sr(frame * 19 + i * 3) * 160;
    const bh = 2 + sr(frame * 23 + i * 5) * 12;

    ctx.globalAlpha = config.noiseBlockAlpha * intensity;
    // Tinted noise: cyan or magenta
    const isCyan = sr(frame * 29 + i * 31) > 0.5;
    ctx.fillStyle = isCyan ? palette.primary : palette.accent;
    ctx.fillRect(bx, by, bw, bh);
  }
  ctx.restore();
}

function drawLuminanceFlash(
  ctx: CanvasRenderingContext2D,
  intensity: number,
  frame: number,
): void {
  const flashChance = sr(frame * 41 + 7);
  if (flashChance > config.flashThreshold && intensity > 0.3) {
    ctx.save();
    ctx.globalAlpha = config.flashAlpha * intensity;
    ctx.fillStyle = config.palette.primary; // cyan flash instead of white
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Triangle wave: ramps 0 -> 1 -> 0 over [0, 1]
// ---------------------------------------------------------------------------
function triangle(t: number): number {
  return t < 0.5 ? t * 2 : 2 - t * 2;
}

// ---------------------------------------------------------------------------
// Main draw
// ---------------------------------------------------------------------------
const draw = (ctx: CanvasRenderingContext2D, frame: number): void => {
  // Background fill
  ctx.fillStyle = config.palette.bg;
  ctx.fillRect(0, 0, W, H);

  const {
    transitionStart,
    transitionDuration,
    transitionEnd,
    maxRgbOffset,
    maxSliceShift,
    sliceCount,
    posterizeStep,
  } = config;

  if (frame < transitionStart) {
    // --- Scene A static ---
    drawHudScene(ctx, config.sceneA, frame);
  } else if (frame < transitionEnd) {
    // --- Glitch transition ---
    const rawT = (frame - transitionStart) / transitionDuration;
    const t = Math.max(0, Math.min(1, rawT));

    const displayFrame =
      Math.floor((frame - transitionStart) / posterizeStep) * posterizeStep +
      transitionStart;
    const displayT = Math.max(
      0,
      Math.min(1, (displayFrame - transitionStart) / transitionDuration),
    );

    const progressAB = expoOut(displayT);
    const intensity = triangle(t);
    const rgbOffset = maxRgbOffset * intensity;
    const sliceShift = maxSliceShift * intensity;

    // Draw blended HUD scene to offscreen canvas #1
    const oc = getOffscreen();
    const octx = oc.getContext("2d")!;
    octx.clearRect(0, 0, W, H);
    drawBlendedScene(octx, progressAB, displayFrame);

    // RGB channel separation to offscreen canvas #2
    const rgbCanvas = getRgbOffscreen();
    const rgbCtx = rgbCanvas.getContext("2d")!;
    rgbCtx.clearRect(0, 0, W, H);
    drawRgbSplit(rgbCtx, oc, rgbOffset);

    // Slice-based displacement (slices ARE the image)
    const sliceH = Math.ceil(H / sliceCount);
    for (let i = 0; i < sliceCount; i++) {
      const sliceY = i * sliceH;
      const h = Math.min(sliceH, H - sliceY);
      const shiftX = (sr(i * 100 + displayFrame) * 2 - 1) * sliceShift;
      ctx.drawImage(rgbCanvas, 0, sliceY, W, h, shiftX, sliceY, W, h);
    }

    // Noise overlays
    drawNoiseBlocks(ctx, intensity, displayFrame);
    drawLuminanceFlash(ctx, intensity, frame);
  } else {
    // --- Scene B static ---
    drawHudScene(ctx, config.sceneB, frame);
  }

  // --- Persistent overlays (always visible — HUD monitors have scanlines) ---
  drawScanlines(ctx, 1.0, frame);
  drawDigitalGrain(ctx, frame, config.texture.grain);
  drawVignette(ctx, config.texture.vignette);
  drawDust(ctx, frame, 2, `${config.palette.secondary}08`);
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const GlitchTransition: React.FC = () => {
  const stableDraw = useCallback(draw, []);
  return <CanvasScene draw={stableDraw} />;
};
