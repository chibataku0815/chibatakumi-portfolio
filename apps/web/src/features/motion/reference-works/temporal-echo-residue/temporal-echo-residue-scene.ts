import { Application, Container, Graphics, Text } from "pixi.js";
import { temporalEchoResidueConfig } from "./temporal-echo-residue.config";
import type {
  TemporalEchoResidueCueState,
  TemporalEchoResidueFrameState,
} from "./temporal-echo-residue.evaluator";

type TemporalEchoResidueScene = {
  destroy: () => void;
  rendererName: string;
  update: (state: TemporalEchoResidueFrameState) => void;
};

type CueVisual = {
  aura: Graphics;
  leadOutline: Container;
  leadCore: Container;
  echoContainers: Container[];
};

type GlyphVariant = "outline" | "core";

const FONT_STACK = '"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif';

const palette = {
  cool: {
    stage: 0x07133b,
    halo: 0xd7ff2a,
    lift: 0x4ab7d9,
    edge: 0x1e0a54,
    outline: "#d8f6ff",
    echo: "#c0e8ff",
    core: "#f6ffff",
    aura: 0xdeffff,
  },
  warm: {
    stage: 0xb91b06,
    halo: 0xffd91e,
    lift: 0xff8b20,
    edge: 0xf22715,
    outline: "#fff0c0",
    echo: "#ffe19b",
    core: "#fff8ee",
    aura: 0xfff2cc,
  },
} as const;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function mix(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

function mixColor(from: number, to: number, amount: number) {
  const red = Math.round(mix((from >> 16) & 0xff, (to >> 16) & 0xff, amount));
  const green = Math.round(mix((from >> 8) & 0xff, (to >> 8) & 0xff, amount));
  const blue = Math.round(mix(from & 0xff, to & 0xff, amount));

  return (red << 16) | (green << 8) | blue;
}

function cuePalette(cue: TemporalEchoResidueCueState) {
  return cue.world === "warm" ? palette.warm : palette.cool;
}

function cueRadius(cue: TemporalEchoResidueCueState) {
  const glyphCount = Array.from(cue.text).length;

  return cue.fontSize * (cue.orientation === "vertical" ? 0.78 : 0.62) + glyphCount * 12;
}

function fillSoftCircle(
  graphics: Graphics,
  x: number,
  y: number,
  radius: number,
  color: number,
  alpha: number,
) {
  graphics.circle(x, y, radius);
  graphics.fill({ color, alpha: alpha * 0.22 });

  graphics.circle(x, y, radius * 0.72);
  graphics.fill({ color, alpha: alpha * 0.18 });

  graphics.circle(x, y, radius * 0.46);
  graphics.fill({ color, alpha: alpha * 0.14 });
}

function createGlyphContainer(
  cue: TemporalEchoResidueCueState,
  variant: GlyphVariant,
): Container {
  const container = new Container();
  const colors = cuePalette(cue);
  const glyphs = Array.from(cue.text);
  let offset = 0;

  for (const glyph of glyphs) {
    const strokeWidth =
      variant === "core"
        ? Math.max(2, cue.fontSize * 0.05)
        : Math.max(1.25, cue.fontSize * 0.028);
    const text = new Text({
      text: glyph,
      style: {
        fontFamily: FONT_STACK,
        fontSize: cue.fontSize,
        fontWeight: cue.fontWeight,
        fill:
          variant === "core"
            ? colors.core
            : cue.world === "warm"
              ? "rgba(255,244,210,0.18)"
              : "rgba(214,244,255,0.12)",
        stroke: {
          color: variant === "core" ? colors.outline : colors.echo,
          join: "round",
          width: strokeWidth,
        },
      },
    });

    if (cue.orientation === "vertical") {
      text.x = 0;
      text.y = offset;
      offset += cue.fontSize * cue.glyphGap;
    } else {
      text.x = offset;
      text.y = 0;
      offset += cue.fontSize * cue.glyphGap;
    }

    container.addChild(text);
  }

  const bounds = container.getLocalBounds();
  container.pivot.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);

  return container;
}

function setCueTransform(
  container: Container,
  pose: {
    x: number;
    y: number;
    rotation: number;
    scale: number;
    stretchX: number;
    stretchY: number;
  },
) {
  container.position.set(pose.x, pose.y);
  container.rotation = pose.rotation;
  container.scale.set(pose.scale * pose.stretchX, pose.scale * pose.stretchY);
}

function ensureCueVisual(
  cue: TemporalEchoResidueCueState,
  cueRoot: Container,
  cueVisuals: Map<string, CueVisual>,
) {
  const existing = cueVisuals.get(cue.id);

  if (existing) {
    return existing;
  }

  const aura = new Graphics();
  const leadOutline = createGlyphContainer(cue, "outline");
  const leadCore = createGlyphContainer(cue, "core");
  const echoContainers = Array.from(
    { length: temporalEchoResidueConfig.echo.sampleCount },
    () => createGlyphContainer(cue, "outline"),
  );

  cueRoot.addChild(aura, ...echoContainers, leadOutline, leadCore);

  const visual = {
    aura,
    leadOutline,
    leadCore,
    echoContainers,
  };

  cueVisuals.set(cue.id, visual);

  return visual;
}

function hideCueVisual(visual: CueVisual) {
  visual.aura.clear();
  visual.leadOutline.alpha = 0;
  visual.leadCore.alpha = 0;

  for (const echoContainer of visual.echoContainers) {
    echoContainer.alpha = 0;
  }
}

function drawBackground(graphics: Graphics, state: TemporalEchoResidueFrameState) {
  const { width, height } = temporalEchoResidueConfig.size;
  const stageColor = mixColor(palette.cool.stage, palette.warm.stage, state.worldMix);
  const liftColor = mixColor(palette.cool.lift, palette.warm.lift, state.worldMix);
  const edgeColor = mixColor(palette.cool.edge, palette.warm.edge, state.worldMix);
  const haloColor = mixColor(palette.cool.halo, palette.warm.halo, state.worldMix);

  graphics.clear();
  graphics.rect(0, 0, width, height);
  graphics.fill({ color: stageColor, alpha: state.stageFade });

  fillSoftCircle(
    graphics,
    state.topHaloX,
    state.topHaloY,
    state.topHaloRadius,
    haloColor,
    mix(0.52, 0.66, state.worldMix) * state.stageFade,
  );
  fillSoftCircle(
    graphics,
    width * 0.52,
    height * 0.28,
    mix(320, 420, state.worldMix),
    liftColor,
    mix(0.34, 0.46, state.worldMix) * state.stageFade,
  );
  fillSoftCircle(
    graphics,
    width * 0.12,
    height * 0.88,
    220,
    edgeColor,
    mix(0.24, 0.32, state.worldMix) * state.stageFade,
  );
  fillSoftCircle(
    graphics,
    width * 0.95,
    height * 0.18,
    240,
    edgeColor,
    mix(0.16, 0.28, state.worldMix) * state.stageFade,
  );
}

function drawCircleFrame(graphics: Graphics, state: TemporalEchoResidueFrameState) {
  graphics.clear();

  if (state.circleAlpha <= 0.001) {
    return;
  }

  graphics.circle(480, 274, 172);
  graphics.stroke({
    alpha: state.circleAlpha,
    color: 0xeafcff,
    width: 1.6,
  });
}

function drawPetals(graphics: Graphics, state: TemporalEchoResidueFrameState) {
  graphics.clear();

  if (state.petalAlpha <= 0.001) {
    return;
  }

  const centerX = 646;
  const centerY = 270;
  const radius = 360;

  for (let index = 0; index < 10; index += 1) {
    const angle = state.petalSpin + (index / 10) * Math.PI * 2;
    const controlAngle = angle + Math.PI / 10;
    const endX = centerX + Math.cos(angle) * radius;
    const endY = centerY + Math.sin(angle) * radius * 0.72;
    const controlX = centerX + Math.cos(controlAngle) * radius * 0.48;
    const controlY = centerY + Math.sin(controlAngle) * radius * 0.5;

    graphics
      .moveTo(centerX, centerY)
      .bezierCurveTo(controlX, controlY, controlX, controlY, endX, endY)
      .stroke({
        alpha: state.petalAlpha * 0.18,
        color: 0xfff4cf,
        width: 1.5,
      });
  }
}

function drawWaterArc(graphics: Graphics, state: TemporalEchoResidueFrameState) {
  graphics.clear();

  if (state.waterArcAlpha <= 0.001) {
    return;
  }

  const tipX = mix(26, 430, state.waterArcProgress);
  const tipY = mix(202, 162, state.waterArcProgress);

  for (let index = 0; index < 3; index += 1) {
    const offset = index * 10;

    graphics
      .moveTo(42, 182 + offset)
      .quadraticCurveTo(192, 232 - index * 8, tipX, tipY + offset * 0.6)
      .stroke({
        alpha: state.waterArcAlpha * (0.38 - index * 0.08),
        color: index === 0 ? 0xfff7d2 : 0xffd24d,
        width: 1.8 - index * 0.25,
      });
  }
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
  const circleFrame = new Graphics();
  const petals = new Graphics();
  const waterArc = new Graphics();
  const cueRoot = new Container();
  const cueVisuals = new Map<string, CueVisual>();

  app.stage.addChild(background, circleFrame, petals, waterArc, cueRoot);

  const update = (state: TemporalEchoResidueFrameState) => {
    drawBackground(background, state);
    drawCircleFrame(circleFrame, state);
    drawPetals(petals, state);
    drawWaterArc(waterArc, state);

    const cueStates = new Map(state.cues.map((cue) => [cue.id, cue]));

    for (const cue of state.cues) {
      const visual = ensureCueVisual(cue, cueRoot, cueVisuals);
      const colors = cuePalette(cue);
      const auraRadius = cueRadius(cue);

      const auraAlpha = cue.alpha * cue.glowAlpha * cue.fillAlpha * 0.12;

      visual.aura.clear();

      if (auraAlpha > 0.01) {
        fillSoftCircle(
          visual.aura,
          cue.lead.x,
          cue.lead.y,
          auraRadius,
          colors.aura,
          auraAlpha,
        );
      }

      setCueTransform(visual.leadOutline, cue.lead);
      visual.leadOutline.alpha = cue.alpha * cue.outlineAlpha;

      setCueTransform(visual.leadCore, cue.lead);
      visual.leadCore.alpha = cue.alpha * cue.fillAlpha;

      visual.echoContainers.forEach((echoContainer, index) => {
        const sample = cue.echoes[index];

        if (!sample) {
          echoContainer.alpha = 0;
          return;
        }

        setCueTransform(echoContainer, sample);
        echoContainer.alpha = clamp01(sample.alpha * cue.outlineAlpha * 1.18);
      });
    }

    for (const [cueId, visual] of cueVisuals) {
      if (!cueStates.has(cueId)) {
        hideCueVisual(visual);
      }
    }

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
