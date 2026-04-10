function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function mapRange(value: number, start: number, end: number) {
  if (end <= start) {
    return 0;
  }

  return clamp01((value - start) / (end - start));
}

function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3;
}

function easeInOutCubic(value: number) {
  if (value < 0.5) {
    return 4 * value * value * value;
  }

  return 1 - ((-2 * value + 2) ** 3) / 2;
}

export function emphasisTrack(progress: number) {
  const attack = easeOutCubic(mapRange(progress, 0.5, 0.68));
  const release = easeInOutCubic(mapRange(progress, 0.72, 0.88));
  const emphasisAmount = attack * (1 - release);

  return {
    emphasisAmount,
    handoffAmount: easeOutCubic(mapRange(progress, 0.68, 0.9)),
    payoffAmount: easeOutCubic(mapRange(progress, 0.82, 1)),
    pulseAmount: Math.sin(emphasisAmount * Math.PI),
  };
}
