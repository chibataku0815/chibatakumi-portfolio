# Design Consistency Brushup Plan

**作成日:** 2025-12-07T22:21:23+0900 (Asia/Tokyo)
**ステータス:** 計画完了・実装待機

---

## 背景と目的

現在のポートフォリオサイトはデザインシステムとしてRadix Colorsベースのトークン、GSAPアニメーション、Tailwind CSS v4を採用しており、全体的に高い成熟度を持つ。しかし、実装レベルで以下の統一性課題が存在する。

本タスクはUI/デザインの統一性を向上させ、保守性とスケーラビリティを高めることを目的とする。

---

## 特定された課題

### P1: カラー指定の不統一（高優先度）

| 箇所 | 現状 | 問題点 |
|------|------|--------|
| HeroText.tsx | `text-white`, `text-white/50` | CSS変数未使用 |
| HorizontalWorks.tsx | `text-white/20`, `bg-white/10` | CSS変数未使用 |
| SpotlightGallery.tsx | `bg-white/5`, `bg-white/10` | CSS変数未使用 |
| Nav.tsx | `text-[var(--text-base)]` | ✓ 適切 |

**推奨対応:**
- `text-white` → `text-[var(--text-base)]` または Tailwindカラートークン
- 透明度指定を統一（`text-white/50` → `text-text-base/50` またはCSS変数化）

### P2: タイポグラフィトークンの未活用（高優先度）

`globals.css`に定義済みのトークンが未使用:
```css
--type-display-xl: clamp(3.5rem, 12vw, 8rem);
--type-display-lg: clamp(2.5rem, 6vw, 4rem);
--type-body: 1rem;
--type-caption: 0.875rem;
```

| 箇所 | 現状 | 推奨 |
|------|------|------|
| HeroText.tsx:153 | `text-[clamp(2.75rem,10vw,7rem)]` | `text-[var(--type-display-xl)]` 相当にスケール統合 |
| HorizontalWorks.tsx:373 | `text-[clamp(2rem,6vw,4rem)]` | `text-[var(--type-display-lg)]` |
| SpotlightGallery.tsx:295 | `text-[clamp(1.5rem,5vw,3rem)]` | 新トークン追加または既存調整 |

### P3: アニメーション設定の散在（中優先度）

各コンポーネントでGSAPパラメータがハードコード:

| パラメータ | HeroText | HorizontalWorks | AnimatedHeading |
|-----------|----------|-----------------|-----------------|
| duration | 0.7s | 0.25s | 0.6s |
| stagger | 0.035s | 0.025s | 0.03s |
| ease | power2.out | power2.out | power2.out |
| blur | 8px | 4px | 4px |

**推奨対応:**
- `src/shared/animation/constants.ts` に共通プリセット定義
- または `globals.css` にCSS変数として定義

### P4: Shadow/Border値の散在（低優先度）

```tsx
// HorizontalWorks.tsx:429
shadow-[0_0_12px_rgba(250,250,250,0.6)]

// globals.css:129-131
box-shadow: 0 0 8px rgba(250,250,250,0.6), 0 0 20px rgba(250,250,250,0.3);
```

**推奨対応:**
- `--shadow-glow-sm`, `--shadow-glow-lg` などのトークン化

---

## 対応方針

### Phase 1: カラー統一（必須）
1. globals.cssに透明度付きカラートークンを追加
2. 各コンポーネントの `text-white`, `bg-white` 系を置換

### Phase 2: タイポグラフィ統一（必須）
1. 既存トークンの値を調整（実際の使用箇所に合わせる）
2. 必要に応じて新トークン追加
3. 各コンポーネントをトークン参照に置換

### Phase 3: アニメーション統一（推奨）
1. `src/shared/animation/constants.ts` を新規作成
2. 共通プリセットを定義
3. 各コンポーネントでimportして使用

### Phase 4: Shadow/Borderトークン化（任意）
1. globals.cssにshadowトークン追加
2. インラインshadow値を置換

---

## 影響範囲

| ファイル | 変更内容 |
|---------|---------|
| `src/app/globals.css` | トークン追加・調整 |
| `src/features/hero/components/HeroText.tsx` | カラー・タイポグラフィ置換 |
| `src/features/works/horizontal/HorizontalWorks.tsx` | カラー・タイポグラフィ置換 |
| `src/features/works/spotlight/SpotlightGallery.tsx` | カラー・タイポグラフィ置換 |
| `src/shared/components/AnimatedHeading.tsx` | アニメーション統一（任意） |
| `src/shared/animation/constants.ts` | 新規作成（Phase 3） |

---

## 制約事項

- コミットは明示的指示があるまで行わない
- 既存の視覚的外観を維持する（リファクタリングのみ）
- ビルド・リンターエラーを発生させない
- 新規依存パッケージの追加禁止

---

## 関連ドキュメント

- `.ai/GLOBAL.md` - デザイン原則「Pitch Black & Fire」
- `apps/web/src/app/globals.css` - 現行トークン定義
- `.claude/prompts/2025-12-07-claude-code-design-consistency.md` - 実装プロンプト

---

## 備考

デザインシステム成熟度スコア: 4.4/5（Well-Structured）
主な改善ポイントはトークン活用率の向上とコードレベルの統一性確保。
