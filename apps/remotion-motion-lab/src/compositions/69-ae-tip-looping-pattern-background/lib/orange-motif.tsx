import React from "react";
import { seeded } from "./patterns";

const bodyPath =
  "M79 25 C108 22 132 45 134 78 C136 113 114 145 81 147 C49 149 26 128 25 93 C23 56 47 28 79 25 Z";
const leafPath =
  "M82 19 C84 6 101 0 118 6 C108 19 94 27 80 28 C78 25 79 22 82 19 Z";
const stemPath =
  "M77 21 C76 11 79 4 86 0 C88 7 88 14 86 22 Z";

const createDotSpecs = (seed: number) => {
  return Array.from({ length: 13 }, (_, index) => {
    const localSeed = seed * 100 + index * 13;
    return {
      cx: 46 + seeded(localSeed + 1) * 48,
      cy: 48 + seeded(localSeed + 2) * 70,
      r: 2.2 + seeded(localSeed + 3) * 2.2,
      opacity: 0.8 + seeded(localSeed + 4) * 0.2,
    };
  });
};

export const OrangeMotif: React.FC<{
  left: number;
  top: number;
  size: number;
  scale: number;
  rotationDeg: number;
  mirrorX?: boolean;
  mirrorY?: boolean;
  seed: number;
}> = ({
  left,
  top,
  size,
  scale,
  rotationDeg,
  mirrorX = false,
  mirrorY = false,
  seed,
}) => {
  const width = size;
  const height = size * 1.1;
  const dots = createDotSpecs(seed);
  const scaleX = (mirrorX ? -1 : 1) * scale;
  const scaleY = (mirrorY ? -1 : 1) * scale;

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        marginLeft: -width / 2,
        marginTop: -height / 2,
        transform: `rotate(${rotationDeg}deg) scale(${scaleX}, ${scaleY})`,
        transformOrigin: "50% 50%",
        filter: "drop-shadow(0 8px 10px rgba(255,255,255,0.05))",
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 160 176"
        style={{ overflow: "visible" }}
      >
        <path d={stemPath} fill="#5d79b9" />
        <path d={leafPath} fill="#5d79b9" />
        <path d={bodyPath} fill="#f4ab45" />
        <path
          d={bodyPath}
          fill="rgba(255,255,255,0.12)"
          transform="translate(-4 -6) scale(0.98 0.94)"
        />
        {dots.map((dot, index) => (
          <circle
            key={`${seed}-${index}`}
            cx={dot.cx}
            cy={dot.cy}
            r={dot.r}
            fill={`rgba(255,255,255,${dot.opacity})`}
          />
        ))}
      </svg>
    </div>
  );
};
