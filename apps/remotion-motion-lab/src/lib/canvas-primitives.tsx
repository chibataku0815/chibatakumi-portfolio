/**
 * Canvas 2D Motion Primitives — Shared Library
 *
 * Easing functions, utilities, and the CanvasScene wrapper extracted from
 * compositions #14 and #15. All new motion technique compositions (#16-#24)
 * import from this file.
 */
import React, { useCallback } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

export const W = 1920;
export const H = 1080;

// ---------------------------------------------------------------------------
// Easing functions (Robert Penner family)
// ---------------------------------------------------------------------------

/** Quintic ease-out — strong deceleration, general-purpose workhorse */
export function quintOut(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

/** Cubic ease-out — gentle deceleration for labels and fades */
export function cubicOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Exponential ease-out — "The AE Punch", 90% in first 20% of duration */
export function expOut(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/** Back ease-out — overshoot then settle. s controls overshoot magnitude */
export function backOut(t: number, s = 1.7): number {
  return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/** Linear interpolation with clamping */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/** Frame-based progress with easing. Returns 0..1 */
export function progress(
  frame: number,
  start: number,
  duration: number,
  easing: (t: number) => number = quintOut,
): number {
  const t = Math.max(0, Math.min(1, (frame - start) / duration));
  return easing(t);
}

/** Deterministic pseudo-random (seeded). Returns 0..1 */
export function sr(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

// ---------------------------------------------------------------------------
// Shared visual helpers
// ---------------------------------------------------------------------------

/** Draw a subtle grid overlay */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  light = false,
  cell = 48,
) {
  ctx.strokeStyle = light
    ? "rgba(0,0,0,0.06)"
    : "rgba(255,255,255,0.08)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = 0; x <= W; x += cell) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  for (let y = 0; y <= H; y += cell) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();
}

/** Draw ambient dust particles (brand guardrail: 3-5 particles, warmWhite 5-10%) */
export function drawDust(
  ctx: CanvasRenderingContext2D,
  frame: number,
  count = 4,
  color = "rgba(255,251,235,0.07)",
) {
  for (let i = 0; i < count; i++) {
    const baseX = sr(i * 7 + 1) * W;
    const baseY = sr(i * 7 + 2) * H;
    const drift = 0.3; // px/frame
    const x = (baseX + frame * drift * (sr(i * 7 + 3) - 0.3)) % W;
    const y = (baseY + frame * drift * 0.5 * (sr(i * 7 + 4) - 0.5)) % H;
    const size = 1 + sr(i * 7 + 5) * 2.5;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/** Draw subtle vignette (radial gradient, center transparent → edge 10% black) */
export function drawVignette(ctx: CanvasRenderingContext2D, strength = 0.10) {
  const gradient = ctx.createRadialGradient(
    W / 2, H / 2, W * 0.3,
    W / 2, H / 2, W * 0.75,
  );
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
}

// ---------------------------------------------------------------------------
// CanvasScene wrapper component
// ---------------------------------------------------------------------------
export interface CanvasSceneProps {
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
