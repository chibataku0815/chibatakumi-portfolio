import { Easing } from "remotion";
import { getTrimWindow } from "../../45-ae-tip-trim-paths-radial-burst/lib/trim-window";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export interface FlowingSegmentWindow {
  start: number;
  length: number;
}

export interface FlowingStrokeTiming {
  trimStartFrame: number;
  drawDurationFrames: number;
  eraseDelayFrames: number;
  eraseDurationFrames: number;
  motionStartFrame: number;
  motionRampFrames: number;
  loopSpeed: number;
  phase: number;
}

export interface FlowingStrokeSpec {
  id: string;
  d: string;
  color: string;
  highlightColor?: string;
  strokeWidth: number;
  segmentWindows: FlowingSegmentWindow[];
  timing: FlowingStrokeTiming;
  transform?: string;
  opacity?: number;
  coreOpacity?: number;
  glowOpacity?: number;
  glowScale?: number;
  strokeLinecap?: "butt" | "round" | "square";
  strokeLinejoin?: "miter" | "round" | "bevel";
}

export interface ResolvedFlowingStroke {
  windows: FlowingSegmentWindow[];
  opacity: number;
  coreOpacity: number;
  glowOpacity: number;
}

export const wrap01 = (value: number) => {
  const wrapped = value % 1;
  return wrapped < 0 ? wrapped + 1 : wrapped;
};

export const splitWrappedWindow = (
  start: number,
  length: number,
): FlowingSegmentWindow[] => {
  if (length <= 0) {
    return [];
  }

  const normalizedStart = wrap01(start);
  const end = normalizedStart + length;

  if (end <= 1) {
    return [{ start: normalizedStart, length }];
  }

  return [
    { start: normalizedStart, length: 1 - normalizedStart },
    { start: 0, length: end - 1 },
  ];
};

const intersectLinearWindows = (
  segment: FlowingSegmentWindow,
  trimStart: number,
  trimEnd: number,
): FlowingSegmentWindow | null => {
  const start = Math.max(segment.start, trimStart);
  const end = Math.min(segment.start + segment.length, trimEnd);

  if (end - start <= 0.002) {
    return null;
  }

  return {
    start,
    length: end - start,
  };
};

export const getFlowOffset = ({
  frame,
  timing,
}: {
  frame: number;
  timing: FlowingStrokeTiming;
}) => {
  const localFrame = Math.max(0, frame - timing.motionStartFrame);
  const rampFrames = Math.max(1, timing.motionRampFrames);
  const rampFrame = Math.min(localFrame, rampFrames);
  const rampProgress = clamp01(rampFrame / rampFrames);
  const rampEase = Easing.out(Easing.cubic)(rampProgress);
  const rampDistance =
    timing.loopSpeed * rampFrame * (0.16 + 0.84 * rampEase);
  const continuedDistance =
    timing.loopSpeed * Math.max(0, localFrame - rampFrames);

  return wrap01(timing.phase + rampDistance + continuedDistance);
};

export const resolveFlowingStroke = ({
  frame,
  spec,
}: {
  frame: number;
  spec: FlowingStrokeSpec;
}): ResolvedFlowingStroke | null => {
  const trim = getTrimWindow({
    frame: frame - spec.timing.trimStartFrame,
    drawDurationFrames: spec.timing.drawDurationFrames,
    eraseDelayFrames: spec.timing.eraseDelayFrames,
    eraseDurationFrames: spec.timing.eraseDurationFrames,
  });

  if (!trim.visible || trim.end <= trim.start) {
    return null;
  }

  const offset = getFlowOffset({ frame, timing: spec.timing });
  const windows = spec.segmentWindows
    .flatMap((segment) =>
      splitWrappedWindow(segment.start + offset, segment.length),
    )
    .map((segment) => intersectLinearWindows(segment, trim.start, trim.end))
    .filter((segment): segment is FlowingSegmentWindow => segment !== null);

  if (windows.length === 0) {
    return null;
  }

  return {
    windows,
    opacity: spec.opacity ?? 1,
    coreOpacity: spec.coreOpacity ?? 1,
    glowOpacity: spec.glowOpacity ?? 0.24,
  };
};

export const getStrokeDash = (
  window: FlowingSegmentWindow,
  pathUnits = 1000,
) => {
  const visible = Math.max(0.001, window.length * pathUnits);
  const hidden = Math.max(0.001, pathUnits - visible);

  return {
    pathLength: pathUnits,
    strokeDasharray: `${visible.toFixed(3)} ${hidden.toFixed(3)}`,
    strokeDashoffset: Number((-window.start * pathUnits).toFixed(3)),
  };
};

export const getNeonFlicker = ({
  frame,
  seed,
  base = 0.96,
  amplitude = 0.08,
}: {
  frame: number;
  seed: number;
  base?: number;
  amplitude?: number;
}) => {
  const slow = Math.sin(frame * 0.045 + seed * 1.73) * amplitude * 0.45;
  const mid = Math.sin(frame * 0.18 + seed * 0.91) * amplitude * 0.3;
  const micro = Math.sin(frame * 0.72 + seed * 2.41) * amplitude * 0.12;
  return clamp01(base + slow + mid + micro);
};
