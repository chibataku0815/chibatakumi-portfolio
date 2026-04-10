import { alphaMaskGate } from "./alpha-mask-gate";
import { boilingPosterApertureConfig } from "./boiling-poster-aperture.config";
import { displacementReveal } from "./displacement-reveal";
import { secondaryFlickerAccent } from "./secondary-flicker-accent";

type AccentState = ReturnType<typeof secondaryFlickerAccent>;

export type BoilingPosterApertureFrameState = {
  frame: number;
  time: number;
  progress: number;
  gate: ReturnType<typeof alphaMaskGate>;
  displacement: ReturnType<typeof displacementReveal>;
  edgeBoil: {
    warm: number;
    cool: number;
    tight: number;
  };
  accents: [AccentState, AccentState, AccentState];
  coverGlowAlpha: number;
  holdMix: number;
  posterShadowAlpha: number;
  backgroundShift: number;
};

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function mix(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function inverseLerp(value: number, start: number, end: number) {
  if (start === end) {
    return value >= end ? 1 : 0;
  }

  return clamp01((value - start) / (end - start));
}

function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3;
}

function easeOutSine(value: number) {
  return Math.sin((value * Math.PI) / 2);
}

export function getBoilingPosterAperturePayoffFrame() {
  return boilingPosterApertureConfig.payoffFrame;
}

export function evaluateBoilingPosterApertureFrame(
  frame: number,
): BoilingPosterApertureFrameState {
  const normalizedFrame =
    ((frame % boilingPosterApertureConfig.durationFrames) +
      boilingPosterApertureConfig.durationFrames) %
    boilingPosterApertureConfig.durationFrames;
  const time = (normalizedFrame / boilingPosterApertureConfig.fps) * 1000;
  const openPhase = inverseLerp(
    normalizedFrame,
    boilingPosterApertureConfig.reveal.startFrame,
    boilingPosterApertureConfig.reveal.fullFrame,
  );
  const progress = easeOutCubic(openPhase);
  const holdMix = easeOutSine(
    inverseLerp(
      normalizedFrame,
      boilingPosterApertureConfig.reveal.fullFrame,
      boilingPosterApertureConfig.reveal.settleFrame,
    ),
  );
  const accentOpen = easeOutSine(
    inverseLerp(
      normalizedFrame,
      boilingPosterApertureConfig.accent.startFrame,
      boilingPosterApertureConfig.accent.settleFrame,
    ),
  );
  const revealBurst = Math.sin(openPhase * Math.PI) * (1 - holdMix * 0.48);
  const gate = alphaMaskGate(progress);
  const displacement = displacementReveal(
    clamp01(progress * 0.58 + revealBurst * 0.74 + holdMix * 0.12),
    time,
  );
  const accentProgress = clamp01(accentOpen * (0.78 + holdMix * 0.18));

  return {
    frame: normalizedFrame,
    time,
    progress,
    gate,
    displacement,
    edgeBoil: {
      warm:
        mix(2.4, boilingPosterApertureConfig.boil.warmAmplitude, progress) +
        revealBurst * 3.4,
      cool:
        mix(1.4, boilingPosterApertureConfig.boil.coolAmplitude, progress) +
        revealBurst * 1.8,
      tight:
        mix(0.8, boilingPosterApertureConfig.boil.tightAmplitude, progress) +
        revealBurst * 1.2,
    },
    accents: [
      secondaryFlickerAccent(accentProgress, time),
      secondaryFlickerAccent(accentProgress * 0.94, time + 150),
      secondaryFlickerAccent(accentProgress * 0.9, time + 320),
    ],
    coverGlowAlpha: 0.04 + revealBurst * 0.18 + holdMix * 0.06,
    holdMix,
    posterShadowAlpha: 0.16 + progress * 0.22,
    backgroundShift:
      Math.sin(time * 0.0011) * (5 + progress * 4) +
      Math.cos(time * 0.00045) * (3 + holdMix * 2),
  };
}
