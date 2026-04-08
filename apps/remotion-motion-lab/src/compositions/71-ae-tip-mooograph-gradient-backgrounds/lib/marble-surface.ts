import type { MarbleRecipe } from "../config";
import { brighten, darken } from "./color";
import { getReusableCanvas } from "./canvas-utils";
import { clamp01, degToRad, lerp, seeded, smoothstep, wrap } from "./math";
import { applyTurbulencePasses } from "./turbulence";

type CircleSeed = {
  x: number;
  y: number;
  radius: number;
  color: string;
};

type RgbaSample = {
  r: number;
  g: number;
  b: number;
  a: number;
};

const sourceCache = new Map<
  string,
  {
    width: number;
    height: number;
    data: Uint8ClampedArray;
  }
>();

const createCircleSeeds = ({
  width,
  height,
  recipe,
}: {
  width: number;
  height: number;
  recipe: MarbleRecipe;
}) => {
  return Array.from({ length: recipe.circleCount }, (_, index) => {
    const localSeed = recipe.seed * 100 + index * 17;
    return {
      x: (seeded(localSeed + 1) * 1.28 - 0.14) * width,
      y: (seeded(localSeed + 2) * 1.28 - 0.14) * height,
      radius: lerp(
        recipe.minRadius,
        recipe.maxRadius,
        Math.pow(seeded(localSeed + 3), 0.72),
      ),
      color: recipe.colors[index % recipe.colors.length] ?? recipe.colors[0] ?? "#ffffff",
    };
  });
};

const buildCircleSource = ({
  width,
  height,
  recipe,
}: {
  width: number;
  height: number;
  recipe: MarbleRecipe;
}) => {
  const cacheKey = `71-marble-source-${width}-${height}-${recipe.seed}`;
  const cached = sourceCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const canvas = getReusableCanvas(cacheKey, width, height);
  if (!canvas) {
    return null;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }

  const circles = createCircleSeeds({ width, height, recipe });
  ctx.clearRect(0, 0, width, height);

  circles.forEach((circle: CircleSeed, index) => {
    const directionX = -Math.cos(degToRad(45));
    const directionY = Math.sin(degToRad(45));
    const shadowOffset = recipe.shadowOffsetFactor * width;

    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${(recipe.shadowOpacity + (index % 3) * 0.02).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(
      circle.x + directionX * shadowOffset,
      circle.y + directionY * shadowOffset,
      circle.radius,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();

    const highlight = brighten(circle.color, 0.34);
    const shadow = darken(circle.color, 0.22);
    const gradient = ctx.createRadialGradient(
      circle.x - circle.radius * 0.34,
      circle.y - circle.radius * 0.38,
      circle.radius * 0.08,
      circle.x,
      circle.y,
      circle.radius,
    );
    gradient.addColorStop(
      0,
      `rgba(${highlight.r}, ${highlight.g}, ${highlight.b}, 0.98)`,
    );
    gradient.addColorStop(0.44, circle.color);
    gradient.addColorStop(
      1,
      `rgba(${shadow.r}, ${shadow.g}, ${shadow.b}, 0.98)`,
    );

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = Math.max(1, circle.radius * 0.02);
    ctx.stroke();
  });

  const image = ctx.getImageData(0, 0, width, height);
  const result = {
    width,
    height,
    data: image.data,
  };
  sourceCache.set(cacheKey, result);
  return result;
};

const sampleWrappedImage = ({
  source,
  x,
  y,
}: {
  source: {
    width: number;
    height: number;
    data: Uint8ClampedArray;
  };
  x: number;
  y: number;
}): RgbaSample => {
  const x0 = Math.floor(wrap(x, source.width));
  const y0 = Math.floor(wrap(y, source.height));
  const x1 = (x0 + 1) % source.width;
  const y1 = (y0 + 1) % source.height;
  const tx = wrap(x, source.width) - x0;
  const ty = wrap(y, source.height) - y0;

  const get = (px: number, py: number) => {
    const offset = (py * source.width + px) * 4;
    return {
      r: source.data[offset],
      g: source.data[offset + 1],
      b: source.data[offset + 2],
      a: source.data[offset + 3] / 255,
    };
  };

  const c00 = get(x0, y0);
  const c10 = get(x1, y0);
  const c01 = get(x0, y1);
  const c11 = get(x1, y1);

  const lerpChannel = (
    topLeft: number,
    topRight: number,
    bottomLeft: number,
    bottomRight: number,
  ) => {
    const top = topLeft + (topRight - topLeft) * tx;
    const bottom = bottomLeft + (bottomRight - bottomLeft) * tx;
    return top + (bottom - top) * ty;
  };

  return {
    r: lerpChannel(c00.r, c10.r, c01.r, c11.r),
    g: lerpChannel(c00.g, c10.g, c01.g, c11.g),
    b: lerpChannel(c00.b, c10.b, c01.b, c11.b),
    a: lerpChannel(c00.a, c10.a, c01.a, c11.a),
  };
};

const applyLensWarp = ({
  u,
  v,
  strength,
  aspect,
}: {
  u: number;
  v: number;
  strength: number;
  aspect: number;
}) => {
  const x = (u - 0.5) * aspect;
  const y = v - 0.5;
  const radius = x * x + y * y;
  const warp = 1 + strength * radius;

  return {
    u: 0.5 + x / warp / aspect,
    v: 0.5 + y / warp,
  };
};

export const renderMarbleSurface = ({
  target,
  time,
  loopProgress,
  recipe,
}: {
  target: HTMLCanvasElement;
  time: number;
  loopProgress: number;
  recipe: MarbleRecipe;
}) => {
  const ctx = target.getContext("2d");
  if (!ctx) {
    return;
  }

  const width = target.width;
  const height = target.height;
  const source = buildCircleSource({ width, height, recipe });
  if (!source) {
    return;
  }

  const image = ctx.createImageData(width, height);
  const data = image.data;
  const aspect = width / height;
  const blurAngle = degToRad(recipe.blurAngleDeg);
  const blurLength = recipe.blurLengthFactor * width;
  const blurVectorX = Math.cos(blurAngle) * blurLength;
  const blurVectorY = Math.sin(blurAngle) * blurLength;
  const slide = (loopProgress * 2 - 1) * recipe.transformTravelFactor;

  for (let y = 0; y < height; y += 1) {
    const v = (y + 0.5) / height;

    for (let x = 0; x < width; x += 1) {
      const u = (x + 0.5) / width;
      const transformed = {
        u: u + slide,
        v,
      };
      const lensed = applyLensWarp({
        u: transformed.u,
        v: transformed.v,
        strength: recipe.lensStrength,
        aspect,
      });
      const displaced = applyTurbulencePasses({
        u: lensed.u,
        v: lensed.v,
        time,
        passes: [recipe.turbulence],
        aspect,
      });

      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let totalWeight = 0;

      for (let sampleIndex = 0; sampleIndex < recipe.blurSamples; sampleIndex += 1) {
        const t =
          recipe.blurSamples === 1
            ? 0
            : sampleIndex / (recipe.blurSamples - 1) - 0.5;
        const weight = 1 - Math.abs(t) * 0.92;
        const sample = sampleWrappedImage({
          source,
          x: displaced.u * width + blurVectorX * t,
          y: displaced.v * height + blurVectorY * t,
        });

        r += sample.r * sample.a * weight;
        g += sample.g * sample.a * weight;
        b += sample.b * sample.a * weight;
        a += sample.a * weight;
        totalWeight += weight;
      }

      const normalizedAlpha = clamp01(a / Math.max(0.0001, totalWeight));
      const offset = (y * width + x) * 4;

      if (normalizedAlpha <= 0.003) {
        data[offset] = 0;
        data[offset + 1] = 0;
        data[offset + 2] = 0;
        data[offset + 3] = 0;
        continue;
      }

      const densityBoost = smoothstep(0.08, 0.72, normalizedAlpha);
      data[offset] = Math.round(r / Math.max(0.0001, a) * (0.94 + densityBoost * 0.08));
      data[offset + 1] = Math.round(g / Math.max(0.0001, a) * (0.94 + densityBoost * 0.08));
      data[offset + 2] = Math.round(b / Math.max(0.0001, a) * (0.94 + densityBoost * 0.08));
      data[offset + 3] = Math.round(normalizedAlpha * 255);
    }
  }

  ctx.putImageData(image, 0, 0);
};
