// aurora.wgsl — iOS aurora gradient wallpaper reproduction
// 2-layer composition: vertical color ramp × egg-shaped luminous body
// All color mixing in Oklab; triangular dither for anti-banding

struct AuroraUniforms {
  resolution:    vec2f,   //  0..7
  time:          f32,     //  8..11
  animSpeed:     f32,     // 12..15
  horizonY:      f32,     // 16..19
  warmth:        f32,     // 20..23
  coolness:      f32,     // 24..27
  envelopeWidth: f32,     // 28..31
  glowIntensity: f32,     // 32..35
  brightness:    f32,     // 36..39
  ditherSeed:    f32,     // 40..43
  _pad:          f32,     // 44..47
};

@group(0) @binding(0) var<uniform> u: AuroraUniforms;

// ── Oklab conversions ─────────────────────────────────────────

fn linearSrgbToOklab(c: vec3f) -> vec3f {
  let l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
  let m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
  let s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;
  let l_ = pow(max(l, 0.0), 1.0 / 3.0);
  let m_ = pow(max(m, 0.0), 1.0 / 3.0);
  let s_ = pow(max(s, 0.0), 1.0 / 3.0);
  return vec3f(
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  );
}

fn oklabToLinearSrgb(c: vec3f) -> vec3f {
  let l_ = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  let m_ = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  let s_ = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  let l = l_ * l_ * l_;
  let m = m_ * m_ * m_;
  let s = s_ * s_ * s_;
  return vec3f(
     4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  );
}

fn srgbToLinear(c: vec3f) -> vec3f {
  return vec3f(
    select(pow((c.r + 0.055) / 1.055, 2.4), c.r / 12.92, c.r <= 0.04045),
    select(pow((c.g + 0.055) / 1.055, 2.4), c.g / 12.92, c.g <= 0.04045),
    select(pow((c.b + 0.055) / 1.055, 2.4), c.b / 12.92, c.b <= 0.04045),
  );
}

// ── Triangular dither ─────────────────────────────────────────

fn hash2d(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453123);
}

fn hashTriangular(uv: vec2f, seed: f32) -> f32 {
  let r0 = hash2d(uv + vec2f(seed, 0.0));
  let r1 = hash2d(uv + vec2f(0.0, seed + 71.37));
  return r0 + r1 - 1.0;
}

// ── Vertical color ramp (8 hardcoded stops) ───────────────────
// y=0 top, y=1 bottom.
// Orange/amber at top → blue at bottom. No white/cyan band.

fn verticalRamp(y: f32) -> vec3f {
  // 8 stops: 3 warm → 2 transition → 3 cool
  // Transition uses saturated intermediates (golden → teal) to avoid muddy brown
  var pos = array<f32, 8>(
    0.00, 0.12, 0.28, 0.40, 0.48, 0.60, 0.78, 1.00
  );
  var col = array<vec3f, 8>(
    vec3f(0.450, 0.175, 0.040),  // warm orange (top)
    vec3f(0.900, 0.440, 0.070),  // vivid orange
    vec3f(0.920, 0.600, 0.160),  // bright amber
    vec3f(0.850, 0.720, 0.300),  // bright golden (warm edge of transition)
    vec3f(0.120, 0.450, 0.750),  // teal-blue (cool edge of transition)
    vec3f(0.040, 0.260, 0.780),  // vivid blue
    vec3f(0.012, 0.055, 0.280),  // deep blue
    vec3f(0.005, 0.012, 0.080),  // dark navy (bottom)
  );

  var lo = 0;
  for (var i = 1; i < 8; i++) {
    if (pos[i] <= y) { lo = i; }
  }
  let hi = min(lo + 1, 7);
  let segT = saturate((y - pos[lo]) / max(pos[hi] - pos[lo], 1e-6));

  let linLo = srgbToLinear(col[lo]);
  let linHi = srgbToLinear(col[hi]);
  let labLo = linearSrgbToOklab(linLo);
  let labHi = linearSrgbToOklab(linHi);
  return oklabToLinearSrgb(mix(labLo, labHi, segT));
}

// ── Egg-shaped luminous body ──────────────────────────────────
// The shape is like a vertical egg/teardrop:
//   - Wide at the top (warm orange fills most of the upper screen)
//   - Narrows continuously toward the bottom (blue column)
// Aspect-ratio aware: works in normalized pixel coordinates.

fn bodyMask(px: vec2f, aTime: f32) -> f32 {
  let aspect = u.resolution.x / u.resolution.y;

  // Work in aspect-corrected coordinates centered at (0.5, 0)
  // x: [-0.5..0.5] scaled by aspect, y: [0..1]
  let cx = (px.x - 0.5) * aspect;
  let cy = px.y;

  // Half-width of the body at each y level
  // Wide at top, narrow at bottom — smooth curve
  let topWidth = u.envelopeWidth * aspect * 0.9;
  let botWidth = u.envelopeWidth * aspect * 0.18;
  // Use a power curve for the taper: more gradual at top, faster narrowing below
  let t = pow(saturate(cy), 1.8);
  let halfW = mix(topWidth, botWidth, t);

  // Gaussian-like soft edge (no hard boundary)
  let norm = abs(cx) / max(halfW, 0.001);
  // Softer at top (power ~2 = gaussian), sharper at bottom (power ~3.5)
  let power = mix(2.0, 3.5, t);
  return exp(-pow(norm, power));
}

// ── Vertex (fullscreen triangle) ──────────────────────────────

struct VsOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
};

@vertex
fn vsMain(@builtin(vertex_index) vid: u32) -> VsOut {
  let x = f32(i32(vid & 1u)) * 4.0 - 1.0;
  let y = f32(i32(vid >> 1u)) * 4.0 - 1.0;
  var out: VsOut;
  out.pos = vec4f(x, y, 0.0, 1.0);
  out.uv = vec2f((x + 1.0) * 0.5, (1.0 - y) * 0.5);
  return out;
}

// ── Fragment ──────────────────────────────────────────────────

@fragment
fn fsMain(in: VsOut) -> @location(0) vec4f {
  let uv = in.uv;
  let aTime = u.time * u.animSpeed;

  // Color ramp (orange top → blue bottom)
  var baseColor = verticalRamp(uv.y);

  // Warmth/coolness modulation on Oklab lightness
  var lab = linearSrgbToOklab(baseColor);
  let warmCool = select(u.coolness, u.warmth, uv.y < u.horizonY);
  lab.x *= warmCool;
  baseColor = oklabToLinearSrgb(lab);

  // Egg-shaped body mask (wide top, narrow bottom)
  let mask = bodyMask(uv, aTime);

  // Simple composite: black outside, color inside
  var color = baseColor * mask * u.brightness;

  // Clamp negatives
  color = max(color, vec3f(0.0));

  // Anti-banding dither
  let dither = hashTriangular(in.pos.xy, u.ditherSeed) * (0.5 / 255.0);
  color += vec3f(dither);

  return vec4f(color, 1.0);
}
