export type TextUnit = {
  id: string;
  index: number;
  text: string;
};

export type TextDelayedStackUnit = {
  blur: number;
  glow: number;
  opacity: number;
  reveal: number;
  translateY: number;
};

export type EmphasisTrackState = {
  emphasisAmount: number;
  handoffAmount: number;
  payoffAmount: number;
  pulseAmount: number;
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

function easeInOutCubic(value: number) {
  if (value < 0.5) {
    return 4 * value * value * value;
  }

  return 1 - ((-2 * value + 2) ** 3) / 2;
}

/**
 * Phrase を word unit 単位へ正規化し、staged emphasis family の最小入力列を作る。
 */
export function textUnitSplitter(source: string): TextUnit[] {
  return source
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((text, index) => ({
      id: `${index}-${text.toLowerCase()}`,
      index,
      text,
    }));
}

/**
 * Phrase 内の各 unit に対して delayed reveal / blur / glow を時間評価する。
 */
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

/**
 * 単一 emphasis から payoff への handoff を time-based track として評価する。
 */
export function emphasisTrack(progress: number): EmphasisTrackState {
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
