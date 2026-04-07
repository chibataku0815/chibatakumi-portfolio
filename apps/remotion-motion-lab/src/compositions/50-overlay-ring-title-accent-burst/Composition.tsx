import React, { useCallback } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { CanvasScene, drawVignette } from "../../lib/canvas-primitives";
import { clamp01, hexToRgb, mixRgb } from "../46-ae-tip-overlay-gradient-background/lib/color-utils";
import { distortPoint } from "../46-ae-tip-overlay-gradient-background/lib/distortion";
import { getTrimWindow } from "../45-ae-tip-trim-paths-radial-burst/lib/trim-window";
import { getRingProgress } from "../47-ae-tip-expanding-ring-reveal/lib/ring-progress";
import { config, type BackgroundLayerConfig } from "./config";

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

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const smoothstep = (edge0: number, edge1: number, x: number) => {
  if (edge0 === edge1) {
    return x < edge0 ? 0 : 1;
  }

  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const featherToNormalized = (featherPx: number, width: number, height: number) =>
  clamp(featherPx / Math.max(width, height) / 1.9, 0.03, 1.35);

const getWipeAlpha = (
  projection: number,
  completion: number,
  featherPx: number,
  width: number,
  height: number,
) => {
  const threshold = (completion / 100) * 2 - 1;
  const feather = featherToNormalized(featherPx, width, height);

  return 1 - smoothstep(threshold - feather, threshold + feather, projection);
};

const degToRad = (deg: number) => (deg * Math.PI) / 180;

const renderGradientLayer = ({
  target,
  frame,
  layer,
  layerIndex,
}: {
  target: HTMLCanvasElement;
  frame: number;
  layer: BackgroundLayerConfig;
  layerIndex: number;
}) => {
  const ctx = target.getContext("2d");
  if (!ctx) {
    return;
  }

  const { width, height } = target;
  const image = ctx.createImageData(width, height);
  const data = image.data;
  const colorA = hexToRgb(layer.colorA);
  const colorB = hexToRgb(layer.colorB);
  const time = frame / config.fps;
  const aspect = width / height;
  const gradientAngle = degToRad(
    config.backgroundGradientAngleDeg +
      layer.angleOffsetDeg * 0.45 +
      Math.sin(time * 0.2 + layer.phase) * 8,
  );
  const wipeAngle = degToRad(
    (layerIndex + 1) * 38 +
      time * config.backgroundRotationSpeedDegPerSec * layer.rotationMultiplier,
  );
  const gradientAxisX = Math.cos(gradientAngle);
  const gradientAxisY = Math.sin(gradientAngle);
  const wipeAxisX = Math.cos(wipeAngle);
  const wipeAxisY = Math.sin(wipeAngle);
  const completion =
    config.backgroundWipeCompletion +
    Math.sin(time * 0.42 + layer.phase * 1.8) * 3;
  const colorDrift =
    Math.sin(time * 0.52 + layer.phase) * config.backgroundColorDrift;

  for (let y = 0; y < height; y += 1) {
    const baseY = ((y + 0.5) / height) * 2 - 1;

    for (let x = 0; x < width; x += 1) {
      const baseX = ((x + 0.5) / width) * 2 - 1;
      const warped = distortPoint({
        x: baseX,
        y: baseY,
        time,
        amount: config.backgroundDistortAmount,
        size: config.backgroundDistortSize,
        evolutionSpeed: config.backgroundDistortEvolutionSpeed,
        layerIndex,
        phase: layer.phase,
        aspect,
      });

      const gradientProjection =
        warped.x * gradientAxisX + warped.y * gradientAxisY;
      const wipeProjection = warped.x * wipeAxisX + warped.y * wipeAxisY;
      const mix = clamp01(0.5 + gradientProjection * 0.56 + colorDrift);
      const rgb = mixRgb(colorA, colorB, mix);
      const alpha =
        getWipeAlpha(
          wipeProjection,
          completion,
          config.backgroundWipeFeatherPx,
          width,
          height,
        ) *
        config.backgroundOpacity *
        layer.opacity;
      const offset = (y * width + x) * 4;

      data[offset] = rgb.r;
      data[offset + 1] = rgb.g;
      data[offset + 2] = rgb.b;
      data[offset + 3] = Math.round(clamp01(alpha) * 255);
    }
  }

  ctx.putImageData(image, 0, 0);
};

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

      renderGradientLayer({
        target: layerCanvas,
        frame,
        layer,
        layerIndex: index,
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

const getRingState = (frame: number, layerIndex: number) => {
  const progress = getRingProgress({
    frame:
      frame - config.heroStartFrame - layerIndex * config.ringStaggerFrames,
    durationFrames: config.ringDurationFrames,
    easing: config.ringEase,
  });

  if (!progress.visible) {
    return null;
  }

  const diameter = interpolate(
    progress.motionProgress,
    [0, 1],
    [config.ringStartDiameter, config.ringEndDiameter],
  );
  const strokeWidth = Math.max(
    config.strokeEndWidth,
    interpolate(
      progress.motionProgress,
      [0, 1],
      [config.strokeStartWidth, config.strokeEndWidth],
    ),
  );
  const alpha =
    interpolate(progress.rawProgress, [0, 1], [0.94, 0.08]) *
    Math.max(0.12, 1 - layerIndex * config.ringOpacityDecay);

  return {
    diameter,
    strokeWidth,
    alpha,
  };
};

const getTitleState = (frame: number) => {
  const scale = interpolate(
    frame,
    [config.titleDelayFrames, config.titleDelayFrames + config.titleDurationFrames],
    [config.titleStartScale, config.titleMaxScale],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.back(1.2)),
    },
  );
  const opacity = interpolate(
    frame,
    [
      config.titleDelayFrames,
      config.titleDelayFrames + config.titleDurationFrames * 0.72,
    ],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );

  return {
    scale,
    opacity,
  };
};

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
