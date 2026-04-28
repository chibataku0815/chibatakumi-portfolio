// ============================================================
// motion-flowline-webgpu — Phase 7 compute shader
// Agent update + curl-noise advection + ring-buffer trail write
//
// Plan:     .claude/tasks/active/2026-04-18-motion-flowline-webgpu-phase7-plan.md §2, §3 Stream 1
// Handoff:  docs/guides/2026-04-18-motion-flowline-webgpu-phase7-onward-complete-handoff.md §10.1
// Noise:    ported inline from output/motion-dot-new-webgpu/src/shaders/noise.wgsl
// ============================================================
//
// ── Struct layouts (Integration Contract §2) ───────────────────
//
// Agent — 48 B, 16-byte aligned
//   offset  size  field      WGSL type
//   ------  ----  ---------  ---------
//       0     8   pos        vec2f
//       8     8   vel        vec2f
//      16     4   age        f32
//      20     4   maxAge     f32
//      24     4   headIdx    u32
//      28     4   flags      u32     (bit 0 = justSpawned)
//      32     4   colorMix   f32
//      36     4   phase      f32
//      40     8   _pad       vec2f
//   total: 48 B  (stride = 12 × f32 in TS view)
//
// TrailVertex — 16 B
//   offset  size  field      WGSL type
//   ------  ----  ---------  ---------
//       0     8   pos        vec2f
//       8     4   speed      f32
//      12     4   curvature  f32
//
// FlowlineParams — 128 B uniform (32 × f32) (Phase 14: +shape attractor slots)
//   offset  size  field              WGSL type
//   ------  ----  -----------------  ---------
//       0     4   time               f32
//       4     4   dt                 f32
//       8     4   flowForce          f32
//      12     4   noiseScale         f32
//      16     4   noiseSpeed         f32
//      20     4   drag               f32
//      24     4   nTrail             u32
//      28     4   seed               u32
//      32     4   attractorX         f32
//      36     4   attractorY         f32
//      40     4   attractorStrength  f32
//      44     4   vorticity          f32
//      48     4   breathStrength     f32   (audio: bass → per-frame velocity breath)
//      52     4   vorticityPulse     f32   (audio: bassOnset → transient vorticity kick)
//      56     4   rimPulse           f32   (audio: trebleOnset — consumed by ribbon shader)
//      60     4   _pad0              f32
//      64     4   glyphCenterX       f32   (Phase 11: glyph centre in unit-square coords)
//      68     4   glyphCenterY       f32
//      72     4   glyphWidth         f32   (world extent of SDF texture along X)
//      76     4   glyphHeight        f32
//      80     4   combStrength       f32   (Phase 11: Comb/Flow weight, 0 for non-Comb scenes)
//      84     4   sdfEdgeSoft        f32   (smoothstep band, world units)
//      88     8   _pad1              vec2f
//      96     4   shapeR             f32   (Phase 14: parametric shape outer radius)
//     100     4   shapeSmall         f32   (inner rolling-circle radius)
//     104     4   shapeD             f32   (pen offset, petal depth)
//     108     4   phaseSpeed         f32   (angular scrub rad/s)
//     112     4   shapeStrength      f32   (spring coefficient, 0 = zero-cost early-out)
//     116     4   shapeMode          f32   (1=hypotrochoid; 2/3 reserved for extension)
//     120     8   _pad2              vec2f
//
// Bind group @group(0) (update kernel):
//   binding 0 = agents    (storage read_write)
//   binding 1 = trails    (storage read_write, GPU-side only after init)
//   binding 2 = params    (uniform)
//   binding 3 = sdfTex    (texture_2d<f32>, Phase 11 — r32float signed distance)
//   binding 4 = sdfSamp   (sampler, linear + clamp)
//
// Bind group @group(0) (reseed_trails kernel, Phase 9):
//   binding 0 = agents   (storage read_write)
//
// Ring buffer:
//   headIdx' = (headIdx + 1u) & (N_TRAIL - 1u)   // N_TRAIL is power-of-2
// ============================================================

override N_TRAIL: u32 = 64u;

struct Agent {
  pos:      vec2f,
  vel:      vec2f,
  age:      f32,
  maxAge:   f32,
  headIdx:  u32,
  flags:    u32,
  colorMix: f32,
  phase:    f32,
  _pad:     vec2f,
};

struct TrailVertex {
  pos:       vec2f,
  speed:     f32,
  curvature: f32,
};

struct FlowlineParams {
  time:              f32,
  dt:                f32,
  flowForce:         f32,
  noiseScale:        f32,
  noiseSpeed:        f32,
  drag:              f32,
  nTrail:            u32,
  seed:              u32,
  attractorX:        f32,
  attractorY:        f32,
  attractorStrength: f32,
  vorticity:         f32,
  breathStrength:    f32,
  vorticityPulse:    f32,
  rimPulse:          f32,
  _pad0:             f32,
  glyphCenterX:      f32,
  glyphCenterY:      f32,
  glyphWidth:        f32,
  glyphHeight:       f32,
  combStrength:      f32,
  sdfEdgeSoft:       f32,
  _pad1:             vec2f,
  shapeR:            f32,
  shapeSmall:        f32,
  shapeD:            f32,
  phaseSpeed:        f32,
  shapeStrength:     f32,
  shapeMode:         f32,
  _pad2:             vec2f,
};

@group(0) @binding(0) var<storage, read_write> agents: array<Agent>;
@group(0) @binding(1) var<storage, read_write> trails: array<TrailVertex>;
@group(0) @binding(2) var<uniform>             params: FlowlineParams;
@group(0) @binding(3) var                      sdfTex: texture_2d<f32>;
@group(0) @binding(4) var                      sdfSamp: sampler;

// ── Noise (ported from motion-dot-new-webgpu/src/shaders/noise.wgsl) ──

fn hash22f(p: vec2f) -> vec2f {
  let n = vec3f(dot(p, vec2f(127.1, 311.7)),
                dot(p, vec2f(269.5, 183.3)),
                dot(p, vec2f(419.2, 371.9)));
  return fract(sin(n.xy) * 43758.5453) * 2.0 - 1.0;
}

fn perlinNoise2D(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

  let g00 = hash22f(i + vec2f(0.0, 0.0));
  let g10 = hash22f(i + vec2f(1.0, 0.0));
  let g01 = hash22f(i + vec2f(0.0, 1.0));
  let g11 = hash22f(i + vec2f(1.0, 1.0));

  let d00 = dot(g00, f - vec2f(0.0, 0.0));
  let d10 = dot(g10, f - vec2f(1.0, 0.0));
  let d01 = dot(g01, f - vec2f(0.0, 1.0));
  let d11 = dot(g11, f - vec2f(1.0, 1.0));

  return mix(mix(d00, d10, u.x), mix(d01, d11, u.x), u.y);
}

fn curlNoise2D(p: vec2f) -> vec2f {
  let eps = 0.01;
  let n1 = perlinNoise2D(vec2f(p.x, p.y + eps));
  let n2 = perlinNoise2D(vec2f(p.x, p.y - eps));
  let n3 = perlinNoise2D(vec2f(p.x + eps, p.y));
  let n4 = perlinNoise2D(vec2f(p.x - eps, p.y));

  let dndx = (n3 - n4) / (2.0 * eps);
  let dndy = (n1 - n2) / (2.0 * eps);

  return vec2f(dndy, -dndx);
}

// ── Deterministic per-agent hash for respawn ──
// seed ⊕ gid ⊕ u32(time*1000) → two f32 in [0,1)
fn hash22(p: vec2u) -> vec2f {
  var x = p.x * 1597334677u + p.y * 3812015801u;
  x ^= x >> 16u;
  x = x * 2654435769u;
  x ^= x >> 16u;
  x = x * 2246822519u;
  x ^= x >> 16u;
  let lo = x & 0xffffu;
  let hi = (x >> 16u) & 0xffffu;
  return vec2f(f32(lo), f32(hi)) / 65535.0;
}

// ── Compute entry ──
@compute @workgroup_size(64)
fn update(@builtin(global_invocation_id) gid: vec3u) {
  let idx = gid.x;
  if (idx >= arrayLength(&agents)) {
    return;
  }

  // 1. read agent
  var agent = agents[idx];
  let oldVel = agent.vel;

  // 2. curl-noise force (Phase 10 tune: bass breath can ~2.5× flowForce at max)
  let sample = agent.pos * params.noiseScale + vec2f(params.time * params.noiseSpeed);
  let curl = curlNoise2D(sample);
  let audioFlow = params.flowForce * (1.0 + params.breathStrength * 1.5);
  let curlForce = curl * audioFlow;

  // 2a. Phase 11 — Comb/Flow SDF blend. When combStrength > 0 and the agent
  // is within the glyph's world-space band, swap curl for a tangent-to-
  // iso-contour field so ribbons flow ALONG the glyph edge. sdfWeight falls
  // smoothly to 0 outside the edge band, so Laminar/Turbulent/Attractor
  // scenes (combStrength = 0) take the zero-cost early-out.
  var blendedForce = curlForce;
  if (params.combStrength > 0.0 && params.glyphWidth > 0.0 && params.glyphHeight > 0.0) {
    let uv = vec2f(
      (agent.pos.x - params.glyphCenterX) / params.glyphWidth + 0.5,
      (agent.pos.y - params.glyphCenterY) / params.glyphHeight + 0.5,
    );
    let inBounds =
      uv.x > 0.0 && uv.x < 1.0 &&
      uv.y > 0.0 && uv.y < 1.0;
    if (inBounds) {
      // Central-difference gradient in UV space. eps is small enough to
      // resolve individual stroke edges at 1024 × 256 but large enough to
      // avoid single-texel quantization noise.
      let eps = vec2f(0.0015, 0.006);
      let sdfC = textureSampleLevel(sdfTex, sdfSamp, uv, 0.0).r;
      let sdfR = textureSampleLevel(sdfTex, sdfSamp, uv + vec2f(eps.x, 0.0), 0.0).r;
      let sdfL = textureSampleLevel(sdfTex, sdfSamp, uv - vec2f(eps.x, 0.0), 0.0).r;
      let sdfU = textureSampleLevel(sdfTex, sdfSamp, uv + vec2f(0.0, eps.y), 0.0).r;
      let sdfD = textureSampleLevel(sdfTex, sdfSamp, uv - vec2f(0.0, eps.y), 0.0).r;
      let gradX = (sdfR - sdfL) / (2.0 * eps.x);
      let gradY = (sdfU - sdfD) / (2.0 * eps.y);
      let gradLen = sqrt(gradX * gradX + gradY * gradY) + 1e-6;
      // Tangent to the SDF iso-contour (perpendicular to gradient). Agents
      // on opposite sides of a glyph stroke circulate in opposite directions
      // because gradient sign flips — producing the "combing" read rather
      // than a uniform flow round a single boundary.
      let tangent = vec2f(-gradY, gradX) / gradLen;
      // Distance-weighted magnitude — strongest on the edge, fading out.
      let sdfWeight =
        smoothstep(params.sdfEdgeSoft, 0.0, abs(sdfC)) * params.combStrength;
      let combForce = tangent * length(curlForce) * 1.4;
      blendedForce = mix(curlForce, combForce, sdfWeight);
    }
  }

  // 2c. Phase 14 — Shape attractor. shapeStrength == 0 short-circuits (zero
  // cost for organic scenes). When active, spring REPLACES curl entirely so
  // the curve reads as the primary gesture; residual curl ripples come from
  // each agent's slightly different theta phase and the integrator overshoot.
  //   shapeMode 1 = hypotrochoid, 2 = epitrochoid, 3 = lissajous
  var shapedForce = blendedForce;
  if (params.shapeStrength > 0.0) {
    let theta = agent.phase + params.time * params.phaseSpeed;
    let R     = params.shapeR;
    let rIn   = params.shapeSmall;
    let dPen  = params.shapeD;
    let kHypo = (R - rIn) / max(rIn, 1e-5);
    let kEpi  = (R + rIn) / max(rIn, 1e-5);

    let hypoX = (R - rIn) * cos(theta) + dPen * cos(kHypo * theta);
    let hypoY = (R - rIn) * sin(theta) - dPen * sin(kHypo * theta);
    let epiX  = (R + rIn) * cos(theta) - dPen * cos(kEpi  * theta);
    let epiY  = (R + rIn) * sin(theta) - dPen * sin(kEpi  * theta);
    let lissX = R   * sin(dPen * theta + 1.5707963);
    let lissY = rIn * sin(theta);

    let isHypo = params.shapeMode < 1.5;
    let isEpi  = params.shapeMode >= 1.5 && params.shapeMode < 2.5;

    let tx = select(select(lissX, epiX, isEpi), hypoX, isHypo);
    let ty = select(select(lissY, epiY, isEpi), hypoY, isHypo);

    let aim    = vec2f(0.5 + tx, 0.5 + ty);
    let spring = (aim - agent.pos) * params.shapeStrength;
    shapedForce = spring;
  }

  agent.vel = agent.vel + shapedForce * params.dt;

  // 2b. attractor pull + tangential vorticity (Phase 9). Phase 10 tune: bassOnset
  // now kicks effVorticity by ~3× pulse so a kick on Turbulent (vorticity=0)
  // still produces a visible swirl, AttractorKnot sees dramatic tightening.
  let effVorticity = params.vorticity + params.vorticityPulse * 3.0;
  if (params.attractorStrength > 0.0 || effVorticity != 0.0) {
    let toAttr = vec2f(params.attractorX, params.attractorY) - agent.pos;
    let d2     = dot(toAttr, toAttr);
    let invLen = inverseSqrt(max(d2, 1e-5));
    let dir    = toAttr * invLen;
    let pull   = dir * params.attractorStrength * params.dt;
    let tan    = vec2f(-dir.y, dir.x) * effVorticity * params.dt;
    agent.vel  = agent.vel + pull + tan;
  }

  // 3. drag
  agent.vel = agent.vel * params.drag;

  // 4. integrate position
  agent.pos = agent.pos + agent.vel * params.dt;

  // curvature estimate: angular change of velocity (cheap)
  let eps = 1e-6;
  let n0 = length(oldVel);
  let n1 = length(agent.vel);
  var curvature = 0.0;
  if (n0 > eps && n1 > eps) {
    curvature = 1.0 - dot(oldVel / n0, agent.vel / n1);
  }

  // 5. write trail vertex at current head
  let writeIdx = idx * N_TRAIL + agent.headIdx;
  var vert: TrailVertex;
  vert.pos = agent.pos;
  vert.speed = length(agent.vel);
  vert.curvature = curvature;
  trails[writeIdx] = vert;

  // 6. advance ring head (power-of-2 bitwise)
  agent.headIdx = (agent.headIdx + 1u) & (N_TRAIL - 1u);

  // 7. age
  agent.age = agent.age + params.dt;

  // 8. respawn check
  let outOfBounds = agent.pos.x < 0.0 || agent.pos.x > 1.0 ||
                    agent.pos.y < 0.0 || agent.pos.y > 1.0;
  if (agent.age > agent.maxAge || outOfBounds) {
    let tbucket = u32(params.time * 1000.0);
    let r = hash22(vec2u(params.seed ^ idx, tbucket ^ (idx * 2654435761u)));
    agent.pos = r;
    agent.vel = vec2f(0.0, 0.0);
    agent.age = 0.0;
    agent.flags = agent.flags | 1u;   // set justSpawned
  } else {
    agent.flags = agent.flags & ~1u;  // clear justSpawned on subsequent frames
  }

  // write back
  agents[idx] = agent;
}

// ── Phase 9 reseed kernel ──
// One-shot pass invoked on scene transition. Sets `flags |= 1` (justSpawned
// bit) and zeroes `age` on every agent, which forces the ribbon shader to
// hide the stale trail window (validCount = age * 45 rounds to 0) while the
// ring buffer refills at the target scene's noise frequency. Preserves
// pos/vel/maxAge/colorMix/phase so spatial distribution carries across.
@compute @workgroup_size(64)
fn reseed_trails(@builtin(global_invocation_id) gid: vec3u) {
  let idx = gid.x;
  if (idx >= arrayLength(&agents)) {
    return;
  }
  var agent = agents[idx];
  agent.flags = agent.flags | 1u;
  agent.age = 0.0;
  agents[idx] = agent;
}
