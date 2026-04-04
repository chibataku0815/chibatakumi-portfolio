/**
 * Filmtone transition helpers
 *
 * CD guardrail:
 * - 登場: 0.6-1.0s ease-out fade-in
 * - 退場: 0.4-0.8s ease-in fade-out
 * - opacity が transform より 0.1s 先行
 * - 全体的に一般テック動画より 20-30% 遅い
 */
import { interpolate, Easing } from "remotion";

/** Fade in with Filmtone timing (0.8s default, ease-out) */
export function filmtoneFadeIn(
  frame: number,
  startFrame: number,
  fps: number,
  durationSec = 0.8,
): number {
  return interpolate(frame, [startFrame, startFrame + fps * durationSec], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
}

/** Fade out with Filmtone timing (0.6s default, ease-in) */
export function filmtoneFadeOut(
  frame: number,
  startFrame: number,
  fps: number,
  durationSec = 0.6,
): number {
  return interpolate(frame, [startFrame, startFrame + fps * durationSec], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
}

/** Blur→Unblur reveal (Cut 1,3,7 in launch video) */
export function blurReveal(
  frame: number,
  startFrame: number,
  fps: number,
  durationSec = 0.5,
): number {
  return interpolate(frame, [startFrame, startFrame + fps * durationSec], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
}
