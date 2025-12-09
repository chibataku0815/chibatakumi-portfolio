/**
 * Loading Page - Origin Glow Shader (Simplified)
 * Pulsing amber light (根源の光)
 *
 * Art Direction: "地層の最深部で脈動する原初の熱が、徐々に目覚める"
 * Motion Design: 1.5秒周期の呼吸、静寂の中の生命感
 *
 * Simplified from Profile's originGlow.ts for performance:
 * - Single noise layer (vs 2 layers)
 * - No uProgress (always visible)
 * - Optimized for loading screen
 */

export const loadingGlowVertex = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const loadingGlowFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uAmberColor;    // Amber base color
  uniform float uPulseSpeed;   // Pulsing frequency
  uniform float uPulseAmount;  // Pulsing intensity

  varying vec2 vUv;

  // Hash function for noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // Value noise (single layer for performance)
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

  void main() {
    vec2 center = vUv - 0.5;
    float dist = length(center);

    // Pulsing effect (sine wave)
    // Motion Design: 1.5秒周期の呼吸
    float pulse = sin(uTime * uPulseSpeed) * uPulseAmount + (1.0 - uPulseAmount);

    // Noise distortion for organic feel
    float n = noise(vUv * 4.0 + uTime * 0.3);

    // Radial gradient with noise distortion
    float radius = 0.35 + n * 0.12;
    float glow = smoothstep(radius, 0.0, dist + n * 0.08);

    // Apply pulse
    glow *= pulse;

    // Color with noise variation
    vec3 color = uAmberColor;

    // Add warm variation based on noise
    color += vec3(0.1, 0.05, -0.05) * n;

    // Brighter center (hotspot)
    float centerBrightness = smoothstep(0.25, 0.0, dist);
    color += vec3(0.2, 0.15, 0.1) * centerBrightness * pulse;

    // Final alpha with soft edges
    float alpha = glow * 0.65;

    gl_FragColor = vec4(color, alpha);
  }
`;
