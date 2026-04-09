import React, { useCallback } from "react";
import {
  CanvasScene,
  H,
  W,
  drawDust,
  drawVignette,
} from "../../lib/canvas-primitives";
import {
  config,
  layerPalette,
  panelContentHeight,
  panelContentWidth,
  panelWidth,
} from "./config";
import { gradientFieldLayer } from "../../lib/ae-tips/gradient-field";

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

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
};

const quietFieldDrift = {
  fps: config.fps,
  baseGradientAngleDeg: config.gradientAngleDeg,
  gradientAngleOffsetScale: 0.5,
  gradientSwingAmplitudeDeg: 20,
  gradientSwingSpeed: 0.23,
  baseWipeAngleStepDeg: config.angleStepDeg,
  rotationSpeedDegPerSec: config.rotationSpeedDegPerSec,
  wipeCompletion: config.wipeCompletion,
  wipeCompletionAmplitude: 4,
  wipeCompletionSpeed: 0.55,
  wipePhaseMultiplier: 2.1,
  colorDriftAmount: 0.14,
  colorDriftSpeed: 0.72,
} as const;

const fieldDistortion = {
  amount: config.distortAmount,
  size: config.distortSize,
  evolutionSpeed: config.distortEvolutionSpeed,
} as const;

const quietReadableRange = {
  featherPx: config.wipeFeatherPx,
  mixScale: 0.58,
  referenceWidth: panelContentWidth,
  referenceHeight: panelContentHeight,
} as const;

const hardReadableRange = {
  featherPx: config.hardWipeFeatherPx,
  mixScale: 0.58,
  referenceWidth: panelContentWidth,
  referenceHeight: panelContentHeight,
} as const;

const renderPanelSource = ({
  frame,
  mode,
}: {
  frame: number;
  mode: "single" | "stack";
}) => {
  const surface = getCanvas(
    `46-overlay-surface-${mode}`,
    config.internalWidth,
    config.internalHeight,
  );
  const ctx = surface.getContext("2d");
  if (!ctx) {
    return surface;
  }

  ctx.clearRect(0, 0, surface.width, surface.height);
  ctx.fillStyle =
    mode === "single" ? config.stageSingleBaseColor : config.stageBaseColor;
  ctx.fillRect(0, 0, surface.width, surface.height);

  const stageGradient = ctx.createLinearGradient(
    surface.width * (0.14 + Math.sin(frame / config.fps * 0.24) * 0.06),
    surface.height * 0.08,
    surface.width * (0.86 + Math.cos(frame / config.fps * 0.19) * 0.05),
    surface.height * 0.88,
  );
  stageGradient.addColorStop(0, config.stageGradientLeftColor);
  stageGradient.addColorStop(0.55, "rgba(37,27,34,0.26)");
  stageGradient.addColorStop(1, config.stageGradientRightColor);
  ctx.fillStyle = stageGradient;
  ctx.fillRect(0, 0, surface.width, surface.height);

  const stageFalloff = ctx.createLinearGradient(0, surface.height * 0.18, 0, surface.height);
  stageFalloff.addColorStop(0, "rgba(0,0,0,0)");
  stageFalloff.addColorStop(1, config.stageGradientBottomColor);
  ctx.fillStyle = stageFalloff;
  ctx.fillRect(0, 0, surface.width, surface.height);

  const activeLayers = mode === "single" ? layerPalette.slice(0, 1) : layerPalette;

  activeLayers.forEach((layer, index) => {
    const layerCanvas = getCanvas(
      `46-overlay-layer-${mode}-${index}`,
      config.internalWidth,
      config.internalHeight,
    );

    gradientFieldLayer({
      target: layerCanvas,
      frame,
      layer,
      layerIndex: index,
      drift: quietFieldDrift,
      readableRange: mode === "single" ? hardReadableRange : quietReadableRange,
      distortion: fieldDistortion,
      opacity:
        mode === "single"
          ? config.singleLayerOpacity
          : config.layerOpacity * layer.opacity,
      alphaFloor: config.layerPresence,
    });

    ctx.save();
      ctx.globalAlpha = mode === "single" || index === 0 ? 1 : 0.84;
      ctx.globalCompositeOperation =
        mode === "single" || index === 0 ? "source-over" : "screen";
      ctx.drawImage(layerCanvas, 0, 0);
      ctx.restore();
  });

  return surface;
};

const drawPanelFrame = ({
  ctx,
  x,
  y,
  width,
  title,
  modeLabel,
  footer,
  frame,
  mode,
}: {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  width: number;
  title: string;
  modeLabel: string;
  footer: string;
  frame: number;
  mode: "single" | "stack";
}) => {
  ctx.save();
  ctx.fillStyle = config.panelBackground;
  ctx.strokeStyle = config.panelStroke;
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, x, y, width, config.panelHeight, config.panelRadius);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.font = '600 17px "Courier New", monospace';
  ctx.textBaseline = "top";
  ctx.fillStyle = config.labelColor;
  ctx.fillText(title, x + 24, y + 20);
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.44)";
  ctx.fillText(modeLabel, x + width - 24, y + 20);
  ctx.restore();

  const contentX = x + config.panelContentInset;
  const contentY = y + config.panelHeaderHeight + config.panelContentInset;
  const source = renderPanelSource({ frame, mode });

  ctx.save();
  drawRoundedRect(ctx, contentX, contentY, panelContentWidth, panelContentHeight, 18);
  ctx.clip();
  ctx.fillStyle =
    mode === "single" ? config.stageSingleBaseColor : config.stageBaseColor;
  ctx.fillRect(contentX, contentY, panelContentWidth, panelContentHeight);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(source, contentX, contentY, panelContentWidth, panelContentHeight);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = config.guideLineColor;
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, contentX, contentY, panelContentWidth, panelContentHeight, 18);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.font = '500 15px "Courier New", monospace';
  ctx.textBaseline = "bottom";
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.fillText(footer, contentX, y + config.panelHeight - 18);
  ctx.restore();
};

const drawLayerSwatches = (ctx: CanvasRenderingContext2D) => {
  const swatchY = 150;
  const startX = config.panelInsetX;
  const gap = 18;

  layerPalette.forEach((layer, index) => {
    const x = startX + index * 170;
    const gradient = ctx.createLinearGradient(x, swatchY, x + 52, swatchY + 22);
    gradient.addColorStop(0, layer.colorA);
    gradient.addColorStop(1, layer.colorB);

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.96;
    ctx.beginPath();
    ctx.roundRect(x, swatchY, 52, 22, 10);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.font = '500 13px "Courier New", monospace';
    ctx.fillStyle = "rgba(255,255,255,0.48)";
    ctx.textBaseline = "middle";
    ctx.fillText(layer.name, x + 52 + gap, swatchY + 11);
    ctx.restore();
  });
};

const drawHud = (ctx: CanvasRenderingContext2D, frame: number) => {
  const time = frame / config.fps;

  ctx.save();
  ctx.font = '700 16px "Courier New", monospace';
  ctx.textBaseline = "top";
  ctx.fillStyle = config.accentColor;
  ctx.fillText("AE TIP 03", config.panelInsetX, 48);

  ctx.font = "900 54px Inter, sans-serif";
  ctx.fillStyle = config.textColor;
  ctx.fillText("Overlay Gradient Background", config.panelInsetX, 76);

  ctx.font = '500 20px "Courier New", monospace';
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.fillText(
    "Soft wipe + turbulent distortion + overlay stack for a multi-color AE-like background.",
    config.panelInsetX,
    136,
  );

  const stats = [
    `layers=${config.layerCount}`,
    `feather=${config.wipeFeatherPx}px`,
    `overlay=${config.layerOpacity.toFixed(2)}`,
    `distort=${config.distortAmount}/${config.distortSize}`,
    `t=${time.toFixed(2)}s`,
  ];

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  stats.forEach((line, index) => {
    ctx.fillText(line, W - config.panelInsetX, 56 + index * 24);
  });
  ctx.restore();

  drawLayerSwatches(ctx);
};

const draw = (ctx: CanvasRenderingContext2D, frame: number) => {
  ctx.fillStyle = config.background;
  ctx.fillRect(0, 0, W, H);

  const halo = ctx.createRadialGradient(W * 0.52, H * 0.32, 80, W * 0.52, H * 0.32, 720);
  halo.addColorStop(0, "rgba(142,80,255,0.14)");
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);

  drawHud(ctx, frame);

  const leftPanelX = config.panelInsetX;
  const rightPanelX = leftPanelX + panelWidth + config.panelGap;

  drawPanelFrame({
    ctx,
    x: leftPanelX,
    y: config.panelTop,
    width: panelWidth,
    title: "single gradient layer",
    modeLabel: "source-over / tighter feather",
    footer: "harder edge, one layer only: shows the primitive before stack depth appears",
    frame,
    mode: "single",
  });

  drawPanelFrame({
    ctx,
    x: rightPanelX,
    y: config.panelTop,
    width: panelWidth,
    title: "overlay stack",
    modeLabel: "4 layers / wide feather / overlay",
    footer: "same family of layers, but duplicated and phase-shifted like the AE expression setup",
    frame,
    mode: "stack",
  });

  ctx.save();
  ctx.font = '500 16px "Courier New", monospace';
  ctx.textBaseline = "bottom";
  ctx.fillStyle = "rgba(255,255,255,0.46)";
  ctx.fillText(
    "Expression target: index * 45 + time * index * 20  |  Comparison: source-over single layer vs overlay multi-layer stack",
    config.panelInsetX,
    H - 34,
  );
  ctx.restore();

  drawDust(ctx, frame, 6, "rgba(255,255,255,0.04)");
  drawVignette(ctx, 0.24);
};

export const AETipOverlayGradientBackground: React.FC = () => {
  const stableDraw = useCallback(draw, []);
  return <CanvasScene draw={stableDraw} />;
};
