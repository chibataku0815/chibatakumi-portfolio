// ============================================================
// Metaball SDF Renderer — Fragment shader evaluation
// Reads particle data directly from compute storage buffer.
// Fullscreen triangle (no vertex buffer).
// ============================================================

// ── Params uniform ──────────────────────────────────────────
struct Params {
  resolution: vec2f,     //  0: canvas pixel size
  time:       f32,       //  8: elapsed seconds
  count:      u32,       // 12: active metaball count
  bgColor:    vec4f,     // 16: background RGBA
  threshold:  f32,       // 32: SDF iso-surface threshold
  softness:   f32,       // 36: smoothstep AA width
  _pad:       vec2f,     // 40: alignment padding
}

// ── Particle data (from compute shader storage buffer) ──────
struct Particle {
  pos:      vec2f,   //  0: normalized [0,1] position
  vel:      vec2f,   //  8: velocity (unused in render)
  radius:   f32,     // 16: normalized radius
  phase:    f32,     // 20: per-particle phase offset
  colorIdx: f32,     // 24: 0.0 = dark, 1.0 = white
  life:     f32,     // 28: lifetime
}

@group(0) @binding(0) var<uniform> u: Params;
@group(0) @binding(1) var<storage, read> particles: array<Particle>;

// ── Vertex IO ───────────────────────────────────────────────
struct VOut {
  @builtin(position) pos: vec4f,
  @location(0)       uv:  vec2f,
}

// ── Constants ───────────────────────────────────────────────
const DARK_COLOR = vec3f(0.102, 0.102, 0.102);  // #1A1A1A
const WHITE_COLOR = vec3f(1.0, 1.0, 1.0);

// ── Fullscreen triangle vertex shader ───────────────────────
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

// ── Fragment shader: SDF field evaluation ───────────────────
@fragment
fn fs(in: VOut) -> @location(0) vec4f {
  let fragCoord = in.uv * u.resolution;
  let scale = min(u.resolution.x, u.resolution.y);

  // Accumulate metaball field & weighted color
  var field: f32 = 0.0;
  var weightedColor = vec3f(0.0);

  // Cutoff: skip particles whose influence < 0.005
  // influence = r²/d² ≥ 0.005  →  d ≤ r × ~14
  let CUTOFF_FACTOR = 200.0; // r² * CUTOFF_FACTOR = max distSq to evaluate

  for (var i = 0u; i < u.count; i++) {
    let p = particles[i];

    // Convert normalized pos → pixel coords
    let pixelPos = p.pos * u.resolution;

    // Breathing: subtle size oscillation
    let breathe = sin(u.time * 1.5 + p.phase * 6.28318) * 0.08 + 1.0;
    let pixelRadius = p.radius * scale * breathe;

    let diff = fragCoord - pixelPos;
    let distSq = dot(diff, diff);

    // Distance cutoff: skip if too far to matter
    let rSq = pixelRadius * pixelRadius;
    if (distSq > rSq * CUTOFF_FACTOR) { continue; }

    // Classic metaball: r² / dist²
    let influence = rSq / max(distSq, 0.001);

    // Per-particle color
    let color = mix(DARK_COLOR, WHITE_COLOR, p.colorIdx);

    field += influence;
    weightedColor += color * influence;
  }

  // Normalize color by total field
  let surfaceColor = weightedColor / max(field, 0.001);

  // Anti-aliased threshold (iso-surface)
  let alpha = smoothstep(
    u.threshold - u.softness,
    u.threshold + u.softness,
    field
  );

  // Rim light effect: pseudo-depth from field strength
  let fieldNorm = clamp((field - u.threshold) / (u.threshold * 2.0), 0.0, 1.0);
  let rimGlow = (1.0 - smoothstep(0.0, 0.7, 1.0 - fieldNorm)) * 0.15;
  let edgeDark = smoothstep(0.0, 0.3, 1.0 - fieldNorm) * 0.25;
  let litColor = surfaceColor * (1.0 + rimGlow) * (1.0 - edgeDark);

  // Composite over background
  let result = mix(u.bgColor.rgb, litColor, alpha);

  return vec4f(result, 1.0);
}
