import React, { useCallback } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { config } from "./config";
import {
  createCirclePath,
  createRectPath,
  createTrianglePath,
  drawRepeatedTile,
  getDustTile,
  getFabricTile,
  samplePosterizedWiggleTransform,
  sampleSteppedLoopTransform,
} from "./lib/textures";

const fillAndTextureShape = ({
  ctx,
  path,
  fillColor,
  textureTile,
  textureOpacity,
  textureBlend,
  textureTransform,
}: {
  ctx: CanvasRenderingContext2D;
  path: Path2D;
  fillColor: string;
  textureTile: HTMLCanvasElement | null;
  textureOpacity: number;
  textureBlend: GlobalCompositeOperation;
  textureTransform: ReturnType<typeof samplePosterizedWiggleTransform>;
}) => {
  ctx.save();
  ctx.fillStyle = fillColor;
  ctx.fill(path);
  ctx.clip(path);

  if (textureTile) {
    drawRepeatedTile({
      ctx,
      tile: textureTile,
      width: config.width,
      height: config.height,
      transform: textureTransform,
      opacity: textureOpacity,
      compositeOperation: textureBlend,
    });
  }

  ctx.restore();
};

const drawScene = (ctx: CanvasRenderingContext2D, frame: number) => {
  ctx.clearRect(0, 0, config.width, config.height);
  ctx.fillStyle = config.background;
  ctx.fillRect(0, 0, config.width, config.height);

  const backgroundGradient = ctx.createRadialGradient(
    config.width * 0.52,
    config.height * 0.48,
    config.width * 0.08,
    config.width * 0.52,
    config.height * 0.48,
    config.width * 0.72,
  );
  backgroundGradient.addColorStop(0, "rgba(255,255,255,0.08)");
  backgroundGradient.addColorStop(0.42, "rgba(255,255,255,0.02)");
  backgroundGradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = backgroundGradient;
  ctx.fillRect(0, 0, config.width, config.height);

  const fabricTile = getFabricTile({
    size: config.fabric.tileSize,
    seed: 7,
    threadColor: "rgba(255,255,255,__ALPHA__)",
    crossThreadColor: "rgba(209,214,255,__ALPHA__)",
  });

  const steppedFabricTransform = sampleSteppedLoopTransform({
    frame,
    holdFrames: config.steppedTexture.holdFrames,
    seed: 11,
    variantCount: config.steppedTexture.variantCount,
    offsetAmplitude: config.steppedTexture.offsetAmplitude,
    minScale: config.steppedTexture.minScale,
    maxScale: config.steppedTexture.maxScale,
    rotationAmplitudeDeg: config.steppedTexture.rotationAmplitudeDeg,
  });

  if (fabricTile) {
    drawRepeatedTile({
      ctx,
      tile: fabricTile,
      width: config.width,
      height: config.height,
      transform: { offsetX: 0, offsetY: 0, rotationRad: 0, scale: 1.14 },
      opacity: config.fabric.opacity,
    });

    drawRepeatedTile({
      ctx,
      tile: fabricTile,
      width: config.width,
      height: config.height,
      transform: steppedFabricTransform,
      opacity: config.fabric.shimmerOpacity,
      compositeOperation: "screen",
    });
  }

  const whiteDustTile = getDustTile({
    size: config.dust.tileSize,
    seed: 19,
    dotColor: "rgba(255,255,255,__ALPHA__)",
    smudgeColor: "rgba(255,255,255,__ALPHA__)",
  });

  const purpleDustTile = getDustTile({
    size: config.dust.tileSize,
    seed: 27,
    dotColor: "rgba(53,30,103,__ALPHA__)",
    smudgeColor: "rgba(29,12,62,__ALPHA__)",
  });

  const roseDustTile = getDustTile({
    size: config.dust.tileSize,
    seed: 31,
    dotColor: "rgba(197,74,117,__ALPHA__)",
    smudgeColor: "rgba(149,36,88,__ALPHA__)",
  });

  const mintDustTransform = samplePosterizedWiggleTransform({
    frame,
    fps: config.fps,
    posterizeFps: config.posterizedTexture.posterizeFps,
    seed: 3,
    offsetAmplitude: config.posterizedTexture.offsetAmplitude,
    rotationAmplitudeDeg: config.posterizedTexture.rotationAmplitudeDeg,
    scaleBase: config.posterizedTexture.scaleBase,
    scaleJitter: config.posterizedTexture.scaleJitter,
  });

  const pinkDustTransform = samplePosterizedWiggleTransform({
    frame,
    fps: config.fps,
    posterizeFps: config.posterizedTexture.posterizeFps,
    seed: 5,
    offsetAmplitude: config.posterizedTexture.offsetAmplitude,
    rotationAmplitudeDeg: config.posterizedTexture.rotationAmplitudeDeg,
    scaleBase: config.posterizedTexture.scaleBase,
    scaleJitter: config.posterizedTexture.scaleJitter,
  });

  const purpleDustTransform = samplePosterizedWiggleTransform({
    frame,
    fps: config.fps,
    posterizeFps: config.posterizedTexture.posterizeFps,
    seed: 8,
    offsetAmplitude: config.posterizedTexture.offsetAmplitude,
    rotationAmplitudeDeg: config.posterizedTexture.rotationAmplitudeDeg,
    scaleBase: config.posterizedTexture.scaleBase,
    scaleJitter: config.posterizedTexture.scaleJitter,
  });

  const largeTopSquare = createRectPath({
    cx: 208,
    cy: 116,
    width: 282,
    height: 282,
    rotationDeg: -13,
  });
  const smallRightSquare = createRectPath({
    cx: 902,
    cy: 775,
    width: 126,
    height: 126,
    rotationDeg: 0,
  });
  const tinyBottomSquare = createRectPath({
    cx: 548,
    cy: 990,
    width: 72,
    height: 72,
    rotationDeg: -32,
  });

  const topRightCircle = createCirclePath(892, 194, 88);
  const bottomLeftCircle = createCirclePath(164, 962, 180);

  const mainTriangle = createTrianglePath([
    { x: 370, y: 435 },
    { x: 705, y: 250 },
    { x: 760, y: 688 },
  ]);
  const leftEdgeTriangle = createTrianglePath([
    { x: -26, y: 640 },
    { x: 104, y: 718 },
    { x: -30, y: 762 },
  ]);
  const topEdgeTriangle = createTrianglePath([
    { x: 990, y: 24 },
    { x: 1062, y: 0 },
    { x: 1030, y: 72 },
  ]);

  fillAndTextureShape({
    ctx,
    path: largeTopSquare,
    fillColor: "#7770ff",
    textureTile: purpleDustTile,
    textureOpacity: 0.68,
    textureBlend: "multiply",
    textureTransform: purpleDustTransform,
  });

  fillAndTextureShape({
    ctx,
    path: smallRightSquare,
    fillColor: "#6551ff",
    textureTile: purpleDustTile,
    textureOpacity: 0.78,
    textureBlend: "multiply",
    textureTransform: purpleDustTransform,
  });

  fillAndTextureShape({
    ctx,
    path: tinyBottomSquare,
    fillColor: "#6551ff",
    textureTile: purpleDustTile,
    textureOpacity: 0.72,
    textureBlend: "multiply",
    textureTransform: purpleDustTransform,
  });

  fillAndTextureShape({
    ctx,
    path: topRightCircle,
    fillColor: "#f5a1be",
    textureTile: roseDustTile,
    textureOpacity: 0.56,
    textureBlend: "multiply",
    textureTransform: pinkDustTransform,
  });

  fillAndTextureShape({
    ctx,
    path: bottomLeftCircle,
    fillColor: "#f3a0c0",
    textureTile: roseDustTile,
    textureOpacity: 0.54,
    textureBlend: "multiply",
    textureTransform: pinkDustTransform,
  });

  fillAndTextureShape({
    ctx,
    path: mainTriangle,
    fillColor: "#96f5df",
    textureTile: whiteDustTile,
    textureOpacity: 0.84,
    textureBlend: "screen",
    textureTransform: mintDustTransform,
  });

  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = "#96f5df";
  ctx.fill(leftEdgeTriangle);
  ctx.fill(topEdgeTriangle);
  ctx.restore();

  if (whiteDustTile) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.26;
    drawRepeatedTile({
      ctx,
      tile: whiteDustTile,
      width: config.width,
      height: config.height,
      transform: samplePosterizedWiggleTransform({
        frame,
        fps: config.fps,
        posterizeFps: config.posterizedTexture.posterizeFps,
        seed: 15,
        offsetAmplitude: 84,
        rotationAmplitudeDeg: 18,
        scaleBase: 0.94,
        scaleJitter: 0.18,
      }),
      opacity: 1,
      compositeOperation: "screen",
    });
    ctx.restore();
  }
};

export const AETipMovingTexture: React.FC = () => {
  const frame = useCurrentFrame();

  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (!canvas) {
        return;
      }

      if (canvas.width !== config.width) {
        canvas.width = config.width;
      }

      if (canvas.height !== config.height) {
        canvas.height = config.height;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      drawScene(ctx, frame);
    },
    [frame],
  );

  return (
    <AbsoluteFill style={{ background: config.background }}>
      <canvas
        ref={canvasRef}
        width={config.width}
        height={config.height}
        style={{ width: "100%", height: "100%" }}
      />
    </AbsoluteFill>
  );
};
