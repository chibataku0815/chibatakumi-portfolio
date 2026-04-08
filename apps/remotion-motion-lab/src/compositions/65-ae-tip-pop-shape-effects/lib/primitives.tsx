import React from "react";
import type { EasingFn } from "../../../lib/canvas-easing";
import {
  backOut,
  cubicIn,
  expoOut,
  quadOut,
  quintOut,
  sineOut,
} from "../../../lib/canvas-easing";
import {
  clamp01,
  createBackControlProfile,
  createFlatProfile,
  createFastLaunchLongSettle,
  mix,
  resolvePremiumClampedProgress,
  type PremiumMotionProfile,
} from "../../../lib/premium-motion-primitives";

const defaultTrimDrawProfile = createFlatProfile("expoOut", 14);
const defaultTrimEraseProfile = createFlatProfile("quadOut", 14);
const defaultOutlineScaleProfile = createBackControlProfile(22);
const defaultOutlineStrokeProfile = createFlatProfile("quintOut", 22);
const defaultRotationProfile = createFastLaunchLongSettle({
  launchCurve: "expoOut",
  settleCurve: "quintOut",
  launchFrames: 5,
  settleFrames: 9,
  launchPortion: 0.82,
});

export const getSceneFrame = (
  frame: number,
  startFrame: number,
  durationFrames: number,
) => {
  const localFrame = frame - startFrame;

  return {
    localFrame,
    visible: localFrame >= 0 && localFrame < durationFrames,
  };
};

const getTrimStrokeWindow = ({
  frame,
  drawDurationFrames,
  eraseDelayFrames,
  eraseDurationFrames,
  drawEase = expoOut,
  eraseEase = cubicIn,
}: {
  frame: number;
  drawDurationFrames: number;
  eraseDelayFrames: number;
  eraseDurationFrames: number;
  drawEase?: EasingFn;
  eraseEase?: EasingFn;
}) => {
  if (frame < 0) {
    return { visible: false, start: 0, end: 0, span: 0 };
  }

  if (frame <= drawDurationFrames) {
    const end = drawEase(clamp01(frame / Math.max(1, drawDurationFrames)));

    return {
      visible: true,
      start: 0,
      end,
      span: clamp01(end),
    };
  }

  const eraseStartFrame = drawDurationFrames + eraseDelayFrames;
  if (frame < eraseStartFrame) {
    return {
      visible: true,
      start: 0,
      end: 1,
      span: 1,
    };
  }

  const eraseProgress = clamp01(
    (frame - eraseStartFrame) / Math.max(1, eraseDurationFrames),
  );

  if (eraseProgress >= 1) {
    return { visible: false, start: 1, end: 1, span: 0 };
  }

  const start = eraseEase(eraseProgress);

  return {
    visible: true,
    start,
    end: 1,
    span: clamp01(1 - start),
  };
};

const getStrokeDashStyle = (start: number, end: number) => {
  const span = clamp01(end - start);

  return {
    strokeDasharray: `${Math.max(span, 0.0001)} 1`,
    strokeDashoffset: -start,
  };
};

export const RadialTrimBurst: React.FC<{
  frame: number;
  centerX: number;
  centerY: number;
  lineLength: number;
  strokeWidth: number;
  spokeCount: number;
  rotationOffsetDeg?: number;
  drawDurationFrames: number;
  eraseDelayFrames: number;
  eraseDurationFrames: number;
  stroke: string;
  glow?: string;
  opacity?: number;
  drawEase?: EasingFn;
  eraseEase?: EasingFn;
  rotationNudgeDeg?: number;
  rotationProfile?: PremiumMotionProfile;
}> = ({
  frame,
  centerX,
  centerY,
  lineLength,
  strokeWidth,
  spokeCount,
  rotationOffsetDeg = 0,
  drawDurationFrames,
  eraseDelayFrames,
  eraseDurationFrames,
  stroke,
  glow,
  opacity = 1,
  drawEase = expoOut,
  eraseEase = cubicIn,
  rotationNudgeDeg = 0,
  rotationProfile = defaultRotationProfile,
}) => {
  const trim = getTrimStrokeWindow({
    frame,
    drawDurationFrames,
    eraseDelayFrames,
    eraseDurationFrames,
    drawEase,
    eraseEase,
  });

  if (!trim.visible || trim.span <= 0.0001) {
    return null;
  }

  const dashStyle = getStrokeDashStyle(trim.start, trim.end);
  const angleStep = 360 / Math.max(1, spokeCount);
  const rotationSettle = resolvePremiumClampedProgress(frame, rotationProfile);
  const entryRotationOffset = rotationNudgeDeg * (1 - backOut(rotationSettle));
  const visibleOpacity =
    opacity * mix(0.72, 1, quintOut(sineOut(trim.span)));

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${centerX * 2} ${centerY * 2}`}
      style={{ position: "absolute", inset: 0 }}
    >
      <g transform={`translate(${centerX} ${centerY})`}>
        {Array.from({ length: spokeCount }).map((_, index) => {
          const rotation =
            rotationOffsetDeg + angleStep * index + entryRotationOffset;

          return (
            <g key={rotation} transform={`rotate(${rotation})`}>
              {glow ? (
                <line
                  x1={0}
                  y1={0}
                  x2={0}
                  y2={-lineLength}
                  pathLength={1}
                  stroke={glow}
                  strokeWidth={strokeWidth * 1.8}
                  strokeLinecap="round"
                  opacity={visibleOpacity * 0.45}
                  {...dashStyle}
                />
              ) : null}
              <line
                x1={0}
                y1={0}
                x2={0}
                y2={-lineLength}
                pathLength={1}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity={visibleOpacity}
                {...dashStyle}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
};

export const ExpandingOutline: React.FC<{
  frame: number;
  centerX: number;
  centerY: number;
  sideLength: number;
  rotationDeg: number;
  strokeStartWidth: number;
  strokeEndWidth: number;
  durationFrames: number;
  stroke: string;
  scaleProfile?: PremiumMotionProfile;
  strokeProfile?: PremiumMotionProfile;
}> = ({
  frame,
  centerX,
  centerY,
  sideLength,
  rotationDeg,
  strokeStartWidth,
  strokeEndWidth,
  durationFrames,
  stroke,
  scaleProfile = defaultOutlineScaleProfile,
  strokeProfile = defaultOutlineStrokeProfile,
}) => {
  if (frame < 0 || frame >= durationFrames) {
    return null;
  }

  const scale = resolvePremiumClampedProgress(frame, scaleProfile);
  const strokeProgress = resolvePremiumClampedProgress(frame, strokeProfile);
  const opacity = mix(0.96, 0.08, quadOut(clamp01(frame / Math.max(1, durationFrames))));

  const strokeWidth = Math.max(
    0.5,
    mix(strokeStartWidth, strokeEndWidth, strokeProgress),
  );

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${centerX * 2} ${centerY * 2}`}
      style={{ position: "absolute", inset: 0 }}
    >
      <g
        transform={`translate(${centerX} ${centerY}) rotate(${rotationDeg}) scale(${scale})`}
        opacity={opacity}
      >
        <rect
          x={-sideLength / 2}
          y={-sideLength / 2}
          width={sideLength}
          height={sideLength}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          rx={10}
        />
      </g>
    </svg>
  );
};

export const StaggeredSpokeChain: React.FC<{
  frame: number;
  centerX: number;
  centerY: number;
  lineLength: number;
  strokeWidth: number;
  startRotationDeg: number;
  rotationStepDeg: number;
  layerCount: number;
  layerStaggerFrames: number;
  drawDurationFrames: number;
  eraseDelayFrames: number;
  eraseDurationFrames: number;
  colors: readonly string[];
  drawEase?: EasingFn;
  eraseEase?: EasingFn;
}> = ({
  frame,
  centerX,
  centerY,
  lineLength,
  strokeWidth,
  startRotationDeg,
  rotationStepDeg,
  layerCount,
  layerStaggerFrames,
  drawDurationFrames,
  eraseDelayFrames,
  eraseDurationFrames,
  colors,
  drawEase = expoOut,
  eraseEase = cubicIn,
}) => {
  return (
    <>
      {Array.from({ length: layerCount }).map((_, index) => (
        <RadialTrimBurst
          key={index}
          frame={frame - index * layerStaggerFrames}
          centerX={centerX}
          centerY={centerY}
          lineLength={lineLength}
          strokeWidth={strokeWidth}
          spokeCount={1}
          rotationOffsetDeg={startRotationDeg + index * rotationStepDeg}
          drawDurationFrames={drawDurationFrames}
          eraseDelayFrames={eraseDelayFrames}
          eraseDurationFrames={eraseDurationFrames}
          stroke={colors[index % colors.length] ?? colors[0] ?? "#ffffff"}
          glow="rgba(255,255,255,0.12)"
          drawEase={drawEase}
          eraseEase={eraseEase}
          rotationNudgeDeg={12 + index * 2}
          rotationProfile={defaultRotationProfile}
        />
      ))}
    </>
  );
};
