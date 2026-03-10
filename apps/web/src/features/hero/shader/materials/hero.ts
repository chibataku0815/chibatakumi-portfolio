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
uniform vec3 uAccentColor;
uniform vec2 uFocusPoint;
uniform float uAccentMix;
uniform float uDistortionBoost;

${noiseGlsl}

// === Spectral Dispersion Helper ===
// Maps t (0-1) to approximate visible spectrum RGB
vec3 spectralWeight(float t) {
  // Attempt to reproduce a smooth visible spectrum: violet → blue → cyan → green → yellow → red
  vec3 c;
  t = clamp(t, 0.0, 1.0);
  if (t < 0.25) {
    c = mix(vec3(0.36, 0.0, 0.72), vec3(0.0, 0.2, 1.0), t / 0.25);
  } else if (t < 0.5) {
    c = mix(vec3(0.0, 0.2, 1.0), vec3(0.0, 0.9, 0.3), (t - 0.25) / 0.25);
  } else if (t < 0.75) {
    c = mix(vec3(0.0, 0.9, 0.3), vec3(1.0, 0.9, 0.0), (t - 0.5) / 0.25);
  } else {
    c = mix(vec3(1.0, 0.9, 0.0), vec3(1.0, 0.15, 0.0), (t - 0.75) / 0.25);
  }
  return c;
}

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

  // === Scroll Cascade Phases ===
  float scrollNorm = clamp(uScroll, 0.0, 1.0);
  float scrollEased = smoothstep(0.0, 1.0, scrollNorm);
  // Phase intensities for cascade
  float phaseFullIntensity = 1.0 - smoothstep(0.0, 0.15, scrollNorm);
  float phaseFlare = 1.0 - smoothstep(0.15, 0.4, scrollNorm);
  float phaseGrainBoost = smoothstep(0.4, 0.7, scrollNorm);
  float phaseDarkDissolve = smoothstep(0.7, 1.0, scrollNorm);

  // === アニメーション計算 ===
  float breathe = sin(uTime * ${cfg.breathFrequency.toFixed(2)}) * 0.5 + 0.5;

  // カーソル影響 (radial falloff)
  vec2 pointerDist = uv - uPointer;
  float dist = length(pointerDist);
  float cursorInfluence = exp(-dist * ${cfg.cursorDistortionRadius.toFixed(2)});

  // フォーカスポイント影響
  float focusDist = length(uv - uFocusPoint);
  float focusInfluence = exp(-focusDist * 2.4);

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

  // === Heat Distortion (FBM-based UV shimmer near structure lines) ===
  float heatMask = lineHeat * focusInfluence * uDistortionBoost;
  float heatDisplaceX = fbm(vec2(
    uv.x * ${cfg.heatFrequencyX.toFixed(1)} + uTime * ${cfg.heatSpeed.toFixed(2)},
    uv.y * ${cfg.heatFrequencyY.toFixed(1)} - uTime * ${cfg.heatSpeed.toFixed(2)} * 1.3
  )) - 0.5;
  float heatDisplaceY = fbm(vec2(
    uv.y * ${cfg.heatFrequencyY.toFixed(1)} + uTime * ${cfg.heatSpeed.toFixed(2)} * 0.7,
    uv.x * ${cfg.heatFrequencyX.toFixed(1)} + uTime * ${cfg.heatSpeed.toFixed(2)} * 0.9
  )) - 0.5;
  vec2 heatOffset = vec2(heatDisplaceX, heatDisplaceY) * ${cfg.heatDistortionStrength.toFixed(4)} * heatMask * phaseFlare;

  // カーソルUVワープ (写真にも影響するレンズ歪み効果) + heat distortion
  vec2 warpDir = normalize(pointerDist + vec2(0.001));
  float warpAmount =
    cursorInfluence * ${cfg.cursorWarpStrength.toFixed(3)} +
    lineHeat * ${cfg.refractionAmount.toFixed(3)};
  vec2 warpedUv = uv - warpDir * warpAmount + heatOffset;

  // スクロールによる粒度変調 (Phase 3: grain boost)
  float grainScaleMod = mix(
    ${cfg.scrollGrainScaleMin.toFixed(2)},
    ${cfg.scrollGrainScaleMax.toFixed(2)},
    mix(scrollEased, 1.0, phaseGrainBoost * 0.5)
  );

  // ノイズ流動用オフセット
  vec2 noiseOffset = vec2(uTime * ${cfg.noiseFlowSpeed.toFixed(2)}, uTime * ${cfg.noiseFlowSpeed.toFixed(2)} * 0.7);

  // object-contain計算 (ワープ済みUV使用)
  float screenAspect = uResolution.x / uResolution.y;
  float imageAspect = uTextureSize.x / uTextureSize.y;
  vec2 photoScale;
  if (screenAspect > imageAspect) {
    photoScale = vec2(1.0, screenAspect / imageAspect);
  } else {
    photoScale = vec2(imageAspect / screenAspect, 1.0);
  }
  vec2 photoOffset = (vec2(1.0) - photoScale) * 0.5;
  vec2 photoUv = (warpedUv - photoOffset) / photoScale;
  vec2 clampedUv = clamp(photoUv, vec2(0.0), vec2(1.0));

  // === Prismatic Dispersion (spectral chromatic aberration) ===
  vec2 dispDir = normalize(pointerDist + vec2(0.001));
  float dispAmount =
    cursorInfluence * ${cfg.chromaticStrength.toFixed(4)} * ${cfg.dispersionSpread.toFixed(1)} +
    lineHeat * ${cfg.chromaticStrength.toFixed(4)} * 0.42 * ${cfg.dispersionSpread.toFixed(1)};
  // Scale dispersion with scroll cascade
  dispAmount *= mix(1.0, 0.3, 1.0 - phaseFlare);

  vec3 photoColor = vec3(0.0);
  vec3 weightSum = vec3(0.0);
  // 7-sample spectral dispersion
  for (int si = 0; si < ${cfg.dispersionSamples}; si++) {
    float t = float(si) / float(${cfg.dispersionSamples} - 1);
    float offsetT = t - 0.5; // -0.5 to 0.5
    vec2 sampleOffset = dispDir * dispAmount * offsetT;
    vec2 sUv = clamp(clampedUv + sampleOffset, vec2(0.0), vec2(1.0));
    vec3 sColor = texture2D(uTexture, sUv).rgb;
    vec3 w = spectralWeight(t);
    photoColor += sColor * w;
    weightSum += w;
  }
  photoColor /= max(weightSum, vec3(0.001));

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
  // Scroll Phase 3: boost grain
  grainAmp *= (1.0 + phaseGrainBoost * 1.5);

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

  // Scroll Phase 2: desaturate photo slightly
  vec3 desatPhoto = photoColor;
  float photoLuma = dot(photoColor, vec3(0.299, 0.587, 0.114));
  desatPhoto = mix(photoColor, vec3(photoLuma), (1.0 - phaseFlare) * 0.3);

  // 最終合成
  vec3 color = mix(bgColor, desatPhoto, edgeMask);

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
  // Ember tinted with accent color
  vec3 accentEmber = mix(vec3(1.0, 0.64, 0.24), uAccentColor, uAccentMix * 0.6);
  vec3 ember = accentEmber * lineGlow;
  vec3 coolShadow = vec3(0.02, 0.02, 0.03) * lineShadow;

  // カーソル周辺ハイライトは anchor 近傍だけ強める
  color += vec3(cursorInfluence * ${cfg.cursorHighlight.toFixed(3)} * max(anchorField, lineField * 0.6));
  color += ember;
  color -= coolShadow;
  color = mix(color, color * 0.92, uScroll * lineFill * 0.6);

  // === Anamorphic Lens Flare ===
  // Detect luminance hotspots and create horizontal streak
  float colorLuma = dot(color, vec3(0.299, 0.587, 0.114));
  float flareSource = smoothstep(${cfg.flareThreshold.toFixed(2)}, 1.0, colorLuma);
  // Also glow near focus point
  flareSource = max(flareSource, focusInfluence * 0.4 * lineHeat);

  // Horizontal streak with pointer-influenced angle
  float flareAngle = (uPointer.x - 0.5) * 0.12; // subtle rotation
  vec2 flareDir = vec2(cos(flareAngle), sin(flareAngle));

  vec3 flareAccum = vec3(0.0);
  float flareTotal = 0.0;
  for (int fi = 0; fi < ${cfg.flareSamples}; fi++) {
    float offset = float(fi) - float(${cfg.flareSamples}) * 0.5;
    float falloff = exp(-abs(offset) * ${cfg.flareDecay.toFixed(3)});
    vec2 samplePos = uv + flareDir * offset * 0.012;
    // Sample the luminance at this position
    float sLuma = dot(
      texture2D(uTexture, clamp((samplePos - photoOffset) / photoScale, vec2(0.0), vec2(1.0))).rgb,
      vec3(0.299, 0.587, 0.114)
    );
    float hotspot = smoothstep(${cfg.flareThreshold.toFixed(2)}, 1.0, sLuma);
    flareAccum += mix(vec3(1.0, 0.9, 0.7), uAccentColor, ${cfg.flareTint.toFixed(2)} * uAccentMix) * hotspot * falloff;
    flareTotal += falloff;
  }
  flareAccum /= max(flareTotal, 1.0);

  // Apply flare with scroll phase fadeout
  float flareIntensity = ${cfg.flareStrength.toFixed(2)} * phaseFlare * mix(0.6, 1.0, phaseFullIntensity);
  color += flareAccum * flareIntensity;

  // === Scroll Phase 4: Dark ambient dissolve ===
  color = mix(color, color * vec3(0.08, 0.07, 0.06), phaseDarkDissolve * 0.85);

  color = clamp(color, 0.0, 1.0);

  gl_FragColor = vec4(color, 1.0);
}
`;
}
