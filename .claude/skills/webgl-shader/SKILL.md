---
name: webgl-shader
description: Specialist role for WebGL shaders, Three.js scenes, and GPU-accelerated visual effects. Use this skill for GLSL shader programming, React Three Fiber, procedural textures, noise functions, post-processing effects, and performance optimization. Works in parallel with frontend-dev team.
---

# webgl-shader

専門チーム（Specialist）担当。WebGL シェーダー、Three.js シーン、GPU アクセラレーション効果を実装する。

## Role Definition

- **責務**: シェーダー実装、3Dシーン構築、プロシージャル生成、ポストプロセス
- **成果物**: GLSL シェーダー、R3F コンポーネント、パフォーマンス最適化
- **境界**: レイアウト/スタイリングは Frontend に委譲、API は Backend に委譲

## Handoff Protocol

### Frontend からの受け取り

```markdown
## [Specialist] への依頼

### 目的
Hero 背景のシェーダー実装

### 入力
- 参照画像: `/public/hero.jpg`
- 要件: 写真の平均暗部色をベースにFBM生成

### 出力
- `src/components/ShaderBackground.tsx`
- Props: className, style (配置は Frontend が制御)

### 制約
- SSR対応 (dynamic import 前提)
- Amber リークはオフ
- ノイズ強度: coarse 0.03 / fine 0.015
```

### Frontend への納品

```tsx
// 使用方法をコメントで明記
/**
 * ShaderBackground - Hero背景用シェーダー
 *
 * @example
 * import dynamic from 'next/dynamic'
 * const ShaderBackground = dynamic(
 *   () => import('@/components/ShaderBackground'),
 *   { ssr: false }
 * )
 *
 * <ShaderBackground className="absolute inset-0 -z-10" />
 */
```

## Status Report Format

```markdown
## Specialist (WebGL) ステータス

### 完了
- FBM ノイズ実装
- 暗部色サンプリング

### 進行中
- grain overlay: 80%

### ブロッカー
- なし

### Frontend 向け
- `ShaderBackground` 使用可能
- Props: className, style
```

## Core Technologies

- **Three.js**: 3D library for WebGL rendering
- **React Three Fiber (R3F)**: React renderer for Three.js
- **@react-three/drei**: Useful helpers and abstractions
- **GLSL**: OpenGL Shading Language for vertex/fragment shaders
- **Post-processing**: @react-three/postprocessing, custom effects

## Shader Fundamentals

### Vertex Shader Structure

```glsl
uniform float uTime;
uniform vec2 uResolution;

varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

### Fragment Shader Structure

```glsl
uniform float uTime;
uniform vec2 uResolution;
uniform sampler2D uTexture;

varying vec2 vUv;

void main() {
  vec3 color = vec3(0.0);
  // shader logic here
  gl_FragColor = vec4(color, 1.0);
}
```

## Noise Functions

### Simple Hash Noise

```glsl
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
```

### Value Noise

```glsl
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f); // smoothstep

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
```

### Fractal Brownian Motion (FBM)

```glsl
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
```

### Simplex-like Gradient Noise

```glsl
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float gradientNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
        dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
        dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y
  );
}
```

## Common Patterns

### Film Grain

```glsl
float grain(vec2 uv, float time, float strength) {
  return (hash(uv + time) - 0.5) * strength;
}
```

### Vignette

```glsl
float vignette(vec2 uv, float radius, float softness) {
  vec2 center = uv - 0.5;
  float dist = length(center);
  return 1.0 - smoothstep(radius - softness, radius, dist);
}
```

### Color Grading

```glsl
vec3 colorGrade(vec3 color, vec3 shadows, vec3 midtones, vec3 highlights) {
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  vec3 shadowMask = color * (1.0 - luma);
  vec3 highlightMask = color * luma;
  vec3 midtoneMask = color * (1.0 - abs(luma - 0.5) * 2.0);

  return shadowMask * shadows + midtoneMask * midtones + highlightMask * highlights;
}
```

### Image Sampling & Average Color

```glsl
// Sample texture and compute average color (in fragment shader)
vec3 getAverageColor(sampler2D tex, int samples) {
  vec3 sum = vec3(0.0);
  float total = float(samples * samples);

  for (int x = 0; x < samples; x++) {
    for (int y = 0; y < samples; y++) {
      vec2 uv = vec2(float(x), float(y)) / float(samples - 1);
      sum += texture2D(tex, uv).rgb;
    }
  }

  return sum / total;
}

// Dark regions average (for matching photo shadows)
vec3 getDarkAverage(sampler2D tex, float threshold) {
  vec3 sum = vec3(0.0);
  float count = 0.0;

  for (int x = 0; x < 8; x++) {
    for (int y = 0; y < 8; y++) {
      vec2 uv = vec2(float(x), float(y)) / 7.0;
      vec3 sample = texture2D(tex, uv).rgb;
      float luma = dot(sample, vec3(0.299, 0.587, 0.114));
      if (luma < threshold) {
        sum += sample;
        count += 1.0;
      }
    }
  }

  return count > 0.0 ? sum / count : vec3(0.0);
}
```

## React Three Fiber Patterns

### Basic Shader Material

```tsx
import { useRef } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

const CustomMaterial = shaderMaterial(
  {
    uTime: 0,
    uResolution: new THREE.Vector2(),
  },
  // vertex shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // fragment shader
  `
    uniform float uTime;
    varying vec2 vUv;
    void main() {
      gl_FragColor = vec4(vUv, sin(uTime) * 0.5 + 0.5, 1.0);
    }
  `
)

extend({ CustomMaterial })
```

### Fullscreen Shader Quad

```tsx
import { useThree } from '@react-three/fiber'

function FullscreenQuad({ children }) {
  const { viewport } = useThree()

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      {children}
    </mesh>
  )
}
```

### Using Textures in Shaders

```tsx
import { useTexture } from '@react-three/drei'

function TexturedShader() {
  const texture = useTexture('/hero.jpg')
  const materialRef = useRef()

  useFrame(({ clock }) => {
    materialRef.current.uTime = clock.elapsedTime
  })

  return (
    <mesh>
      <planeGeometry args={[1, 1]} />
      <customMaterial ref={materialRef} uTexture={texture} />
    </mesh>
  )
}
```

## Performance Guidelines

### Do

- Use `useMemo` for geometries and materials
- Minimize uniform updates per frame
- Use texture atlases when possible
- Prefer `ShaderMaterial` over `RawShaderMaterial` for automatic uniforms
- Use `dispose()` on materials/geometries when unmounting
- Keep shader calculations simple; move complex math to JS when possible

### Don't

- Create new materials/geometries in render loops
- Use excessive texture lookups in fragment shaders
- Overuse `discard` in fragment shaders (breaks early-z)
- Forget to set `transparent: true` for alpha effects
- Use high iteration counts in loops without necessity

### Memory Management

```tsx
useEffect(() => {
  return () => {
    geometry.dispose()
    material.dispose()
    texture.dispose()
  }
}, [])
```

## Debugging

### Visual Debugging

```glsl
// Output UV coordinates
gl_FragColor = vec4(vUv, 0.0, 1.0);

// Output normals
gl_FragColor = vec4(vNormal * 0.5 + 0.5, 1.0);

// Output depth
float depth = gl_FragCoord.z;
gl_FragColor = vec4(vec3(depth), 1.0);
```

### Common Issues

| Problem | Solution |
|---------|----------|
| Black screen | Check shader compilation errors in console |
| Flickering | Z-fighting - adjust near/far planes |
| Performance | Reduce texture size, simplify shaders |
| Artifacts | Check precision (`highp`, `mediump`) |
| No animation | Verify `useFrame` is updating uniforms |

## Integration with Next.js

### Dynamic Import (SSR-safe)

```tsx
import dynamic from 'next/dynamic'

const ShaderBackground = dynamic(
  () => import('@/components/ShaderBackground'),
  { ssr: false }
)
```

### Canvas Setup

```tsx
import { Canvas } from '@react-three/fiber'

export default function Scene() {
  return (
    <Canvas
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 0, 1] }}
      style={{ position: 'absolute', inset: 0 }}
    >
      {/* 3D content */}
    </Canvas>
  )
}
```
