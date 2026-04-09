import React, { useCallback } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CanvasScene, drawVignette } from "../../lib/canvas-primitives";
import { gradientFieldLayer } from "../../lib/ae-tips/gradient-field";
import {
  peakWindow,
  titleHandoff,
} from "../../lib/ae-tips/ring-title-timing";
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

const renderBackgroundSurface = (frame: number) => {
  const surface = getCanvas(
    "53-overlay-ring-title-gradient-led-surface",
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
        `53-overlay-ring-title-gradient-led-layer-${index}`,
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

const ShotOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const title = getTitleState(frame);
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
    </AbsoluteFill>
  );
};

export const OverlayRingTitleGradientLed: React.FC = () => {
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
