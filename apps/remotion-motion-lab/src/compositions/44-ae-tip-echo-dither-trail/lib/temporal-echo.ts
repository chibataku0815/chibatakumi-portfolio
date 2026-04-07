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

export const getTemporalEchoSamples = ({
  frame,
  echoCount,
  echoStepFrames,
  decay,
}: TemporalEchoOptions): TemporalEchoSample[] => {
  const safeCount = Math.max(0, Math.floor(echoCount));
  const safeStep = Math.max(1, Math.floor(echoStepFrames));
  const safeDecay = Math.max(0, Math.min(1, decay));
  const samples: TemporalEchoSample[] = [];

  for (let age = safeCount; age >= 0; age -= 1) {
    const opacity = age === 0 ? 1 : Math.pow(safeDecay, age);
    samples.push({
      age,
      normalizedAge: safeCount === 0 ? 0 : age / safeCount,
      opacity,
      sampleFrame: frame - age * safeStep,
    });
  }

  return samples;
};
