# 2025-12-07 Fluid Gradient Integration Plan
- Created: 2025-12-07T20:39:46+0900 (Asia/Tokyo)
- **Completed: 2025-12-07T21:51:30+0900 (Asia/Tokyo)**
- **Status: DONE** ✅
- Purpose: `apps/cg-webgl-interactive-gradient` を `apps/web` へ統合する計画
- Scope: 設計・段取りのみ（実装は別タスクでClaude Codeに委譲）
- Model downstream: Claude Code (Haiku 4.5)
- Constraints: **コミット禁止** / 既存アーキテクチャ尊重 / 最小差分方針

---

## 完了サマリ

### 実装成果物
- `src/features/fluid-gradient/` - FluidGradientBackground コンポーネント一式
- `src/app/page.tsx` - Hero以外のセクションにモノトーンFluidGradient配置
- `fluidConfigMonochrome` プリセット追加

### 技術的解決
- Document-level マウスイベントで z-index 問題を解決
- Sticky パターンでセクション別背景を実現
- 背景透過のためコンポーネントから `bg-*` クラス削除

### ナレッジ
- `.ai/knowledge/2025-12-07-fluid-gradient-integration.md`

---

## 現状サマリ

### ソース: cg-webgl-interactive-gradient
- **Tech**: Vite + Three.js 0.178.0 + 純バニラJS
- **概要**: マウス追従の流体シミュレーション + 4色グラデーション歪みエフェクト
- **アーキテクチャ**:
  - Ping-pong レンダーターゲット（2枚のFloatテクスチャを交互使用）
  - Fluid Shader: 速度場のadvection/圧力勾配計算/マウス入力
  - Display Shader: 速度場をUV歪みに適用 + 三角関数ベースの4色ミックス
- **設定**: `config`オブジェクトで brushSize, colors, decay 等を管理
- **ファイル**:
  - `script.js`: メインロジック（180行）
  - `shaders.js`: GLSL定義（160行）
  - `styles.css`, `index.html`: レイアウト

### ターゲット: apps/web
- **Tech**: Next.js 16 (App Router) + React 19 + Tailwind v4 + Three.js 0.181.2 + GSAP
- **既存シェーダー実装**: `src/features/hero/` に HeroShaderBackground
  - feature-based モジュール構成
  - `shader/config/hero.ts`: 中央集権的な設定ファイル
  - `shader/materials/hero.ts`: Vertex/Fragment シェーダー定義
  - `shader/core/`: GLSL共通パーツ (hash, noise, fbm)
- **GL ユーティリティ**: `src/shared/gl/` (renderer, texture, support)
- **パターン**: Reactライフサイクル + useEffect でThree.js管理

---

## 統合方針

### 1. ディレクトリ構成

```
apps/web/src/features/fluid-gradient/
├── components/
│   ├── FluidGradientBackground.tsx   # メインコンポーネント (client)
│   └── index.ts
├── shader/
│   ├── config/
│   │   ├── fluid.ts                  # 設定パラメータ (TypeScript)
│   │   └── index.ts
│   ├── materials/
│   │   ├── fluid.ts                  # fluidShader
│   │   ├── display.ts                # displayShader
│   │   └── index.ts
│   └── index.ts
└── index.ts
```

### 2. 技術的な変換ポイント

| 元 (Vite/Vanilla) | 変換後 (Next.js/React) |
|-------------------|------------------------|
| グローバル変数 | useRef + useEffect ライフサイクル |
| `const config = {}` | TypeScript型付きconfigファイル |
| `document.addEventListener` | useEffect内でリスナー登録/解除 |
| `requestAnimationFrame` 直接呼び出し | useEffect内のアニメーションループ |
| `window.resize` 直接 | useEffect + ResizeObserver or window.resize |
| DOM操作 | React ref経由でcanvas取得 |

### 3. コンポーネント設計

```tsx
// FluidGradientBackground.tsx (概念)
'use client'

import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { fluidConfig, type FluidConfig } from '../shader/config/fluid'

interface Props {
  className?: string
  config?: Partial<FluidConfig>
}

export function FluidGradientBackground({ className, config: overrides }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  // ... ping-pong targets, materials, etc.

  useEffect(() => {
    // 初期化: renderer, targets, materials, geometry
    // マウス/リサイズリスナー登録
    // アニメーションループ開始

    return () => {
      // クリーンアップ: dispose all, remove listeners
    }
  }, [])

  return <div ref={containerRef} className={className} />
}
```

### 4. 設定ファイル設計

```typescript
// shader/config/fluid.ts
export interface FluidConfig {
  // Brush
  brushSize: number       // 25.0
  brushStrength: number   // 0.5

  // Fluid dynamics
  fluidDecay: number      // 0.98
  trailLength: number     // 0.8
  stopDecay: number       // 0.85

  // Display
  distortionAmount: number // 2.5
  colorIntensity: number   // 1.0
  softness: number         // 1.0

  // Colors (hex)
  color1: string  // "#b8fff7"
  color2: string  // "#6e3466"
  color3: string  // "#0133ff"
  color4: string  // "#66d1fe"
}

export const fluidConfig: FluidConfig = {
  brushSize: 25.0,
  brushStrength: 0.5,
  // ...
}
```

### 5. シェーダー移植

- `shaders.js` → TypeScript文字列テンプレート化
- 既存パターンに従い `shader/materials/fluid.ts`, `shader/materials/display.ts` に分離
- 共通の `vertexShader` は `shader/core/vertex.glsl.ts` として共有化検討

### 6. 既存GLユーティリティの活用

- `shared/gl/renderer.ts`: パフォーマンス設定（powerPreference, maxPixelRatio）
- `shared/gl/support.ts`: WebGL対応チェック → フォールバック表示

---

## 使用シナリオ

### A案: Hero背景として使用
- 既存 `HeroShaderBackground` と並列で選択可能に
- `layout.tsx` で切り替えフラグ or 環境変数で制御

### B案: Interactive ページ専用背景
- `/interactive` ページの背景として配置
- Hero は従来のシェーダーを維持

### C案: 汎用コンポーネント
- Props で用途に応じたプリセットを渡す
- 複数ページで再利用可能

**推奨**: B案 または C案（既存Heroを壊さない）

---

## 実装ステップ（Claude Code委譲用）

1. **ディレクトリ/ファイル作成**
   - `src/features/fluid-gradient/` 構造を作成

2. **設定ファイル**
   - `shader/config/fluid.ts` を TypeScript で定義

3. **シェーダー移植**
   - `shader/materials/fluid.ts`: fluidShader
   - `shader/materials/display.ts`: displayShader
   - 共通 vertex は既存パターンに合わせる

4. **メインコンポーネント**
   - `FluidGradientBackground.tsx` を実装
   - useEffect でライフサイクル管理
   - Ping-pong レンダーターゲット
   - マウス/リサイズ対応
   - クリーンアップ徹底

5. **ページ統合**
   - `/interactive` ページ等に配置
   - レイアウト調整（z-index, position）

6. **品質確認**
   - WebGL非対応時のフォールバック
   - メモリリーク防止（dispose）
   - レスポンシブ動作

---

## 注意事項

- **コミット禁止**: 実装後もコミットは行わない
- **最小差分**: 既存コードへの変更は最小限
- **既存パターン尊重**: `hero/` のシェーダー構成パターンに従う
- **パフォーマンス**: Ping-pong は GPU メモリ消費大 → 4K では解像度制限を検討
- **依存追加なし**: Three.js は既存なので追加不要

---

## 関連ファイル

### ソース
- `apps/cg-webgl-interactive-gradient/script.js`
- `apps/cg-webgl-interactive-gradient/shaders.js`

### 参考（既存実装パターン）
- `apps/web/src/features/hero/components/HeroShaderBackground.tsx`
- `apps/web/src/features/hero/shader/config/hero.ts`
- `apps/web/src/features/hero/shader/materials/hero.ts`
- `apps/web/src/shared/gl/renderer.ts`
