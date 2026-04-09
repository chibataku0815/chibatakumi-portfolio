import type {
  GradientPointConfig,
  MarbleRecipe,
  MooographSmokePreset,
  OrganicGradientRecipe,
  TurbulencePass,
  VaporCompositeParams,
} from "./types";

type RenderTarget = {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
};

type ProgramInfo = {
  program: WebGLProgram;
  positionLocation: number;
  uniformCache: Map<string, WebGLUniformLocation | null>;
};

type GradientUniformData = {
  points: Float32Array;
  colors: Float32Array;
  weights: Float32Array;
  baseColor: Float32Array;
  tone: Float32Array;
  blendStrength: number;
};

type RibbonSeedPoint = {
  x: number;
  y: number;
  halfWidth: number;
  colorMix: number;
};

const MAX_GRADIENT_POINTS = 4;
const MAX_RIBBON_POINTS = 8;
const MAX_RIBBON_PALETTE = 5;

const rendererCache = new WeakMap<HTMLCanvasElement, WebGLEffectRenderer>();
const webglCanvasPool = new Map<string, HTMLCanvasElement>();

const vertexShaderSource = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const sharedNoise = `
float hash12(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(hash12(i + vec2(0.0, 0.0)), hash12(i + vec2(1.0, 0.0)), u.x),
    mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 rot = mat2(1.6, -1.2, 1.2, 1.6);

  for (int i = 0; i < 8; i++) {
    if (i >= octaves) {
      break;
    }

    value += noise(p) * amplitude;
    p = rot * p * 1.92 + vec2(17.31, 9.27);
    amplitude *= 0.5;
  }

  return value;
}

vec2 mirroredRepeat(vec2 uv) {
  vec2 tiled = mod(uv, 2.0);
  return mix(tiled, 2.0 - tiled, step(1.0, tiled));
}
`;

const gradientFragmentSource = `
precision highp float;
varying vec2 v_uv;

uniform float u_aspect;
uniform vec2 u_points[${MAX_GRADIENT_POINTS}];
uniform vec3 u_colors[${MAX_GRADIENT_POINTS}];
uniform float u_weights[${MAX_GRADIENT_POINTS}];
uniform vec3 u_baseColor;
uniform vec4 u_tone;
uniform float u_blendStrength;

vec3 applyTone(vec3 color) {
  float contrast = u_tone.x;
  float lift = u_tone.y;
  float gamma = u_tone.z;
  float saturation = u_tone.w;

  color = clamp((color - 0.5) * contrast + 0.5 + lift, 0.0, 1.0);
  color = pow(color, vec3(gamma));
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  return clamp(vec3(luma) + (color - vec3(luma)) * saturation, 0.0, 1.0);
}

void main() {
  vec3 mixed = vec3(0.0);
  float totalWeight = 0.0;

  for (int i = 0; i < ${MAX_GRADIENT_POINTS}; i++) {
    vec2 delta = vec2((v_uv.x - u_points[i].x) * u_aspect, v_uv.y - u_points[i].y);
    float dist = length(delta);
    float weight = u_weights[i] / pow(dist + u_blendStrength + 0.055, 1.56);
    mixed += u_colors[i] * weight;
    totalWeight += weight;
  }

  mixed /= max(totalWeight, 0.0001);
  float glow = 0.12 + max(0.0, 0.24 - abs((v_uv.x - 0.5) * 0.9) - abs((v_uv.y - 0.5) * 1.08));
  vec3 layered = clamp(u_baseColor + (mixed - u_baseColor) * (0.84 + glow), 0.0, 1.0);

  gl_FragColor = vec4(applyTone(layered), 1.0);
}
`;

const smokeDisplaceFragmentSource = `
precision highp float;
varying vec2 v_uv;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_aspect;
uniform float u_amount;
uniform float u_size;
uniform int u_complexity;
uniform float u_evolutionSpeed;
uniform vec2 u_flow;
uniform float u_seed;
uniform float u_fiberBoost;

${sharedNoise}

vec2 flowVector(vec2 p) {
  float a = fbm(p + vec2(0.73, 2.31), u_complexity);
  float b = fbm(p + vec2(4.31, 1.17), u_complexity);
  return vec2(a, b) * 2.0 - 1.0;
}

void main() {
  vec2 aspectUv = vec2((v_uv.x - 0.5) * u_aspect, v_uv.y - 0.5);
  float scale = max(0.001, 190.0 / max(u_size, 1.0));
  vec2 flowUv = aspectUv * scale;
  flowUv += u_flow * u_time * 0.85 + vec2(u_seed * 0.13, u_seed * 0.19);
  int octaveCount = u_complexity;
  if (octaveCount < 2) {
    octaveCount = 2;
  }

  vec2 coarse = flowVector(flowUv + u_time * u_evolutionSpeed * 0.17);
  vec2 fine = flowVector(flowUv * 2.6 - coarse * 0.8 - u_time * u_evolutionSpeed * 0.09);
  vec2 disp = normalize(coarse + fine * 0.65 + vec2(0.0001)) *
    (u_amount / u_resolution.y) * 1.1 *
    (0.6 + 0.4 * clamp(length(coarse), 0.0, 1.0));

  vec2 sampleUv = clamp(v_uv + vec2(disp.x / u_aspect, disp.y), 0.001, 0.999);
  vec4 base = texture2D(u_texture, sampleUv);
  vec3 farAhead = texture2D(u_texture, clamp(sampleUv + disp * 0.65, 0.001, 0.999)).rgb;
  vec3 farBehind = texture2D(u_texture, clamp(sampleUv - disp * 0.65, 0.001, 0.999)).rgb;

  vec2 tangent = normalize(vec2(-disp.y, disp.x) + vec2(0.0001));
  vec3 ahead = texture2D(u_texture, clamp(sampleUv + tangent * 0.018, 0.001, 0.999)).rgb;
  vec3 behind = texture2D(u_texture, clamp(sampleUv - tangent * 0.018, 0.001, 0.999)).rgb;
  float fiber = length(ahead - behind);

  float ridge = 1.0 - abs(fbm(flowUv * 3.3 + fine * 0.8 + 12.7, octaveCount) * 2.0 - 1.0);
  float vapor = smoothstep(0.16, 0.82, ridge);
  float plumeMix = smoothstep(0.24, 0.9, fbm(flowUv * 0.95 + 21.3, octaveCount));

  float luma = dot(base.rgb, vec3(0.2126, 0.7152, 0.0722));
  vec3 plumeTint = mix(vec3(1.0, 0.93, 0.84), vec3(0.72, 0.88, 1.0), plumeMix);
  vec3 color = mix(base.rgb, max(farAhead, farBehind), vapor * 0.35 + fiber * 0.18);
  color += plumeTint * vapor * (0.08 + luma * 0.12);
  color += vec3(0.24, 0.16, 0.28) * fiber * u_fiberBoost;
  color = mix(color * 0.96, color + vec3(luma) * 0.1, vapor * 0.3);

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

const vaporCompositeFragmentSource = `
precision highp float;
varying vec2 v_uv;

uniform sampler2D u_gradient;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_aspect;
uniform float u_plumeScale;
uniform float u_plumeSoftness;
uniform float u_density;
uniform float u_densityBias;
uniform vec2 u_center;
uniform float u_plumeStretch;
uniform float u_plumeWidth;
uniform float u_headStrength;
uniform float u_fiberScale;
uniform float u_fiberStrength;
uniform float u_edgeGain;
uniform float u_opacity;
uniform float u_highlightStrength;
uniform float u_shadowStrength;
uniform float u_tintMix;
uniform vec2 u_flow;
uniform float u_seed;
uniform vec3 u_highlightTint;

${sharedNoise}

vec2 flowVector(vec2 p) {
  float a = fbm(p + vec2(0.81, 3.14), 5);
  float b = fbm(p + vec2(5.02, 1.67), 5);
  return vec2(a, b) * 2.0 - 1.0;
}

void main() {
  vec3 gradientColor = texture2D(u_gradient, v_uv).rgb;
  vec3 sourceColor = texture2D(u_texture, v_uv).rgb;

  vec2 centered = vec2((v_uv.x - u_center.x) * u_aspect, v_uv.y - u_center.y);
  vec2 plumeUv = centered * u_plumeScale;
  plumeUv += u_flow * u_time * 0.32 + vec2(u_seed * 0.031, u_seed * 0.047);

  vec2 flowDir = normalize(u_flow + vec2(0.0001, 0.0001));
  vec2 flowPerp = vec2(-flowDir.y, flowDir.x);
  vec2 plumeFrame = centered + flowDir * 0.09 - flowPerp * 0.02;
  float plumeAxis = dot(plumeFrame, flowDir);
  float plumeCross = dot(plumeFrame, flowPerp);
  float plumeStretch = max(u_plumeStretch, 0.12);
  float plumeWidth = max(u_plumeWidth, 0.1);
  float axisNorm = plumeAxis / plumeStretch;
  float crossNorm = plumeCross / plumeWidth;
  float headCore = exp(-pow(axisNorm + 0.16, 2.0) * 6.8 - crossNorm * crossNorm * 5.4);
  float tailBody = exp(-pow(axisNorm - 0.18, 2.0) * 1.5 - crossNorm * crossNorm * 2.3);
  float shoulder = exp(
    -pow(axisNorm + 0.28, 2.0) * 4.1 -
    pow(crossNorm - 0.34 + sin(axisNorm * 3.8) * 0.08, 2.0) * 8.6
  );
  float forwardTail = smoothstep(-0.36, 0.82, axisNorm);
  float macroBase = max(
    headCore * (0.72 + u_headStrength * 0.48),
    tailBody * (0.34 + forwardTail * 0.66) + shoulder * (0.2 + u_headStrength * 0.34)
  );

  vec2 swirl = flowVector(plumeUv * 0.86 + u_time * 0.05);
  vec2 detailFlow = flowVector(plumeUv * 1.93 - swirl * 0.82 - u_time * 0.08);
  float breakup = smoothstep(0.22, 0.82, fbm(plumeUv * 1.34 + swirl * 0.56 - detailFlow * 0.18 + 14.2, 5));
  float voidNoise = smoothstep(0.48, 0.86, fbm(plumeUv * 2.52 - swirl * 1.18 + detailFlow * 0.46 + 31.4, 5));
  float tailFalloff = 1.0 - smoothstep(0.58, 1.18, axisNorm + abs(crossNorm) * 0.18);
  float macroPlume = macroBase * mix(0.72, 1.04, breakup);
  macroPlume *= 1.0 - voidNoise * (0.22 + forwardTail * 0.18);
  macroPlume *= mix(0.78, 1.0, tailFalloff);
  float envelopeGate = smoothstep(0.05, 0.34, macroPlume);

  float broadField = fbm(plumeUv * 0.74 + swirl * 0.34 + 5.2, 5);
  float broadMask = smoothstep(u_plumeSoftness, 0.82, broadField * 0.38 + macroPlume * 1.24);
  broadMask *= envelopeGate;
  float ridgeField = 1.0 - abs(fbm(plumeUv * 1.18 + swirl * 0.7 + detailFlow * 0.22, 5) * 2.0 - 1.0);
  float ridgeMask = smoothstep(0.18, 0.9, ridgeField);
  float cavity = smoothstep(0.24, 0.92, fbm(plumeUv * 0.48 - swirl * 0.55 + 9.1, 4));
  float plumeMask = broadMask * (0.68 + ridgeMask * 0.46 + macroPlume * 0.34);
  plumeMask *= mix(0.8, 1.18, cavity);
  plumeMask *= 0.82 + headCore * 0.46;
  plumeMask *= mix(0.78, 1.06, breakup);
  plumeMask *= 1.0 - voidNoise * 0.14;

  vec2 advect = swirl * 0.018 + detailFlow * 0.012;
  vec2 advectedUv = clamp(v_uv + vec2(advect.x / u_aspect, advect.y), 0.001, 0.999);
  vec3 advectedColor = texture2D(u_texture, advectedUv).rgb;
  vec3 pushedColor = texture2D(
    u_texture,
    clamp(v_uv + vec2(advect.x / u_aspect, advect.y) * 1.8, 0.001, 0.999)
  ).rgb;

  vec2 tangent = normalize(vec2(-advect.y, advect.x) + vec2(0.0001));
  vec3 tangentA = texture2D(u_texture, clamp(advectedUv + tangent * 0.018, 0.001, 0.999)).rgb;
  vec3 tangentB = texture2D(u_texture, clamp(advectedUv - tangent * 0.018, 0.001, 0.999)).rgb;
  float edgeResponse = length(tangentA - tangentB);

  vec2 fiberUv = plumeUv * u_fiberScale + detailFlow * 2.4 + swirl * 1.1;
  float fiberNoise = 1.0 - abs(fbm(fiberUv + vec2(3.1, 7.9), 6) * 2.0 - 1.0);
  float fiberMask = pow(clamp(fiberNoise, 0.0, 1.0), 2.3);
  float wispCluster = smoothstep(0.28, 0.88, fbm(fiberUv * 0.46 - swirl * 0.62 + 19.7, 4));
  float wisps = fiberMask * plumeMask * envelopeGate * wispCluster * (0.38 + ridgeMask * 0.72 + headCore * 0.18);

  float sourceLuma = dot(advectedColor, vec3(0.2126, 0.7152, 0.0722));
  float density = plumeMask * (
    u_density +
    sourceLuma * 0.14 +
    broadMask * 0.04 +
    macroPlume * 0.62 +
    headCore * u_headStrength * 0.34
  ) - u_densityBias;
  density += wisps * u_fiberStrength;
  density += edgeResponse * u_edgeGain * 0.28;
  density *= mix(0.82, 1.0, tailFalloff + headCore * 0.18);
  density = clamp(density, 0.0, 1.0);
  float envelope = clamp(macroPlume * 0.96 + broadMask * 0.12 + headCore * 0.16, 0.0, 1.0);

  vec3 coolLift = mix(gradientColor, advectedColor, 0.62);
  vec3 plumeColor = mix(coolLift, u_highlightTint, u_tintMix);
  vec3 envelopeColor = mix(vec3(0.22, 0.5, 0.84), plumeColor, 0.58);
  vec3 shadowedBase = gradientColor * (1.0 - envelope * 0.18) * (1.0 - density * (0.18 + ridgeMask * 0.18) * u_shadowStrength * 2.4);
  vec3 vaporColor = mix(shadowedBase, advectedColor, 0.28 + density * 0.18);
  vaporColor = mix(vaporColor, pushedColor, density * 0.34);
  vaporColor = mix(vaporColor, plumeColor, density * (0.24 + u_highlightStrength * 0.45));
  vaporColor += plumeColor * density * u_highlightStrength * 0.18;
  vaporColor += u_highlightTint * wisps * 0.16;
  vaporColor = mix(vaporColor, plumeColor, wisps * 0.2);

  vec3 result = mix(gradientColor, shadowedBase, envelope * 0.74);
  result = mix(result, envelopeColor, envelope * 0.1);
  result = mix(result, vaporColor, max(density * u_opacity, envelope * 0.18));
  result += plumeColor * smoothstep(0.28, 0.88, density) * 0.12;
  result += envelopeColor * envelope * 0.03;
  result -= vec3(0.08, 0.06, 0.1) * density * (0.28 + ridgeMask * 0.3);

  gl_FragColor = vec4(clamp(result, 0.0, 1.0), 1.0);
}
`;

const smokeGradeFragmentSource = `
precision highp float;
varying vec2 v_uv;

uniform sampler2D u_texture;
uniform vec4 u_tone;
uniform vec3 u_highlightTint;

vec3 applyTone(vec3 color) {
  float contrast = u_tone.x;
  float lift = u_tone.y;
  float gamma = u_tone.z;
  float saturation = u_tone.w;

  color = clamp((color - 0.5) * contrast + 0.5 + lift, 0.0, 1.0);
  color = pow(color, vec3(gamma));
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  return clamp(vec3(luma) + (color - vec3(luma)) * saturation, 0.0, 1.0);
}

void main() {
  vec3 sampleColor = texture2D(u_texture, v_uv).rgb;
  float luma = dot(sampleColor, vec3(0.2126, 0.7152, 0.0722));
  float bloom = smoothstep(0.35, 0.92, luma);
  vec3 graded = sampleColor + u_highlightTint * bloom * 0.08;
  graded = mix(graded * 0.96, graded, 0.82);
  gl_FragColor = vec4(applyTone(clamp(graded, 0.0, 1.0)), 1.0);
}
`;

const surfacePrecompFragmentSource = `
precision highp float;
varying vec2 v_uv;

uniform float u_aspect;
uniform int u_pointCount;
uniform vec2 u_points[${MAX_RIBBON_POINTS}];
uniform float u_halfWidths[${MAX_RIBBON_POINTS}];
uniform float u_colorMix[${MAX_RIBBON_POINTS}];
uniform vec3 u_palette[${MAX_RIBBON_PALETTE}];
uniform float u_coverage;
uniform float u_endTaper;

vec3 samplePalette(float t) {
  float scaled = clamp(t, 0.0, 0.9999) * float(${MAX_RIBBON_PALETTE - 1});

  if (scaled < 1.0) {
    return mix(u_palette[0], u_palette[1], scaled);
  }

  if (scaled < 2.0) {
    return mix(u_palette[1], u_palette[2], scaled - 1.0);
  }

  if (scaled < 3.0) {
    return mix(u_palette[2], u_palette[3], scaled - 2.0);
  }

  return mix(u_palette[3], u_palette[4], scaled - 3.0);
}

void main() {
  vec2 p = vec2((v_uv.x - 0.5) * u_aspect, v_uv.y - 0.5);
  int pointCount = u_pointCount;
  if (pointCount < 2) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float bestCoverage = 0.0;
  float bestRelative = 0.0;
  float thickness = 0.0;
  vec3 tintAccum = vec3(0.0);
  float tintWeight = 0.0;

  for (int i = 0; i < ${MAX_RIBBON_POINTS - 1}; i++) {
    if (i >= pointCount - 1) {
      break;
    }

    vec2 aUv = u_points[i];
    vec2 bUv = u_points[i + 1];
    vec2 a = vec2((aUv.x - 0.5) * u_aspect, aUv.y - 0.5);
    vec2 b = vec2((bUv.x - 0.5) * u_aspect, bUv.y - 0.5);
    vec2 ba = b - a;
    float lenSq = max(dot(ba, ba), 0.000001);
    float segmentT = clamp(dot(p - a, ba) / lenSq, 0.0, 1.0);
    vec2 closest = a + ba * segmentT;

    float width = mix(u_halfWidths[i], u_halfWidths[i + 1], segmentT);
    float progress = (float(i) + segmentT) / float(pointCount - 1);
    float taper = clamp(min(progress, 1.0 - progress) / max(u_endTaper, 0.001), 0.0, 1.0);
    width *= 0.18 + taper * 0.82;

    float distanceToCenter = length(p - closest);
    float feather = mix(0.012, 0.03, clamp(width * 9.0, 0.0, 1.0));
    float coverage = 1.0 - smoothstep(width, width + feather, distanceToCenter);
    float relative = distanceToCenter / max(width, 0.0001);
    float core = 1.0 - smoothstep(0.0, 0.94, relative);
    float innerMilk = exp(-pow(relative - 0.18, 2.0) * 18.0);
    float edgeLane = exp(-pow(relative - 0.76, 2.0) * 26.0);
    float caustic = exp(-pow(relative - 0.52, 2.0) * 24.0);
    vec3 tint = samplePalette(mix(u_colorMix[i], u_colorMix[i + 1], segmentT));
    vec3 spectral = mix(vec3(1.0, 0.9, 0.72), vec3(0.74, 0.98, 1.0), progress);
    vec3 tinted = mix(tint, vec3(1.0, 0.97, 0.92), innerMilk * 0.42);
    tinted = mix(tinted, spectral, edgeLane * 0.18 + caustic * 0.08);

    tintAccum += tinted * coverage * (0.52 + core * 0.28 + edgeLane * 0.2);
    tintWeight += coverage * (0.72 + edgeLane * 0.42);
    thickness = max(thickness, coverage * (0.36 + core * 0.42 + caustic * 0.22));

    if (coverage > bestCoverage) {
      bestCoverage = coverage;
      bestRelative = relative;
    }
  }

  if (bestCoverage <= 0.0001) {
    gl_FragColor = vec4(0.0);
    return;
  }

  vec3 packedTint = tintAccum / max(tintWeight, 0.0001);
  float edgeLift = exp(-pow(bestRelative - 0.78, 2.0) * 22.0);
  float coreLift = exp(-pow(bestRelative - 0.16, 2.0) * 12.0);
  packedTint = mix(packedTint, vec3(1.0, 0.97, 0.94), coreLift * 0.16);
  packedTint += vec3(0.12, 0.06, 0.02) * edgeLift * 0.08;

  float alpha = clamp(bestCoverage * u_coverage * (0.72 + thickness * 0.4), 0.0, 1.0);
  gl_FragColor = vec4(clamp(packedTint * (0.8 + thickness * 0.32), 0.0, 1.0), alpha);
}
`;

const transformFragmentSource = `
precision highp float;
varying vec2 v_uv;

uniform sampler2D u_texture;
uniform float u_slide;
uniform float u_scaleX;
uniform float u_scaleY;

void main() {
  vec2 uv = v_uv;
  uv = (uv - 0.5) / vec2(u_scaleX, u_scaleY) + 0.5;
  uv.x += u_slide;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  gl_FragColor = texture2D(u_texture, uv);
}
`;

const directionalBlurFragmentSource = `
precision highp float;
varying vec2 v_uv;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform vec2 u_direction;
uniform float u_radiusPx;
uniform int u_sampleCount;

void main() {
  vec2 stepUv = u_direction * (u_radiusPx / u_resolution);
  vec4 accum = vec4(0.0);
  float total = 0.0;
  int sampleCount = u_sampleCount;
  if (sampleCount < 2) {
    sampleCount = 2;
  }

  for (int i = 0; i < 24; i++) {
    if (i >= sampleCount) {
      break;
    }

    float t = float(i) / float(sampleCount - 1) - 0.5;
    float weight = 1.0 - abs(t) * 1.35;
    vec2 sampleUv = clamp(v_uv + stepUv * t, 0.0, 1.0);
    accum += texture2D(u_texture, sampleUv) * weight;
    total += weight;
  }

  gl_FragColor = accum / max(total, 0.0001);
}
`;

const lensWarpFragmentSource = `
precision highp float;
varying vec2 v_uv;

uniform sampler2D u_texture;
uniform float u_aspect;
uniform float u_strength;

void main() {
  vec2 centered = v_uv * 2.0 - 1.0;
  centered.x *= u_aspect;
  float radiusSq = dot(centered, centered);
  centered /= 1.0 + u_strength * radiusSq;
  centered *= 1.0 + radiusSq * 0.035;
  centered.x /= u_aspect;
  vec2 uv = centered * 0.5 + 0.5;

  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  gl_FragColor = texture2D(u_texture, uv);
}
`;

const displaceFragmentSource = `
precision highp float;
varying vec2 v_uv;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_aspect;
uniform float u_amount;
uniform float u_size;
uniform int u_complexity;
uniform float u_evolutionSpeed;
uniform vec2 u_flow;
uniform float u_seed;

${sharedNoise}

vec2 displaceField(vec2 p) {
  float a = fbm(p + vec2(1.3, 7.1), u_complexity);
  float b = fbm(p + vec2(8.2, 2.4), u_complexity);
  vec2 primary = vec2(a, b) * 2.0 - 1.0;
  vec2 twist = vec2(
    fbm(p * 1.9 - vec2(4.2, 3.7), u_complexity),
    fbm(p * 1.9 + vec2(2.7, 5.6), u_complexity)
  ) * 2.0 - 1.0;

  return primary + twist * 0.42;
}

void main() {
  vec2 aspectUv = vec2((v_uv.x - 0.5) * u_aspect, v_uv.y - 0.5);
  float scale = max(0.001, 210.0 / max(u_size, 1.0));
  vec2 flowUv = aspectUv * scale;
  flowUv += u_flow * u_time * 0.68 + vec2(u_seed * 0.11, u_seed * 0.17);

  vec2 field = displaceField(flowUv + u_time * u_evolutionSpeed * 0.12);
  vec2 disp = field * (u_amount / u_resolution.y);
  vec2 sampleUv = v_uv + vec2(disp.x / u_aspect, disp.y);
  if (sampleUv.x < 0.0 || sampleUv.x > 1.0 || sampleUv.y < 0.0 || sampleUv.y > 1.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  vec4 sampleColor = texture2D(u_texture, sampleUv);

  float stretch = clamp(length(field), 0.0, 1.0);
  sampleColor.rgb += stretch * 0.035;
  gl_FragColor = vec4(clamp(sampleColor.rgb, 0.0, 1.0), sampleColor.a);
}
`;

const repeatTileFragmentSource = `
precision highp float;
varying vec2 v_uv;

uniform sampler2D u_texture;
uniform vec2 u_expand;

${sharedNoise}

void main() {
  vec2 uv = (v_uv - 0.5) * u_expand + 0.5;
  uv = mirroredRepeat(uv);
  gl_FragColor = texture2D(u_texture, uv);
}
`;

const surfaceShadeFragmentSource = `
precision highp float;
varying vec2 v_uv;

uniform sampler2D u_texture;
uniform sampler2D u_background;
uniform vec2 u_resolution;
uniform float u_opacity;
uniform float u_thicknessGain;
uniform float u_refractionStrength;
uniform float u_fresnelStrength;
uniform float u_highlightSharpness;

void main() {
  vec2 px = 1.0 / u_resolution;
  vec4 center = texture2D(u_texture, v_uv);
  vec4 left = texture2D(u_texture, clamp(v_uv - vec2(px.x * 3.0, 0.0), 0.0, 1.0));
  vec4 right = texture2D(u_texture, clamp(v_uv + vec2(px.x * 3.0, 0.0), 0.0, 1.0));
  vec4 up = texture2D(u_texture, clamp(v_uv - vec2(0.0, px.y * 3.0), 0.0, 1.0));
  vec4 down = texture2D(u_texture, clamp(v_uv + vec2(0.0, px.y * 3.0), 0.0, 1.0));
  vec4 diagA = texture2D(u_texture, clamp(v_uv + vec2(px.x * 3.0, px.y * 3.0), 0.0, 1.0));
  vec4 diagB = texture2D(u_texture, clamp(v_uv + vec2(-px.x * 3.0, px.y * 3.0), 0.0, 1.0));
  vec4 diagC = texture2D(u_texture, clamp(v_uv + vec2(px.x * 3.0, -px.y * 3.0), 0.0, 1.0));
  vec4 diagD = texture2D(u_texture, clamp(v_uv + vec2(-px.x * 3.0, -px.y * 3.0), 0.0, 1.0));

  float field = center.a * 0.3;
  field += (left.a + right.a + up.a + down.a) * 0.11;
  field += (diagA.a + diagB.a + diagC.a + diagD.a) * 0.045;
  field = clamp(field * u_thicknessGain, 0.0, 1.0);

  float body = smoothstep(0.14, 0.72, field);
  float core = smoothstep(0.22, 0.92, field);
  float rim = smoothstep(0.06, 0.3, field) - smoothstep(0.3, 0.78, field);

  vec2 grad = vec2(right.a - left.a, down.a - up.a);
  vec3 normal = normalize(vec3(-grad.x * (6.0 + u_thicknessGain * 2.4), -grad.y * (6.0 + u_thicknessGain * 2.4), 1.0));
  vec3 lightDir = normalize(vec3(-0.34, -0.4, 0.85));
  vec3 halfVec = normalize(lightDir + vec3(0.0, 0.0, 1.0));
  float diffuse = max(dot(normal, lightDir), 0.0);
  float specular = pow(max(dot(normal, halfVec), 0.0), max(4.0, u_highlightSharpness));
  float fresnel = pow(1.0 - max(normal.z, 0.0), 2.4) * u_fresnelStrength;

  vec2 refractOffset = grad * (u_refractionStrength * (0.36 + field * 0.64));
  vec3 refractedA = texture2D(u_background, clamp(v_uv + refractOffset, 0.0, 1.0)).rgb;
  vec3 refractedB = texture2D(
    u_background,
    clamp(v_uv - refractOffset * 0.62 + vec2(fresnel * 0.012, -fresnel * 0.008), 0.0, 1.0)
  ).rgb;
  vec3 backgroundBase = texture2D(u_background, v_uv).rgb;
  vec3 tintSeed = mix(vec3(1.0), max(center.rgb, vec3(0.001)), 0.34);
  vec3 liquidBase = mix(refractedA, refractedB, 0.42 + field * 0.14);
  liquidBase = mix(liquidBase, backgroundBase, 0.14);
  liquidBase = mix(liquidBase, liquidBase * tintSeed, 0.22 + core * 0.14);

  vec3 highlightColor = mix(vec3(1.0), tintSeed, 0.24);
  float edgeLane = pow(clamp(rim, 0.0, 1.0), 1.08);
  vec3 shaded = liquidBase * (0.72 + diffuse * 0.28);
  shaded += highlightColor * specular * (0.18 + core * 0.24);
  shaded += highlightColor * fresnel * (0.12 + core * 0.1);
  shaded += highlightColor * edgeLane * (0.06 + fresnel * 0.08);
  shaded -= tintSeed * (1.0 - diffuse) * field * 0.06;
  shaded -= vec3(0.06, 0.05, 0.08) * rim * 0.28;

  float alpha = clamp(body * (0.64 + core * 0.36), 0.0, 1.0) * u_opacity;
  gl_FragColor = vec4(clamp(shaded, 0.0, 1.0), alpha);
}
`;

const compositeFragmentSource = `
precision highp float;
varying vec2 v_uv;

uniform sampler2D u_background;
uniform sampler2D u_surface;
uniform float u_shadowDensity;

void main() {
  vec3 background = texture2D(u_background, v_uv).rgb;
  vec4 surface = texture2D(u_surface, v_uv);
  float luma = dot(surface.rgb, vec3(0.2126, 0.7152, 0.0722));
  float presence = smoothstep(0.04, 0.86, surface.a);
  vec3 underSurface = background * (1.0 - presence * (0.08 + u_shadowDensity * 0.22));
  underSurface -= vec3(0.02, 0.024, 0.038) * smoothstep(0.18, 0.9, luma) * presence * u_shadowDensity;
  vec3 result = mix(underSurface, surface.rgb, presence);
  result += surface.rgb * presence * 0.035;

  gl_FragColor = vec4(clamp(result, 0.0, 1.0), 1.0);
}
`;

const compileShader = ({
  gl,
  type,
  source,
}: {
  gl: WebGLRenderingContext;
  type: number;
  source: string;
}) => {
  const shader = gl.createShader(type);

  if (!shader) {
    throw new Error("Failed to create WebGL shader.");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`WebGL shader compile failed: ${info ?? "unknown error"}`);
  }

  return shader;
};

const createProgram = ({
  gl,
  fragmentSource,
}: {
  gl: WebGLRenderingContext;
  fragmentSource: string;
}): ProgramInfo => {
  const program = gl.createProgram();

  if (!program) {
    throw new Error("Failed to create WebGL program.");
  }

  const vertexShader = compileShader({
    gl,
    type: gl.VERTEX_SHADER,
    source: vertexShaderSource,
  });
  const fragmentShader = compileShader({
    gl,
    type: gl.FRAGMENT_SHADER,
    source: fragmentSource,
  });

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`WebGL program link failed: ${info ?? "unknown error"}`);
  }

  const positionLocation = gl.getAttribLocation(program, "a_position");

  return {
    program,
    positionLocation,
    uniformCache: new Map<string, WebGLUniformLocation | null>(),
  };
};

const getProgramUniform = (
  gl: WebGLRenderingContext,
  program: ProgramInfo,
  name: string,
) => {
  const cached = program.uniformCache.get(name);
  if (cached !== undefined) {
    return cached;
  }

  const location = gl.getUniformLocation(program.program, name);
  program.uniformCache.set(name, location);
  return location;
};

const createRenderTarget = (
  gl: WebGLRenderingContext,
  width: number,
  height: number,
): RenderTarget => {
  const texture = gl.createTexture();
  const framebuffer = gl.createFramebuffer();

  if (!texture || !framebuffer) {
    throw new Error("Failed to create WebGL render target.");
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    width,
    height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
  );

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0,
  );

  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return {
    texture,
    framebuffer,
  };
};

const createGradientUniformData = (
  recipe: OrganicGradientRecipe,
  time: number,
): GradientUniformData => {
  const points = new Float32Array(MAX_GRADIENT_POINTS * 2);
  const colors = new Float32Array(MAX_GRADIENT_POINTS * 3);
  const weights = new Float32Array(MAX_GRADIENT_POINTS);

  recipe.points.slice(0, MAX_GRADIENT_POINTS).forEach((point, index) => {
    const sampled = sampleGradientPoint(point, time);
    points[index * 2] = sampled.x;
    points[index * 2 + 1] = sampled.y;
    colors[index * 3] = sampled.color[0];
    colors[index * 3 + 1] = sampled.color[1];
    colors[index * 3 + 2] = sampled.color[2];
    weights[index] = point.weight;
  });

  const baseColor = hexToNormalized(recipe.baseColor);

  return {
    points,
    colors,
    weights,
    baseColor: new Float32Array(baseColor),
    tone: new Float32Array([
      recipe.tone.contrast,
      recipe.tone.lift,
      recipe.tone.gamma,
      recipe.tone.saturation,
    ]),
    blendStrength: recipe.blendStrength,
  };
};

const sampleGradientPoint = (point: GradientPointConfig, time: number) => {
  return {
    x:
      point.origin.x +
      Math.sin(time * point.speed + point.phase) * point.orbit.x +
      Math.cos(time * (point.speed * 0.61) + point.phase * 1.7) * point.drift.x,
    y:
      point.origin.y +
      Math.cos(time * point.speed * 0.82 + point.phase) * point.orbit.y +
      Math.sin(time * (point.speed * 0.57) + point.phase * 1.4) * point.drift.y,
    color: hexToNormalized(point.color),
  };
};

const hexToRgb = (color: string) => {
  const sanitized = color.replace("#", "");
  const normalized =
    sanitized.length === 3
      ? sanitized
          .split("")
          .map((char) => char + char)
          .join("")
      : sanitized;

  const parsed = Number.parseInt(normalized, 16);
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
};

const hexToNormalized = (color: string): [number, number, number] => {
  const rgb = hexToRgb(color);
  return [rgb.r / 255, rgb.g / 255, rgb.b / 255];
};

const seeded = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453123;
  return value - Math.floor(value);
};

const normalizeVec2 = (x: number, y: number) => {
  const length = Math.hypot(x, y);
  if (length <= 0.0001) {
    return { x: 1, y: 0 };
  }

  return {
    x: x / length,
    y: y / length,
  };
};

const createRibbonSeeds = (recipe: MarbleRecipe): RibbonSeedPoint[] => {
  const controlPoints = recipe.shape.controlPoints.slice(
    0,
    Math.min(recipe.shape.controlPointCount, MAX_RIBBON_POINTS),
  );

  return controlPoints.map((point, index) => {
    const previous = controlPoints[Math.max(0, index - 1)] ?? point;
    const next = controlPoints[Math.min(controlPoints.length - 1, index + 1)] ?? point;
    const localSeed = recipe.shape.seed * 100 + index * 17;
    const t = controlPoints.length <= 1 ? 0.5 : index / (controlPoints.length - 1);
    const bodyWeight = Math.sin(t * Math.PI);
    const tangent = normalizeVec2(
      next.position.x - previous.position.x + point.tangentBias.x,
      next.position.y - previous.position.y + point.tangentBias.y,
    );
    const normal = { x: -tangent.y, y: tangent.x };
    const alongJitter = (seeded(localSeed + 1) - 0.5) * recipe.shape.spineJitter * bodyWeight;
    const crossJitter = (seeded(localSeed + 2) - 0.5) * recipe.shape.crossJitter * bodyWeight;
    const widthJitter = 1 + (seeded(localSeed + 3) - 0.5) * 0.12 * bodyWeight;
    const colorJitter = (seeded(localSeed + 4) - 0.5) * recipe.shape.colorDrift * bodyWeight;

    return {
      x: Math.min(
        0.98,
        Math.max(0.02, point.position.x + tangent.x * alongJitter + normal.x * crossJitter),
      ),
      y: Math.min(
        0.98,
        Math.max(0.02, point.position.y + tangent.y * alongJitter + normal.y * crossJitter),
      ),
      halfWidth: Math.min(
        recipe.shape.widthMax,
        Math.max(recipe.shape.widthMin, point.halfWidth * widthJitter),
      ),
      colorMix: Math.min(1, Math.max(0, point.colorMix + colorJitter)),
    };
  });
};

class WebGLEffectRenderer {
  private readonly gl: WebGLRenderingContext;

  private readonly quadBuffer: WebGLBuffer;

  private readonly programs: Record<string, ProgramInfo>;

  private readonly targets = new Map<string, RenderTarget>();

  private width = 0;

  private height = 0;

  private surfaceCache = new Map<
    string,
    {
      points: Float32Array;
      widths: Float32Array;
      colorMix: Float32Array;
      palette: Float32Array;
      count: number;
    }
  >();

  public constructor(private readonly canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    });

    if (!gl) {
      throw new Error("WebGL is not available.");
    }

    this.gl = gl;

    const quadBuffer = gl.createBuffer();
    if (!quadBuffer) {
      throw new Error("Failed to create WebGL quad buffer.");
    }

    this.quadBuffer = quadBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    this.programs = {
      gradient: createProgram({ gl, fragmentSource: gradientFragmentSource }),
      smokeDisplace: createProgram({ gl, fragmentSource: smokeDisplaceFragmentSource }),
      vaporComposite: createProgram({ gl, fragmentSource: vaporCompositeFragmentSource }),
      smokeGrade: createProgram({ gl, fragmentSource: smokeGradeFragmentSource }),
      surfacePrecomp: createProgram({ gl, fragmentSource: surfacePrecompFragmentSource }),
      transform: createProgram({ gl, fragmentSource: transformFragmentSource }),
      blur: createProgram({ gl, fragmentSource: directionalBlurFragmentSource }),
      lens: createProgram({ gl, fragmentSource: lensWarpFragmentSource }),
      displace: createProgram({ gl, fragmentSource: displaceFragmentSource }),
      repeat: createProgram({ gl, fragmentSource: repeatTileFragmentSource }),
      surfaceShade: createProgram({ gl, fragmentSource: surfaceShadeFragmentSource }),
      composite: createProgram({ gl, fragmentSource: compositeFragmentSource }),
    };

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.disable(gl.BLEND);
  }

  public renderSmoke(recipe: MooographSmokePreset, time: number) {
    this.ensureSize();
    this.renderGradient(recipe, time, this.getTarget("smoke-gradient"));

    const largePass = recipe.turbulence[0];
    const detailPass = recipe.turbulence[1];

    this.renderSmokeDisplace({
      source: this.getTarget("smoke-gradient").texture,
      output: this.getTarget("smoke-a"),
      pass: largePass,
      time,
      fiberBoost: 0.34,
    });

    this.renderSmokeDisplace({
      source: this.getTarget("smoke-a").texture,
      output: this.getTarget("smoke-b"),
      pass: detailPass,
      time,
      fiberBoost: 0.96,
    });

    this.renderVaporComposite({
      gradient: this.getTarget("smoke-gradient").texture,
      source: this.getTarget("smoke-b").texture,
      output: this.getTarget("smoke-composite"),
      vapor: recipe.vapor,
      time,
      highlightTint: hexToNormalized(recipe.highlightTint),
    });

    this.renderSmokeGrade({
      source: this.getTarget("smoke-composite").texture,
      tone: recipe.tone,
      highlightTint: hexToNormalized(recipe.highlightTint),
    });
  }

  public renderMarble(recipe: MarbleRecipe, time: number, loopProgress: number) {
    this.ensureSize();
    this.renderGradient(recipe.background, time, this.getTarget("marble-background"));
    this.renderSurfacePrecomp(recipe, this.getTarget("marble-circles"));

    this.renderTransform({
      source: this.getTarget("marble-circles").texture,
      output: this.getTarget("marble-transform"),
      slide: (loopProgress * 2 - 1) * recipe.warp.travelFactor,
      scaleX: recipe.warp.stretch,
      scaleY: 1 / recipe.warp.widthScale,
    });

    const blurAngle = (recipe.warp.blurAngleDeg * Math.PI) / 180;
    this.renderBlur({
      source: this.getTarget("marble-transform").texture,
      output: this.getTarget("marble-blur"),
      direction: [Math.cos(blurAngle), Math.sin(blurAngle)],
      radiusPx: recipe.warp.blurLengthFactor * this.width,
      sampleCount: recipe.warp.blurSamples,
    });

    this.renderLens({
      source: this.getTarget("marble-blur").texture,
      output: this.getTarget("marble-lens"),
      strength: recipe.warp.lensStrength,
    });

    this.renderDisplace({
      source: this.getTarget("marble-lens").texture,
      output: this.getTarget("marble-displace"),
      pass: recipe.warp.turbulence,
      time,
    });

    this.renderRepeat({
      source: this.getTarget("marble-displace").texture,
      output: this.getTarget("marble-repeat"),
      expand: [1.0, 1.0],
    });

    this.renderSurfaceShade({
      background: this.getTarget("marble-background").texture,
      source: this.getTarget("marble-repeat").texture,
      output: this.getTarget("marble-shade"),
      opacity: recipe.surface.opacity,
      thicknessGain: recipe.surface.thicknessGain,
      refractionStrength: recipe.surface.refractionStrength,
      fresnelStrength: recipe.surface.fresnelStrength,
      highlightSharpness: recipe.surface.highlightSharpness,
    });

    this.renderComposite({
      background: this.getTarget("marble-background").texture,
      surface: this.getTarget("marble-shade").texture,
      shadowDensity: recipe.surface.shadowDensity,
    });
  }

  public copyToCanvas(target: HTMLCanvasElement) {
    const ctx = target.getContext("2d");
    if (!ctx) {
      throw new Error("2D canvas context is not available.");
    }

    const pixels = new Uint8Array(this.width * this.height * 4);
    const image = ctx.createImageData(this.width, this.height);
    const rowStride = this.width * 4;

    this.gl.finish();
    this.gl.readPixels(0, 0, this.width, this.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);

    for (let y = 0; y < this.height; y += 1) {
      const sourceStart = (this.height - 1 - y) * rowStride;
      const targetStart = y * rowStride;
      image.data.set(pixels.subarray(sourceStart, sourceStart + rowStride), targetStart);
    }

    ctx.clearRect(0, 0, this.width, this.height);
    ctx.putImageData(image, 0, 0);
  }

  private ensureSize() {
    const { width, height } = this.canvas;
    if (width === this.width && height === this.height) {
      return;
    }

    this.width = width;
    this.height = height;

    const keys = Array.from(this.targets.keys());
    keys.forEach((key) => {
      const previous = this.targets.get(key);
      if (!previous) {
        return;
      }

      this.gl.deleteTexture(previous.texture);
      this.gl.deleteFramebuffer(previous.framebuffer);
      this.targets.delete(key);
    });
  }

  private getTarget(key: string) {
    const cached = this.targets.get(key);
    if (cached) {
      return cached;
    }

    const target = createRenderTarget(this.gl, this.width, this.height);
    this.targets.set(key, target);
    return target;
  }

  private beginPass(program: ProgramInfo, output: RenderTarget | null) {
    const { gl } = this;
    gl.useProgram(program.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.enableVertexAttribArray(program.positionLocation);
    gl.vertexAttribPointer(program.positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, output?.framebuffer ?? null);
    gl.viewport(0, 0, this.width, this.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  private finishPass() {
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }

  private bindTexture(program: ProgramInfo, name: string, texture: WebGLTexture, unit: number) {
    const { gl } = this;
    const location = getProgramUniform(gl, program, name);
    if (!location) {
      return;
    }

    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(location, unit);
  }

  private renderGradient(recipe: OrganicGradientRecipe, time: number, output: RenderTarget) {
    const { gl } = this;
    const program = this.programs.gradient;
    const uniforms = createGradientUniformData(recipe, time);

    this.beginPass(program, output);

    gl.uniform1f(getProgramUniform(gl, program, "u_aspect"), this.width / this.height);
    gl.uniform2fv(getProgramUniform(gl, program, "u_points[0]"), uniforms.points);
    gl.uniform3fv(getProgramUniform(gl, program, "u_colors[0]"), uniforms.colors);
    gl.uniform1fv(getProgramUniform(gl, program, "u_weights[0]"), uniforms.weights);
    gl.uniform3fv(getProgramUniform(gl, program, "u_baseColor"), uniforms.baseColor);
    gl.uniform4fv(getProgramUniform(gl, program, "u_tone"), uniforms.tone);
    gl.uniform1f(getProgramUniform(gl, program, "u_blendStrength"), uniforms.blendStrength);

    this.finishPass();
  }

  private renderSmokeDisplace({
    source,
    output,
    pass,
    time,
    fiberBoost,
  }: {
    source: WebGLTexture;
    output: RenderTarget;
    pass: TurbulencePass;
    time: number;
    fiberBoost: number;
  }) {
    const { gl } = this;
    const program = this.programs.smokeDisplace;

    this.beginPass(program, output);
    this.bindTexture(program, "u_texture", source, 0);

    gl.uniform2f(getProgramUniform(gl, program, "u_resolution"), this.width, this.height);
    gl.uniform1f(getProgramUniform(gl, program, "u_time"), time);
    gl.uniform1f(getProgramUniform(gl, program, "u_aspect"), this.width / this.height);
    gl.uniform1f(getProgramUniform(gl, program, "u_amount"), pass.amount);
    gl.uniform1f(getProgramUniform(gl, program, "u_size"), pass.size);
    gl.uniform1i(getProgramUniform(gl, program, "u_complexity"), Math.max(1, pass.complexity));
    gl.uniform1f(getProgramUniform(gl, program, "u_evolutionSpeed"), pass.evolutionSpeed);
    gl.uniform2f(getProgramUniform(gl, program, "u_flow"), pass.flow.x, pass.flow.y);
    gl.uniform1f(getProgramUniform(gl, program, "u_seed"), pass.seed);
    gl.uniform1f(getProgramUniform(gl, program, "u_fiberBoost"), fiberBoost);

    this.finishPass();
  }

  private renderVaporComposite({
    gradient,
    source,
    output,
    vapor,
    time,
    highlightTint,
  }: {
    gradient: WebGLTexture;
    source: WebGLTexture;
    output: RenderTarget;
    vapor: VaporCompositeParams;
    time: number;
    highlightTint: [number, number, number];
  }) {
    const { gl } = this;
    const program = this.programs.vaporComposite;

    this.beginPass(program, output);
    this.bindTexture(program, "u_gradient", gradient, 0);
    this.bindTexture(program, "u_texture", source, 1);

    gl.uniform2f(getProgramUniform(gl, program, "u_resolution"), this.width, this.height);
    gl.uniform1f(getProgramUniform(gl, program, "u_time"), time);
    gl.uniform1f(getProgramUniform(gl, program, "u_aspect"), this.width / this.height);
    gl.uniform1f(getProgramUniform(gl, program, "u_plumeScale"), vapor.plumeScale);
    gl.uniform1f(getProgramUniform(gl, program, "u_plumeSoftness"), vapor.plumeSoftness);
    gl.uniform1f(getProgramUniform(gl, program, "u_density"), vapor.density);
    gl.uniform1f(getProgramUniform(gl, program, "u_densityBias"), vapor.densityBias);
    gl.uniform2f(getProgramUniform(gl, program, "u_center"), vapor.center.x, vapor.center.y);
    gl.uniform1f(getProgramUniform(gl, program, "u_plumeStretch"), vapor.plumeStretch);
    gl.uniform1f(getProgramUniform(gl, program, "u_plumeWidth"), vapor.plumeWidth);
    gl.uniform1f(getProgramUniform(gl, program, "u_headStrength"), vapor.headStrength);
    gl.uniform1f(getProgramUniform(gl, program, "u_fiberScale"), vapor.fiberScale);
    gl.uniform1f(getProgramUniform(gl, program, "u_fiberStrength"), vapor.fiberStrength);
    gl.uniform1f(getProgramUniform(gl, program, "u_edgeGain"), vapor.edgeGain);
    gl.uniform1f(getProgramUniform(gl, program, "u_opacity"), vapor.opacity);
    gl.uniform1f(getProgramUniform(gl, program, "u_highlightStrength"), vapor.highlightStrength);
    gl.uniform1f(getProgramUniform(gl, program, "u_shadowStrength"), vapor.shadowStrength);
    gl.uniform1f(getProgramUniform(gl, program, "u_tintMix"), vapor.tintMix);
    gl.uniform2f(getProgramUniform(gl, program, "u_flow"), vapor.flow.x, vapor.flow.y);
    gl.uniform1f(getProgramUniform(gl, program, "u_seed"), vapor.seed);
    gl.uniform3f(
      getProgramUniform(gl, program, "u_highlightTint"),
      highlightTint[0],
      highlightTint[1],
      highlightTint[2],
    );

    this.finishPass();
  }

  private renderSmokeGrade({
    source,
    tone,
    highlightTint,
  }: {
    source: WebGLTexture;
    tone: OrganicGradientRecipe["tone"];
    highlightTint: [number, number, number];
  }) {
    const { gl } = this;
    const program = this.programs.smokeGrade;

    this.beginPass(program, null);
    this.bindTexture(program, "u_texture", source, 0);

    gl.uniform4f(
      getProgramUniform(gl, program, "u_tone"),
      tone.contrast,
      tone.lift,
      tone.gamma,
      tone.saturation,
    );
    gl.uniform3f(
      getProgramUniform(gl, program, "u_highlightTint"),
      highlightTint[0],
      highlightTint[1],
      highlightTint[2],
    );

    this.finishPass();
  }

  private renderSurfacePrecomp(recipe: MarbleRecipe, output: RenderTarget) {
    const { gl } = this;
    const program = this.programs.surfacePrecomp;
    const cacheKey = [
      recipe.shape.seed,
      recipe.shape.controlPointCount,
      recipe.shape.widthMin,
      recipe.shape.widthMax,
      recipe.shape.spineJitter,
      recipe.shape.crossJitter,
      recipe.shape.endTaper,
      recipe.shape.coverage,
      recipe.shape.colorDrift,
      ...recipe.palette,
      ...recipe.shape.controlPoints.flatMap((point) => [
        point.position.x,
        point.position.y,
        point.halfWidth,
        point.tangentBias.x,
        point.tangentBias.y,
        point.colorMix,
      ]),
    ].join("-");
    let cached = this.surfaceCache.get(cacheKey);

    if (!cached) {
      const seeds = createRibbonSeeds(recipe);
      const points = new Float32Array(MAX_RIBBON_POINTS * 2);
      const widths = new Float32Array(MAX_RIBBON_POINTS);
      const colorMix = new Float32Array(MAX_RIBBON_POINTS);
      const palette = new Float32Array(MAX_RIBBON_PALETTE * 3);
      seeds.forEach((seed, index) => {
        points[index * 2] = seed.x;
        points[index * 2 + 1] = seed.y;
        widths[index] = seed.halfWidth;
        colorMix[index] = seed.colorMix;
      });

      for (let index = 0; index < MAX_RIBBON_PALETTE; index += 1) {
        const color = hexToNormalized(
          recipe.palette[index] ??
            recipe.palette[recipe.palette.length - 1] ??
            "#ffffff",
        );
        palette[index * 3] = color[0];
        palette[index * 3 + 1] = color[1];
        palette[index * 3 + 2] = color[2];
      }

      cached = {
        points,
        widths,
        colorMix,
        palette,
        count: seeds.length,
      };
      this.surfaceCache.set(cacheKey, cached);
    }

    this.beginPass(program, output);

    gl.uniform1f(getProgramUniform(gl, program, "u_aspect"), this.width / this.height);
    gl.uniform1i(getProgramUniform(gl, program, "u_pointCount"), cached.count);
    gl.uniform2fv(getProgramUniform(gl, program, "u_points[0]"), cached.points);
    gl.uniform1fv(getProgramUniform(gl, program, "u_halfWidths[0]"), cached.widths);
    gl.uniform1fv(getProgramUniform(gl, program, "u_colorMix[0]"), cached.colorMix);
    gl.uniform3fv(getProgramUniform(gl, program, "u_palette[0]"), cached.palette);
    gl.uniform1f(getProgramUniform(gl, program, "u_coverage"), recipe.shape.coverage);
    gl.uniform1f(getProgramUniform(gl, program, "u_endTaper"), recipe.shape.endTaper);

    this.finishPass();
  }

  private renderTransform({
    source,
    output,
    slide,
    scaleX,
    scaleY,
  }: {
    source: WebGLTexture;
    output: RenderTarget;
    slide: number;
    scaleX: number;
    scaleY: number;
  }) {
    const { gl } = this;
    const program = this.programs.transform;

    this.beginPass(program, output);
    this.bindTexture(program, "u_texture", source, 0);

    gl.uniform1f(getProgramUniform(gl, program, "u_slide"), slide);
    gl.uniform1f(getProgramUniform(gl, program, "u_scaleX"), scaleX);
    gl.uniform1f(getProgramUniform(gl, program, "u_scaleY"), scaleY);

    this.finishPass();
  }

  private renderBlur({
    source,
    output,
    direction,
    radiusPx,
    sampleCount,
  }: {
    source: WebGLTexture;
    output: RenderTarget;
    direction: [number, number];
    radiusPx: number;
    sampleCount: number;
  }) {
    const { gl } = this;
    const program = this.programs.blur;

    this.beginPass(program, output);
    this.bindTexture(program, "u_texture", source, 0);

    gl.uniform2f(getProgramUniform(gl, program, "u_resolution"), this.width, this.height);
    gl.uniform2f(getProgramUniform(gl, program, "u_direction"), direction[0], direction[1]);
    gl.uniform1f(getProgramUniform(gl, program, "u_radiusPx"), radiusPx);
    gl.uniform1i(getProgramUniform(gl, program, "u_sampleCount"), Math.max(2, sampleCount));

    this.finishPass();
  }

  private renderLens({
    source,
    output,
    strength,
  }: {
    source: WebGLTexture;
    output: RenderTarget;
    strength: number;
  }) {
    const { gl } = this;
    const program = this.programs.lens;

    this.beginPass(program, output);
    this.bindTexture(program, "u_texture", source, 0);

    gl.uniform1f(getProgramUniform(gl, program, "u_aspect"), this.width / this.height);
    gl.uniform1f(getProgramUniform(gl, program, "u_strength"), strength);

    this.finishPass();
  }

  private renderDisplace({
    source,
    output,
    pass,
    time,
  }: {
    source: WebGLTexture;
    output: RenderTarget;
    pass: TurbulencePass;
    time: number;
  }) {
    const { gl } = this;
    const program = this.programs.displace;

    this.beginPass(program, output);
    this.bindTexture(program, "u_texture", source, 0);

    gl.uniform2f(getProgramUniform(gl, program, "u_resolution"), this.width, this.height);
    gl.uniform1f(getProgramUniform(gl, program, "u_time"), time);
    gl.uniform1f(getProgramUniform(gl, program, "u_aspect"), this.width / this.height);
    gl.uniform1f(getProgramUniform(gl, program, "u_amount"), pass.amount);
    gl.uniform1f(getProgramUniform(gl, program, "u_size"), pass.size);
    gl.uniform1i(getProgramUniform(gl, program, "u_complexity"), Math.max(1, pass.complexity));
    gl.uniform1f(getProgramUniform(gl, program, "u_evolutionSpeed"), pass.evolutionSpeed);
    gl.uniform2f(getProgramUniform(gl, program, "u_flow"), pass.flow.x, pass.flow.y);
    gl.uniform1f(getProgramUniform(gl, program, "u_seed"), pass.seed);

    this.finishPass();
  }

  private renderRepeat({
    source,
    output,
    expand,
  }: {
    source: WebGLTexture;
    output: RenderTarget;
    expand: [number, number];
  }) {
    const { gl } = this;
    const program = this.programs.repeat;

    this.beginPass(program, output);
    this.bindTexture(program, "u_texture", source, 0);
    gl.uniform2f(getProgramUniform(gl, program, "u_expand"), expand[0], expand[1]);

    this.finishPass();
  }

  private renderComposite({
    background,
    surface,
    shadowDensity,
  }: {
    background: WebGLTexture;
    surface: WebGLTexture;
    shadowDensity: number;
  }) {
    const { gl } = this;
    const program = this.programs.composite;

    this.beginPass(program, null);
    this.bindTexture(program, "u_background", background, 0);
    this.bindTexture(program, "u_surface", surface, 1);
    gl.uniform1f(getProgramUniform(gl, program, "u_shadowDensity"), shadowDensity);

    this.finishPass();
  }

  private renderSurfaceShade({
    background,
    source,
    output,
    opacity,
    thicknessGain,
    refractionStrength,
    fresnelStrength,
    highlightSharpness,
  }: {
    background: WebGLTexture;
    source: WebGLTexture;
    output: RenderTarget;
    opacity: number;
    thicknessGain: number;
    refractionStrength: number;
    fresnelStrength: number;
    highlightSharpness: number;
  }) {
    const { gl } = this;
    const program = this.programs.surfaceShade;

    this.beginPass(program, output);
    this.bindTexture(program, "u_texture", source, 0);
    this.bindTexture(program, "u_background", background, 1);
    gl.uniform2f(getProgramUniform(gl, program, "u_resolution"), this.width, this.height);
    gl.uniform1f(getProgramUniform(gl, program, "u_opacity"), opacity);
    gl.uniform1f(getProgramUniform(gl, program, "u_thicknessGain"), thicknessGain);
    gl.uniform1f(getProgramUniform(gl, program, "u_refractionStrength"), refractionStrength);
    gl.uniform1f(getProgramUniform(gl, program, "u_fresnelStrength"), fresnelStrength);
    gl.uniform1f(getProgramUniform(gl, program, "u_highlightSharpness"), highlightSharpness);

    this.finishPass();
  }
}

const getRenderer = (canvas: HTMLCanvasElement) => {
  const cached = rendererCache.get(canvas);
  if (cached) {
    return cached;
  }

  const renderer = new WebGLEffectRenderer(canvas);
  rendererCache.set(canvas, renderer);
  return renderer;
};

const getReusableWebGLCanvas = (key: string, width: number, height: number) => {
  if (typeof document === "undefined") {
    throw new Error("Document is not available for WebGL canvas creation.");
  }

  let canvas = webglCanvasPool.get(key);
  if (!canvas) {
    canvas = document.createElement("canvas");
    webglCanvasPool.set(key, canvas);
  }

  if (canvas.width !== width) {
    canvas.width = width;
  }

  if (canvas.height !== height) {
    canvas.height = height;
  }

  return canvas;
};

export const renderSmokeWithWebGL = ({
  cacheKey,
  target,
  time,
  recipe,
}: {
  cacheKey: string;
  target: HTMLCanvasElement;
  time: number;
  recipe: MooographSmokePreset;
}) => {
  const webglCanvas = getReusableWebGLCanvas(cacheKey, target.width, target.height);
  const renderer = getRenderer(webglCanvas);
  renderer.renderSmoke(recipe, time);
  renderer.copyToCanvas(target);
};

export const renderMarbleWithWebGL = ({
  cacheKey,
  target,
  time,
  loopProgress,
  recipe,
}: {
  cacheKey: string;
  target: HTMLCanvasElement;
  time: number;
  loopProgress: number;
  recipe: MarbleRecipe;
}) => {
  const webglCanvas = getReusableWebGLCanvas(cacheKey, target.width, target.height);
  const renderer = getRenderer(webglCanvas);
  renderer.renderMarble(recipe, time, loopProgress);
  renderer.copyToCanvas(target);
};
