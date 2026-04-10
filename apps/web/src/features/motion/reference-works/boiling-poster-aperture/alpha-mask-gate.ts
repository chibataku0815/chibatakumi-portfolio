import { boilingPosterApertureConfig } from "./boiling-poster-aperture.config";

export type AlphaMaskGateState = {
  radius: number;
  feather: number;
  rimAlpha: number;
  overlayAlpha: number;
  shadowAlpha: number;
  offsetX: number;
  offsetY: number;
};

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function mix(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

export function alphaMaskGate(progress: number): AlphaMaskGateState {
  const open = clamp01(progress);
  const settle = clamp01((open - 0.56) / 0.44);
  const radius = mix(
    boilingPosterApertureConfig.gate.startRadius,
    boilingPosterApertureConfig.gate.endRadius,
    open,
  );
  const drag = 1 - settle;

  return {
    radius,
    feather: mix(22, 70, open),
    rimAlpha: mix(0.94, 0.2, settle),
    overlayAlpha: mix(0.64, 0.11, settle),
    shadowAlpha: mix(0.54, 0.14, settle),
    offsetX: -14 * drag + Math.sin(open * Math.PI * 1.15) * 8 * drag,
    offsetY: 12 * drag - Math.sin(open * Math.PI) * 6 * drag,
  };
}
