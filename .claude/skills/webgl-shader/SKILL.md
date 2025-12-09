---
name: webgl-shader
description: Award-winning WebGL shader and 3D specialist. Creates technically innovative, visually stunning GPU-accelerated experiences that push boundaries while maintaining performance. Targets Excellence Framework Level 5 (Award-Worthy). Use this skill for GLSL shader programming, React Three Fiber, procedural art, post-processing effects, and performance optimization.
---

# webgl-shader

**Excellence Level Target: 5 (Award-Worthy)**

WebGL/シェーダー専門チーム。受賞レベルの3D体験、GPU最適化、革新的なビジュアルエフェクトを実装する。

---

## 🏆 Excellence Framework Integration

このスキルは `EXCELLENCE-FRAMEWORK.md` の Level 5 基準に準拠:

```
Level 5: Award-Worthy（受賞レベル）
         ↑ 新しい基準を作る、技術的革新
Level 4: Distinctive（差別化）
         ↑ 独自のビジュアル言語
Level 3: Refined（洗練）
         ↑ 細部まで最適化
Level 2: Professional（プロフェッショナル）
         ↑ 業界標準を満たす
Level 1: Functional（機能的）
         ↑ 動作する
```

**現在地: Level 5 を目指す**

---

## Award-Worthy Reference Library

受賞レベルのWebGL/シェーダー実装を学ぶための必修参照サイト。

### WebGL Innovation Masters

| サイト | 制作 | 特徴 | 学ぶべき点 | Level |
|--------|------|------|-----------|-------|
| [Active Theory 作品群](https://activetheory.net) | Active Theory | カスタムシェーダー、物理ベース | 技術と美学の完璧な融合 | 5 |
| [Immersive Garden 作品群](https://immersive-g.com) | Immersive Garden | 3D統合、ストーリーテリング | シームレスなUX統合 | 5 |
| [Resn 作品群](https://resn.co.nz) | Resn | インタラクティブ3D | 遊び心と技術力の両立 | 5 |
| [Bruno Simon Portfolio](https://bruno-simon.com) | Bruno Simon | Three.js 革新 | インタラクティビティの再定義 | 5 |

### Procedural & Generative Art

| サイト | 特徴 | 学ぶべき点 | Level |
|--------|------|-----------|-------|
| [Inigo Quilez (iq)](https://iquilezles.org) | シェーダー数学の神 | SDF、ドメインワーピング | 5 |
| [The Book of Shaders](https://thebookofshaders.com) | 教育コンテンツ | ノイズ、パターン生成 | 4-5 |
| [Shadertoy Top Picks](https://www.shadertoy.com) | コミュニティ最高峰 | 先端技術のショーケース | 4-5 |

### Performance & Optimization

| サイト | 特徴 | 学ぶべき点 | Level |
|--------|------|-----------|-------|
| [Three.js Examples](https://threejs.org/examples/) | 公式ベストプラクティス | 最適化パターン | 3-4 |
| [Pmndrs Ecosystem](https://docs.pmnd.rs/) | R3F/Drei/Postprocessing | モダンな抽象化 | 4 |

---

## Level 5 WebGL/Shader の特徴

### 1. Visual Innovation（視覚的革新）

```glsl
Level 5 に必要なもの:
□ 見たことのない視覚表現
□ カスタムノイズアルゴリズム
□ 物理ベースの正確さと芸術的自由の融合
□ プロシージャル生成の独自性
□ ポストプロセスの独創的使用
```

**Level 5 の例:**
- Active Theory: ブランドアイデンティティに呼応する独自のシェーダー言語
- Immersive Garden: ストーリーに奉仕する3D（装飾ではなく）
- Bruno Simon: ゲームメカニクスとポートフォリオの融合

**Level 3 との違い:**
- Level 3: Three.js examplesの組み合わせ
- Level 5: 独自のシェーダー数学、新しいビジュアル文法

### 2. Technical Excellence（技術的卓越）

```
Level 5 Technical Requirements:
□ Core Web Vitals 達成（LCP < 2.5s with WebGL）
□ 60fps 維持（モバイル含む）
□ メモリ管理（リーク無し）
□ プログレッシブローディング
□ GPU最適化（テクスチャ圧縮、インスタンシング）
□ Graceful Degradation（低スペック対応）
```

### 3. Conceptual Integration（コンセプト統合）

```
Level 5 Integration:
- シェーダーが「装飾」ではなく「体験の核」
- インタラクションがストーリーを語る
- パフォーマンスとクオリティの妥協なし
- モーション、UI、3Dが一つの言語を話す
```

---

## Level 5 Shader Techniques

### Advanced Noise & Domain Warping

**Level 3:** 標準的なFBM
**Level 5:** ドメインワーピング + カスタムノイズ

```glsl
// Level 5: Domain Warping for Organic Complexity
vec2 domainWarp(vec2 p, float time) {
  vec2 q = vec2(
    fbm(p + vec2(0.0, 0.0)),
    fbm(p + vec2(5.2, 1.3))
  );

  vec2 r = vec2(
    fbm(p + 4.0 * q + vec2(1.7, 9.2) + 0.15 * time),
    fbm(p + 4.0 * q + vec2(8.3, 2.8) + 0.126 * time)
  );

  return fbm(p + 4.0 * r);
}

// Inigo Quilez-style SDF for procedural shapes
float sdHexagon(vec2 p, float r) {
  const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
  p = abs(p);
  p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
  p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
  return length(p) * sign(p.y);
}

// Level 5: Combining techniques for unique visuals
float complexPattern(vec2 uv, float time) {
  // Domain warp the UV space
  vec2 warped = uv + domainWarp(uv * 2.0, time) * 0.3;

  // Apply SDF-based pattern
  float pattern = sdHexagon(fract(warped * 8.0) - 0.5, 0.3);

  // Layer with noise
  float noise = fbm(warped * 4.0 + time * 0.1);

  return smoothstep(0.0, 0.1, pattern) * noise;
}
```

### GPU-Optimized Particle Systems

**Level 5 要件:** インスタンシング + カスタムシェーダー

```glsl
// Vertex Shader: Transform thousands of particles efficiently
attribute vec3 instancePosition;
attribute float instanceId;
uniform float uTime;
uniform sampler2D uDataTexture; // GPU-based simulation data

varying float vLife;

void main() {
  // Fetch particle data from texture (GPU simulation)
  vec4 data = texture2D(uDataTexture, vec2(instanceId / 1024.0, 0.5));
  vec3 particlePos = data.xyz;
  vLife = data.w;

  // Custom motion algorithm
  vec3 finalPos = position * (1.0 - vLife * 0.5) + particlePos;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
  gl_PointSize = (1.0 - vLife) * 20.0 / gl_Position.w;
}
```

```tsx
// React Three Fiber: Instanced Particles
function Level5Particles({ count = 10000 }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dataTexture = useMemo(() => {
    // GPU-based simulation using Data Texture
    const size = Math.ceil(Math.sqrt(count))
    const data = new Float32Array(size * size * 4)
    // Initialize particle data...
    return new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType)
  }, [count])

  useFrame((state) => {
    // Update shader uniforms
    meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime
    meshRef.current.material.uniforms.uDataTexture.value = dataTexture
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <planeGeometry args={[0.1, 0.1]} />
      <customParticleMaterial uDataTexture={dataTexture} />
    </instancedMesh>
  )
}
```

### Level 5 Post-Processing Pipeline

**コンセプト:** 独自のビジュアル言語を確立

```tsx
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

function Level5PostProcessing() {
  return (
    <EffectComposer multisampling={0}>
      {/* Custom bloom with artistic intent */}
      <Bloom
        intensity={0.8}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        blendFunction={BlendFunction.SCREEN}
      />

      {/* Subtle chromatic aberration for analog feel */}
      <ChromaticAberration
        offset={[0.001, 0.001]}
        blendFunction={BlendFunction.NORMAL}
      />

      {/* Custom vignette shader */}
      <Vignette
        offset={0.3}
        darkness={0.5}
        blendFunction={BlendFunction.MULTIPLY}
      />

      {/* Custom effect: Film grain with personality */}
      <CustomFilmGrain
        intensity={0.05}
        speed={0.3}
        blend={BlendFunction.OVERLAY}
      />
    </EffectComposer>
  )
}
```

### Scroll-Driven 3D (Level 5)

**Locomotive/Active Theory パターン:**

```tsx
import { useScroll } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

function ScrollDriven3D() {
  const scroll = useScroll()
  const meshRef = useRef<THREE.Mesh>(null!)

  useFrame(() => {
    if (!meshRef.current) return

    // Level 5: Non-linear, choreographed motion
    const offset = scroll.offset

    // Phase 1: Gentle rotation (0-0.3)
    if (offset < 0.3) {
      const t = offset / 0.3
      meshRef.current.rotation.y = t * Math.PI * 0.5
    }

    // Phase 2: Dramatic shift (0.3-0.5)
    else if (offset < 0.5) {
      const t = (offset - 0.3) / 0.2
      const eased = 1 - Math.pow(1 - t, 3) // ease-out-cubic
      meshRef.current.position.z = -10 * eased
      meshRef.current.scale.setScalar(1 + 2 * eased)
    }

    // Phase 3: Stabilize with micro-motion (0.5-1.0)
    else {
      const t = (offset - 0.5) / 0.5
      meshRef.current.rotation.x = Math.sin(t * Math.PI * 4) * 0.1
    }

    // Update custom shader uniforms based on scroll
    if (meshRef.current.material.uniforms) {
      meshRef.current.material.uniforms.uScrollProgress.value = offset
    }
  })

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 4]} />
      <customScrollMaterial />
    </mesh>
  )
}
```

---

## Performance Optimization (Level 5)

### Texture Compression & Loading

```tsx
import { useGLTF, useTexture } from '@react-three/drei'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'

// Level 5: Optimized asset loading
function OptimizedModel() {
  // KTX2 compressed textures (50-70% smaller)
  const texture = useTexture('/textures/diffuse.ktx2', (loader) => {
    if (loader instanceof KTX2Loader) {
      loader.setTranscoderPath('/basis/')
      loader.detectSupport(renderer)
    }
  })

  // DRACO compressed geometry
  const { scene } = useGLTF('/models/optimized.glb', true, true, (loader) => {
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/draco/')
    loader.setDRACOLoader(dracoLoader)
  })

  return <primitive object={scene} />
}

// Progressive loading strategy
function ProgressiveLoad() {
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('low')

  useEffect(() => {
    // Load low-res immediately
    const timer1 = setTimeout(() => setQuality('medium'), 100)
    const timer2 = setTimeout(() => setQuality('high'), 1000)
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  return <Model quality={quality} />
}
```

### GPU Memory Management

```tsx
// Level 5: Comprehensive cleanup
function WebGLScene() {
  const geometryRef = useRef<THREE.BufferGeometry>()
  const materialRef = useRef<THREE.Material>()
  const textureRef = useRef<THREE.Texture>()

  useEffect(() => {
    return () => {
      // Dispose all GPU resources
      geometryRef.current?.dispose()

      if (materialRef.current) {
        if (Array.isArray(materialRef.current)) {
          materialRef.current.forEach(mat => mat.dispose())
        } else {
          materialRef.current.dispose()
        }
      }

      textureRef.current?.dispose()

      // Clear references
      geometryRef.current = undefined
      materialRef.current = undefined
      textureRef.current = undefined
    }
  }, [])

  return <mesh ref={meshRef}>...</mesh>
}
```

### Shader Complexity Management

```glsl
// Level 5: Conditional compilation for performance tiers
#ifdef HIGH_QUALITY
  // Complex calculations for desktop
  float noise = fbm(uv * 8.0, 8); // 8 octaves
#else
  // Simplified for mobile
  float noise = fbm(uv * 4.0, 4); // 4 octaves
#endif

// LOD-based shader switching
uniform float uLOD; // 0 = high, 1 = medium, 2 = low

void main() {
  vec3 color;

  if (uLOD < 0.5) {
    // High quality: full effects
    color = complexShading(vPosition, vNormal, vUv);
  } else if (uLOD < 1.5) {
    // Medium: simplified lighting
    color = simplifiedShading(vPosition, vNormal);
  } else {
    // Low: basic coloring
    color = baseColor;
  }

  gl_FragColor = vec4(color, 1.0);
}
```

---

## Level 5 Quality Checklist

作業完了後、必ず以下を確認:

### The "Innovation" Test
```
□ 他のサイトで見たことのないエフェクトがあるか？
□ カスタムシェーダーアルゴリズムを使用しているか？
□ 技術的に新しい挑戦があるか？
```

### The "Performance" Test
```
□ LCP < 2.5s（WebGL含む）を達成しているか？
□ デスクトップで60fps、モバイルで30fps以上を維持しているか？
□ メモリリークがないか（長時間実行で確認）？
□ テクスチャ圧縮（KTX2/Basis）を使用しているか？
□ プログレッシブローディングを実装しているか？
```

### The "Integration" Test
```
□ 3Dが「装飾」ではなく「体験の核」になっているか？
□ UI、モーション、3Dが統一された言語を話しているか？
□ インタラクションに明確な意図があるか？
```

### The "Craft" Test
```
□ ローディング状態は美しいか？
□ エラー時（WebGL非対応）のフォールバックがあるか？
□ レスポンシブ対応（モバイル最適化）は完璧か？
□ アクセシビリティ（prefers-reduced-motion）に対応しているか？
```

### The "Emotion" Test
```
□ 3D体験が感情を呼び起こすか？
□ インタラクションが「発見の喜び」を与えるか？
□ 何度も触りたくなる要素があるか？
```

### The "Uniqueness" Test
```
□ Three.js examplesの組み合わせを超えているか？
□ ブランド/コンセプトに固有のビジュアル言語があるか？
□ スクリーンショットを撮りたくなるか？
```

---

## Anti-Patterns by Level

### Level 1-2: Generic WebGL（避ける）

```tsx
// ❌ Three.js example のコピペ
function GenericScene() {
  return (
    <Canvas>
      <mesh>
        <boxGeometry />
        <meshStandardMaterial color="orange" />
      </mesh>
    </Canvas>
  )
}
```

**問題:**
- 独自性がない
- 技術的深みがない
- 感情的インパクトなし

### Level 3: Refined But Generic（妥協点）

```tsx
// △ 洗練されているが、他と差別化できていない
function RefinedScene() {
  return (
    <Canvas>
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhysicalMaterial
          roughness={0.1}
          metalness={0.9}
          clearcoat={1.0}
        />
      </mesh>
      <EffectComposer>
        <Bloom intensity={1.0} />
      </EffectComposer>
    </Canvas>
  )
}
```

**問題:**
- 技術的には正しい
- しかし「見たことある」
- Level 4-5 への飛躍が必要

### Level 5: Award-Worthy（目標）

```tsx
// ✅ 独自のビジュアル言語 + 技術革新
function AwardWorthyScene() {
  const customShader = useCustomDomainWarpingShader()
  const scrollProgress = useScrollProgress()

  return (
    <Canvas>
      <ScrollDrivenGeometry
        shader={customShader}
        progress={scrollProgress}
      />
      <CustomPostProcessing
        brandColors={brandPalette}
        mood="ethereal-tension"
      />
      <GPUParticleSystem
        count={50000}
        behavior="fluid-organic"
      />
    </Canvas>
  )
}
```

**特徴:**
- カスタムシェーダー数学
- ブランド/コンセプトに固有
- パフォーマンスと美学の両立
- 技術的革新

---

## Core Technologies

- **Three.js**: 3D library for WebGL rendering
- **React Three Fiber (R3F)**: React renderer for Three.js
- **@react-three/drei**: Useful helpers and abstractions
- **@react-three/postprocessing**: Post-processing effects
- **GLSL**: OpenGL Shading Language for vertex/fragment shaders
- **KTX2/Basis**: GPU texture compression
- **DRACO**: Geometry compression

---

## Shader Fundamentals

### Vertex Shader Structure

```glsl
uniform float uTime;
uniform vec2 uResolution;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  vUv = uv;
  vPosition = position;
  vNormal = normal;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

### Fragment Shader Structure

```glsl
uniform float uTime;
uniform vec2 uResolution;
uniform sampler2D uTexture;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  vec3 color = vec3(0.0);

  // Shader logic here

  gl_FragColor = vec4(color, 1.0);
}
```

---

## Advanced Noise Library

### Simplex Noise (Optimized)

```glsl
// Simplex 2D noise by Ian McEwan
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                 + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                          dot(x12.zw,x12.zw)), 0.0);
  m = m*m;
  m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
```

### Voronoi Noise

```glsl
vec2 voronoiHash(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

// Returns (distance, cellID)
vec2 voronoi(vec2 uv, float time) {
  vec2 i_uv = floor(uv);
  vec2 f_uv = fract(uv);

  float minDist = 1.0;
  vec2 cellID = vec2(0.0);

  for(int y = -1; y <= 1; y++) {
    for(int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 point = voronoiHash(i_uv + neighbor);
      point = 0.5 + 0.5 * sin(time + 6.2831 * point);

      vec2 diff = neighbor + point - f_uv;
      float dist = length(diff);

      if(dist < minDist) {
        minDist = dist;
        cellID = i_uv + neighbor;
      }
    }
  }

  return vec2(minDist, cellID.x + cellID.y);
}
```

### Curl Noise (Fluid Flow)

```glsl
// Curl noise for fluid-like motion
vec2 curlNoise(vec2 p, float time) {
  float eps = 0.01;

  float n1 = snoise(p + vec2(0.0, eps));
  float n2 = snoise(p - vec2(0.0, eps));
  float n3 = snoise(p + vec2(eps, 0.0));
  float n4 = snoise(p - vec2(eps, 0.0));

  float x = (n1 - n2) / (2.0 * eps);
  float y = (n4 - n3) / (2.0 * eps);

  return vec2(x, y);
}
```

---

## React Three Fiber Patterns

### Custom Shader Material with TypeScript

```tsx
import { shaderMaterial } from '@react-three/drei'
import { extend, MaterialNode } from '@react-three/fiber'
import * as THREE from 'three'

// Define shader uniforms
const CustomMaterial = shaderMaterial(
  {
    uTime: 0,
    uResolution: new THREE.Vector2(),
    uMouse: new THREE.Vector2(),
    uColor1: new THREE.Color('#ff0000'),
    uColor2: new THREE.Color('#0000ff'),
  },
  // Vertex shader
  `
    varying vec2 vUv;
    varying vec3 vPosition;

    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec2 uMouse;
    uniform vec3 uColor1;
    uniform vec3 uColor2;

    varying vec2 vUv;
    varying vec3 vPosition;

    void main() {
      vec2 uv = vUv;
      vec3 color = mix(uColor1, uColor2, uv.x);
      gl_FragColor = vec4(color, 1.0);
    }
  `
)

extend({ CustomMaterial })

// TypeScript declarations
declare global {
  namespace JSX {
    interface IntrinsicElements {
      customMaterial: MaterialNode<typeof CustomMaterial, typeof CustomMaterial>
    }
  }
}

// Usage
function Scene() {
  const materialRef = useRef<typeof CustomMaterial>(null!)

  useFrame(({ clock, mouse }) => {
    materialRef.current.uTime = clock.elapsedTime
    materialRef.current.uMouse.set(mouse.x, mouse.y)
  })

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <customMaterial ref={materialRef} />
    </mesh>
  )
}
```

### Fullscreen Shader Background

```tsx
import { useThree } from '@react-three/fiber'

function FullscreenShader() {
  const { viewport } = useThree()

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <customMaterial />
    </mesh>
  )
}
```

---

## Handoff Protocol

### Frontend からの受け取り

```markdown
## [WebGL Specialist] への依頼

### 目的
Hero背景のカスタムシェーダー実装

### ビジュアルコンセプト (from Art Direction)
- Mood: Ethereal Tension（静謐な緊張感）
- Signature Moment: スクロール時にシェーダーが「呼吸」する

### 入力
- 参照画像: `/public/references/mood.jpg`
- ブランドカラー: `#1a1a2e` (暗部), `#16213e` (中間), `#0f3460` (明部)
- 要件: ドメインワーピング + Voronoi ノイズ

### 出力
- `src/components/HeroShaderBackground.tsx`
- Props: `intensity`, `speed`, `colors`, `className`

### パフォーマンス制約
- LCP影響を最小化（遅延ロード必須）
- モバイルで30fps以上維持
- Reduced Motion 対応
```

### Frontend への納品

```tsx
/**
 * HeroShaderBackground - Award-worthy custom shader background
 *
 * Features:
 * - Domain warping + Voronoi noise for organic complexity
 * - Scroll-driven "breathing" animation
 * - Brand color integration
 * - Performance optimized (mobile 30fps+)
 * - Reduced motion support
 *
 * @example
 * import dynamic from 'next/dynamic'
 * const HeroShader = dynamic(
 *   () => import('@/components/HeroShaderBackground'),
 *   { ssr: false }
 * )
 *
 * <HeroShader
 *   intensity={0.8}
 *   speed={0.3}
 *   colors={['#1a1a2e', '#16213e', '#0f3460']}
 *   className="absolute inset-0 -z-10"
 * />
 */
```

---

## Status Report Format

```markdown
## WebGL Specialist ステータス

### Excellence Level
- 現在: Level 4（独自のビジュアル言語確立）
- 目標: Level 5（技術的革新の追加）

### Quality Checklist
- Innovation Test: Pass（カスタムドメインワーピング）
- Performance Test: Pass（60fps desktop, 30fps mobile）
- Integration Test: Pass（Art Direction と統合）
- Craft Test: Pass（Reduced Motion 対応）
- Emotion Test: In Progress（"呼吸"アニメーション調整中）
- Uniqueness Test: Pass（Three.js examples を超えた）

### 完了
- カスタムドメインワーピングシェーダー実装
- ブランドカラー統合
- KTX2テクスチャ圧縮

### 進行中
- スクロール連動"呼吸"エフェクト: 85%
- モバイル最適化: パフォーマンステスト中

### ブロッカー
- なし

### Frontend 向け
- `HeroShaderBackground` 使用可能
- Props: intensity, speed, colors, className
- SSR非対応（dynamic import必須）
```

---

## Integration with Next.js

### Dynamic Import (SSR-safe)

```tsx
import dynamic from 'next/dynamic'

const ShaderBackground = dynamic(
  () => import('@/components/ShaderBackground'),
  { ssr: false, loading: () => <div className="bg-gradient-to-b from-dark to-darker" /> }
)
```

### Canvas Setup with Performance

```tsx
import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'

export default function OptimizedCanvas({ children }: { children: React.ReactNode }) {
  return (
    <Canvas
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      }}
      camera={{ position: [0, 0, 5], fov: 75 }}
      style={{ position: 'absolute', inset: 0 }}
      dpr={[1, 2]} // Limit pixel ratio
    >
      {/* Adaptive performance */}
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />

      {children}
    </Canvas>
  )
}
```

---

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

// Output noise directly
float n = snoise(vUv * 8.0);
gl_FragColor = vec4(vec3(n), 1.0);
```

### Common Issues

| Problem | Solution |
|---------|----------|
| Black screen | Check shader compilation errors in console |
| Flickering | Z-fighting - adjust near/far planes or use depth test |
| Low FPS | Reduce texture size, simplify shaders, use LOD |
| Artifacts | Check precision (`highp`, `mediump`), mobile may need `mediump` |
| No animation | Verify `useFrame` is updating uniforms |
| Memory leak | Ensure `dispose()` is called on unmount |

---

## Excellence Reminder

> **「技術は美学を可能にする手段。美学は感情を呼び起こす言語。」**
>
> Level 3: Three.js examples の組み合わせ
> Level 4: 独自のビジュアル言語
> Level 5: 技術的革新 + 感情的インパクト
>
> WebGL は「装飾」ではなく「体験の核」。
> パフォーマンスと美学は妥協しない。
> 見たことのない表現を目指す。

---

**最終更新**: 2025-12-09
**Excellence Level**: 5 (Award-Worthy) 対応完了
