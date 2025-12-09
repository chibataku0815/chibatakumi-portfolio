/**
 * Display Fragment Shader
 * Renders the final gradient with fluid distortion
 */

export const displayShader = /* glsl */ `
  uniform float iTime;
  uniform vec2 iResolution;
  uniform sampler2D iFluid;
  uniform float uDistortionAmount;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform vec3 uColor4;
  uniform float uColorIntensity;
  uniform float uSoftness;
  uniform vec3 uAccentColor;
  uniform float uAccentMix;
  uniform vec4 iMouse;
  varying vec2 vUv;

  void main() {
    vec2 fragCoord = vUv * iResolution;

    vec4 fluid = texture2D(iFluid, vUv);
    vec2 fluidVel = fluid.xy;

    float mr = min(iResolution.x, iResolution.y);
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / mr;

    uv += fluidVel * (0.5 * uDistortionAmount);

    float d = -iTime * 0.5;
    float a = 0.0;
    for (float i = 0.0; i < 8.0; ++i) {
      a += cos(i - d - a * uv.x);
      d += sin(uv.y * i + a);
    }
    d += iTime * 0.5;

    float mixer1 = cos(uv.x * d) * 0.5 + 0.5;
    float mixer2 = cos(uv.y * a) * 0.5 + 0.5;
    float mixer3 = sin(d + a) * 0.5 + 0.5;

    float smoothAmount = clamp(uSoftness * 0.1, 0.0, 0.9);
    mixer1 = mix(mixer1, 0.5, smoothAmount);
    mixer2 = mix(mixer2, 0.5, smoothAmount);
    mixer3 = mix(mixer3, 0.5, smoothAmount);

    vec3 col = mix(uColor1, uColor2, mixer1);
    col = mix(col, uColor3, mixer2);
    col = mix(col, uColor4, mixer3 * 0.4);

    // Color-Responsive: accent色のブレンド（Signature Moment）
    // 背景全体にaccent色を大胆にブレンド
    vec3 glowColor = uAccentColor * 1.5;
    col = mix(col, glowColor, uAccentMix * 0.8);

    // Mouse-based radial glow effect
    if (iMouse.x > 0.0 && iMouse.y > 0.0 && uAccentMix > 0.01) {
      vec2 mouseUV = iMouse.xy / iResolution.xy;
      vec2 currentUV = fragCoord / iResolution.xy;

      // Distance from mouse (normalized)
      float dist = distance(currentUV, mouseUV);

      // Multi-layer glow for depth
      float innerGlow = exp(-dist * dist * 80.0);  // Tight inner glow
      float midGlow = exp(-dist * dist * 20.0);    // Medium spread
      float outerGlow = exp(-dist * dist * 5.0);   // Soft outer halo

      // Combine glow layers with accent color
      vec3 mouseGlow = uAccentColor * 2.0 * innerGlow;
      mouseGlow += uAccentColor * 1.2 * midGlow;
      mouseGlow += uAccentColor * 0.5 * outerGlow;

      // Pulsing effect synced with time
      float pulse = 0.85 + 0.15 * sin(iTime * 2.5);
      mouseGlow *= pulse;

      // Apply glow based on accent mix intensity
      col += mouseGlow * uAccentMix * 0.9;
    }

    col *= uColorIntensity;

    gl_FragColor = vec4(col, 1.0);
  }
`;
