/**
 * Profile Page - Origin Glow Shader
 * Pulsing amber light at the deepest layer (根源の光)
 * Art Direction: "地層の最深部で脈動する原初の熱"
 */

export const originGlowVertex = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const originGlowFragment = /* glsl */ `
  uniform float uTime;
  uniform float uProgress;     // 0.0 ~ 1.0 (scroll reveal)
  uniform vec3 uAmberColor;    // Amber base color
  uniform float uPulseSpeed;   // Pulsing frequency
  uniform float uPulseAmount;  // Pulsing intensity

  varying vec2 vUv;

  // Hash function for noise
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

  void main() {
    vec2 center = vUv - 0.5;
    float dist = length(center);

    // Pulsing effect (sine wave)
    float pulse = sin(uTime * uPulseSpeed) * uPulseAmount + (1.0 - uPulseAmount);

    // Noise distortion for organic feel
    float n = noise(vUv * 4.0 + uTime * 0.3);
    float n2 = noise(vUv * 8.0 - uTime * 0.2);

    // Radial gradient with noise distortion
    float radius = 0.4 + n * 0.15;
    float glow = smoothstep(radius, 0.0, dist + n2 * 0.1);

    // Apply pulse
    glow *= pulse;

    // Apply progress (reveal with scroll)
    glow *= uProgress;

    // Color with noise variation
    vec3 color = uAmberColor;

    // Add warm variation based on noise
    color += vec3(0.1, 0.05, -0.05) * n;

    // Brighter center
    float centerBrightness = smoothstep(0.3, 0.0, dist);
    color += vec3(0.2, 0.15, 0.1) * centerBrightness * pulse;

    // Final alpha with soft edges
    float alpha = glow * 0.7;

    gl_FragColor = vec4(color, alpha);
  }
`;
