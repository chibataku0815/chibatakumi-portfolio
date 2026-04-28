// prism-caustic.wgsl — Chromatic dispersion along curved caustic lines
// Model: curved line in warped UV → perpendicular distance → spectral bands

struct Uniforms {
  resolution:   vec2f,  //  0
  time:         f32,    //  8
  speed:        f32,    // 12
  warpStrength: f32,    // 16
  warpScale:    f32,    // 20
  bandWidth:    f32,    // 24  (width of spectral spread)
  brightness:   f32,    // 28
};
// 32 bytes

@group(0) @binding(0) var<uniform> u: Uniforms;

// ── Noise ─────────────────────────────────────────────────────

fn hash21(p: vec2f) -> f32 {
  let q = fract(p * vec2f(123.34, 456.21));
  let d = dot(q, q + 45.32);
  return fract(q.x * q.y + d);
}

fn noise2(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let w = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2f(1.0, 0.0)), w.x),
    mix(hash21(i + vec2f(0.0, 1.0)), hash21(i + vec2f(1.0, 1.0)), w.x),
    w.y
  );
}

fn fbm(p: vec2f, oct: i32) -> f32 {
  var v = 0.0; var a = 0.5; var freq = 1.0; var pos = p;
  for (var i = 0; i < oct; i++) {
    v += noise2(pos * freq) * a;
    freq *= 2.03; a *= 0.5; pos += vec2f(1.7, 9.2);
  }
  return v;
}

// ── Spectrum ──────────────────────────────────────────────────
// Sharp, saturated bands with dark gaps between them

fn spectrum(t: f32) -> vec3f {
  let tt = clamp(t, 0.0, 1.0);

  // Each channel is a narrow bump → distinct color bands with gaps
  let r = exp(-pow((tt - 0.1) / 0.08, 2.0))
        + exp(-pow((tt - 0.92) / 0.06, 2.0)) * 0.3;  // red + violet edge
  let orange = exp(-pow((tt - 0.22) / 0.06, 2.0));
  let yellow = exp(-pow((tt - 0.33) / 0.05, 2.0));
  let g = exp(-pow((tt - 0.45) / 0.07, 2.0));
  let cyan = exp(-pow((tt - 0.55) / 0.05, 2.0));
  let b = exp(-pow((tt - 0.68) / 0.08, 2.0));
  let violet = exp(-pow((tt - 0.82) / 0.07, 2.0));

  return vec3f(
    r + orange * 0.9 + yellow * 0.9,
    orange * 0.5 + yellow * 0.9 + g + cyan * 0.7,
    cyan * 0.5 + b + violet * 0.8
  );
}

// ── UV warp (fabric undulation) ───────────────────────────────

fn warpUV(p: vec2f, t: f32) -> vec2f {
  let s = u.warpStrength;
  let sc = u.warpScale;

  var dx = sin(p.y * sc * 0.8 + t * 0.4) * 0.25
         + sin(p.x * sc * 0.5 - t * 0.3) * 0.15
         + fbm(p * sc * 0.35 + vec2f(t * 0.12, 0.0), 3) * 0.6;

  var dy = cos(p.x * sc * 0.7 + t * 0.35) * 0.2
         + sin(p.y * sc * 0.6 + t * 0.25) * 0.15
         + fbm(p * sc * 0.35 + vec2f(0.0, t * 0.1), 3) * 0.5;

  return p + vec2f(dx, dy) * s;
}

// ── Distance from a caustic line ──────────────────────────────
// Each "line" is defined by a parametric curve; we find closest distance

fn causticDist(p: vec2f, lineY: f32, curvature: f32, t: f32) -> f32 {
  // The line is roughly horizontal at y=lineY, with curvature bending it
  // In warped space, this creates a sweeping arc
  let curveOffset = curvature * (p.x * p.x) + sin(p.x * 2.0 + t * 0.5) * 0.03;
  return p.y - lineY - curveOffset;
}

// ── Vertex ────────────────────────────────────────────────────

@vertex
fn vsMain(@builtin(vertex_index) vid: u32) -> @builtin(position) vec4f {
  var pos = array<vec2f, 3>(
    vec2f(-1.0, -3.0), vec2f(-1.0, 1.0), vec2f(3.0, 1.0)
  );
  return vec4f(pos[vid], 0.0, 1.0);
}

// ── Fragment ──────────────────────────────────────────────────

@fragment
fn fsMain(@builtin(position) fragCoord: vec4f) -> @location(0) vec4f {
  let uv = fragCoord.xy / u.resolution;
  let aspect = u.resolution.x / u.resolution.y;
  let p = vec2f((uv.x - 0.5) * aspect, uv.y - 0.5);
  let t = u.time * u.speed;

  // Warp UV — this creates the carpet-like undulation
  let wp = warpUV(p, t);

  var color = vec3f(0.0);
  let bw = u.bandWidth;

  // 2-3 caustic lines at different Y positions
  for (var i = 0; i < 3; i++) {
    let fi = f32(i);
    let lineY = -0.15 + fi * 0.12 + sin(t * 0.2 + fi * 2.0) * 0.05;
    let curvature = 0.3 + fi * 0.15;

    // Signed distance from the caustic line (in warped space)
    let sd = causticDist(wp, lineY, curvature, t + fi * 1.3);

    // Map signed distance → spectral position
    // Positive side = red→orange→yellow, negative side = green→blue→violet
    let spectralPos = clamp(sd / bw + 0.5, 0.0, 1.0);

    // Intensity: strongest near the line, falls off sharply
    let intensity = exp(-sd * sd / (bw * bw * 0.5));

    // White core right on the line
    let core = exp(-sd * sd / (bw * bw * 0.02));

    // Spectral color for this distance
    let bandColor = spectrum(spectralPos);

    color += bandColor * intensity * u.brightness * (0.5 + fi * 0.1);
    color += vec3f(0.95, 0.92, 0.88) * core * u.brightness * 0.8;
  }

  // Ensure deep blacks where there's no light
  // (no ambient, no fill light — pure black background)

  // Very subtle grain
  let grain = (hash21(floor(fragCoord.xy * 0.9 + vec2f(t * 40.0, t * 17.0))) - 0.5) * 0.01;
  color += grain;

  return vec4f(max(color, vec3f(0.0)), 1.0);
}
