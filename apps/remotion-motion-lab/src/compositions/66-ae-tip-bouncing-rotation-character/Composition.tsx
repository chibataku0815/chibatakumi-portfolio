import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { config } from "./config";
import { getBoardPath } from "./lib/board-path";
import { getCharacterMotion } from "./lib/character-motion";

const Face: React.FC<{ top: number }> = ({ top }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top,
        width: 112,
        height: 92,
        marginLeft: -56,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 18,
          top: 0,
          width: 18,
          height: 18,
          borderRadius: 999,
          background: config.body.faceFeatureColor,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 18,
          top: 0,
          width: 18,
          height: 18,
          borderRadius: 999,
          background: config.body.faceFeatureColor,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 0,
          width: config.body.faceWidth,
          height: config.body.faceHeight,
          marginLeft: -config.body.faceWidth / 2,
          borderRadius: config.body.faceHeight / 2,
          background: config.body.faceColor,
          boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 28,
            height: 8,
            borderRadius: 999,
            background: config.body.faceFeatureColor,
          }}
        />
      </div>
    </div>
  );
};

export const AETipBouncingRotationCharacter: React.FC = () => {
  const frame = useCurrentFrame();
  const motion = getCharacterMotion(frame);
  const boardPath = getBoardPath({
    centerX: config.stageCenterX,
    baseY: config.board.centerY,
    width: config.board.width,
    sagPx: motion.boardSagPx,
  });
  const guidePath = getBoardPath({
    centerX: config.stageCenterX,
    baseY: config.board.centerY,
    width: config.board.width,
    sagPx: 0,
  });
  const bodyLeft = config.stageCenterX - config.body.width / 2;
  const bodyTop = motion.bodyBottomY - config.body.height;

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        background: config.background,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 38%, ${config.backgroundCenterGlow} 0%, rgba(255,255,255,0) 34%), radial-gradient(circle at 50% 86%, ${config.backgroundBottomGlow} 0%, rgba(255,255,255,0) 30%)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: config.stageCenterX - 170,
          top: config.board.centerY + 46,
          width: 340,
          height: 56,
          borderRadius: 999,
          background: config.body.shadowColor,
          opacity: motion.shadowOpacity,
          transform: `scale(${motion.shadowScaleX}, ${motion.shadowScaleY})`,
          filter: "blur(18px)",
        }}
      />

      <svg
        width={config.width}
        height={config.height}
        viewBox={`0 0 ${config.width} ${config.height}`}
        style={{
          position: "absolute",
          inset: 0,
          overflow: "visible",
        }}
      >
        <path
          d={guidePath}
          stroke={config.board.guideColor}
          strokeWidth={config.board.strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
        <path
          d={boardPath}
          stroke={config.board.color}
          strokeWidth={config.board.strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      <div
        style={{
          position: "absolute",
          left: bodyLeft,
          top: bodyTop,
          width: config.body.width,
          height: config.body.height,
          transformOrigin: "50% 100%",
          transform: `scale(${motion.scaleX}, ${motion.scaleY})`,
          borderRadius: "50%",
          background: config.body.color,
          overflow: "hidden",
          boxShadow: "0 12px 28px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 28%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            width: config.body.width * 0.84,
            height: config.body.height * 0.28,
            marginLeft: -(config.body.width * 0.84) / 2,
            borderBottomLeftRadius: config.body.width,
            borderBottomRightRadius: config.body.width,
            background: config.body.highlightColor,
            filter: "blur(14px)",
          }}
        />
        <Face top={motion.frontFaceY} />
        <Face top={motion.backFaceY} />
      </div>
    </AbsoluteFill>
  );
};
