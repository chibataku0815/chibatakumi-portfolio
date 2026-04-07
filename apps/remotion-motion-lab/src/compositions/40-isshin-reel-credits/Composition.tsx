/**
 * Isshin Reel Credits — Composition #40
 *
 * 25.5-33.4s (7.9s, 395 frames @ 50fps) of isshin REEL 2024.
 *
 * Phase 1 (f0-100):   Assembly — left/right panels slide in
 * Phase 2 (f100-225): Year counter 2021→2024 + progress bar + timecode
 * Phase 3 (f225-300): Panel dispersal with staggered fly-out + rotation
 * Phase 4 (f300-395): 3D scatter — 28 pseudo-3D shapes in elliptical bowl
 */

import React, { useCallback } from "react";
import {
  CanvasScene,
  W,
  H,
  expOut,
  cubicOut,
  progress,
  sr,
} from "../../lib/canvas-primitives";
import {
  type FillDef,
  renderFill,
  drawText,
  type TextDef,
  roundRect,
  lerpColor,
} from "../../lib/isshin-primitives";
import { loadFont } from "@remotion/google-fonts/NotoSansJP";
import { config } from "./config";

const { fontFamily } = loadFont();

// ====================================================================
// Types
// ====================================================================

type ParticleShape = "cylinder" | "bar" | "triangle" | "circle" | "star";

interface Particle {
  idx: number;
  shape: ParticleShape;
  color: string;
  x3d: number;
  y3d: number;
  z3d: number;
  baseAngle: number;
  spreadFactor: number;
  size: number;
  rotSpeed: number;
}

// ====================================================================
// Constants
// ====================================================================

const { PI, cos, sin, floor, min, max, abs, sqrt } = Math;
const TWO_PI = PI * 2;

// ====================================================================
// 3D Projection
// ====================================================================

function project3D(
  x3d: number,
  y3d: number,
  z3d: number,
  fov: number = 800,
): { x2d: number; y2d: number; scale: number } {
  const perspective = fov / (fov + z3d);
  return {
    x2d: W / 2 + (x3d - W / 2) * perspective,
    y2d: H / 2 + (y3d - H / 2) * perspective,
    scale: perspective,
  };
}

// ====================================================================
// Particle definitions (28 total, deterministic via sr())
// ====================================================================

function buildParticles(): Particle[] {
  const particles: Particle[] = [];
  const defs: { range: [number, number]; shape: ParticleShape; color: string }[] = [
    { range: [0, 3], shape: "cylinder", color: "#E87878" },
    { range: [4, 6], shape: "bar", color: "#E87878" },
    { range: [7, 9], shape: "triangle", color: "#C8A850" },
    { range: [10, 12], shape: "bar", color: "#D73C4B" },
    { range: [13, 15], shape: "circle", color: "#D73C4B" },
    { range: [16, 18], shape: "cylinder", color: "#E8E8E8" },
    { range: [19, 19], shape: "star", color: "#FFFFFF" },
    { range: [20, 23], shape: "circle", color: "#3CB8AD" },
    { range: [24, 27], shape: "bar", color: "#F5F0E8" },
  ];

  for (const def of defs) {
    for (let i = def.range[0]; i <= def.range[1]; i++) {
      const seed = i * 7;
      particles.push({
        idx: i,
        shape: def.shape,
        color: def.color,
        x3d: 0,
        y3d: 0,
        z3d: -300 + sr(seed + 4) * 600,
        baseAngle: (i / 28) * TWO_PI + sr(seed + 1) * 0.3,
        spreadFactor: 0.3 + sr(seed + 2) * 0.7,
        size: 14 + sr(seed + 3) * 22,
        rotSpeed: (sr(seed + 5) - 0.5) * 0.03,
      });
    }
  }

  return particles;
}

const PARTICLES = buildParticles();

// ====================================================================
// Grain overlay
// ====================================================================

function drawGrain(
  ctx: CanvasRenderingContext2D,
  frame: number,
  grainSize: number,
): void {
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = config.grainAlpha / 255;
  for (let py = 0; py < H; py += grainSize) {
    for (let px = 0; px < W; px += grainSize) {
      ctx.fillStyle =
        sr(py * 0xffff + px + frame * 23) < 0.5 ? "#fff" : "#000";
      ctx.fillRect(px, py, grainSize, grainSize);
    }
  }
  ctx.restore();
}

// ====================================================================
// Background
// ====================================================================

function drawBackground(ctx: CanvasRenderingContext2D, frame: number): void {
  if (frame < config.dispersalStart) {
    ctx.fillStyle = config.bgTeal;
  } else {
    const t = progress(frame, config.dispersalStart, 170, expOut);
    ctx.fillStyle = lerpColor(config.bgTeal, config.bgCream, t);
  }
  ctx.fillRect(0, 0, W, H);
}

// ====================================================================
// Cream border (grows from f225, full at f300)
// ====================================================================

function drawCreamBorder(ctx: CanvasRenderingContext2D, frame: number): void {
  if (frame < config.dispersalStart) return;

  const growT = progress(frame, config.dispersalStart, 75, cubicOut);
  const thickness = growT * config.borderThickness;
  if (thickness < 0.5) return;

  ctx.fillStyle = config.bgCream;
  // top
  ctx.fillRect(0, 0, W, thickness);
  // bottom
  ctx.fillRect(0, H - thickness, W, thickness);
  // left
  ctx.fillRect(0, 0, thickness, H);
  // right
  ctx.fillRect(W - thickness, 0, thickness, H);

  // Re-fill interior with teal (blended towards cream) to keep center clean
  if (frame >= config.scatterStart) {
    const innerT = progress(frame, config.scatterStart, 95, cubicOut);
    ctx.fillStyle = lerpColor(config.bgTeal, config.bgTeal, 1 - innerT * 0.15);
    ctx.fillRect(thickness, thickness, W - thickness * 2, H - thickness * 2);
  }
}

// ====================================================================
// Left Panel
// ====================================================================

function drawLeftPanel(ctx: CanvasRenderingContext2D, frame: number): void {
  // Assembly: slide from left
  const assemblyT = progress(frame, 0, config.assemblyEnd, expOut);
  const startX = config.leftPanel.x - config.slideDistance;
  const assemblyX = startX + (config.leftPanel.x - startX) * assemblyT;

  // Dispersal: fly up-left with rotation
  const dispersalT = progress(
    frame,
    config.dispersalLeftStart,
    config.dispersalDuration,
    expOut,
  );
  const dOffX = dispersalT * -400;
  const dOffY = dispersalT * -200;
  const dRot = dispersalT * -0.15;

  const alpha = frame < config.dispersalStart
    ? assemblyT
    : max(0, 1 - dispersalT);
  if (alpha < 0.001) return;

  const px = assemblyX + dOffX;
  const py = config.leftPanel.y + dOffY;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Apply rotation around panel center
  if (abs(dRot) > 0.001) {
    const cx = px + config.leftPanel.w / 2;
    const cy = py + config.leftPanel.h / 2;
    ctx.translate(cx, cy);
    ctx.rotate(dRot);
    ctx.translate(-cx, -cy);
  }

  // Pink background
  const fill: FillDef = { type: "solid", color: config.leftBg };
  renderFill(ctx, fill, px, py, config.leftPanel.w, config.leftPanel.h);

  // Text: "isshin"
  ctx.fillStyle = config.leftTextColor;
  ctx.font = `${config.leftFontWeight} ${config.leftFontSize}px ${fontFamily}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("isshin", px + 24, py + 40);

  // Text: "REEL"
  ctx.fillText("REEL", px + 24, py + 120);

  // Year counter (f100+) or default year
  if (frame >= config.yearCounterStart) {
    drawYearCounter(ctx, frame, px + 24, py + 210);
  } else {
    ctx.fillText("2021", px + 24, py + 210);
  }

  ctx.restore();
}

// ====================================================================
// Year Counter (2021 → 2024, step-based with drop animation)
// ====================================================================

function drawYearCounter(
  ctx: CanvasRenderingContext2D,
  frame: number,
  x: number,
  y: number,
): void {
  const duration = config.yearCounterEnd - config.yearCounterStart;
  const rawT = max(0, min(1, (frame - config.yearCounterStart) / duration));
  const stepped = min(rawT * 4, 3.9999);
  const yearStep = floor(stepped);
  const displayYear = 2021 + min(3, yearStep);

  // Drop: each new year slides down from above
  const localFrac = stepped % 1;
  const dropOffset = -12 * (1 - cubicOut(localFrac));

  ctx.fillStyle = config.leftTextColor;
  ctx.font = `${config.leftFontWeight} ${config.leftFontSize}px ${fontFamily}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(String(displayYear), x, y + dropOffset);
}

// ====================================================================
// Right Panel (3 rows, staggered entry + independent dispersal)
// ====================================================================

function drawRightPanel(ctx: CanvasRenderingContext2D, frame: number): void {
  drawRow0(ctx, frame);
  drawRow1(ctx, frame);
  drawRow2(ctx, frame);
}

// --- Row 0: Gold accent + labels ----

function drawRow0(ctx: CanvasRenderingContext2D, frame: number): void {
  // Assembly: slide from right, stagger 0
  const assemblyT = progress(frame, 0, config.assemblyEnd, expOut);
  const startX = config.rightPanel.x + config.slideDistance;
  const baseX = startX + (config.rightPanel.x - startX) * assemblyT;

  // Dispersal: fly up
  const dT = progress(frame, config.dispersalRow0Start, config.dispersalDuration, expOut);
  const dOffY = dT * -300;
  const dRot = dT * 0.08;

  const alpha = frame < config.dispersalStart ? assemblyT : max(0, 1 - dT);
  if (alpha < 0.001) return;

  const rx = baseX;
  const ry = config.rightPanel.y + dOffY;

  ctx.save();
  ctx.globalAlpha = alpha;

  if (abs(dRot) > 0.001) {
    const cx = rx + config.rightPanel.w / 2;
    const cy = ry + config.row0H / 2;
    ctx.translate(cx, cy);
    ctx.rotate(dRot);
    ctx.translate(-cx, -cy);
  }

  // Gray base
  ctx.fillStyle = config.rightBg;
  ctx.fillRect(rx, ry, config.rightPanel.w, config.row0H);

  // Gold accent strip on left
  const goldFill: FillDef = { type: "solid", color: config.row0AccentBg };
  renderFill(ctx, goldFill, rx, ry, config.row0AccentW, config.row0H);

  // Labels
  ctx.fillStyle = config.row0TextColor;
  ctx.font = `400 ${config.row0FontSize}px ${fontFamily}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("video / motion design", rx + config.row0AccentW + 24, ry + config.row0H / 2 - 12);
  ctx.fillText("ismsx.jp@gmail.com", rx + config.rightPanel.w - 320, ry + config.row0H / 2 + 12);

  ctx.restore();
}

// --- Row 1: Red + music info ----

function drawRow1(ctx: CanvasRenderingContext2D, frame: number): void {
  // Assembly: slide from right, stagger 10
  const assemblyT = progress(frame, 10, config.assemblyEnd - 10, expOut);
  const startX = config.rightPanel.x + config.slideDistance;
  const baseX = startX + (config.rightPanel.x - startX) * assemblyT;

  // Dispersal: fly right
  const dT = progress(frame, config.dispersalRow1Start, config.dispersalDuration, expOut);
  const dOffX = dT * 400;
  const dRot = dT * 0.12;

  const alpha = frame < config.dispersalStart ? assemblyT : max(0, 1 - dT);
  if (alpha < 0.001) return;

  const rx = baseX + dOffX;
  const ry = config.rightPanel.y + config.row0H;

  ctx.save();
  ctx.globalAlpha = alpha;

  if (abs(dRot) > 0.001) {
    const cx = rx + config.rightPanel.w / 2;
    const cy = ry + config.row1H / 2;
    ctx.translate(cx, cy);
    ctx.rotate(dRot);
    ctx.translate(-cx, -cy);
  }

  // Red background
  const row1Fill: FillDef = { type: "solid", color: config.row1Bg };
  renderFill(ctx, row1Fill, rx, ry, config.rightPanel.w, config.row1H);

  // Music note + text
  ctx.fillStyle = config.row1TextColor;
  ctx.font = `700 26px ${fontFamily}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("\u266A", rx + 24, ry + config.row1H / 2);

  ctx.font = `400 ${config.row1FontSize}px ${fontFamily}`;
  ctx.fillText("Lolica Tonica - French Kiss", rx + 60, ry + config.row1H / 2);

  ctx.restore();
}

// --- Row 2: Progress bar + timecode ----

function drawRow2(ctx: CanvasRenderingContext2D, frame: number): void {
  // Assembly: slide from right, stagger 20
  const assemblyT = progress(frame, 20, config.assemblyEnd - 20, expOut);
  const startX = config.rightPanel.x + config.slideDistance;
  const baseX = startX + (config.rightPanel.x - startX) * assemblyT;

  // Dispersal: fly down-right
  const dT = progress(frame, config.dispersalRow2Start, config.dispersalDuration, expOut);
  const dOffX = dT * 200;
  const dOffY = dT * 300;
  const dRot = dT * -0.1;

  const alpha = frame < config.dispersalStart ? assemblyT : max(0, 1 - dT);
  if (alpha < 0.001) return;

  const rx = baseX + dOffX;
  const ry = config.rightPanel.y + config.row0H + config.row1H + dOffY;

  ctx.save();
  ctx.globalAlpha = alpha;

  if (abs(dRot) > 0.001) {
    const cx = rx + config.rightPanel.w / 2;
    const cy = ry + config.row2H / 2;
    ctx.translate(cx, cy);
    ctx.rotate(dRot);
    ctx.translate(-cx, -cy);
  }

  // Light gray background
  const row2Fill: FillDef = { type: "solid", color: config.row2Bg };
  renderFill(ctx, row2Fill, rx, ry, config.rightPanel.w, config.row2H);

  // "works" label
  ctx.fillStyle = "#666666";
  ctx.font = `400 14px ${fontFamily}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("works", rx + 24, ry + 12);

  // "2021 - 2024" text
  ctx.fillStyle = "#333333";
  ctx.font = `700 ${config.row2FontSize}px ${fontFamily}`;
  ctx.fillText("2021 - 2024", rx + 100, ry + 12);

  // Progress bar track
  const barX = rx + 24;
  const barY = ry + 50;
  const barW = config.rightPanel.w - 48;
  const barH = 14;
  ctx.fillStyle = config.progressTrackColor;
  roundRect(ctx, barX, barY, barW, barH, 7);
  ctx.fill();

  // Progress bar fill (animated f100-225)
  const pT = progress(frame, config.yearCounterStart, config.yearCounterEnd - config.yearCounterStart, cubicOut);
  const fillW = max(0, barW * pT);
  if (fillW > 1) {
    ctx.fillStyle = config.progressBarColor;
    roundRect(ctx, barX, barY, fillW, barH, 7);
    ctx.fill();
  }

  // Timecode
  const totalSec = pT * 33.4;
  const mm = floor(totalSec / 60);
  const ss = floor(totalSec % 60);
  const ff = floor((totalSec % 1) * 100);
  const tc = `${mm}:${String(ss).padStart(2, "0")}:${String(ff).padStart(2, "0")}`;

  ctx.fillStyle = "#555555";
  ctx.font = `400 13px ${fontFamily}`;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText(`3840x2160 30fps / ${tc}`, rx + config.rightPanel.w - 24, ry + config.row2H - 28);

  ctx.restore();
}

// ====================================================================
// Ellipse boundary (f300+)
// ====================================================================

function drawEllipseBoundary(ctx: CanvasRenderingContext2D, frame: number): void {
  if (frame < config.scatterStart) return;

  const fadeT = progress(frame, config.scatterStart, 15, cubicOut);
  const alpha = fadeT * 0.6;
  if (alpha < 0.001) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = config.bgTeal;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(config.ellipseCx, config.ellipseCy, config.ellipseRx, config.ellipseRy, 0, 0, TWO_PI);
  ctx.stroke();
  ctx.restore();
}

// ====================================================================
// Shape drawing helpers
// ====================================================================

function drawCylinder(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
): void {
  const capH = h * 0.18;

  // Shadow of body
  ctx.fillStyle = darken(color, 0.2);
  ctx.fillRect(-w / 2, -h / 2 + capH, w, h - capH * 2);

  // Body
  ctx.fillStyle = color;
  ctx.fillRect(-w / 2 + 1, -h / 2 + capH, w - 2, h - capH * 2);

  // Bottom cap (darker)
  ctx.fillStyle = darken(color, 0.15);
  ctx.beginPath();
  ctx.ellipse(0, h / 2 - capH, w / 2, capH, 0, 0, TWO_PI);
  ctx.fill();

  // Top cap (lighter)
  ctx.fillStyle = lighten(color, 0.2);
  ctx.beginPath();
  ctx.ellipse(0, -h / 2 + capH, w / 2, capH, 0, 0, TWO_PI);
  ctx.fill();
}

function drawBar(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
): void {
  const r = min(w, h) / 2;
  ctx.fillStyle = color;
  roundRect(ctx, -w / 2, -h / 2, w, h, r);
  ctx.fill();

  // Highlight edge
  ctx.fillStyle = lighten(color, 0.15);
  roundRect(ctx, -w / 2 + 1, -h / 2 + 1, w - 2, h * 0.35, r);
  ctx.fill();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  radius: number,
  color: string,
): void {
  const points = 6;
  const inner = radius * 0.45;

  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * PI) / points - PI / 2;
    const r = i % 2 === 0 ? radius : inner;
    const px = cos(angle) * r;
    const py = sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Subtle outline
  ctx.strokeStyle = darken(color, 0.1);
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawTriangleShape(
  ctx: CanvasRenderingContext2D,
  size: number,
  color: string,
): void {
  const h = size * 0.866; // equilateral height

  // Front face
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.6);
  ctx.lineTo(-size / 2, h * 0.4);
  ctx.lineTo(size / 2, h * 0.4);
  ctx.closePath();
  ctx.fill();

  // Right side face (darker for 3D)
  ctx.fillStyle = darken(color, 0.25);
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.6);
  ctx.lineTo(size / 2, h * 0.4);
  ctx.lineTo(size * 0.35, h * 0.5);
  ctx.lineTo(-size * 0.05, -h * 0.45);
  ctx.closePath();
  ctx.fill();
}

function drawCircleShape(
  ctx: CanvasRenderingContext2D,
  radius: number,
  color: string,
): void {
  // Drop shadow
  ctx.fillStyle = "rgba(0,0,0,0.1)";
  ctx.beginPath();
  ctx.arc(2, 3, radius, 0, TWO_PI);
  ctx.fill();

  // Main circle
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TWO_PI);
  ctx.fill();

  // Highlight
  ctx.fillStyle = lighten(color, 0.25);
  ctx.beginPath();
  ctx.arc(-radius * 0.25, -radius * 0.25, radius * 0.4, 0, TWO_PI);
  ctx.fill();
}

// ====================================================================
// Color utilities
// ====================================================================

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => max(0, min(255, Math.round(v)));
  return `#${clamp(r).toString(16).padStart(2, "0")}${clamp(g).toString(16).padStart(2, "0")}${clamp(b).toString(16).padStart(2, "0")}`;
}

function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = 1 - amount;
  return rgbToHex(r * f, g * f, b * f);
}

function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount,
  );
}

// ====================================================================
// 3D Scatter Particles (f300-395)
// ====================================================================

function drawScatterParticles(
  ctx: CanvasRenderingContext2D,
  frame: number,
): void {
  if (frame < config.scatterStart) return;

  const scatterT = progress(frame, config.scatterStart, 95, cubicOut);

  // Build projected positions for z-sorting
  const projected: {
    p: Particle;
    x2d: number;
    y2d: number;
    scale: number;
    alpha: number;
    rotZ: number;
  }[] = [];

  for (const p of PARTICLES) {
    // Staggered appear
    const alpha = progress(frame, config.scatterStart + p.idx * 0.5, 15, cubicOut);
    if (alpha < 0.001) continue;

    // Position: expand from center along elliptical angle
    const angle = p.baseAngle;
    const effectiveX = config.ellipseCx + cos(angle) * config.ellipseRx * scatterT * p.spreadFactor;
    const effectiveY = config.ellipseCy + sin(angle) * config.ellipseRy * scatterT * p.spreadFactor;

    // Float bob
    const yBob = sin(frame * 0.05 + sr(p.idx * 7 + 6) * TWO_PI) * 8;

    const z = p.z3d;
    const { x2d, y2d, scale } = project3D(effectiveX, effectiveY + yBob, z);

    const rotZ = sr(p.idx * 7 + 5) * TWO_PI + frame * p.rotSpeed;

    projected.push({ p, x2d, y2d, scale, alpha, rotZ });
  }

  // Z-sort: back-to-front (largest z = farthest = draw first)
  projected.sort((a, b) => b.p.z3d - a.p.z3d);

  for (const item of projected) {
    const { p, x2d, y2d, scale, alpha, rotZ } = item;
    const sz = p.size * scale;

    ctx.save();
    ctx.globalAlpha = alpha * max(0.3, scale);
    ctx.translate(x2d, y2d);
    ctx.rotate(rotZ);
    ctx.scale(scale, scale);

    // Drop shadow
    const shadowOff = 2 + (1 - scale) * 4;
    ctx.save();
    ctx.translate(shadowOff, shadowOff);
    ctx.globalAlpha = 0.08 + (1 - scale) * 0.06;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(0, 0, sz * 0.6, 0, TWO_PI);
    ctx.fill();
    ctx.restore();

    // Draw shape
    switch (p.shape) {
      case "cylinder":
        drawCylinder(ctx, sz * 0.6, sz * 1.4, p.color);
        break;
      case "bar":
        drawBar(ctx, sz * 2.2, sz * 0.45, p.color);
        break;
      case "star":
        drawStar(ctx, sz * 0.9, p.color);
        break;
      case "triangle":
        drawTriangleShape(ctx, sz * 1.1, p.color);
        break;
      case "circle":
        drawCircleShape(ctx, sz * 0.55, p.color);
        break;
    }

    ctx.restore();
  }
}

// ====================================================================
// Main draw function
// ====================================================================

const draw = (ctx: CanvasRenderingContext2D, frame: number): void => {
  // 1. Background
  drawBackground(ctx, frame);

  // 2. Cream border (f225+)
  drawCreamBorder(ctx, frame);

  // 3. Left panel (assembly + dispersal)
  drawLeftPanel(ctx, frame);

  // 4. Right panel rows (assembly + dispersal)
  drawRightPanel(ctx, frame);

  // 5. Ellipse boundary (f300+)
  drawEllipseBoundary(ctx, frame);

  // 6. 3D scatter particles (f300-395)
  drawScatterParticles(ctx, frame);

  // 7. Grain overlay
  drawGrain(ctx, frame, config.grainSize);
};

// ====================================================================
// Component export
// ====================================================================

export const IsshinReelCredits: React.FC = () => {
  const stableDraw = useCallback(draw, []);
  return <CanvasScene draw={stableDraw} />;
};
