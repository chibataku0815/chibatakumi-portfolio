/**
 * Entity System — Canvas 2D Keyframe Interpolation
 *
 * Provides Entity and EntityKeyframe interfaces for declarative canvas animations.
 * Separates "what state" (interpolateEntity) from "how to draw" (renderEntity).
 */

import { lerp } from "./canvas-primitives";
import type { EasingFn } from "./canvas-easing";
import { FillDef, TextDef, renderFill, drawText } from "./isshin-primitives";

// ============================================================
// Interfaces
// ============================================================

export type { FillDef, TextDef };

export interface EntityKeyframe {
  frame: number;
  x: number;
  y: number;
  w: number;
  h: number;
  alpha?: number; // default 1.0
  easing?: EasingFn; // applied to segment ENDING at this keyframe (destination easing, AE convention)
}

export interface Entity {
  id: string;
  fill: FillDef;
  text?: TextDef | TextDef[]; // single or multiple text layers
  keyframes: EntityKeyframe[]; // must have >= 1, assumed sorted by frame ascending
}

export interface InterpolatedState {
  x: number;
  y: number;
  w: number;
  h: number;
  alpha: number;
}

// ============================================================
// interpolateEntity — keyframe interpolation with easing
// ============================================================

export function interpolateEntity(
  entity: Entity,
  frame: number
): InterpolatedState {
  const kfs = entity.keyframes;

  if (kfs.length === 0) {
    // Fallback (should not happen in practice)
    return { x: 0, y: 0, w: 0, h: 0, alpha: 1 };
  }

  if (kfs.length === 1) {
    // Single keyframe
    const kf = kfs[0];
    return {
      x: kf.x,
      y: kf.y,
      w: kf.w,
      h: kf.h,
      alpha: kf.alpha ?? 1,
    };
  }

  // Clamp before first keyframe
  if (frame <= kfs[0].frame) {
    const kf = kfs[0];
    return {
      x: kf.x,
      y: kf.y,
      w: kf.w,
      h: kf.h,
      alpha: kf.alpha ?? 1,
    };
  }

  // Clamp after last keyframe
  if (frame >= kfs[kfs.length - 1].frame) {
    const kf = kfs[kfs.length - 1];
    return {
      x: kf.x,
      y: kf.y,
      w: kf.w,
      h: kf.h,
      alpha: kf.alpha ?? 1,
    };
  }

  // Find active segment: kfs[i].frame <= frame < kfs[i+1].frame
  let i = 0;
  while (i < kfs.length - 1 && frame >= kfs[i + 1].frame) {
    i++;
  }

  const kf0 = kfs[i];
  const kf1 = kfs[i + 1];

  // Compute raw linear t in [0, 1]
  const t = (frame - kf0.frame) / (kf1.frame - kf0.frame);

  // Apply easing from destination keyframe (kf1)
  const easingFn = kf1.easing ?? ((x) => x); // default linear
  const easedT = easingFn(t);

  return {
    x: lerp(kf0.x, kf1.x, easedT),
    y: lerp(kf0.y, kf1.y, easedT),
    w: lerp(kf0.w, kf1.w, easedT),
    h: lerp(kf0.h, kf1.h, easedT),
    alpha: lerp(kf0.alpha ?? 1, kf1.alpha ?? 1, easedT),
  };
}

// ============================================================
// renderEntity — interpolate + draw
// ============================================================

export function renderEntity(
  ctx: CanvasRenderingContext2D,
  entity: Entity,
  frame: number,
  fontFamily: string
): void {
  const state = interpolateEntity(entity, frame);

  // Skip if invisible or vanishingly small
  if (state.alpha < 0.001 || state.w < 1 || state.h < 1) {
    return;
  }

  ctx.save();
  ctx.globalAlpha = state.alpha;

  // Render fill
  renderFill(ctx, entity.fill, state.x, state.y, state.w, state.h);

  // Render text (normalize to array)
  if (entity.text) {
    const texts = Array.isArray(entity.text) ? entity.text : [entity.text];
    for (const td of texts) {
      // Note: alpha is already applied via globalAlpha, so pass 1.0 here
      drawText(ctx, td, state.x, state.y, state.w, state.h, 1, fontFamily);
    }
  }

  ctx.restore();
}
