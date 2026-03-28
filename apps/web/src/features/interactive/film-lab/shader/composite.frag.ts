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
uniform vec2 uResolution;
uniform vec2 uImageResolution;

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
  vec4 color = texture(uSource, vUv);

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

  // Before/After split
  vec2 origUv = coverUv(vUv, uResolution, uImageResolution);
  vec4 original = texture(uOriginalTexture, origUv);
  float lineWidth = 2.0 / uResolution.x;

  if (vUv.x < uSplitPosition - lineWidth) {
    fragColor = original;
  } else if (vUv.x < uSplitPosition + lineWidth) {
    fragColor = vec4(1.0);
  } else {
    fragColor = color;
  }
}
`;
