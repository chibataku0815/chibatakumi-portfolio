struct Params {
  resolution: vec2f,
  time: f32,
  count: u32,
  bgColor: vec4f,
  threshold: f32,
  softness: f32,
  maskBlend: f32,
  rimIntensity: f32,
}

struct Particle {
  pos: vec2f,
  vel: vec2f,
  radius: f32,
  phase: f32,
  colorIdx: f32,
  life: f32,
}

@group(0) @binding(0) var<uniform> u: Params;
@group(0) @binding(1) var<storage, read> particles: array<Particle>;
@group(0) @binding(2) var maskTex: texture_2d<f32>;
@group(0) @binding(3) var maskSamp: sampler;

struct VOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
}

const DARK_COLOR = vec3f(0.102, 0.102, 0.102);
const WHITE_COLOR = vec3f(1.0, 1.0, 1.0);

@vertex
fn vs(@builtin(vertex_index) i: u32) -> VOut {
  var p = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f(3.0, -1.0),
    vec2f(-1.0, 3.0),
  );
  var o: VOut;
  let q = p[i];
  o.pos = vec4f(q, 0.0, 1.0);
  o.uv = vec2f((q.x + 1.0) * 0.5, 1.0 - (q.y + 1.0) * 0.5);
  return o;
}

@fragment
fn fs(in: VOut) -> @location(0) vec4f {
  let fragCoord = in.uv * u.resolution;
  let scale = min(u.resolution.x, u.resolution.y);

  var field: f32 = 0.0;
  var weightedColor = vec3f(0.0);
  let cutoffFactor = 200.0;

  for (var i = 0u; i < u.count; i++) {
    let p = particles[i];
    let pixelPos = p.pos * u.resolution;
    let breathe = sin(u.time * 1.5 + p.phase * 6.28318) * 0.08 + 1.0;
    let pixelRadius = p.radius * scale * breathe;
    let diff = fragCoord - pixelPos;
    let distSq = dot(diff, diff);
    let radiusSq = pixelRadius * pixelRadius;

    if (distSq > radiusSq * cutoffFactor) {
      continue;
    }

    let influence = radiusSq / max(distSq, 0.001);
    let color = mix(DARK_COLOR, WHITE_COLOR, p.colorIdx);
    field += influence;
    weightedColor += color * influence;
  }

  let surfaceColor = weightedColor / max(field, 0.001);
  let alpha = smoothstep(u.threshold - u.softness, u.threshold + u.softness, field);

  let fieldNorm = clamp((field - u.threshold) / (u.threshold * 2.0), 0.0, 1.0);
  let rimGlow = (1.0 - smoothstep(0.0, 0.7, 1.0 - fieldNorm)) * u.rimIntensity;
  let edgeDark = smoothstep(0.0, 0.3, 1.0 - fieldNorm) * 0.25;
  let litColor = surfaceColor * (1.0 + rimGlow) * (1.0 - edgeDark);
  let metaballResult = mix(u.bgColor.rgb, litColor, alpha);

  // Text fill: solid text fades in over metaballs (maskBlend 0→1)
  // Correct for screen aspect ratio — mask texture is square
  let aspect = u.resolution.x / u.resolution.y;
  let rawUV = (in.uv - vec2f(0.15)) / vec2f(0.70);
  let maskUV = vec2f((rawUV.x - 0.5) * aspect + 0.5, rawUV.y);
  let textShape = textureSample(maskTex, maskSamp, maskUV).r;
  let solidText = mix(u.bgColor.rgb, DARK_COLOR, textShape);
  let result = mix(metaballResult, solidText, u.maskBlend);

  return vec4f(result, 1.0);
}
