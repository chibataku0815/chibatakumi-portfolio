# Design Consistency Brushup - 技術知見

**作成日:** 2025-12-07T23:21:33+0900 (Asia/Tokyo)
**カテゴリ:** デザインシステム / CSS / リファクタリング

---

## 概要

ポートフォリオサイトのUI/デザイン統一性を向上させるリファクタリングを実施。
`text-white/XX` などのTailwindユーティリティをCSS変数ベースのトークンに置換した。

---

## 実装したトークン

### 透明度付きテキストカラー

```css
--text-base-90: color-mix(in srgb, var(--slate-12) 90%, transparent);
--text-base-80: color-mix(in srgb, var(--slate-12) 80%, transparent);
--text-base-60: color-mix(in srgb, var(--slate-12) 60%, transparent);
--text-base-50: color-mix(in srgb, var(--slate-12) 50%, transparent);
--text-base-40: color-mix(in srgb, var(--slate-12) 40%, transparent);
--text-base-30: color-mix(in srgb, var(--slate-12) 30%, transparent);
--text-base-20: color-mix(in srgb, var(--slate-12) 20%, transparent);
```

### 透明度付き背景オーバーレイ

```css
--bg-overlay-40: color-mix(in srgb, var(--slate-12) 40%, transparent);
--bg-overlay-20: color-mix(in srgb, var(--slate-12) 20%, transparent);
--bg-overlay-10: color-mix(in srgb, var(--slate-12) 10%, transparent);
--bg-overlay-5: color-mix(in srgb, var(--slate-12) 5%, transparent);
```

### Shadowトークン

```css
--shadow-glow-sm: 0 0 8px rgba(250, 250, 250, 0.6);
--shadow-glow-md: 0 0 12px rgba(250, 250, 250, 0.6);
--shadow-glow-lg: 0 0 8px rgba(250, 250, 250, 0.6), 0 0 20px rgba(250, 250, 250, 0.3);
```

---

## 置換パターン

| 変更前 | 変更後 |
|--------|--------|
| `text-white` | `text-[var(--text-base)]` |
| `text-white/50` | `text-[var(--text-base-50)]` |
| `text-white/40` | `text-[var(--text-base-40)]` |
| `text-white/30` | `text-[var(--text-base-30)]` |
| `text-white/20` | `text-[var(--text-base-20)]` |
| `bg-white/10` | `bg-[var(--bg-overlay-10)]` |
| `bg-white/5` | `bg-[var(--bg-overlay-5)]` |
| `shadow-[0_0_12px_...]` | `shadow-[var(--shadow-glow-md)]` |

---

## 技術的決定

### `color-mix()` の採用理由

1. **Radix Colors との親和性**: 既存の `--slate-12` 等のトークンを再利用できる
2. **動的計算**: 透明度をCSS側で計算するため、テーマ変更時にも自動追従
3. **ブラウザサポート**: 2023年以降の主要ブラウザで完全サポート

### Tailwind v4 `@theme inline` との統合

```css
@theme inline {
  --color-text-base-50: var(--text-base-50);
  --color-bg-overlay-10: var(--bg-overlay-10);
  /* ... */
}
```

これにより `text-text-base-50` のようなTailwindクラスも使用可能になる（任意）。

---

## 影響ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/app/globals.css` | トークン追加、Shadow置換 |
| `src/features/hero/components/HeroText.tsx` | カラー置換（4箇所） |
| `src/features/works/horizontal/HorizontalWorks.tsx` | カラー・Shadow置換（6箇所） |
| `src/features/works/spotlight/SpotlightGallery.tsx` | カラー置換（2箇所） |

---

## 今後の拡張

1. **アニメーショントークン**: GSAPパラメータの一元化（duration, stagger, ease）
2. **タイポグラフィトークン活用**: `--type-display-xl` 等の既存トークンをコンポーネントで使用
3. **スペーシングトークン**: 共通のmargin/paddingスケール定義

---

## 参照

- `.claude/tasks/archive/2025-12-07-design-consistency-brushup.md` - タスク計画
- `.ai/GLOBAL.md` - デザイン原則「Pitch Black & Fire」
