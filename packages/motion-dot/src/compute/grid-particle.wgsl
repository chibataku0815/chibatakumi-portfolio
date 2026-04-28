// ============================================================
// Grid-Fluid Particle Compute Shader
// Particles anchored to grid positions with fluid displacement.
// Spring force pulls toward home; curl noise displaces organically.
// ============================================================

// ── Noise (inlined) ─────────────────────────────────────────
fn hash22(p: vec2f) -> vec2f {
  let n = vec3f(dot(p, vec2f(127.1, 311.7)),
                dot(p, vec2f(269.5, 183.3)),
                dot(p, vec2f(419.2, 371.9)));
  let s = sin(n.xy) * 43758.5453;
  return vec2f(s.x - floor(s.x), s.y - floor(s.y)) * 2.0 - 1.0;
}

fn perlinNoise2D(p: vec2f) -> f32 {
  let i = floor(p);
  let f = p - i;
  let u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

  let g00 = hash22(i);
  let g10 = hash22(i + vec2f(1.0, 0.0));
  let g01 = hash22(i + vec2f(0.0, 1.0));
  let g11 = hash22(i + vec2f(1.0, 1.0));

  let d00 = dot(g00, f);
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
  return vec2f((n1 - n2) / (2.0 * eps), -(n3 - n4) / (2.0 * eps));
}

// ── Data ────────────────────────────────────────────────────
struct Particle {
  pos:      vec2f,
  vel:      vec2f,
  radius:   f32,
  phase:    f32,
  colorIdx: f32,
  life:     f32,
}

struct Params {
  time:         f32,   //  0
  dt:           f32,   //  4
  count:        u32,   //  8
  noiseScale:   f32,   // 12: spatial frequency
  noiseSpeed:   f32,   // 16: temporal evolution
  flowForce:    f32,   // 20: curl noise strength
  springForce:  f32,   // 24: pull toward grid home
  drag:         f32,   // 28: velocity damping
}

@group(0) @binding(0) var<uniform> u: Params;
@group(0) @binding(1) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(2) var<storage, read> homes: array<vec2f>;

// ── Compute ─────────────────────────────────────────────────
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= u.count) { return; }

  var p = particles[id.x];
  let home = homes[id.x];

  // Curl noise displacement
  let noiseCoord = p.pos * u.noiseScale + u.time * u.noiseSpeed;
  let offsetCoord = noiseCoord + vec2f(p.phase * 3.7, p.phase * 2.3);
  let flow = curlNoise2D(offsetCoord);

  // Flow force (organic displacement)
  let forceScale = u.flowForce * (0.7 + p.phase * 0.6);
  p.vel += flow * forceScale * u.dt;

  // Spring force toward grid home (restoring force)
  let toHome = home - p.pos;
  let dist = length(toHome);
  // Stronger spring when far from home, gentle when close
  let springStrength = u.springForce * (1.0 + dist * 8.0);
  p.vel += toHome * springStrength * u.dt;

  // Drag
  p.vel *= u.drag;

  // Integrate
  p.pos += p.vel * u.dt;

  particles[id.x] = p;
}
