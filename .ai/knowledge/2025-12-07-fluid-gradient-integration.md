# FluidGradient Integration Knowledge

- Created: 2025-12-07T21:51:30+0900 (Asia/Tokyo)
- Status: Completed
- Scope: WebGL流体シミュレーション背景の統合

---

## 概要

`apps/cg-webgl-interactive-gradient`（Vite + Vanilla JS）のWebGL流体シミュレーションを`apps/web`（Next.js 16 + React 19）に統合した。

---

## 実装アーキテクチャ

### ディレクトリ構成

```
apps/web/src/features/fluid-gradient/
├── components/
│   ├── FluidGradientBackground.tsx   # メインコンポーネント
│   └── index.ts
├── shader/
│   ├── config/
│   │   ├── fluid.ts                  # 設定パラメータ + プリセット
│   │   └── index.ts
│   ├── materials/
│   │   ├── fluid.ts                  # fluidShader (流体シミュレーション)
│   │   ├── display.ts                # displayShader (表示用)
│   │   └── index.ts
│   └── index.ts
└── index.ts
```

### 技術的特徴

| 技術 | 用途 |
|------|------|
| Ping-Pong Render Targets | 流体シミュレーションの状態保持 |
| THREE.FloatType | 高精度なテクスチャデータ |
| GLSL Fragment Shader | 速度場計算・UV歪み・4色グラデーション |
| Document-level Events | z-index下層でもマウス追従可能 |

---

## 重要な知見

### 1. z-index と マウスイベント問題

**問題**: FluidGradientを負のz-indexで配置すると、上層コンテンツがマウスイベントを遮蔽

**解決策**: `document.addEventListener` を使用（container要素ではなく）

```typescript
// NG: container.addEventListener - z-index で遮蔽される
// OK: document.addEventListener - 常にマウス追従可能
document.addEventListener("mousemove", handleMouseMove);
document.addEventListener("mouseleave", handleMouseLeave);
```

### 2. セクション別背景の実装パターン

Hero以外のセクションにのみ背景を表示する場合の sticky パターン:

```tsx
<div className="relative">
  {/* Sticky container - Hero以降に固定表示 */}
  <div className="sticky top-0 h-screen w-full -z-[5]">
    <FluidGradientBackground className="absolute inset-0" />
  </div>

  {/* Content overlays - 負のマージンで重ねる */}
  <div className="relative -mt-[100vh]">
    <HorizontalWorks />
    <SpotlightGallery />
  </div>
</div>
```

### 3. z-index 階層設計

```
-z-10: HeroShaderBackground (layout.tsx)
-z-[5]: FluidGradientBackground (page.tsx)
z-0以上: コンテンツ
```

### 4. 背景透過のための変更

コンポーネントに `bg-[var(--bg-darker)]` が設定されていると FluidGradient が見えない。背景を透過させるには該当クラスを削除。

---

## 設定プリセット

### デフォルト（カラフル）

```typescript
export const fluidConfig: FluidConfig = {
  brushSize: 25.0,
  brushStrength: 0.5,
  fluidDecay: 0.98,
  trailLength: 0.8,
  stopDecay: 0.85,
  distortionAmount: 2.5,
  colorIntensity: 1.0,
  softness: 1.0,
  color1: "#b8fff7",
  color2: "#6e3466",
  color3: "#0133ff",
  color4: "#66d1fe",
};
```

### モノトーン（Radix slate ベース）

```typescript
export const fluidConfigMonochrome: Partial<FluidConfig> = {
  color1: "#27272a", // slate-4
  color2: "#3f3f46", // slate-6
  color3: "#52525b", // slate-8
  color4: "#71717a", // slate-10
  colorIntensity: 1.0,
  softness: 0.6,
  distortionAmount: 2.5,
  brushSize: 30.0,
  brushStrength: 0.6,
};
```

---

## クリーンアップ必須項目

FluidGradientBackground の useEffect return で必ず以下を実施:

1. `cancelAnimationFrame(animationId)`
2. `document.removeEventListener` (mousemove, mouseleave)
3. `window.removeEventListener("resize", handleResize)`
4. `geometry.dispose()`
5. `fluidMaterial.dispose()`
6. `displayMaterial.dispose()`
7. `fluidTarget1.dispose()`
8. `fluidTarget2.dispose()`
9. `renderer.dispose()`
10. `container.removeChild(renderer.domElement)`

---

## 関連ファイル

- `src/features/fluid-gradient/` - 実装一式
- `src/app/page.tsx` - 使用例（sticky パターン）
- `src/features/works/horizontal/HorizontalWorks.tsx` - 背景透過対応
- `src/features/works/spotlight/SpotlightGallery.tsx` - 背景透過対応
