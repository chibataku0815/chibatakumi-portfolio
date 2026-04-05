/**
 * Canvas 2D renderer — Iteration 10
 * All scenes verified by direct frame inspection.
 * 14 scenes / 300f / 10s / 30fps / 1920x1080
 * Iter 10: added SA ("2" closeup), SB ("CLEARED" assembly), retimed all scenes
 */
import React, { useCallback } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

const W = 1920;
const H = 1080;

function quintOut(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

function sr(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

// ---------------------------------------------------------------------------
// Animation utilities — Iter 9
// ---------------------------------------------------------------------------
function cubicOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function backOut(t: number, s = 1.7): number {
  return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function progress(frame: number, start: number, duration: number, easing: (t: number) => number = quintOut): number {
  const t = Math.max(0, Math.min(1, (frame - start) / duration));
  return easing(t);
}

// ---------------------------------------------------------------------------
// Canvas wrapper
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

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{ width: "100%", height: "100%" }}
    />
  );
};

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
export const P = {
  black: "#000000",
  white: "#FFFFFF",
  orange: "#FF5500", // Iter 9: verified — warmer orange, less red than #FF4500
  darkGray: "#3A3A3A", // Iter 9: verified — distinguishable dark gray, not near-black
  midGray: "#4D4D4D", // Iter 9: verified — darker than #666
  lightGray: "#EBEBEB", // Iter 9: verified — slightly darker than #F0F0F0
} as const;

// ---------------------------------------------------------------------------
// Shared: grid (fine, 0.5px lines)
// ---------------------------------------------------------------------------
function drawGrid(ctx: CanvasRenderingContext2D, light = false, cell = 48) {
  ctx.strokeStyle = light ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = 0; x <= W; x += cell) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = 0; y <= H; y += cell) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Shared: mono labels (monospace font, as seen in reference)
// ---------------------------------------------------------------------------
function drawLabels(ctx: CanvasRenderingContext2D, color: string = P.white) {
  ctx.save();
  ctx.font = `600 20px "Courier New", monospace`;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.6;
  ctx.textAlign = "left";
  // Ref 2.0s: 4 labels at top — VERTEX, [SHIFT AI], VERTEX, DEPLOY
  ctx.fillText("VERTEX", 60, 40);
  ctx.textAlign = "center";
  ctx.fillText("[SHIFT AI]", W * 0.42, 40);
  ctx.fillText("VERTEX", W * 0.58, 40);
  ctx.textAlign = "right";
  ctx.fillText("DEPLOY", W - 60, 40);
  ctx.textAlign = "left";
  ctx.fillText("INITIATE", W - 200, H - 30);
  ctx.restore();
}

// ===================================================================
// S1: DON'T WATCH + static 18% bar (0-21f)
// Ref: 0.0-0.70s — static hold, bar fixed at 18%, no animation
// ===================================================================
export function drawS1(ctx: CanvasRenderingContext2D, _frame: number) {
  ctx.fillStyle = P.black;
  ctx.fillRect(0, 0, W, H);
  drawGrid(ctx);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // DON'T
  ctx.font = "800 260px Inter, sans-serif";
  ctx.fillStyle = P.white;
  ctx.fillText("DON'T", W / 2, H * 0.25);

  // WATCH
  ctx.font = "800 300px Inter, sans-serif";
  ctx.fillText("WATCH", W / 2, H * 0.72);

  // Loading bar — FIXED at 18% (ref shows static hold)
  const barFill = 0.18;
  const barW = W * 0.12;
  const barH = 24;
  const barX = W / 2 - barW / 2;
  const barY = H * 0.46;
  ctx.fillStyle = "#333";
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = P.orange;
  ctx.fillRect(barX, barY, barW * barFill, barH);

  // 18% counter — fixed
  ctx.font = "400 20px Inter, sans-serif";
  ctx.fillStyle = P.white;
  ctx.textAlign = "center";
  ctx.fillText("18%", W / 2, barY - 12);
}

// ===================================================================
// S2: DON'T BLINK / WATCH CLOSELY — kinetic slide-in (21-48f)
// Ref 60fps: text slides in progressively, bar 18%→100%, "LOADING" label
// ===================================================================
export function drawS2(ctx: CanvasRenderingContext2D, frame: number) {
  const t = Math.min(frame / 27, 1);
  const bar = quintOut(t);

  ctx.fillStyle = P.black;
  ctx.fillRect(0, 0, W, H);
  drawGrid(ctx);

  ctx.textBaseline = "middle";
  ctx.fillStyle = P.white;

  // DON'T — slides in from right (ref: starts slightly right, settles left)
  const dontP = progress(frame, 0, 12, quintOut);
  const dontX = lerp(W * 0.25, W * 0.02, dontP);
  ctx.font = "800 280px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("DON'T", dontX, H * 0.18);

  // BLINK — slides in from left (ref: B starts off-screen, "NK" visible first)
  const blinkP = progress(frame, 2, 14, quintOut);
  const blinkX = lerp(W * -0.25, W * -0.02, blinkP);
  ctx.font = "800 260px Inter, sans-serif";
  ctx.fillText("BLINK", blinkX, H * 0.42);

  // LOADING label + wider bar (ref: bar spans ~40% of frame width)
  const barP = progress(frame, 0, 22, quintOut);
  const barPercent = lerp(0.18, 1.0, barP);
  ctx.font = "400 18px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("LOADING", W * 0.32, H * 0.47);
  ctx.fillStyle = P.orange;
  ctx.fillRect(W * 0.32, H * 0.485, W * 0.4 * barPercent, 8);
  ctx.fillStyle = P.white;
  ctx.textAlign = "right";
  ctx.fillText(`${Math.round(barPercent * 100)}%`, W * 0.74, H * 0.47);

  // WATCH — slides in from right
  const watchP = progress(frame, 4, 12, quintOut);
  const watchX = lerp(W * 1.1, W * 0.85, watchP);
  ctx.font = "800 280px Inter, sans-serif";
  ctx.textAlign = "right";
  ctx.fillStyle = P.white;
  ctx.fillText("WATCH", watchX, H * 0.68);

  // CLOSELY — slides in from right/below (ref: letters assemble staggered)
  const closeP = progress(frame, 6, 16, quintOut);
  const closeX = lerp(W * 1.3, W * 1.02, closeP);
  const closeY = lerp(H * 1.0, H * 0.9, closeP);
  ctx.font = "800 240px Inter, sans-serif";
  ctx.globalAlpha = Math.min(1, closeP * 2);
  ctx.fillText("CLOSELY", closeX, closeY);
  ctx.globalAlpha = 1;
}

// ===================================================================
// S3: "5" with labels (38-50f)
// Ref: 2.0s — moderate size 5, labels visible, small black squares
// ===================================================================
export function drawS3(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.fillStyle = P.orange;
  ctx.fillRect(0, 0, W, H);

  // "5" slams in: starts 1.5x, settles to 1x — punchy snap
  const expOut = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  const p = progress(frame, 0, 4, expOut);
  const scale = lerp(1.5, 1.0, p);

  ctx.save();
  ctx.translate(W / 2, H * 0.42);
  ctx.scale(scale, scale);
  ctx.font = "900 600px Inter, sans-serif";
  ctx.fillStyle = P.black;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("5", 0, 0);
  ctx.restore();

  // Small black squares — pop in
  const sqP = progress(frame, 2, 4, cubicOut);
  ctx.fillStyle = P.black;
  ctx.fillRect(W * 0.28, H * 0.4, 25 * sqP, 25 * sqP);
  ctx.fillRect(W * 0.68, H * 0.4, 25 * sqP, 25 * sqP);

  drawLabels(ctx, P.black);
}

// ===================================================================
// S4: "5" frame-filling (50-62f)
// Ref: 2.5s — enormous 5, clips top/bottom, squares at edges
// ===================================================================
export function drawS4(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.fillStyle = P.orange;
  ctx.fillRect(0, 0, W, H);

  // Scale-up: "5" grows from S3 size to frame-filling
  const p = progress(frame, 0, 8, quintOut);
  const fontSize = lerp(600, 1500, p);

  ctx.font = `900 ${fontSize}px Inter, sans-serif`;
  ctx.fillStyle = P.black;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("5", W / 2, H * 0.5);

  // Edge squares slide in
  const sqP = progress(frame, 3, 5, cubicOut);
  ctx.fillRect(lerp(-35, -5, sqP), H * 0.4, 30, 30);
  ctx.fillRect(lerp(W + 5, W - 25, sqP), H * 0.4, 30, 30);
}

// ===================================================================
// S5: "4" symmetric on white (62-77f)
// Ref: 3.0s — white bg, 3 large + 3 small 4s in a row
// ===================================================================
export function drawS5(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.fillStyle = P.lightGray;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = P.black;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Scale pulse: starts small (all 4 visible), grows to push outer 4s off-screen
  // ref_0163: all 4 visible, ref_0190: only 2 center visible
  const scaleP = progress(frame, 0, 18, quintOut);
  const scale = lerp(0.80, 1.18, scaleP);

  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(scale, scale);
  ctx.translate(-W / 2, -H / 2);

  // 4 large 4s — wide spacing, font reduced to match ref proportions
  const largePositions = [W * -0.10, W * 0.28, W * 0.66, W * 1.04];
  for (const x of largePositions) {
    ctx.font = "900 750px Inter, sans-serif";
    ctx.fillText("4", x, H * 0.5);
  }

  // 3 small 4s between large ones (ref: clearly visible in gaps)
  const smallPositions = [W * 0.10, W * 0.47, W * 0.85];
  for (const x of smallPositions) {
    ctx.font = "900 180px Inter, sans-serif";
    ctx.fillText("4", x, H * 0.38);
  }

  ctx.restore();
}

// ===================================================================
// S6: Scattered "3"s on grey (77-100f)
// Ref: 3.5s — mid grey bg, ~10 3s, LAUNCH labels, orange squares
// ===================================================================
export function drawS6(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.fillStyle = P.midGray;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 3s — stagger pop-in: largest first, center-out
  const threes: Array<{ x: number; y: number; s: number }> = [
    { x: 0.55, y: 0.55, s: 240 },
    { x: 0.72, y: 0.15, s: 220 },
    { x: 0.28, y: 0.18, s: 200 },
    { x: 0.92, y: 0.18, s: 200 },
    { x: 0.88, y: 0.88, s: 200 },
    { x: 0.12, y: 0.2, s: 180 },
    { x: 0.35, y: 0.55, s: 180 },
    { x: 0.15, y: 0.85, s: 160 },
    { x: 0.58, y: 0.12, s: 140 },
    { x: 0.42, y: 0.8, s: 140 },
  ];

  for (let i = 0; i < threes.length; i++) {
    const t = threes[i];
    const p = progress(frame, i * 1, 8, backOut);
    if (p < 0.01) continue;
    const scale = p;
    ctx.save();
    ctx.translate(W * t.x, H * t.y);
    ctx.scale(scale, scale);
    ctx.font = `700 ${t.s}px Inter, sans-serif`;
    ctx.fillStyle = P.white;
    ctx.globalAlpha = p * 0.7;
    ctx.fillText("3", 0, 0);
    ctx.restore();
  }

  // Orange squares — scale in with stagger
  const sqs = [
    { x: 0.04, y: 0.35, s: 22 }, { x: 0.5, y: 0.42, s: 20 },
    { x: 0.32, y: 0.7, s: 18 }, { x: 0.82, y: 0.62, s: 22 },
  ];
  for (let i = 0; i < sqs.length; i++) {
    const sq = sqs[i];
    const sp = progress(frame, 5 + i * 2, 6, cubicOut);
    if (sp < 0.01) continue;
    ctx.save();
    ctx.globalAlpha = sp;
    ctx.fillStyle = P.orange;
    ctx.fillRect(W * sq.x, H * sq.y, sq.s * sp, sq.s * sp);
    ctx.restore();
  }

  // LAUNCH labels — stagger fade in
  ctx.font = `600 18px "Courier New", monospace`;
  ctx.textAlign = "left";
  const launches = [
    { x: 0.03, y: 0.08 }, { x: 0.35, y: 0.18 },
    { x: 0.62, y: 0.1 }, { x: 0.78, y: 0.28 },
    { x: 0.3, y: 0.45 }, { x: 0.72, y: 0.5 },
    { x: 0.38, y: 0.72 }, { x: 0.75, y: 0.88 },
  ];
  for (let i = 0; i < launches.length; i++) {
    const lp = progress(frame, 3 + i * 1, 6, cubicOut);
    if (lp < 0.01) continue;
    ctx.save();
    ctx.fillStyle = P.white;
    ctx.globalAlpha = lp * 0.8;
    ctx.fillText("LAUNCH", W * launches[i].x, H * launches[i].y);
    ctx.restore();
  }
}

// ===================================================================
// S7: "2" on orange — massive, overlapping, clipping (100-115f)
// Ref: 4.0s — 3 enormous 2s fill frame, all edges clipped
// ===================================================================
export function drawS7(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.fillStyle = P.orange;
  ctx.fillRect(0, 0, W, H);

  ctx.font = "900 1200px Inter, sans-serif";
  ctx.fillStyle = P.black;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Three overlapping 2s — fast slam-in, one flipped (ref_0235: curves interlock)
  const twos = [
    { finalX: W * 0.22, finalY: H * 0.55, startX: W * -0.4, delay: 0, flip: false },
    { finalX: W * 0.55, finalY: H * 0.45, startX: W * 0.55, delay: 1, scaleFrom: 0.6, flip: true }, // UPSIDE DOWN
    { finalX: W * 0.88, finalY: H * 0.55, startX: W * 1.4, delay: 1, flip: false },
  ];

  // Exponential out for punchy AE-style snap
  const expOut = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

  for (const t of twos) {
    const p = progress(frame, t.delay, 5, expOut); // shorter duration = snappier
    const x = lerp(t.startX, t.finalX, p);
    const s = t.scaleFrom ? lerp(t.scaleFrom, 1, p) : 1;
    ctx.save();
    ctx.translate(x, t.finalY);
    if (t.flip) ctx.rotate(Math.PI); // 180° flip
    ctx.scale(s, s);
    ctx.globalAlpha = Math.min(1, p * 3);
    ctx.fillText("2", 0, 0);
    ctx.restore();
  }

  // [SHIFT AI] labels — fade in
  const lp = progress(frame, 3, 4, cubicOut);
  if (lp > 0.01) {
    ctx.save();
    ctx.font = `600 20px "Courier New", monospace`;
    ctx.fillStyle = P.black;
    ctx.globalAlpha = lp * 0.5;
    ctx.textAlign = "left";
    ctx.fillText("[SHIFT AI]", 40, 40);
    ctx.textAlign = "right";
    ctx.fillText("[SHIFT AI]", W - 40, H - 30);
    ctx.restore();
  }
}

// ===================================================================
// SA: "2" extreme closeup on white — diagonal strokes (122-130f)
// Ref 4.08-4.33s: 3 massive "2"s at ~2500px create abstract diagonal patterns
// White bg, VERTEX labels (one upside-down), [SHIFT AI] corners
// ===================================================================
export function drawSA(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.fillStyle = P.white;
  ctx.fillRect(0, 0, W, H);

  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  // 3 enormous "2"s — centers near frame edges so only strokes are visible
  // ref_0250: abstract diagonal stripe pattern from "2" anatomy
  // One "2" inverted creates crossing diagonals
  const p = progress(frame, 0, 4, quintOut);
  const positions = [
    { x: W * 0.08, y: H * 0.15, flip: false, scale: lerp(1.04, 1.0, p) },
    { x: W * 0.50, y: H * 0.50, flip: true, scale: lerp(1.02, 1.0, p) }, // INVERTED
    { x: W * 0.92, y: H * 0.20, flip: false, scale: lerp(1.03, 1.0, p) },
  ];

  for (const pos of positions) {
    ctx.save();
    ctx.translate(pos.x, pos.y);
    if (pos.flip) ctx.rotate(Math.PI);
    ctx.scale(pos.scale, pos.scale);
    ctx.font = "900 2400px Inter, sans-serif";
    ctx.fillStyle = P.black;
    ctx.fillText("2", 0, 0);
    ctx.restore();
  }

  // Labels
  ctx.font = `600 18px "Courier New", monospace`;
  ctx.textAlign = "left";
  ctx.fillStyle = P.black;
  ctx.globalAlpha = 0.7;
  ctx.fillText("[SHIFT AI]", 40, 35);

  // VERTEX — normal
  ctx.textAlign = "center";
  ctx.fillText("VERTEX", W * 0.48, H * 0.35);

  // VERTEX — upside down
  ctx.save();
  ctx.translate(W * 0.55, H * 0.65);
  ctx.rotate(Math.PI);
  ctx.fillText("VERTEX", 0, 0);
  ctx.restore();

  // [SHIFT AI] bottom-right
  ctx.textAlign = "right";
  ctx.fillText("[SHIFT AI]", W - 40, H - 25);
  ctx.globalAlpha = 1;
}

// ===================================================================
// S8: Scattered "1"s — ROTATED + INITIATE ×4 (130-145f)
// Ref: 4.33-4.83s — tilted 1s (15-30°), white + orange, 4 INITIATE labels
// ===================================================================
export function drawS8(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.fillStyle = P.black;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const ones: Array<{
    x: number; y: number; s: number; c: string; rot: number;
  }> = [
    { x: -0.02, y: 0.15, s: 400, c: P.orange, rot: -15 },
    { x: 0.15, y: 0.45, s: 350, c: P.white, rot: 20 },
    { x: 0.35, y: 0.05, s: 280, c: P.white, rot: -10 },
    { x: 0.42, y: 0.4, s: 320, c: P.white, rot: 15 },
    { x: 0.55, y: 0.2, s: 380, c: P.orange, rot: -20 },
    { x: 0.7, y: 0.55, s: 360, c: P.orange, rot: 15 },
    { x: 0.75, y: 0.15, s: 300, c: P.white, rot: -25 },
    { x: 0.85, y: 0.4, s: 340, c: P.white, rot: 20 },
    { x: 0.92, y: 0.1, s: 280, c: P.white, rot: -15 },
    { x: 0.05, y: 0.8, s: 320, c: P.white, rot: 25 },
    { x: 0.3, y: 0.75, s: 260, c: P.white, rot: -20 },
    { x: 0.65, y: 0.8, s: 340, c: P.white, rot: 15 },
    { x: 0.9, y: 0.75, s: 300, c: P.white, rot: -10 },
  ];

  // Burst scatter from center: each "1" flies outward — fast explosion
  const expOut = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  for (let i = 0; i < ones.length; i++) {
    const o = ones[i];
    const p = progress(frame, i * 0.6, 8, expOut);
    const finalX = W * o.x;
    const finalY = H * o.y;
    const cx = lerp(W * 0.5, finalX, p);
    const cy = lerp(H * 0.5, finalY, p);
    const rot = lerp(0, o.rot, p);
    const scale = lerp(0.3, 1, p);
    const alpha = Math.min(1, p * 2) * (o.c === P.orange ? 1 : 0.75);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.font = `800 ${o.s}px Inter, sans-serif`;
    ctx.fillStyle = o.c;
    ctx.globalAlpha = alpha;
    ctx.fillText("1", 0, 0);
    ctx.restore();
  }

  // INITIATE ×4 — stagger fade in
  const initLabels = [
    { x: W * 0.12, y: H * 0.08 },
    { x: W * 0.78, y: H * 0.08 },
    { x: W * 0.35, y: H * 0.6 },
    { x: W * 0.7, y: H * 0.85 },
  ];
  ctx.font = `600 22px "Courier New", monospace`;
  ctx.textAlign = "left";
  for (let i = 0; i < initLabels.length; i++) {
    const lp = progress(frame, 8 + i * 2, 6, cubicOut);
    if (lp < 0.01) continue;
    ctx.save();
    ctx.fillStyle = P.white;
    ctx.globalAlpha = lp * 0.8;
    ctx.fillText("INITIATE", initLabels[i].x, initLabels[i].y);
    ctx.restore();
  }
}

// ===================================================================
// SB: "CLEARED" letter assembly on white grid (145-170f)
// Ref 4.83-5.67s: scattered letters → assemble into "CLEARED"
// Same kinetic assembly pattern as S11 but with "CLEARED"
// ===================================================================
export function drawSB(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.fillStyle = P.white;
  ctx.fillRect(0, 0, W, H);
  drawGrid(ctx, true, 32);

  ctx.textBaseline = "middle";

  const word = "CLEARED";
  const fontSize = 260;
  ctx.font = `900 ${fontSize}px Inter, sans-serif`;

  // Measure final letter positions (centered horizontally)
  const letters: Array<{ ch: string; finalX: number; finalY: number }> = [];
  const totalW = ctx.measureText(word).width;
  const startX = (W - totalW) / 2;
  let curX = startX;
  for (const ch of word) {
    const w = ctx.measureText(ch).width;
    letters.push({ ch, finalX: curX, finalY: H * 0.42 });
    curX += w;
  }

  // Animate: scatter → assemble (ref: scattered at 5.17s, assembling at 5.33s, done by 5.58s)
  for (let i = 0; i < letters.length; i++) {
    const { ch, finalX, finalY } = letters[i];
    const entryDelay = i * 1.2;
    const p = progress(frame, entryDelay, 14, cubicOut);

    // Scattered start positions (seeded random)
    const sx = W * (0.05 + sr(i * 13 + 1) * 0.85);
    const sy = H * (0.15 + sr(i * 13 + 2) * 0.65);
    const x = lerp(sx, finalX, p);
    const y = lerp(sy, finalY, p);
    const rot = lerp((sr(i * 13 + 3) - 0.5) * 40, 0, p);
    // Mixed case during scatter: some letters appear lowercase
    const scatterSize = lerp(fontSize * (0.5 + sr(i * 13 + 4) * 0.8), fontSize, p);
    const alpha = Math.min(1, p * 2);

    ctx.save();
    ctx.translate(x + ctx.measureText(ch).width / 2, y);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.font = `900 ${Math.round(scatterSize)}px Inter, sans-serif`;
    ctx.fillStyle = P.black;
    ctx.globalAlpha = alpha;
    ctx.textAlign = "center";
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  }

  // Labels at top — same as ref
  const labelP = progress(frame, 4, 8, cubicOut);
  if (labelP > 0.01) {
    ctx.save();
    ctx.font = `600 18px "Courier New", monospace`;
    ctx.fillStyle = P.black;
    ctx.globalAlpha = labelP * 0.6;
    ctx.textAlign = "left";
    ctx.fillText("VERTEX", W * 0.04, 30);
    ctx.fillText("[SHIFT AI]", W * 0.30, 30);
    ctx.fillText("VERTEX", W * 0.55, 30);
    ctx.textAlign = "right";
    ctx.fillText("DEPLOY", W - 40, 30);
    ctx.restore();
  }
}

// ===================================================================
// S9: CLEARED FOR LAUNCH on white grid (172-190f)
// Ref: 5.75-6.33s — "CLEARED FOR" large, then "LAUNCH" in orange below
// ===================================================================
export function drawS9(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.fillStyle = P.white;
  ctx.fillRect(0, 0, W, H);
  drawGrid(ctx, true, 32);

  ctx.textBaseline = "middle";

  // Sequential reveal: each line slides in from left, staggered
  const elements = [
    { text: "CLEARED", x: W * -0.01, y: H * 0.2, color: P.black, delay: 0, slideX: -400 },
    { text: "FOR", x: W * -0.01, y: H * 0.45, color: P.black, delay: 4, slideX: -300 },
    { text: "LAU", x: W * 0.72, y: H * 0.2, color: P.black, delay: 10, slideX: 200 },
    { text: "LAUNCH", x: W * -0.01, y: H * 0.85, color: P.orange, delay: 8, slideX: -350 },
  ];

  ctx.font = "900 280px Inter, sans-serif";
  ctx.textAlign = "left";

  for (const el of elements) {
    const p = progress(frame, el.delay, 10, quintOut);
    if (p < 0.01) continue;
    const xOff = el.slideX * (1 - p);
    ctx.save();
    ctx.globalAlpha = Math.min(1, p * 2);
    ctx.fillStyle = el.color;
    ctx.fillText(el.text, el.x + xOff, el.y);
    ctx.restore();
  }

  // Small LAUNCH labels — pop in
  const labelP = progress(frame, 8, 8, cubicOut);
  if (labelP > 0.01) {
    ctx.save();
    ctx.font = `400 22px "Courier New", monospace`;
    ctx.fillStyle = P.black;
    ctx.textAlign = "left";
    ctx.globalAlpha = labelP;
    const s = lerp(0.8, 1, labelP);
    ctx.translate(W * 0.42, H * 0.55);
    ctx.scale(s, s);
    ctx.fillText("LAUNCH", 0, 0);
    ctx.restore();

    ctx.save();
    ctx.font = `400 22px "Courier New", monospace`;
    ctx.fillStyle = P.black;
    ctx.textAlign = "left";
    ctx.globalAlpha = labelP;
    ctx.translate(W * 0.58, H * 0.52);
    ctx.scale(s, s);
    ctx.fillText("LAUNCH", 0, 0);
    ctx.restore();
  }
}

// ===================================================================
// S10: LAUNCH wall (178-210f)
// Ref: 7.0s — varying sizes, some at slight angles, fills screen
// ===================================================================
export function drawS10(ctx: CanvasRenderingContext2D, frame: number) {
  const dur = 35;
  const t = Math.min(frame / dur, 1);
  const ease = quintOut(t);

  ctx.fillStyle = P.white;
  ctx.fillRect(0, 0, W, H);
  drawGrid(ctx, true, 32);

  ctx.textBaseline = "top";

  const rows: Array<{
    y: number; size: number; isOrange: boolean; dir: number; angle: number;
  }> = [
    { y: -40, size: 110, isOrange: false, dir: 1, angle: 0 },
    { y: 60, size: 130, isOrange: false, dir: -1, angle: -1 },
    { y: 170, size: 90, isOrange: false, dir: 1, angle: 0 },
    { y: 250, size: 150, isOrange: true, dir: -1, angle: 2 },
    { y: 380, size: 120, isOrange: false, dir: 1, angle: -1 },
    { y: 490, size: 100, isOrange: false, dir: -1, angle: 0 },
    { y: 580, size: 140, isOrange: false, dir: 1, angle: 1 },
    { y: 700, size: 110, isOrange: false, dir: -1, angle: -2 },
    { y: 790, size: 130, isOrange: true, dir: 1, angle: 0 },
    { y: 900, size: 100, isOrange: false, dir: -1, angle: 1 },
    { y: 990, size: 120, isOrange: false, dir: 1, angle: 0 },
  ];

  for (const row of rows) {
    const xOff = (1 - ease) * 300 * row.dir;
    ctx.save();
    ctx.translate(xOff, row.y);
    ctx.rotate((row.angle * Math.PI) / 180);
    ctx.font = `900 ${row.size}px Inter, sans-serif`;
    ctx.fillStyle = row.isOrange ? P.orange : P.black;
    ctx.textAlign = "left";
    ctx.fillText("LAUNCH  LAUNCH  LAUNCH  LAUNCH  LAUNCH  LAUNCH", -100, 0);
    ctx.restore();
  }

  // INITIATE micro labels
  ctx.save();
  ctx.font = `600 18px "Courier New", monospace`;
  ctx.fillStyle = P.black;
  ctx.globalAlpha = 0.5;
  ctx.textAlign = "right";
  ctx.fillText("INITIATE", W - 30, 30);
  ctx.textAlign = "left";
  ctx.fillText("INITIATE", 30, H - 20);
  ctx.restore();
}

// ===================================================================
// S11: MEET THE NEW STANDARD (210-255f)
// Ref: 8.0s — LIGHTER font weight (~400), GLITCHY labels repeated,
// orange square, text fills width
// ===================================================================
export function drawS11(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.fillStyle = P.darkGray;
  ctx.fillRect(0, 0, W, H);
  drawGrid(ctx);

  ctx.textBaseline = "middle";

  // Kinetic typography: letters assemble from scattered positions
  // Ref 60fps: still assembling at 7.58s (local ~16), settled by ~7.92s (local ~27)
  const line1 = "MEET THE NEW";
  const line2 = "STANDARD"; // Ref 8.33s: D IS visible (not clipped)
  const fontSize = 180;
  ctx.font = `400 ${fontSize}px Inter, sans-serif`;

  // Slow zoom after settling (ref: 8.67s shows larger text)
  const zoomP = progress(frame, 28, 17, cubicOut);
  const zoomScale = lerp(1.0, 1.06, zoomP);

  // Measure final letter positions
  const finalY1 = H * 0.35;
  const finalY2 = H * 0.65;
  const startX1 = W * 0.02;
  const startX2 = W * 0.08;

  // Per-letter animation
  const allLetters: Array<{ ch: string; finalX: number; finalY: number }> = [];

  // Line 1
  ctx.textAlign = "left";
  let curX = startX1;
  for (const ch of line1) {
    const w = ctx.measureText(ch).width;
    allLetters.push({ ch, finalX: curX, finalY: finalY1 });
    curX += w;
  }
  // Line 2
  curX = startX2;
  for (const ch of line2) {
    const w = ctx.measureText(ch).width;
    allLetters.push({ ch, finalX: curX, finalY: finalY2 });
    curX += w;
  }

  // Apply zoom from center
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(zoomScale, zoomScale);
  ctx.translate(-W / 2, -H / 2);

  // Animate: scatter → assemble, slower to match ref timing
  for (let i = 0; i < allLetters.length; i++) {
    const { ch, finalX, finalY } = allLetters[i];
    const entryDelay = i * 0.8;
    const p = progress(frame, entryDelay, 16, cubicOut);

    // Scattered start positions (seeded random per letter)
    const scatterX = lerp(W * (0.1 + sr(i * 7 + 1) * 0.8), finalX, p);
    const scatterY = lerp(H * (0.1 + sr(i * 7 + 2) * 0.8), finalY, p);
    const rot = lerp((sr(i * 7 + 3) - 0.5) * 30, 0, p);
    const scale = lerp(0.4 + sr(i * 7 + 4) * 0.8, 1, p);
    const alpha = Math.min(1, p * 2);

    ctx.save();
    ctx.translate(scatterX, scatterY);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.font = `400 ${fontSize}px Inter, sans-serif`;
    ctx.fillStyle = P.white;
    ctx.globalAlpha = alpha;
    ctx.textAlign = "left";
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  }

  ctx.restore(); // end zoom transform

  // Labels fade in after letters settle (ref: visible by ~7.92s = local ~27)
  const labelAlpha = progress(frame, 22, 10, cubicOut) * 0.5;
  if (labelAlpha > 0.01) {
    ctx.save();
    ctx.font = `600 18px "Courier New", monospace`;
    ctx.fillStyle = P.white;
    ctx.globalAlpha = labelAlpha;
    ctx.textAlign = "left";
    ctx.fillText("GLITCHY", W * 0.08, H * 0.06);
    ctx.fillText("[SHIFT AI]", W * 0.35, H * 0.06);
    ctx.fillText("DEPLOY", W * 0.55, H * 0.06);
    ctx.fillText("GLITCHY", W * 0.55, H * 0.14);
    ctx.fillText("[SHIFT AI]", W * 0.7, H * 0.14);
    ctx.fillText("LAUNCH", W * 0.1, H * 0.78);
    ctx.fillText("GLITCHY", W * 0.3, H * 0.92);
    ctx.fillText("DEPLOY", W * 0.5, H * 0.92);
    ctx.fillText("[SHIFT AI]", W * 0.75, H * 0.92);
    ctx.restore();
  }

  // Orange square accent — top-left area (ref: visible from start)
  const sqAlpha = progress(frame, 0, 8, cubicOut);
  if (sqAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = sqAlpha;
    ctx.fillStyle = P.orange;
    ctx.fillRect(W * 0.05, H * 0.1, 20, 20);
    ctx.restore();
  }
}

// ===================================================================
// S12: RAW POWER on orange (255-300f)
// Ref: 9.0s — ENORMOUS text, clips at all edges, labels in middle
// ===================================================================
export function drawS12(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.fillStyle = P.orange;
  ctx.fillRect(0, 0, W, H);

  ctx.textBaseline = "middle";

  // Slam-in animation: text starts HUGE (heavy clipping), settles to moderate size
  // ref_0530: "AW"+"POW" only. ref_0550: "RAW"+"POWER" almost full.
  const p = progress(frame, 0, 18, quintOut);
  const scale = lerp(1.5, 1.0, p);

  // RAW — starts far left (only "AW" visible), settles with R ~70% visible
  const rawX = lerp(W * -0.38, W * -0.06, p);
  const rawY = H * 0.22;
  ctx.save();
  ctx.translate(rawX + 300 * scale, rawY);
  ctx.scale(scale, scale);
  ctx.font = "900 600px Inter, sans-serif";
  ctx.fillStyle = P.black;
  ctx.textAlign = "left";
  ctx.fillText("RAW", -300, 0);
  ctx.restore();

  // POWER — starts shifted (only "POW" visible), settles with R ~40% visible
  const powerX = lerp(W * -0.12, W * 0.08, p);
  const powerY = H * 0.78;
  ctx.save();
  ctx.translate(powerX + 300 * scale, powerY);
  ctx.scale(scale, scale);
  ctx.font = "900 600px Inter, sans-serif";
  ctx.fillStyle = P.black;
  ctx.textAlign = "left";
  ctx.fillText("POWER", -300, 0);
  ctx.restore();

  // Labels — 3 rows matching ref (12 labels total), stagger fade in
  ctx.font = `600 18px "Courier New", monospace`;
  const allLabels = [
    // Top row
    { text: "GENERATION", x: W * 0.04, y: H * 0.04, align: "left" as const, delay: 6 },
    { text: "GLITCHY", x: W * 0.30, y: H * 0.04, align: "left" as const, delay: 7 },
    { text: "[SHIFT AI]", x: W * 0.45, y: H * 0.04, align: "left" as const, delay: 8 },
    // Middle row
    { text: "[SHIFT AI]", x: W * 0.04, y: H * 0.48, align: "left" as const, delay: 8 },
    { text: "GLITCHY", x: W * 0.16, y: H * 0.48, align: "left" as const, delay: 9 },
    { text: "DEPLOY", x: W * 0.28, y: H * 0.48, align: "left" as const, delay: 10 },
    { text: "[SHIFT AI]", x: W * 0.65, y: H * 0.48, align: "left" as const, delay: 10 },
    { text: "LAUNCH", x: W * 0.80, y: H * 0.48, align: "left" as const, delay: 11 },
    // Bottom row
    { text: "[SHIFT AI]", x: W * 0.38, y: H * 0.96, align: "left" as const, delay: 12 },
    { text: "VERTEX", x: W * 0.58, y: H * 0.96, align: "left" as const, delay: 13 },
    { text: "GLITCHY", x: W * 0.88, y: H * 0.96, align: "left" as const, delay: 14 },
  ];
  for (const l of allLabels) {
    const lp = progress(frame, l.delay, 8, cubicOut);
    if (lp < 0.01) continue;
    ctx.save();
    ctx.globalAlpha = lp * 0.7;
    ctx.fillStyle = P.black;
    ctx.textAlign = l.align;
    ctx.fillText(l.text, l.x, l.y);
    ctx.restore();
  }
}
