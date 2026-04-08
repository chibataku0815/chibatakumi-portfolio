import type { GradientPointConfig, OrganicGradientRecipe } from "../config";
import { applyToneGrade, hexToRgb, mixWeightedColors } from "./color";
import { applyTurbulencePasses } from "./turbulence";

const sampleGradientPoint = (point: GradientPointConfig, time: number) => {
  return {
    x:
      point.origin.x +
      Math.sin(time * point.speed + point.phase) * point.orbit.x +
      Math.cos(time * (point.speed * 0.61) + point.phase * 1.7) * point.drift.x,
    y:
      point.origin.y +
      Math.cos(time * point.speed * 0.82 + point.phase) * point.orbit.y +
      Math.sin(time * (point.speed * 0.57) + point.phase * 1.4) * point.drift.y,
    weight: point.weight,
    rgb: hexToRgb(point.color),
  };
};

export const renderOrganicGradient = ({
  target,
  time,
  recipe,
}: {
  target: HTMLCanvasElement;
  time: number;
  recipe: OrganicGradientRecipe;
}) => {
  const ctx = target.getContext("2d");
  if (!ctx) {
    return;
  }

  const width = target.width;
  const height = target.height;
  const image = ctx.createImageData(width, height);
  const data = image.data;
  const aspect = width / height;
  const baseColor = hexToRgb(recipe.baseColor);
  const points = recipe.points.map((point) => sampleGradientPoint(point, time));

  for (let y = 0; y < height; y += 1) {
    const v = (y + 0.5) / height;

    for (let x = 0; x < width; x += 1) {
      const u = (x + 0.5) / width;
      const warped = applyTurbulencePasses({
        u,
        v,
        time,
        passes: recipe.turbulence,
        aspect,
      });

      const weights = points.map((point) => {
        const dx = (warped.u - point.x) * aspect;
        const dy = warped.v - point.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return point.weight / Math.pow(distance + recipe.blendStrength + 0.06, 1.55);
      });

      const mixed = mixWeightedColors(
        points.map((point) => point.rgb),
        weights,
      );

      const glowMix =
        0.12 +
        Math.max(
          0,
          0.22 -
            Math.abs((warped.u - 0.5) * 0.9) -
            Math.abs((warped.v - 0.5) * 1.1),
        );
      const layered = {
        r: Math.round(baseColor.r + (mixed.r - baseColor.r) * (0.84 + glowMix)),
        g: Math.round(baseColor.g + (mixed.g - baseColor.g) * (0.84 + glowMix)),
        b: Math.round(baseColor.b + (mixed.b - baseColor.b) * (0.84 + glowMix)),
      };
      const graded = applyToneGrade(layered, recipe.tone);
      const offset = (y * width + x) * 4;

      data[offset] = graded.r;
      data[offset + 1] = graded.g;
      data[offset + 2] = graded.b;
      data[offset + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
};
