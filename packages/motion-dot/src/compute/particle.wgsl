// ============================================================
// Particle Compute Shader — Perlin Flow Field + Physics
// Updates particle positions/velocities in-place via Storage Buffer.
// ============================================================

// ── Noise functions (inlined to avoid import issues) ────────
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

  let g00 = hash22(i + vec2f(0.0, 0.0));
  let g10 = hash22(i + vec2f(1.0, 0.0));
  let g01 = hash22(i + vec2f(0.0, 1.0));
  let g11 = hash22(i + vec2f(1.0, 1.0));

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

// ── Particle data ───────────────────────────────────────────
struct Particle {
  pos:      vec2f,   //  0: position in normalized [0,1] coords
  vel:      vec2f,   //  8: velocity
  radius:   f32,     // 16: base radius
  phase:    f32,     // 20: per-particle phase offset (for variety)
  colorIdx: f32,     // 24: 0.0 = dark, 1.0 = white
  life:     f32,     // 28: lifetime factor [0,1]
}

struct Params {
  time:       f32,   //  0
  dt:         f32,   //  4
  count:      u32,   //  8
  noiseScale: f32,   // 12: spatial frequency of flow field
  noiseSpeed: f32,   // 16: temporal evolution speed
  flowForce:  f32,   // 20: curl noise force multiplier
  drag:       f32,   // 24: velocity damping (0.95-0.99)
  attractorEnabled: f32, // 28
  attractorX:     f32,   // 32
  attractorY:     f32,   // 36
  attractorBlend: f32,   // 40
  _pad:           f32,   // 44
}

@group(0) @binding(0) var<uniform> u: Params;
@group(0) @binding(1) var<storage, read_write> particles: array<Particle>;

// ── Compute shader ──────────────────────────────────────────
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= u.count) { return; }

  var p = particles[id.x];

  // Curl noise coordinates: position in noise space + time evolution
  let noiseCoord = p.pos * u.noiseScale + u.time * u.noiseSpeed;

  // Add per-particle phase offset for variety
  let offsetCoord = noiseCoord + vec2f(p.phase * 3.7, p.phase * 2.3);

  // Curl noise → divergence-free flow (no sources/sinks)
  let flow = curlNoise2D(offsetCoord);

  // Apply flow force with per-particle variation
  let forceScale = u.flowForce * (0.7 + p.phase * 0.6);
  p.vel += flow * forceScale * u.dt;

  // Gentle attraction toward center (prevents drift to edges)
  let toCenter = vec2f(0.5, 0.5) - p.pos;
  let centerDist = length(toCenter);
  let centerForce = toCenter * centerDist * 0.3 * u.dt;
  p.vel += centerForce;

  // Local handoff attractor: keep scene physics alive while converging.
  if (u.attractorEnabled > 0.0) {
    let toAttractor = vec2f(u.attractorX, u.attractorY) - p.pos;
    let attractorLen = max(length(toAttractor), 1e-5);
    let attractorDir = toAttractor / attractorLen;
    let attractorPull = u.attractorBlend * (0.16 + u.attractorBlend * 0.36);
    let softSpring = u.attractorBlend * u.attractorBlend * 0.04;
    p.vel += attractorDir * attractorPull * u.dt;
    p.vel += toAttractor * softSpring * u.dt;
  }

  // Drag (energy dissipation)
  p.vel *= u.drag;

  // Integrate position
  p.pos += p.vel * u.dt;

  // Soft boundary: reflect with damping
  if (p.pos.x < -0.1) { p.pos.x = -0.1; p.vel.x = abs(p.vel.x) * 0.5; }
  if (p.pos.x >  1.1) { p.pos.x =  1.1; p.vel.x = -abs(p.vel.x) * 0.5; }
  if (p.pos.y < -0.1) { p.pos.y = -0.1; p.vel.y = abs(p.vel.y) * 0.5; }
  if (p.pos.y >  1.1) { p.pos.y =  1.1; p.vel.y = -abs(p.vel.y) * 0.5; }

  // Note: radius breathing is handled on the CPU/render side
  // to avoid compounding each frame. Compute only updates pos/vel.

  particles[id.x] = p;
}
