import { alphaResidueGate } from "./alphaResidueGate";
import { temporalEchoResidueConfig } from "./temporal-echo-residue.config";
import { temporalEchoSamples, type TemporalEchoPose } from "./temporalEchoSamples";
import { timeOffsetStack } from "./timeOffsetStack";

export type TemporalEchoResidueFrameState = {
  frame: number;
  time: number;
  progress: number;
  lead: TemporalEchoPose;
  echoes: Array<
    TemporalEchoPose & {
      alpha: number;
      frameOffset: number;
      decay: number;
      index: number;
    }
  >;
  backgroundDrift: number;
  railGlowAlpha: number;
};

type SubjectTransform = Omit<TemporalEchoPose, "speed">;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function inverseLerp(value: number, start: number, end: number) {
  if (start === end) {
    return value >= end ? 1 : 0;
  }

  return clamp01((value - start) / (end - start));
}

function mix(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

function easeInOutCubic(value: number) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - (-2 * value + 2) ** 3 / 2;
}

function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3;
}

/**
 * evaluator truth は frame -> pose 群の変換に限定する。
 * 描画事情は Pixi scene adapter 側へ持ち込まない。
 */
function evaluateSubjectTransform(frame: number): SubjectTransform {
  const leadTravel = easeInOutCubic(inverseLerp(frame, 0, 92));
  const settleProgress = easeOutCubic(inverseLerp(frame, 92, 148));
  const holdProgress = inverseLerp(frame, 148, 179);
  const overshootX = mix(
    temporalEchoResidueConfig.subject.startX,
    temporalEchoResidueConfig.subject.endX + 34,
    leadTravel,
  );
  const settledX = mix(
    overshootX,
    temporalEchoResidueConfig.subject.endX,
    settleProgress,
  );
  const arcLift =
    Math.sin(leadTravel * Math.PI) * temporalEchoResidueConfig.subject.arcHeight;
  const settleDrop = temporalEchoResidueConfig.subject.settleDrop * settleProgress;
  const driftY = Math.sin(leadTravel * Math.PI * 2.2) * 10;
  const y =
    temporalEchoResidueConfig.subject.centerY - arcLift + settleDrop + driftY;
  const rotation = mix(-0.34, 0.22, leadTravel) * (1 - settleProgress * 0.8);
  const scale = mix(0.88, 1.06, leadTravel) - settleProgress * 0.05;
  const stretchX =
    0.92 + leadTravel * 0.2 - settleProgress * 0.08 + holdProgress * 0.01;
  const stretchY =
    1.08 - leadTravel * 0.18 + settleProgress * 0.1 - holdProgress * 0.01;

  return {
    x: settledX,
    y,
    rotation,
    scale,
    stretchX,
    stretchY,
  };
}

function evaluateSubjectPose(frame: number): TemporalEchoPose {
  const current = evaluateSubjectTransform(frame);
  const previous = evaluateSubjectTransform(frame - 1);

  return {
    ...current,
    speed: Math.hypot(current.x - previous.x, current.y - previous.y),
  };
}

export function getTemporalEchoResidueReducedMotionFrame() {
  return temporalEchoResidueConfig.reducedMotionFrame;
}

export function evaluateTemporalEchoResidueFrame(
  frame: number,
): TemporalEchoResidueFrameState {
  const normalizedFrame =
    ((frame % temporalEchoResidueConfig.durationFrames) +
      temporalEchoResidueConfig.durationFrames) %
    temporalEchoResidueConfig.durationFrames;
  const time = (normalizedFrame / temporalEchoResidueConfig.fps) * 1000;
  const progress =
    normalizedFrame / (temporalEchoResidueConfig.durationFrames - 1);
  const lead = evaluateSubjectPose(normalizedFrame);
  const stack = timeOffsetStack({
    sampleCount: temporalEchoResidueConfig.echo.sampleCount,
    baseFrameStep: temporalEchoResidueConfig.echo.baseFrameStep,
    taper: temporalEchoResidueConfig.echo.taper,
  });
  const samples = temporalEchoSamples({
    frame: normalizedFrame,
    leadPose: lead,
    stack,
    evaluatePose: evaluateSubjectPose,
  });
  const echoes = samples
    .map((sample) => {
      const residue = alphaResidueGate({
        sampleIndex: sample.index,
        sampleCount: stack.length,
        decay: sample.decay,
        leadSpeed: lead.speed,
        distanceFromLead: sample.distanceFromLead,
        distanceFromPrevious: sample.distanceFromPrevious,
        maxAlpha: temporalEchoResidueConfig.echo.maxAlpha,
        minimumLeadSpeed: temporalEchoResidueConfig.echo.minimumLeadSpeed,
        minimumLeadDistance: temporalEchoResidueConfig.echo.minimumLeadDistance,
        minimumSampleSpacing:
          temporalEchoResidueConfig.echo.minimumSampleSpacing,
        idealSampleSpacing: temporalEchoResidueConfig.echo.idealSampleSpacing,
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
    .filter((sample): sample is NonNullable<typeof sample> => sample !== null);

  return {
    frame: normalizedFrame,
    time,
    progress,
    lead,
    echoes,
    backgroundDrift:
      Math.sin(time * 0.0011) * 18 + Math.cos(time * 0.00037) * 11,
    railGlowAlpha: 0.12 + clamp01(lead.speed / 16) * 0.32,
  };
}
