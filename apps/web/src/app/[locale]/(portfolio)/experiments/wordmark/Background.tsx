"use client";

import { ScreenQuad } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import {
  BACKGROUND_PRESETS,
  type BackgroundType,
  type Palette,
} from "./candidates";

export type BackgroundProps = { palette: Palette; type: BackgroundType };

// NDC-space vertex: ScreenQuad emits a 2-component position attribute
// (the full-screen triangle trick — positions are already in NDC).
// UVs are derived from position rather than a dedicated attribute.
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// ---------------------------------------------------------------------------
// Fragment shader — four composited effects stacked in order:
//   1. base color
//   2. vertical bias   (editorial only — gentle top-bright / bottom-dark)
//   3. vignette        (vignette + editorial — radial cinematic darken)
//   4. grain           (grain + editorial — static film noise)
//
// Noise quality: 3-tap hash avoids the banding that single-dot-product
// hashes produce at 8-bit precision. Each tap uses orthogonal seed vectors
// so the three channels decorrelate.
//
// Vignette quality: double smoothstep gives a softer knee than linear
// falloff. Inner radius (0.38) keeps the centre clean; outer radius (1.05)
// reaches beyond the diagonal so corners are fully darkened.
//
// Hue shift: in the vignette shadow zone a slight cool-blue tint is mixed in.
// This matches the photographic observation that deep shadows read as cooler
// than the subject — it gives the mono/warm palettes a subtle analogue feel
// without affecting the fully lit centre.
// ---------------------------------------------------------------------------
const fragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3  uColor;
  uniform float uVignette;
  uniform float uGrain;
  uniform float uVerticalBias;

  varying vec2 vUv;

  // ---- noise helpers -------------------------------------------------------

  // 3-tap decorrelated hash — better high-frequency distribution than a
  // single sin(dot()) hash.
  float hash3(vec2 p) {
    float h0 = fract(sin(dot(p,                vec2(127.1, 311.7))) * 43758.5453123);
    float h1 = fract(sin(dot(p + vec2(1.0, 0.0), vec2( 18.9, 283.1))) * 21341.8312);
    float h2 = fract(sin(dot(p + vec2(0.0, 1.0), vec2(269.5, 107.3))) * 53219.0134);
    return (h0 + h1 + h2) / 3.0;
  }

  // Static film grain: sample at sub-pixel scale so individual grains are
  // smaller than a pixel cluster — gives the "fine silver-halide" look.
  float filmGrain(vec2 uv) {
    // Two overlapping scales for a more organic texture
    float coarse = hash3(uv * 800.0);
    float fine   = hash3(uv * 1400.0 + vec2(3.7, 9.1));
    return (coarse * 0.65 + fine * 0.35) - 0.5; // centre around zero
  }

  // ---- vignette ------------------------------------------------------------

  // Double smoothstep for a soft cinematic knee.
  // inner = 0.38 keeps centre clean; outer = 1.05 clips corners fully.
  float vignetteAmount(vec2 uv) {
    vec2  c  = uv - vec2(0.5);
    // Aspect-corrected ellipse so a 16:9 canvas gets round — not oval — vignette.
    // We don't know the canvas aspect here, so we approximate with a slight
    // horizontal expansion (factor 1.25) which is a reasonable 4:3→16:9 midpoint.
    float d  = length(c * vec2(1.25, 1.0));
    float v  = smoothstep(0.38, 0.95, d);
    return v * v; // square for a softer, more photographic falloff
  }

  // ---- main ----------------------------------------------------------------

  void main() {
    vec3 color = uColor;

    // 1. Vertical bias — top stays brighter, bottom darkens.
    //    uVerticalBias = 1.0 → 15 % delta. Applied multiplicatively.
    if (uVerticalBias > 0.001) {
      float t       = 1.0 - vUv.y;          // 0 at top, 1 at bottom
      float darkFac = t * uVerticalBias * 0.15;
      color        *= (1.0 - darkFac);
    }

    // 2. Vignette — radial cinematic darken with subtle cool-blue hue shift
    //    in the shadow zone (analogue shadow-teal observation).
    if (uVignette > 0.001) {
      float v       = vignetteAmount(vUv) * uVignette;
      // Hue shift: shadows drift slightly cool (blue). The magnitude is
      // intentionally small (0.06) so it reads as atmosphere, not tinting.
      vec3  coolShadow = color * vec3(0.88, 0.92, 1.0);
      color            = mix(color, coolShadow, v * 0.35); // first: hue nudge
      color           *= (1.0 - v);                        // then: luminance darken
    }

    // 3. Film grain — additive noise centred at zero, scaled by uGrain.
    //    Additive (not multiplicative) so it lifts shadow detail the way
    //    real film grain does. Clamped to [0,1] to avoid HDR artefacts.
    if (uGrain > 0.001) {
      float n = filmGrain(vUv) * uGrain;
      color   = clamp(color + vec3(n), 0.0, 1.0);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function Background({ palette, type }: BackgroundProps) {
  const preset = BACKGROUND_PRESETS[type];

  // useMemo with individual preset fields as deps so React 19 strict mode
  // doesn't re-create the uniform object on every render.
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(palette.background) },
      uVignette: { value: preset.vignette },
      uGrain: { value: preset.grain },
      uVerticalBias: { value: preset.verticalBias },
    }),
    [palette.background, preset.vignette, preset.grain, preset.verticalBias],
  );

  return (
    <>
      {/*
       * <color attach="background"> sets the WebGL clear color to palette.background
       * before the shader paints. This prevents any single-frame flicker on mount
       * and keeps the canvas edges clean if the ScreenQuad ever misses a pixel.
       */}
      <color attach="background" args={[palette.background]} />

      {/*
       * ScreenQuad renders a full-screen triangle that bypasses the R3F camera
       * entirely (positions are in NDC). depthWrite={false} + depthTest={false}
       * ensure the wordmark meshes (z=1–3) always render on top.
       */}
      <ScreenQuad>
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          depthWrite={false}
          depthTest={false}
        />
      </ScreenQuad>
    </>
  );
}
