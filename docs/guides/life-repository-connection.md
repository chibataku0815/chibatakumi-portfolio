# Life リポジトリとの役割分担（このリポ用・短文）

> **目的**: **実装はこのリポ（portfolio）**、**タスク・運用・長文の索引は life** であることを迷わず説明する。詳しい運用ルールは **life 側の正本**に集約する。

## このリポ（chibatakumi-portfolio）

- **正**: アプリコード、`apps/web`、`apps/desktop-film-lab-batch`、`packages/*`、本番デプロイ・DMG・環境変数。
- **ドキュメント**: リリース・公証・Filmtone 固有の手順は **`docs/guides/`**（このリポ内）。

## Life リポジトリ（別ディレクトリ）

- **正**: GitHub Issues、`.claude/tasks/`、 Film Lab / Filmtone の **読書ラダー**（`docs/guides/film-lab-documentation-index.md`）、クロスセッションの handoff。
- **パス例**（環境により異なる）: `/Users/chibatakumi/Documents/life` など。`life` の `CLAUDE.md` にクロスリポの例あり。

## 同期の型

- **進捗を life に載せる**: Claude Code の `project-sync` スキル（life 側に Issue / `ideas/status/`）。
- **仕様の議論**: 実装と矛盾する場合は **このリポのコードまたは本リポの guides** を先に確認し、life は **索引・経緯**として参照する。

## 関連（life 側）

- 運用ルールのマスター: `docs/guides/2026-03-31-life-operations-rules-master-plan.md`（**life リポ内のパス**）
- 短い要約: `life/.claude/knowledge/patterns/life-repo-operations-ssot.md`
