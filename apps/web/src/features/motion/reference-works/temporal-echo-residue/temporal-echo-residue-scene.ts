import { Application, Container, Graphics } from "pixi.js";
import { temporalEchoResidueConfig } from "./temporal-echo-residue.config";
import type { TemporalEchoResidueFrameState } from "./temporal-echo-residue.evaluator";

type TemporalEchoResidueScene = {
  destroy: () => void;
  rendererName: string;
  update: (state: TemporalEchoResidueFrameState) => void;
};

const palette = {
  stage: 0x05060a,
  stageLift: 0x101521,
  rail: 0x213146,
  railGlow: 0x5d8fbe,
  echoCool: 0xb8d3ff,
  echoWarm: 0xf2c8a0,
  lead: 0xf7f0e2,
  leadAccent: 0xff8e5f,
  shadow: 0x000000,
} as const;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function mix(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

function drawShard(
  graphics: Graphics,
  options: {
    width: number;
    height: number;
    fillAlpha: number;
    strokeAlpha: number;
    strokeWidth: number;
    fillColor: number;
    strokeColor: number;
  },
) {
  const halfWidth = options.width / 2;
  const halfHeight = options.height / 2;

  graphics
    .moveTo(-halfWidth, 0)
    .lineTo(-halfWidth * 0.24, -halfHeight * 0.92)
    .lineTo(halfWidth * 0.55, -halfHeight * 0.62)
    .lineTo(halfWidth, 0)
    .lineTo(halfWidth * 0.55, halfHeight * 0.62)
    .lineTo(-halfWidth * 0.24, halfHeight * 0.92)
    .closePath()
    .fill({
      alpha: options.fillAlpha,
      color: options.fillColor,
    })
    .stroke({
      alpha: options.strokeAlpha,
      color: options.strokeColor,
      width: options.strokeWidth,
    });
}

function drawBackground(
  graphics: Graphics,
  state: TemporalEchoResidueFrameState,
) {
  graphics.clear();
  graphics.rect(
    0,
    0,
    temporalEchoResidueConfig.size.width,
    temporalEchoResidueConfig.size.height,
  );
  graphics.fill({ color: palette.stage, alpha: 1 });

  graphics.circle(
    temporalEchoResidueConfig.size.width * 0.5 + state.backgroundDrift,
    temporalEchoResidueConfig.size.height * 0.42,
    340,
  );
  graphics.fill({ color: palette.stageLift, alpha: 0.72 });

  graphics.roundRect(
    106,
    temporalEchoResidueConfig.subject.centerY - 134,
    temporalEchoResidueConfig.size.width - 212,
    268,
    134,
  );
  graphics.stroke({
    alpha: 0.12,
    color: palette.rail,
    width: 2,
  });
}

function drawRail(graphics: Graphics, state: TemporalEchoResidueFrameState) {
  const startX = temporalEchoResidueConfig.subject.startX - 36;
  const endX = temporalEchoResidueConfig.subject.endX + 36;
  const centerY = temporalEchoResidueConfig.subject.centerY + 8;
  const controlY = centerY - temporalEchoResidueConfig.subject.arcHeight * 0.58;

  graphics.clear();
  graphics
    .moveTo(startX, centerY)
    .bezierCurveTo(
      startX + 240,
      controlY,
      endX - 240,
      controlY,
      endX,
      centerY,
    )
    .stroke({
      alpha: 0.2,
      color: palette.rail,
      width: 3,
    });

  graphics
    .moveTo(startX, centerY)
    .bezierCurveTo(
      startX + 240,
      controlY,
      endX - 240,
      controlY,
      endX,
      centerY,
    )
    .stroke({
      alpha: state.railGlowAlpha,
      color: palette.railGlow,
      width: 1.25,
    });
}

export async function createTemporalEchoResidueScene({
  host,
}: {
  host: HTMLDivElement;
}): Promise<TemporalEchoResidueScene> {
  if (!host) {
    throw new Error(
      "Temporal Echo Residue scene could not initialize because the host element was missing.",
    );
  }

  const app = new Application();

  await app.init({
    width: temporalEchoResidueConfig.size.width,
    height: temporalEchoResidueConfig.size.height,
    antialias: true,
    autoDensity: true,
    autoStart: false,
    backgroundAlpha: 0,
    powerPreference: "high-performance",
    preference: "webgpu",
    resolution: window.devicePixelRatio || 1,
  });

  app.canvas.style.display = "block";
  app.canvas.style.width = "100%";
  app.canvas.style.height = "100%";
  host.appendChild(app.canvas);

  const background = new Graphics();
  const rail = new Graphics();
  const echoContainer = new Container();
  const echoGraphics = Array.from(
    { length: temporalEchoResidueConfig.echo.sampleCount },
    () => {
      const echoGraphic = new Graphics();
      echoContainer.addChild(echoGraphic);
      return echoGraphic;
    },
  );
  const leadShadow = new Graphics();
  const leadGlow = new Graphics();
  const leadShard = new Graphics();
  const leadCore = new Graphics();

  app.stage.addChild(background);
  app.stage.addChild(rail);
  app.stage.addChild(echoContainer);
  app.stage.addChild(leadShadow);
  app.stage.addChild(leadGlow);
  app.stage.addChild(leadShard);
  app.stage.addChild(leadCore);

  const update = (state: TemporalEchoResidueFrameState) => {
    drawBackground(background, state);
    drawRail(rail, state);

    echoGraphics.forEach((graphic, index) => {
      const sample = state.echoes[index];

      graphic.clear();

      if (!sample) {
        return;
      }

      const colorMix = sample.index / Math.max(state.echoes.length - 1, 1);
      const fillAlpha = sample.alpha * 0.34;
      const strokeAlpha = sample.alpha * 1.08;

      drawShard(graphic, {
        width:
          temporalEchoResidueConfig.subject.width *
          sample.scale *
          sample.stretchX,
        height:
          temporalEchoResidueConfig.subject.height *
          sample.scale *
          sample.stretchY,
        fillAlpha,
        strokeAlpha,
        strokeWidth: mix(5.4, 1.8, colorMix),
        fillColor: palette.echoCool,
        strokeColor: colorMix > 0.45 ? palette.echoWarm : palette.echoCool,
      });

      graphic.position.set(sample.x, sample.y);
      graphic.rotation = sample.rotation;
    });

    leadShadow.clear();
    leadShadow.ellipse(
      state.lead.x,
      temporalEchoResidueConfig.subject.centerY + 118,
      126,
      24,
    );
    leadShadow.fill({ color: palette.shadow, alpha: 0.26 });

    leadGlow.clear();
    leadGlow.circle(state.lead.x, state.lead.y, 104 + state.lead.speed * 1.4);
    leadGlow.fill({
      alpha: 0.12 + clamp01(state.lead.speed / 18) * 0.16,
      color: palette.leadAccent,
    });

    leadShard.clear();
    drawShard(leadShard, {
      width:
        temporalEchoResidueConfig.subject.width *
        state.lead.scale *
        state.lead.stretchX,
      height:
        temporalEchoResidueConfig.subject.height *
        state.lead.scale *
        state.lead.stretchY,
      fillAlpha: 0.92,
      strokeAlpha: 1,
      strokeWidth: 4,
      fillColor: palette.lead,
      strokeColor: palette.leadAccent,
    });
    leadShard.position.set(state.lead.x, state.lead.y);
    leadShard.rotation = state.lead.rotation;

    leadCore.clear();
    leadCore
      .moveTo(-76, 0)
      .lineTo(22, 0)
      .stroke({
        alpha: 0.9,
        color: palette.stage,
        width: 5,
      });
    leadCore.circle(46, 0, 8);
    leadCore.fill({ color: palette.leadAccent, alpha: 1 });
    leadCore.position.set(state.lead.x, state.lead.y);
    leadCore.rotation = state.lead.rotation;

    app.render();
  };

  return {
    destroy: () => {
      app.destroy(true, {
        children: true,
      });
    },
    rendererName: app.renderer.constructor.name,
    update,
  };
}
