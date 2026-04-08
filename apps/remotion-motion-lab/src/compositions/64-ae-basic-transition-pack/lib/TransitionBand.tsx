import React from "react";
import { config, type TransitionKind } from "../config";

const diagonalSpan = Math.hypot(config.width, config.height) * 1.4;
const fullCoverRadius = Math.hypot(config.width, config.height) * 0.58;
const radialCoverRadius = Math.hypot(config.width, config.height);

const polarToCartesian = (
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number,
) => {
  const angle = (angleDeg * Math.PI) / 180;
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
  };
};

const describeSectorPath = (
  cx: number,
  cy: number,
  radius: number,
  startAngleDeg: number,
  endAngleDeg: number,
) => {
  const sweep = endAngleDeg - startAngleDeg;
  if (Math.abs(sweep) < 0.001) {
    return null;
  }

  const start = polarToCartesian(cx, cy, radius, startAngleDeg);
  const end = polarToCartesian(cx, cy, radius, endAngleDeg);
  const largeArcFlag = Math.abs(sweep) > 180 ? 1 : 0;
  const sweepFlag = sweep > 0 ? 1 : 0;

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
};

const HorizontalBand: React.FC<BandProps> = ({
  outerProgress,
  innerProgress,
  color,
}) => {
  const left = config.width * innerProgress;
  const width = config.width * (outerProgress - innerProgress);

  if (width <= 0.5) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        left,
        top: 0,
        width,
        height: config.height,
        background: color,
      }}
    />
  );
};

const DiagonalBand: React.FC<BandProps> = ({
  outerProgress,
  innerProgress,
  color,
}) => {
  const left = diagonalSpan * innerProgress;
  const width = diagonalSpan * (outerProgress - innerProgress);

  if (width <= 0.5) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: diagonalSpan,
        height: diagonalSpan,
        transform: "translate(-50%, -50%) rotate(-45deg)",
        transformOrigin: "center center",
      }}
    >
      <div
        style={{
          position: "absolute",
          left,
          top: 0,
          width,
          height: diagonalSpan,
          background: color,
        }}
      />
    </div>
  );
};

const RadialBand: React.FC<BandProps> = ({
  outerProgress,
  innerProgress,
  color,
}) => {
  const clampedOuter = Math.min(outerProgress, 0.9995);
  const clampedInner = Math.min(innerProgress, clampedOuter - 0.0005);

  if (clampedOuter <= 0.001 || clampedOuter <= clampedInner) {
    return null;
  }

  const startAngle = -90 - clampedInner * 359.9;
  const endAngle = -90 - clampedOuter * 359.9;
  const path = describeSectorPath(
    config.width / 2,
    config.height / 2,
    radialCoverRadius,
    startAngle,
    endAngle,
  );

  if (!path) {
    return null;
  }

  return (
    <svg
      width={config.width}
      height={config.height}
      viewBox={`0 0 ${config.width} ${config.height}`}
      style={{ position: "absolute", inset: 0 }}
    >
      <path d={path} fill={color} />
    </svg>
  );
};

const CurveSvg: React.FC<{
  color: string;
}> = ({ color }) => {
  return (
    <svg
      width={config.width}
      height={config.height}
      viewBox={`0 0 ${config.width} ${config.height}`}
      style={{ position: "absolute", inset: 0 }}
    >
      <path
        d={config.pathD}
        fill="none"
        stroke={color}
        strokeWidth={config.pathStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const CenterOpenBand: React.FC<BandProps> = ({
  outerProgress,
  innerProgress,
  color,
}) => {
  const outerWidth = config.width * outerProgress;
  const innerWidth = config.width * innerProgress;

  if (outerWidth - innerWidth <= 0.5) {
    return null;
  }

  const centerX = config.width / 2;
  const leftBandStart = centerX - outerWidth / 2;
  const leftBandEnd = centerX - innerWidth / 2;
  const rightBandStart = centerX + innerWidth / 2;
  const rightBandEnd = centerX + outerWidth / 2;

  return (
    <>
      {leftBandEnd > leftBandStart ? (
        <div
          style={{
            position: "absolute",
            left: leftBandStart,
            top: 0,
            width: leftBandEnd - leftBandStart,
            height: config.height,
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", left: -leftBandStart, top: 0 }}>
            <CurveSvg color={color} />
          </div>
        </div>
      ) : null}
      {rightBandEnd > rightBandStart ? (
        <div
          style={{
            position: "absolute",
            left: rightBandStart,
            top: 0,
            width: rightBandEnd - rightBandStart,
            height: config.height,
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", left: -rightBandStart, top: 0 }}>
            <CurveSvg color={color} />
          </div>
        </div>
      ) : null}
    </>
  );
};

const CircleBand: React.FC<BandProps> = ({
  outerProgress,
  innerProgress,
  color,
}) => {
  const outerRadius = fullCoverRadius * outerProgress;
  const innerRadius = fullCoverRadius * innerProgress;
  const strokeWidth = outerRadius - innerRadius;

  if (strokeWidth <= 0.5) {
    return null;
  }

  return (
    <svg
      width={config.width}
      height={config.height}
      viewBox={`0 0 ${config.width} ${config.height}`}
      style={{ position: "absolute", inset: 0 }}
    >
      <circle
        cx={config.width / 2}
        cy={config.height / 2}
        r={(outerRadius + innerRadius) / 2}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
      />
    </svg>
  );
};

type BandProps = {
  outerProgress: number;
  innerProgress: number;
  color: string;
};

type TransitionBandProps = BandProps & {
  kind: TransitionKind;
};

export const TransitionBand: React.FC<TransitionBandProps> = ({
  kind,
  outerProgress,
  innerProgress,
  color,
}) => {
  switch (kind) {
    case "horizontal-wipe":
      return (
        <HorizontalBand
          outerProgress={outerProgress}
          innerProgress={innerProgress}
          color={color}
        />
      );
    case "diagonal-wipe":
      return (
        <DiagonalBand
          outerProgress={outerProgress}
          innerProgress={innerProgress}
          color={color}
        />
      );
    case "radial-wipe":
      return (
        <RadialBand
          outerProgress={outerProgress}
          innerProgress={innerProgress}
          color={color}
        />
      );
    case "center-open-line":
      return (
        <CenterOpenBand
          outerProgress={outerProgress}
          innerProgress={innerProgress}
          color={color}
        />
      );
    case "circle-wipe":
      return (
        <CircleBand
          outerProgress={outerProgress}
          innerProgress={innerProgress}
          color={color}
        />
      );
    default:
      return null;
  }
};
