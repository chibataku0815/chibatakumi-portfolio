# Active Parallel Task

## 現在アクティブなタスク

### Index Brushup - グラフィックデザイン強化 (2025-12-07)
- **開始:** 2025-12-07T22:52:14+0900 (Asia/Tokyo)
- **ステータス:** Phase 1 プロンプト作成完了・実装待機
- **内容:** indexページのビジュアルインパクト強化。グラフィックデザイン観点（構図、タイポグラフィ、モーション）からの全面リデザイン。
- **フェーズ構成:**
  - Phase 1: Hero Section リデザイン（非対称配置、タイポグラフィ強化）← **プロンプト作成済み**
  - Phase 2: Hero → Works トランジション演出強化
  - Phase 3: Works Section リデザイン（パネルごとに構図変化）
  - Phase 4: 視覚言語の統一（アンバーアクセント活用）
- **成果物:**
  - `.claude/tasks/2025-12-07-index-brushup-plan.md` - 全体計画
  - `.claude/prompts/2025-12-07-claude-code-index-brushup-hero.md` - Phase 1 実装プロンプト
- **新規スキル追加:**
  - `.claude/skills/art-direction/` - アートディレクション
  - `.claude/skills/visual-composition/` - ビジュアルコンポジション
  - `.claude/skills/motion-design/` - モーションデザイン
- **影響ファイル:**
  - `src/features/hero/components/HeroText.tsx` - 構図・タイポグラフィ変更
  - `src/features/works/horizontal/HorizontalWorks.tsx` - パネル構図変更（Phase 3）
  - `src/app/globals.css` - スタイル追加
- **備考:** 実装は Claude Code (Haiku 4.5) に委譲。**コミット禁止**。

---

最終更新: 2025-12-07T23:21:33+0900 (Asia/Tokyo)

---

## 直近の完了タスク

### ✅ Design Consistency Brushup (2025-12-07)
- **完了:** 2025-12-07T23:21:33+0900 (Asia/Tokyo)
- **内容:** UI/デザイン統一性向上のリファクタリング。カラー・タイポグラフィ・Shadowのトークン化。
- **成果物:**
  - `src/app/globals.css` - トークン追加（--text-base-{20-90}, --bg-overlay-{5-40}, --shadow-glow-{sm,md,lg}）
  - `src/features/hero/components/HeroText.tsx` - カラー置換
  - `src/features/works/horizontal/HorizontalWorks.tsx` - カラー・Shadow置換
  - `src/features/works/spotlight/SpotlightGallery.tsx` - カラー置換
- **技術的解決:**
  - `color-mix(in srgb, ...)` で透明度トークンを定義
  - `text-white/XX` → `text-[var(--text-base-XX)]` に統一
  - `bg-white/XX` → `bg-[var(--bg-overlay-XX)]` に統一
  - インラインshadow値 → `var(--shadow-glow-XX)` に統一
- **関連ドキュメント:**
  - `.claude/tasks/archive/2025-12-07-design-consistency-brushup.md`
  - `.ai/knowledge/2025-12-07-design-consistency-brushup.md`

### ✅ Section Scroll Snap Implementation (2025-12-07)
- **完了:** 2025-12-07T22:12:01+0900 (Asia/Tokyo)
- **内容:** indexページにセクションスナップ（スクロールジャック）を実装。中途半端なスクロール位置を防止し、セクションごとにきっちりスナップする。
- **成果物:**
  - `src/features/scroll-manager/` - コンポーネント・フック一式
  - HorizontalWorks/SpotlightGallery に ScrollTrigger ID 追加
  - `page.tsx` に SectionScrollManager 統合
- **技術的解決:**
  - GSAP Observer + ScrollToPlugin でスナップ実装
  - ScrollTrigger.progress を使用してpinned セクション内のスナップを制御
  - progress 0〜2% または 98〜100% の場合のみスナップ許可
- **関連ドキュメント:**
  - `.claude/tasks/2025-12-07-scroll-snap-implementation-plan.md`
  - `.claude/prompts/2025-12-07-claude-code-scroll-snap.md`
  - `.ai/knowledge/2025-12-07-scroll-snap-implementation.md`

### ✅ Fluid Gradient Integration (2025-12-07)
- **完了:** 2025-12-07T21:51:30+0900 (Asia/Tokyo)
- **内容:** `apps/cg-webgl-interactive-gradient` を `apps/web` へ統合。Hero以外のセクションにモノトーンFluidGradientBackgroundを配置。
- **成果物:**
  - `src/features/fluid-gradient/` - コンポーネント・シェーダー一式
  - `src/app/page.tsx` - sticky パターンでセクション背景配置
  - `.ai/knowledge/2025-12-07-fluid-gradient-integration.md` - 技術知見
- **技術的解決:**
  - Document-level マウスイベントで z-index 問題を解決
  - Sticky パターンでセクション別背景を実現
  - fluidConfigMonochrome プリセット（Radix slate ベース）
- **関連ドキュメント:**
  - `.claude/tasks/2025-12-07-fluid-gradient-integration-plan.md`
  - `.claude/prompts/2025-12-07-claude-code-fluid-gradient-integration.md`
  - `.claude/prompts/2025-12-07-claude-code-fluid-gradient-sections.md`

### ✅ apps/web Portfolio Prompt Refresh (2025-12-05)
- **完了:** 2025-12-05T23:10:46+09:00 (Asia/Tokyo)
- **内容:** Claude Code (Haiku 4.5) 向けにポートフォリオ実データ差し替え用の詳細プロンプトとタスクドキュメントを整備。ロゴ差し替え設計、データ集約スキーマ、挙動のガードレールを明記。
- **成果物:**
  - `.claude/tasks/2025-12-05-web-portfolio-prompt-refresh.md`
  - `.claude/prompts/2025-12-05-claude-code-web-portfolio-prompt-refresh.md`
  - `.claude/tasks/ACTIVE-PARALLEL-TASK.md`（更新）
- **備考:** 実装は未着手。コミット/依存追加禁止をプロンプトに明示。

### ✅ apps/web Page Transition & Multipage 計画 (2025-12-05)
- **完了:** 2025-12-05T22:32:00+09:00 (Asia/Tokyo)
- **内容:** apps/web 向けのマルチページ/トランジション設計計画およびClaude Code実装プロンプト作成
- **成果物:**
  - `.claude/tasks/2025-12-05-web-page-transition-plan.md`
  - `.claude/prompts/2025-12-05-claude-code-web-transition.md`
  - `.claude/tasks/ACTIVE-PARALLEL-TASK.md`（更新）
- **備考:** 実装は未着手。後続でClaude Code (Haiku 4.5) に委譲予定。

### ✅ Codegrid Page Transition Multipage 設計 (2025-12-05)
- **完了:** 2025-12-05T22:25:00+09:00 (Asia/Tokyo)
- **内容:** マルチページ化の計画策定とClaude Code向け実装プロンプト作成
- **成果物:**
  - `.claude/tasks/2025-12-05-codegrid-transition-plan.md`
  - `.claude/prompts/2025-12-05-claude-code-codegrid-transition.md`
  - `.claude/tasks/ACTIVE-PARALLEL-TASK.md`（更新）
- **備考:** 実装は未着手。後続でClaude Code (Haiku 4.5) に委譲予定。

### ✅ apps/web Page Transition & Multipage 実装 (2025-12-05)
- **完了:** 2025-12-05T22:40:00+09:00 (Asia/Tokyo)
- **内容:** PageTransition（20ブロック＋ロゴストローク）導入、Nav/AnimatedHeading追加、マルチページ構成（Motion/Interactive/Installation/Archive/Contact）とトップのジャンルカードを実装
- **成果物:** `src/shared/transitions/*`, `src/shared/components/*`, `src/app/*`（各ページ追加・レイアウト更新）
- **備考:** コミット未実施。トランジションは`data-transition="true"`リンクのみをインターセプト。

### ✅ apps/web Portfolio Content Handoff (2025-12-05)
- **完了:** 2025-12-05T22:48:00+09:00 (Asia/Tokyo)
- **内容:** サンプルコンテンツを本人ポートフォリオ用に刷新するための引き継ぎプロンプト/タスク整理。ロゴ・タイトルSVGの格納先設計提案。
- **成果物:** `.claude/tasks/archive/2025-12-05-web-portfolio-content-handoff.md`, `.claude/prompts/2025-12-05-claude-code-web-portfolio-handoff.md`
- **備考:** 実装は未着手。コンテンツ/アセットを本人提供前提で設計。

### ✅ Reference Files Integration Plan (2025-12-05)
- **完了:** 2025-12-05T22:03:41+09:00 (Asia/Tokyo)
- **内容:** 参考ファイル精査と `apps/web` への組み込み計画策定、Claude Code向け実装プロンプト作成
- **成果物:**
  - `.claude/tasks/2025-12-05-reference-integration-plan.md`
  - `.claude/prompts/2025-12-05-claude-code-reference-integration.md`
  - `.claude/tasks/ACTIVE-PARALLEL-TASK.md`（更新）
- **備考:** 実装は未着手。後続タスクでClaude Code (Haiku 4.5) に委譲予定。

### ✅ Global Rules Strategy (2025-12-05)
- **完了:** 2025-12-05T21:00:00+09:00
- **内容:** パラレルワーク対応のグローバルルール策定
- **成果物:**
  - `.ai/GLOBAL.md` - 全AIツール共通ルール
  - `.ai/parallel-work.md` - パラレルワーク協調プロトコル
  - `.ai/tool-mapping.md` - ツール機能マッピング
  - `.cursor/rules/*.mdc` - Cursor AI専用ルール（3ファイル）
  - `AGENTS.md` - Codex CLI専用（リファクタリング）
  - `CLAUDE.md` - Claude Code専用（リファクタリング）
- **削除:** `.cursorrules`（旧形式）
- **ナレッジ:** `.claude/knowledge/2025-12-05-global-rules-strategy.md`

---

## Archived Tasks

以下は完了済みタスクのアーカイブ参照:

- `archive/2025-12-05-hero-text-animation-handoff.md` - Hero Text Animation引き継ぎ
- `archive/2025-12-04-typography-shader-implementation-prompt.md` - Typography/Shader実装プロンプト
- `archive/2025-12-02-bun-next-setup-guide.md` - Bun版 Next.js初期セットアップ
- `archive/2025-12-02-hero-bg-unification-prompt.md` - Hero/背景親和プロンプト
- `archive/2025-12-03-next-webgl-handoff-prompt.md` - WebGL保守性ハンドオフ
