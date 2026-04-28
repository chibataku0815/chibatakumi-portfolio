// ============================================================
// Shared Noise Functions — Procedural Perlin/Simplex
// No texture lookups, pure math.
// ============================================================

// ── Hash functions ──────────────────────────────────────────
fn hash21(p: vec2f) -> f32 {
  var p3 = fract(vec3f(p.x, p.y, p.x) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

fn hash22(p: vec2f) -> vec2f {
  let n = vec3f(dot(p, vec2f(127.1, 311.7)),
                dot(p, vec2f(269.5, 183.3)),
                dot(p, vec2f(419.2, 371.9)));
  return fract(sin(n.xy) * 43758.5453) * 2.0 - 1.0;
}

// ── 2D Perlin Noise ─────────────────────────────────────────
// Returns value in [-1, 1]
fn perlinNoise2D(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);

  // Quintic interpolation (smoother than cubic)
  let u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

  // Gradient vectors at corners
  let g00 = hash22(i + vec2f(0.0, 0.0));
  let g10 = hash22(i + vec2f(1.0, 0.0));
  let g01 = hash22(i + vec2f(0.0, 1.0));
  let g11 = hash22(i + vec2f(1.0, 1.0));

  // Dot products
  let d00 = dot(g00, f - vec2f(0.0, 0.0));
  let d10 = dot(g10, f - vec2f(1.0, 0.0));
  let d01 = dot(g01, f - vec2f(0.0, 1.0));
  let d11 = dot(g11, f - vec2f(1.0, 1.0));

  // Bilinear interpolation
  return mix(mix(d00, d10, u.x), mix(d01, d11, u.x), u.y);
}

// ── Fractal Brownian Motion (2 octaves) ─────────────────────
fn fbm2(p: vec2f) -> f32 {
  var value: f32 = 0.0;
  var amplitude: f32 = 0.5;
  var pp = p;

  value += perlinNoise2D(pp) * amplitude;
  pp *= 2.0;
  amplitude *= 0.5;
  value += perlinNoise2D(pp) * amplitude;

  return value;
}

// ── Curl Noise (divergence-free 2D) ─────────────────────────
// Returns a 2D velocity vector that naturally creates swirling flows.
// Divergence-free = no sources/sinks = fluid-like behavior.
fn curlNoise2D(p: vec2f) -> vec2f {
  let eps = 0.01;
  let n1 = perlinNoise2D(vec2f(p.x, p.y + eps));
  let n2 = perlinNoise2D(vec2f(p.x, p.y - eps));
  let n3 = perlinNoise2D(vec2f(p.x + eps, p.y));
  let n4 = perlinNoise2D(vec2f(p.x - eps, p.y));

  let dndx = (n3 - n4) / (2.0 * eps);
  let dndy = (n1 - n2) / (2.0 * eps);

  // Curl: rotate gradient 90 degrees → divergence-free
  return vec2f(dndy, -dndx);
}
