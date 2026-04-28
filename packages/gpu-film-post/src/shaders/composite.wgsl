// ============================================================
// gpu-film-post — composite.wgsl
// Single-pass film post-processing: 6 effects in one draw call.
// Fullscreen triangle (no vertex buffer).
// ============================================================

// ── Uniform buffer (64 bytes, 16-aligned) ────────────────────
struct Uniforms {
  time:               f32,   //  0
  pulse:              f32,   //  4
  resolution:         vec2f, //  8
  grainIntensity:     f32,   // 16
  grainSize:          f32,   // 20
  caAmount:           f32,   // 24
  bloomThreshold:     f32,   // 28
  bloomIntensity:     f32,   // 32
  bloomWarmth:        f32,   // 36
  vignetteStrength:   f32,   // 40
  vignetteWarmShift:  f32,   // 44
  leakIntensity:      f32,   // 48
  shadowLift:         f32,   // 52
  tonemapCompression: f32,   // 56
  grainRadialMix:     f32,   // 60
}

// ── Bindings ─────────────────────────────────────────────────
@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var sceneSampler: sampler;
@group(0) @binding(2) var sceneTexture: texture_2d<f32>;

// ── Vertex IO ────────────────────────────────────────────────
struct VOut {
  @builtin(position) pos: vec4f,
  @location(0)       uv:  vec2f,
}

// ── Helpers: fract (WGSL has no built-in) ────────────────────
fn fract1(x: f32) -> f32 { return x - floor(x); }
fn fract2(v: vec2f) -> vec2f { return v - floor(v); }

// ── Grain: per-pixel deterministic hash ──────────────────────
fn grainPixelHash(p: vec2f, seed: f32) -> f32 {
  let s = dot(p + seed, vec2f(12.9898, 78.233));
  return fract1(sin(s) * 43758.5453);
}

// ── Grain: lattice hash for clump noise ──────────────────────
fn valueNoiseHash(p: vec2f) -> f32 {
  let h = dot(p, vec2f(12.9898, 78.233));
  return fract1(sin(h) * 43758.5453);
}

fn grainClumpNoise(p: vec2f, clumpScale: f32) -> f32 {
  let sp = p / clumpScale;
  let i  = floor(sp);
  let f  = fract2(sp);
  let sm = f * f * (3.0 - 2.0 * f);  // smoothstep
  let a  = valueNoiseHash(i);
  let b  = valueNoiseHash(i + vec2f(1.0, 0.0));
  let c  = valueNoiseHash(i + vec2f(0.0, 1.0));
  let d  = valueNoiseHash(i + vec2f(1.0, 1.0));
  return mix(mix(a, b, sm.x), mix(c, d, sm.x), sm.y);
}

// ── Bloom helpers ────────────────────────────────────────────
fn glowShoulder(energy: vec3f) -> vec3f {
  return vec3f(1.0) - exp(-max(energy, vec3f(0.0)));
}

fn glowHeadroom(baseRgb: vec3f, floorValue: f32) -> vec3f {
  let luma = dot(baseRgb, vec3f(0.2126, 0.7152, 0.0722));
  let head = mix(floorValue, 1.0, sqrt(clamp(1.0 - luma, 0.0, 1.0)));
  return vec3f(head);
}

// ── 8 compass directions for bloom taps ──────────────────────
const BLOOM_OFFSETS = array<vec2f, 8>(
  vec2f( 1.0,  0.0),
  vec2f(-1.0,  0.0),
  vec2f( 0.0,  1.0),
  vec2f( 0.0, -1.0),
  vec2f( 0.707,  0.707),
  vec2f(-0.707,  0.707),
  vec2f( 0.707, -0.707),
  vec2f(-0.707, -0.707),
);

// ── Bloom: single ring accumulator (9 taps: center + 8) ─────
fn bloomRing(
  uv: vec2f,
  radiusPx: f32,
  threshold: f32,
) -> vec3f {
  let texel = vec2f(1.0) / u.resolution;
  let radius = radiusPx * texel;

  // Center tap
  let sc = textureSample(sceneTexture, sceneSampler, uv);
  let bc = max(sc.r, max(sc.g, sc.b));
  var accum = sc.rgb * max(bc - threshold, 0.0) / max(bc, 0.001);

  // 8 compass taps — no branching around textureSample
  let s0 = textureSample(sceneTexture, sceneSampler, uv + BLOOM_OFFSETS[0] * radius);
  let b0 = max(s0.r, max(s0.g, s0.b));
  accum += s0.rgb * max(b0 - threshold, 0.0) / max(b0, 0.001);

  let s1 = textureSample(sceneTexture, sceneSampler, uv + BLOOM_OFFSETS[1] * radius);
  let b1 = max(s1.r, max(s1.g, s1.b));
  accum += s1.rgb * max(b1 - threshold, 0.0) / max(b1, 0.001);

  let s2 = textureSample(sceneTexture, sceneSampler, uv + BLOOM_OFFSETS[2] * radius);
  let b2 = max(s2.r, max(s2.g, s2.b));
  accum += s2.rgb * max(b2 - threshold, 0.0) / max(b2, 0.001);

  let s3 = textureSample(sceneTexture, sceneSampler, uv + BLOOM_OFFSETS[3] * radius);
  let b3 = max(s3.r, max(s3.g, s3.b));
  accum += s3.rgb * max(b3 - threshold, 0.0) / max(b3, 0.001);

  let s4 = textureSample(sceneTexture, sceneSampler, uv + BLOOM_OFFSETS[4] * radius);
  let b4 = max(s4.r, max(s4.g, s4.b));
  accum += s4.rgb * max(b4 - threshold, 0.0) / max(b4, 0.001);

  let s5 = textureSample(sceneTexture, sceneSampler, uv + BLOOM_OFFSETS[5] * radius);
  let b5 = max(s5.r, max(s5.g, s5.b));
  accum += s5.rgb * max(b5 - threshold, 0.0) / max(b5, 0.001);

  let s6 = textureSample(sceneTexture, sceneSampler, uv + BLOOM_OFFSETS[6] * radius);
  let b6 = max(s6.r, max(s6.g, s6.b));
  accum += s6.rgb * max(b6 - threshold, 0.0) / max(b6, 0.001);

  let s7 = textureSample(sceneTexture, sceneSampler, uv + BLOOM_OFFSETS[7] * radius);
  let b7 = max(s7.r, max(s7.g, s7.b));
  accum += s7.rgb * max(b7 - threshold, 0.0) / max(b7, 0.001);

  return accum / 9.0;
}

// =============================================================
// Vertex shader — fullscreen triangle (3 verts, no buffer)
// =============================================================
@vertex
fn vs(@builtin(vertex_index) i: u32) -> VOut {
  var p = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f( 3.0, -1.0),
    vec2f(-1.0,  3.0),
  );
  var o: VOut;
  let q = p[i];
  o.pos = vec4f(q, 0.0, 1.0);
  o.uv  = vec2f((q.x + 1.0) * 0.5, 1.0 - (q.y + 1.0) * 0.5);
  return o;
}

// =============================================================
// Fragment shader — 6 effects in order
// =============================================================
@fragment
fn fs(in: VOut) -> @location(0) vec4f {
  let uv  = in.uv;
  let cuv = uv - 0.5;                                  // centered UV [-0.5, 0.5]
  let aspect = u.resolution.x / u.resolution.y;

  // ── 1. Radial Chromatic Aberration (3 texture reads) ───────
  let caDelta  = cuv * vec2f(aspect, 1.0);
  let caRadial = clamp(length(caDelta) * 2.0, 0.0, 1.0);
  let caWeight = pow(caRadial, 1.65);
  let caAmt    = (u.caAmount + u.pulse * 0.012) * caWeight;
  let caDir    = normalize(caDelta + vec2f(1e-5));      // NaN guard

  var col: vec3f;
  col.r = textureSample(sceneTexture, sceneSampler, uv + caDir * caAmt).r;
  col.g = textureSample(sceneTexture, sceneSampler, uv).g;
  col.b = textureSample(sceneTexture, sceneSampler, uv - caDir * caAmt).b;

  // ── 2. Threshold Bloom (18 texture reads: 2 rings × 9) ────
  //   Narrow ring: sharp white glow
  let narrowBloom = bloomRing(uv, 8.0, u.bloomThreshold);
  //   Wide ring: warm halation
  let wideRaw     = bloomRing(uv, 35.0, u.bloomThreshold);
  let warmTint    = vec3f(1.0, 0.85, 0.65);
  let wideBloom   = wideRaw * mix(vec3f(1.0), warmTint, u.bloomWarmth);

  let bloomEnergy = (narrowBloom + wideBloom) * u.bloomIntensity;
  let glow        = glowShoulder(bloomEnergy) * glowHeadroom(col, 0.82);
  // Screen blend
  col = vec3f(1.0) - (vec3f(1.0) - col) * (vec3f(1.0) - glow);

  // ── 3. Vignette (0 texture reads) ─────────────────────────
  let vigBase = dot(cuv, cuv);
  let vig     = 1.0 - pow(vigBase, 1.3) * u.vignetteStrength;
  col *= vig;
  // Warm shift at darkened edges (film edge color cast)
  col = mix(col, col * vec3f(1.05, 0.95, 0.85),
            (1.0 - vig) * u.vignetteWarmShift);

  // ── 4. Light Leak (0 texture reads) ───────────────────────
  // Left edge — amber
  let leak1 = exp(-pow((cuv.x + 0.5) * 2.5, 2.0) * 4.0)
            * (sin(u.time * 0.17) * 0.3 + 0.7) * 0.06;
  // Right-top — deep orange
  let leak2 = exp(-pow(length(cuv - vec2f(0.4, 0.3)) * 2.0, 2.0) * 3.0)
            * max(sin(u.time * 0.41), 0.0) * 0.08;
  // Drifting — gold
  let leak3 = exp(-pow((cuv.x - sin(u.time * 0.28) * 0.55) * 1.1, 2.0) * 3.5)
            * 0.10;

  col += vec3f(0.95, 0.55, 0.20) * leak1 * u.leakIntensity;
  col += vec3f(0.90, 0.40, 0.15) * leak2 * u.leakIntensity;
  col += vec3f(0.95, 0.60, 0.25) * leak3 * u.leakIntensity;

  // ── 5. Film Grain — Independent per-channel color noise ────
  // Reference: noise_gradient.html — fully independent RGB noise with
  // luminance-dependent amplitude (stronger in darks, weaker in highlights).
  let pixelCoord = floor(in.uv * u.resolution);
  let timeSeed   = floor(u.time * 24.0);                // 24fps temporal update

  // Fully independent per-channel noise (NOT luma+chroma decomposition)
  let nR = grainPixelHash(pixelCoord, timeSeed * 1.7) * 2.0 - 1.0;
  let nG = grainPixelHash(pixelCoord, timeSeed * 2.3 + 500.0) * 2.0 - 1.0;
  let nB = grainPixelHash(pixelCoord, timeSeed * 3.1 + 1000.0) * 2.0 - 1.0;

  // Clump modulation — larger grain clusters for film-like texture
  let clumpScale = mix(80.0, 20.0, u.grainSize);
  let clump      = grainClumpNoise(pixelCoord, clumpScale);
  let densityMod = mix(1.0, 0.3 + clump * 1.4, u.grainSize * 0.7);

  // Luminance-dependent amplitude: darks get more grain, highlights less
  let luma     = dot(col, vec3f(0.299, 0.587, 0.114));
  let grainAmp = mix(1.4, 0.6, clamp(luma, 0.0, 1.0));  // 1.4× in shadows, 0.6× in highlights

  // Radial mask
  let grainCentre = cuv * vec2f(aspect, 1.0);
  let grainDist   = length(grainCentre) / length(vec2f(aspect, 1.0) * 0.5);
  let grainRadial = pow(clamp(grainDist, 0.0, 1.0), 1.65);
  let grainMask   = mix(1.0, grainRadial, u.grainRadialMix);

  let w = u.grainIntensity * grainMask * densityMod * grainAmp;
  col.r += nR * w;
  col.g += nG * w;
  col.b += nB * w;

  // ── 6. Tonemap (0 texture reads) ──────────────────────────
  // Shadow warm lift — film D-min: blacks are never true black
  col += vec3f(u.shadowLift,
               u.shadowLift * 0.67,
               u.shadowLift * 0.33);
  // Reinhard compression
  col = col / (vec3f(1.0) + col * u.tonemapCompression);
  // Gamma
  col = pow(col, vec3f(0.92));

  // ── Final clamp ───────────────────────────────────────────
  return vec4f(clamp(col, vec3f(0.0), vec3f(1.0)), 1.0);
}
