type TimeOffsetStackOptions = {
  sampleCount: number;
  baseFrameStep: number;
  taper: number;
};

export type TimeOffsetStackItem = {
  index: number;
  frameOffset: number;
  decay: number;
};

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

/**
 * Work 06 専用の time-offset stack。
 * 離散サンプルの順序だけを決め、shared trail runtime には広げない。
 */
export function timeOffsetStack({
  sampleCount,
  baseFrameStep,
  taper,
}: TimeOffsetStackOptions): TimeOffsetStackItem[] {
  if (!Number.isInteger(sampleCount) || sampleCount < 1) {
    throw new Error(
      `timeOffsetStack() expected a positive integer sampleCount, received "${sampleCount}".`,
    );
  }

  if (!Number.isFinite(baseFrameStep) || baseFrameStep <= 0) {
    throw new Error(
      `timeOffsetStack() expected baseFrameStep to be greater than 0, received "${baseFrameStep}".`,
    );
  }

  if (!Number.isFinite(taper) || taper < 1) {
    throw new Error(
      `timeOffsetStack() expected taper to be at least 1, received "${taper}".`,
    );
  }

  return Array.from({ length: sampleCount }, (_, index) => {
    const order = index + 1;
    const frameOffset = Math.round(baseFrameStep * order ** taper);
    const decay = clamp01(1 - index / (sampleCount + 0.35));

    return {
      index,
      frameOffset,
      decay,
    };
  });
}
