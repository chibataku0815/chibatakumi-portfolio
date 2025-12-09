# Index Brushup Phase 1: Hero Section 実装プロンプト

**対象モデル:** Claude Haiku 4.5
**作成日:** 2025-12-07
**フェーズ:** Phase 1 of 4

---

## タスク概要

ポートフォリオサイト `apps/web` の Hero セクションをリデザインする。
現在の中央配置から**非対称配置**に変更し、タイポグラフィとアニメーションを強化する。

**目標:**
- 視覚的インパクトの向上
- マルチクリエイターとしてのアイデンティティ表現
- 対角線構図によるダイナミックな緊張感

---

## 禁止事項（重要）

1. **コミット禁止** - `git add` / `git commit` を絶対に実行しない
2. **依存追加禁止** - `npm install` / `bun add` を実行しない
3. **既存機能の破壊禁止** - シェーダー背景やスクロール連動は維持する

---

## 現状

**ファイル:** `apps/web/src/features/hero/components/HeroText.tsx`

**現在の構図:**
```
┌─────────────────────────────────────┐
│                                     │
│          Takumi Chiba               │  ← 中央配置
│     コードを書く。撮る。編む。         │  ← 1行のタグライン
│                                     │
│            [scroll]                 │
└─────────────────────────────────────┘
```

**問題点:**
- 中央配置で予測可能、視覚的緊張感がない
- タグラインが小さく埋もれている
- タイトルとタグラインの階層差が弱い

---

## 変更後の構図

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                                                         │
│                                      Takumi             │  ← 右寄せ
│                                      Chiba              │  ← 2行に分割
│                                                         │
│                                                         │
│     コードを書く。                                        │  ← 左寄せ、3行に分離
│     撮る。                                              │
│     編む。                                              │
│                                                         │
│                                               [scroll]  │  ← 右下
└─────────────────────────────────────────────────────────┘
```

**対角線構図:** 右上（タイトル）→ 左中（タグライン）→ 右下（スクロール）

---

## 作業手順

### Step 1: タイトルの分割と右寄せ

`HeroText.tsx` を開き、タイトル部分を以下のように変更する。

**変更前 (行151-156付近):**
```tsx
<h1
  ref={titleRef}
  className="text-[clamp(2.75rem,10vw,7rem)] font-semibold leading-[1.0] tracking-[-0.03em] text-[var(--text-base)]"
>
  {titleText}
</h1>
```

**変更後:**
```tsx
<div className="flex w-full flex-col items-end pr-8 md:pr-16 lg:pr-24">
  <h1
    ref={titleRef}
    className="text-right text-[clamp(4rem,15vw,12rem)] font-semibold leading-[0.9] tracking-[-0.04em] text-[var(--text-base)]"
  >
    <span className="block">Takumi</span>
    <span className="block">Chiba</span>
  </h1>
</div>
```

**変更点:**
- `clamp(2.75rem,10vw,7rem)` → `clamp(4rem,15vw,12rem)` でサイズ拡大
- `leading-[1.0]` → `leading-[0.9]` で行間を詰める
- `tracking-[-0.03em]` → `tracking-[-0.04em]` で文字間を詰める
- 右寄せコンテナで包む
- 名前を2行に分割

---

### Step 2: タグラインの3行分離と左寄せ

**変更前 (行158-164付近):**
```tsx
<p
  ref={taglineRef}
  className="mt-5 text-[clamp(1rem,2vw,1.25rem)] font-normal tracking-[0.08em] text-[var(--text-base-50)]"
>
  {tagline}
</p>
```

**変更後:**
```tsx
<div
  ref={taglineRef}
  className="mt-16 flex w-full flex-col items-start pl-8 md:pl-16 lg:pl-24"
>
  <p className="tagline-line text-[clamp(1.125rem,2.5vw,1.5rem)] font-normal tracking-[0.05em] text-[var(--text-base-60)]">
    コードを書く。
  </p>
  <p className="tagline-line mt-2 text-[clamp(1.125rem,2.5vw,1.5rem)] font-normal tracking-[0.05em] text-[var(--text-base-60)]">
    撮る。
  </p>
  <p className="tagline-line mt-2 text-[clamp(1.125rem,2.5vw,1.5rem)] font-normal tracking-[0.05em] text-[var(--text-base-60)]">
    編む。
  </p>
</div>
```

**変更点:**
- 単一の `<p>` から複数行の構造へ
- 左寄せコンテナで包む
- サイズを少し拡大
- 各行に `tagline-line` クラスを付与（アニメーション用）
- 透明度を `50` → `60` に調整（少し濃く）
- `mt-5` → `mt-16` で空間を拡大

---

### Step 3: スクロールインジケーターの右下配置

**変更前 (行166-198付近):**
```tsx
<div
  ref={scrollIndicatorRef}
  className="absolute bottom-10 flex flex-col items-center gap-3"
>
```

**変更後:**
```tsx
<div
  ref={scrollIndicatorRef}
  className="absolute bottom-10 right-8 flex flex-col items-center gap-3 md:right-16 lg:right-24"
>
```

**変更点:**
- 中央配置から右寄せに変更
- レスポンシブな右マージン追加

---

### Step 4: コンテナ全体のスタイル調整

**変更前 (行148-150付近):**
```tsx
<div
  ref={containerRef}
  className="relative flex min-h-[80vh] min-h-[600px] flex-col items-center justify-center text-center px-6"
>
```

**変更後:**
```tsx
<div
  ref={containerRef}
  className="relative flex min-h-[85vh] min-h-[700px] flex-col justify-center px-0"
>
```

**変更点:**
- `items-center` 削除（子要素で個別に配置）
- `text-center` 削除（左右寄せを個別に設定）
- `px-6` → `px-0`（子要素でパディング設定）
- `min-h-[80vh]` → `min-h-[85vh]`（少し高く）

---

### Step 5: アニメーションの調整

`useEffect` 内のアニメーションを調整する。

#### 5.1 タグラインアニメーションの修正

タグラインが複数行になったので、アニメーション対象を変更する。

**変更前:**
```tsx
// Stage 2: Tagline fade-in (overlapping start)
gsap.set(taglineRef.current, {
  opacity: 0,
  y: 12,
});

masterTl.to(taglineRef.current, {
  opacity: 1,
  y: 0,
  duration: 0.6,
  ease: "power2.out",
}, "-=0.3");
```

**変更後:**
```tsx
// Stage 2: Tagline lines reveal (staggered)
const taglineLines = taglineRef.current?.querySelectorAll('.tagline-line');
if (taglineLines) {
  gsap.set(taglineLines, {
    opacity: 0,
    x: -20,
  });

  masterTl.to(taglineLines, {
    opacity: 1,
    x: 0,
    duration: 0.5,
    stagger: 0.15,  // 150ms間隔で順番に
    ease: "power2.out",
  }, "-=0.2");
}
```

**変更点:**
- 単一要素から複数行への対応
- `y` 移動から `x` 移動へ（左から入ってくる感覚）
- stagger で順番に表示

#### 5.2 スクロールパララックスの修正

タグラインのパララックス処理も調整が必要。

**変更前:**
```tsx
// Tagline: slightly less parallax
gsap.set(taglineRef.current, {
  y: -progress * 50,
  opacity: 1 - progress * 2,
});
```

**変更後:**
```tsx
// Tagline lines: slightly less parallax
const taglineLines = taglineRef.current?.querySelectorAll('.tagline-line');
if (taglineLines) {
  taglineLines.forEach((line, i) => {
    gsap.set(line, {
      y: -progress * (40 + i * 5),  // 各行で少しずつ差をつける
      opacity: 1 - progress * 2,
    });
  });
}
```

---

### Step 6: portfolioData の確認

`apps/web/src/shared/data/portfolio.ts` の `hero` セクションを確認する。

現在:
```ts
hero: {
  title: "Takumi Chiba",
  tagline: "コードを書く。撮る。編む。",
  scrollText: "Scroll",
},
```

タイトルは分割して使用するため、コンポーネント側でハードコードするか、データ構造を変更するか選択が必要。

**推奨: コンポーネント側でハードコード**
- データ構造の変更は影響範囲が大きい
- Hero のタイトル表示は特殊なので、コンポーネント固有の実装でOK

ただし、`title` プロパティは引き続き使用可能にしておく（SEO用など）。

---

## globals.css への追加（オプション）

タグラインのホバー効果用のスタイルを追加する場合:

**ファイル:** `apps/web/src/app/globals.css`

```css
/* Tagline hover effect */
.tagline-line {
  transition: color 0.3s ease, text-shadow 0.3s ease;
}

.tagline-line:hover {
  color: var(--text-base);
  text-shadow: 0 0 20px rgba(var(--accent-amber1), 0.3);
}
```

---

## 最終的なコード構造

```tsx
export function HeroText() {
  // ... refs and hooks

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-[85vh] min-h-[700px] flex-col justify-center px-0"
    >
      {/* Title - Right aligned */}
      <div className="flex w-full flex-col items-end pr-8 md:pr-16 lg:pr-24">
        <h1
          ref={titleRef}
          className="text-right text-[clamp(4rem,15vw,12rem)] font-semibold leading-[0.9] tracking-[-0.04em] text-[var(--text-base)]"
        >
          <span className="block">Takumi</span>
          <span className="block">Chiba</span>
        </h1>
      </div>

      {/* Tagline - Left aligned, 3 lines */}
      <div
        ref={taglineRef}
        className="mt-16 flex w-full flex-col items-start pl-8 md:pl-16 lg:pl-24"
      >
        <p className="tagline-line text-[clamp(1.125rem,2.5vw,1.5rem)] font-normal tracking-[0.05em] text-[var(--text-base-60)]">
          コードを書く。
        </p>
        <p className="tagline-line mt-2 text-[clamp(1.125rem,2.5vw,1.5rem)] font-normal tracking-[0.05em] text-[var(--text-base-60)]">
          撮る。
        </p>
        <p className="tagline-line mt-2 text-[clamp(1.125rem,2.5vw,1.5rem)] font-normal tracking-[0.05em] text-[var(--text-base-60)]">
          編む。
        </p>
      </div>

      {/* Scroll Indicator - Bottom right */}
      <div
        ref={scrollIndicatorRef}
        className="absolute bottom-10 right-8 flex flex-col items-center gap-3 md:right-16 lg:right-24"
      >
        {/* ... scroll indicator content ... */}
      </div>
    </div>
  );
}
```

---

## 確認事項

実装完了後、以下を確認:

1. タイトルが右寄せで大きく表示されること
2. タグラインが左寄せで3行に分離されていること
3. スクロールインジケーターが右下に配置されていること
4. アニメーションが正常に動作すること（blur-to-sharp、stagger）
5. スクロール時のパララックスが維持されていること
6. モバイル表示で崩れないこと

---

## 作業完了後

1. 変更内容をユーザーに報告
2. **コミットは行わない** - ユーザーの指示を待つ
3. Phase 2（トランジション演出）の指示を待つ

---

## 参照ファイル

- `.claude/tasks/2025-12-07-index-brushup-plan.md` - 全体計画
- `.ai/GLOBAL.md` - デザイン原則（Pitch Black & Fire）
- `.claude/skills/visual-composition/SKILL.md` - 構図理論
- `.claude/skills/motion-design/SKILL.md` - モーション原則

---

## 補足: text-base-60 トークンの追加

`globals.css` に `--text-base-60` が存在しない場合は追加する:

```css
/* :root セクション */
--text-base-60: color-mix(in srgb, var(--slate-12) 60%, transparent);

/* @theme inline セクション */
--color-text-base-60: var(--text-base-60);
```
