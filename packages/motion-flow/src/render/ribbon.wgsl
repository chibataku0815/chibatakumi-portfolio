// ============================================================
// motion-flowline-webgpu — Phase 8 ribbon render shader
// Vertex-expanded triangle-strip ribbons from GPU-resident trails
//
// Plan:     .claude/tasks/active/2026-04-18-motion-flowline-webgpu-phase8-plan.md §2 Stream A
// Handoff:  docs/guides/2026-04-18-motion-flowline-webgpu-phase8-onward-complete-handoff.md §9
// Pattern:  output/motion-dot-new-webgpu/src/render/metaball.wgsl (fullscreen vertex idiom)
// Palette:  PALETTE_INK / PALETTE_PAPER are prepended by webgpu-motion-art's PALETTE_WGSL.
// ============================================================
//
// ── Struct layouts (Integration Contract §2, mirrors flowline-update.wgsl) ──
//
// Agent — 48 B, 16-byte aligned
//   offset  size  field      WGSL type
//   ------  ----  ---------  ---------
//       0     8   pos        vec2f
//       8     8   vel        vec2f
//      16     4   age        f32
//      20     4   maxAge     f32
//      24     4   headIdx    u32     (next-write slot)
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
// RibbonParams — 48 B uniform (12 × f32) (Phase 10: +rimPulse + _pad[3])
//   idx  field            WGSL type
//   ---  ---------------  ---------
//     0  maxWidth         f32
//     1  minWidth         f32
//     2  widthSpeedK      f32
//     3  curvatureK       f32
//     4  widthScale       f32
//     5  alphaScale       f32
//     6  viewportAspect   f32
//     7  rimPulse         f32   (audio: trebleOnset → tip rim highlight)
//     8..11  _pad         f32[4]
//
// Bind group @group(0):
//   binding 0 = agents        (storage read)
//   binding 1 = trails        (storage read)
//   binding 2 = ribbonParams  (uniform)
//
// Draw:
//   vertexCount   = 2 * N_TRAIL (= 128)
//   instanceCount = nAgents
//   topology      = triangle-strip, cullMode = none
//   blend         = premultiplied alpha over, target = rgba16float
//
// Ring buffer:
//   newest sample lives at ((headIdx - 1) & (N_TRAIL - 1))
//   segmentIdx = 0 → newest, segmentIdx = N_TRAIL - 1 → oldest
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

struct RibbonParams {
  maxWidth:       f32,
  minWidth:       f32,
  widthSpeedK:    f32,
  curvatureK:     f32,
  widthScale:     f32,
  alphaScale:     f32,
  viewportAspect: f32,
  rimPulse:       f32,
  _pad:           vec4f,
};

@group(0) @binding(0) var<storage, read> agents:       array<Agent>;
@group(0) @binding(1) var<storage, read> trails:       array<TrailVertex>;
@group(0) @binding(2) var<uniform>       ribbonParams: RibbonParams;

struct VertexOutput {
  @builtin(position) pos:   vec4f,
  @location(0)       color: vec4f,   // premultiplied RGBA
};

// ── Vertex: expand each trail sample into two ribbon edge vertices ──
@vertex
fn vs(
  @builtin(vertex_index)   vid: u32,
  @builtin(instance_index) iid: u32,
) -> VertexOutput {
  let segmentIdx = vid / 2u;                          // 0..N_TRAIL-1
  let sideSign   = f32(vid & 1u) * 2.0 - 1.0;         // -1 or +1
  let agentIdx   = iid;

  let agent = agents[agentIdx];
  let head  = agent.headIdx;  // next-write position

  // Ring-buffer index: newest at segmentIdx=0, oldest at segmentIdx=N_TRAIL-1
  let sampleIdx = (head + N_TRAIL - 1u - segmentIdx) & (N_TRAIL - 1u);
  let vert      = trails[agentIdx * N_TRAIL + sampleIdx];

  // Tangent direction (oldest -> newest along curve)
  var tangent: vec2f;
  if (segmentIdx == 0u) {
    // Forward diff at newest end: use sample one step older
    let older = trails[agentIdx * N_TRAIL + ((head + N_TRAIL - 2u) & (N_TRAIL - 1u))];
    tangent = vert.pos - older.pos;
  } else if (segmentIdx == N_TRAIL - 1u) {
    // Backward diff at oldest end: use sample one step newer
    let newer = trails[agentIdx * N_TRAIL + ((head + N_TRAIL - segmentIdx) & (N_TRAIL - 1u))];
    tangent = newer.pos - vert.pos;
  } else {
    // Central diff: newer neighbor minus older neighbor
    let newer = trails[agentIdx * N_TRAIL + ((head + N_TRAIL - segmentIdx) & (N_TRAIL - 1u))];
    let older = trails[agentIdx * N_TRAIL + ((head + N_TRAIL - 2u - segmentIdx) & (N_TRAIL - 1u))];
    tangent = newer.pos - older.pos;
  }

  let tlen = length(tangent);
  var t: vec2f;
  if (tlen > 1e-5) {
    t = tangent / tlen;
  } else {
    t = vec2f(1.0, 0.0);
  }

  // Perpendicular normal, aspect-corrected in screen space
  var normal = vec2f(-t.y, t.x);
  let normalAspect = vec2f(normal.x, normal.y * ribbonParams.viewportAspect);
  let normalLen    = length(normalAspect);
  if (normalLen > 1e-6) {
    normal = normalAspect / normalLen;
  }

  let ageNorm = clamp(agent.age / max(agent.maxAge, 1e-3), 0.0, 1.0);

  // Phase 10 tune: rim highlight reaches ~14 samples from tip (was 8) so the
  // pulse reads at a glance. Width & alpha multipliers also raised — earlier
  // values were invisible at 4000-agent density.
  let tipDist  = f32(segmentIdx);
  let rimMask  = exp(-tipDist * tipDist / 48.0);
  let rimBoost = ribbonParams.rimPulse * rimMask;

  let halfWidth = mix(ribbonParams.maxWidth, ribbonParams.minWidth, ageNorm)
                * ribbonParams.widthScale
                * (0.5 + vert.speed * ribbonParams.widthSpeedK)
                * pow(1.0 - ageNorm, 0.75)
                * (1.0 + rimBoost * 2.0);

  let pos01 = vert.pos + normal * (sideSign * halfWidth);
  // [0,1] -> NDC, flip y
  let pos_ndc = vec2f(pos01.x * 2.0 - 1.0, 1.0 - pos01.y * 2.0);

  // Alpha: fade with age, damp on sharp curves, gate young trails
  let validCount  = u32(clamp(agent.age * 45.0, 0.0, f32(N_TRAIL - 1u)));
  let justSpawned = (agent.flags & 1u) != 0u;
  let ageAlpha    = 1.0 - ageNorm;
  let curvAlpha   = 1.0 - clamp(vert.curvature * ribbonParams.curvatureK, 0.0, 0.7);
  var alpha       = ribbonParams.alphaScale * ageAlpha * curvAlpha;
  alpha           = alpha * (1.0 + rimBoost * 1.4);
  alpha           = clamp(alpha, 0.0, 1.0);
  if (justSpawned || segmentIdx > validCount) {
    alpha = 0.0;
  }

  // Rim pushes tip color strongly toward PALETTE_SPARK for a clear flash.
  var color = mix(PALETTE_INK, PALETTE_PAPER, agent.colorMix);
  color = mix(color, PALETTE_SPARK, clamp(rimBoost * 1.1, 0.0, 0.85));

  var out: VertexOutput;
  out.pos   = vec4f(pos_ndc, 0.0, 1.0);
  out.color = vec4f(color * alpha, alpha);   // PREMULTIPLIED
  return out;
}

// ── Fragment: pass through premultiplied color ──
@fragment
fn fs(in: VertexOutput) -> @location(0) vec4f {
  return in.color;
}
