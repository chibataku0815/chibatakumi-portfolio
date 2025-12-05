# AI Tool Capability Mapping

各AIツールの固有機能を抽象化し、共通理解を確保。

---

## 機能マッピング表

| 機能 | 汎用表現 | Codex CLI | Claude Code | Cursor AI |
|------|---------|-----------|-------------|-----------|
| 深い思考 | 段階的思考で課題分析 | `sequential-thinking` | (組み込み) | (組み込み) |
| 計画管理 | タスク計画の明示・追跡 | `update_plan` | `TodoWrite` | (マニュアル) |
| 時刻取得 | Asia/Tokyo タイムスタンプ | `time__get_current_time` | `Bash(date)` / MCP | (不要) |
| Web取得 | 外部コンテンツ取得 | `fetch__fetch` | `WebFetch` / MCP | (不要) |
| コード検索 | 全文検索 | `rg` | `Grep` | (組み込み) |
| ファイル読み取り | ファイル内容の参照 | (組み込み) | `Read` | (組み込み) |
| ファイル編集 | 最小差分での変更 | `apply_patch` | `Edit` | (組み込み) |
| ファイル作成 | 新規ファイル作成 | `write` | `Write` | (組み込み) |
| コマンド実行 | シェルコマンド | (組み込み) | `Bash` | (組み込み) |
| サブタスク | 並列タスク実行 | (なし) | `Task` | (なし) |
| スキル呼び出し | 専門領域の知見取得 | (なし) | `Skill` | (なし) |
| 探索エージェント | コードベース調査 | (なし) | `Task(Explore)` | (なし) |
| 計画エージェント | 実装設計 | (なし) | `Task(Plan)` | (なし) |

---

## Claude Code: サブエージェント・スキル詳細

### 利用可能なスキル

| スキル名 | 用途 |
|---------|------|
| `frontend-dev` | React/Next.js/Tailwind/shadcn/ui/Framer Motion実装 |
| `frontend-design` | 高品質UI/デザインシステム構築 |
| `backend-dev` | API/Server Actions/DB操作 |
| `webgl-shader` | Three.js/GLSL/React Three Fiber |
| `typography` | タイポグラフィ設計・フォント選定 |
| `project-coordinator` | 並列ワークフロー管理 |

### 利用可能なサブエージェント

| タイプ | 用途 |
|--------|------|
| `Explore` | コードベース探索（quick/medium/very thorough） |
| `Plan` | 実装計画・アーキテクチャ設計 |
| `general-purpose` | 複合リサーチ・マルチステップタスク |
| `claude-code-guide` | Claude Code自体の使い方確認 |

---

## 使用ガイドライン

### ルール記述時
- ツール固有の名前を直接記述しない
- 汎用表現で意図を示し、各ツールが最適な機能を選択

### 例

**NG (ツール固有):**
```markdown
時刻取得は `time__get_current_time` を使用
```

**OK (汎用):**
```markdown
時刻は Asia/Tokyo タイムゾーンで取得
```

---

## ツール別の参照ファイル

| ツール | 優先読み込みファイル | 補足 |
|--------|---------------------|------|
| Codex CLI | `AGENTS.md` | グローバルルールは `.ai/GLOBAL.md` を参照 |
| Claude Code | `CLAUDE.md` | グローバルルールは `.ai/GLOBAL.md` を参照 |
| Cursor AI | `.cursor/rules/*.mdc` | グローバルルールは `.ai/GLOBAL.md` を参照 |

---

## 共通で使用可能な概念

以下は全ツールで理解可能:

- **ファイルパス:** バッククォート記法 `` `src/app/page.tsx` ``
- **コードブロック:** Markdown フェンス記法
- **箇条書き:** `-` または `1.` 形式
- **テーブル:** Markdown テーブル記法
- **見出し:** `#` 記法
