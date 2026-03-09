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

// Hash without sine (Dave Hoskins) — stable on mobile GPUs
float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 uv = vUv;
  vec2 centerUv = uv - 0.5;

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

  // Lens warp near cursor
  vec2 warpDir = normalize(pointerDist + vec2(0.001));
  float warpAmount = cursorInfluence * ${cfg.cursorWarpStrength.toFixed(3)};
  vec2 warpedUv = coverUv - warpDir * warpAmount;

  // === Chromatic Aberration ===
  // Edge-based (lens barrel dispersion) + cursor-boosted
  float distSq = dot(centerUv, centerUv);
  float edgeChroma = distSq * ${cfg.chromaticStrength.toFixed(4)};
  float cursorChroma = cursorInfluence * ${cfg.cursorChromaticBoost.toFixed(4)};
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
  color *= mix(1.0 - ${cfg.breathIntensity.toFixed(3)}, 1.0 + ${cfg.breathIntensity.toFixed(3)}, breathe);

  // === Cursor highlight ===
  color += vec3(cursorInfluence * ${cfg.cursorHighlight.toFixed(3)});

  // === Scroll fade ===
  float scrollFade = 1.0 - smoothstep(0.0, 0.5, uScroll);
  color *= scrollFade;

  color = clamp(color, 0.0, 1.0);
  gl_FragColor = vec4(color, 1.0);
}
`;
}
