export const compositeFragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D uSource;
uniform sampler2D uBloomTexture;
uniform sampler2D uHalationTexture;
uniform sampler2D uOriginalTexture;

uniform float uBloomStrength;
uniform float uHalationIntensity;

uniform float uVignette;
uniform float uGrainIntensity;
uniform float uTime;

uniform float uSplitPosition;
/** 0: Before/After（左は原画を coverUv でサンプル） / 1: A/B 比較（左は uOriginalTexture を vUv でサンプル＝スロット A の全パス結果） */
uniform float uAbCompare;
uniform vec2 uResolution;
uniform vec2 uImageResolution;
/** 色収差オン時の周辺のみシャープと微ブラーを混ぜる量（0〜1、JS 側で rgbShift に比例） */
uniform float uAberrationEdgeSoften;

in vec2 vUv;
out vec4 fragColor;

vec2 coverUv(vec2 uv, vec2 resolution, vec2 imageResolution) {
  float screenAspect = resolution.x / resolution.y;
  float imageAspect = imageResolution.x / imageResolution.y;
  vec2 scale = screenAspect > imageAspect
    ? vec2(1.0, imageAspect / screenAspect)
    : vec2(screenAspect / imageAspect, 1.0);
  return (uv - 0.5) * scale + 0.5;
}

float grain(vec2 uv, float time) {
  return fract(sin(dot(uv * time, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
}

void main() {
  // 周辺だけごく弱いブラー（色収差と併せたフィルム的周辺柔らかさ）
  vec2 edgeDelta = vUv - 0.5;
  edgeDelta.x *= uResolution.x / max(uResolution.y, 1.0);
  float edgeR = clamp(length(edgeDelta) * 1.414, 0.0, 1.0);
  float edgeMask = smoothstep(0.25, 1.0, edgeR);
  vec3 sharpRgb = texture(uSource, vUv).rgb;
  vec2 px = vec2(1.0 / max(uResolution.x, 1.0), 1.0 / max(uResolution.y, 1.0)) * 1.5;
  vec3 blurRgb =
    (texture(uSource, vUv + vec2(px.x, 0.0)).rgb +
     texture(uSource, vUv - vec2(px.x, 0.0)).rgb +
     texture(uSource, vUv + vec2(0.0, px.y)).rgb +
     texture(uSource, vUv - vec2(0.0, px.y)).rgb) *
    0.25;
  float softenAmt = clamp(uAberrationEdgeSoften * edgeMask, 0.0, 1.0);
  vec4 color = vec4(mix(sharpRgb, blurRgb, softenAmt), texture(uSource, vUv).a);

  // Bloom + Halation additive (no branching — strength=0 naturally zeros out)
  color.rgb += texture(uBloomTexture, vUv).rgb * uBloomStrength;
  color.rgb += texture(uHalationTexture, vUv).rgb * uHalationIntensity;

  // Vignette
  float dist = length(vUv - 0.5) * 1.414;
  float vig = 1.0 - uVignette * dist * dist;
  color.rgb *= clamp(vig, 0.0, 1.0);

  // Grain
  color.rgb += grain(vUv, uTime) * uGrainIntensity;
  color.rgb = clamp(color.rgb, 0.0, 1.0);

  // Before/After または A/B 比較の分割
  vec2 origUv = coverUv(vUv, uResolution, uImageResolution);
  vec4 leftSample = uAbCompare > 0.5
    ? texture(uOriginalTexture, vUv)
    : texture(uOriginalTexture, origUv);
  float lineWidth = 2.0 / uResolution.x;

  if (vUv.x < uSplitPosition - lineWidth) {
    fragColor = leftSample;
  } else if (vUv.x < uSplitPosition + lineWidth) {
    fragColor = vec4(1.0);
  } else {
    fragColor = color;
  }
}
`;
