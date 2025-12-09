# Profile Page Quality Fixes

Haiku 4.5 向け修正プロンプト

---

## タスク概要

Profile ページのアニメーション品質を向上させる。
Ghost 視認性、ease 統一、パフォーマンス最適化を行う。

---

## 禁止事項

以下は絶対に行わないこと:

1. **コミットを行わない** - `git commit` は絶対に実行しない
2. **ビルド・リンター確認は不要** - 実行しない
3. **`back.out` ease の使用禁止** - `power2.out` または `power3.out` に置換
4. **`backgroundPositionY` の使用禁止** - `transform` に置換

---

## 変更ファイル一覧

| ファイル | アクション |
|----------|----------|
| `apps/web/src/features/profile/ProfileClient.tsx` | 変更 |
| `apps/web/src/features/profile/ProfileSections.tsx` | 変更 |

---

## ファイル1: ProfileClient.tsx

`apps/web/src/features/profile/ProfileClient.tsx` に以下の変更を適用:

### 変更1: ANIMATION_CONFIG の ghost.opacity を修正

**変更箇所: 行29付近**

```tsx
// Before
ghost: { y: 50, scale: 0.9, opacity: 0.06, parallaxY: 60 },

// After
ghost: { y: 50, scale: 0.9, opacity: 0.12, parallaxY: 60 },
```

**変更箇所: 行37付近**

```tsx
// Before
ghost: { y: 70, scale: 0.85, opacity: 0.07, parallaxY: 100 },

// After
ghost: { y: 70, scale: 0.85, opacity: 0.15, parallaxY: 100 },
```

### 変更2: Meta items の ease を修正

**変更箇所: 行167付近**

```tsx
// Before
ease: "back.out(1.4)",

// After
ease: "power3.out",
```

### 変更3: Grid lines の reflow 回避

**変更箇所: 行246-248付近**

```tsx
// Before
gsap.set(gridLines, {
  backgroundPositionY: `${progress * 25}px`,
});

// After
if (gridLines) {
  gridLines.style.transform = `translateY(${progress * 25}px)`;
}
```

### 変更後の全体コード（ANIMATION_CONFIG 部分）

```tsx
const ANIMATION_CONFIG = {
  strengths: {
    rail: { duration: 0.85 },
    ghost: { y: 50, scale: 0.9, opacity: 0.12, parallaxY: 60 },  // opacity 変更
    band: { duration: 0.9 },
    meta: { y: 16, stagger: 0.1 },
    tag: { y: 8, stagger: 0.04 },
    description: { y: 20 },
  },
  timeline: {
    rail: { duration: 1.0 },
    ghost: { y: 70, scale: 0.85, opacity: 0.15, parallaxY: 100 },  // opacity 変更
    band: { duration: 1.0 },
    meta: { y: 20, stagger: 0.08 },
    tag: { y: 10, stagger: 0.05 },
    description: { y: 25 },
  },
} as const;
```

### 変更後の全体コード（Meta items アニメーション部分）

```tsx
// [共通] メタ行: y移動 + opacity + stagger
if (metaItems.length > 0) {
  gsap.set(metaItems, { y: config.meta.y, opacity: 0 });
  entryTl.to(
    metaItems,
    {
      y: 0,
      opacity: 1,
      stagger: config.meta.stagger,
      duration: 0.5,
      ease: "power3.out",  // back.out(1.4) から変更
    },
    "-=0.4"
  );
}
```

### 変更後の全体コード（Grid lines scrub 部分）

```tsx
// --- 継続的パララックス (scrub) ---
const scrubTrigger = ScrollTrigger.create({
  trigger: el,
  start: "top bottom",
  end: "bottom top",
  scrub: 0.8,
  onUpdate: (self) => {
    const progress = self.progress;
    const centered = progress - 0.5;

    // [共通] ゴースト: パララックス
    if (ghost) {
      gsap.set(ghost, {
        y: centered * config.ghost.parallaxY,
        scale: 1 + centered * 0.02,
      });
    }

    // [共通] グリッドライン: subtle drift
    // backgroundPositionY ではなく transform を使用（パフォーマンス最適化）
    if (gridLines) {
      gridLines.style.transform = `translateY(${progress * 25}px)`;
    }
  },
});
```

---

## ファイル2: ProfileSections.tsx

`apps/web/src/features/profile/ProfileSections.tsx` に以下の変更を適用:

### 変更1: Strength Ghost opacity を修正

**変更箇所: 行103付近**

```tsx
// Before
style={{ color: "rgba(255,255,255,0.06)" }}

// After
style={{ color: "rgba(255,255,255,0.12)" }}
```

### 変更2: Timeline Ghost-year opacity を修正

**変更箇所: 行205付近**

```tsx
// Before
style={{ color: "rgba(255,255,255,0.07)" }}

// After
style={{ color: "rgba(255,255,255,0.15)" }}
```

### 変更3: Description レスポンシブタイポグラフィを適用

**変更箇所: 行159付近（StrengthSection）**

```tsx
// Before
<p className="description max-w-4xl text-[20px] leading-relaxed text-[var(--text-base-80)]">

// After
<p className="description max-w-4xl text-[clamp(1rem,1.5vw+0.5rem,1.25rem)] leading-relaxed text-[var(--text-base-80)]">
```

**変更箇所: 行268付近（TimelineSection）**

```tsx
// Before
<p className="description text-[20px] leading-relaxed text-[var(--text-base-80)]">

// After
<p className="description text-[clamp(1rem,1.5vw+0.5rem,1.25rem)] leading-relaxed text-[var(--text-base-80)]">
```

### 変更4: Grid lines に will-change を追加

**変更箇所: 行88付近（StrengthSection の grid-lines div）**

```tsx
// Before
<div
  className="grid-lines pointer-events-none absolute inset-0 -z-4 mix-blend-soft-light"
  style={{
    backgroundImage:
      "linear-gradient(90deg,rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(0deg,rgba(255,255,255,0.12) 1px, transparent 1px)",
    backgroundSize: "120px 120px",
    opacity: 0,
  }}
/>

// After
<div
  className="grid-lines pointer-events-none absolute inset-0 -z-4 mix-blend-soft-light"
  style={{
    backgroundImage:
      "linear-gradient(90deg,rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(0deg,rgba(255,255,255,0.12) 1px, transparent 1px)",
    backgroundSize: "120px 120px",
    opacity: 0,
    willChange: "transform, opacity",
  }}
/>
```

**変更箇所: 行193付近（TimelineSection の grid-lines div）**

```tsx
// Before
<div
  className="grid-lines pointer-events-none absolute inset-0 -z-9 mix-blend-soft-light"
  style={{
    backgroundImage:
      "linear-gradient(90deg,rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(0deg,rgba(255,255,255,0.1) 1px, transparent 1px)",
    backgroundSize: "120px 120px",
    opacity: 0,
  }}
/>

// After
<div
  className="grid-lines pointer-events-none absolute inset-0 -z-9 mix-blend-soft-light"
  style={{
    backgroundImage:
      "linear-gradient(90deg,rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(0deg,rgba(255,255,255,0.1) 1px, transparent 1px)",
    backgroundSize: "120px 120px",
    opacity: 0,
    willChange: "transform, opacity",
  }}
/>
```

### 変更5: Ghost に will-change を追加

**変更箇所: 行101-106付近（StrengthSection の ghost div）**

```tsx
// Before
<div
  className="ghost pointer-events-none absolute right-[-12%] top-[18%] -z-2 select-none text-[clamp(5rem,14vw,11rem)] font-black uppercase leading-none tracking-[-0.08em]"
  style={{ color: "rgba(255,255,255,0.12)" }}
>

// After
<div
  className="ghost pointer-events-none absolute right-[-12%] top-[18%] -z-2 select-none text-[clamp(5rem,14vw,11rem)] font-black uppercase leading-none tracking-[-0.08em]"
  style={{ color: "rgba(255,255,255,0.12)", willChange: "transform, opacity" }}
>
```

**変更箇所: 行203-208付近（TimelineSection の ghost-year div）**

```tsx
// Before
<div
  className="ghost-year pointer-events-none absolute right-[-14%] top-[20%] -z-8 select-none text-[clamp(5rem,14vw,11rem)] font-black uppercase leading-none tracking-[-0.08em]"
  style={{ color: "rgba(255,255,255,0.15)" }}
>

// After
<div
  className="ghost-year pointer-events-none absolute right-[-14%] top-[20%] -z-8 select-none text-[clamp(5rem,14vw,11rem)] font-black uppercase leading-none tracking-[-0.08em]"
  style={{ color: "rgba(255,255,255,0.15)", willChange: "transform, opacity" }}
>
```

---

## 品質チェックリスト

実装完了後、以下を確認:

- [ ] Ghost opacity: Strength 0.12, Timeline 0.15 に変更済み
- [ ] ease: すべて `power2.out` または `power3.out`（`back.out` は使用していない）
- [ ] `backgroundPositionY` → `transform` 置換完了
- [ ] `will-change: transform, opacity` が animated elements に設定済み
- [ ] レスポンシブタイポグラフィ `clamp()` 適用済み
- [ ] **コミットを行っていない**

---

## 変更理由の説明

### Ghost opacity の変更
- 現在の 0.06/0.07 は薄すぎて視認できない
- 0.12/0.15 に上げることで、背景装飾として適度な存在感を持たせる

### ease 関数の変更
- `back.out(1.4)` はオーバースイング（約40%のバウンス）があり、bouncy で安っぽく見える
- `power3.out` は洗練された減速カーブで、プロフェッショナルな印象を与える

### backgroundPositionY → transform
- `backgroundPositionY` は Layout（reflow）を引き起こし、パフォーマンス低下の原因
- `transform` は GPU アクセラレートされ、60fps を維持しやすい

### will-change の追加
- ブラウザに事前にアニメーション対象を伝えることで、最適化を促す
- 特に低スペック端末でのパフォーマンス向上に効果的

### レスポンシブタイポグラフィ
- 固定 20px は異なる画面サイズで読みやすさが変わる
- `clamp(1rem, 1.5vw+0.5rem, 1.25rem)` で画面サイズに応じた最適なサイズに

---

## 注意事項

- このプロンプトは Haiku 4.5 での実装を前提としている
- 変更は最小限に留め、既存の動作を壊さないよう注意
- ease 関数は一貫性のため `power2.out`, `power3.out`, `expo.out` のみ使用
