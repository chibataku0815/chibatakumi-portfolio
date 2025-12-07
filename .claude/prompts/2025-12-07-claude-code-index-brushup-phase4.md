# Index Brushup Phase 4: 視覚言語の統一 実装プロンプト

**対象モデル:** Claude Haiku 4.5
**作成日:** 2025-12-07
**フェーズ:** Phase 4 of 4

---

## タスク概要

サイト全体の視覚言語を統一し、「Pitch Black & Fire」のコンセプトを強化する。
アンバーアクセントの戦略的活用、グラフィック要素の追加、インタラクションの洗練を行う。

**目標:**
- アンバーアクセントを「熱源」として戦略的に配置
- 微細なグラフィック要素の追加
- ホバー/インタラクション時の一貫した反応
- 全体的な洗練度の向上

---

## 禁止事項（重要）

1. **コミット禁止** - `git add` / `git commit` を絶対に実行しない
2. **依存追加禁止** - `npm install` / `bun add` を実行しない
3. **既存機能の破壊禁止** - Phase 1-3 の変更を維持

---

## 現状分析

### アンバーアクセントの現在の使用箇所

```
- Works meta ラベル: text-[var(--accent-amber1)]/60
- Global Progress Bar: bg-gradient-to-r from-[var(--accent-amber1)] to-[var(--accent-amber2)]
```

**問題点:**
- アクセントの使用が限定的
- インタラクション時の「熱」表現が不足
- ホバー効果が統一されていない

---

## 実装内容

### Step 1: グローバルスタイルにアクセントユーティリティを追加

**ファイル:** `apps/web/src/app/globals.css`

**追加するスタイル:**

```css
/* ============================================
   Accent Utilities (Pitch Black & Fire)
   ============================================ */

/* Amber Glow - インタラクション時の熱表現 */
.amber-glow-hover {
  transition: text-shadow 0.3s ease, color 0.3s ease;
}

.amber-glow-hover:hover {
  color: var(--text-base);
  text-shadow: 0 0 20px color-mix(in srgb, var(--accent-amber1) 40%, transparent),
               0 0 40px color-mix(in srgb, var(--accent-amber1) 20%, transparent);
}

/* Amber Underline - テキストリンクのアクセント */
.amber-underline {
  position: relative;
}

.amber-underline::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -2px;
  width: 0;
  height: 1px;
  background: linear-gradient(90deg, var(--accent-amber1), var(--accent-amber2));
  transition: width 0.3s ease;
}

.amber-underline:hover::after {
  width: 100%;
}

/* Amber Border Glow - ボタンやカードのアクセント */
.amber-border-glow {
  position: relative;
}

.amber-border-glow::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg,
    transparent 0%,
    color-mix(in srgb, var(--accent-amber1) 30%, transparent) 50%,
    transparent 100%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.amber-border-glow:hover::before {
  opacity: 1;
}

/* Heat Pulse - 注目要素のパルス */
@keyframes heat-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent-amber1) 40%, transparent);
  }
  50% {
    box-shadow: 0 0 20px 4px color-mix(in srgb, var(--accent-amber1) 20%, transparent);
  }
}

.heat-pulse {
  animation: heat-pulse 2s ease-in-out infinite;
}

/* Subtle Grain Overlay - 微細なテクスチャ */
.grain-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
  mix-blend-mode: overlay;
}
```

---

### Step 2: HeroText にホバーアクセントを追加

**ファイル:** `apps/web/src/features/hero/components/HeroText.tsx`

**タグライン各行にホバー効果を追加:**

```tsx
// 変更前
<p className="tagline-line text-[clamp(1.125rem,2.5vw,1.5rem)] font-normal tracking-[0.05em] text-[var(--text-base-60)]">
  コードを書く。
</p>

// 変更後
<p className="tagline-line amber-glow-hover cursor-default text-[clamp(1.125rem,2.5vw,1.5rem)] font-normal tracking-[0.05em] text-[var(--text-base-60)]">
  コードを書く。
</p>
```

**全3行に同様の変更を適用。**

---

### Step 3: HorizontalWorks のアクセント強化

**ファイル:** `apps/web/src/features/works/horizontal/HorizontalWorks.tsx`

#### 3.1 タイトルにホバーアクセントを追加

```tsx
// 変更前
<h2
  ref={(el) => {
    titleRefs.current[index] = el;
  }}
  className={`horizontal-title mb-6 text-[clamp(2rem,6vw,4rem)] font-semibold leading-tight tracking-[-0.02em] text-[var(--text-base)] ${styles.text}`}
>

// 変更後
<h2
  ref={(el) => {
    titleRefs.current[index] = el;
  }}
  className={`horizontal-title amber-glow-hover mb-6 text-[clamp(2rem,6vw,4rem)] font-semibold leading-tight tracking-[-0.02em] text-[var(--text-base)] ${styles.text}`}
>
```

#### 3.2 ドットナビゲーションのアクセント強化

```tsx
// 変更前
<button
  key={index}
  onClick={() => navigateToSection(index)}
  className={`section-dot relative h-2.5 w-2.5 rounded-full transition-all duration-300 ${
    activeSection === index
      ? "scale-125 bg-[var(--text-base)] shadow-[var(--shadow-glow-md)]"
      : completedSections.has(index)
        ? "bg-[var(--text-base)]"
        : "bg-[var(--bg-overlay-20)] hover:bg-[var(--bg-overlay-40)]"
  }`}

// 変更後
<button
  key={index}
  onClick={() => navigateToSection(index)}
  className={`section-dot relative h-2.5 w-2.5 rounded-full transition-all duration-300 ${
    activeSection === index
      ? "scale-125 bg-[var(--accent-amber1)] shadow-[0_0_12px_var(--accent-amber1)]"
      : completedSections.has(index)
        ? "bg-[var(--text-base)]"
        : "bg-[var(--bg-overlay-20)] hover:bg-[var(--accent-amber1)]/50"
  }`}
```

#### 3.3 プログレスバー完了時のアクセント

```tsx
// 変更前
<div
  ref={(el) => {
    progressFillRefs.current[index] = el;
  }}
  className="progress-fill absolute left-0 top-0 h-full w-0 rounded-full bg-[var(--text-base)] transition-shadow duration-300"
>

// 変更後
<div
  ref={(el) => {
    progressFillRefs.current[index] = el;
  }}
  className="progress-fill absolute left-0 top-0 h-full w-0 rounded-full bg-[var(--text-base)] transition-all duration-300 data-[completed=true]:bg-[var(--accent-amber1)] data-[completed=true]:shadow-[0_0_8px_var(--accent-amber1)]"
>
```

**注:** data-completed属性はJSで制御するか、クラス名で制御。

**代替案（クラスベース）:**

globals.css に追加:
```css
.progress-fill.completed {
  background-color: var(--accent-amber1);
  box-shadow: 0 0 8px var(--accent-amber1);
}
```

---

### Step 4: スクロールインジケーターのアクセント強化

**ファイル:** `apps/web/src/features/hero/components/HeroText.tsx`

```tsx
// スクロールインジケーターのSVGまたはテキスト部分
// 変更前
<span className="text-xs font-medium tracking-[0.15em] text-[var(--text-base-40)]">
  {hero.scrollText}
</span>

// 変更後
<span className="text-xs font-medium tracking-[0.15em] text-[var(--text-base-40)] transition-colors duration-300 group-hover:text-[var(--accent-amber1)]">
  {hero.scrollText}
</span>
```

**コンテナにgroupクラスを追加:**
```tsx
<div
  ref={scrollIndicatorRef}
  className="group absolute bottom-10 right-8 flex cursor-pointer flex-col items-center gap-3 md:right-16 lg:right-24"
>
```

---

### Step 5: Navリンクのアクセント追加

**ファイル:** `apps/web/src/shared/components/Nav.tsx`

```tsx
// 変更前
<Link
  href={item.href}
  className="text-sm font-medium text-[var(--text-base-60)] transition-colors hover:text-[var(--text-base)]"
>

// 変更後
<Link
  href={item.href}
  className="amber-underline text-sm font-medium text-[var(--text-base-60)] transition-colors hover:text-[var(--text-base)]"
>
```

---

### Step 6: トランジションラインのアンバー化

**ファイル:** `apps/web/src/features/works/horizontal/HorizontalWorks.tsx`

```tsx
// 変更前
<div
  ref={transitionLineRef}
  className="transition-line absolute left-0 top-1/2 h-[1px] w-0 -translate-y-1/2 bg-[var(--text-base)] opacity-0"
/>

// 変更後
<div
  ref={transitionLineRef}
  className="transition-line absolute left-0 top-1/2 h-[1px] w-0 -translate-y-1/2 bg-gradient-to-r from-transparent via-[var(--accent-amber1)] to-transparent opacity-0"
/>
```

---

### Step 7: Contact ページ CTA のアクセント強化

**ファイル:** `apps/web/src/app/contact/page.tsx`

```tsx
// CTA ボタンにアンバーボーダーグロー追加
<a
  href={`mailto:${contact.email}`}
  className="amber-border-glow relative inline-flex items-center gap-2 rounded-full border border-[var(--text-base-20)] px-8 py-4 text-sm font-medium text-[var(--text-base)] transition-all duration-300 hover:border-[var(--accent-amber1)]/50 hover:text-[var(--accent-amber1)]"
>
  {contact.cta}
</a>
```

---

## 追加のグラフィック要素（オプション）

### A. セクション区切り線

Hero と Works の間、Works と次セクションの間に微細な区切り線を追加:

```tsx
// page.tsx に追加
<div className="section-divider mx-auto h-[1px] w-16 bg-gradient-to-r from-transparent via-[var(--text-base-20)] to-transparent" />
```

### B. コーナーアクセント

Hero セクションの角に微細なアクセントを追加:

```css
/* globals.css */
.corner-accent {
  position: absolute;
  width: 24px;
  height: 24px;
  border-color: var(--accent-amber1);
  opacity: 0.3;
}

.corner-accent.top-left {
  top: 24px;
  left: 24px;
  border-top: 1px solid;
  border-left: 1px solid;
}

.corner-accent.bottom-right {
  bottom: 24px;
  right: 24px;
  border-bottom: 1px solid;
  border-right: 1px solid;
}
```

---

## 確認事項

実装完了後、以下を確認:

1. タグラインにホバーでアンバーglowが出ること
2. Worksタイトルにホバーでアンバーglowが出ること
3. ドットナビゲーションのアクティブがアンバー色になること
4. プログレスバー完了時にアンバー色になること
5. Navリンクにホバーでアンダーラインが出ること
6. トランジションラインがアンバーグラデーションになること
7. Contact CTAにホバーでボーダーグローが出ること
8. 全体的に「熱」を感じる統一されたインタラクションになること

---

## 作業完了後

1. 変更内容をユーザーに報告
2. **コミットは行わない** - ユーザーの指示を待つ
3. Index Brushup 完了報告

---

## 参照ファイル

- `.claude/tasks/2025-12-07-index-brushup-plan.md` - 全体計画
- `.claude/prompts/2025-12-07-claude-code-index-brushup-hero.md` - Phase 1
- `.claude/prompts/2025-12-07-claude-code-index-brushup-phase2.md` - Phase 2
- `.claude/prompts/2025-12-07-claude-code-index-brushup-phase3.md` - Phase 3
- `.ai/GLOBAL.md` - デザイン原則（Pitch Black & Fire）

---

## アクセントカラー参照

```css
--accent-amber1: var(--amber-9);   /* メインアンバー */
--accent-amber2: var(--amber-10);  /* アクティブ/ホバー時 */
```

使用場面:
- **熱源**: インタラクションの瞬間
- **進行**: 完了状態、アクティブ状態
- **誘導**: 視線を引く要素

使用しない場面:
- 通常状態のテキスト
- 背景全体
- 過度な装飾
