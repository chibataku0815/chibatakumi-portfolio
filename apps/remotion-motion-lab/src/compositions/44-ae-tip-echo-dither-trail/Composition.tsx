import React, { useCallback } from "react";
import {
  CanvasScene,
  H,
  W,
  drawDust,
  drawVignette,
} from "../../lib/canvas-primitives";
import { config, panelWidth } from "./config";
import { applyOrderedDither } from "./lib/ordered-dither";
import { getTemporalEchoSamples } from "./lib/temporal-echo";

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

const getMotionState = (frame: number, panelHeight: number) => {
  const wrappedFrame =
    ((frame % config.loopFrames) + config.loopFrames) % config.loopFrames;
  const t = wrappedFrame / config.loopFrames;
  const angle = t * Math.PI * 2;
  const x =
    panelWidth / 2 +
    Math.cos(angle * 0.85 - Math.PI / 2) * config.path.xAmplitude +
    Math.sin(angle * 2.2) * config.path.secondaryXAmplitude;
  const y =
    panelHeight / 2 +
    Math.sin(angle * 1.25) * config.path.yAmplitude +
    Math.cos(angle * 2.7) * config.path.secondaryYAmplitude;
  const rotation = (frame / config.fps) * config.rotationSpeed;

  return { x, y, rotation };
};

const drawGuidePath = (
  ctx: CanvasRenderingContext2D,
  panelHeight: number,
) => {
  ctx.save();
  ctx.strokeStyle = config.guideColor;
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 12]);

  for (let step = 0; step <= config.loopFrames; step += 4) {
    const point = getMotionState(step, panelHeight);
    if (step === 0) {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      continue;
    }

    ctx.lineTo(point.x, point.y);
  }

  ctx.stroke();
  ctx.restore();
};

const drawEchoLayer = (
  ctx: CanvasRenderingContext2D,
  frame: number,
  fps: number,
  panelHeight: number,
) => {
  const samples = getTemporalEchoSamples({
    frame,
    echoCount: config.echoCount,
    echoStepFrames: config.echoStepFrames,
    decay: config.decay,
  });

  drawGuidePath(ctx, panelHeight);

  for (const sample of samples) {
    const state = getMotionState(sample.sampleFrame, panelHeight);
    const isCurrent = sample.age === 0;
    const scale = isCurrent ? 1 : 1 - sample.normalizedAge * 0.22;
    const alpha = isCurrent
      ? 1
      : clamp(sample.opacity * (0.96 - sample.normalizedAge * 0.18), 0, 1);

    if (alpha <= 0.01) {
      continue;
    }

    ctx.save();
    ctx.translate(state.x, state.y);
    ctx.rotate((state.rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = config.shapeColor;
    ctx.fillRect(
      -config.shapeSize / 2,
      -config.shapeSize / 2,
      config.shapeSize,
      config.shapeSize,
    );

    if (isCurrent) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = config.accentColor;
      ctx.strokeRect(
        -config.shapeSize / 2,
        -config.shapeSize / 2,
        config.shapeSize,
        config.shapeSize,
      );
    }

    ctx.restore();
  }

  const current = getMotionState(frame, panelHeight);
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.arc(current.x, current.y, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Touch fps so the signature stays aligned with CanvasScene draw args.
  void fps;
};

const drawPanelFrame = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  modeLabel: string,
) => {
  ctx.save();
  ctx.fillStyle = "#0d0d0d";
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, config.panelRadius);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.font = '600 18px "Courier New", monospace';
  ctx.textBaseline = "top";
  ctx.fillStyle = config.labelColor;
  ctx.fillText(title, x + 24, y + 20);
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.textAlign = "right";
  ctx.fillText(modeLabel, x + width - 24, y + 20);
  ctx.restore();
};

const drawHud = (ctx: CanvasRenderingContext2D) => {
  ctx.save();
  ctx.font = '700 16px "Courier New", monospace';
  ctx.textBaseline = "top";
  ctx.fillStyle = config.accentColor;
  ctx.fillText("AE TIP 01", config.panelInsetX, 48);

  ctx.font = "900 54px Inter, sans-serif";
  ctx.fillStyle = "#f7f2e9";
  ctx.fillText("Echo + Dither Trail", config.panelInsetX, 76);

  ctx.font = '500 20px "Courier New", monospace';
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText(
    "Temporal sampling + decay + ordered dither roughens the residual alpha.",
    config.panelInsetX,
    136,
  );

  const stats = [
    `echoCount=${config.echoCount}`,
    `echoStep=${config.echoStepFrames}f`,
    `decay=${config.decay.toFixed(2)}`,
    `threshold=${config.threshold.toFixed(2)}`,
    `rotation=${config.rotationSpeed}deg/s`,
  ];

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  stats.forEach((line, index) => {
    ctx.fillText(line, W - config.panelInsetX, 56 + index * 24);
  });
  ctx.restore();
};

const draw = (ctx: CanvasRenderingContext2D, frame: number, fps: number) => {
  ctx.fillStyle = config.background;
  ctx.fillRect(0, 0, W, H);

  drawHud(ctx);

  const alphaPanelX = config.panelInsetX;
  const ditherPanelX = alphaPanelX + panelWidth + config.panelGap;
  const panelY = config.panelTop;
  const contentY = panelY + 56;
  const contentHeight = config.panelHeight - 82;

  drawPanelFrame(
    ctx,
    alphaPanelX,
    panelY,
    panelWidth,
    config.panelHeight,
    "normal alpha trail",
    "smooth fade",
  );
  drawPanelFrame(
    ctx,
    ditherPanelX,
    panelY,
    panelWidth,
    config.panelHeight,
    "dither trail",
    config.ditherEnabled ? "ordered 4x4" : "disabled",
  );

  const alphaSource = getCanvas("alpha-source", panelWidth, contentHeight);
  const ditherSource = getCanvas("dither-source", panelWidth, contentHeight);
  const ditherTarget = getCanvas("dither-target", panelWidth, contentHeight);
  const alphaContext = alphaSource.getContext("2d");
  const ditherContext = ditherSource.getContext("2d");

  if (!alphaContext || !ditherContext) {
    return;
  }

  alphaContext.clearRect(0, 0, panelWidth, contentHeight);
  ditherContext.clearRect(0, 0, panelWidth, contentHeight);

  drawEchoLayer(alphaContext, frame, fps, contentHeight);
  drawEchoLayer(ditherContext, frame, fps, contentHeight);

  ctx.drawImage(alphaSource, alphaPanelX, contentY);

  if (config.ditherEnabled) {
    applyOrderedDither(ditherSource, ditherTarget, {
      pixelSize: config.ditherPixelSize,
      threshold: config.threshold,
    });
    ctx.drawImage(ditherTarget, ditherPanelX, contentY);
  } else {
    ctx.drawImage(ditherSource, ditherPanelX, contentY);
  }

  ctx.save();
  ctx.font = '500 16px "Courier New", monospace';
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.textBaseline = "bottom";
  ctx.fillText(
    "same motion source on both sides; only the trail compositing changes",
    config.panelInsetX,
    H - 36,
  );
  ctx.restore();

  drawDust(ctx, frame, 5, "rgba(255,255,255,0.05)");
  drawVignette(ctx, 0.18);
};

export const AETipEchoDitherTrail: React.FC = () => {
  const stableDraw = useCallback(draw, []);
  return <CanvasScene draw={stableDraw} />;
};
