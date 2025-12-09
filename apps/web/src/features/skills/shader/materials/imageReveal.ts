/**
 * Skills Page - Image Reveal Shader
 * FBM-based organic reveal with amber glow at the edge
 * Art Direction: "氷山の一角が溶けて姿を現す"
 */

export const imageRevealVertex = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const imageRevealFragment = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float uProgress;      // 0.0 ~ 1.0 (reveal progress)
  uniform float uNoiseScale;    // Noise frequency
  uniform vec2 uResolution;
  uniform vec3 uAmberColor;     // var(--accent-amber1)

  varying vec2 vUv;

  // Hash function for noise base
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

  // FBM (4 octaves for organic edge)
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }

    return value;
  }

  void main() {
    vec2 uv = vUv;

    // Center-based distance for circular reveal
    vec2 center = uv - 0.5;
    float dist = length(center);

    // Add FBM noise to the reveal edge (organic distortion)
    float noiseValue = fbm(uv * uNoiseScale);

    // Reveal threshold with noise distortion
    float threshold = uProgress * 1.5;  // Overshoot slightly for full reveal
    float edge = smoothstep(
      threshold - 0.15 - noiseValue * 0.25,
      threshold - 0.05 + noiseValue * 0.15,
      dist
    );

    // Sample texture
    vec4 color = texture2D(uTexture, uv);

    // Apply reveal mask
    float alpha = 1.0 - edge;
    color.a *= alpha;

    // Add amber glow at the reveal edge
    float glowDistance = abs(dist - (threshold - noiseValue * 0.1));
    float glowStrength = smoothstep(0.08, 0.0, glowDistance);
    glowStrength *= (1.0 - edge) * edge;  // Glow only at active edge

    // Add warm amber glow
    color.rgb += uAmberColor * glowStrength * 0.4;

    // Subtle brightness boost at edge
    color.rgb += vec3(1.0) * glowStrength * 0.15;

    gl_FragColor = color;
  }
`;
