# 2025-12-07 Claude Code 実装プロンプト（FluidGradient セクション背景）
- Created: 2025-12-07T21:10:00+0900 (Asia/Tokyo)
- Model: Claude Code (Haiku 4.5)
- Purpose: Hero以外のセクションにモノトーンFluidGradientBackgroundを適用
- Constraints: **コミット禁止**、最小差分、既存アーキテクチャ尊重
- Scope: `apps/web` 配下のみ

---

## 背景と目的

### 要件
1. **Hero セクション**: 元の `HeroShaderBackground` を維持（layout.tsx、変更なし）
2. **他セクション** (HorizontalWorks, SpotlightGallery 等): `FluidGradientBackground` を背景として追加
3. **色設定**: モノトーン（グレースケール、Radix slate ベース）
4. **インタラクション**: マウス反応を維持

### 現在の問題
- `interactive/page.tsx` に配置された FluidGradientBackground が layout の HeroShaderBackground と重複

---

## 期待する成果物

1. `src/features/fluid-gradient/shader/config/fluid.ts` - モノトーンプリセット追加
2. `src/app/page.tsx` - Hero以外のセクションにFluidGradient配置
3. `src/app/interactive/page.tsx` - 重複背景削除

---

## 実装指示

### Step 1: モノトーンプリセットを追加

`src/features/fluid-gradient/shader/config/fluid.ts` を編集:

```typescript
/**
 * Fluid Gradient Shader Configuration
 * 調整ポイントはこのファイルで一元管理
 */

export interface FluidConfig {
  // Brush parameters
  brushSize: number;
  brushStrength: number;

  // Fluid dynamics
  fluidDecay: number;
  trailLength: number;
  stopDecay: number;

  // Display
  distortionAmount: number;
  colorIntensity: number;
  softness: number;

  // Colors (hex string)
  color1: string;
  color2: string;
  color3: string;
  color4: string;
}

/** デフォルト設定（カラフル） */
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

/** モノトーン設定（Radix slate ベース） */
export const fluidConfigMonochrome: Partial<FluidConfig> = {
  color1: "#111113", // slate-1
  color2: "#1c1c1f", // slate-3
  color3: "#27272a", // slate-5
  color4: "#3f3f46", // slate-7
  colorIntensity: 0.9,
  softness: 1.5,
  distortionAmount: 2.0,
};

export function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}
```

### Step 2: index.ts で re-export 追加

`src/features/fluid-gradient/shader/config/index.ts` を確認し、`fluidConfigMonochrome` をエクスポート:

```typescript
export * from "./fluid";
```

（既に `export *` なら変更不要）

---

### Step 3: page.tsx を編集（index ページ）

`src/app/page.tsx` を編集し、Hero以外のセクションに FluidGradient を背景として配置:

```typescript
import { HeroText } from "@/features/hero/components";
import { HorizontalWorks, SpotlightGallery } from "@/features/works";
import { FluidGradientBackground, fluidConfigMonochrome } from "@/features/fluid-gradient";

export default function Home() {
  return (
    <main>
      {/* Hero Section - uses HeroShaderBackground from layout.tsx */}
      <section className="relative">
        <HeroText />
      </section>

      {/* Works Sections with Fluid Gradient Background */}
      <div className="relative">
        {/* Monochrome Fluid Background for sections below Hero */}
        <FluidGradientBackground
          className="fixed inset-0 -z-5"
          config={fluidConfigMonochrome}
        />

        {/* Horizontal Works Section */}
        <HorizontalWorks />

        {/* Spotlight Gallery */}
        <SpotlightGallery />

        {/* Footer spacer */}
        <section className="h-[50vh] bg-[var(--bg-darker)]" />
      </div>
    </main>
  );
}
```

**注意**: `className="fixed inset-0 -z-5"` で Hero 背景 (`-z-10`) より手前、コンテンツより奥に配置。

**z-index 階層**:
- `-z-10`: HeroShaderBackground (layout.tsx)
- `-z-5`: FluidGradientBackground (page.tsx、Hero以下セクション用)
- `z-0` 以上: コンテンツ

---

### Step 4: interactive/page.tsx から重複削除

`src/app/interactive/page.tsx` を編集し、FluidGradientBackground を削除:

**削除:**
```typescript
import { FluidGradientBackground } from "@/features/fluid-gradient";
```

**削除:**
```tsx
<FluidGradientBackground className="fixed inset-0 -z-10" />
```

**理由**: interactive ページは layout.tsx の HeroShaderBackground を使用。FluidGradient は index ページの特定セクションのみで使用。

---

## 代替案: Hero 以降のみに表示される背景

もし FluidGradient を Hero セクションより下にのみ表示したい場合（Hero 部分では非表示）:

```tsx
{/* Hero Section */}
<section className="relative min-h-screen">
  <HeroText />
</section>

{/* Fluid background starts here */}
<div className="relative">
  <div className="sticky top-0 h-screen -z-5">
    <FluidGradientBackground
      className="absolute inset-0"
      config={fluidConfigMonochrome}
    />
  </div>

  {/* Content overlays the sticky background */}
  <div className="relative z-10">
    <HorizontalWorks />
    <SpotlightGallery />
    <section className="h-[50vh] bg-[var(--bg-darker)]" />
  </div>
</div>
```

この方法では `sticky` を使用して、スクロールしても背景が固定される。

---

## 品質チェックリスト

- [ ] TypeScript エラーがないこと
- [ ] Hero セクションは元の HeroShaderBackground が表示されること
- [ ] Hero 以降のセクションでモノトーン FluidGradient が表示されること
- [ ] マウス操作で流体が反応すること
- [ ] z-index の階層が正しく、コンテンツが読めること
- [ ] interactive ページで背景が重複していないこと

---

## 禁止事項

1. **コミットを行わない**
2. **layout.tsx の HeroShaderBackground を削除/変更しない**
3. **新規依存を追加しない**
4. **console.log を残さない**

---

## 参照ファイル

### 変更対象
- `apps/web/src/features/fluid-gradient/shader/config/fluid.ts` (編集)
- `apps/web/src/app/page.tsx` (編集)
- `apps/web/src/app/interactive/page.tsx` (編集)

### 変更なし
- `apps/web/src/app/layout.tsx` (HeroShaderBackground 維持)
