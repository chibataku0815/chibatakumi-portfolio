# Claude Code Agent Policy

このファイルは **Claude Code 専用** です。グローバルルールは `.ai/GLOBAL.md` を参照してください。

---

## Filmtone は submodule（必読）

Filmtone Desktop / iOS / 共有 packages（`film-lab-core` / `film-lab-renderer` / `film-lab-ui` / `film-lab-smart-look`）は **`vendor/filmtone` submodule 経由で消費** している（2026-05-01 detach、commit `84766134`）。実装は standalone リポ `/Volumes/SamsungPortableSSDX5001/documents/forestone/filmtone`（GitHub: `chibataku0815/filmtone`）。

**この repo では filmtone コードを直接編集しない** — bump のみ:

```bash
git submodule update --remote vendor/filmtone
git add vendor/filmtone && git commit -m "chore(filmtone): bump submodule"
```

実装変更は standalone リポで行い、commit/push 後にここで submodule bump する。`apps/web` は public landing / support / privacy / release-notes / journal の **公開窓** のみが正味スコープ。詳細は life `docs/guides/2026-05-01-filmtone-standalone-product-repo-migration-handoff.md`。

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
| 専門知見取得 | `Skill` |

---

## サブエージェント・スキル運用（必須）

**詳細ルールは `.ai/GLOBAL.md` を参照。**

### 必須使用シナリオ

| シナリオ | 使用ツール |
|---------|-----------|
| フロントエンド実装 | `Skill: frontend-dev` → 実装 |
| UI品質重視 | `Skill: frontend-design` → 実装 |
| WebGL/シェーダー | `Skill: webgl-shader` → 実装 |
| 複数コンポーネント | `Task` を並列起動 |
| コードベース探索 | `Task(Explore)` |
| 複雑な設計 | `Task(Plan)` or `EnterPlanMode` |

### 判断順序

1. **スキル該当？** → 先に呼び出して専門知見を取得
2. **並列可能？** → Task を並列起動
3. **探索必要？** → Task(Explore) で調査
4. **上記すべてNO** → 直接実装

### 禁止

- 専門領域でスキルを呼ばずに直接実装
- 並列可能な作業を逐次処理
- 「ハイブリッド運用」指示時にスキル/サブエージェントを使わない

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

---

## Agent Teams 並列実行

### トリガーキーワード

ユーザーが以下のキーワードを含む指示をした場合、Agent Teams モードで実行する:
- 「並列で」
- 「Agent Teamsで」

### 実行手順（キーワード検出時に必ず実行）

1. タスクを独立ストリームに分解（各ストリームの成果物を明確化）
2. TeamCreate でチームを作成
3. TaskCreate で各ストリームのタスクを登録
4. Task ツール（subagent_type: general-purpose, mode: delegate, model: haiku）で各 Teammate を並列 spawn（run_in_background: true, team_name 指定）
5. TaskList で進捗を監視
6. 全 Teammate 完了後、成果物を統合してユーザーに報告
7. SendMessage(type: shutdown_request) で全 Teammate を終了
8. TeamDelete でクリーンアップ

### 実務補足

- `orchestrator-director` / TeamCreate 系ツールが実環境に無い場合は、`orchestrator-director 相当の統括ロール` として単独で代替してよい
- その場合でも、専門家ロールと stream 分割は最初に明示し、`.claude/tasks/ACTIVE-PARALLEL-TASK.md` に統括ロール相当として記録する
- motion/UI ブラッシュアップ系は `構造単位` より `責務単位`（motion grammar / Hero+Gallery / mid sections / CTA+QA）で分けた方が破綻しにくい
- 完了後は `.claude/tasks/archive/` に成果を移し、再利用可能な判断だけを `.claude/knowledge/` へ抽出する

### Spawn Prompt テンプレート

Teammate の Spawn Prompt には以下の情報を含める:

```
あなたは{役割名}です。

## スコープ
{担当範囲。スコープ外の作業は禁止}

## 成果物
{期待する出力形式・内容}

## 手順
1. {具体的なステップ}

## 制約
- スコープ外の作業は行わない
- 他の Teammate のタスクに影響するファイルを編集しない

完了したら TaskUpdate で該当タスクを completed にしてください。
```

### 判定基準

- 独立ストリーム 4 以上 → Agent Teams
- 3 以下 → Sequential（オーバーヘッド > 並列効果）
- 迷ったら Sequential（安全側）

### 制約事項

- Teammate は最大 5 セッション
- CLAUDE.md は各 Teammate に自動読み込み
- Teammate はスコープ外のタスクを生成してはならない
- 既存の `.ai/parallel-work.md` の協調プロトコルも遵守
