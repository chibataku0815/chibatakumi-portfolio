/**
 * Zoom Transition — Composition #33
 *
 * Style: techHud — Cyan/magenta HUD aesthetic with JetBrains Mono,
 * corner brackets, data readouts, and persistent scanlines.
 *
 * Motion technique: Zoom-blur punch through.
 * Scene A zooms out (scale 1 -> 3) with increasing blur,
 * then Scene B zooms in (scale 3 -> 1) with decreasing blur.
 * The transition pivots around canvas center.
 * Scene A = cyan (nominal), Scene B = magenta (alert).
 *
 * Phases:
 *   0-14   Scene A static
 *   15-21  Scene A zoom out + blur increase + alpha fade
 *   22-28  Scene B zoom in + blur decrease + alpha fade in
 *   29-59  Scene B static
 */
import React, { useCallback } from "react";
import {
  CanvasScene,
  W,
  H,
  sr,
  lerp,
  drawDust,
  drawVignette,
} from "../../lib/canvas-primitives";
import { expoIn, expoOut } from "../../lib/canvas-easing";
import { loadFont } from "@remotion/google-fonts/JetBrainsMono";
import { config } from "./config";

// ---------------------------------------------------------------------------
// Font setup
// ---------------------------------------------------------------------------
const { fontFamily } = loadFont();

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
// Scanlines — persistent horizontal lines
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

// ---------------------------------------------------------------------------
// HUD frame — thin border + corner brackets
// ---------------------------------------------------------------------------
function drawHudFrame(ctx: CanvasRenderingContext2D): void {
  const { frameInset: inset, frameBorderWidth: bw, cornerBracketLen: len } =
    config.hud;

  ctx.strokeStyle = config.palette.secondary;
  ctx.lineWidth = bw;
  ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);

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

// ---------------------------------------------------------------------------
// Data labels — 4 corners with HUD readouts
// ---------------------------------------------------------------------------
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
  ctx.fillText("RES: 1920\u00d71080", inset, H - inset);

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
// Draw a HUD scene scaled from center with optional blur and alpha
// ---------------------------------------------------------------------------
function drawHudSceneZoomed(
  ctx: CanvasRenderingContext2D,
  scene: typeof config.sceneA | typeof config.sceneB,
  frame: number,
  scale: number,
  blurPx: number,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  if (blurPx > 0.1) {
    ctx.filter = `blur(${blurPx.toFixed(1)}px)`;
  }
  ctx.translate(W / 2, H / 2);
  ctx.scale(scale, scale);
  ctx.translate(-W / 2, -H / 2);
  drawHudScene(ctx, scene, frame);
  ctx.restore();
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
    transitionMid,
    transitionEnd,
    maxScale,
    maxBlur,
  } = config;

  const firstHalfDuration = transitionMid - transitionStart;
  const secondHalfDuration = transitionEnd - transitionMid;

  if (frame < transitionStart) {
    // --- Scene A static ---
    drawHudScene(ctx, config.sceneA, frame);
  } else if (frame < transitionMid) {
    // --- First half: Scene A zooms OUT, blur increases, alpha fades ---
    const rawT = (frame - transitionStart) / firstHalfDuration;
    const t = expoIn(Math.max(0, Math.min(1, rawT)));

    const scale = lerp(1.0, maxScale, t);
    const blur = lerp(0, maxBlur, t);
    const alpha = lerp(1, 0, t);

    drawHudSceneZoomed(ctx, config.sceneA, frame, scale, blur, alpha);
  } else if (frame < transitionEnd) {
    // --- Second half: Scene B zooms IN, blur decreases, alpha fades in ---
    const rawT = (frame - transitionMid) / secondHalfDuration;
    const t = expoOut(Math.max(0, Math.min(1, rawT)));

    const scale = lerp(maxScale, 1.0, t);
    const blur = lerp(maxBlur, 0, t);
    const alpha = lerp(0, 1, t);

    drawHudSceneZoomed(ctx, config.sceneB, frame, scale, blur, alpha);
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
export const ZoomTransition: React.FC = () => {
  const stableDraw = useCallback(draw, []);
  return <CanvasScene draw={stableDraw} />;
};
