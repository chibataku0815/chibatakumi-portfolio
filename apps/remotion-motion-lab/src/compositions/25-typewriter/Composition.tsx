/**
 * Typewriter — Composition #25
 *
 * Style: techHud — Cyan/magenta HUD aesthetic with JetBrains Mono,
 * corner brackets, data readouts, and persistent scanlines.
 *
 * Motion technique: Sequential character reveal with blinking cursor.
 * Characters appear one by one at a fixed rate. A magenta block cursor
 * blinks at ~530ms intervals and persists after typing completes.
 *
 * Phases:
 *   0 – typingEnd   Characters appear one per charDelay frames
 *   typingEnd – 119 All text visible, cursor keeps blinking
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
// Deterministic random char from charset
// ---------------------------------------------------------------------------
function randomChar(seed: number): string {
  const idx = Math.floor(sr(seed) * config.charset.length);
  return config.charset[idx];
}

// ---------------------------------------------------------------------------
// Main draw function
// ---------------------------------------------------------------------------
const draw = (ctx: CanvasRenderingContext2D, frame: number): void => {
  // --- Background ---
  ctx.fillStyle = config.palette.bg;
  ctx.fillRect(0, 0, W, H);

  // --- HUD frame + data labels ---
  drawHudFrame(ctx);
  drawDataLabels(ctx, frame);

  // --- Font setup ---
  const { typography } = config;
  ctx.font = `${typography.heroWeight} ${typography.heroSize}px ${fontFamily}, monospace`;
  ctx.letterSpacing = `${typography.letterSpacing}em`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  // --- Typing progress ---
  const chars = config.text.split("");
  const charIndex = Math.min(
    Math.floor(frame / config.charDelay),
    chars.length,
  );

  // Measure character advance width (monospace = uniform)
  const charWidths: number[] = chars.map((ch) => ctx.measureText(ch).width);

  const startX = W * config.leftMargin;
  const y = H / 2;
  let cursorX = startX;

  // --- Draw each character position ---
  for (let i = 0; i < chars.length; i++) {
    let displayChar: string;
    let color: string;

    if (i < charIndex) {
      // Locked character
      displayChar = chars[i];
      // Magenta flash for lockFlashDuration frames after locking
      const lockFrame = (i + 1) * config.charDelay;
      if (frame - lockFrame < config.lockFlashDuration) {
        color = config.palette.accent; // magenta flash
      } else {
        color = config.palette.primary; // cyan (resolved)
      }
    } else {
      // Not yet typed — random noise character
      const flickerSeed =
        i * 1000 + Math.floor(frame / config.flickerRate);
      displayChar = randomChar(flickerSeed);
      color = config.palette.secondary; // muted noise
    }

    ctx.fillStyle = color;
    ctx.fillText(displayChar, cursorX, y);
    cursorX += charWidths[i];
  }

  // --- Blinking cursor at lock boundary ---
  const cursorVisible = frame % config.cursorBlinkCycle < 16;
  if (cursorVisible) {
    // Position cursor after the last locked character
    let cursorPosX = startX;
    for (let j = 0; j < charIndex; j++) {
      cursorPosX += charWidths[j];
    }
    const cursorHeight = typography.heroSize * 0.85;
    ctx.fillStyle = config.palette.accent;
    ctx.fillRect(cursorPosX, y - cursorHeight / 2, 4, cursorHeight);
  }

  ctx.letterSpacing = "0em";

  // --- Persistent overlays ---
  drawScanlines(ctx, 1.0, frame);
  drawDigitalGrain(ctx, frame, config.texture.grain);
  drawVignette(ctx, config.texture.vignette);
  drawDust(ctx, frame, 2, `${config.palette.secondary}08`);
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const Typewriter: React.FC = () => {
  const stableDraw = useCallback(draw, []);
  return <CanvasScene draw={stableDraw} />;
};
