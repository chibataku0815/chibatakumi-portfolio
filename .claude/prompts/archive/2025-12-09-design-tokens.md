# Design Tokens Addition

Haiku 4.5 向け追加プロンプト

---

## タスク概要

アニメーション・レイアウトに関するデザイントークンを globals.css に追加する。
これにより、コードベース全体で一貫した値を使用できるようになる。

---

## 禁止事項

以下は絶対に行わないこと:

1. **コミットを行わない** - `git commit` は絶対に実行しない
2. **ビルド・リンター確認は不要** - 実行しない
3. **既存のトークンを削除・変更しない** - 新規追加のみ

---

## 変更ファイル

| ファイル | アクション |
|----------|----------|
| `apps/web/src/app/globals.css` | 追加 |

---

## 追加するトークン

`apps/web/src/app/globals.css` の `:root` セクションに以下のトークンを追加:

```css
:root {
  /* 既存のトークン（変更しない） */

  /* === Animation timing tokens === */
  --timing-entry: 0.8s;
  --timing-reveal: 0.9s;
  --timing-stagger: 0.06s;
  --timing-scrub: 0.8;

  /* === Ghost opacity levels === */
  --ghost-subtle: 0.08;
  --ghost-medium: 0.12;
  --ghost-strong: 0.15;

  /* === Rail spacing tokens === */
  --rail-margin-sm: 4.2rem;
  --rail-margin-md: 5.5rem;
  --rail-margin-lg: 6.5rem;

  /* === Section min-height tokens === */
  --section-min-h-sm: 70vh;
  --section-min-h-md: 78vh;
  --section-min-h-lg: 82vh;
}
```

---

## 追加位置の詳細

globals.css の構造を確認し、適切な位置に追加する。

### 推奨追加位置

既存の `:root` ブロック内の、セマンティックカラートークンの後に追加:

```css
:root {
  /* 既存: Radix Colors ベースのセマンティックカラー */
  --bg-dark: var(--slate-1);
  --bg-darker: var(--slate-2);
  --text-base: var(--slate-12);
  --text-muted: var(--slate-11);
  --accent-amber1: var(--amber-9);
  --accent-amber2: var(--amber-10);

  /* 既存: 透過バリエーション */
  --text-base-90: color-mix(in srgb, var(--slate-12) 90%, transparent);
  --text-base-80: color-mix(in srgb, var(--slate-12) 80%, transparent);
  /* ... */

  /* ↓ ここに追加 ↓ */

  /* === Animation timing tokens === */
  --timing-entry: 0.8s;
  --timing-reveal: 0.9s;
  --timing-stagger: 0.06s;
  --timing-scrub: 0.8;

  /* === Ghost opacity levels === */
  --ghost-subtle: 0.08;
  --ghost-medium: 0.12;
  --ghost-strong: 0.15;

  /* === Rail spacing tokens === */
  --rail-margin-sm: 4.2rem;
  --rail-margin-md: 5.5rem;
  --rail-margin-lg: 6.5rem;

  /* === Section min-height tokens === */
  --section-min-h-sm: 70vh;
  --section-min-h-md: 78vh;
  --section-min-h-lg: 82vh;
}
```

---

## トークンの使用方法

追加したトークンは以下のように使用する:

### Animation timing

```tsx
// GSAP で使用
gsap.to(element, {
  duration: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--timing-entry')),
  // ...
});

// または直接参照
const ANIMATION_CONFIG = {
  entry: { duration: 0.8 }, // --timing-entry と同じ値
};
```

### Ghost opacity

```tsx
// インラインスタイルで使用
style={{ color: `rgba(255,255,255,var(--ghost-medium))` }}

// または Tailwind arbitrary value
className="text-[rgba(255,255,255,var(--ghost-medium))]"
```

### Rail spacing

```tsx
// Tailwind arbitrary value で使用
className="ml-[var(--rail-margin-sm)] sm:ml-[var(--rail-margin-md)] md:ml-[var(--rail-margin-lg)]"
```

### Section min-height

```tsx
// Tailwind arbitrary value で使用
className="min-h-[var(--section-min-h-sm)] sm:min-h-[var(--section-min-h-md)]"
```

---

## 品質チェックリスト

実装完了後、以下を確認:

- [ ] トークン命名が一貫している（kebab-case）
- [ ] 既存トークンと重複していない
- [ ] コメントでセクションが明確に分かれている
- [ ] **コミットを行っていない**

---

## トークン設計の背景

### Animation timing tokens
- `--timing-entry`: エントリーアニメーションの標準duration（0.8s）
- `--timing-reveal`: reveal系アニメーション（clipPath等）のduration（0.9s）
- `--timing-stagger`: stagger間隔の標準値（0.06s = 60ms）
- `--timing-scrub`: ScrollTrigger scrubの標準値（0.8）

### Ghost opacity levels
- `--ghost-subtle`: 非常に控えめな背景テキスト（0.08）
- `--ghost-medium`: 標準的な背景テキスト（0.12）- Strengths向け
- `--ghost-strong`: 強調された背景テキスト（0.15）- Timeline向け

### Rail spacing tokens
- レールの幅と対応するコンテンツのマージンを一元管理
- デバイスサイズに応じた3段階（sm/md/lg）

### Section min-height tokens
- セクションの最小高さを一元管理
- ビューポート比率（vh）で定義

---

## 注意事項

- このプロンプトは Haiku 4.5 での実装を前提としている
- 既存のトークンは変更しない（追加のみ）
- 追加後、Skills/Profile ページでこれらのトークンを活用可能
