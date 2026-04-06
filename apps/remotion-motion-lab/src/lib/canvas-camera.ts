/**
 * Canvas Camera — 2D Camera Transform System
 *
 * Provides CameraTransform interface and generator functions for
 * simulating 3D camera movements in 2D Canvas:
 *   - Push-in / Pull-out (scale)
 *   - Parallax Drift (multi-layer offset)
 *   - Handheld Shake (summed sine waves)
 *
 * All functions are pure (no side effects, no allocation beyond return value).
 */
import { W, H } from "./canvas-primitives";
import type { EasingFn } from "./canvas-easing";

// ---------------------------------------------------------------------------
// Core Types
// ---------------------------------------------------------------------------
export interface CameraTransform {
  translateX: number;
  translateY: number;
  scale: number;
  rotation: number; // radians
}

export const CAMERA_IDENTITY: CameraTransform = {
  translateX: 0,
  translateY: 0,
  scale: 1,
  rotation: 0,
};

// ---------------------------------------------------------------------------
// Apply / Compose
// ---------------------------------------------------------------------------

/** Apply a CameraTransform to a canvas context (center-pivot). Call before drawing scene content. */
export function applyCameraTransform(
  ctx: CanvasRenderingContext2D,
  t: CameraTransform,
): void {
  ctx.translate(W / 2, H / 2);
  ctx.translate(t.translateX, t.translateY);
  ctx.rotate(t.rotation);
  ctx.scale(t.scale, t.scale);
  ctx.translate(-W / 2, -H / 2);
}

/** Additively compose two transforms (translation sums, scale multiplies, rotation sums). */
export function composeCameraTransforms(
  a: CameraTransform,
  b: CameraTransform,
): CameraTransform {
  return {
    translateX: a.translateX + b.translateX,
    translateY: a.translateY + b.translateY,
    scale: a.scale * b.scale,
    rotation: a.rotation + b.rotation,
  };
}

// ---------------------------------------------------------------------------
// Push-in / Pull-out
// ---------------------------------------------------------------------------
export interface PushInConfig {
  startFrame: number;
  duration: number;
  startScale: number;
  endScale: number;
  easing: EasingFn;
}

export function getPushIn(
  frame: number,
  config: PushInConfig,
): CameraTransform {
  const t = Math.max(
    0,
    Math.min(1, (frame - config.startFrame) / config.duration),
  );
  const easedT = config.easing(t);
  const scale =
    config.startScale + (config.endScale - config.startScale) * easedT;
  return { translateX: 0, translateY: 0, scale, rotation: 0 };
}

// ---------------------------------------------------------------------------
// Parallax Drift
// ---------------------------------------------------------------------------
export interface ParallaxConfig {
  startFrame: number;
  duration: number;
  travelX: number;
  travelY: number;
  easing: EasingFn;
}

/**
 * Returns a CameraTransform for a layer at a given depth.
 * depth < 1 = background (moves slower), depth > 1 = foreground (moves faster).
 * depth = 1 = midground (moves at travelX/travelY rate).
 */
export function getParallaxOffset(
  frame: number,
  depth: number,
  config: ParallaxConfig,
): CameraTransform {
  const t = Math.max(
    0,
    Math.min(1, (frame - config.startFrame) / config.duration),
  );
  const easedT = config.easing(t);
  return {
    translateX: -config.travelX * depth * easedT,
    translateY: -config.travelY * depth * easedT,
    scale: 1,
    rotation: 0,
  };
}

// ---------------------------------------------------------------------------
// Handheld Shake
// ---------------------------------------------------------------------------
export interface ShakeConfig {
  intensity: number;
  frequencies?: number[];
}

const DEFAULT_FREQUENCIES = [0.037, 0.047, 0.153, 0.197, 0.067];

/**
 * Procedural handheld camera shake using summed sine waves.
 * Uses irrational frequency ratios to avoid beating patterns.
 * NOT random — smooth, continuous, organic motion.
 */
export function getHandheldShake(
  frame: number,
  config: ShakeConfig,
): CameraTransform {
  const f = config.frequencies ?? DEFAULT_FREQUENCIES;
  const i = config.intensity;

  // Low frequency body sway
  const swayX = Math.sin(frame * f[0]) * 4 * i + Math.sin(frame * f[1]) * 3 * i;
  const swayY =
    Math.sin(frame * f[0] * 1.3) * 3 * i +
    Math.sin(frame * f[1] * 0.9) * 2 * i;

  // Medium frequency hand tremor
  const tremorX = Math.sin(frame * f[2]) * 1.5 * i + Math.sin(frame * f[3]) * 1 * i;
  const tremorY =
    Math.sin(frame * f[2] * 1.1) * 1 * i +
    Math.sin(frame * f[3] * 0.8) * 0.8 * i;

  // Subtle rotation
  const rotation = Math.sin(frame * f[4]) * 0.003 * i;

  return {
    translateX: swayX + tremorX,
    translateY: swayY + tremorY,
    scale: 1,
    rotation,
  };
}
