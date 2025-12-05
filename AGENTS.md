# Codex CLI Agent Policy

言語: 日本語

このファイルは **Codex CLI 専用** です。グローバルルールは `.ai/GLOBAL.md` を参照してください。

---

## 参照ドキュメント

| ファイル | 内容 |
|---------|------|
| `.ai/GLOBAL.md` | 共通グローバルルール（全ツール共通） |
| `.ai/parallel-work.md` | パラレルワーク協調プロトコル |
| `.ai/tool-mapping.md` | ツール機能マッピング |
| `.claude/tasks/ACTIVE-PARALLEL-TASK.md` | タスク進捗（共有） |
| `apps/exampleXX/` | サンプル実装 + YouTube文字起こし |

---

## Codex CLI ツール運用

| 機能 | ツール |
|------|--------|
| 思考整理 | `sequential-thinking__sequentialthinking` |
| 計画管理 | `update_plan` |
| 時刻取得 | `time__get_current_time` (Asia/Tokyo) |
| Web取得 | `fetch__fetch`（一次情報優先、URL明示） |
| コード検索 | `rg` |
| ファイル変更 | `apply_patch`（最小差分） |

---

## 実行と安全性

- 破壊的・広範囲変更前は意図/影響を簡潔に共有
- 新規環境変数や設定追加は原則禁止（必要時のみ合意の上）
- ログ/デバッグ用コードは提出前に除去
- 独立作業はまとめて実行し、結果を要点で共有

---

## 並行作業時の注意

1. `.claude/tasks/ACTIVE-PARALLEL-TASK.md` で作業宣言
2. `.ai/parallel-work.md` の協調プロトコルを遵守
3. 競合検出時は停止して報告

---

## サンプル実装の学習

アニメーション/シェーダー実装時は `apps/exampleXX/` を**必ず参照**:

1. `transcript.md` を読んで概念・意図を理解
2. `src/` のコードを分析
3. 本番への適用方法を提案（実装前に確認）
4. 承認後、実装

**禁止:** サンプルを見ずに手探りで実装しない

---

## 出力スタイル

- 簡潔・行動志向
- ファイル/コマンドはバッククォートで明示
- 逐語の原則列挙は不要
