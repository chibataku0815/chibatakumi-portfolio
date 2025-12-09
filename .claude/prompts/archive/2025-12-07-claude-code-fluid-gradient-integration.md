# 2025-12-07 Claude Code 実装プロンプト（Fluid Gradient → apps/web）
- Created: 2025-12-07T20:39:46+0900 (Asia/Tokyo)
- Model: Claude Code (Haiku 4.5)
- Purpose: `apps/cg-webgl-interactive-gradient` の流体グラデーションエフェクトを `apps/web` へ移植
- Constraints: **コミット禁止**、最小差分、既存アーキテクチャ尊重、依存追加なし
- Scope: `apps/web` 配下のみ

---

## コンテキスト

### Stack
- Next.js 16 (App Router) + React 19 + Tailwind v4 + Three.js 0.181.2
- パスエイリアス: `@/* → ./src/*`

### 参照すべきソースコード
- **移植元**: `apps/cg-webgl-interactive-gradient/script.js`, `shaders.js`
- **既存パターン**: `apps/web/src/features/hero/` のシェーダー構成

### 既存パターンの特徴
- feature-based ディレクトリ構成
- `shader/config/` に TypeScript 設定ファイル
- `shader/materials/` に GLSL を TypeScript 文字列で定義
- `shader/core/` に共通GLSL関数
- `shared/gl/` にレンダラー/テクスチャユーティリティ

---

## 期待する成果物

1. `src/features/fluid-gradient/` ディレクトリ構造
2. 設定ファイル: `shader/config/fluid.ts`
3. シェーダー: `shader/materials/fluid.ts`, `shader/materials/display.ts`
4. コンポーネント: `components/FluidGradientBackground.tsx`
5. `/interactive` ページへの統合（背景として配置）

---

## 実装指示

### Step 1: ディレクトリ構造作成

以下の構造を作成する:

```
src/features/fluid-gradient/
├── components/
│   ├── FluidGradientBackground.tsx
│   └── index.ts
├── shader/
│   ├── config/
│   │   ├── fluid.ts
│   │   └── index.ts
│   ├── materials/
│   │   ├── vertex.ts
│   │   ├── fluid.ts
│   │   ├── display.ts
│   │   └── index.ts
│   └── index.ts
└── index.ts
```

各 `index.ts` は適切な re-export を行う。

---

### Step 2: 設定ファイル作成

`shader/config/fluid.ts`:

```typescript
export interface FluidConfig {
  // Brush parameters
  brushSize: number
  brushStrength: number

  // Fluid dynamics
  fluidDecay: number
  trailLength: number
  stopDecay: number

  // Display
  distortionAmount: number
  colorIntensity: number
  softness: number

  // Colors (hex string)
  color1: string
  color2: string
  color3: string
  color4: string
}

export const fluidConfig: FluidConfig = {
  brushSize: 25.0,
  brushStrength: 0.5,
  fluidDecay: 0.98,
  trailLength: 0.8,
  stopDecay: 0.85,
  distortionAmount: 2.5,
  colorIntensity: 1.0,
  softness: 1.0,
  color1: '#b8fff7',
  color2: '#6e3466',
  color3: '#0133ff',
  color4: '#66d1fe',
}

export function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return [r, g, b]
}
```

---

### Step 3: シェーダー移植

#### `shader/materials/vertex.ts`
`apps/cg-webgl-interactive-gradient/shaders.js` の `vertexShader` をそのまま移植:

```typescript
export const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
```

#### `shader/materials/fluid.ts`
`shaders.js` の `fluidShader` を移植。内容は変更せず TypeScript 文字列として定義:

```typescript
export const fluidShader = /* glsl */ `
  // ... 元の fluidShader の内容をそのまま貼り付け
`
```

#### `shader/materials/display.ts`
`shaders.js` の `displayShader` を移植:

```typescript
export const displayShader = /* glsl */ `
  // ... 元の displayShader の内容をそのまま貼り付け
`
```

---

### Step 4: メインコンポーネント実装

`components/FluidGradientBackground.tsx`:

```typescript
'use client'

import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { fluidConfig, hexToRgb, type FluidConfig } from '../shader/config/fluid'
import { vertexShader } from '../shader/materials/vertex'
import { fluidShader } from '../shader/materials/fluid'
import { displayShader } from '../shader/materials/display'

interface Props {
  className?: string
  config?: Partial<FluidConfig>
}

export function FluidGradientBackground({ className, config: overrides }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Merge config with overrides
    const cfg = { ...fluidConfig, ...overrides }

    // === Three.js Setup ===
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const renderer = new THREE.WebGLRenderer({ antialias: true })

    let width = container.clientWidth
    let height = container.clientHeight
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    container.appendChild(renderer.domElement)

    // === Render Targets (Ping-Pong) ===
    const targetOptions = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
    }
    let fluidTarget1 = new THREE.WebGLRenderTarget(width, height, targetOptions)
    let fluidTarget2 = new THREE.WebGLRenderTarget(width, height, targetOptions)
    let currentTarget = fluidTarget1
    let previousTarget = fluidTarget2

    // === Materials ===
    const fluidMaterial = new THREE.ShaderMaterial({
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector2(width, height) },
        iMouse: { value: new THREE.Vector4(0, 0, 0, 0) },
        iFrame: { value: 0 },
        iPreviousFrame: { value: null },
        uBrushSize: { value: cfg.brushSize },
        uBrushStrength: { value: cfg.brushStrength },
        uFluidDecay: { value: cfg.fluidDecay },
        uTrailLength: { value: cfg.trailLength },
        uStopDecay: { value: cfg.stopDecay },
      },
      vertexShader,
      fragmentShader: fluidShader,
    })

    const displayMaterial = new THREE.ShaderMaterial({
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector2(width, height) },
        iFluid: { value: null },
        uDistortionAmount: { value: cfg.distortionAmount },
        uColor1: { value: new THREE.Vector3(...hexToRgb(cfg.color1)) },
        uColor2: { value: new THREE.Vector3(...hexToRgb(cfg.color2)) },
        uColor3: { value: new THREE.Vector3(...hexToRgb(cfg.color3)) },
        uColor4: { value: new THREE.Vector3(...hexToRgb(cfg.color4)) },
        uColorIntensity: { value: cfg.colorIntensity },
        uSoftness: { value: cfg.softness },
      },
      vertexShader,
      fragmentShader: displayShader,
    })

    // === Geometry & Meshes ===
    const geometry = new THREE.PlaneGeometry(2, 2)
    const fluidPlane = new THREE.Mesh(geometry, fluidMaterial)
    const displayPlane = new THREE.Mesh(geometry, displayMaterial)

    // === Mouse State ===
    let mouseX = 0, mouseY = 0
    let prevMouseX = 0, prevMouseY = 0
    let lastMoveTime = 0
    let frameCount = 0

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      prevMouseX = mouseX
      prevMouseY = mouseY
      mouseX = e.clientX - rect.left
      mouseY = rect.height - (e.clientY - rect.top)
      lastMoveTime = performance.now()
      fluidMaterial.uniforms.iMouse.value.set(mouseX, mouseY, prevMouseX, prevMouseY)
    }

    const handleMouseLeave = () => {
      fluidMaterial.uniforms.iMouse.value.set(0, 0, 0, 0)
    }

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)

    // === Resize Handler ===
    const handleResize = () => {
      width = container.clientWidth
      height = container.clientHeight
      renderer.setSize(width, height)
      fluidMaterial.uniforms.iResolution.value.set(width, height)
      displayMaterial.uniforms.iResolution.value.set(width, height)
      fluidTarget1.setSize(width, height)
      fluidTarget2.setSize(width, height)
      frameCount = 0
    }

    window.addEventListener('resize', handleResize)

    // === Animation Loop ===
    let animationId: number

    const animate = () => {
      animationId = requestAnimationFrame(animate)

      const time = performance.now() * 0.001
      fluidMaterial.uniforms.iTime.value = time
      displayMaterial.uniforms.iTime.value = time
      fluidMaterial.uniforms.iFrame.value = frameCount

      // Reset mouse if no movement for 100ms
      if (performance.now() - lastMoveTime > 100) {
        fluidMaterial.uniforms.iMouse.value.set(0, 0, 0, 0)
      }

      // Render fluid simulation
      fluidMaterial.uniforms.iPreviousFrame.value = previousTarget.texture
      renderer.setRenderTarget(currentTarget)
      renderer.render(fluidPlane, camera)

      // Render display
      displayMaterial.uniforms.iFluid.value = currentTarget.texture
      renderer.setRenderTarget(null)
      renderer.render(displayPlane, camera)

      // Swap targets
      const temp = currentTarget
      currentTarget = previousTarget
      previousTarget = temp

      frameCount++
    }

    animate()

    // === Cleanup ===
    return () => {
      cancelAnimationFrame(animationId)
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('resize', handleResize)

      geometry.dispose()
      fluidMaterial.dispose()
      displayMaterial.dispose()
      fluidTarget1.dispose()
      fluidTarget2.dispose()
      renderer.dispose()

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={containerRef} className={className} />
}
```

---

### Step 5: index.ts ファイル作成

#### `components/index.ts`
```typescript
export { FluidGradientBackground } from './FluidGradientBackground'
```

#### `shader/config/index.ts`
```typescript
export * from './fluid'
```

#### `shader/materials/index.ts`
```typescript
export { vertexShader } from './vertex'
export { fluidShader } from './fluid'
export { displayShader } from './display'
```

#### `shader/index.ts`
```typescript
export * from './config'
export * from './materials'
```

#### `features/fluid-gradient/index.ts`
```typescript
export * from './components'
export * from './shader'
```

---

### Step 6: Interactive ページへ統合

`src/app/interactive/page.tsx` を編集し、FluidGradientBackground を背景として追加:

```typescript
import { FluidGradientBackground } from '@/features/fluid-gradient'

export default function InteractivePage() {
  return (
    <main className="relative min-h-screen">
      {/* 背景 */}
      <FluidGradientBackground className="fixed inset-0 -z-10" />

      {/* コンテンツ */}
      <div className="relative z-10">
        {/* 既存コンテンツ */}
      </div>
    </main>
  )
}
```

---

## 品質チェックリスト

- [ ] TypeScript エラーがないこと
- [ ] useEffect の return でクリーンアップが完全であること
- [ ] WebGLRenderer, RenderTarget, Material, Geometry すべて dispose されること
- [ ] イベントリスナーが解除されること
- [ ] 既存の `hero/` 構造と一貫したファイル構成であること

---

## 禁止事項

1. **コミットを行わない** - 実装完了後もコミットは禁止
2. **依存追加しない** - Three.js は既存、新規パッケージ不要
3. **既存ファイルを不必要に変更しない** - `/interactive` ページ以外の変更は最小限
4. **console.log を残さない** - デバッグコードは削除
5. **any 型を使わない** - 適切な型定義を行う

---

## 参照ファイル

### ソース（移植元）
- `apps/cg-webgl-interactive-gradient/script.js`
- `apps/cg-webgl-interactive-gradient/shaders.js`

### パターン参照（既存実装）
- `apps/web/src/features/hero/components/HeroShaderBackground.tsx`
- `apps/web/src/features/hero/shader/config/hero.ts`
- `apps/web/src/features/hero/shader/materials/hero.ts`
