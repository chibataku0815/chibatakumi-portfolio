import React, { useCallback } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { CanvasScene, drawVignette } from "../../lib/canvas-primitives";
import { gradientFieldLayer } from "../../lib/ae-tips/gradient-field";
import {
  peakWindow,
  titleHandoff,
} from "../../lib/ae-tips/ring-title-timing";
import { getTrimWindow } from "../45-ae-tip-trim-paths-radial-burst/lib/trim-window";
import { config } from "./config";

const getCanvas = (() => {
  const pool = new Map<string, HTMLCanvasElement>();

  return (key: string, width: number, height: number) => {
    let canvas = pool.get(key);
    if (!canvas) {
      canvas = document.createElement("canvas");
      pool.set(key, canvas);
    }

    if (canvas.width !== width) {
      canvas.width = width;
    }

    if (canvas.height !== height) {
      canvas.height = height;
    }

    return canvas;
  };
})();

const backgroundFieldDrift = {
  fps: config.fps,
  baseGradientAngleDeg: config.backgroundGradientAngleDeg,
  gradientAngleOffsetScale: 0.45,
  gradientSwingAmplitudeDeg: 8,
  gradientSwingSpeed: 0.2,
  baseWipeAngleStepDeg: 38,
  rotationSpeedDegPerSec: config.backgroundRotationSpeedDegPerSec,
  wipeCompletion: config.backgroundWipeCompletion,
  wipeCompletionAmplitude: 3,
  wipeCompletionSpeed: 0.42,
  wipePhaseMultiplier: 1.8,
  colorDriftAmount: config.backgroundColorDrift,
  colorDriftSpeed: 0.52,
} as const;

const backgroundReadableRange = {
  featherPx: config.backgroundWipeFeatherPx,
  mixScale: 0.56,
} as const;

const backgroundDistortion = {
  amount: config.backgroundDistortAmount,
  size: config.backgroundDistortSize,
  evolutionSpeed: config.backgroundDistortEvolutionSpeed,
} as const;

const degToRad = (deg: number) => (deg * Math.PI) / 180;

const renderBackgroundSurface = (frame: number) => {
  const surface = getCanvas(
    "50-overlay-ring-title-accent-burst-surface",
    config.backgroundInternalWidth,
    config.backgroundInternalHeight,
  );
  const ctx = surface.getContext("2d");
  if (!ctx) {
    return surface;
  }

  ctx.clearRect(0, 0, surface.width, surface.height);
  ctx.fillStyle = config.backgroundBaseColor;
  ctx.fillRect(0, 0, surface.width, surface.height);

  config.backgroundPalette
    .slice(0, config.backgroundLayerCount)
    .forEach((layer, index) => {
      const layerCanvas = getCanvas(
        `50-overlay-ring-title-accent-burst-layer-${index}`,
        config.backgroundInternalWidth,
        config.backgroundInternalHeight,
      );

      gradientFieldLayer({
        target: layerCanvas,
        frame,
        layer,
        layerIndex: index,
        drift: backgroundFieldDrift,
        readableRange: backgroundReadableRange,
        distortion: backgroundDistortion,
        opacity: config.backgroundOpacity * layer.opacity,
      });

      ctx.save();
      ctx.globalCompositeOperation = index === 0 ? "source-over" : "overlay";
      ctx.drawImage(layerCanvas, 0, 0);
      ctx.restore();
    });

  return surface;
};

const drawBackground = (
  ctx: CanvasRenderingContext2D,
  frame: number,
  width: number,
  height: number,
) => {
  ctx.fillStyle = config.backgroundBaseColor;
  ctx.fillRect(0, 0, width, height);

  const surface = renderBackgroundSurface(frame);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(surface, 0, 0, width, height);
  ctx.restore();

  const centerGlow = ctx.createRadialGradient(
    width * 0.5,
    height * 0.5,
    40,
    width * 0.5,
    height * 0.5,
    width * 0.42,
  );
  centerGlow.addColorStop(0, config.backgroundCenterGlowColor);
  centerGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = centerGlow;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = config.backgroundOverlayColor;
  ctx.fillRect(0, 0, width, height);
  drawVignette(ctx, 0.24);
};

const getRingState = (frame: number, layerIndex: number) =>
  peakWindow({
    frame,
    layerIndex,
    startFrame: config.heroStartFrame,
    durationFrames: config.ringDurationFrames,
    staggerFrames: config.ringStaggerFrames,
    easing: config.ringEase,
    startDiameter: config.ringStartDiameter,
    endDiameter: config.ringEndDiameter,
    startStrokeWidth: config.strokeStartWidth,
    endStrokeWidth: config.strokeEndWidth,
    opacityDecay: config.ringOpacityDecay,
  });

const getTitleState = (frame: number) =>
  titleHandoff({
    frame,
    startFrame: config.titleDelayFrames,
    durationFrames: config.titleDurationFrames,
    startScale: config.titleStartScale,
    endScale: config.titleMaxScale,
  });

const getAccentEnvelope = (frame: number) => {
  const start = config.accentStartFrame;
  const end =
    config.accentStartFrame +
    config.accentEraseDelayFrames +
    config.accentEraseDurationFrames;

  if (frame < start || frame > end + config.accentEnvelopeOutFrames) {
    return 0;
  }

  if (frame <= end) {
    return interpolate(frame, [start, start + 2], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
  }

  return interpolate(
    frame,
    [end, end + config.accentEnvelopeOutFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );
};

const getBurstFlashOpacity = (frame: number) =>
  interpolate(
    frame,
    [
      config.accentStartFrame,
      config.accentStartFrame + 3,
      config.accentStartFrame + 10,
    ],
    [0, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );

const getTitleFlashOpacity = (frame: number) =>
  interpolate(
    frame,
    [config.titleDelayFrames - 2, config.titleDelayFrames + 2, config.titleDelayFrames + 8],
    [0, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );

const AccentBurst: React.FC<{ frame: number }> = ({ frame }) => {
  const envelope = getAccentEnvelope(frame);
  if (envelope <= 0.001) {
    return null;
  }

  const centerX = config.width / 2;
  const centerY = config.height / 2;
  const supportRing =
    getRingState(frame, 0) ??
    getRingState(frame, 1) ??
    getRingState(frame, 2);
  const anchorRadius =
    (supportRing ? supportRing.diameter / 2 : config.ringEndDiameter / 2) +
    config.accentRadiusOffset;

  return (
    <g opacity={envelope}>
      {config.accentLineAnglesDeg.map((angle, index) => {
        const window = getTrimWindow({
          frame:
            frame -
            config.accentStartFrame -
            index * config.accentLineStaggerFrames,
          drawDurationFrames: config.accentDrawDurationFrames,
          eraseDelayFrames: config.accentEraseDelayFrames,
          eraseDurationFrames: config.accentEraseDurationFrames,
          easing: "ae-like",
        });

        if (!window.visible) {
          return null;
        }

        const radians = degToRad(angle);
        const startDistance =
          anchorRadius + window.start * config.accentStrokeLength;
        const endDistance =
          anchorRadius + window.end * config.accentStrokeLength;
        const startX = centerX + Math.cos(radians) * startDistance;
        const startY = centerY + Math.sin(radians) * startDistance;
        const endX = centerX + Math.cos(radians) * endDistance;
        const endY = centerY + Math.sin(radians) * endDistance;
        const opacity = config.accentOpacity * Math.max(0.72, 1 - index * 0.08);
        const strokeWidth =
          config.accentStrokeWidth * Math.max(0.92, 1 - index * 0.05);

        return (
          <g key={angle}>
            <line
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke={config.accentGlowColor}
              strokeWidth={strokeWidth * 1.7}
              strokeLinecap="round"
              opacity={config.accentGlowOpacity}
            />
            <line
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke={config.accentColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              opacity={opacity}
            />
            <circle
              cx={endX}
              cy={endY}
              r={strokeWidth * 0.36}
              fill={config.accentColor}
              opacity={opacity * 0.9}
            />
          </g>
        );
      })}
    </g>
  );
};

const ShotOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const title = getTitleState(frame);
  const burstFlashOpacity = getBurstFlashOpacity(frame);
  const titleFlashOpacity = getTitleFlashOpacity(frame);
  const centerX = config.width / 2;
  const centerY = config.height / 2;

  return (
    <AbsoluteFill
      style={{
        color: config.titleColor,
        fontFamily: "Inter, sans-serif",
        pointerEvents: "none",
      }}
    >
      <svg
        width={config.width}
        height={config.height}
        viewBox={`0 0 ${config.width} ${config.height}`}
        style={{ position: "absolute", inset: 0 }}
      >
        {burstFlashOpacity > 0.001 ? (
          <g opacity={burstFlashOpacity}>
            <circle
              cx={centerX}
              cy={centerY}
              r={config.burstFlashRadius}
              fill={config.burstFlashColor}
            />
            <circle
              cx={centerX}
              cy={centerY}
              r={config.burstFlashRadius * 0.72}
              fill="none"
              stroke={config.accentColor}
              strokeWidth={18}
              opacity={0.34}
            />
          </g>
        ) : null}

        <AccentBurst frame={frame} />

        {Array.from({ length: config.ringCount }).map((_, index) => {
          const ring = getRingState(frame, index);
          if (!ring) {
            return null;
          }

          return (
            <g key={index}>
              <circle
                cx={centerX}
                cy={centerY}
                r={ring.diameter / 2}
                fill="none"
                stroke={config.ringHighlightColor}
                strokeWidth={ring.strokeWidth * 1.3}
                opacity={ring.alpha * 0.82}
              />
              <circle
                cx={centerX}
                cy={centerY}
                r={ring.diameter / 2}
                fill="none"
                stroke={config.ringColor}
                strokeWidth={ring.strokeWidth}
                opacity={ring.alpha}
              />
            </g>
          );
        })}
      </svg>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${title.scale})`,
          transformOrigin: "50% 50%",
          opacity: title.opacity,
          letterSpacing: `${config.titleLetterSpacingEm}em`,
          paddingLeft: `${config.titleLetterSpacingEm}em`,
          fontSize: config.titleFontSize,
          fontWeight: 900,
          textTransform: "uppercase",
          textShadow: config.titleShadow,
        }}
      >
        {config.titleText}
      </div>

      {titleFlashOpacity > 0.001 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at 50% 50%, ${config.titleFlashColor} 0%, rgba(255,255,255,0) 52%)`,
            opacity: titleFlashOpacity,
            mixBlendMode: "screen",
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

export const OverlayRingTitleAccentBurst: React.FC = () => {
  const stableDraw = useCallback(
    (ctx: CanvasRenderingContext2D, frame: number) => {
      drawBackground(ctx, frame, config.width, config.height);
    },
    [],
  );

  return (
    <AbsoluteFill style={{ backgroundColor: config.backgroundBaseColor }}>
      <CanvasScene draw={stableDraw} />
      <ShotOverlay />
    </AbsoluteFill>
  );
};
