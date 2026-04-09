export type GradientFieldLayerConfig = {
  readonly name: string;
  readonly colorA: string;
  readonly colorB: string;
  readonly opacity: number;
  readonly angleOffsetDeg: number;
  readonly rotationMultiplier: number;
  readonly phase: number;
};

export type DistortionFieldInput = {
  readonly x: number;
  readonly y: number;
  readonly time: number;
  readonly amount: number;
  readonly size: number;
  readonly evolutionSpeed: number;
  readonly layerIndex: number;
  readonly phase: number;
  readonly aspect: number;
};

export type GradientFieldDistortionConfig = Pick<
  DistortionFieldInput,
  "amount" | "size" | "evolutionSpeed"
>;

export type GradientFieldDriftConfig = {
  readonly fps: number;
  readonly baseGradientAngleDeg: number;
  readonly gradientAngleOffsetScale: number;
  readonly gradientSwingAmplitudeDeg: number;
  readonly gradientSwingSpeed: number;
  readonly baseWipeAngleStepDeg: number;
  readonly rotationSpeedDegPerSec: number;
  readonly wipeCompletion: number;
  readonly wipeCompletionAmplitude: number;
  readonly wipeCompletionSpeed: number;
  readonly wipePhaseMultiplier: number;
  readonly colorDriftAmount: number;
  readonly colorDriftSpeed: number;
};

export type GradientFieldDriftState = {
  readonly gradientAxisX: number;
  readonly gradientAxisY: number;
  readonly wipeAxisX: number;
  readonly wipeAxisY: number;
  readonly completion: number;
  readonly colorDrift: number;
};

export type GradientReadableRangeConfig = {
  readonly featherPx: number;
  readonly mixScale: number;
  readonly referenceWidth?: number;
  readonly referenceHeight?: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const smoothstep = (edge0: number, edge1: number, x: number) => {
  if (edge0 === edge1) {
    return x < edge0 ? 0 : 1;
  }

  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const degToRad = (deg: number) => (deg * Math.PI) / 180;

const featherToNormalized = ({
  featherPx,
  width,
  height,
}: {
  featherPx: number;
  width: number;
  height: number;
}) => clamp(featherPx / Math.max(width, height) / 1.9, 0.03, 1.35);

const hexToRgb = (hex: string) => {
  const sanitized = hex.replace("#", "");
  const normalized =
    sanitized.length === 3
      ? sanitized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : sanitized;

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
};

const mixRgb = (
  colorA: { readonly r: number; readonly g: number; readonly b: number },
  colorB: { readonly r: number; readonly g: number; readonly b: number },
  mix: number,
) => {
  const clamped = clamp01(mix);
  return {
    r: Math.round(colorA.r + (colorB.r - colorA.r) * clamped),
    g: Math.round(colorA.g + (colorB.g - colorA.g) * clamped),
    b: Math.round(colorA.b + (colorB.b - colorA.b) * clamped),
  };
};

export const distortionField = ({
  x,
  y,
  time,
  amount,
  size,
  evolutionSpeed,
  layerIndex,
  phase,
  aspect,
}: DistortionFieldInput) => {
  const t = time * evolutionSpeed;
  const normalizedSize = Math.max(0.45, size / 100);
  const baseFreq = 2.2 / normalizedSize;
  const secondaryFreq = 3.8 / normalizedSize;
  const tertiaryFreq = 5.2 / normalizedSize;
  const amplitude = amount / 1400;
  const px = x * aspect;
  const py = y;
  const layerPhase = layerIndex * 1.173 + phase;

  const dx =
    (Math.sin(py * baseFreq * 2.6 + t * 1.4 + layerPhase) +
      0.55 *
        Math.sin(
          (px + py) * secondaryFreq * 1.7 - t * 0.9 + layerPhase * 0.7,
        ) +
      0.25 *
        Math.cos(
          (px - py) * tertiaryFreq * 1.2 + t * 0.45 + layerPhase * 1.6,
        )) *
    amplitude;

  const dy =
    (Math.cos(px * baseFreq * 2.1 - t * 1.1 + layerPhase * 1.2) +
      0.45 *
        Math.sin(
          (px - py) * secondaryFreq * 1.5 + t * 0.7 + layerPhase * 0.3,
        ) +
      0.3 * Math.cos((px + py) * tertiaryFreq + t * 0.5 + layerPhase)) *
    amplitude;

  return {
    x: x + dx / aspect,
    y: y + dy,
  };
};

export const fieldDrift = ({
  frame,
  layer,
  layerIndex,
  drift,
}: {
  frame: number;
  layer: GradientFieldLayerConfig;
  layerIndex: number;
  drift: GradientFieldDriftConfig;
}): GradientFieldDriftState => {
  const time = frame / drift.fps;
  const gradientAngle = degToRad(
    drift.baseGradientAngleDeg +
      layer.angleOffsetDeg * drift.gradientAngleOffsetScale +
      Math.sin(time * drift.gradientSwingSpeed + layer.phase) *
        drift.gradientSwingAmplitudeDeg,
  );
  const wipeAngle = degToRad(
    (layerIndex + 1) * drift.baseWipeAngleStepDeg +
      time * drift.rotationSpeedDegPerSec * layer.rotationMultiplier,
  );

  return {
    gradientAxisX: Math.cos(gradientAngle),
    gradientAxisY: Math.sin(gradientAngle),
    wipeAxisX: Math.cos(wipeAngle),
    wipeAxisY: Math.sin(wipeAngle),
    completion:
      drift.wipeCompletion +
      Math.sin(
        time * drift.wipeCompletionSpeed +
          layer.phase * drift.wipePhaseMultiplier,
      ) *
        drift.wipeCompletionAmplitude,
    colorDrift:
      Math.sin(time * drift.colorDriftSpeed + layer.phase) *
      drift.colorDriftAmount,
  };
};

export const gradientReadableRange = ({
  projection,
  completion,
  featherPx,
  width,
  height,
}: {
  projection: number;
  completion: number;
  featherPx: number;
  width: number;
  height: number;
}) => {
  const threshold = (completion / 100) * 2 - 1;
  const feather = featherToNormalized({ featherPx, width, height });

  return 1 - smoothstep(threshold - feather, threshold + feather, projection);
};

export const gradientFieldLayer = ({
  target,
  frame,
  layer,
  layerIndex,
  drift,
  readableRange,
  distortion,
  opacity,
  alphaFloor = 0,
}: {
  target: HTMLCanvasElement;
  frame: number;
  layer: GradientFieldLayerConfig;
  layerIndex: number;
  drift: GradientFieldDriftConfig;
  readableRange: GradientReadableRangeConfig;
  distortion: GradientFieldDistortionConfig;
  opacity: number;
  alphaFloor?: number;
}) => {
  const ctx = target.getContext("2d");
  if (!ctx) {
    return;
  }

  const { width, height } = target;
  const image = ctx.createImageData(width, height);
  const data = image.data;
  const colorA = hexToRgb(layer.colorA);
  const colorB = hexToRgb(layer.colorB);
  const time = frame / drift.fps;
  const aspect = width / height;
  const motion = fieldDrift({ frame, layer, layerIndex, drift });
  const safeAlphaFloor = clamp01(alphaFloor);
  const rangeWidth = readableRange.referenceWidth ?? width;
  const rangeHeight = readableRange.referenceHeight ?? height;

  for (let y = 0; y < height; y += 1) {
    const baseY = ((y + 0.5) / height) * 2 - 1;

    for (let x = 0; x < width; x += 1) {
      const baseX = ((x + 0.5) / width) * 2 - 1;
      const warped = distortionField({
        x: baseX,
        y: baseY,
        time,
        amount: distortion.amount,
        size: distortion.size,
        evolutionSpeed: distortion.evolutionSpeed,
        layerIndex,
        phase: layer.phase,
        aspect,
      });
      const gradientProjection =
        warped.x * motion.gradientAxisX + warped.y * motion.gradientAxisY;
      const wipeProjection =
        warped.x * motion.wipeAxisX + warped.y * motion.wipeAxisY;
      const mix = clamp01(
        0.5 + gradientProjection * readableRange.mixScale + motion.colorDrift,
      );
      const rgb = mixRgb(colorA, colorB, mix);
      const readableAlpha = gradientReadableRange({
        projection: wipeProjection,
        completion: motion.completion,
        featherPx: readableRange.featherPx,
        width: rangeWidth,
        height: rangeHeight,
      });
      const alpha =
        (safeAlphaFloor + readableAlpha * (1 - safeAlphaFloor)) * opacity;
      const offset = (y * width + x) * 4;

      data[offset] = rgb.r;
      data[offset + 1] = rgb.g;
      data[offset + 2] = rgb.b;
      data[offset + 3] = Math.round(clamp01(alpha) * 255);
    }
  }

  ctx.putImageData(image, 0, 0);
};
