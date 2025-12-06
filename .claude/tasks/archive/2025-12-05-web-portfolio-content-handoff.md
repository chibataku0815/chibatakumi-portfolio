# 2025-12-05 apps/web Portfolio Content Handoff
- **完了:** 2025-12-05T22:48:00+09:00 (Asia/Tokyo)
- **目的:** サンプル文言/ビジュアルを本人ポートフォリオ用の実データに差し替えるための引き継ぎ指針。ロゴ/タイトルSVGを本人がIllustratorで用意する前提で格納設計を提示。
- **実装状態:** トランジション・マルチページ構造は完成。コンテンツはプレースホルダ。

## 必要なコンテンツ入力
- ペルソナ/肩書き: Heroタイトル/サブコピー（JP/ENの方針含む）。
- Works: Motion/Interactive/Installation 各セクションの実案件タイトル・説明・タグ・サムネ（画像 or グラデ）。
- Archive: 年/カテゴリリストの実データ（JSON化前提でOK）。
- Contact: CTA文言、メール/リンク。
- SEO: metadata title/descriptionの最終文言。

## ロゴ/SVG格納提案
- 推奨パス: `apps/web/public/assets/logo/` に `logo-mark.svg`（ストローク用）、`logo-type.svg`（タイプ付き）を配置。
- Reactインポート用に必要なら `src/shared/assets/logo/` にも複製し、`Logo` コンポーネントで切替可能にする案。
- strokeアニメ対応のため、パスは単一<path> or 複数パスでもstrokeDasharrayが効く構造で書き出す。

## 差し替えフロー（提案）
1) アセット投入: 上記パスにSVGとサムネ画像（軽量）を配置。
2) コンテンツJSON化: `src/shared/data/works.ts` 等に実データを集約し、各ページで参照させる（現在はページ内にベタ記述）。
3) 文章校正: Hero/セクション見出しを本人トーンに統一。英日どちらで出すか決定。
4) トランジション調整: ロゴストローク色/塗りの変数化（`var(--text-base)` → トークン化）。

## 注意
- `data-transition="true"` を付けた内部リンクのみトランジション対象。外部リンクには付与しない。
- コミット済みのため、次タスクでは新ブランチ or 新コミットで進行。
