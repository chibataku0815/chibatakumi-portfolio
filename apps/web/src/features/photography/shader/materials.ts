/**
 * Photography Video Hero Shader Material
 * シネマティック動画背景用フラグメントシェーダ
 *
 * Effects:
 * - Film grain (luminance-adaptive, temporal)
 * - Chromatic aberration (lens-like, edge-focused + cursor boost)
 * - Vignette (smooth S-curve)
 * - Pointer-responsive lens warp
 * - Breathing light
 * - Warm color grading
 */

import { videoShaderConfig } from "./config";

const cfg = videoShaderConfig;

export const videoVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

export function createVideoFragmentShader(): string {
  return /* glsl */ `
precision highp float;

varying vec2 vUv;
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec2 uTextureSize;
uniform float uTime;
uniform vec2 uPointer;
uniform float uScroll;
uniform float uHeat;
uniform int uMaskCount;
uniform vec4 uMaskRects[6];
uniform vec4 uAnchorRect;

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

// Hash without sine (Dave Hoskins) — stable on mobile GPUs
float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 uv = vUv;
  vec2 centerUv = uv - 0.5;
  float maskEdge = 0.0;
  float maskFill = 0.0;
  for (int i = 0; i < 6; i++) {
    if (i >= uMaskCount) {
      continue;
    }
    maskEdge = max(maskEdge, rectEdgeField(uv, uMaskRects[i], 0.004, 0.018));
    maskFill = max(maskFill, rectFillField(uv, uMaskRects[i], 0.05));
  }
  float anchorField = rectFillField(uv, uAnchorRect, 0.06);
  float panelField = clamp(max(maskEdge, anchorField * 0.8), 0.0, 1.0);

  // === Object-fit: cover ===
  float screenAspect = uResolution.x / uResolution.y;
  float videoAspect = uTextureSize.x / uTextureSize.y;
  vec2 scale;
  if (screenAspect > videoAspect) {
    scale = vec2(1.0, videoAspect / screenAspect);
  } else {
    scale = vec2(screenAspect / videoAspect, 1.0);
  }
  vec2 coverOffset = (vec2(1.0) - scale) * 0.5;
  vec2 coverUv = coverOffset + uv * scale;

  // === Pointer interaction ===
  vec2 pointerDist = uv - uPointer;
  float dist = length(pointerDist);
  float cursorInfluence = exp(-dist * ${cfg.cursorRadius.toFixed(1)});
  float pointerHotspot = max(cursorInfluence, anchorField * ${cfg.pointerHotspot.toFixed(2)});

  // Lens warp near cursor
  vec2 warpDir = normalize(pointerDist + vec2(0.001));
  float warpAmount =
    cursorInfluence * ${cfg.cursorWarpStrength.toFixed(3)} +
    panelField * uHeat * ${cfg.glassRefraction.toFixed(3)};
  vec2 warpedUv = coverUv - warpDir * warpAmount;

  // === Chromatic Aberration ===
  // Edge-based (lens barrel dispersion) + cursor-boosted
  float distSq = dot(centerUv, centerUv);
  float edgeChroma = distSq * ${cfg.chromaticStrength.toFixed(4)};
  float cursorChroma = pointerHotspot * ${cfg.cursorChromaticBoost.toFixed(4)};
  vec2 chromaDir = normalize(centerUv + vec2(0.001));
  vec2 chromaOffset = chromaDir * (edgeChroma + cursorChroma);

  float r = texture2D(uTexture, clamp(warpedUv + chromaOffset, 0.0, 1.0)).r;
  float g = texture2D(uTexture, clamp(warpedUv, 0.0, 1.0)).g;
  float b = texture2D(uTexture, clamp(warpedUv - chromaOffset, 0.0, 1.0)).b;
  vec3 color = vec3(r, g, b);

  // === Color Grading ===
  // Slight warm shift
  color.r += ${cfg.warmShift.toFixed(3)};
  color.b -= ${cfg.warmShift.toFixed(3)} * 0.5;
  // Contrast
  color = (color - 0.5) * ${cfg.contrast.toFixed(2)} + 0.5;

  // === Vignette ===
  float vignetteDist = length(centerUv);
  float vignette = smoothstep(${cfg.vignetteRadius.toFixed(2)}, ${cfg.vignetteSmoothing.toFixed(2)}, vignetteDist * ${cfg.vignetteStrength.toFixed(2)});
  color *= vignette;

  // === Film Grain ===
  float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float grainResponse = 1.0 - abs(luminance - 0.5) * 2.0;
  grainResponse = mix(0.3, 1.0, grainResponse);
  float noise = hash13(vec3(gl_FragCoord.xy, uTime * ${cfg.grainSpeed.toFixed(1)}));
  noise = noise * 2.0 - 1.0;
  color += noise * ${cfg.grainIntensity.toFixed(3)} * grainResponse;

  // === Breathing ===
  float breathe = sin(uTime * ${cfg.breathFrequency.toFixed(2)}) * 0.5 + 0.5;
  color *= mix(
    1.0,
    mix(1.0 - ${cfg.breathIntensity.toFixed(3)} * 0.45, 1.0 + ${cfg.breathIntensity.toFixed(3)} * 0.55, breathe),
    clamp(maskFill * 0.72 + anchorField * 0.4, 0.0, 1.0)
  );

  // === Cursor highlight ===
  color += vec3(pointerHotspot * ${cfg.cursorHighlight.toFixed(3)} * max(panelField, 0.25));

  // === Signature heat response ===
  float heatMask = exp(-dist * ${cfg.heatRadius.toFixed(1)});
  heatMask += smoothstep(0.18, 0.62, 1.0 - abs(centerUv.y)) * uScroll * ${cfg.heatScrollBoost.toFixed(2)};
  vec3 ember = vec3(1.0, 0.62, 0.18) * heatMask * uHeat * ${cfg.heatStrength.toFixed(2)};
  color += ember;

  float surfaceShadow = maskFill * ${cfg.surfaceShadow.toFixed(2)} * mix(1.0, 0.45, uScroll);
  float sweep = smoothstep(-0.2, 0.95, uv.x + uv.y * 0.22 + sin(uTime * 0.7) * 0.08);
  float sweepMask = panelField * pointerHotspot * sweep * ${cfg.accentSweep.toFixed(2)};
  color += vec3(1.0, 0.68, 0.26) * sweepMask;
  color -= vec3(0.02, 0.02, 0.03) * surfaceShadow;

  // === Scroll fade ===
  float scrollFade = 1.0 - smoothstep(0.0, 0.5, uScroll);
  color *= scrollFade;

  color = clamp(color, 0.0, 1.0);
  gl_FragColor = vec4(color, 1.0);
}
`;
}
