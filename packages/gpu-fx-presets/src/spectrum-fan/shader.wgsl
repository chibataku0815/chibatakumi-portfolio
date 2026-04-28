// spectrum-fan.wgsl — Smooth parallelogram fan with visible light spectrum
// SDF-based soft edges, gaussian glow, dithering for poster-grade quality

struct Uniforms {
  resolution:     vec2f,
  time:           f32,
  shapeCount:     f32,
  fanAngle:       f32,
  fanRotation:    f32,
  pivotX:         f32,
  pivotY:         f32,
  shapeWidth:     f32,
  shapeHeight:    f32,
  opacity:        f32,
  brightness:     f32,
  bgColor:        vec4f,
  skewAngle:      f32,
  separation:     f32,
  hueShift:       f32,
  saturation:     f32,
  warmth:         f32,
  bgBrightness:   f32,
  glowIntensity:  f32,
  _pad:           vec3f,
};

@group(0) @binding(0) var<uniform> u: Uniforms;

fn rot2(angle: f32) -> mat2x2f {
  let c = cos(angle);
  let s = sin(angle);
  return mat2x2f(c, s, -s, c);
}

fn sdBox(p: vec2f, halfSize: vec2f) -> f32 {
  let d = abs(p) - halfSize;
  return length(max(d, vec2f(0.0))) + min(max(d.x, d.y), 0.0);
}

fn sdParallelogram(p: vec2f, center: vec2f, angle: f32, halfSize: vec2f, skew: f32) -> f32 {
  var q = p - center;
  q = rot2(-angle) * q;
  q.x -= q.y * tan(skew);
  return sdBox(q, halfSize);
}

// CIE 1931 approximate spectrum — Wyman/Sloan/Shirley 2013 Gaussian fit
fn gaussBump(x: f32, mu: f32, sigmaL: f32, sigmaR: f32) -> f32 {
  let sigma = select(sigmaR, sigmaL, x < mu);
  let dx = (x - mu) / sigma;
  return exp(-0.5 * dx * dx);
}

fn spectrumSmooth(t: f32) -> vec3f {
  let wl = mix(380.0, 700.0, t);
  let x =  1.056 * gaussBump(wl, 599.8, 37.9, 31.0)
         + 0.362 * gaussBump(wl, 442.0, 16.0, 26.7)
         - 0.065 * gaussBump(wl, 501.1, 20.4, 26.2);
  let y =  0.821 * gaussBump(wl, 568.8, 46.9, 40.5)
         + 0.286 * gaussBump(wl, 530.9, 16.3, 31.1);
  let z =  1.217 * gaussBump(wl, 437.0, 11.8, 36.0)
         + 0.681 * gaussBump(wl, 459.0, 26.0, 13.8);
  let r =  3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
  let g = -0.9692660 * x + 1.8760108 * y + 0.0415560 * z;
  let b =  0.0556434 * x - 0.2040259 * y + 1.0572252 * z;
  return max(vec3f(r, g, b), vec3f(0.0));
}

fn hash2d(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453123);
}

fn triangularDither(p: vec2f) -> f32 {
  let r0 = hash2d(p);
  let r1 = hash2d(p + vec2f(71.37, 0.0));
  return r0 + r1 - 1.0;
}

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

fn colorTransform(linearColor: vec3f, hueShift: f32, sat: f32, warm: f32) -> vec3f {
  var lab = linearSrgbToOklab(linearColor);
  let cosH = cos(hueShift);
  let sinH = sin(hueShift);
  let a = lab.y * cosH - lab.z * sinH;
  let b = lab.y * sinH + lab.z * cosH;
  lab.y = a * sat;
  lab.z = b * sat;
  lab.y += warm * 0.03;
  lab.z -= warm * 0.015;
  return max(oklabToLinearSrgb(lab), vec3f(0.0));
}

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

@fragment
fn fsMain(in: VsOut) -> @location(0) vec4f {
  let uv = in.uv;
  let aspect = u.resolution.x / u.resolution.y;
  let p = vec2f((uv.x - u.pivotX) * aspect, uv.y - u.pivotY);

  let N = i32(u.shapeCount);
  let halfSize = vec2f(u.shapeWidth, u.shapeHeight);

  // Wide feather — bokeh-like soft focus effect
  let feather = max(u.shapeWidth * 3.0, 0.015);
  // Glow radius — color bleeds well beyond shape
  let glowRadius = max(u.shapeWidth * 8.0, 0.05);
  // Atmosphere — very wide subtle color tinting
  let atmosRadius = max(u.shapeWidth * 20.0, 0.12);
  // Shadow offset
  let shadowOff = vec2f(0.006 * aspect, 0.008);

  var transmittance = vec3f(1.0);
  var glowAccum = vec3f(0.0);

  for (var i = 0; i < N; i++) {
    let fi = f32(i);
    let fN = f32(N);
    let t = fi / max(fN - 1.0, 1.0);

    let angle = u.fanRotation + (t - 0.5) * u.fanAngle;
    let dir = vec2f(cos(angle), sin(angle));
    let cascadeDist = u.separation + t * u.separation * 1.5;
    let center = dir * cascadeDist;

    let dist = sdParallelogram(p, center, angle, halfSize, u.skewAngle);

    // Soft shape mask — very wide feather for dreamy look
    let shapeMask = 1.0 - smoothstep(-feather, feather, dist);

    // Glow masks for color bleed
    let glowMask = exp(-max(dist, 0.0) * max(dist, 0.0) / (glowRadius * glowRadius));
    let atmosMask = exp(-max(dist, 0.0) * max(dist, 0.0) / (atmosRadius * atmosRadius));

    let rawSpectral = spectrumSmooth(t) * u.brightness;
    let spectralColor = colorTransform(rawSpectral, u.hueShift, u.saturation, u.warmth);

    // Per-shape opacity falloff — top shapes (high t) fade toward gray
    let shapeOpacity = u.opacity * (1.0 - t * 0.35);

    // Shadow — offset dark tint behind shape
    let shadowDist = sdParallelogram(p + shadowOff, center, angle, halfSize, u.skewAngle);
    let shadowMask = (1.0 - smoothstep(-feather * 0.5, feather * 1.5, shadowDist)) * 0.12;
    transmittance *= mix(vec3f(1.0), vec3f(0.35), shadowMask);

    // Combined transmittance mask — shape + glow bleed into light background
    let combinedMask = shapeMask
                     + glowMask * u.glowIntensity * 0.4
                     + atmosMask * u.glowIntensity * 0.08;
    let filterAlpha = clamp(combinedMask * shapeOpacity, 0.0, 1.0);
    let filterTransmit = mix(vec3f(1.0), spectralColor, filterAlpha);
    transmittance *= filterTransmit;

    // Additive glow — only visible on dark backgrounds
    glowAccum += spectralColor * glowMask * u.glowIntensity * 0.2;
    glowAccum += spectralColor * atmosMask * u.glowIntensity * 0.04;
  }

  let bg = u.bgColor.rgb;
  // Adaptive compositing: transmittance for light bg, additive glow for dark bg
  let additiveMix = clamp(1.0 - u.bgBrightness * 1.5, 0.0, 1.0);
  var color = bg * transmittance + glowAccum * additiveMix;

  // Triangular dither to eliminate banding
  color += vec3f(triangularDither(in.pos.xy) * (0.5 / 255.0));
  color = max(color, vec3f(0.0));

  return vec4f(color, 1.0);
}
