import type { TimeOffsetStackItem } from "./timeOffsetStack";

export type TemporalEchoPose = {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  stretchX: number;
  stretchY: number;
  speed: number;
};

export type TemporalEchoSample = {
  index: number;
  frameOffset: number;
  decay: number;
  pose: TemporalEchoPose;
  distanceFromLead: number;
  distanceFromPrevious: number;
};

type TemporalEchoSamplesOptions = {
  frame: number;
  leadPose: TemporalEchoPose;
  stack: TimeOffsetStackItem[];
  evaluatePose: (frame: number) => TemporalEchoPose;
};

function distanceBetween(
  first: Pick<TemporalEchoPose, "x" | "y">,
  second: Pick<TemporalEchoPose, "x" | "y">,
) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

/**
 * 過去フレームを離散サンプルとして読む。
 * blur ではなく「どの時点の像を残すか」を見える形にするためのローカル helper。
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
