import {
  Application,
  BlurFilter,
  Container,
  Graphics,
  Text,
} from "pixi.js";
import { motifLoopBackgroundFixtures } from "./fixtures";
import {
  evaluateMotifLoopBackgroundFrame,
  motifLayout,
  type MotifFrameState,
  type MotifLayoutState,
  type MotifLoopBackgroundFrameState,
} from "./motif-loop-background.evaluator";
import { motifLoopBackgroundConfig } from "./motif-loop-background.config";

type MotifLoopBackgroundScene = {
  destroy: () => void;
  update: (state: MotifLoopBackgroundFrameState) => void;
};

type MotifView = {
  container: Container;
  blurFilter: BlurFilter;
  glow: Graphics;
  outline: Graphics;
  bar: Graphics;
  accent: Graphics;
};

const palette = {
  stage: 0x08090c,
  baseGlow: 0x9f5d35,
  coolGlow: 0x3a4758,
  plateFill: 0x0f1116,
  plateBorder: 0xede2cb,
  plateMuted: 0xcbb997,
  barFill: 0xf1e6cf,
  wash: 0x030304,
} as const;

function drawBackgroundGrid(graphics: Graphics) {
  graphics.clear();
  graphics.rect(
    0,
    0,
    motifLoopBackgroundConfig.size.width,
    motifLoopBackgroundConfig.size.height,
  ).fill({
    color: palette.stage,
    alpha: 1,
  });

  const rowLines = Array.from({ length: 7 }, (_, index) => index);
  const columnLines = Array.from({ length: 9 }, (_, index) => index);

  for (const rowIndex of rowLines) {
    const y =
      96 +
      rowIndex *
        ((motifLoopBackgroundConfig.size.height - 192) / (rowLines.length - 1));

    graphics.moveTo(64, y);
    graphics.lineTo(motifLoopBackgroundConfig.size.width - 64, y);
  }

  for (const columnIndex of columnLines) {
    const x =
      84 +
      columnIndex *
        ((motifLoopBackgroundConfig.size.width - 168) /
          (columnLines.length - 1));

    graphics.moveTo(x, 60);
    graphics.lineTo(x, motifLoopBackgroundConfig.size.height - 60);
  }

  graphics.stroke({
    color: 0xffffff,
    alpha: 0.05,
    width: 1,
  });
}

function drawAmbientGlow(
  graphics: Graphics,
  width: number,
  height: number,
  color: number,
  alpha: number,
) {
  graphics.clear();
  graphics.ellipse(0, 0, width, height).fill({
    color,
    alpha,
  });
}

/**
 * Work 05 専用の motif glyph。
 * 形は narrow proof 用に固定し、汎用 primitive 化しない。
 */
function createMotifView(layout: MotifLayoutState): MotifView {
  const container = new Container();
  const blurFilter = new BlurFilter();
  blurFilter.quality = 3;

  const glow = new Graphics();
  glow.ellipse(0, 0, 92, 72).fill({
    color: layout.tint,
    alpha: 0.06,
  });

  const outline = new Graphics();
  const bar = new Graphics();
  const accent = new Graphics();

  if (layout.variant === "ring") {
    outline.circle(0, 0, 52).stroke({
      color: layout.tint,
      alpha: 0.9,
      width: 2,
    });
    outline.roundRect(-46, -20, 92, 40, 20).stroke({
      color: layout.tint,
      alpha: 0.78,
      width: 2,
    });
    bar.roundRect(-34, -6, 68, 12, 6).fill({
      color: layout.tint,
      alpha: 0.66,
    });
    accent.circle(62, 0, 6).fill({
      color: layout.tint,
      alpha: 0.84,
    });
  }

  if (layout.variant === "capsule") {
    outline.roundRect(-56, -34, 112, 68, 34).stroke({
      color: layout.tint,
      alpha: 0.82,
      width: 2,
    });
    outline.roundRect(-26, -64, 52, 128, 26).stroke({
      color: layout.tint,
      alpha: 0.72,
      width: 2,
    });
    bar.roundRect(-40, -8, 80, 16, 8).fill({
      color: layout.tint,
      alpha: 0.68,
    });
    accent.circle(0, -74, 5).fill({
      color: layout.tint,
      alpha: 0.8,
    });
  }

  if (layout.variant === "orbit") {
    outline.circle(0, 0, 48).stroke({
      color: layout.tint,
      alpha: 0.76,
      width: 2,
    });
    outline.circle(0, 0, 70).stroke({
      color: layout.tint,
      alpha: 0.56,
      width: 2,
    });
    bar.roundRect(-18, -50, 36, 100, 18).fill({
      color: layout.tint,
      alpha: 0.54,
    });
    accent.circle(-72, 0, 6).fill({
      color: layout.tint,
      alpha: 0.78,
    });
    accent.circle(72, 0, 6).fill({
      color: layout.tint,
      alpha: 0.78,
    });
  }

  container.addChild(glow, outline, bar, accent);
  container.filters = [blurFilter];

  return {
    container,
    blurFilter,
    glow,
    outline,
    bar,
    accent,
  };
}

function drawReadabilityPlate(graphics: Graphics) {
  const { x, y, width, height, radius } = motifLoopBackgroundConfig.readabilityPlate;

  graphics.clear();
  graphics.roundRect(x, y, width, height, radius).fill({
    color: palette.plateFill,
    alpha: 0.9,
  });
  graphics.roundRect(x, y, width, height, radius).stroke({
    color: palette.plateBorder,
    alpha: 0.14,
    width: 1.5,
  });

  const bars = [
    { x: x + 44, y: y + 72, width: 136, height: 10, alpha: 0.34 },
    { x: x + 44, y: y + 120, width: width - 88, height: 22, alpha: 0.84 },
    { x: x + 44, y: y + 164, width: width - 132, height: 18, alpha: 0.5 },
    { x: x + 44, y: y + 272, width: width - 88, height: 14, alpha: 0.18 },
    { x: x + 44, y: y + 304, width: width - 112, height: 14, alpha: 0.16 },
    { x: x + 44, y: y + 336, width: width - 154, height: 14, alpha: 0.16 },
    { x: x + 44, y: y + 408, width: 108, height: 38, alpha: 0.82 },
    { x: x + 168, y: y + 408, width: 86, height: 38, alpha: 0.12 },
    { x: x + 44, y: y + 500, width: width - 88, height: 1, alpha: 0.08 },
  ];

  for (const bar of bars) {
    graphics.roundRect(bar.x, bar.y, bar.width, bar.height, bar.height / 2).fill({
      color: palette.barFill,
      alpha: bar.alpha,
    });
  }
}

export async function createMotifLoopBackgroundScene({
  host,
}: {
  host: HTMLDivElement;
}): Promise<MotifLoopBackgroundScene> {
  if (!host.isConnected) {
    throw new Error(
      "Motif Loop Background host is not connected. The PixiJS surface cannot mount into a detached node.",
    );
  }

  const app = new Application();

  await app.init({
    width: motifLoopBackgroundConfig.size.width,
    height: motifLoopBackgroundConfig.size.height,
    antialias: true,
    autoDensity: true,
    autoStart: false,
    backgroundAlpha: 0,
    resolution: window.devicePixelRatio || 1,
  });

  app.canvas.style.display = "block";
  app.canvas.style.width = "100%";
  app.canvas.style.height = "100%";
  host.appendChild(app.canvas);

  const backgroundGrid = new Graphics();
  drawBackgroundGrid(backgroundGrid);
  app.stage.addChild(backgroundGrid);

  const warmGlow = new Graphics();
  drawAmbientGlow(warmGlow, 440, 280, palette.baseGlow, 0.16);
  warmGlow.position.set(320, 220);
  warmGlow.filters = [Object.assign(new BlurFilter(), { strength: 28, quality: 4 })];

  const coolGlow = new Graphics();
  drawAmbientGlow(coolGlow, 380, 240, palette.coolGlow, 0.14);
  coolGlow.position.set(1080, 720);
  coolGlow.filters = [Object.assign(new BlurFilter(), { strength: 26, quality: 4 })];
  app.stage.addChild(warmGlow, coolGlow);

  const motifLayer = new Container();
  app.stage.addChild(motifLayer);

  const motifViews = Array.from(
    { length: motifLoopBackgroundConfig.motifCount },
    (_, index) => createMotifView(motifLayout(index)),
  );

  for (const motifView of motifViews) {
    motifLayer.addChild(motifView.container);
  }

  const safetyWash = new Graphics();
  safetyWash.rect(
    0,
    0,
    motifLoopBackgroundConfig.size.width,
    motifLoopBackgroundConfig.size.height,
  ).fill({
    color: palette.wash,
    alpha: motifLoopBackgroundConfig.clamp.minWashAlpha,
  });
  app.stage.addChild(safetyWash);

  const plateShadow = new Graphics();
  const { x, y, width, height, radius } = motifLoopBackgroundConfig.readabilityPlate;
  plateShadow.roundRect(x - 12, y + 20, width + 24, height + 24, radius + 12).fill({
    color: 0x000000,
    alpha: 0.32,
  });
  plateShadow.filters = [Object.assign(new BlurFilter(), { strength: 24, quality: 4 })];
  app.stage.addChild(plateShadow);

  const readabilityPlate = new Graphics();
  drawReadabilityPlate(readabilityPlate);
  app.stage.addChild(readabilityPlate);

  const runtimeLabel = new Text({
    text: motifLoopBackgroundFixtures.runtimeLabel,
    style: {
      fontFamily: "Noto Sans JP, sans-serif",
      fontSize: 14,
      fontWeight: "500",
      fill: palette.plateMuted,
      letterSpacing: 1.8,
    },
  });
  runtimeLabel.position.set(72, motifLoopBackgroundConfig.size.height - 54);
  runtimeLabel.alpha = 0.58;
  app.stage.addChild(runtimeLabel);

  const updateMotifView = (motifView: MotifView, motifState: MotifFrameState) => {
    motifView.container.position.set(motifState.x, motifState.y);
    motifView.container.scale.set(motifState.scale);
    motifView.container.rotation = motifState.rotation;
    motifView.container.alpha = motifState.alpha;
    motifView.blurFilter.strength = motifState.blurStrength;
    motifView.glow.alpha = motifState.glowAlpha;
    motifView.outline.alpha = motifState.alpha;
    motifView.bar.alpha = motifState.accentAlpha;
    motifView.accent.alpha = motifState.accentAlpha;
  };

  const update = (state: MotifLoopBackgroundFrameState) => {
    warmGlow.position.set(320 + state.fieldDriftX, 220 + state.fieldDriftY);
    coolGlow.position.set(1080 - state.fieldDriftX * 0.7, 720 - state.fieldDriftY * 0.6);
    safetyWash.alpha = state.washAlpha;
    plateShadow.alpha = state.plateShadowAlpha;

    for (const [index, motifState] of state.motifs.entries()) {
      updateMotifView(motifViews[index], motifState);
    }

    app.render();
  };

  update(evaluateMotifLoopBackgroundFrame(0));

  return {
    destroy: () => {
      host.innerHTML = "";

      for (const motifView of motifViews) {
        motifView.blurFilter.destroy();
      }

      for (const filter of warmGlow.filters ?? []) {
        filter.destroy();
      }

      for (const filter of coolGlow.filters ?? []) {
        filter.destroy();
      }

      for (const filter of plateShadow.filters ?? []) {
        filter.destroy();
      }

      app.destroy(true, {
        children: true,
        texture: true,
        textureSource: true,
      });
    },
    update,
  };
}
