# Design Consistency Brushup 実装プロンプト

**対象モデル:** Claude Haiku 4.5
**作成日:** 2025-12-07

---

## タスク概要

ポートフォリオサイト `apps/web` のUI/デザイン統一性を向上させるリファクタリングを実施する。
視覚的な外観は変更せず、CSS変数・デザイントークンの一貫した使用に置き換える。

---

## 禁止事項（重要）

1. **コミット禁止** - git add / git commit を実行しない
2. **依存追加禁止** - npm install / bun add を実行しない
3. **新規ファイル最小化** - 必要な場合のみ作成
4. **見た目変更禁止** - 視覚的な結果は現状維持

---

## 作業手順

### Step 1: globals.css にトークン追加

ファイル: `apps/web/src/app/globals.css`

`:root` セクションに以下を追加:

```css
/* ==========================================================================
   Opacity Variants (for consistent transparency)
   ========================================================================== */
--text-base-90: color-mix(in srgb, var(--slate-12) 90%, transparent);
--text-base-80: color-mix(in srgb, var(--slate-12) 80%, transparent);
--text-base-60: color-mix(in srgb, var(--slate-12) 60%, transparent);
--text-base-50: color-mix(in srgb, var(--slate-12) 50%, transparent);
--text-base-40: color-mix(in srgb, var(--slate-12) 40%, transparent);
--text-base-30: color-mix(in srgb, var(--slate-12) 30%, transparent);
--text-base-20: color-mix(in srgb, var(--slate-12) 20%, transparent);

--bg-overlay-20: color-mix(in srgb, var(--slate-12) 20%, transparent);
--bg-overlay-10: color-mix(in srgb, var(--slate-12) 10%, transparent);
--bg-overlay-5: color-mix(in srgb, var(--slate-12) 5%, transparent);

/* ==========================================================================
   Shadow Tokens
   ========================================================================== */
--shadow-glow-sm: 0 0 8px rgba(250, 250, 250, 0.6);
--shadow-glow-md: 0 0 12px rgba(250, 250, 250, 0.6);
--shadow-glow-lg: 0 0 8px rgba(250, 250, 250, 0.6), 0 0 20px rgba(250, 250, 250, 0.3);
```

`@theme inline` セクションに以下を追加:

```css
--color-text-base-50: var(--text-base-50);
--color-text-base-40: var(--text-base-40);
--color-text-base-30: var(--text-base-30);
--color-text-base-20: var(--text-base-20);
--color-bg-overlay-20: var(--bg-overlay-20);
--color-bg-overlay-10: var(--bg-overlay-10);
--color-bg-overlay-5: var(--bg-overlay-5);
```

---

### Step 2: HeroText.tsx のカラー統一

ファイル: `apps/web/src/features/hero/components/HeroText.tsx`

以下の置換を実施:

| 行番号付近 | 変更前 | 変更後 |
|-----------|--------|--------|
| 153 | `text-white` | `text-[var(--text-base)]` |
| 161 | `text-white/50` | `text-[var(--text-base-50)]` |
| 171 | `text-white/40` | `text-[var(--text-base-40)]` |
| 179 | `text-white/30` | `text-[var(--text-base-30)]` |

具体的な編集:

```tsx
// 行153付近 - h1タグ
className="text-[clamp(2.75rem,10vw,7rem)] font-semibold leading-[1.0] tracking-[-0.03em] text-[var(--text-base)]"

// 行160付近 - tagline p
className="mt-5 text-[clamp(1rem,2vw,1.25rem)] font-normal tracking-[0.08em] text-[var(--text-base-50)]"

// 行171付近 - scroll text span
className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--text-base-40)]"

// 行179付近 - scroll icon svg
className="text-[var(--text-base-30)]"
```

---

### Step 3: HorizontalWorks.tsx のカラー統一

ファイル: `apps/web/src/features/works/horizontal/HorizontalWorks.tsx`

以下の置換を実施:

| 行番号付近 | 変更前 | 変更後 |
|-----------|--------|--------|
| 354 | `text-white/20` | `text-[var(--text-base-20)]` |
| 389 | `bg-white/10` | `bg-[var(--bg-overlay-10)]` |
| 403 | `text-white/40` | `text-[var(--text-base-40)]` |
| 427-432 | `bg-white/20`, `hover:bg-white/40` | `bg-[var(--bg-overlay-20)]`, `hover:bg-[var(--bg-overlay-40)]` |
| 455 | `bg-white/5` | `bg-[var(--bg-overlay-5)]` |

具体的な編集箇所:

```tsx
// 行354付近 - Panel Number
className="absolute left-8 top-8 text-sm font-medium tracking-wide text-[var(--text-base-20)]"

// 行389付近 - progress track
className="progress-track relative h-[2px] flex-1 overflow-hidden rounded-full bg-[var(--bg-overlay-10)]"

// 行403付近 - progress text
className="progress-text w-10 text-right text-xs font-medium tabular-nums text-[var(--text-base-40)]"

// 行427-432付近 - section dot (inactive state)
// bg-white/20 → bg-[var(--bg-overlay-20)]
// hover:bg-white/40 → hover:bg-[var(--bg-overlay-40)]

// 行455付近 - global progress
className="global-progress fixed bottom-0 left-0 z-40 h-[2px] w-full bg-[var(--bg-overlay-5)]"
```

---

### Step 4: SpotlightGallery.tsx のカラー統一

ファイル: `apps/web/src/features/works/spotlight/SpotlightGallery.tsx`

以下の置換を実施:

| 行番号付近 | 変更前 | 変更後 |
|-----------|--------|--------|
| 262 | `bg-white/5` | `bg-[var(--bg-overlay-5)]` |
| 277 | `bg-white/10` | `bg-[var(--bg-overlay-10)]` |

具体的な編集箇所:

```tsx
// 行262付近 - spotlight-img
className="spotlight-img absolute left-1/2 top-1/2 h-48 w-72 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg bg-[var(--bg-overlay-5)] md:h-64 md:w-96"

// 行277付近 - spotlight-cover
className="spotlight-cover absolute left-1/2 top-1/2 h-72 w-[28rem] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-[var(--bg-overlay-10)] md:h-96 md:w-[36rem]"
```

---

### Step 5: globals.css のShadow置換

ファイル: `apps/web/src/app/globals.css`

`.progress-fill.active` のbox-shadowをトークンに置換:

```css
/* 変更前 */
.progress-fill.active {
  box-shadow:
    0 0 8px rgba(250, 250, 250, 0.6),
    0 0 20px rgba(250, 250, 250, 0.3);
}

/* 変更後 */
.progress-fill.active {
  box-shadow: var(--shadow-glow-lg);
}
```

`@keyframes progressFlash` のbox-shadowも同様:

```css
/* 変更前 */
@keyframes progressFlash {
  0% {
    box-shadow:
      0 0 8px rgba(250, 250, 250, 0.8),
      0 0 30px rgba(250, 250, 250, 0.5);
  }
  100% {
    box-shadow: none;
  }
}

/* 変更後 */
@keyframes progressFlash {
  0% {
    box-shadow: var(--shadow-glow-lg);
  }
  100% {
    box-shadow: none;
  }
}
```

---

### Step 6: HorizontalWorks.tsx のShadow置換

ファイル: `apps/web/src/features/works/horizontal/HorizontalWorks.tsx`

行429付近の `shadow-[0_0_12px_rgba(250,250,250,0.6)]` を置換:

```tsx
// 変更前
shadow-[0_0_12px_rgba(250,250,250,0.6)]

// 変更後
shadow-[var(--shadow-glow-md)]
```

---

## 確認事項

各ステップ完了後、以下を確認:

1. ファイル保存時にエラーが出ないこと
2. 変更前後で視覚的な差異がないこと（色・透明度が同等であること）

---

## 補足: bg-overlay-40 の追加

Step 3でhover状態に `bg-[var(--bg-overlay-40)]` を使用する場合、globals.cssに以下を追加:

```css
--bg-overlay-40: color-mix(in srgb, var(--slate-12) 40%, transparent);
```

`@theme inline` にも追加:

```css
--color-bg-overlay-40: var(--bg-overlay-40);
```

---

## 作業完了後

1. 変更内容をユーザーに報告
2. コミットの指示を待つ
3. `.claude/tasks/ACTIVE-PARALLEL-TASK.md` の更新はユーザー側で実施

---

## 参照ファイル

- `.claude/tasks/2025-12-07-design-consistency-brushup.md` - タスク計画詳細
- `.ai/GLOBAL.md` - デザイン原則
