type TextDelayedStackUnit = {
  blur: number;
  glow: number;
  opacity: number;
  reveal: number;
  translateY: number;
};

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

export function textDelayedStack(
  progress: number,
  unitCount: number,
): TextDelayedStackUnit[] {
  return Array.from({ length: unitCount }, (_, index) => {
    const start = 0.12 + index * 0.11;
    const reveal = easeOutCubic(mapRange(progress, start, start + 0.22));

    return {
      blur: 20 - reveal * 20,
      glow: 0.18 + reveal * 0.82,
      opacity: 0.1 + reveal * 0.9,
      reveal,
      translateY: 34 - reveal * 34,
    };
  });
}
