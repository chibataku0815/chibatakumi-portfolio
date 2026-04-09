import React from "react";
import {
  CanvasScene,
  H,
  W,
  drawDust,
  drawVignette,
} from "../../lib/canvas-primitives";
import {
  config,
  panelContentHeight,
  panelContentWidth,
  panels,
  panelWidth,
} from "./config";
import {
  drawGrainOverlay,
  drawRoundedRect,
  getReusableCanvas,
} from "./lib/canvas-utils";
import { renderOrganicGradient } from "./lib/organic-gradient";
import {
  renderMarbleWithWebGL,
  renderSmokeWithWebGL,
} from "../../lib/ae-tips/mooograph-gradient-backgrounds";

const drawTopHeading = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = config.headingLabelColor;
  ctx.font = '700 18px "Avenir Next", "Hiragino Sans", sans-serif';
  ctx.fillText(config.label, config.panelInsetX, 78);

  ctx.fillStyle = config.headingTitleColor;
  ctx.font = '700 46px "Avenir Next", "Hiragino Sans", sans-serif';
  ctx.fillText(config.title, config.panelInsetX, 126);

  ctx.fillStyle = config.headingBodyColor;
  ctx.font = '500 18px "Avenir Next", "Hiragino Sans", sans-serif';
  ctx.fillText(
    "Convert the three AE background recipes into reusable Remotion renderers.",
    config.panelInsetX,
    154,
  );
};

const renderPanelSource = ({
  target,
  panelIndex,
  frame,
}: {
  target: HTMLCanvasElement;
  panelIndex: number;
  frame: number;
}) => {
  const panel = panels[panelIndex];
  const time = frame / config.fps;
  const loopProgress = frame / Math.max(1, config.totalFrames - 1);

  if (panel.kind === "organic") {
    const ctx = target.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, target.width, target.height);
    renderOrganicGradient({
      target,
      time,
      recipe: panel.recipe,
    });
    return;
  }

  if (panel.kind === "smoke") {
    renderSmokeWithWebGL({
      cacheKey: `71-smoke-webgl-${panelIndex}`,
      target,
      time,
      recipe: panel.recipe,
    });
    return;
  }

  renderMarbleWithWebGL({
    cacheKey: `71-marble-webgl-${panelIndex}`,
    target,
    time,
    loopProgress,
    recipe: panel.recipe,
  });
};

const drawPanel = ({
  ctx,
  x,
  y,
  width,
  title,
  label,
  note,
  source,
  seed,
}: {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  width: number;
  title: string;
  label: string;
  note: string;
  source: HTMLCanvasElement | null;
  seed: number;
}) => {
  ctx.save();
  drawRoundedRect(ctx, x, y, width, config.panelHeight, config.panelRadius);
  ctx.fillStyle = config.panelBackground;
  ctx.fill();
  ctx.strokeStyle = config.panelStroke;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = config.panelMetaColor;
  ctx.font = '700 13px "Avenir Next", "Hiragino Sans", sans-serif';
  ctx.fillText(label.toUpperCase(), x + config.panelPadding, y + 34);

  ctx.fillStyle = config.panelTitleColor;
  ctx.font = '700 28px "Avenir Next", "Hiragino Sans", sans-serif';
  ctx.fillText(title, x + config.panelPadding, y + 68);

  const contentX = x + config.panelPadding;
  const contentY = y + config.panelHeaderHeight + config.panelPadding;

  ctx.save();
  drawRoundedRect(
    ctx,
    contentX,
    contentY,
    panelContentWidth,
    panelContentHeight,
    24,
  );
  ctx.clip();

  if (source) {
    ctx.drawImage(source, contentX, contentY, panelContentWidth, panelContentHeight);
  } else {
    ctx.fillStyle = "#11151f";
    ctx.fillRect(contentX, contentY, panelContentWidth, panelContentHeight);
  }

  drawGrainOverlay({
    ctx,
    x: contentX,
    y: contentY,
    width: panelContentWidth,
    height: panelContentHeight,
    density: 0.08,
    seed,
  });
  ctx.restore();

  ctx.strokeStyle = config.guideColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(contentX, contentY, panelContentWidth, panelContentHeight);

  ctx.fillStyle = config.panelNoteColor;
  ctx.font = '500 16px "Avenir Next", "Hiragino Sans", sans-serif';
  ctx.fillText(
    note,
    x + config.panelPadding,
    y + config.panelHeight - 20,
    width - config.panelPadding * 2,
  );
};

const drawBackground = (ctx: CanvasRenderingContext2D, frame: number) => {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = config.background;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(
    W * 0.52,
    H * 0.46,
    0,
    W * 0.52,
    H * 0.46,
    W * 0.58,
  );
  glow.addColorStop(0, "rgba(88,110,255,0.16)");
  glow.addColorStop(0.36, "rgba(255,112,182,0.08)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const bottomWash = ctx.createLinearGradient(0, H * 0.6, 0, H);
  bottomWash.addColorStop(0, "rgba(0,0,0,0)");
  bottomWash.addColorStop(1, "rgba(0,0,0,0.34)");
  ctx.fillStyle = bottomWash;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = config.guideColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(config.panelInsetX, config.panelTop - 28);
  ctx.lineTo(W - config.panelInsetX, config.panelTop - 28);
  ctx.stroke();

  drawDust(ctx, frame, 8, "rgba(255,250,240,0.05)");
  drawVignette(ctx, 0.24);
};

const drawScene = (ctx: CanvasRenderingContext2D, frame: number) => {
  drawBackground(ctx, frame);
  drawTopHeading(ctx);

  panels.forEach((panel, index) => {
    const source = getReusableCanvas(
      `71-showcase-source-${index}`,
      config.internalWidth,
      config.internalHeight,
    );

    if (source) {
      renderPanelSource({
        target: source,
        panelIndex: index,
        frame,
      });
    }

    drawPanel({
      ctx,
      x: config.panelInsetX + index * (panelWidth + config.panelGap),
      y: config.panelTop,
      width: panelWidth,
      title: panel.title,
      label: panel.recipe.label,
      note: panel.recipe.note,
      source,
      seed: index + 1,
    });
  });
};

export const AETipMooographGradientBackgrounds: React.FC = () => {
  return (
    <div style={{ width: "100%", height: "100%", background: config.background }}>
      <CanvasScene draw={drawScene} />
    </div>
  );
};
