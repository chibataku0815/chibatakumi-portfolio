/**
 * Oklab / Oklch helpers (WGSL) — Ottosson 2020 perceptual color space.
 *
 * Set Y Phase C (2026-04-21). Used by `bloom-prefilter` and `composite` to
 * keep bloom hue stable through pyramid blur (deep red neon stays deep red
 * instead of shifting toward pink/orange under RGB blur).
 *
 * Spec: https://bottosson.github.io/posts/oklab/
 *
 * Functions are exported as a WGSL string fragment so consuming shaders can
 * concatenate them inside a single template literal — WGSL has no `import`
 * directive at module level.
 */
export const oklabWgsl = /* wgsl */ `
// linear sRGB -> Oklab. Input expected linear (rgba16float intermediates).
fn linearRgbToOklab(c: vec3f) -> vec3f {
  let l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
  let m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
  let s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;
  // Cube root with sign preservation; HDR / negative values stay finite.
  let l_ = sign(l) * pow(abs(l), 1.0 / 3.0);
  let m_ = sign(m) * pow(abs(m), 1.0 / 3.0);
  let s_ = sign(s) * pow(abs(s), 1.0 / 3.0);
  return vec3f(
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  );
}

// Oklab -> linear sRGB.
fn oklabToLinearRgb(lab: vec3f) -> vec3f {
  let l_ = lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z;
  let m_ = lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z;
  let s_ = lab.x - 0.0894841775 * lab.y - 1.2914855480 * lab.z;
  let l = l_ * l_ * l_;
  let m = m_ * m_ * m_;
  let s = s_ * s_ * s_;
  return vec3f(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    2.6097574011 * m - 1.2684380046 * l - 0.3413193965 * s,
    1.7076147010 * s - 0.0041960863 * l - 0.7034186147 * m,
  );
}
`;
