/**
 * @fileoverview 多パス Film Lab の **Pass1 専用**フラグメント（解析グレード + 2D LUT のみ）。
 *
 * 主な仕様:
 * - GLSL ES 3.0（WebGL2）— bloom / halation / vignette / grain は composite パスへ分離。
 * - UV 計算は {@link GradeScene} の単パス版と同型（cover + rgbShift + 同色補正 + LUT）。
 *
 * 制限事項:
 * - ブラウザ本番の filmlab.frag（3D LUT）とは LUT 経路が異なる（Remotion は 2D パック）。
 */
export const gradeOnlyMultipassFragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D uTexture;
uniform float uImageAspect;
uniform float uCompAspect;
uniform float uExposure;
uniform float uContrast;
uniform float uSaturation;
uniform float uTemperature;
uniform float uTint;
uniform float uRgbShift;
uniform float uFade;
uniform float uHighlights;
uniform float uShadows;
uniform sampler2D uLUT2D;
uniform float uLutEnabled;
uniform float uLutIntensity;
uniform float uLutSize;

in vec2 vUv;
out vec4 fragColor;

vec2 coverUv(vec2 uv, float imgAspect, float compAspect) {
  vec2 scale = compAspect > imgAspect
    ? vec2(1.0, imgAspect / compAspect)
    : vec2(compAspect / imgAspect, 1.0);
  return (uv - 0.5) * scale + 0.5;
}

vec3 lutTexel(float r, float g, float b) {
  float n = uLutSize;
  vec2 uv = (vec2(r + g * n, b) + 0.5) / vec2(n * n, n);
  return texture(uLUT2D, uv).rgb;
}

vec3 sampleLutTrilinear(vec3 c) {
  float n = uLutSize;
  c = clamp(c, 0.0, 1.0);
  vec3 scaled = c * (n - 1.0);
  vec3 c0 = floor(scaled);
  vec3 f = scaled - c0;
  vec3 c1 = min(c0 + 1.0, vec3(n - 1.0));
  vec3 s000 = lutTexel(c0.x, c0.y, c0.z);
  vec3 s100 = lutTexel(c1.x, c0.y, c0.z);
  vec3 s010 = lutTexel(c0.x, c1.y, c0.z);
  vec3 s110 = lutTexel(c1.x, c1.y, c0.z);
  vec3 s001 = lutTexel(c0.x, c0.y, c1.z);
  vec3 s101 = lutTexel(c1.x, c0.y, c1.z);
  vec3 s011 = lutTexel(c0.x, c1.y, c1.z);
  vec3 s111 = lutTexel(c1.x, c1.y, c1.z);
  vec3 x0 = mix(s000, s100, f.x);
  vec3 x1 = mix(s010, s110, f.x);
  vec3 x2 = mix(s001, s101, f.x);
  vec3 x3 = mix(s011, s111, f.x);
  vec3 y0 = mix(x0, x1, f.y);
  vec3 y1 = mix(x2, x3, f.y);
  return mix(y0, y1, f.z);
}

vec3 adjustTemperature(vec3 c, float t) {
  return c + vec3(t * 0.05, t * 0.02, -t * 0.04);
}

vec4 rgbShiftSample(sampler2D tex, vec2 uv, float amount) {
  float r = texture(tex, uv + vec2(amount, 0.0)).r;
  float g = texture(tex, uv).g;
  float b = texture(tex, uv - vec2(amount, 0.0)).b;
  float a = texture(tex, uv).a;
  return vec4(r, g, b, a);
}

void main() {
  vec2 uv = coverUv(vUv, uImageAspect, uCompAspect);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  vec4 tex = uRgbShift > 0.0001
    ? rgbShiftSample(uTexture, uv, uRgbShift)
    : texture(uTexture, uv);
  vec3 col = tex.rgb * pow(2.0, uExposure);
  col = (col - 0.5) * uContrast + 0.5;
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(l), col, uSaturation);
  col = adjustTemperature(col, uTemperature);
  col.r += uTint * 0.05;
  col.g -= uTint * 0.08;
  col.b += uTint * 0.05;
  col.rgb = col.rgb + uFade * (1.0 - col.rgb);
  float lumHS = dot(col.rgb, vec3(0.2126, 0.7152, 0.0722));
  col.rgb += uShadows * (1.0 - lumHS) * 0.5;
  col.rgb += uHighlights * lumHS * 0.5;

  if (uLutEnabled > 0.5) {
    vec3 lutRgb = sampleLutTrilinear(col);
    col = mix(col, lutRgb, uLutIntensity);
  }

  fragColor = vec4(clamp(col, 0.0, 1.0), tex.a);
}
`;
