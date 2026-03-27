# 04 — Particle Love (GPGPU Particles)

> Pattern #3: パーティクル/GPGPU | 原作: Particle Love by Edan Kwan

## Overview

GPGPU (General-Purpose GPU) によるパーティクルシステムの実装。
GPUComputationRenderer で FBO ping-pong パターンを使い、
数万パーティクルの物理演算を GPU 上で並列実行する。

### 習得する核心技術

| 技術 | 概要 |
|------|------|
| GPUComputationRenderer | Three.js の GPGPU ヘルパー。DataTexture に位置/速度を格納 |
| FBO ping-pong | 2つの RenderTarget を交互に読み書きし、GPU 上で状態を更新 |
| Fragment Shader Physics | パーティクル物理をフラグメントシェーダーで並列計算 |
| BufferGeometry + Points | 数万パーティクルの効率的な描画 |
| ShaderMaterial | カスタム頂点/フラグメントシェーダー |
| Curl Noise | 発散フリーのノイズベース流体表現 |

## Architecture

```
main.ts
├── WebGLRenderer (antialias, alpha: false)
├── Scene (background: #000)
├── PerspectiveCamera
├── ParticleSystem
│   ├── GPUComputationRenderer (128→256 size)
│   │   ├── texturePosition (FBO variable)
│   │   │   └── gpgpu-position.glsl
│   │   └── textureVelocity (FBO variable)
│   │       └── gpgpu-velocity.glsl
│   ├── BufferGeometry (aParticlesUv attribute)
│   ├── ShaderMaterial (AdditiveBlending)
│   │   ├── particle-vertex.glsl
│   │   └── particle-fragment.glsl
│   └── Points
├── PostProcessing (Bloom + FXAA)
└── AnimationLoop
    ├── gpuCompute.compute()
    ├── update uniforms (uTime, uDeltaTime, uMouse)
    └── renderer.render()
```

## Shader Design

### gpgpu-position.glsl
```
Input:  texturePosition (previous), textureVelocity (current)
Output: vec4(x, y, z, life)
Logic:  position += velocity * deltaTime
        if (life >= 1.0) → reset to initial position
```

### gpgpu-velocity.glsl
```
Input:  texturePosition, textureVelocity, uMouse, uTime
Output: vec4(vx, vy, vz, 1.0)
Logic:  curl_noise(position + time) → flow force
        mouse_attractor(position, mouse) → interaction force
        velocity = (velocity + forces) * damping
```

### particle-vertex.glsl
```
Input:  aParticlesUv, uPositionTexture
Output: gl_Position, gl_PointSize
Logic:  position = texture2D(uPositionTexture, aParticlesUv).xyz
        pointSize = baseSize * life_scale / -mvPosition.z
```

### particle-fragment.glsl
```
Input:  gl_PointCoord, vLife
Output: gl_FragColor
Logic:  circular mask via distance(gl_PointCoord, 0.5)
        color = mix(colorA, colorB, velocity_magnitude)
        alpha = smoothstep edge * life_fade
```

## Visual Design

- **Background**: #000000 (pure black)
- **Color A**: Warm (pink/amber) — `theme.colors.amber[9]`
- **Color B**: Cool (blue/violet)
- **Blending**: AdditiveBlending (depthWrite: false)
- **Post-processing**: Bloom (threshold: 0.3, strength: 1.5, radius: 0.5) + FXAA
- **ToneMapping**: ACESFilmicToneMapping (Bloom との相性)

## Interaction

- Mouse move → normalize to NDC (-1 to 1)
- Raycaster → 3D intersection point on invisible plane
- Pass to `uMouse` uniform in velocity shader
- Particles attracted/repelled based on distance

## Debug GUI (#debug)

| Folder | Controls |
|--------|----------|
| Particles | size, opacity, count (read-only) |
| Forces | curlStrength, attractorStrength, damping, speed |
| Colors | colorA, colorB (addColor) |
| Bloom | threshold, strength, radius |

## Phases

### Phase A: GPGPU Foundation (3-4h)
- index.html + main.ts skeleton
- GPUComputationRenderer init (128×128 = 16K)
- Position-only (no velocity) — static white dots
- Success: 16K particles visible on screen

### Phase B: Physics + Visuals (4-6h)
- Velocity texture + curl noise
- Mouse interaction
- Scale to 256×256 = 65K
- Bloom + color design
- Debug GUI
- Success: 65K particles with fluid motion + Bloom

### Phase C: Polish — SKIP (核心通過で完了)

## References

- [Codrops GPGPU Tutorial](https://tympanus.net/codrops/2024/12/19/crafting-a-dreamy-particle-effect-with-three-js-and-gpgpu/)
- Three.js Journey Lesson 42 (GPGPU Flow Field)
- [GPUComputationRenderer Docs](https://threejs.org/docs/pages/GPUComputationRenderer.html)
- Particle Love by Edan Kwan (visual reference)
