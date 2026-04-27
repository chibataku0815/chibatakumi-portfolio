// Liquid-glass composite shader — final stage of motion-dot's render
// pipeline. Reads the post-effect output (textureB / "substrate") provided
// by motion-dot and writes lensed nav-rail surfaces into the swap chain.
//
// Source: vendored from `webgpu-liquid-glass-demo/src/shaders/composite.wgsl`
// with two product-quality modifications:
//   (a) Multi-rect support via per-surface dynamic-offset uniforms +
//       scissor draws. The shader operates on a single rect per draw —
//       motion-dot's compose runner iterates surfaces.
//   (b) Two output entry points sharing the same lensing math:
//        - fsComposite      — opaque output `mix(base, glass, mask)`. Used
//                              by the back compose path (motion-dot swap
//                              chain at z=-10).
//        - fsCompositeAlpha — premultiplied alpha output. Outside the
//                              rect SDF: alpha=0 (transparent so HTML
//                              behind the front canvas shows through).
//                              Inside SDF: alpha=mask (opaque Liquid Glass
//                              with refracted motion-dot substrate). Used
//                              by the front overlay canvas at
//                              z=var(--z-nav-front-glass).
//
// Bind group:
//   binding 0 — uniform (96 bytes per surface, dynamic offset)
//   binding 1 — substrate sampler (linear)
//   binding 2 — substrate texture_2d<f32>

export const LIQUID_GLASS_COMPOSITE_WGSL = /* wgsl */ `
struct FrameUniforms {
  resolution_time_dpr:    vec4f,
  pointer_state_scroll:   vec4f,
  accent_motion:          vec4f,
  rail_rect:              vec4f,
  rail_params:            vec4f,
  tint:                   vec4f,
};

struct VOut {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

@group(0) @binding(0) var<uniform> frame: FrameUniforms;
@group(0) @binding(1) var substrateSampler: sampler;
@group(0) @binding(2) var substrateTexture: texture_2d<f32>;

@vertex
fn vsMain(@builtin(vertex_index) vertexIndex: u32) -> VOut {
  var positions = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f(3.0, -1.0),
    vec2f(-1.0, 3.0)
  );
  var out: VOut;
  let p = positions[vertexIndex];
  out.position = vec4f(p, 0.0, 1.0);
  out.uv = vec2f((p.x + 1.0) * 0.5, 1.0 - (p.y + 1.0) * 0.5);
  return out;
}

fn hash21(p: vec2f) -> f32 {
  let q = fract(vec2f(
    dot(p, vec2f(127.1, 311.7)),
    dot(p, vec2f(269.5, 183.3))
  ));
  return fract(sin(dot(q, vec2f(12.9898, 78.233))) * 43758.5453);
}

fn noise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let a = hash21(i);
  let b = hash21(i + vec2f(1.0, 0.0));
  let c = hash21(i + vec2f(0.0, 1.0));
  let d = hash21(i + vec2f(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

fn roundedRectSdf(p: vec2f, rect: vec4f, radius: f32) -> f32 {
  let halfSize = rect.zw * 0.5;
  let center = rect.xy + halfSize;
  let q = abs(p - center) - (halfSize - vec2f(radius));
  return length(max(q, vec2f(0.0))) + min(max(q.x, q.y), 0.0) - radius;
}

fn roundedRectNormal(p: vec2f, rect: vec4f, radius: f32) -> vec2f {
  let e = 1.0;
  let dx = roundedRectSdf(p + vec2f(e, 0.0), rect, radius)
    - roundedRectSdf(p - vec2f(e, 0.0), rect, radius);
  let dy = roundedRectSdf(p + vec2f(0.0, e), rect, radius)
    - roundedRectSdf(p - vec2f(0.0, e), rect, radius);
  return normalize(vec2f(dx, dy) + vec2f(0.0001));
}

@fragment
fn fsBlit(in: VOut) -> @location(0) vec4f {
  return textureSampleLevel(substrateTexture, substrateSampler, in.uv, 0.0);
}

// Shared lensing core. Returns rgb (clamped) + mask in alpha channel so the
// two entry points can choose how to compose against their target.
fn computeGlass(p: vec2f) -> vec4f {
  let res = max(frame.resolution_time_dpr.xy, vec2f(1.0));
  let time = frame.resolution_time_dpr.z;
  let dpr = max(frame.resolution_time_dpr.w, 1.0);
  let uv = clamp(p / res, vec2f(0.001), vec2f(0.999));

  let rect = frame.rail_rect;
  let radius = frame.rail_params.x;
  let intensity = clamp(frame.rail_params.y, 0.0, 1.6);
  let kindId = frame.rail_params.w;
  let isPanel = step(0.5, kindId) * (1.0 - step(1.5, kindId));

  let feather = max(1.0 + intensity * 0.6, 0.5);
  let refractionPx = (10.0 + intensity * 14.0) * dpr;
  let dispersionPx = (1.6 + intensity * 1.4) * dpr;
  let amber = frame.accent_motion.rgb;
  let reducedMotion = clamp(frame.accent_motion.w, 0.0, 1.0);
  let pointer = frame.pointer_state_scroll.xy;
  let pointerActive = clamp(frame.pointer_state_scroll.z, 0.0, 1.0);
  let scrollVel = frame.pointer_state_scroll.w;
  let surfaceTint = frame.tint.rgb;
  let tintAmount = clamp(frame.tint.a, 0.0, 1.0);
  let railTint = mix(amber, surfaceTint, tintAmount);

  let base = textureSampleLevel(substrateTexture, substrateSampler, uv, 0.0).rgb;

  let sdf = roundedRectSdf(p, rect, radius);
  let mask = 1.0 - smoothstep(0.0, feather, sdf);
  if (mask <= 0.0001) {
    return vec4f(base, 0.0);
  }
  let innerFade = smoothstep(feather * 8.0, -feather * 2.0, sdf);
  let edge = exp(-abs(sdf) / max(3.4 * dpr, 0.001)) * mask;
  let normal = roundedRectNormal(p, rect, radius);

  let rectCenter = rect.xy + rect.zw * 0.5;
  let railLocal = (p - rectCenter) / max(rect.zw, vec2f(1.0));
  let bulgeRaw = clamp(
    dot(railLocal * vec2f(1.9, 3.2), railLocal * vec2f(1.9, 3.2)),
    0.0,
    1.0,
  );
  let bulge = (1.0 - bulgeRaw);

  let motionTime = time * (1.0 - reducedMotion * 0.92);
  let causticCoord = p / (84.0 * dpr) + vec2f(motionTime * 0.05, -motionTime * 0.035);
  let causticX = noise(causticCoord + vec2f(0.03, 0.0)) - noise(causticCoord - vec2f(0.03, 0.0));
  let causticY = noise(causticCoord + vec2f(0.0, 0.03)) - noise(causticCoord - vec2f(0.0, 0.03));
  let causticNormal = vec2f(causticX, causticY) * 24.0 * dpr;

  let pointerDelta = p - pointer;
  let pointerDist = length(pointerDelta / max(96.0 * dpr, 1.0));
  let pointerField = exp(-pointerDist * pointerDist * 1.75) * pointerActive * mask;
  let pointerNormal = normalize(pointerDelta + vec2f(0.001)) * pointerField * -8.0 * dpr;

  let lensOffsetPx = (
    -normal * edge * refractionPx
    + railLocal * bulge * -5.5 * dpr
    + causticNormal * innerFade * 0.16 * (1.0 - reducedMotion * 0.8)
    + pointerNormal
  ) * mask;

  let refractedUv = clamp(uv + lensOffsetPx / res, vec2f(0.001), vec2f(0.999));
  let chromaVector = normal * edge * dispersionPx / res;

  let redSample = textureSampleLevel(
    substrateTexture,
    substrateSampler,
    clamp(refractedUv + chromaVector, vec2f(0.001), vec2f(0.999)),
    0.0,
  ).r;
  let greenSample = textureSampleLevel(
    substrateTexture,
    substrateSampler,
    refractedUv,
    0.0,
  ).g;
  let blueSample = textureSampleLevel(
    substrateTexture,
    substrateSampler,
    clamp(refractedUv - chromaVector, vec2f(0.001), vec2f(0.999)),
    0.0,
  ).b;

  var glass = vec3f(redSample, greenSample, blueSample);
  glass = glass * (0.92 + 0.08 * edge) + vec3f(0.020, 0.027, 0.033) * 0.08 + railTint * 0.030;

  // Brightness control — chips/rails read as dark optical-control material;
  // sheets (kind=panel) get a gentler luminance pull so they feel "lit".
  let lum = dot(glass, vec3f(0.2126, 0.7152, 0.0722));
  let darkTarget = vec3f(0.04, 0.05, 0.07);
  let pullStrength = mix(0.55, 0.22, isPanel);
  glass = mix(glass, mix(glass, darkTarget, pullStrength), smoothstep(0.55, 0.95, lum));

  // Edge fresnel — cyan/magenta dispersion. Panels carry a wider band.
  let cyan = vec3f(0.08, 0.70, 0.84);
  let magenta = vec3f(0.86, 0.16, 0.62);
  let edgeColor = mix(magenta, cyan, smoothstep(-0.42, 0.42, normal.x));
  let dispersionStrength = mix(0.105, 0.165, isPanel);
  glass = glass + edgeColor * edge * dispersionStrength;

  // White rim wire — sharp polished edge. Panels get a stronger wire.
  let rimWire = pow(edge, mix(2.0, 1.5, isPanel));
  let rimWireStrength = mix(0.18, 0.55, isPanel);
  glass = glass + vec3f(1.0, 1.0, 1.0) * rimWire * rimWireStrength;

  // Pointer specular + top sheen.
  let pointerSpec = pointerField
    * smoothstep(-0.20, 0.50, railLocal.y)
    * (0.42 + 0.58 * smoothstep(0.65, 0.0, abs(railLocal.x)));
  let railTopSheen = smoothstep(rect.y + 18.0 * dpr, rect.y, p.y)
    * smoothstep(rect.y - 3.0 * dpr, rect.y + 5.0 * dpr, p.y)
    * mask;
  glass = glass + vec3f(0.56, 0.72, 0.78) * pointerSpec * 0.30;
  glass = glass + vec3f(0.20, 0.28, 0.32) * railTopSheen * 0.13;

  // Scroll-reactive sweep — subtle bright streak on the rim.
  let scrollKick = clamp(abs(scrollVel) * 0.0015, 0.0, 0.5)
    * (1.0 - reducedMotion * 0.8);
  let sweepBand = exp(-railLocal.x * railLocal.x * 6.0) * scrollKick * mask;
  glass = glass + vec3f(0.96, 0.96, 1.00) * sweepBand * 0.20;

  return vec4f(clamp(glass, vec3f(0.0), vec3f(1.0)), mask);
}

@fragment
fn fsComposite(in: VOut) -> @location(0) vec4f {
  let p = in.position.xy;
  let result = computeGlass(p);
  let glass = result.rgb;
  let mask = result.a;
  let res = max(frame.resolution_time_dpr.xy, vec2f(1.0));
  let uv = clamp(p / res, vec2f(0.001), vec2f(0.999));
  let base = textureSampleLevel(substrateTexture, substrateSampler, uv, 0.0).rgb;
  let outputColor = mix(base, glass, mask);
  return vec4f(clamp(outputColor, vec3f(0.0), vec3f(1.0)), 1.0);
}

@fragment
fn fsCompositeAlpha(in: VOut) -> @location(0) vec4f {
  let p = in.position.xy;
  let result = computeGlass(p);
  let glass = result.rgb;
  let mask = result.a;
  // Premultiplied alpha output:
  //   - Outside SDF (mask=0): vec4f(0,0,0,0) — fully transparent.
  //   - Inside SDF (mask=1):  vec4f(glass, 1) — opaque Liquid Glass.
  //   - Feather edge:          vec4f(glass*mask, mask) — smooth fade.
  return vec4f(glass * mask, mask);
}
`;

/** Number of f32 values in the per-surface uniform block (6 vec4f = 24 floats). */
export const LIQUID_GLASS_UNIFORM_FLOAT_COUNT = 24;
/** Per-surface uniform block in bytes (96 bytes). */
export const LIQUID_GLASS_UNIFORM_BYTE_SIZE =
  LIQUID_GLASS_UNIFORM_FLOAT_COUNT * Float32Array.BYTES_PER_ELEMENT;
/** Maximum number of liquid-glass surfaces drawn per frame. */
export const LIQUID_GLASS_MAX_SURFACES = 48;
