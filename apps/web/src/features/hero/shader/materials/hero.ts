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
uniform float uTime;
uniform vec2 uPointer;
uniform float uScroll;
uniform float uInteraction;
uniform int uLineCount;
uniform vec4 uLineRects[6];
uniform vec4 uAnchorRect;

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

float rectEdgeField(vec2 uv, vec4 rect, float thickness, float softness) {
  vec2 minEdge = rect.xy;
  vec2 maxEdge = rect.xy + rect.zw;
  vec2 inside = step(minEdge, uv) * step(uv, maxEdge);
  float inMask = inside.x * inside.y;
  if (inMask < 0.5) {
    return 0.0;
  }

  float left = abs(uv.x - minEdge.x);
  float right = abs(maxEdge.x - uv.x);
  float top = abs(uv.y - minEdge.y);
  float bottom = abs(maxEdge.y - uv.y);
  float edgeDist = min(min(left, right), min(top, bottom));
  return 1.0 - smoothstep(thickness, thickness + softness, edgeDist);
}

float rectFillField(vec2 uv, vec4 rect, float feather) {
  vec2 center = rect.xy + rect.zw * 0.5;
  vec2 halfSize = max(rect.zw * 0.5, vec2(0.001));
  vec2 delta = abs(uv - center) - halfSize;
  float outside = length(max(delta, 0.0));
  float inside = min(max(delta.x, delta.y), 0.0);
  float sdf = outside + inside;
  return 1.0 - smoothstep(0.0, feather, sdf);
}

void main() {
  vec2 uv = vUv;

  // === アニメーション計算 ===
  // 呼吸する光
  float breathe = sin(uTime * ${cfg.breathFrequency.toFixed(2)}) * 0.5 + 0.5;

  // カーソル影響 (radial falloff)
  vec2 pointerDist = uv - uPointer;
  float dist = length(pointerDist);
  float cursorInfluence = exp(-dist * ${cfg.cursorDistortionRadius.toFixed(2)});

  float lineField = 0.0;
  float lineFill = 0.0;
  for (int i = 0; i < 6; i++) {
    if (i >= uLineCount) {
      continue;
    }
    lineField = max(
      lineField,
      rectEdgeField(
        uv,
        uLineRects[i],
        ${cfg.lineThickness.toFixed(3)},
        ${cfg.lineSoftness.toFixed(3)}
      )
    );
    lineFill = max(lineFill, rectFillField(uv, uLineRects[i], 0.03));
  }

  float anchorField = rectFillField(uv, uAnchorRect, ${cfg.anchorFocus.toFixed(2)});
  float structuralEnergy = clamp(max(lineField, anchorField * 0.8), 0.0, 1.0);
  float heatState = mix(${cfg.idleHeat.toFixed(2)}, ${cfg.activeHeat.toFixed(2)}, uInteraction);
  float lineHeat = structuralEnergy * heatState;

  // カーソルUVワープ (写真にも影響するレンズ歪み効果)
  vec2 warpDir = normalize(pointerDist + vec2(0.001));
  float warpAmount =
    cursorInfluence * ${cfg.cursorWarpStrength.toFixed(3)} +
    lineHeat * ${cfg.refractionAmount.toFixed(3)};
  vec2 warpedUv = uv - warpDir * warpAmount;

  // スクロールによる粒度変調
  float scrollNorm = clamp(uScroll, 0.0, 1.0);
  float scrollEased = smoothstep(0.0, 1.0, scrollNorm);
  float grainScaleMod = mix(${cfg.scrollGrainScaleMin.toFixed(2)}, ${cfg.scrollGrainScaleMax.toFixed(2)}, scrollEased);

  // ノイズ流動用オフセット
  vec2 noiseOffset = vec2(uTime * ${cfg.noiseFlowSpeed.toFixed(2)}, uTime * ${cfg.noiseFlowSpeed.toFixed(2)} * 0.7);

  // object-contain計算 (ワープ済みUV使用)
  float screenAspect = uResolution.x / uResolution.y;
  float imageAspect = uTextureSize.x / uTextureSize.y;
  vec2 photoScale;
  if (screenAspect > imageAspect) {
    photoScale = vec2(imageAspect / screenAspect, 1.0);
  } else {
    photoScale = vec2(1.0, screenAspect / imageAspect);
  }
  vec2 photoOffset = (vec2(1.0) - photoScale) * 0.5;
  vec2 photoUv = (warpedUv - photoOffset) / photoScale;
  vec2 clampedUv = clamp(photoUv, vec2(0.0), vec2(1.0));

  // === Chromatic Aberration (カーソル近接時 + 構造線近傍) ===
  vec2 chromaticDir = normalize(pointerDist + vec2(0.001));
  float chromaticAmount =
    cursorInfluence * ${cfg.chromaticStrength.toFixed(4)} +
    lineHeat * ${cfg.chromaticStrength.toFixed(4)} * 0.42;

  // RGB各チャンネルを異なるUVでサンプリング
  vec2 uvR = clampedUv + chromaticDir * chromaticAmount;
  vec2 uvB = clampedUv - chromaticDir * chromaticAmount;

  // 写真色 (Chromatic Aberration適用)
  vec3 photoColor = vec3(
    texture2D(uTexture, clamp(uvR, vec2(0.0), vec2(1.0))).r,
    texture2D(uTexture, clampedUv).g,
    texture2D(uTexture, clamp(uvB, vec2(0.0), vec2(1.0))).b
  );

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

  // FBMによる色変調 (カーソル位置で位相シフト)
  vec2 fbmUv = uv * ${cfg.fbmScale.toFixed(2)};
  fbmUv += cursorInfluence * ${cfg.cursorFbmPhaseShift.toFixed(3)};
  float fbmValue = fbm(fbmUv);
  bgColor += bgColor * (fbmValue - 0.5) * ${cfg.fbmIntensity.toFixed(2)};

  // ノイズ振幅を写真粒度から算出
  float grainVariance = sampleGrainVariance(uTexture, vec2(0.5), 0.02);
  float grainAmp = clamp(
    mix(${cfg.grainMin.toFixed(3)}, ${cfg.grainMax.toFixed(3)}, grainVariance * ${cfg.grainVarianceScale.toFixed(1)}),
    ${cfg.grainMin.toFixed(3)},
    ${cfg.grainMax.toFixed(3)}
  );

  // 粗い＋細かいノイズ (スクロールで粒度変化 + 時間で流動)
  float coarse = noise(uv * uResolution * ${cfg.coarseScale.toFixed(2)} * grainScaleMod + noiseOffset) * grainAmp * ${cfg.coarseAmplitude.toFixed(2)};
  float fine = noise(uv * uResolution * ${cfg.fineScale.toFixed(2)} * grainScaleMod + noiseOffset * 2.0) * (grainAmp * ${cfg.fineAmplitude.toFixed(2)});
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

  // 呼吸は全画面ではなく、構造線まわりに集中させる
  float restrainedBreath = mix(
    1.0,
    mix(1.0 - ${cfg.breathIntensity.toFixed(3)} * 0.3, 1.0 + ${cfg.breathIntensity.toFixed(3)} * 0.5, breathe),
    clamp(lineFill * 0.65 + anchorField * 0.45, 0.0, 1.0)
  );
  color *= restrainedBreath;

  float scrollFade = 1.0 - smoothstep(0.0, 0.72, uScroll);
  float lineGlow = lineField * ${cfg.lineGlowStrength.toFixed(2)} * mix(0.8, 1.35, uInteraction) * scrollFade;
  float lineShadow = lineFill * ${cfg.lineShadowDepth.toFixed(2)} * mix(1.0, 0.35, uScroll);
  vec3 ember = vec3(1.0, 0.64, 0.24) * lineGlow;
  vec3 coolShadow = vec3(0.02, 0.02, 0.03) * lineShadow;

  // カーソル周辺ハイライトは anchor 近傍だけ強める
  color += vec3(cursorInfluence * ${cfg.cursorHighlight.toFixed(3)} * max(anchorField, lineField * 0.6));
  color += ember;
  color -= coolShadow;
  color = mix(color, color * 0.92, uScroll * lineFill * 0.6);
  color = clamp(color, 0.0, 1.0);

  gl_FragColor = vec4(color, 1.0);
}
`;
}
