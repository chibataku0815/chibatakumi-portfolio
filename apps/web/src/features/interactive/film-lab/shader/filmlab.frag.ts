export const filmlabFragmentShader = /* glsl */ `
precision highp float;
precision highp sampler3D;

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec2 uImageResolution;
uniform float uTime;

uniform float uExposure;
uniform float uContrast;
uniform float uSaturation;
uniform float uTemperature;
uniform float uTint;

uniform float uRGBShift;
uniform float uGrainIntensity;
uniform float uVignette;

uniform float uFade;
uniform float uHighlights;
uniform float uShadows;
uniform vec3 uShadowTint;
uniform vec3 uHighlightTint;

uniform float uSplitPosition;

uniform highp sampler3D uLUT;
uniform float uLUTIntensity;
uniform float uLUTEnabled;

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

vec4 rgbShiftSample(sampler2D tex, vec2 uv, float amount) {
  float r = texture(tex, uv + vec2(amount, 0.0)).r;
  float g = texture(tex, uv).g;
  float b = texture(tex, uv - vec2(amount, 0.0)).b;
  float a = texture(tex, uv).a;
  return vec4(r, g, b, a);
}

float grain(vec2 uv, float time) {
  return fract(sin(dot(uv * time, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
}

void main() {
  vec2 uv = coverUv(vUv, uResolution, uImageResolution);

  vec4 color = uRGBShift > 0.0
    ? rgbShiftSample(uTexture, uv, uRGBShift)
    : texture(uTexture, uv);

  // Exposure
  color.rgb *= pow(2.0, uExposure);

  // Contrast
  color.rgb = (color.rgb - 0.5) * uContrast + 0.5;

  // Saturation
  float luma = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
  color.rgb = mix(vec3(luma), color.rgb, uSaturation);

  // Temperature
  color.r += uTemperature * 0.1;
  color.b -= uTemperature * 0.1;

  // Tint (green / magenta axis)
  color.r += uTint * 0.05;
  color.g -= uTint * 0.08;
  color.b += uTint * 0.05;

  // Split toning
  float lumST = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
  color.rgb += uShadowTint * (1.0 - lumST) * 0.18;
  color.rgb += uHighlightTint * lumST * 0.18;

  // Fade (Lift — フィルムの「浮いた黒」)
  color.rgb = color.rgb + uFade * (1.0 - color.rgb);

  // Highlights / Shadows
  float lumHS = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
  color.rgb += uShadows * (1.0 - lumHS) * 0.5;
  color.rgb += uHighlights * lumHS * 0.5;

  // LUT (after all color grading)
  if (uLUTEnabled > 0.5) {
    vec3 lutCoord = clamp(color.rgb, 0.0, 1.0);
    vec3 lutColor = texture(uLUT, lutCoord).rgb;
    color.rgb = mix(color.rgb, lutColor, uLUTIntensity);
  }

  color.rgb = clamp(color.rgb, 0.0, 1.0);
  fragColor = color;
}
`;
