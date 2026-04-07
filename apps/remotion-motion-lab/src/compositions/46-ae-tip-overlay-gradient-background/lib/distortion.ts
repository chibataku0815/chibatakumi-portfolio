export type DistortionInput = {
  readonly x: number;
  readonly y: number;
  readonly time: number;
  readonly amount: number;
  readonly size: number;
  readonly evolutionSpeed: number;
  readonly layerIndex: number;
  readonly phase: number;
  readonly aspect: number;
};

export const distortPoint = ({
  x,
  y,
  time,
  amount,
  size,
  evolutionSpeed,
  layerIndex,
  phase,
  aspect,
}: DistortionInput) => {
  const t = time * evolutionSpeed;
  const normalizedSize = Math.max(0.45, size / 100);
  const baseFreq = 2.2 / normalizedSize;
  const secondaryFreq = 3.8 / normalizedSize;
  const tertiaryFreq = 5.2 / normalizedSize;
  const amplitude = amount / 1400;
  const px = x * aspect;
  const py = y;
  const layerPhase = layerIndex * 1.173 + phase;

  const dx =
    (Math.sin(py * baseFreq * 2.6 + t * 1.4 + layerPhase) +
      0.55 * Math.sin((px + py) * secondaryFreq * 1.7 - t * 0.9 + layerPhase * 0.7) +
      0.25 * Math.cos((px - py) * tertiaryFreq * 1.2 + t * 0.45 + layerPhase * 1.6)) *
    amplitude;

  const dy =
    (Math.cos(px * baseFreq * 2.1 - t * 1.1 + layerPhase * 1.2) +
      0.45 * Math.sin((px - py) * secondaryFreq * 1.5 + t * 0.7 + layerPhase * 0.3) +
      0.3 * Math.cos((px + py) * tertiaryFreq + t * 0.5 + layerPhase)) *
    amplitude;

  return {
    x: x + dx / aspect,
    y: y + dy,
  };
};
