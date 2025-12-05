# Global Rules Strategy - Knowledge Document

作成日: 2025-12-05
カテゴリ: プロジェクト運用

---

## 概要

複数のAIツール（Claude Code / Cursor AI / Codex CLI）が同一リポジトリで作業するための統一ルールを策定。

## アーキテクチャ

```
.ai/                        # 共通層（全ツール参照）
├── GLOBAL.md               # グローバルルール
├── parallel-work.md        # パラレルワーク協調プロトコル
└── tool-mapping.md         # ツール機能マッピング

.cursor/rules/              # Cursor AI専用
├── global.mdc              # グローバル参照 + Cursor固有
├── coding.mdc              # コーディング規約
└── workflow.mdc            # ワークフロー（Sequential Thinking等）

AGENTS.md                   # Codex CLI専用
CLAUDE.md                   # Claude Code専用

.claude/tasks/
└── ACTIVE-PARALLEL-TASK.md # 共有タスク管理（Single Source of Truth）
```

## 重要な設計判断

### 1. 共通層と固有層の分離

**理由:** 各ツールが異なるファイルを優先読み込みするため

| ツール | 優先読み込み |
|--------|-------------|
| Claude Code | `CLAUDE.md` |
| Cursor AI | `.cursor/rules/*.mdc` |
| Codex CLI | `AGENTS.md` |

**解決策:** `.ai/GLOBAL.md`を共通層とし、各ツール固有ファイルから参照

### 2. `.cursorrules` vs `.cursor/rules/*.mdc`

- `.cursorrules`: 旧形式、非推奨
- `.cursor/rules/*.mdc`: 新形式、推奨

**決定:** 新形式に統合し、旧形式を削除

### 3. パラレルワーク協調

**問題:** 複数エージェントが同一ファイルを編集すると競合

**解決策:**
1. タスク開始時に `ACTIVE-PARALLEL-TASK.md` に作業宣言
2. 変更予定ファイルを明記
3. 同一ファイルの同時編集を禁止
4. ディレクトリレベルで担当分離

## サンプル実装の学習（Sample-First Workflow）

アニメーション/シェーダー実装で品質問題が発生した教訓から導入。

**手順:**
1. `apps/exampleXX/transcript.md` で概念・意図を理解
2. `apps/exampleXX/src/` でコードを分析
3. 本番への適用方法を提案（実装前に確認）
4. 承認後、実装

**禁止:** サンプルを見ずに手探りで実装しない

## 確認方法

Cursorでルール認識を確認するプロンプト:
`.claude/prompts/cursor-rules-verification.md`

## 関連ファイル

| ファイル | 役割 |
|---------|------|
| `.ai/GLOBAL.md` | 共通グローバルルール |
| `.ai/parallel-work.md` | パラレルワーク協調 |
| `.ai/tool-mapping.md` | ツール機能マッピング |
| `.cursor/rules/global.mdc` | Cursor グローバル |
| `.cursor/rules/coding.mdc` | Cursor コーディング規約 |
| `.cursor/rules/workflow.mdc` | Cursor ワークフロー |
| `AGENTS.md` | Codex CLI専用 |
| `CLAUDE.md` | Claude Code専用 |

## 教訓

1. **バージョン確認:** `package.json`の実際のバージョンとルールファイルの記載を一致させる
2. **キャッシュ:** Cursorは設定をキャッシュするため、変更後は再起動が必要
3. **形式移行:** 旧形式ファイルを削除しないと優先されることがある
