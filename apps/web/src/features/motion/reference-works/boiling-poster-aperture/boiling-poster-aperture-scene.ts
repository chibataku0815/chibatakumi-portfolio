import {
  Application,
  BlurFilter,
  Container,
  DisplacementFilter,
  Graphics,
  Sprite,
  Text,
  Texture,
} from "pixi.js";
import { boilField } from "./boil-field";
import { boilingPosterApertureConfig } from "./boiling-poster-aperture.config";
import { boilingPosterApertureFixtures } from "./fixtures";
import type { BoilingPosterApertureFrameState } from "./boiling-poster-aperture.evaluator";

type BoilingPosterApertureScene = {
  destroy: () => void;
  update: (state: BoilingPosterApertureFrameState) => void;
};

const palette = {
  stage: 0x08090b,
  stageWarm: 0xb6492d,
  stageCool: 0x36566b,
  cover: 0x111219,
  coverLine: 0xf2dfc1,
  coverAccent: 0xa63e2e,
  posterText: 0xf1e6d1,
  posterMuted: 0xcdbda2,
  boilWarm: 0xf5d9b1,
  boilCool: 0xb6cfe0,
  rim: 0xf09a65,
  signal: 0xe16f46,
  ember: 0xf4bf87,
} as const;

const posterFrame = {
  x: 216,
  y: 138,
  width: 760,
  height: 1240,
  radius: 38,
} as const;

function drawRoundedRect(
  graphics: Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  graphics.roundRect(x, y, width, height, radius);
}

function drawBoilStroke({
  graphics,
  centerX,
  centerY,
  radius,
  amplitude,
  time,
  radiusOffset,
  lineWidth,
  alpha,
  color,
}: {
  graphics: Graphics;
  centerX: number;
  centerY: number;
  radius: number;
  amplitude: number;
  time: number;
  radiusOffset: number;
  lineWidth: number;
  alpha: number;
  color: number;
}) {
  const points = boilField({
    centerX,
    centerY,
    radius: radius + radiusOffset,
    amplitude,
    time,
    sampleCount: boilingPosterApertureConfig.boil.nodeCount * 3,
  });

  if (points.length === 0) {
    return;
  }

  graphics.moveTo(points[0].x, points[0].y);

  for (let index = 1; index < points.length; index += 1) {
    graphics.lineTo(points[index].x, points[index].y);
  }

  graphics.closePath();
  graphics.stroke({
    width: lineWidth,
    color,
    alpha,
  });
}

function createPosterCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = posterFrame.width;
  canvas.height = posterFrame.height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("2D canvas context is unavailable for the poster texture.");
  }

  const background = context.createLinearGradient(
    0,
    0,
    canvas.width,
    canvas.height,
  );
  background.addColorStop(0, "#18191f");
  background.addColorStop(0.48, "#263844");
  background.addColorStop(1, "#111216");

  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#d9874d";
  context.beginPath();
  context.arc(172, 198, 150, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#0d1016";
  context.beginPath();
  context.moveTo(300, 124);
  context.lineTo(532, 116);
  context.lineTo(604, 302);
  context.lineTo(554, 612);
  context.lineTo(376, 916);
  context.lineTo(246, 854);
  context.lineTo(244, 510);
  context.closePath();
  context.fill();

  context.fillStyle = "rgba(241, 230, 209, 0.88)";
  context.font = '700 28px "Noto Sans JP", sans-serif';
  context.fillText(boilingPosterApertureFixtures.poster.issue, 56, 72);

  context.fillStyle = "rgba(241, 230, 209, 0.76)";
  context.font = '600 18px "Noto Sans JP", sans-serif';
  context.fillText(boilingPosterApertureFixtures.poster.slug, 56, 104);

  context.fillStyle = "#efe6cf";
  context.font = '700 94px "Noto Sans JP", sans-serif';
  context.fillText("APERTURE", 52, 534);

  context.fillStyle = "rgba(239, 230, 207, 0.8)";
  context.font = '600 26px "Noto Sans JP", sans-serif';
  context.fillText("boiling poster / displacement gate", 56, 584);

  context.fillStyle = "#f26b43";
  context.fillRect(56, 1110, 210, 18);
  context.fillRect(56, 1142, 282, 10);

  context.fillStyle = "rgba(239, 230, 207, 0.84)";
  context.font = '600 18px "Noto Sans JP", sans-serif';
  boilingPosterApertureFixtures.poster.taglines.forEach((tagline, index) => {
    context.fillText(tagline, 58, 894 + index * 34);
  });

  context.fillStyle = "rgba(239, 230, 207, 0.72)";
  context.font = '500 17px "Noto Sans JP", sans-serif';
  context.fillText(boilingPosterApertureFixtures.poster.microCopy, 56, 1196);

  context.strokeStyle = "rgba(242, 213, 169, 0.44)";
  context.lineWidth = 2;
  context.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

  context.fillStyle = "rgba(239, 230, 207, 0.05)";
  for (let index = 0; index < 2200; index += 1) {
    const x = (index * 61) % canvas.width;
    const y = (index * 37) % canvas.height;
    const size = 1 + (index % 3);

    context.fillRect(x, y, size, size);
  }

  return canvas;
}

function createDisplacementCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "2D canvas context is unavailable for the displacement texture.",
    );
  }

  const imageData = context.createImageData(canvas.width, canvas.height);
  const { data } = imageData;

  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const index = (y * canvas.width + x) * 4;
      const waveA = Math.sin(x * 0.11) * 0.5 + 0.5;
      const waveB = Math.cos(y * 0.15 + x * 0.04) * 0.5 + 0.5;
      const swirl = Math.sin((x + y) * 0.075) * 0.5 + 0.5;

      data[index] = Math.round(waveA * 255);
      data[index + 1] = Math.round(waveB * 255);
      data[index + 2] = Math.round(swirl * 255);
      data[index + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);

  return canvas;
}

export async function createBoilingPosterApertureScene({
  host,
}: {
  host: HTMLDivElement;
}): Promise<BoilingPosterApertureScene> {
  const app = new Application();

  await app.init({
    width: boilingPosterApertureConfig.size.width,
    height: boilingPosterApertureConfig.size.height,
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

  const apertureLocalX = boilingPosterApertureConfig.gate.centerX - posterFrame.x;
  const apertureLocalY = boilingPosterApertureConfig.gate.centerY - posterFrame.y;
  const posterTexture = Texture.from(createPosterCanvas());
  const displacementTexture = Texture.from(createDisplacementCanvas());
  const baseMapScale =
    Math.max(
      posterFrame.width / displacementTexture.width,
      posterFrame.height / displacementTexture.height,
    ) * 1.18;

  const background = new Graphics();
  background
    .rect(0, 0, app.screen.width, app.screen.height)
    .fill({ color: palette.stage });
  app.stage.addChild(background);

  const warmHalo = new Graphics();
  warmHalo.circle(210, 240, 260).fill({
    color: palette.stageWarm,
    alpha: 0.1,
  });
  app.stage.addChild(warmHalo);

  const coolHalo = new Graphics();
  coolHalo.circle(app.screen.width - 180, app.screen.height - 260, 320).fill({
    color: palette.stageCool,
    alpha: 0.1,
  });
  app.stage.addChild(coolHalo);

  const posterShadow = new Graphics();
  drawRoundedRect(
    posterShadow,
    posterFrame.x - 22,
    posterFrame.y + 22,
    posterFrame.width + 44,
    posterFrame.height + 44,
    posterFrame.radius + 18,
  );
  posterShadow.fill({ color: 0x000000, alpha: 0.28 });
  app.stage.addChild(posterShadow);

  const coverCard = new Graphics();
  drawRoundedRect(
    coverCard,
    posterFrame.x,
    posterFrame.y,
    posterFrame.width,
    posterFrame.height,
    posterFrame.radius,
  );
  coverCard.fill({ color: palette.cover, alpha: 0.98 });
  coverCard.stroke({
    width: 2,
    color: palette.coverLine,
    alpha: 0.32,
  });
  app.stage.addChild(coverCard);

  const coverVeil = new Graphics();
  drawRoundedRect(
    coverVeil,
    posterFrame.x + 6,
    posterFrame.y + 6,
    posterFrame.width - 12,
    posterFrame.height - 12,
    posterFrame.radius - 6,
  );
  coverVeil.fill({ color: palette.coverAccent, alpha: 0.12 });
  app.stage.addChild(coverVeil);

  const posterMasked = new Container();
  posterMasked.x = posterFrame.x;
  posterMasked.y = posterFrame.y;
  app.stage.addChild(posterMasked);

  const posterArt = new Container();
  posterArt.pivot.set(posterFrame.width / 2, posterFrame.height / 2);
  posterArt.position.set(posterFrame.width / 2, posterFrame.height / 2);
  posterMasked.addChild(posterArt);

  const posterSprite = Sprite.from(posterTexture);
  posterArt.addChild(posterSprite);

  const apertureMask = new Graphics();
  posterMasked.addChild(apertureMask);
  posterArt.mask = apertureMask;

  const displacementSprite = Sprite.from(displacementTexture);
  displacementSprite.anchor.set(0.5);
  displacementSprite.position.set(apertureLocalX, apertureLocalY);
  displacementSprite.alpha = 0;
  posterMasked.addChild(displacementSprite);

  const displacementFilter = new DisplacementFilter({
    sprite: displacementSprite,
    scale: { x: 0, y: 0 },
  });
  const blurFilter = new BlurFilter();
  blurFilter.strength = 0;
  blurFilter.quality = 4;
  posterArt.filters = [displacementFilter, blurFilter];
  posterArt.filterArea = app.screen;

  const coverSignals = new Graphics();
  coverSignals.rect(posterFrame.x + 42, posterFrame.y + 48, 146, 8).fill({
    color: palette.posterText,
    alpha: 0.52,
  });
  coverSignals.rect(posterFrame.x + 42, posterFrame.y + 72, 96, 6).fill({
    color: palette.posterText,
    alpha: 0.28,
  });
  coverSignals.rect(
    posterFrame.x + posterFrame.width - 132,
    posterFrame.y + 144,
    12,
    288,
  ).fill({
    color: palette.signal,
    alpha: 0.42,
  });
  coverSignals.rect(
    posterFrame.x + posterFrame.width - 140,
    posterFrame.y + posterFrame.height - 78,
    108,
    8,
  ).fill({
    color: palette.signal,
    alpha: 0.32,
  });
  app.stage.addChild(coverSignals);

  const gateShadow = new Graphics();
  const apertureRim = new Graphics();
  const boilWarm = new Graphics();
  const boilCool = new Graphics();
  const boilTight = new Graphics();
  app.stage.addChild(gateShadow, apertureRim, boilWarm, boilCool, boilTight);

  const accentBand = new Graphics();
  const accentNodes = Array.from(
    { length: boilingPosterApertureConfig.accent.sparkCount },
    () => new Graphics(),
  );
  app.stage.addChild(accentBand, ...accentNodes);

  const runtimeLabel = new Text({
    text: boilingPosterApertureFixtures.runtimeLabel,
    style: {
      fontFamily: "Noto Sans JP, sans-serif",
      fontSize: 16,
      fontWeight: "500",
      fill: 0xc5ceda,
      letterSpacing: 1.3,
    },
  });
  runtimeLabel.x = 248;
  runtimeLabel.y = 1450;
  runtimeLabel.alpha = 0.6;
  app.stage.addChild(runtimeLabel);

  const sideLabel = new Text({
    text: "sealed poster / aperture gate",
    style: {
      fontFamily: "Noto Sans JP, sans-serif",
      fontSize: 16,
      fontWeight: "500",
      fill: palette.posterText,
      letterSpacing: 2.2,
    },
  });
  sideLabel.rotation = -Math.PI / 2;
  sideLabel.x = posterFrame.x - 56;
  sideLabel.y = posterFrame.y + posterFrame.height - 14;
  sideLabel.alpha = 0.72;
  app.stage.addChild(sideLabel);

  const stageLabel = new Text({
    text: "secondary action stays secondary",
    style: {
      fontFamily: "Noto Sans JP, sans-serif",
      fontSize: 18,
      fontWeight: "600",
      fill: palette.posterText,
      letterSpacing: 1.6,
    },
  });
  stageLabel.x = 696;
  stageLabel.y = boilingPosterApertureConfig.accent.bandY - 84;
  stageLabel.alpha = 0.52;
  app.stage.addChild(stageLabel);

  const update = (state: BoilingPosterApertureFrameState) => {
    const gateCenterX =
      boilingPosterApertureConfig.gate.centerX + state.gate.offsetX;
    const gateCenterY =
      boilingPosterApertureConfig.gate.centerY + state.gate.offsetY;

    posterArt.position.set(
      posterFrame.width / 2 + state.displacement.offsetX,
      posterFrame.height / 2 + state.displacement.offsetY,
    );
    posterArt.scale.set(1.012 - state.holdMix * 0.012);

    displacementSprite.position.set(
      apertureLocalX - state.displacement.offsetX * 0.28,
      apertureLocalY - state.displacement.offsetY * 0.28,
    );
    displacementSprite.scale.set(baseMapScale * state.displacement.mapScale);
    displacementFilter.scale.x = state.displacement.scaleX;
    displacementFilter.scale.y = state.displacement.scaleY;
    blurFilter.strength = state.displacement.blurStrength;

    apertureMask.clear();
    apertureMask.circle(
      apertureLocalX + state.gate.offsetX,
      apertureLocalY + state.gate.offsetY,
      state.gate.radius,
    );
    apertureMask.circle(
      apertureLocalX - state.gate.radius * 0.22 + state.progress * 24,
      apertureLocalY + state.gate.radius * 0.12 - state.progress * 16,
      boilingPosterApertureConfig.gate.secondaryBlobRadius *
        (0.24 + state.progress * 0.76),
    );
    apertureMask.fill({ color: 0xffffff, alpha: 1 });

    gateShadow.clear();
    gateShadow.circle(
      gateCenterX,
      gateCenterY,
      state.gate.radius + state.gate.feather * 0.26,
    );
    gateShadow.stroke({
      width: state.gate.feather,
      color: palette.rim,
      alpha: state.gate.shadowAlpha,
    });

    apertureRim.clear();
    apertureRim.circle(gateCenterX, gateCenterY, state.gate.radius + 2);
    apertureRim.stroke({
      width: 2.4,
      color: palette.coverLine,
      alpha: state.gate.rimAlpha,
    });

    boilWarm.clear();
    drawBoilStroke({
      graphics: boilWarm,
      centerX: gateCenterX,
      centerY: gateCenterY,
      radius: state.gate.radius,
      amplitude: state.edgeBoil.warm,
      time: state.time,
      radiusOffset: 20,
      lineWidth: 2.1,
      alpha: 0.08 + state.progress * 0.18,
      color: palette.boilWarm,
    });

    boilCool.clear();
    drawBoilStroke({
      graphics: boilCool,
      centerX: gateCenterX,
      centerY: gateCenterY,
      radius: state.gate.radius,
      amplitude: state.edgeBoil.cool,
      time: state.time + 180,
      radiusOffset: 8,
      lineWidth: 1.2,
      alpha: 0.06 + state.progress * 0.14,
      color: palette.boilCool,
    });

    boilTight.clear();
    drawBoilStroke({
      graphics: boilTight,
      centerX: gateCenterX,
      centerY: gateCenterY,
      radius: state.gate.radius,
      amplitude: state.edgeBoil.tight,
      time: state.time - 120,
      radiusOffset: -6,
      lineWidth: 0.8,
      alpha: 0.05 + state.progress * 0.1,
      color: palette.boilWarm,
    });

    accentBand.clear();
    accentBand.roundRect(
      676,
      boilingPosterApertureConfig.accent.bandY,
      264,
      14,
      7,
    );
    accentBand.fill({
      color: palette.coverLine,
      alpha: 0.08 + state.accents[0].opacity * 0.18,
    });

    accentNodes.forEach((node, index) => {
      const accent = state.accents[index % state.accents.length];
      const x = 700 + index * 34;
      const y =
        boilingPosterApertureConfig.accent.bandY - 24 +
        accent.offsetY * (0.7 + (index % 3) * 0.1);
      const width = 18 + (index % 3) * 6;
      const height = 6 + (index % 2) * 2;

      node.clear();
      node.roundRect(x, y, width * accent.scaleX, height, 4);
      node.fill({
        color: index % 2 === 0 ? palette.signal : palette.ember,
        alpha: accent.opacity * (0.64 - (index % 3) * 0.08),
      });
      node.circle(x + width + 10, y + height * 0.5, 3.5);
      node.fill({
        color: palette.posterText,
        alpha: accent.opacity * 0.68,
      });
    });

    stageLabel.alpha = 0.28 + state.accents[0].opacity * 0.42;
    stageLabel.y =
      boilingPosterApertureConfig.accent.bandY -
      84 +
      state.accents[0].offsetY * 0.45;

    coverVeil.alpha = state.gate.overlayAlpha * 0.7 + state.coverGlowAlpha;
    coverSignals.alpha = 0.5 + state.progress * 0.14;
    posterShadow.alpha = state.posterShadowAlpha;
    runtimeLabel.alpha = 0.4 + state.progress * 0.18;
    sideLabel.alpha = 0.48 + state.progress * 0.18;

    warmHalo.x = state.backgroundShift * 0.6;
    warmHalo.alpha = 0.04 + state.coverGlowAlpha * 0.52;
    coolHalo.x = -state.backgroundShift * 0.45;
    coolHalo.alpha = 0.05 + state.coverGlowAlpha * 0.34;

    app.render();
  };

  return {
    destroy: () => {
      host.innerHTML = "";
      displacementFilter.destroy();
      blurFilter.destroy();
      posterTexture.destroy(true);
      displacementTexture.destroy(true);
      app.destroy(true, {
        children: true,
        texture: true,
        textureSource: true,
      });
    },
    update,
  };
}
