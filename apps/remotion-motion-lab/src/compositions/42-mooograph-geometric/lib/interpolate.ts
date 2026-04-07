/**
 * MOOOGRAPH Geometric — Keyframe Interpolation
 *
 * Extended interpolation supporting scale, rotation, alpha for
 * the MOOOGRAPH shape system. Uses easing functions from canvas-easing.ts.
 */
import { EASINGS, type EasingFn } from "../../../lib/canvas-easing";
import type { ShapeDef } from "../config";
import { config } from "../config";

export interface ShapeAnimState {
  x: number;
  y: number;
  w: number;
  h: number;
  scale: number;
  rotation: number;
  alpha: number;
  visible: boolean;
}

/**
 * Calculate the animation state for a shape at a given frame.
 *
 * Three phases:
 *   1. Enter: shape scales/fades in over `enterDuration` frames
 *   2. Hold: fully visible, static
 *   3. Exit: shape scales/fades out over `exitDuration` frames
 */
export function interpolateShape(
  shape: ShapeDef,
  frame: number,
): ShapeAnimState {
  const { enterFrame, exitFrame, enterEasing, exitEasing } = shape;
  const enterEnd = enterFrame + config.enterDuration;
  const exitStart = exitFrame - config.exitDuration;

  // Not yet visible
  if (frame < enterFrame) {
    return {
      x: shape.x,
      y: shape.y,
      w: shape.w,
      h: shape.h,
      scale: 0,
      rotation: shape.rotation ?? 0,
      alpha: 0,
      visible: false,
    };
  }

  // Already exited
  if (frame > exitFrame) {
    return {
      x: shape.x,
      y: shape.y,
      w: shape.w,
      h: shape.h,
      scale: 0,
      rotation: shape.rotation ?? 0,
      alpha: 0,
      visible: false,
    };
  }

  const enterEase: EasingFn = EASINGS[enterEasing] ?? EASINGS.quintOut;
  const exitEase: EasingFn = EASINGS[exitEasing] ?? EASINGS.cubicIn;

  // Slide and scale parameters (backward-compatible defaults)
  const scaleFrom = shape.scaleFrom ?? 0;
  const enterOffsetX = shape.enterOffsetX ?? 0;
  const enterOffsetY = shape.enterOffsetY ?? 0;
  const exitOffsetX = shape.exitOffsetX ?? 0;
  const exitOffsetY = shape.exitOffsetY ?? 0;
  const enterAlphaMin = shape.enterAlphaMin ?? 0;

  // Enter phase
  if (frame < enterEnd) {
    const rawT = (frame - enterFrame) / config.enterDuration;
    const t = enterEase(Math.max(0, Math.min(1, rawT)));
    return {
      x: shape.x + enterOffsetX * (1 - t),
      y: shape.y + enterOffsetY * (1 - t),
      w: shape.w,
      h: shape.h,
      scale: scaleFrom + (1 - scaleFrom) * t,
      rotation: (shape.rotation ?? 0) * t,
      alpha: Math.max(enterAlphaMin, t),
      visible: true,
    };
  }

  // Exit phase
  if (frame >= exitStart) {
    const rawT = (frame - exitStart) / config.exitDuration;
    const t = exitEase(Math.max(0, Math.min(1, rawT)));
    return {
      x: shape.x + exitOffsetX * t,
      y: shape.y + exitOffsetY * t,
      w: shape.w,
      h: shape.h,
      scale: 1 - (1 - scaleFrom) * t,
      rotation: (shape.rotation ?? 0) * (1 - t),
      alpha: Math.max(enterAlphaMin, 1 - t),
      visible: true,
    };
  }

  // Hold phase — fully visible
  return {
    x: shape.x,
    y: shape.y,
    w: shape.w,
    h: shape.h,
    scale: 1,
    rotation: shape.rotation ?? 0,
    alpha: 1,
    visible: true,
  };
}
