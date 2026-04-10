export type BoilFieldPoint = {
  x: number;
  y: number;
};

export type BoilFieldInput = {
  centerX: number;
  centerY: number;
  radius: number;
  amplitude: number;
  time: number;
  sampleCount?: number;
};

export function boilField({
  centerX,
  centerY,
  radius,
  amplitude,
  time,
  sampleCount = 56,
}: BoilFieldInput): BoilFieldPoint[] {
  const points: BoilFieldPoint[] = [];
  const wobbleTime = time * 0.001;

  for (let index = 0; index < sampleCount; index += 1) {
    const t = index / sampleCount;
    const angle = t * Math.PI * 2;
    const harmonic =
      Math.sin(angle * 3 + wobbleTime * 1.3) * 0.52 +
      Math.sin(angle * 7 - wobbleTime * 2.2) * 0.26 +
      Math.sin(angle * 13 + wobbleTime * 4.4) * 0.14;
    const offset =
      harmonic * amplitude +
      Math.sin(index * 1.7 + wobbleTime * 9) * amplitude * 0.08;
    const resolvedRadius = radius + offset;

    points.push({
      x: centerX + Math.cos(angle) * resolvedRadius,
      y: centerY + Math.sin(angle) * resolvedRadius,
    });
  }

  return points;
}
