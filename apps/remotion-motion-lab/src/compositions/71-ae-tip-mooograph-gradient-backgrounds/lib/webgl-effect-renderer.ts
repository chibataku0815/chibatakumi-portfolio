import type {
  GradientPointConfig,
  MarbleRecipe,
  OrganicGradientRecipe,
  TurbulencePass,
} from "../config";
import { hexToRgb } from "./color";
import { seeded } from "./math";

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

type CircleSeed = {
  x: number;
  y: number;
  radius: number;
  color: [number, number, number];
};

const MAX_GRADIENT_POINTS = 4;
const MAX_CIRCLES = 32;

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

  float ridge = 1.0 - abs(fbm(flowUv * 3.3 + fine * 0.8 + 12.7, max(2, u_complexity)) * 2.0 - 1.0);
  float vapor = smoothstep(0.16, 0.82, ridge);
  float plumeMix = smoothstep(0.24, 0.9, fbm(flowUv * 0.95 + 21.3, max(2, u_complexity)));

  float luma = dot(base.rgb, vec3(0.2126, 0.7152, 0.0722));
  vec3 plumeTint = mix(vec3(1.0, 0.93, 0.84), vec3(0.72, 0.88, 1.0), plumeMix);
  vec3 color = mix(base.rgb, max(farAhead, farBehind), vapor * 0.35 + fiber * 0.18);
  color += plumeTint * vapor * (0.08 + luma * 0.12);
  color += vec3(0.24, 0.16, 0.28) * fiber * u_fiberBoost;
  color = mix(color * 0.96, color + vec3(luma) * 0.1, vapor * 0.3);

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
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
  vec3 graded = sampleColor + u_highlightTint * bloom * 0.22;
  graded = mix(graded * 0.98, graded, 0.92);
  gl_FragColor = vec4(applyTone(clamp(graded, 0.0, 1.0)), 1.0);
}
`;

const circlePrecompFragmentSource = `
precision highp float;
varying vec2 v_uv;

uniform vec2 u_resolution;
uniform int u_circleCount;
uniform vec3 u_circles[${MAX_CIRCLES}];
uniform vec3 u_circleColors[${MAX_CIRCLES}];
uniform vec2 u_shadowOffset;
uniform float u_shadowOpacity;

vec3 lighten(vec3 color, float amount) {
  return color + (1.0 - color) * amount;
}

vec3 darken(vec3 color, float amount) {
  return color * (1.0 - amount);
}

void main() {
  vec2 p = v_uv * u_resolution;
  vec4 accum = vec4(0.0);
  vec3 lightDir = normalize(vec3(-0.38, -0.46, 1.0));

  for (int i = 0; i < ${MAX_CIRCLES}; i++) {
    if (i >= u_circleCount) {
      break;
    }

    vec3 circle = u_circles[i];
    vec3 color = u_circleColors[i];

    float shadowDist = length(p - (circle.xy + u_shadowOffset));
    float shadow = smoothstep(circle.z + 24.0, circle.z - 26.0, shadowDist) * u_shadowOpacity;
    accum.rgb = mix(accum.rgb, vec3(0.0), shadow * (1.0 - accum.a) * 0.42);
    accum.a = max(accum.a, shadow * 0.58);

    vec2 local = (p - circle.xy) / max(circle.z, 1.0);
    float radiusSq = dot(local, local);
    if (radiusSq > 1.35) {
      continue;
    }

    float body = smoothstep(1.02, 0.84, radiusSq);
    float nz = sqrt(max(0.0, 1.0 - clamp(radiusSq, 0.0, 1.0)));
    float diffuse = max(dot(normalize(vec3(local, nz)), lightDir), 0.0);
    float highlight = pow(max(dot(normalize(vec3(local + vec2(0.16, 0.2), nz)), lightDir), 0.0), 10.0);
    float rim = smoothstep(0.55, 1.0, radiusSq) * 0.22;

    vec3 shaded = mix(darken(color, 0.24), lighten(color, 0.26), diffuse);
    shaded = mix(shaded, lighten(color, 0.42), highlight * 0.8);
    shaded += rim;

    accum.rgb = accum.rgb * (1.0 - body) + shaded * body;
    accum.a = accum.a + body * (1.0 - accum.a);
  }

  gl_FragColor = vec4(clamp(accum.rgb, 0.0, 1.0), clamp(accum.a, 0.0, 1.0));
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
  gl_FragColor = texture2D(u_texture, clamp(uv, 0.0, 1.0));
}
`;

const directionalBlurFragmentSource = `
precision highp float;
varying vec2 v_uv;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform vec2 u_direction;
uniform float u_radiusPx;

void main() {
  vec2 stepUv = u_direction * (u_radiusPx / u_resolution);
  vec4 accum = vec4(0.0);
  float total = 0.0;

  for (int i = 0; i < 16; i++) {
    float t = float(i) / 15.0 - 0.5;
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

  gl_FragColor = texture2D(u_texture, clamp(uv, 0.0, 1.0));
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
  vec2 sampleUv = clamp(v_uv + vec2(disp.x / u_aspect, disp.y), 0.0, 1.0);
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

const compositeFragmentSource = `
precision highp float;
varying vec2 v_uv;

uniform sampler2D u_background;
uniform sampler2D u_surface;

void main() {
  vec3 background = texture2D(u_background, v_uv).rgb;
  vec4 surface = texture2D(u_surface, v_uv);

  vec3 screenBlend = 1.0 - (1.0 - background) * (1.0 - surface.rgb * surface.a);
  float luma = dot(surface.rgb, vec3(0.2126, 0.7152, 0.0722));
  vec3 result = mix(background, screenBlend, 0.9);
  result += surface.rgb * surface.a * 0.06;
  result += vec3(0.08, 0.08, 0.12) * smoothstep(0.3, 0.9, luma) * surface.a * 0.3;

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

const hexToNormalized = (color: string): [number, number, number] => {
  const rgb = hexToRgb(color);
  return [rgb.r / 255, rgb.g / 255, rgb.b / 255];
};

const createCircleSeeds = ({
  width,
  height,
  recipe,
}: {
  width: number;
  height: number;
  recipe: MarbleRecipe;
}): CircleSeed[] => {
  return Array.from({ length: Math.min(recipe.circleCount, MAX_CIRCLES) }, (_, index) => {
    const localSeed = recipe.seed * 100 + index * 17;
    const diagonal = seeded(localSeed + 1);
    const spread = seeded(localSeed + 2) - 0.5;
    const offset = seeded(localSeed + 4) - 0.5;

    return {
      x: (diagonal * 1.32 - 0.16 + spread * 0.18) * width,
      y: (0.2 + diagonal * 0.56 + spread * 0.34 + offset * 0.08) * height,
      radius:
        recipe.minRadius +
        (recipe.maxRadius - recipe.minRadius) * Math.pow(seeded(localSeed + 3), 0.72),
      color: hexToNormalized(recipe.colors[index % recipe.colors.length] ?? "#ffffff"),
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

  private circleCache = new Map<string, { circles: Float32Array; colors: Float32Array; count: number }>();

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
      smokeGrade: createProgram({ gl, fragmentSource: smokeGradeFragmentSource }),
      circlePrecomp: createProgram({ gl, fragmentSource: circlePrecompFragmentSource }),
      transform: createProgram({ gl, fragmentSource: transformFragmentSource }),
      blur: createProgram({ gl, fragmentSource: directionalBlurFragmentSource }),
      lens: createProgram({ gl, fragmentSource: lensWarpFragmentSource }),
      displace: createProgram({ gl, fragmentSource: displaceFragmentSource }),
      repeat: createProgram({ gl, fragmentSource: repeatTileFragmentSource }),
      composite: createProgram({ gl, fragmentSource: compositeFragmentSource }),
    };

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.disable(gl.BLEND);
  }

  public renderSmoke(recipe: OrganicGradientRecipe, time: number) {
    this.ensureSize();
    this.renderGradient(recipe, time, this.getTarget("smoke-gradient"));

    const largePass = recipe.turbulence[0];
    const detailPass = recipe.turbulence[1];

    if (!largePass || !detailPass) {
      throw new Error("Smoke recipe requires two turbulence passes.");
    }

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

    const highlightTint = hexToNormalized(recipe.points[0]?.color ?? "#ffffff");
    this.renderSmokeGrade({
      source: this.getTarget("smoke-b").texture,
      tone: recipe.tone,
      highlightTint,
    });
  }

  public renderMarble(recipe: MarbleRecipe, time: number, loopProgress: number) {
    this.ensureSize();
    this.renderGradient(recipe.background, time, this.getTarget("marble-background"));
    this.renderCirclePrecomp(recipe, this.getTarget("marble-circles"));

    this.renderTransform({
      source: this.getTarget("marble-circles").texture,
      output: this.getTarget("marble-transform"),
      slide: (loopProgress * 2 - 1) * recipe.transformTravelFactor,
      scaleX: 1.34,
      scaleY: 0.94,
    });

    const blurAngle = (recipe.blurAngleDeg * Math.PI) / 180;
    this.renderBlur({
      source: this.getTarget("marble-transform").texture,
      output: this.getTarget("marble-blur"),
      direction: [Math.cos(blurAngle), Math.sin(blurAngle)],
      radiusPx: recipe.blurLengthFactor * this.width * 1.55,
    });

    this.renderLens({
      source: this.getTarget("marble-blur").texture,
      output: this.getTarget("marble-lens"),
      strength: recipe.lensStrength * 1.08,
    });

    this.renderDisplace({
      source: this.getTarget("marble-lens").texture,
      output: this.getTarget("marble-displace"),
      pass: recipe.turbulence,
      time,
    });

    this.renderRepeat({
      source: this.getTarget("marble-displace").texture,
      output: this.getTarget("marble-repeat"),
      expand: [1.28, 1.14],
    });

    this.renderComposite({
      background: this.getTarget("marble-background").texture,
      surface: this.getTarget("marble-repeat").texture,
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

  private renderCirclePrecomp(recipe: MarbleRecipe, output: RenderTarget) {
    const { gl } = this;
    const program = this.programs.circlePrecomp;
    const cacheKey = `${this.width}x${this.height}-${recipe.seed}-${recipe.circleCount}`;
    let cached = this.circleCache.get(cacheKey);

    if (!cached) {
      const seeds = createCircleSeeds({
        width: this.width,
        height: this.height,
        recipe,
      });
      const circles = new Float32Array(MAX_CIRCLES * 3);
      const colors = new Float32Array(MAX_CIRCLES * 3);

      seeds.forEach((seed, index) => {
        circles[index * 3] = seed.x;
        circles[index * 3 + 1] = seed.y;
        circles[index * 3 + 2] = seed.radius;
        colors[index * 3] = seed.color[0];
        colors[index * 3 + 1] = seed.color[1];
        colors[index * 3 + 2] = seed.color[2];
      });

      cached = {
        circles,
        colors,
        count: seeds.length,
      };
      this.circleCache.set(cacheKey, cached);
    }

    this.beginPass(program, output);

    gl.uniform2f(getProgramUniform(gl, program, "u_resolution"), this.width, this.height);
    gl.uniform1i(getProgramUniform(gl, program, "u_circleCount"), cached.count);
    gl.uniform3fv(getProgramUniform(gl, program, "u_circles[0]"), cached.circles);
    gl.uniform3fv(getProgramUniform(gl, program, "u_circleColors[0]"), cached.colors);

    const shadowOffset = recipe.shadowOffsetFactor * this.width;
    const angle = (45 * Math.PI) / 180;
    gl.uniform2f(
      getProgramUniform(gl, program, "u_shadowOffset"),
      -Math.cos(angle) * shadowOffset,
      Math.sin(angle) * shadowOffset,
    );
    gl.uniform1f(getProgramUniform(gl, program, "u_shadowOpacity"), recipe.shadowOpacity);

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
  }: {
    source: WebGLTexture;
    output: RenderTarget;
    direction: [number, number];
    radiusPx: number;
  }) {
    const { gl } = this;
    const program = this.programs.blur;

    this.beginPass(program, output);
    this.bindTexture(program, "u_texture", source, 0);

    gl.uniform2f(getProgramUniform(gl, program, "u_resolution"), this.width, this.height);
    gl.uniform2f(getProgramUniform(gl, program, "u_direction"), direction[0], direction[1]);
    gl.uniform1f(getProgramUniform(gl, program, "u_radiusPx"), radiusPx);

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
  }: {
    background: WebGLTexture;
    surface: WebGLTexture;
  }) {
    const { gl } = this;
    const program = this.programs.composite;

    this.beginPass(program, null);
    this.bindTexture(program, "u_background", background, 0);
    this.bindTexture(program, "u_surface", surface, 1);

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
  recipe: OrganicGradientRecipe;
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
