# Claude Code Agent Policy

このファイルは **Claude Code 専用** です。グローバルルールは `.ai/GLOBAL.md` を参照してください。

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

## Claude Code ツール運用

| 機能 | ツール |
|------|--------|
| 深い思考 | (組み込み) |
| 計画管理 | `TodoWrite` |
| 時刻取得 | `Bash(TZ=Asia/Tokyo date)` |
| Web取得 | `WebFetch` / MCP |
| コード検索 | `Grep` / `Task(Explore)` |
| ファイル読み取り | `Read` |
| ファイル編集 | `Edit`（最小差分） |
| ファイル作成 | `Write` |
| 並列タスク | `Task` |

---

## ワークフロー

1. **思考:** 複雑なタスクは段階的に整理
2. **計画:** `TodoWrite` で手順をチェックリスト化
3. **実行:** 最小差分で実装（Next.js + Tailwind + shadcn/ui）
4. **検証:** 必要な範囲でローカル検証
5. **記録:** `.claude/tasks/ACTIVE-PARALLEL-TASK.md` を更新

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

## 実装ガイド

- Next.js App Router 前提
- Tailwind: カスタムトークン優先、ユーティリティ乱立を避ける
- UI: shadcn/ui + Radix を優先活用（アクセシビリティ担保）
- アニメーション: Phase 1 は Framer Motion、Phase 2 で GSAP / Three.js
- メディア/アニメ層はラッパーコンポーネントで抽象化

---

## 変更・安全

- 破壊的変更や設定追加は事前に意図/影響を共有
- 新規環境変数は原則追加しない
- デバッグ/一時コードはコミット前に除去
- 並列で行える操作はまとめて実行

---

## 出力スタイル

- 簡潔・行動志向
- ファイルパスはバッククォートで明示
- 逐語列挙や長文化は避ける
