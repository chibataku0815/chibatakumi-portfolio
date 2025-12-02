/**
 * Hero Shader Material
 * 写真ベース背景のフラグメントシェーダ定義
 */

import { getNoiseGlsl } from "../core";
import { heroShaderConfig } from "../config";

const cfg = heroShaderConfig;

export const heroVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

export function createHeroFragmentShader(): string {
  const noiseGlsl = getNoiseGlsl({
    octaves: cfg.fbmOctaves,
    initialAmplitude: cfg.fbmInitialAmplitude,
    amplitudeDecay: cfg.fbmAmplitudeDecay,
    initialFrequency: cfg.fbmInitialFrequency,
  });

  return /* glsl */ `
varying vec2 vUv;
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec2 uTextureSize;

${noiseGlsl}

// 平均暗部色をサンプリング
vec3 sampleAverageColor(sampler2D tex) {
  vec3 sum = vec3(0.0);
  float totalWeight = 0.0;
  for (float x = ${cfg.sampleGridStart.toFixed(2)}; x <= ${cfg.sampleGridEnd.toFixed(2)}; x += ${cfg.sampleGridStep.toFixed(2)}) {
    for (float y = ${cfg.sampleGridStart.toFixed(2)}; y <= ${cfg.sampleGridEnd.toFixed(2)}; y += ${cfg.sampleGridStep.toFixed(2)}) {
      vec3 s = texture2D(tex, vec2(x, y)).rgb;
      float luma = dot(s, vec3(0.299, 0.587, 0.114));
      float w = 1.0 - luma * ${cfg.darkWeightFactor.toFixed(2)};
      sum += s * w;
      totalWeight += w;
    }
  }
  vec3 avg = sum / totalWeight;
  float avgLuma = dot(avg, vec3(0.299, 0.587, 0.114));
  return mix(vec3(avgLuma), avg, ${cfg.saturationRetain.toFixed(2)}) * ${cfg.baseColorDarken.toFixed(2)};
}

// ブラーサンプリング
vec3 blurSample(sampler2D tex, vec2 center, float radius) {
  vec3 sum = vec3(0.0);
  float total = 0.0;
  for (float dx = -2.0; dx <= 2.0; dx += 1.0) {
    for (float dy = -2.0; dy <= 2.0; dy += 1.0) {
      vec2 offset = vec2(dx, dy) * radius;
      vec2 sampleUv = clamp(center + offset, vec2(0.02), vec2(0.98));
      sum += texture2D(tex, sampleUv).rgb;
      total += 1.0;
    }
  }
  return sum / total;
}

// 粒度（分散）サンプリング
float sampleGrainVariance(sampler2D tex, vec2 center, float radius) {
  float mean = 0.0;
  float mean2 = 0.0;
  float total = 0.0;
  for (float dx = -1.0; dx <= 1.0; dx += 1.0) {
    for (float dy = -1.0; dy <= 1.0; dy += 1.0) {
      vec2 offset = vec2(dx, dy) * radius;
      vec2 uv = clamp(center + offset, vec2(0.02), vec2(0.98));
      float luma = dot(texture2D(tex, uv).rgb, vec3(0.299, 0.587, 0.114));
      mean += luma;
      mean2 += luma * luma;
      total += 1.0;
    }
  }
  mean /= total;
  mean2 /= total;
  return max(mean2 - mean * mean, 0.0);
}

void main() {
  vec2 uv = vUv;

  // object-contain計算
  float screenAspect = uResolution.x / uResolution.y;
  float imageAspect = uTextureSize.x / uTextureSize.y;
  vec2 photoScale;
  if (screenAspect > imageAspect) {
    photoScale = vec2(imageAspect / screenAspect, 1.0);
  } else {
    photoScale = vec2(1.0, screenAspect / imageAspect);
  }
  vec2 photoOffset = (vec2(1.0) - photoScale) * 0.5;
  vec2 photoUv = (uv - photoOffset) / photoScale;
  vec2 clampedUv = clamp(photoUv, vec2(0.0), vec2(1.0));

  // 写真色
  vec3 photoColor = texture2D(uTexture, clampedUv).rgb;

  // 背景基調色
  vec3 baseColor = sampleAverageColor(uTexture);

  // エッジ色（ブラー）
  float inset = ${cfg.edgeInset.toFixed(2)};
  vec2 edgeUv = clampedUv;
  edgeUv.x = clamp(edgeUv.x, inset, 1.0 - inset);
  edgeUv.y = clamp(edgeUv.y, inset, 1.0 - inset);
  vec3 edgeColor = blurSample(uTexture, edgeUv, ${cfg.blurRadius.toFixed(2)});
  float edgeLuma = dot(edgeColor, vec3(0.299, 0.587, 0.114));
  edgeColor = mix(vec3(edgeLuma), edgeColor, 0.7) * ${cfg.edgeColorDarken.toFixed(2)};

  // 写真外の距離
  float outsideDist = 0.0;
  if (photoUv.x < 0.0) outsideDist = max(outsideDist, -photoUv.x);
  if (photoUv.x > 1.0) outsideDist = max(outsideDist, photoUv.x - 1.0);
  if (photoUv.y < 0.0) outsideDist = max(outsideDist, -photoUv.y);
  if (photoUv.y > 1.0) outsideDist = max(outsideDist, photoUv.y - 1.0);

  // エッジ→ベースへのブレンド
  float blendToBase = smoothstep(0.0, ${cfg.blendToBaseDistance.toFixed(2)}, outsideDist);
  vec3 bgColor = mix(edgeColor, baseColor, blendToBase);

  // FBMによる色変調
  float fbmValue = fbm(uv * ${cfg.fbmScale.toFixed(2)});
  bgColor += bgColor * (fbmValue - 0.5) * ${cfg.fbmIntensity.toFixed(2)};

  // ノイズ振幅を写真粒度から算出
  float grainVariance = sampleGrainVariance(uTexture, vec2(0.5), 0.02);
  float grainAmp = clamp(
    mix(${cfg.grainMin.toFixed(3)}, ${cfg.grainMax.toFixed(3)}, grainVariance * ${cfg.grainVarianceScale.toFixed(1)}),
    ${cfg.grainMin.toFixed(3)},
    ${cfg.grainMax.toFixed(3)}
  );

  // 粗い＋細かいノイズ
  float coarse = noise(uv * uResolution * ${cfg.coarseScale.toFixed(2)}) * grainAmp * ${cfg.coarseAmplitude.toFixed(2)};
  float fine = noise(uv * uResolution * ${cfg.fineScale.toFixed(2)}) * (grainAmp * ${cfg.fineAmplitude.toFixed(2)});
  bgColor += coarse + fine;
  bgColor = max(bgColor, vec3(${cfg.minBrightness.toFixed(2)}));

  // エッジマスク
  float edgeFade = ${cfg.edgeFade.toFixed(2)};
  float edgeMask = 1.0;
  edgeMask *= smoothstep(0.0, edgeFade, photoUv.x);
  edgeMask *= smoothstep(0.0, edgeFade, 1.0 - photoUv.x);
  edgeMask *= smoothstep(0.0, edgeFade, photoUv.y);
  edgeMask *= smoothstep(0.0, edgeFade, 1.0 - photoUv.y);

  // 最終合成（ノイズは背景側で一度だけ加算済み）
  vec3 color = mix(bgColor, photoColor, edgeMask);

  gl_FragColor = vec4(color, 1.0);
}
`;
}
