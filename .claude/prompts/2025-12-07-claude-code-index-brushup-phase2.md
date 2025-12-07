# Index Brushup Phase 2: Hero → Works トランジション実装プロンプト

**対象モデル:** Claude Haiku 4.5
**作成日:** 2025-12-07
**フェーズ:** Phase 2 of 4

---

## タスク概要

Hero セクションから Works セクションへの遷移を「沈降」トランジションとして演出する。
単なるセクション移動ではなく、「表面から深海へ」という物語的な繋がりを作る。

**目標:**
- HeroShaderBackground → FluidGradientBackground のクロスフェード
- Hero コンテンツの「沈む」演出強化
- Works 最初のパネルが「浮上」するように現れる

---

## 禁止事項（重要）

1. **コミット禁止** - `git add` / `git commit` を絶対に実行しない
2. **依存追加禁止** - `npm install` / `bun add` を実行しない
3. **既存機能の破壊禁止** - 現在の動作を維持しつつ演出を追加

---

## 現状分析

### 背景レイヤー構造

```
z-index 順:
-10: HeroShaderBackground (layout.tsx, fixed, 常に表示)
 -5: FluidGradientBackground (page.tsx, sticky, Works セクション)
  0: コンテンツ層
```

### 現在のトランジション

```
Hero Section:
  - コンテンツが上へパララックス移動 (y: -80)
  - opacity が 0 に向かってフェード
  - 背景は変化なし

Works Section:
  - いきなり始まる（物語的繋がりなし）
  - FluidGradient は最初から 100% opacity
```

---

## 実装内容

### Step 1: HeroShaderBackground にフェードアウト制御を追加

**ファイル:** `apps/web/src/features/hero/components/HeroShaderBackground.tsx`

HeroShaderBackground に ScrollTrigger を追加し、スクロールに応じてフェードアウトさせる。

**変更箇所（行143-150付近）:**

```tsx
// 変更前
return (
  <div
    ref={containerRef}
    className="fixed inset-0 -z-10 pointer-events-none"
    style={{ background: cfg.fallbackColor }}
    aria-hidden="true"
  />
);

// 変更後
return (
  <div
    ref={containerRef}
    className="hero-shader-bg fixed inset-0 -z-10 pointer-events-none"
    style={{ background: cfg.fallbackColor }}
    aria-hidden="true"
  />
);
```

**useEffect 内に追加（行121付近、handleResize の後）:**

```tsx
// HeroShader fade-out on scroll
const heroFadeOutTrigger = ScrollTrigger.create({
  trigger: "body",
  start: "top top",
  end: () => window.innerHeight * 0.8,  // Hero 80% 地点まで
  scrub: 0.5,
  onUpdate: (self) => {
    // 0→1 の progress を 1→0 の opacity に
    const opacity = 1 - self.progress;
    container.style.opacity = String(opacity);
  },
});
```

**import 追加:**
```tsx
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}
```

**cleanup に追加:**
```tsx
return () => {
  // ... 既存の cleanup
  heroFadeOutTrigger.kill();
};
```

---

### Step 2: FluidGradientBackground にフェードイン制御を追加

**ファイル:** `apps/web/src/features/fluid-gradient/FluidGradientBackground.tsx`

FluidGradientBackground がスクロールに応じてフェードインするように制御。

**prop 追加（コンポーネント定義部分）:**

```tsx
interface FluidGradientBackgroundProps {
  className?: string;
  config?: FluidConfig;
  fadeIn?: boolean;  // 追加: トランジション用フェードイン
}

export function FluidGradientBackground({
  className,
  config = fluidConfig,
  fadeIn = false,  // デフォルト false
}: FluidGradientBackgroundProps) {
```

**useEffect 内に追加（fadeIn が true の場合）:**

```tsx
useEffect(() => {
  if (!fadeIn || !containerRef.current) return;

  // 初期状態: 透明
  gsap.set(containerRef.current, { opacity: 0 });

  // スクロールでフェードイン
  const fadeInTrigger = ScrollTrigger.create({
    trigger: containerRef.current,
    start: "top 80%",  // 画面下部 80% に入ったら開始
    end: "top 20%",    // 画面上部 20% で完了
    scrub: 0.5,
    onUpdate: (self) => {
      if (containerRef.current) {
        containerRef.current.style.opacity = String(self.progress);
      }
    },
  });

  return () => {
    fadeInTrigger.kill();
  };
}, [fadeIn]);
```

---

### Step 3: page.tsx で fadeIn を有効化

**ファイル:** `apps/web/src/app/page.tsx`

```tsx
// 変更前
<FluidGradientBackground
  className="absolute inset-0"
  config={fluidConfigMonochrome}
/>

// 変更後
<FluidGradientBackground
  className="absolute inset-0"
  config={fluidConfigMonochrome}
  fadeIn={true}
/>
```

---

### Step 4: HeroText のパララックスを強化

**ファイル:** `apps/web/src/features/hero/components/HeroText.tsx`

現在のパララックスを「沈む」感覚に強化。

**変更箇所（行108-138付近、ScrollTrigger.create 内の onUpdate）:**

```tsx
// 変更前
onUpdate: (self) => {
  const progress = self.progress;

  // Title: subtle parallax + fade
  gsap.set(titleRef.current, {
    y: -progress * 80,
    opacity: 1 - progress * 1.5,
  });

  // Tagline lines...

  // Scroll indicator...
},

// 変更後
onUpdate: (self) => {
  const progress = self.progress;

  // Title: enhanced "sinking" parallax
  gsap.set(titleRef.current, {
    y: -progress * 120,           // より大きな移動
    opacity: 1 - progress * 1.2,  // より緩やかなフェード
    scale: 1 - progress * 0.05,   // 微細な縮小で遠ざかる感覚
  });

  // Tagline lines: staggered sinking
  const taglineLines = taglineRef.current?.querySelectorAll('.tagline-line');
  if (taglineLines) {
    taglineLines.forEach((line, i) => {
      gsap.set(line, {
        y: -progress * (60 + i * 15),  // 各行で差をつけて「流れる」感覚
        opacity: 1 - progress * 1.8,
        filter: `blur(${progress * 3}px)`,  // 沈むとぼやける
      });
    });
  }

  // Scroll indicator: quick fade
  gsap.set(scrollIndicatorRef.current, {
    opacity: Math.max(0, 0.6 - progress * 4),
    y: -progress * 40,
  });
},
```

---

### Step 5: HorizontalWorks の最初のパネルに「浮上」アニメーションを追加

**ファイル:** `apps/web/src/features/works/horizontal/HorizontalWorks.tsx`

Works セクションに入った時、最初のパネルが「深海から浮き上がる」ように現れる。

**initAnimations 内、panelData ループの前（行156付近）に追加:**

```tsx
// === Entry Animation: First panel "rise from depth" ===
const firstPanelContent = contentRefs.current[0];
if (firstPanelContent) {
  // 初期状態: 下から、少しぼやけて
  gsap.set(firstPanelContent, {
    y: 60,
    opacity: 0,
    filter: "blur(8px)",
  });
}

// Entry trigger: Works セクションに入った時
const entryTrigger = ScrollTrigger.create({
  trigger: wrapperRef.current,
  start: "top 80%",
  end: "top 20%",
  scrub: 0.8,
  onUpdate: (self) => {
    if (firstPanelContent) {
      const progress = self.progress;
      gsap.set(firstPanelContent, {
        y: 60 * (1 - progress),
        opacity: progress,
        filter: `blur(${8 * (1 - progress)}px)`,
      });
    }
  },
});
```

**cleanup に追加:**

```tsx
return () => {
  // ... 既存の cleanup
  if (entryTrigger) entryTrigger.kill();
};
```

**注意:** entryTrigger の変数をコンポーネントスコープで保持するか、ref で管理する必要がある。

---

## 代替案: 簡易実装

上記が複雑な場合、まずは **Step 1（HeroShader フェードアウト）と Step 4（パララックス強化）のみ** を実装。

これだけでも「沈む」感覚は出る。

---

## 完成イメージ

```
スクロール進行:

0%   [Hero 100% | FluidGradient 0%]
     Hero コンテンツが画面中央に

30%  [Hero 70% | FluidGradient 30%]
     Hero が上へ沈み始める、タグラインがぼやける

60%  [Hero 40% | FluidGradient 60%]
     背景がクロスフェード中、Works パネルが見え始める

80%  [Hero 10% | FluidGradient 90%]
     Hero ほぼ消失、Works 最初のパネルが浮上

100% [Hero 0% | FluidGradient 100%]
     完全に Works セクション、FluidGradient のみ
```

---

## 確認事項

実装完了後、以下を確認:

1. スクロール開始で HeroShader がフェードアウトすること
2. FluidGradient が徐々にフェードインすること
3. Hero コンテンツが「沈む」ように消えること
4. Works 最初のパネルが「浮上」するように現れること
5. 既存の HorizontalWorks アニメーションが正常に動作すること
6. スクロールを戻した時に逆再生されること

---

## 作業完了後

1. 変更内容をユーザーに報告
2. **コミットは行わない** - ユーザーの指示を待つ
3. Phase 3（Works Section リデザイン）の指示を待つ

---

## 参照ファイル

- `.claude/tasks/2025-12-07-index-brushup-plan.md` - 全体計画
- `.claude/prompts/2025-12-07-claude-code-index-brushup-hero.md` - Phase 1 プロンプト
- `.claude/skills/motion-design/SKILL.md` - モーション原則
