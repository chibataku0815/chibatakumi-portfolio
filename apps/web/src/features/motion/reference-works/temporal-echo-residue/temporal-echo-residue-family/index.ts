export type TemporalEchoPose = {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  stretchX: number;
  stretchY: number;
  speed: number;
};

export type TimeOffsetStackItem = {
  index: number;
  frameOffset: number;
  decay: number;
};

export type TemporalEchoSample = {
  index: number;
  frameOffset: number;
  decay: number;
  pose: TemporalEchoPose;
  distanceFromLead: number;
  distanceFromPrevious: number;
};

export type TemporalEchoResidueEcho = TemporalEchoPose & {
  alpha: number;
  frameOffset: number;
  decay: number;
  index: number;
};

type TimeOffsetStackOptions = {
  sampleCount: number;
  baseFrameStep: number;
  taper: number;
};

type TemporalEchoSamplesOptions = {
  frame: number;
  leadPose: TemporalEchoPose;
  stack: TimeOffsetStackItem[];
  evaluatePose: (frame: number) => TemporalEchoPose;
};

type AlphaResidueGateOptions = {
  sampleIndex: number;
  sampleCount: number;
  decay: number;
  leadSpeed: number;
  distanceFromLead: number;
  distanceFromPrevious: number;
  maxAlpha: number;
  minimumLeadSpeed: number;
  minimumLeadDistance: number;
  minimumSampleSpacing: number;
  idealSampleSpacing: number;
};

export type AlphaResidueGateResult = {
  alpha: number;
  visible: boolean;
};

type EvaluateTemporalEchoResidueEchoesOptions = {
  frame: number;
  leadPose: TemporalEchoPose;
  evaluatePose: (frame: number) => TemporalEchoPose;
  sampleCount: number;
  baseFrameStep: number;
  taper: number;
  maxAlpha: number;
  minimumLeadSpeed: number;
  minimumLeadDistance: number;
  minimumSampleSpacing: number;
  idealSampleSpacing: number;
};

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function distanceBetween(
  first: Pick<TemporalEchoPose, "x" | "y">,
  second: Pick<TemporalEchoPose, "x" | "y">,
) {
  return Math.hypot(first.x - second.x, first.y - second.y);
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

/**
 * 過去フレームを離散サンプルとして読む。
 * blur ではなく「どの時点の像を残すか」を見える形にするための local family helper。
 */
export function temporalEchoSamples({
  frame,
  leadPose,
  stack,
  evaluatePose,
}: TemporalEchoSamplesOptions): TemporalEchoSample[] {
  if (stack.length === 0) {
    throw new Error(
      "temporalEchoSamples() expected at least one stack item, but the stack was empty.",
    );
  }

  const samples: TemporalEchoSample[] = [];
  let previousPose = leadPose;

  for (const stackItem of stack) {
    const pose = evaluatePose(frame - stackItem.frameOffset);

    samples.push({
      index: stackItem.index,
      frameOffset: stackItem.frameOffset,
      decay: stackItem.decay,
      pose,
      distanceFromLead: distanceBetween(leadPose, pose),
      distanceFromPrevious: distanceBetween(previousPose, pose),
    });

    previousPose = pose;
  }

  return samples;
}

/**
 * residue が泥化しないように、速度・距離・サンプル間隔で alpha を制御する。
 * Work 06 専用の gate であり、汎用 trail policy にはしない。
 */
export function alphaResidueGate({
  sampleIndex,
  sampleCount,
  decay,
  leadSpeed,
  distanceFromLead,
  distanceFromPrevious,
  maxAlpha,
  minimumLeadSpeed,
  minimumLeadDistance,
  minimumSampleSpacing,
  idealSampleSpacing,
}: AlphaResidueGateOptions): AlphaResidueGateResult {
  const speedGate = clamp01(
    (leadSpeed - minimumLeadSpeed) / (minimumLeadSpeed * 1.5),
  );
  const leadDistanceGate = clamp01(
    (distanceFromLead - minimumLeadDistance) /
      Math.max(minimumLeadDistance, 1),
  );
  const sampleSpacingGate = clamp01(
    (distanceFromPrevious - minimumSampleSpacing) /
      Math.max(idealSampleSpacing - minimumSampleSpacing, 1),
  );
  const orderGate =
    sampleCount <= 1 ? 1 : clamp01(1 - sampleIndex / (sampleCount + 0.5));
  const alpha =
    maxAlpha *
    decay *
    orderGate *
    speedGate *
    (0.34 + leadDistanceGate * 0.66) *
    (0.42 + sampleSpacingGate * 0.58);

  return {
    alpha,
    visible: alpha >= 0.025,
  };
}

/**
 * Temporal Echo Residue family の narrow evaluator。
 * 3 つの proven helper を work-local family home で束ね、echo 群だけを返す。
 */
export function evaluateTemporalEchoResidueEchoes({
  frame,
  leadPose,
  evaluatePose,
  sampleCount,
  baseFrameStep,
  taper,
  maxAlpha,
  minimumLeadSpeed,
  minimumLeadDistance,
  minimumSampleSpacing,
  idealSampleSpacing,
}: EvaluateTemporalEchoResidueEchoesOptions): TemporalEchoResidueEcho[] {
  const stack = timeOffsetStack({
    sampleCount,
    baseFrameStep,
    taper,
  });
  const samples = temporalEchoSamples({
    frame,
    leadPose,
    stack,
    evaluatePose,
  });

  return samples
    .map((sample) => {
      const residue = alphaResidueGate({
        sampleIndex: sample.index,
        sampleCount: stack.length,
        decay: sample.decay,
        leadSpeed: leadPose.speed,
        distanceFromLead: sample.distanceFromLead,
        distanceFromPrevious: sample.distanceFromPrevious,
        maxAlpha,
        minimumLeadSpeed,
        minimumLeadDistance,
        minimumSampleSpacing,
        idealSampleSpacing,
      });

      if (!residue.visible) {
        return null;
      }

      return {
        ...sample.pose,
        alpha: residue.alpha,
        frameOffset: sample.frameOffset,
        decay: sample.decay,
        index: sample.index,
      };
    })
    .filter((sample): sample is TemporalEchoResidueEcho => sample !== null);
}
