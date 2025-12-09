# Phase 1 実装ナレッジベース

**作成日:** 2025-12-09
**対象フェーズ:** Phase 1 - Quick Wins

このドキュメントは Phase 1 実装で得られた知見、パターン、ベストプラクティスを記録します。

---

## 📚 目次

1. [WebGL Shader 最適化パターン](#webgl-shader-最適化パターン)
2. [Motion Design タイミングシステム](#motion-design-タイミングシステム)
3. [アクセシビリティ実装パターン](#アクセシビリティ実装パターン)
4. [Next.js App Router 規約](#nextjs-app-router-規約)
5. [コンポーネント設計原則](#コンポーネント設計原則)

---

## WebGL Shader 最適化パターン

### Origin Glow の軽量化戦略

#### Profile 版（重量版）
```glsl
// 2 noise layers + FBM
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

// Layer 1: Radial glow
// Layer 2: Noise distortion with FBM
```

**用途:** Profile ページ（滞在時間長、視覚的インパクト重視）

#### Loading 版（軽量版）
```glsl
// Single noise layer
float noise(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Single layer: Radial glow with simple noise
float n = noise(vUv * 4.0 + uTime * 0.3);
float glow = smoothstep(radius, 0.0, dist + n * 0.08) * pulse;
```

**用途:** Loading ページ（表示時間短、パフォーマンス優先）

#### パフォーマンス比較

| 項目 | Profile 版 | Loading 版 |
|------|-----------|-----------|
| Noise Layers | 2 | 1 |
| FBM Octaves | 4 | 0 |
| Fragment Shader 複雑度 | High | Low |
| モバイル FPS | 20-25 | 30+ |
| 推奨用途 | 主要セクション | 一時的 UI |

#### 設計原則

**🎯 重量版が適切なケース:**
- ページの主要ビジュアル要素
- 滞在時間が長いセクション（30秒以上）
- ユーザーの視線が集中する領域
- デスクトップメイン

**🎯 軽量版が適切なケース:**
- 一時的な UI（Loading, Transition）
- 背景的な装飾要素
- 表示時間が短い（< 5秒）
- モバイル最適化が重要

---

## Motion Design タイミングシステム

### 統一タイミング仕様

Phase 1 で確立された Motion Design タイミング標準:

```typescript
// === Core Timing Values ===
const MOTION_TIMING = {
  // Text animations
  textEntry: {
    duration: 0.6, // 600ms
    ease: "cubic-bezier(0.22, 1, 0.36, 1)", // 自信ある登場
    delay: 0.4, // Default stagger base
  },

  // Cursor/pointer interactions
  cursorFollow: {
    duration: 0.6, // 600ms
    ease: "power2.out",
  },

  // Pulse/breathing animations
  pulse: {
    duration: 1.5, // 1.5s cycle
    ease: "sine.inOut",
  },

  // Stagger patterns
  stagger: {
    dots: [0, 0.2, 0.4], // Loading dots
    chars: 0.02, // Character reveals
    elements: 0.06, // Element sequences
  },
};
```

### 実装例

#### AnimatedHeading（簡略版）
```typescript
useEffect(() => {
  gsap.set(heading, {
    opacity: 0,
    y: 24,
    filter: "blur(8px)",
  });

  gsap.to(heading, {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.6, // ← MOTION_TIMING.textEntry.duration
    ease: "cubic-bezier(0.22, 1, 0.36, 1)", // ← MOTION_TIMING.textEntry.ease
    delay: 0.4, // ← MOTION_TIMING.textEntry.delay
    clearProps: "filter",
  });
}, [delay]);
```

#### CursorLight
```typescript
const handlePointerMove = (e: PointerEvent) => {
  gsap.to(lightRef.current, {
    x: e.clientX,
    y: e.clientY,
    duration: 0.6, // ← MOTION_TIMING.cursorFollow.duration
    ease: "power2.out", // ← MOTION_TIMING.cursorFollow.ease
  });
};
```

#### Origin Glow Pulse（Shader）
```glsl
uniform float uPulseSpeed; // 1.5s cycle → PI / 1.5

void main() {
  // 1.5s cycle pulse
  float pulse = sin(uTime * uPulseSpeed) * uPulseAmount + (1.0 - uPulseAmount);
  // uPulseSpeed = 1.5 → 1.5秒で 1 サイクル
}
```

#### Stagger Dots（Loading）
```tsx
<div className="flex gap-2">
  <div style={{ animationDelay: "0s" }} />    {/* MOTION_TIMING.stagger.dots[0] */}
  <div style={{ animationDelay: "0.2s" }} />  {/* MOTION_TIMING.stagger.dots[1] */}
  <div style={{ animationDelay: "0.4s" }} />  {/* MOTION_TIMING.stagger.dots[2] */}
</div>
```

### Easing カーブの使い分け

| Easing | 用途 | 感情 |
|--------|------|------|
| `cubic-bezier(0.22, 1, 0.36, 1)` | テキスト登場 | 自信、確信 |
| `power2.out` | カーソル追従、hover | 自然、応答的 |
| `sine.inOut` | 脈動、呼吸 | 有機的、落ち着き |
| `expo.out` | Hero セクション登場 | ドラマチック、印象的 |

---

## アクセシビリティ実装パターン

### Reduced Motion 対応

#### Shader での実装
```typescript
useEffect(() => {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uPulseSpeed: { value: prefersReducedMotion ? 0 : 1.5 }, // 0 で停止
      uPulseAmount: { value: prefersReducedMotion ? 0 : 0.2 },
    },
  });
}, []);
```

#### GSAP アニメーション（SkillsClient 実装例）
```typescript
// スケルトン表示時間の調整
const minDisplayTime = prefersReducedMotion ? 400 : 800;

// アニメーション duration の調整
const duration = prefersReducedMotion ? 0.3 : 0.9;
```

### ARIA 属性

#### Loading 状態
```tsx
<div
  ref={containerRef}
  aria-label="Loading"
  aria-live="polite"  // スクリーンリーダーに穏やかに通知
/>
```

#### 装飾要素
```tsx
<div
  className="cursor-light"
  aria-hidden="true"  // 装飾のみ、読み上げ不要
/>
```

#### エラー状態
```tsx
<main role="main">  {/* メインコンテンツ */}
  <h1>404</h1>  {/* 見出し階層を維持 */}
  <Link href="/">  {/* <button> ではなく <Link> でキーボードナビゲーション */}
    Find Your Way Home
  </Link>
</main>
```

---

## Next.js App Router 規約

### 特殊ファイルの役割

| ファイル | 用途 | Client/Server | 必須要素 |
|---------|------|---------------|---------|
| `loading.tsx` | Suspense fallback | Client or Server | - |
| `not-found.tsx` | 404 page | Client or Server | - |
| `error.tsx` | Error Boundary | **Client only** | `"use client"`, `error`, `reset` props |
| `global-error.tsx` | Root error | **Client only** | `"use client"`, `<html>`, `<body>` |

### error.tsx の実装パターン

```tsx
"use client"; // ← 必須

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーログ（開発環境のみ）
    if (process.env.NODE_ENV === "development") {
      console.error("Error boundary caught:", error);
    }
  }, [error]);

  return (
    <ErrorDisplay
      title="Something Went Wrong"
      message="The fire flickered, but we can reignite it."
      onReset={reset}
    />
  );
}
```

### global-error.tsx の特殊性

```tsx
"use client"; // ← 必須

export default function GlobalError({ error, reset }) {
  return (
    <html lang="ja"> {/* ← <html> タグ必須 */}
      <body> {/* ← <body> タグ必須 */}
        {/* Error UI */}
      </body>
    </html>
  );
}
```

**注意:**
- Root Layout のエラーをキャッチするため
- 通常は `error.tsx` で十分（Phase 1 では `global-error.tsx` 削除）

---

## コンポーネント設計原則

### AnimatedHeading の進化

#### Before（依存あり、複雑）
```typescript
// splitText utility に依存
import { splitText } from "@/shared/utils";

const chars = splitText(children);
chars.forEach((char, i) => {
  gsap.to(char, {
    opacity: 1,
    y: 0,
    delay: i * 0.02,
  });
});
```

**問題点:**
- 外部ユーティリティ依存
- DOM 操作が複雑
- パフォーマンス影響（多数の要素）

#### After（自己完結、シンプル）
```typescript
// 単一要素アニメーション
gsap.to(heading, {
  opacity: 1,
  y: 0,
  filter: "blur(0px)",
  duration: 0.6,
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
});
```

**利点:**
- 依存なし（GSAP のみ）
- DOM 操作最小限
- パフォーマンス良好

### コンポーネント分離の原則

#### ErrorDisplay 共通化
```
features/error-pages/
├── components/
│   ├── ErrorDisplay.tsx   ← 共通 UI
│   ├── CursorLight.tsx    ← 404 専用
│   └── index.ts
app/
├── error.tsx              ← ErrorDisplay を使用
├── not-found.tsx          ← ErrorDisplay + CursorLight を使用
```

**設計判断:**
- `ErrorDisplay`: 404 と error 両方で使用可能
- `CursorLight`: 404 専用（error ページは dimmed overlay で差別化）
- 共通化により世界観の一貫性を担保

---

## 🎯 ベストプラクティス Summary

### 1. パフォーマンス最適化
- ✅ 用途に応じた Shader 軽量化（Profile 重量版 vs Loading 軽量版）
- ✅ PixelRatio 制限（最大 2）
- ✅ GPU 優先設定（`powerPreference: "high-performance"`）
- ✅ 不要な依存削除（splitText → 単一要素アニメーション）

### 2. Motion Design 統一
- ✅ 600ms 標準（テキスト、カーソル追従）
- ✅ 1.5s サイクル（脈動、呼吸）
- ✅ Easing カーブの意図的選択（感情に基づく）
- ✅ Stagger パターンの標準化

### 3. アクセシビリティ
- ✅ Reduced Motion 対応（Shader + GSAP）
- ✅ ARIA 属性の適切な使用
- ✅ キーボードナビゲーション対応
- ✅ スクリーンリーダー配慮

### 4. Next.js 規約準拠
- ✅ 特殊ファイルの正しい使用
- ✅ Client Component の明示（`"use client"`）
- ✅ Error Boundary の適切な実装
- ✅ 最小構成の選択（`global-error.tsx` 削除）

### 5. 世界観の一貫性
- ✅ Pitch Black & Fire メタファーの維持
- ✅ 404（迷い）vs Error（中断）の差別化
- ✅ Amber の意味統一（希望、道標、熱源）
- ✅ Typography の統一（Ghost opacity パターン）

---

## 📝 次フェーズへの引き継ぎ

### Phase 2（Signature Moment）で活用できる知見

1. **WebGL 最適化パターン**: Color-Responsive Background でも軽量化戦略適用
2. **Motion Design システム**: Depth-Responsive Parallax で統一タイミング使用
3. **コンポーネント設計**: Magnetic Cursor も CursorLight パターン参照可能

### 技術的負債（Phase 1 で残った課題）

- [ ] Task 1.4（Cursor Enhancement）未実装
  - Global cursor system の検討が必要
  - CursorLight との統合方針決定

### パフォーマンス監視ポイント

- Loading page の Origin Glow: モバイル 30fps 維持確認
- Hero shader: LCP < 2.5s 維持
- Error Boundary: 初回表示時のレイアウトシフトなし

---

**最終更新:** 2025-12-09
**次回更新:** Phase 2 完了時
