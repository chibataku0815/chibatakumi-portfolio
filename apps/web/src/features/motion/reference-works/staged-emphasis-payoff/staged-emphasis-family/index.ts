export type TextUnit = {
  id: string;
  index: number;
  isGap: boolean;
  clusterIndex: number;
  text: string;
  wordIndex: number;
};

export type TextDelayedStackUnit = {
  blur: number;
  opacity: number;
  presence: number;
  reveal: number;
  release: number;
  scale: number;
  settle: number;
  translateX: number;
  translateY: number;
};

export type EmphasisTrackState = {
  emphasisAmount: number;
  handoffAmount: number;
  payoffAmount: number;
  releaseAmount: number;
};

export type TextDelayedStackOptions = {
  entryDuration?: number;
  entryStart?: number;
  entryStep?: number;
  releaseDuration?: number;
  releaseOrder?: readonly number[];
  releaseStart?: number;
  releaseStep?: number;
};

export type EmphasisTrackOptions = {
  emphasisEnd?: number;
  emphasisStart?: number;
  handoffEnd?: number;
  handoffStart?: number;
  payoffEnd?: number;
  payoffStart?: number;
  releaseEnd?: number;
  releaseStart?: number;
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

function easeInCubic(value: number) {
  return value ** 3;
}

function easeInOutCubic(value: number) {
  if (value < 0.5) {
    return 4 * value * value * value;
  }

  return 1 - ((-2 * value + 2) ** 3) / 2;
}

function segmentText(source: string) {
  const normalized = source.trim().replace(/\s+/g, " ");

  if (!normalized) {
    return [];
  }

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    });

    return Array.from(segmenter.segment(normalized), ({ segment }) => segment);
  }

  return Array.from(normalized);
}

/**
 * Phrase を grapheme unit へ正規化し、gap を保持した staged emphasis family の入力列を作る。
 */
export function textUnitSplitter(source: string): TextUnit[] {
  let clusterIndex = 0;
  let wordIndex = 0;
  let startsNewWord = false;

  return segmentText(source).map((text, index) => {
    const isGap = /\s/.test(text);

    if (isGap) {
      startsNewWord = true;

      return {
        id: `${index}-gap`,
        index,
        isGap: true,
        clusterIndex: -1,
        text,
        wordIndex,
      };
    }

    if (startsNewWord && clusterIndex > 0) {
      wordIndex += 1;
    }

    startsNewWord = false;

    const normalizedText =
      text.toLowerCase().replace(/[^a-z0-9]+/g, "") || "glyph";

    return {
      id: `${index}-${normalizedText}`,
      index,
      isGap: false,
      clusterIndex: clusterIndex++,
      text,
      wordIndex,
    };
  });
}

/**
 * Phrase 内の各 unit に対して delayed reveal / settle / release を時間評価する。
 */
export function textDelayedStack(
  progress: number,
  units: readonly Pick<TextUnit, "clusterIndex" | "isGap" | "wordIndex">[],
  options: TextDelayedStackOptions = {},
): TextDelayedStackUnit[] {
  const visibleUnitCount = units.filter((unit) => !unit.isGap).length;
  const entryStart = options.entryStart ?? 0.04;
  const entryStep = options.entryStep ?? 0.034;
  const entryDuration = options.entryDuration ?? 0.17;
  const releaseStart = options.releaseStart ?? 0.72;
  const releaseStep = options.releaseStep ?? 0.022;
  const releaseDuration = options.releaseDuration ?? 0.18;
  const releaseRankMap = new Map<number, number>();
  const globalRelease = easeInCubic(mapRange(progress, releaseStart + 0.12, 1));

  (options.releaseOrder ?? []).forEach((clusterIndex, rank) => {
    releaseRankMap.set(clusterIndex, rank);
  });

  const defaultReleaseRank = (clusterIndex: number) => {
    const center = (visibleUnitCount - 1) / 2;
    const distanceFromCenter = Math.abs(clusterIndex - center);

    return distanceFromCenter + clusterIndex * 0.001;
  };

  return units.map((unit) => {
    if (unit.isGap) {
      const reveal = easeOutCubic(mapRange(progress, entryStart + 0.22, 0.58));
      const release = easeInCubic(
        mapRange(progress, releaseStart + releaseStep * 3, 1),
      );
      const presence = reveal * (1 - release) * (1 - globalRelease);

      return {
        blur: 0,
        opacity: presence,
        presence,
        reveal,
        release,
        scale: 1,
        settle: presence,
        translateX: 0,
        translateY: 0,
      };
    }

    const start =
      entryStart + unit.clusterIndex * entryStep + unit.wordIndex * 0.03;
    const reveal = easeOutCubic(mapRange(progress, start, start + entryDuration));
    const settle = easeInOutCubic(
      mapRange(progress, start + entryDuration * 0.18, start + entryDuration + 0.08),
    );
    const releaseRank =
      releaseRankMap.get(unit.clusterIndex) ?? defaultReleaseRank(unit.clusterIndex);
    const release = easeInCubic(
      mapRange(
        progress,
        releaseStart + releaseRank * releaseStep,
        releaseStart + releaseRank * releaseStep + releaseDuration,
      ),
    );
    const presence = settle * (1 - release) * (1 - globalRelease);
    const entryDirection = unit.wordIndex === 0 ? -1 : 1;
    const shimmerDirection = unit.clusterIndex % 2 === 0 ? -1 : 1;

    return {
      blur: (1 - settle) * 10 + release * 2.4,
      opacity: clamp01(presence * 1.08),
      presence,
      reveal,
      release,
      scale: 0.95 + settle * 0.05 - release * 0.06,
      settle,
      translateX:
        entryDirection * (1 - reveal) * 14 + shimmerDirection * release * 5,
      translateY: (1 - settle) * 18 + release * 9,
    };
  });
}

/**
 * 単一 emphasis から payoff / release への handoff を time-based track として評価する。
 */
export function emphasisTrack(
  progress: number,
  options: EmphasisTrackOptions = {},
): EmphasisTrackState {
  const emphasisStart = options.emphasisStart ?? 0.32;
  const emphasisEnd = options.emphasisEnd ?? 0.56;
  const handoffStart = options.handoffStart ?? 0.46;
  const handoffEnd = options.handoffEnd ?? 0.68;
  const payoffStart = options.payoffStart ?? 0.54;
  const payoffEnd = options.payoffEnd ?? 0.78;
  const releaseStart = options.releaseStart ?? 0.72;
  const releaseEnd = options.releaseEnd ?? 1;
  const emphasisAttack = easeOutCubic(
    mapRange(progress, emphasisStart, emphasisEnd),
  );
  const handoffAmount = easeOutCubic(
    mapRange(progress, handoffStart, handoffEnd),
  );
  const releaseAmount = easeInOutCubic(
    mapRange(progress, releaseStart, releaseEnd),
  );
  const payoffAmount =
    easeOutCubic(mapRange(progress, payoffStart, payoffEnd)) *
    (1 - releaseAmount);
  const emphasisAmount = emphasisAttack * (1 - handoffAmount * 0.72);

  return {
    emphasisAmount,
    handoffAmount,
    payoffAmount,
    releaseAmount,
  };
}
