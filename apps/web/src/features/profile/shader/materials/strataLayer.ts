/**
 * Profile Page - Strata Layer Shader
 * Geological layers with fossil marks (地層と化石の痕跡)
 * Art Direction: "掘り進むほど現れる歴史の層"
 */

export const strataLayerVertex = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const strataLayerFragment = /* glsl */ `
  uniform float uTime;
  uniform float uDepth;        // 0.0 (surface) ~ 1.0 (deepest)
  uniform float uProgress;     // scroll progress
  uniform vec2 uResolution;
  uniform vec3 uAmberColor;    // Amber accent for fossils

  varying vec2 vUv;

  // Hash function
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // Value noise
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // FBM for organic texture
  float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < octaves; i++) {
      value += amplitude * noise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }

    return value;
  }

  void main() {
    vec2 uv = vUv;

    // === Horizontal Strata Lines (地層の線) ===
    // Deeper = more dense lines
    float strataFreq = 25.0 + uDepth * 40.0;
    float strataOffset = fbm(vec2(uv.x * 5.0, uTime * 0.08), 3) * 2.0;
    float strata = sin((uv.y + strataOffset * 0.05) * strataFreq) * 0.5 + 0.5;
    strata = smoothstep(0.45, 0.55, strata);

    // === Sediment Noise (堆積物のテクスチャ) ===
    float sediment = fbm(uv * 8.0 + vec2(0.0, uTime * 0.03), 4);

    // === Fossil Marks (化石の痕跡 - 深層70%以上のみ) ===
    float fossilMask = step(0.7, uDepth);
    float fossil = 0.0;

    if (fossilMask > 0.0) {
      // Random fossil positions
      vec2 fossilUv = uv * 12.0;
      float fossilNoise = hash(floor(fossilUv) + vec2(uTime * 0.01, 0.0));

      // Very sparse fossils
      float fossilThreshold = 0.97;
      fossil = step(fossilThreshold, fossilNoise) * smoothstep(0.92, 1.0, sediment);

      // Add some elongated shapes
      float elongation = noise(fossilUv * 0.5) * 0.3;
      fossil *= smoothstep(0.1, 0.0, abs(fract(fossilUv.y * 0.5) - 0.5) - elongation);
    }

    // === Reveal Mask (スクロールで地層が現れる) ===
    float revealEdge = 0.3;
    float revealNoise = noise(uv * 6.0 + uTime * 0.05) * 0.1;
    float revealMask = smoothstep(
      1.0 - uProgress - revealEdge + revealNoise,
      1.0 - uProgress + revealNoise,
      uv.y
    );

    // === Color Composition ===
    // Base color: darker as you go deeper
    float baseColor = 0.04 + (1.0 - uDepth) * 0.02;
    vec3 color = vec3(baseColor);

    // Strata lines (very subtle white)
    color += strata * 0.012 * uProgress;

    // Sediment texture
    color += sediment * 0.006;

    // Fossil marks with amber glow
    color += fossil * uAmberColor * 0.15 * fossilMask;

    // Depth gradient (deeper = slightly amber-tinted)
    color += uAmberColor * uDepth * 0.025;

    // Add subtle time-based shimmer to fossils
    if (fossil > 0.0) {
      float shimmer = sin(uTime * 2.0 + uv.x * 10.0) * 0.5 + 0.5;
      color += uAmberColor * fossil * shimmer * 0.05;
    }

    // === Final Alpha ===
    // More visible as depth increases
    float baseAlpha = 0.10 + uDepth * 0.08;
    float alpha = revealMask * baseAlpha;

    // Boost alpha at fossil locations
    alpha += fossil * 0.08 * fossilMask;

    gl_FragColor = vec4(color, alpha);
  }
`;
