import type { TurbulencePass } from "../config";
import { TAU } from "./math";

const distortWithPass = ({
  u,
  v,
  time,
  pass,
  aspect,
}: {
  u: number;
  v: number;
  time: number;
  pass: TurbulencePass;
  aspect: number;
}) => {
  const normalizedSize = Math.max(0.24, pass.size / 100);
  const amplitude = pass.amount / 2200;
  const sampleX = (u + pass.flow.x * time) * aspect;
  const sampleY = v + pass.flow.y * time;
  let dx = 0;
  let dy = 0;

  for (let octave = 0; octave < Math.max(1, pass.complexity); octave += 1) {
    const weight = 1 / Math.pow(2, octave);
    const frequency = (1.2 + octave * 0.9) / normalizedSize;
    const phase = pass.seed + octave * 1.73;
    const drift = time * pass.evolutionSpeed * (0.8 + octave * 0.18);

    dx +=
      (Math.sin((sampleY * 1.7 + sampleX * 0.7) * frequency * TAU + drift + phase) +
        0.5 *
          Math.cos((sampleX * 1.2 - sampleY * 0.8) * frequency * TAU - drift * 1.2 + phase)) *
      weight;

    dy +=
      (Math.cos((sampleX * 1.6 - sampleY * 0.5) * frequency * TAU - drift * 0.9 + phase * 1.4) +
        0.55 *
          Math.sin((sampleX + sampleY * 1.1) * frequency * TAU + drift * 0.7 + phase * 0.6)) *
      weight;
  }

  return {
    u: u + dx * amplitude * 0.08 / aspect,
    v: v + dy * amplitude * 0.08,
  };
};

export const applyTurbulencePasses = ({
  u,
  v,
  time,
  passes,
  aspect,
}: {
  u: number;
  v: number;
  time: number;
  passes: readonly TurbulencePass[];
  aspect: number;
}) => {
  return passes.reduce(
    (point, pass) =>
      distortWithPass({
        u: point.u,
        v: point.v,
        time,
        pass,
        aspect,
      }),
    { u, v },
  );
};
