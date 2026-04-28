struct MarginGlowUniforms {
  resolution:          vec2f,
  time:                f32,
  motionSpeed:         f32,
  pillarWidth:         f32,
  pillarHeight:        f32,
  bottomRadius:        f32,
  pillarX:             f32,
  pillarY:             f32,
  edgeSoftness:        f32,
  haloIntensity:       f32,
  pinkIntensity:       f32,
  yellowGreenIntensity:f32,
  whiteCoreIntensity:  f32,
  brightness:          f32,
  motionAmount:        f32,
  twistAmount:         f32,
  wobbleAmount:        f32,
  wobbleFrequency:     f32,
  twistCycles:         f32,
  wobbleHarmonic:      f32,
  ditherSeed:          f32,
  // --- high-level color controls ---
  hueShift:            f32,
  saturation:          f32,
  warmth:              f32,
  bgBrightness:        f32,
  _pad0:               f32,
  _pad1:               f32,
  _pad2:               f32,
};

@group(0) @binding(0) var<uniform> u: MarginGlowUniforms;

struct VsOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
};

fn clamp01(x: f32) -> f32 {
  return clamp(x, 0.0, 1.0);
}

fn srgbToLinear(c: vec3f) -> vec3f {
  return vec3f(
    select(pow((c.r + 0.055) / 1.055, 2.4), c.r / 12.92, c.r <= 0.04045),
    select(pow((c.g + 0.055) / 1.055, 2.4), c.g / 12.92, c.g <= 0.04045),
    select(pow((c.b + 0.055) / 1.055, 2.4), c.b / 12.92, c.b <= 0.04045),
  );
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

fn oklabMix(a: vec3f, b: vec3f, t: f32) -> vec3f {
  return oklabToLinearSrgb(mix(linearSrgbToOklab(a), linearSrgbToOklab(b), t));
}

// Apply hue rotation + saturation + warmth in Oklab space
fn colorTransform(linearColor: vec3f, hueShift: f32, sat: f32, warm: f32) -> vec3f {
  var lab = linearSrgbToOklab(linearColor);
  // Hue rotation: rotate a,b channels
  let cosH = cos(hueShift);
  let sinH = sin(hueShift);
  let a = lab.y * cosH - lab.z * sinH;
  let b = lab.y * sinH + lab.z * cosH;
  // Saturation: scale chroma
  lab.y = a * sat;
  lab.z = b * sat;
  // Warmth: shift a-axis (positive = warmer/redder, negative = cooler/bluer)
  lab.y += warm * 0.03;
  lab.z -= warm * 0.015;
  return max(oklabToLinearSrgb(lab), vec3f(0.0));
}

fn hash2d(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453123);
}

fn triangularDither(p: vec2f, seed: f32) -> f32 {
  let r0 = hash2d(p + vec2f(seed, 0.0));
  let r1 = hash2d(p + vec2f(0.0, seed + 71.37));
  return r0 + r1 - 1.0;
}

fn softBoxMask(xAbs: f32, halfWidth: f32, feather: f32) -> f32 {
  return 1.0 - smoothstep(halfWidth, halfWidth + feather, xAbs);
}

fn ellipseMask(p: vec2f, radius: vec2f, feather: f32) -> f32 {
  let q = p / radius;
  let dist = length(q);
  let edge = feather / max(min(radius.x, radius.y), 1e-4);
  return 1.0 - smoothstep(1.0, 1.0 + edge, dist);
}

fn gaussian2d(p: vec2f, radius: vec2f) -> f32 {
  let q = p / radius;
  return exp(-dot(q, q));
}

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
  let aspect = u.resolution.x / max(u.resolution.y, 1.0);

  let driftPhase = u.time * u.motionSpeed;
  let driftX = sin(driftPhase * 0.83) * 0.010 * u.motionAmount;
  let driftY = cos(driftPhase * 0.61) * 0.012 * u.motionAmount;

  let centerX = u.pillarX + driftX;
  let centerY = u.pillarY + driftY;
  let halfWidth = max(u.pillarWidth * 0.5 * aspect, 1e-4);
  let bodyFeather = max(u.edgeSoftness * aspect, 1e-4);
  let topY = centerY - u.pillarHeight * 0.5;
  let bottomY = centerY + u.pillarHeight * 0.5;
  let localY = clamp01((uv.y - topY) / max(bottomY - topY, 1e-4));
  let bendWave = sin((localY * u.wobbleFrequency * 6.28318) + driftPhase * 0.75)
               + u.wobbleHarmonic * sin((localY * u.wobbleFrequency * 2.0 * 6.28318) + driftPhase * 1.2);
  let wobbleOffset = bendWave * u.wobbleAmount * (0.35 + 0.65 * smoothstep(0.0, 0.9, localY));
  let twistBase = select(
    (localY - 0.5) * 2.0,
    sin(localY * u.twistCycles * 6.28318),
    u.twistCycles > 0.0
  );
  let twistOffset = twistBase * u.twistAmount * halfWidth * 0.9;

  let x = (uv.x - centerX) * aspect - wobbleOffset * aspect - twistOffset;
  let xAbs = abs(x);
  let topGate = smoothstep(topY - 0.11, topY + 0.08, uv.y);
  let bottomGate = 1.0 - smoothstep(bottomY - 0.06, bottomY + 0.04, uv.y);
  let bodyMask = softBoxMask(xAbs, halfWidth, bodyFeather) * topGate * bottomGate;

  let bulbCenter = vec2f(centerX + wobbleOffset * 0.45, bottomY - u.bottomRadius);
  let bulbMask = ellipseMask(
    vec2f((uv.x - bulbCenter.x) * aspect, uv.y - bulbCenter.y),
    vec2f(halfWidth * 1.10, u.bottomRadius),
    max(u.edgeSoftness * 0.9, 0.01),
  );

  let innerMask = max(bodyMask, bulbMask);

  let haloBody = softBoxMask(xAbs, halfWidth * 1.9, bodyFeather * 3.2) * smoothstep(topY - 0.18, topY + 0.05, uv.y) * (1.0 - smoothstep(bottomY - 0.10, bottomY + 0.10, uv.y));
  let haloBulb = ellipseMask(
    vec2f((uv.x - bulbCenter.x) * aspect, uv.y - bulbCenter.y),
    vec2f(halfWidth * 1.9, u.bottomRadius * 1.55),
    max(u.edgeSoftness * 2.0, 0.02),
  );
  let haloMask = max(haloBody, haloBulb);

  // Base colors — hardcoded defaults, transformed by high-level controls
  let hs = u.hueShift;
  let sat = u.saturation;
  let warm = u.warmth;

  let bg = srgbToLinear(vec3f(u.bgBrightness, u.bgBrightness, u.bgBrightness));
  let pink = colorTransform(srgbToLinear(vec3f(0.94, 0.80, 0.87)), hs, sat, warm);
  let peach = colorTransform(srgbToLinear(vec3f(0.98, 0.92, 0.84)), hs, sat, warm);
  let yellow = colorTransform(srgbToLinear(vec3f(0.97, 0.95, 0.76)), hs, sat, warm);
  let lime = colorTransform(srgbToLinear(vec3f(0.90, 0.94, 0.73)), hs, sat, warm);
  let white = vec3f(1.0, 1.0, 1.0);

  let pinkCloud = gaussian2d(
    vec2f((uv.x - (centerX + wobbleOffset * 0.25)) * aspect, uv.y - (topY + 0.14)),
    vec2f(halfWidth * 1.6, u.pillarHeight * 0.20),
  ) * (0.35 + 0.65 * topGate);

  let warmCloud = gaussian2d(
    vec2f((uv.x - (centerX - 0.005 + wobbleOffset * 0.2)) * aspect, uv.y - (topY + u.pillarHeight * 0.40)),
    vec2f(halfWidth * 1.32, u.pillarHeight * 0.19),
  );

  let bandLine = (uv.y - (topY + u.pillarHeight * 0.53)) - ((uv.x - centerX) * 0.82) - wobbleOffset * 0.4;
  let diagonalBand = exp(-pow(abs(bandLine) / 0.11, 2.0)) *
    exp(-pow(abs((uv.x - centerX) * aspect) / (halfWidth * 1.65), 2.0)) *
    smoothstep(topY + 0.12, topY + u.pillarHeight * 0.54, uv.y) *
    (1.0 - smoothstep(bottomY - 0.05, bottomY + 0.04, uv.y));

  let limeEdge = gaussian2d(
    vec2f((uv.x - (centerX - halfWidth / aspect * 0.65)) * aspect, uv.y - (bottomY - 0.18)),
    vec2f(halfWidth * 0.80, 0.12),
  );

  let whiteColumn = smoothstep(0.42, 0.96, localY) * bodyMask;
  let whiteBulb = bulbMask * (0.68 + 0.32 * smoothstep(bottomY - u.bottomRadius * 1.6, bottomY - u.bottomRadius * 0.4, uv.y));
  let whiteCore = max(whiteColumn * 0.85, whiteBulb);

  var color = bg;

  let topMix = oklabMix(peach, pink, clamp01(0.78 * pinkCloud));
  let midMix = oklabMix(peach, yellow, clamp01(0.75 * warmCloud + 0.55 * diagonalBand));
  let limeMix = oklabMix(yellow, lime, clamp01(0.75 * limeEdge + 0.45 * diagonalBand));

  color += haloMask * u.haloIntensity * srgbToLinear(vec3f(0.042, 0.042, 0.040));
  color += topMix * pinkCloud * u.pinkIntensity * 0.88;
  color += midMix * warmCloud * 0.34;
  color += limeMix * diagonalBand * u.yellowGreenIntensity * 0.96;
  color += lime * limeEdge * u.yellowGreenIntensity * 0.16;
  color = oklabMix(color, white, clamp01(whiteCore * u.whiteCoreIntensity * 0.92));
  color += innerMask * srgbToLinear(vec3f(0.012, 0.011, 0.008)) * 0.12;

  color = bg + (color - bg) * u.brightness;
  color += vec3f(triangularDither(in.pos.xy, u.ditherSeed) * (0.5 / 255.0));
  color = max(color, vec3f(0.0));

  return vec4f(color, 1.0);
}
