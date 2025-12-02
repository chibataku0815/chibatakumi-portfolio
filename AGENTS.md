# Codex CLI Global Agent Policy (Portfolio)

言語: 日本語

このリポジトリ（Next.js + Tailwind + shadcn/ui + Framer Motion のポートフォリオサイト）でのCodex CLIグローバル運用規約です。Phase 2 での GSAP / Three.js 拡張を見据え、最小差分かつ拡張性重視で運用します。

## ソース・オブ・トゥルース
- 本ファイル `AGENTS.md`
- 運用詳細: `CLAUDE.md`
- タスク管理: `.claude/tasks/ACTIVE-PARALLEL-TASK.md`
- 補足知見: `.claude/knowledge/`（必要最小限のみ）

## ツール運用（MCP/CLI）
- 時刻取得は常に `time__get_current_time`（IANA: Asia/Tokyo）。
- Web取得は `fetch__fetch`（一次情報優先、URL明示）。
- 思考整理は `sequential-thinking__sequentialthinking`、計画は `update_plan`。
- 検索/参照は `rg` を優先。変更は最小差分で `apply_patch`。
- 独立作業はまとめて実行し、結果を要点で共有。

## 実行と安全性
- 破壊的・広範囲変更前は意図/影響を簡潔に共有。
- 新規環境変数や設定追加は原則禁止（必要時のみ合意の上）。
- ログ/デバッグ用コードは提出前に除去。

## エンジニアリング原則
- KISS / DRY / YAGNI を徹底。既存スタイル・パターンを尊重。
- Next.js App Router 前提。Server Component/Action を適材適所に。
- Tailwind: カスタムトークンを優先し、インラインスタイル多用を避ける。
- shadcn/ui + Radix を優先活用。Framer Motion は軽量な演出に限定（Phase 1）。
- Phase 2 拡張余地を確保（GSAP / Three.js 置換しやすい抽象化）。

## デザインガード（Pitch Black & Fire）
- 背景は漆黒（#050505–#0a0a0a）、本文はオフホワイト/グレー（~#ededed）。
- アクセントは Amber/Orange を限定使用（リンク・インタラクションの熱源）。
- Hero: 抽象カラー + 粒子・光漏れ（色は殺さない）。Grid: モノクロ高コントラスト + 強粒子、ホバーで一瞬カラー/グリッチ。
- Noise/Grain は CSS filter/SVG overlay を優先し軽量に。

## ドキュメント運用
- タスクは `.claude/tasks/ACTIVE-PARALLEL-TASK.md` を単一の真実源として更新。時刻は `time__get_current_time`（Asia/Tokyo）。
- 新規ドキュメントは必要最小限。既存章へ統合を優先。

## 出力スタイル（Codex CLI準拠）
- 簡潔・行動志向。ファイル/コマンドはバッククォートで明示し、クリック可能なパスを提示。
- 逐語の原則列挙は不要。行動と結果で担保。
