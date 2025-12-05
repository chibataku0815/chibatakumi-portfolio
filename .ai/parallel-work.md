# Parallel Work Coordination Protocol

複数のAIエージェント（Claude Code, Cursor, Codex CLI）が同時に作業する際の協調ルール。

---

## 原則

1. **作業宣言必須:** タスク開始前に変更予定ファイルを宣言
2. **排他制御:** 同一ファイルの同時編集を禁止
3. **完了報告:** タスク完了時に状態を更新
4. **競合時は停止:** コンフリクト検出時は project-coordinator に報告

---

## 作業宣言（Lock Declaration）

タスク開始時に `.claude/tasks/ACTIVE-PARALLEL-TASK.md` に記録:

```markdown
## [タスク名]
- **Agent:** Claude Code / Cursor / Codex CLI
- **Started:** 2025-01-01 10:00 JST
- **Status:** 進行中
- **Files:**
  - `src/features/hero/components/HeroText.tsx` (編集)
  - `src/features/hero/components/NewComponent.tsx` (新規)
```

---

## ディレクトリレベル分離

機能単位でディレクトリを分離し、競合を最小化:

| ディレクトリ | 担当 | 備考 |
|------------|------|------|
| `src/features/hero/` | WebGL専門 | シェーダー、Three.js |
| `src/features/works/` | Frontend実装 | グリッド、カード |
| `src/features/about/` | Frontend実装 | プロフィール |
| `src/shared/` | **調整必要** | project-coordinator 経由 |
| `src/app/` | **調整必要** | ルーティング、レイアウト |

---

## タスク完了報告

```markdown
## [タスク名]
- **Agent:** Claude Code
- **Completed:** 2025-01-01 11:30 JST
- **Status:** 完了
- **Changed Files:**
  - `src/features/hero/components/HeroText.tsx`
  - `src/features/hero/components/NewComponent.tsx`
- **Notes:** 他チームがレビュー可能
```

---

## コンフリクト解消フロー

1. `.claude/tasks/ACTIVE-PARALLEL-TASK.md` で競合を検出
2. 競合するエージェントは作業を一時停止
3. project-coordinator スキルに報告
4. 調整完了後に再開

---

## タスク分割の粒度

### 最小作業単位（Atomic Task）
- 1つの機能追加 / 1つのバグ修正
- 変更ファイル数: 1〜5個程度
- 完結した単位で分割

### 並列可能な条件
- ファイルの競合がない
- 機能的な依存関係がない
- 各チームが独立して検証可能

### 並列不可の条件
- 共通型定義の変更が必要
- 同一コンポーネントへの変更
- グローバル設定（tailwind.config.ts 等）の変更

---

## ハンドオフ（引き継ぎ）

作業を別のエージェントに引き継ぐ場合:

1. `.claude/tasks/` に引き継ぎドキュメントを作成
2. 現状、完了済み、未完了、ブロッカーを明記
3. `ACTIVE-PARALLEL-TASK.md` のステータスを「引き継ぎ待ち」に更新
4. 次のエージェントは引き継ぎドキュメントを読んでから開始
