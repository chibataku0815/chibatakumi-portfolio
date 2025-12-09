# 2025-12-05 apps/web Portfolio Prompt Refresh
- Created: 2025-12-05T23:07:53+09:00 (Asia/Tokyo)
- Purpose: `apps/web` のプレースホルダ文言・抽象ロゴを本人ポートフォリオ実データに置き換えるため、Claude Code (Haiku 4.5) 向け詳細プロンプトを整備する
- Scope: ドキュメント作成のみ（実装は後続のClaude Codeに委譲）
- Constraints: コミット禁止 / ビルド・リンター手順の記載禁止 / 依存追加禁止 / 最小差分

---

## 背景・現状
- トランジション・マルチページ構造は実装済み（`PageTransition` 20ブロック＋ロゴストローク、`Nav`, `AnimatedHeading` 等）。各ページの文言・データはサンプルのまま。
- 差し替え対象の主なハードコード:
  - `src/features/hero/components/HeroText.tsx`（タイトル/サブコピー）
  - `src/shared/components/Nav.tsx`（ブランド表記 `TC`）
  - `src/shared/transitions/Logo.tsx`（抽象モノラインロゴ）
  - `src/app/{motion,interactive,installation,archive,contact}/page.tsx`（各配列/テキスト）
  - `src/features/works/horizontal/HorizontalWorks.tsx`（`WORKS` 定数）
  - `src/features/works/spotlight/SpotlightGallery.tsx`（`IMAGES` 等の定数）
  - `src/app/layout.tsx`（metadata）
- 既存プロンプト `.claude/prompts/2025-12-05-claude-code-web-portfolio-handoff.md` は概要のみ。実装指示・データスキーマ・タッチポイントを細かくした新規プロンプトが必要。

## 新プロンプトで必ず触れる項目
- **必要入力（ユーザーから）**: Heroコピー(JP/EN)・サブコピー、各ジャンル(M/I/I)の案件タイトル/短文/タグ/サムネ指定、Archiveの年カテゴリ配列、Contact文言＋メール/リンク、ロゴSVG仕様（ストローク/塗り/パス構造）、SEO用タイトル/ディスクリプション、Spotlight/HW用サムネ要否。
- **資産配置**: `apps/web/public/assets/logo/logo-mark.svg` と `logo-type.svg` を前提に格納。必要なら `src/shared/assets/logo/` へ複製し、`Logo`/`Nav`/`PageTransition` が差し替えやすい形にする。新規トークン案 `--transition-overlay` `--logo-stroke` `--logo-fill` を `globals.css` に追加する指示。
- **データ集約**: `src/shared/data/portfolio.ts`（名称提案）に hero/nav/works(各カテゴリ)/archive/contact/metadata/spotlight/horizontalWorks の型付きオブジェクトを定義し、各ページのベタ書きを置換する手順を明記。
- **ページ差し替え指針**: `AnimatedHeading` 経由の見出し更新、Navブランド表記更新、metadata書き換え、プレースホルダ背景の継続利用（画像未提供時）。Bilingual時のクラス調整の注意。
- **挙動/安全**: `data-transition="true"` 内部リンクのみを対象、外部リンクは除外。`splitText` の `revert` を保持。`PageTransition` の z-index/pointer-events を崩さない。依存追加禁止・コミット禁止・ビルド/リンター案内禁止を明記。

## 成果物
- `.claude/prompts/2025-12-05-claude-code-web-portfolio-prompt-refresh.md` にHaiku 4.5向け詳細実装プロンプトを作成すること。
- 本ドキュメントを追加したうえで、ACTIVEタスクを更新（完了時はステータス変更）すること。
