import { boilingPosterApertureConfig } from "./boiling-poster-aperture.config";

export type DisplacementRevealState = {
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  blurStrength: number;
  mapScale: number;
};

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function mix(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

export function displacementReveal(
  revealBurst: number,
  time: number,
): DisplacementRevealState {
  const burst = clamp01(revealBurst);

  return {
    scaleX: mix(0, boilingPosterApertureConfig.displacement.maxScaleX, burst),
    scaleY: mix(0, boilingPosterApertureConfig.displacement.maxScaleY, burst),
    offsetX:
      (Math.sin(time * 0.0019) * 22 + Math.sin(time * 0.0052) * 8) * burst,
    offsetY:
      (Math.cos(time * 0.0015) * 16 + Math.sin(time * 0.0041) * 5) * burst,
    blurStrength: mix(0, 7.2, burst),
    mapScale: mix(0.96, 1.24, burst),
  };
}
