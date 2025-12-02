# CLAUDE.md

このリポジトリで Claude / Codex CLI を運用するための補足ガイドです。詳細規約は `AGENTS.md` を参照。

## ワークフロー（フェーズ整合）
1) Ultra think: `sequential-thinking__sequentialthinking` で課題/前提を整理  
2) Plan: `update_plan` で手順をチェックリスト化  
3) Execute: 最小差分で実装（Next.js + Tailwind + shadcn/ui + Framer Motion）  
4) Verify: 必要な範囲でローカル検証（デザイン/挙動の目視含む）  
5) Document: `.claude/tasks/ACTIVE-PARALLEL-TASK.md` を更新（mcp-time, Asia/Tokyo）

## ツールマッピング
| 用途 | ツール |
| --- | --- |
| 思考整理 | `sequential-thinking__sequentialthinking` |
| 計画管理 | `update_plan` |
| 時刻取得 | `time__get_current_time` (Asia/Tokyo) |
| Web取得 | `fetch__fetch` |
| コード/テキスト検索 | `rg` ほかシェル |

## 実装ガイド
- Next.js App Router 前提。データ取得は適切なレイヤー（Server Component/Action）で。
- Tailwind: カスタムトークン（漆黒/Amber）を定義し再利用。ユーティリティの乱立を避ける。
- UI: shadcn/ui + Radix を優先活用。アクセシビリティ属性を崩さない。
- アニメーション: Phase 1 は Framer Motion で軽量演出。Three.js/GSAP 置換を想定し、メディア/アニメ層はラッパーコンポーネントで抽象化。
- デザイン: Pitch Black & Fire（背景漆黒、テキスト明度控えめ、Amberは限定的）。Hero=抽象カラー+粒子/光漏れ、Grid=モノクロ高コントラスト+粒子、ホバーで瞬間的カラー復元/グリッチ。

## 変更・安全
- 破壊的変更や設定追加は事前に意図/影響を簡潔に共有。新規環境変数は原則追加しない。
- デバッグ/一時コード・不要ログはコミット前に除去。
- 並列で行える操作はまとめて実行し、要点のみ共有。

## ドキュメント/出力
- タスク進行は `.claude/tasks/ACTIVE-PARALLEL-TASK.md` を単一の真実源に。時刻は `time__get_current_time`（Asia/Tokyo）。
- 出力は簡潔・行動志向。逐語列挙や長文化は避ける。ファイルパスはバッククォートで明示。
