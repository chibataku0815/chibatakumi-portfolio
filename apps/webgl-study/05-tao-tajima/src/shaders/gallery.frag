uniform sampler2D uTexture1;
uniform sampler2D uTexture2;
uniform float uProgress;
uniform vec2 uResolution;
uniform vec2 uImageResolution;
uniform float uDistortion;
uniform float uRGBShift;
uniform float uGrainIntensity;
uniform float uTime;
uniform vec2 uMouse;

varying vec2 vUv;

// Cover UV: aspect-ratio-corrected UV (same as CSS object-fit: cover)
vec2 coverUv(vec2 uv, vec2 resolution, vec2 imageResolution) {
  float screenAspect = resolution.x / resolution.y;
  float imageAspect = imageResolution.x / imageResolution.y;
  vec2 scale = screenAspect > imageAspect
    ? vec2(1.0, imageAspect / screenAspect)
    : vec2(screenAspect / imageAspect, 1.0);
  return (uv - 0.5) * scale + 0.5;
}

// Mirror UV to avoid hard seams when UV exceeds 0-1 range
vec2 mirrored(vec2 v) {
  vec2 m = mod(v, 2.0);
  return mix(m, 2.0 - m, step(1.0, m));
}

// RGB Shift (Chromatic Aberration): offset R/B channels horizontally
vec4 rgbShiftSample(sampler2D tex, vec2 uv, float amount) {
  float r = texture2D(tex, uv + vec2(amount, 0.0)).r;
  float g = texture2D(tex, uv).g;
  float b = texture2D(tex, uv - vec2(amount, 0.0)).b;
  float a = texture2D(tex, uv).a;
  return vec4(r, g, b, a);
}

// Distortion: sin-based UV warp
vec2 distort(vec2 uv, float amount, float time) {
  vec2 warp = vec2(
    sin(uv.y * 10.0 + time * 0.5) * amount * 0.02,
    sin(uv.x * 10.0 + time * 0.3) * amount * 0.02
  );
  return uv + warp;
}

// Film Grain: pseudo-random noise
float grain(vec2 uv, float time) {
  return fract(sin(dot(uv * time, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
}

// Mouse Ripple: radial distortion centered on mouse position
vec2 mouseDistort(vec2 uv, vec2 mouse, float strength) {
  vec2 center = mouse * 0.5 + 0.5; // mouse (-1..1) to UV space (0..1)
  vec2 dir = uv - center;
  float dist = length(dir);
  float falloff = smoothstep(0.5, 0.0, dist); // radius 0.5 falloff
  return uv + normalize(dir + 0.001) * falloff * strength * 0.05;
}

void main() {
  vec2 uv = vUv;

  // 1. Mouse distortion on UV
  uv = mouseDistort(uv, uMouse, uDistortion);

  // 2. Cover UV for correct aspect ratio
  vec2 cUv = coverUv(uv, uResolution, uImageResolution);

  float p = fract(uProgress);

  // 3. Diagonal delay: combines vertical + slight horizontal offset
  // Inspired by akella's `uv.y*2. + uv.x` pattern
  float delayValue = p * 7.0 - uv.y * 2.0 + uv.x - 2.0;
  delayValue = clamp(delayValue, 0.0, 1.0);

  // 4. Vertical slide offset per texture
  vec2 translateValue = p + delayValue * vec2(0.5, 2.0);
  vec2 translate1 = vec2(-0.5, 1.0) * translateValue;
  vec2 translate2 = vec2(-0.5, 1.0) * (translateValue - 1.0 - vec2(0.5, 2.0));

  vec2 uv1 = cUv + translate1;
  vec2 uv2 = cUv + translate2;

  // 5. Distortion (sin warp) applied to both UV sets
  uv1 = distort(uv1, uDistortion, uTime);
  uv2 = distort(uv2, uDistortion, uTime);

  // 6. RGB Shift sampling — stronger during transition
  float rgbAmount = uRGBShift * (1.0 + delayValue * 2.0);
  vec4 color1 = rgbShiftSample(uTexture1, mirrored(uv1), rgbAmount);
  vec4 color2 = rgbShiftSample(uTexture2, mirrored(uv2), rgbAmount);

  // 7. Crossfade driven by diagonal delay
  gl_FragColor = mix(color1, color2, delayValue);

  // 8. Film Grain additive overlay
  gl_FragColor.rgb += grain(vUv, uTime) * uGrainIntensity;
}
