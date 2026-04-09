import React, { useCallback } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CanvasScene, H, W, drawVignette } from "../../lib/canvas-primitives";
import {
  getBlinkOpacity,
  getSegmentedProgress,
} from "../../lib/ae-tips/loading-progress";
import { gradientFieldLayer } from "../../lib/ae-tips/gradient-field";
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
  gradientAngleOffsetScale: 0.42,
  gradientSwingAmplitudeDeg: 16,
  gradientSwingSpeed: 0.18,
  baseWipeAngleStepDeg: 40,
  rotationSpeedDegPerSec: config.backgroundRotationSpeedDegPerSec,
  wipeCompletion: config.backgroundWipeCompletion,
  wipeCompletionAmplitude: 3,
  wipeCompletionSpeed: 0.38,
  wipePhaseMultiplier: 1.6,
  colorDriftAmount: config.backgroundColorDrift,
  colorDriftSpeed: 0.58,
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
    "51-loading-interstitial-minimal-surface",
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
        `51-loading-interstitial-minimal-layer-${index}`,
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
        alphaFloor: config.backgroundLayerPresence,
      });

      ctx.save();
      ctx.globalAlpha = index === 0 ? 1 : 0.82;
      ctx.globalCompositeOperation = index === 0 ? "source-over" : "screen";
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

  const baseGradient = ctx.createLinearGradient(
    width * (0.14 + Math.sin(frame / config.fps * 0.22) * 0.06),
    height * 0.12,
    width * (0.86 + Math.cos(frame / config.fps * 0.18) * 0.05),
    height * 0.82,
  );
  baseGradient.addColorStop(0, config.backgroundBaseGradientLeftColor);
  baseGradient.addColorStop(0.56, "rgba(24,24,32,0.22)");
  baseGradient.addColorStop(1, config.backgroundBaseGradientRightColor);
  ctx.fillStyle = baseGradient;
  ctx.fillRect(0, 0, width, height);

  const bottomFalloff = ctx.createLinearGradient(0, height * 0.18, 0, height);
  bottomFalloff.addColorStop(0, "rgba(0,0,0,0)");
  bottomFalloff.addColorStop(1, config.backgroundBaseGradientBottomColor);
  ctx.fillStyle = bottomFalloff;
  ctx.fillRect(0, 0, width, height);

  const surface = renderBackgroundSurface(frame);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(surface, 0, 0, width, height);
  ctx.restore();

  const centerGlow = ctx.createRadialGradient(
    width * 0.5,
    height * 0.48,
    40,
    width * 0.5,
    height * 0.48,
    width * 0.38,
  );
  centerGlow.addColorStop(0, config.backgroundCenterGlowColor);
  centerGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = centerGlow;
  ctx.fillRect(0, 0, width, height);

  const warmCorner = ctx.createRadialGradient(
    width * 0.84,
    height * 0.12,
    0,
    width * 0.84,
    height * 0.12,
    width * 0.42,
  );
  warmCorner.addColorStop(0, config.backgroundWarmCornerColor);
  warmCorner.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = warmCorner;
  ctx.fillRect(0, 0, width, height);

  const coolCorner = ctx.createRadialGradient(
    width * 0.1,
    height * 0.82,
    0,
    width * 0.1,
    height * 0.82,
    width * 0.38,
  );
  coolCorner.addColorStop(0, config.backgroundCoolCornerColor);
  coolCorner.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = coolCorner;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = config.backgroundOverlayColor;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.035)";
  ctx.lineWidth = 1;
  for (let y = 0; y < height; y += 72) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
    ctx.stroke();
  }
  ctx.restore();

  drawVignette(ctx, 0.24);
};

const MeterTrack: React.FC<{
  progress: number;
  opacity: number;
}> = ({ progress, opacity }) => {
  return (
    <div
      style={{
        position: "relative",
        width: config.barWidth,
        height: config.barHeight,
        opacity,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: config.barWidth * progress,
          height: config.barHeight,
          background: config.barFillColor,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxSizing: "border-box",
          border: `${config.barStrokeWidth}px solid ${config.barStrokeColor}`,
        }}
      />
    </div>
  );
};

const StatusText: React.FC<{
  text: string;
  opacity: number;
  color: string;
  size: number;
  letterSpacingEm: number;
  translateY?: number;
}> = ({ text, opacity, color, size, letterSpacingEm, translateY = 0 }) => {
  return (
    <div
      style={{
        color,
        opacity,
        fontSize: size,
        fontWeight: 600,
        letterSpacing: `${letterSpacingEm}em`,
        lineHeight: 1,
        whiteSpace: "nowrap",
        transform: `translateY(${translateY}px)`,
      }}
    >
      {text}
    </div>
  );
};

export const LoadingInterstitialMinimal: React.FC = () => {
  const frame = useCurrentFrame();
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      drawBackground(ctx, frame, W, H);
    },
    [frame],
  );

  const progress = getSegmentedProgress({
    frame: Math.min(frame, config.fillDurationFrames),
    stops: config.fillStops,
  });
  const blinkOpacity = getBlinkOpacity({
    frame,
    stepFrames: config.blinkStepFrames,
    pattern: config.blinkPattern,
    high: config.blinkHighOpacity,
    low: config.blinkLowOpacity,
  });
  const resolveStartFrame =
    config.fillDurationFrames + config.resolveHoldFrames;
  const loadingFadeT = interpolate(
    frame,
    [resolveStartFrame, resolveStartFrame + config.resolveFadeFrames],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const resolvedT = interpolate(
    frame,
    [
      resolveStartFrame + config.resolvedDelayFrames,
      resolveStartFrame + config.resolvedDelayFrames + config.resolveFadeFrames,
    ],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const loadingOpacity = (1 - loadingFadeT) * blinkOpacity;
  const resolvedOpacity = resolvedT;
  const barOpacity = interpolate(loadingFadeT, [0, 1], [1, 0.12]);
  const percentOpacity = interpolate(loadingFadeT, [0, 1], [0.82, 0]);

  return (
    <AbsoluteFill
      style={{
        background: config.backgroundBaseColor,
        color: config.textColor,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <CanvasScene draw={draw} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          transform: `translateY(${config.loadingOffsetY}px) scale(${config.loadingScale})`,
        }}
      >
        <div
          style={{
            color: config.mutedTextColor,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.18em",
            marginBottom: 22,
          }}
        >
          {config.eyebrowText}
        </div>

        <StatusText
          text={config.labelText}
          opacity={loadingOpacity}
          color={config.textColor}
          size={config.labelFontSize}
          letterSpacingEm={config.labelLetterSpacingEm}
        />
        <StatusText
          text={config.resolvedText}
          opacity={resolvedOpacity}
          color={config.resolvedTextColor}
          size={config.resolvedFontSize}
          letterSpacingEm={config.resolvedLetterSpacingEm}
          translateY={config.resolvedOffsetY}
        />

        <div style={{ height: config.barGap }} />
        <MeterTrack progress={progress} opacity={barOpacity} />

        <div
          style={{
            marginTop: 14,
            color: config.mutedTextColor,
            opacity: percentOpacity,
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.12em",
            minHeight: 18,
          }}
        >
          {`${Math.round(progress * 100)}%`}
        </div>
      </div>
    </AbsoluteFill>
  );
};
