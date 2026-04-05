/**
 * Filmtone Countdown — Canvas 2D Scenes
 *
 * Draws directly from config.ts for all text, colors, and labels.
 * Patterns extracted from 14-template-repro-test (Iter 10).
 */
import React, { useCallback } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import {
  palette as P,
  fonts,
  countdown,
  labels,
  finale,
} from "./config";

const W = 1920;
const H = 1080;

// ---------------------------------------------------------------------------
// Easing
// ---------------------------------------------------------------------------
function quintOut(t: number) { return 1 - Math.pow(1 - t, 5); }
function cubicOut(t: number) { return 1 - Math.pow(1 - t, 3); }
function expOut(t: number) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
function backOut(t: number, s = 1.7) { return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * Math.max(0, Math.min(1, t)); }
function progress(frame: number, start: number, duration: number, easing = quintOut) {
  return easing(Math.max(0, Math.min(1, (frame - start) / duration)));
}
function sr(seed: number) { const x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); }

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
function drawGrid(ctx: CanvasRenderingContext2D, light = false, cell = 48) {
  ctx.strokeStyle = light ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = 0; x <= W; x += cell) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = 0; y <= H; y += cell) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();
}

function drawMonoLabels(
  ctx: CanvasRenderingContext2D,
  items: Array<{ text: string; x: number; y: number; align?: CanvasTextAlign }>,
  color: string,
  alpha: number,
) {
  ctx.save();
  ctx.font = `${fonts.labelWeight} 18px ${fonts.mono}`;
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  for (const l of items) {
    ctx.textAlign = l.align ?? "left";
    ctx.fillText(l.text, l.x, l.y);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Canvas wrapper (same as 14)
// ---------------------------------------------------------------------------
interface CanvasSceneProps {
  draw: (ctx: CanvasRenderingContext2D, frame: number, fps: number) => void;
}
export const CanvasScene: React.FC<CanvasSceneProps> = ({ draw }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      draw(ctx, frame, fps);
    },
    [draw, frame, fps],
  );
  return <canvas ref={canvasRef} width={W} height={H} style={{ width: "100%", height: "100%" }} />;
};

// ===================================================================
// Scene: "5" label — accent bg, slam-in
// ===================================================================
export function drawS5Label(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.fillStyle = P.accent;
  ctx.fillRect(0, 0, W, H);

  const p = progress(frame, 0, 4, expOut);
  const scale = lerp(1.5, 1.0, p);

  ctx.save();
  ctx.translate(W / 2, H * 0.42);
  ctx.scale(scale, scale);
  ctx.font = `${fonts.headingWeight} 600px ${fonts.heading}`;
  ctx.fillStyle = P.black;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(countdown[0], 0, 0);
  ctx.restore();

  // Squares
  const sqP = progress(frame, 2, 3, cubicOut);
  ctx.fillStyle = P.black;
  ctx.fillRect(W * 0.28, H * 0.4, 25 * sqP, 25 * sqP);
  ctx.fillRect(W * 0.68, H * 0.4, 25 * sqP, 25 * sqP);

  drawMonoLabels(ctx, [
    { text: labels.secondary, x: 60, y: 40 },
    { text: labels.primary, x: W * 0.42, y: 40, align: "center" },
    { text: labels.secondary, x: W * 0.58, y: 40, align: "center" },
    { text: labels.action, x: W - 60, y: 40, align: "right" },
    { text: labels.tertiary, x: W - 200, y: H - 30 },
  ], P.black, 0.6);
}

// ===================================================================
// Scene: "5" fill — scales up to fill frame
// ===================================================================
export function drawS5Fill(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.fillStyle = P.accent;
  ctx.fillRect(0, 0, W, H);

  const p = progress(frame, 0, 8, quintOut);
  const fontSize = lerp(600, 1500, p);

  ctx.font = `${fonts.headingWeight} ${fontSize}px ${fonts.heading}`;
  ctx.fillStyle = P.black;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(countdown[0], W / 2, H * 0.5);

  const sqP = progress(frame, 3, 5, cubicOut);
  ctx.fillRect(lerp(-35, -5, sqP), H * 0.4, 30, 30);
  ctx.fillRect(lerp(W + 5, W - 25, sqP), H * 0.4, 30, 30);
}

// ===================================================================
// Scene: "4" symmetric — wide spacing, scale pulse
// ===================================================================
export function drawS4(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.fillStyle = P.lightGray;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = P.black;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const scaleP = progress(frame, 0, 18, quintOut);
  const scale = lerp(0.80, 1.18, scaleP);

  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(scale, scale);
  ctx.translate(-W / 2, -H / 2);

  for (const x of [W * -0.10, W * 0.28, W * 0.66, W * 1.04]) {
    ctx.font = `${fonts.headingWeight} 750px ${fonts.heading}`;
    ctx.fillText(countdown[1], x, H * 0.5);
  }
  for (const x of [W * 0.10, W * 0.47, W * 0.85]) {
    ctx.font = `${fonts.headingWeight} 180px ${fonts.heading}`;
    ctx.fillText(countdown[1], x, H * 0.38);
  }
  ctx.restore();
}

// ===================================================================
// Scene: "3" scattered — pop-in with labels
// ===================================================================
export function drawS3(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.fillStyle = P.midGray;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const threes = [
    { x: 0.55, y: 0.55, s: 240 }, { x: 0.72, y: 0.15, s: 220 },
    { x: 0.28, y: 0.18, s: 200 }, { x: 0.92, y: 0.18, s: 200 },
    { x: 0.88, y: 0.88, s: 200 }, { x: 0.12, y: 0.2, s: 180 },
    { x: 0.35, y: 0.55, s: 180 }, { x: 0.15, y: 0.85, s: 160 },
    { x: 0.58, y: 0.12, s: 140 }, { x: 0.42, y: 0.8, s: 140 },
  ];

  for (let i = 0; i < threes.length; i++) {
    const t = threes[i];
    const p = progress(frame, i * 0.8, 6, backOut);
    if (p < 0.01) continue;
    ctx.save();
    ctx.translate(W * t.x, H * t.y);
    ctx.scale(p, p);
    ctx.font = `700 ${t.s}px ${fonts.heading}`;
    ctx.fillStyle = P.white;
    ctx.globalAlpha = p * 0.7;
    ctx.fillText(countdown[2], 0, 0);
    ctx.restore();
  }

  // Accent squares
  const sqs = [{ x: 0.04, y: 0.35 }, { x: 0.5, y: 0.42 }, { x: 0.32, y: 0.7 }, { x: 0.82, y: 0.62 }];
  for (let i = 0; i < sqs.length; i++) {
    const sp = progress(frame, 4 + i * 1.5, 5, cubicOut);
    if (sp < 0.01) continue;
    ctx.save();
    ctx.globalAlpha = sp;
    ctx.fillStyle = P.accent;
    ctx.fillRect(W * sqs[i].x, H * sqs[i].y, 22 * sp, 22 * sp);
    ctx.restore();
  }

  drawMonoLabels(ctx, [
    { text: labels.quality, x: W * 0.03, y: H * 0.08 },
    { text: labels.quality, x: W * 0.62, y: H * 0.1 },
    { text: labels.primary, x: W * 0.35, y: H * 0.18 },
    { text: labels.quality, x: W * 0.78, y: H * 0.28 },
    { text: labels.quality, x: W * 0.38, y: H * 0.72 },
    { text: labels.quality, x: W * 0.75, y: H * 0.88 },
  ], P.white, progress(frame, 3, 6, cubicOut) * 0.8);
}

// ===================================================================
// Scene: "2" overlapping on accent — with flip
// ===================================================================
export function drawS2Orange(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.fillStyle = P.accent;
  ctx.fillRect(0, 0, W, H);

  ctx.font = `${fonts.headingWeight} 1200px ${fonts.heading}`;
  ctx.fillStyle = P.black;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const twos = [
    { finalX: W * 0.22, finalY: H * 0.55, startX: W * -0.4, delay: 0, flip: false },
    { finalX: W * 0.55, finalY: H * 0.45, startX: W * 0.55, delay: 1, scaleFrom: 0.6, flip: true },
    { finalX: W * 0.88, finalY: H * 0.55, startX: W * 1.4, delay: 1, flip: false },
  ];

  for (const t of twos) {
    const p = progress(frame, t.delay, 5, expOut);
    const x = lerp(t.startX, t.finalX, p);
    const s = t.scaleFrom ? lerp(t.scaleFrom, 1, p) : 1;
    ctx.save();
    ctx.translate(x, t.finalY);
    if (t.flip) ctx.rotate(Math.PI);
    ctx.scale(s, s);
    ctx.globalAlpha = Math.min(1, p * 3);
    ctx.fillText(countdown[3], 0, 0);
    ctx.restore();
  }

  drawMonoLabels(ctx, [
    { text: labels.primary, x: 40, y: 40 },
    { text: labels.primary, x: W - 40, y: H - 30, align: "right" },
  ], P.black, progress(frame, 3, 4, cubicOut) * 0.5);
}

// ===================================================================
// Scene: "2" closeup — abstract diagonal strokes on white
// ===================================================================
export function drawS2Closeup(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.fillStyle = P.white;
  ctx.fillRect(0, 0, W, H);

  const p = progress(frame, 0, 4, quintOut);
  const positions = [
    { x: W * 0.08, y: H * 0.15, flip: false, scale: lerp(1.04, 1.0, p) },
    { x: W * 0.50, y: H * 0.50, flip: true, scale: lerp(1.02, 1.0, p) },
    { x: W * 0.92, y: H * 0.20, flip: false, scale: lerp(1.03, 1.0, p) },
  ];

  for (const pos of positions) {
    ctx.save();
    ctx.translate(pos.x, pos.y);
    if (pos.flip) ctx.rotate(Math.PI);
    ctx.scale(pos.scale, pos.scale);
    ctx.font = `${fonts.headingWeight} 2400px ${fonts.heading}`;
    ctx.fillStyle = P.black;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(countdown[3], 0, 0);
    ctx.restore();
  }

  drawMonoLabels(ctx, [
    { text: labels.primary, x: 40, y: 35 },
    { text: labels.secondary, x: W * 0.48, y: H * 0.35, align: "center" },
    { text: labels.primary, x: W - 40, y: H - 25, align: "right" },
  ], P.black, 0.7);
}

// ===================================================================
// Scene: "1" burst scatter
// ===================================================================
export function drawS1(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.fillStyle = P.black;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const ones = [
    { x: -0.02, y: 0.15, s: 400, c: P.accent, rot: -15 },
    { x: 0.15, y: 0.45, s: 350, c: P.white, rot: 20 },
    { x: 0.35, y: 0.05, s: 280, c: P.white, rot: -10 },
    { x: 0.42, y: 0.4, s: 320, c: P.white, rot: 15 },
    { x: 0.55, y: 0.2, s: 380, c: P.accent, rot: -20 },
    { x: 0.7, y: 0.55, s: 360, c: P.accent, rot: 15 },
    { x: 0.75, y: 0.15, s: 300, c: P.white, rot: -25 },
    { x: 0.85, y: 0.4, s: 340, c: P.white, rot: 20 },
    { x: 0.92, y: 0.1, s: 280, c: P.white, rot: -15 },
    { x: 0.05, y: 0.8, s: 320, c: P.white, rot: 25 },
    { x: 0.3, y: 0.75, s: 260, c: P.white, rot: -20 },
    { x: 0.65, y: 0.8, s: 340, c: P.white, rot: 15 },
    { x: 0.9, y: 0.75, s: 300, c: P.white, rot: -10 },
  ];

  for (let i = 0; i < ones.length; i++) {
    const o = ones[i];
    const p = progress(frame, i * 0.6, 8, expOut);
    const cx = lerp(W * 0.5, W * o.x, p);
    const cy = lerp(H * 0.5, H * o.y, p);
    const rot = lerp(0, o.rot, p);
    const scale = lerp(0.3, 1, p);
    const alpha = Math.min(1, p * 2) * (o.c === P.accent ? 1 : 0.75);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.font = `800 ${o.s}px ${fonts.heading}`;
    ctx.fillStyle = o.c;
    ctx.globalAlpha = alpha;
    ctx.fillText(countdown[4], 0, 0);
    ctx.restore();
  }

  drawMonoLabels(ctx, [
    { text: labels.tertiary, x: W * 0.12, y: H * 0.08 },
    { text: labels.tertiary, x: W * 0.78, y: H * 0.08 },
    { text: labels.tertiary, x: W * 0.35, y: H * 0.6 },
    { text: labels.tertiary, x: W * 0.7, y: H * 0.85 },
  ], P.white, progress(frame, 6, 6, cubicOut) * 0.8);
}

// ===================================================================
// Scene: Letter assembly — scattered letters → finale word
// ===================================================================
export function drawAssembly(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.fillStyle = P.white;
  ctx.fillRect(0, 0, W, H);
  drawGrid(ctx, true, 32);
  ctx.textBaseline = "middle";

  const word = finale.line1 + " " + finale.line2; // "SEE IT FIRST"
  const fontSize = 200;
  ctx.font = `${fonts.headingWeight} ${fontSize}px ${fonts.heading}`;

  const letters: Array<{ ch: string; finalX: number; finalY: number }> = [];
  const totalW = ctx.measureText(word).width;
  const startX = (W - totalW) / 2;
  let curX = startX;
  for (const ch of word) {
    const w = ctx.measureText(ch).width;
    letters.push({ ch, finalX: curX, finalY: H * 0.45 });
    curX += w;
  }

  for (let i = 0; i < letters.length; i++) {
    const { ch, finalX, finalY } = letters[i];
    if (ch === " ") continue;
    const p = progress(frame, i * 1.0, 14, cubicOut);
    const sx = W * (0.05 + sr(i * 13 + 1) * 0.85);
    const sy = H * (0.15 + sr(i * 13 + 2) * 0.65);
    const x = lerp(sx, finalX, p);
    const y = lerp(sy, finalY, p);
    const rot = lerp((sr(i * 13 + 3) - 0.5) * 40, 0, p);
    const scatterSize = lerp(fontSize * (0.5 + sr(i * 13 + 4) * 0.8), fontSize, p);
    const alpha = Math.min(1, p * 2);

    ctx.save();
    ctx.translate(x + ctx.measureText(ch).width / 2, y);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.font = `${fonts.headingWeight} ${Math.round(scatterSize)}px ${fonts.heading}`;
    ctx.fillStyle = P.black;
    ctx.globalAlpha = alpha;
    ctx.textAlign = "center";
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  }

  drawMonoLabels(ctx, [
    { text: labels.secondary, x: W * 0.04, y: 30 },
    { text: labels.primary, x: W * 0.30, y: 30 },
    { text: labels.secondary, x: W * 0.55, y: 30 },
    { text: labels.action, x: W - 40, y: 30, align: "right" },
  ], P.black, progress(frame, 4, 8, cubicOut) * 0.6);
}

// ===================================================================
// Scene: Finale — hero text slam-in (replaces "RAW POWER")
// ===================================================================
export function drawFinale(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.fillStyle = P.accent;
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = "middle";

  const p = progress(frame, 0, 18, quintOut);
  const scale = lerp(1.5, 1.0, p);

  // Line 1
  const l1X = lerp(W * -0.38, W * -0.06, p);
  ctx.save();
  ctx.translate(l1X + 300 * scale, H * 0.25);
  ctx.scale(scale, scale);
  ctx.font = `${fonts.headingWeight} 500px ${fonts.heading}`;
  ctx.fillStyle = P.black;
  ctx.textAlign = "left";
  ctx.fillText(finale.line1, -300, 0);
  ctx.restore();

  // Line 2
  const l2X = lerp(W * -0.12, W * 0.08, p);
  ctx.save();
  ctx.translate(l2X + 300 * scale, H * 0.72);
  ctx.scale(scale, scale);
  ctx.font = `${fonts.headingWeight} 500px ${fonts.heading}`;
  ctx.fillStyle = P.black;
  ctx.textAlign = "left";
  ctx.fillText(finale.line2, -300, 0);
  ctx.restore();

  // Labels
  const allLabels = [
    { text: labels.quality, x: W * 0.04, y: H * 0.04 },
    { text: labels.primary, x: W * 0.30, y: H * 0.04 },
    { text: labels.primary, x: W * 0.45, y: H * 0.04 },
    { text: labels.primary, x: W * 0.04, y: H * 0.48 },
    { text: labels.quality, x: W * 0.16, y: H * 0.48 },
    { text: labels.action, x: W * 0.28, y: H * 0.48 },
    { text: labels.primary, x: W * 0.65, y: H * 0.48 },
    { text: labels.quality, x: W * 0.80, y: H * 0.48 },
    { text: labels.primary, x: W * 0.38, y: H * 0.96 },
    { text: labels.secondary, x: W * 0.58, y: H * 0.96 },
    { text: labels.quality, x: W * 0.88, y: H * 0.96 },
  ];
  for (const l of allLabels) {
    const lp = progress(frame, 6 + allLabels.indexOf(l), 8, cubicOut);
    if (lp < 0.01) continue;
    ctx.save();
    ctx.globalAlpha = lp * 0.7;
    ctx.fillStyle = P.black;
    ctx.font = `${fonts.labelWeight} 18px ${fonts.mono}`;
    ctx.textAlign = "left";
    ctx.fillText(l.text, l.x, l.y);
    ctx.restore();
  }
}
