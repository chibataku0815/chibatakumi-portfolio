export interface TemporalEchoSample {
  age: number;
  normalizedAge: number;
  opacity: number;
  sampleFrame: number;
}

export interface TemporalEchoOptions {
  frame: number;
  echoCount: number;
  echoStepFrames: number;
  decay: number;
}

export type MotionVariant = "curved" | "straight";

export interface EchoTrainMotionOptions {
  frame: number;
  stageWidth: number;
  stageHeight: number;
  startFrame: number;
  durationFrames: number;
  depthStart: number;
  depthEnd: number;
  perspective: number;
  waveAmplitude: number;
  waveFrequency: number;
  lateralWobble: number;
  variant: MotionVariant;
}

export interface EchoTrainState {
  rawProgress: number;
  motionProgress: number;
  x: number;
  y: number;
  z: number;
  scale: number;
  rotateZ: number;
  skewY: number;
}

export interface Point {
  x: number;
  y: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const mix = (start: number, end: number, progress: number) =>
  start + (end - start) * progress;

const motionEase = (value: number) => 1 - Math.pow(1 - value, 2.2);

export const getTemporalEchoSamples = ({
  frame,
  echoCount,
  echoStepFrames,
  decay,
}: TemporalEchoOptions): TemporalEchoSample[] => {
  const safeCount = Math.max(0, Math.floor(echoCount));
  const safeStep = Math.max(1, Math.floor(echoStepFrames));
  const safeDecay = clamp(decay, 0, 1);
  const samples: TemporalEchoSample[] = [];

  for (let age = safeCount; age >= 0; age -= 1) {
    const sampleFrame = Math.max(0, frame - age * safeStep);
    samples.push({
      age,
      normalizedAge: safeCount === 0 ? 0 : age / safeCount,
      opacity: age === 0 ? 1 : Math.pow(safeDecay, age),
      sampleFrame,
    });
  }

  return samples;
};

export const getEchoTrainState = ({
  frame,
  stageWidth,
  stageHeight,
  startFrame,
  durationFrames,
  depthStart,
  depthEnd,
  perspective,
  waveAmplitude,
  waveFrequency,
  lateralWobble,
  variant,
}: EchoTrainMotionOptions): EchoTrainState => {
  const safeDuration = Math.max(1, durationFrames);
  const rawProgress = clamp((frame - startFrame) / safeDuration, 0, 1);
  const motionProgress = motionEase(rawProgress);
  const xBase = mix(stageWidth * 0.16, stageWidth * 0.44, motionProgress);
  const yBase = mix(stageHeight * 0.7, stageHeight * 0.42, motionProgress);
  const curveX =
    variant === "curved"
      ? Math.sin(motionProgress * Math.PI * waveFrequency + 0.22) *
          lateralWobble +
        Math.sin(motionProgress * Math.PI * 2.6 - 0.35) *
          (lateralWobble * 0.2)
      : 0;
  const curveY =
    variant === "curved"
      ? Math.sin(motionProgress * Math.PI * 1.08 - 0.5) * waveAmplitude +
        Math.sin(motionProgress * Math.PI * 2.7) * (waveAmplitude * 0.16)
      : 0;
  const z = mix(depthStart, depthEnd, motionProgress);
  const perspectiveScale = perspective / Math.max(1, perspective + z);
  const scale = clamp(perspectiveScale, 0.3, 1.45);

  return {
    rawProgress,
    motionProgress,
    x: xBase + curveX,
    y: yBase + curveY,
    z,
    scale,
    rotateZ:
      variant === "curved"
        ? Math.sin(motionProgress * Math.PI * 1.15 - 0.42) * 9 +
          Math.cos(motionProgress * Math.PI * 2.1) * 2.5
        : mix(-5, 5, motionProgress),
    skewY:
      variant === "curved"
        ? Math.cos(motionProgress * Math.PI * 1.25) * 4
        : mix(3, -2, motionProgress),
  };
};

export const getGuidePath = (
  options: Omit<EchoTrainMotionOptions, "frame">,
  steps = 28,
) => {
  const points: Point[] = [];

  for (let index = 0; index <= steps; index += 1) {
    const progress = index / steps;
    const frame = options.startFrame + progress * options.durationFrames;
    const state = getEchoTrainState({
      ...options,
      frame,
    });

    points.push({
      x: state.x,
      y: state.y,
    });
  }

  return points;
};
