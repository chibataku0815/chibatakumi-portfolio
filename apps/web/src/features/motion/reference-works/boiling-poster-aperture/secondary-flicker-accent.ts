export type SecondaryFlickerAccentState = {
  opacity: number;
  offsetY: number;
  scaleX: number;
};

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function mix(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

export function secondaryFlickerAccent(
  progress: number,
  time: number,
): SecondaryFlickerAccentState {
  const gate = clamp01(progress);
  const flicker =
    0.7 +
    Math.sin(time * 0.0072) * 0.09 +
    Math.sin(time * 0.032) * 0.055 +
    Math.sin(time * 0.088) * 0.02;

  return {
    opacity: gate * flicker,
    offsetY: mix(12, 0, gate) + Math.sin(time * 0.0048) * 1.2 * gate,
    scaleX: mix(0.82, 1, gate),
  };
}
