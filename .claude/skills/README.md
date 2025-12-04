# Claude Code Skills

このディレクトリには、並行チャットワークフロー用のスキル定義が格納されています。

## スキル一覧

| スキル | 用途 | キーワード |
|--------|------|-----------|
| [project-coordinator](./project-coordinator/SKILL.md) | 進捗管理・チーム調整 | タスク分解、依存関係、ハンドオフ |
| [frontend-dev](./frontend-dev/SKILL.md) | フロントエンド実装 | React, Next.js, Tailwind, shadcn/ui |
| [frontend-design](./frontend-design/SKILL.md) | デザイン指針 | UI/UX, 配色, レイアウト構成 |
| [typography](./typography/SKILL.md) | タイポグラフィデザイン | 書体の性格, 視覚的階層, 感情設計, 和欧混植 |
| [webgl-shader](./webgl-shader/SKILL.md) | WebGL/シェーダー | Three.js, R3F, GLSL, ノイズ |
| [backend-dev](./backend-dev/SKILL.md) | バックエンド実装 | API Routes, Server Actions, DB |

## 並行ワークフロー構成

```
┌─────────────────────────────────────────────────────────────┐
│                  project-coordinator                         │
│            (進捗管理・タスク分解・同期ポイント)                │
└─────────────────┬───────────────────────────────────────────┘
                  │
    ┌─────────────┼─────────────┬─────────────┐
    ▼             ▼             ▼             ▼
┌────────┐  ┌────────┐   ┌────────┐    ┌────────┐
│frontend│  │frontend│   │ webgl  │    │backend │
│  dev   │  │ design │   │ shader │    │  dev   │
└────────┘  └────────┘   └────────┘    └────────┘
    │             │             │             │
    └─────────────┴──────┬──────┴─────────────┘
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
    ┌─────────────────┐   ┌─────────────────┐
    │   typography    │   │   (future)      │
    │ (デザイン専門家) │   │                 │
    └─────────────────┘   └─────────────────┘
```

## 各スキルの責務

### project-coordinator
- タスクの分解と優先度付け
- チーム間の依存関係管理
- `.claude/tasks/ACTIVE-PARALLEL-TASK.md` の更新
- ブロッカーの検出と解消

### frontend-dev
- React/Next.js コンポーネント実装
- Tailwind CSS スタイリング
- Framer Motion アニメーション
- アクセシビリティ対応

### frontend-design
- デザインコンセプト策定
- 配色・レイアウト方針
- 視覚的差別化の提案
- ジェネリックAI美学の回避

### typography
- 書体の「声」と性格の定義
- 視覚的階層の設計理論
- フォントペアリングの美学
- 感情設計（書体×色×余白）
- 和欧混植・縦組みの考慮
- 歴史的ムーブメントの参照

### webgl-shader
- GLSL シェーダー実装
- Three.js / R3F シーン構築
- プロシージャルテクスチャ生成
- パフォーマンス最適化

### backend-dev
- API Routes / Server Actions
- データベース設計 (Prisma)
- 認証・バリデーション
- 型定義・エラーハンドリング

## ハンドオフプロトコル

チーム間の成果物受け渡しには統一フォーマットを使用:

```markdown
## [送信先チーム] への依頼

### 目的
何を達成したいか

### 入力
- 前提条件、参照ファイル

### 出力
- 期待する成果物

### 制約
- 守るべきルール
```

## ステータス報告

各チームは以下の形式で coordinator に報告:

```markdown
## [チーム名] ステータス

### 完了
- タスク名: 簡潔な説明

### 進行中
- タスク名: 進捗%, 残作業

### ブロッカー
- 問題: 必要なアクション

### 他チーム向け
- 利用可能な成果物
```

## スキルの認識

スキルは description のキーワードで自動認識されます。
- 明示的に呼び出す場合: チャットで関連キーワードを含める
- 新規スキル追加後: Claude Code の再起動が必要

## ディレクトリ構造

```
.claude/skills/
├── README.md                    # このファイル
├── project-coordinator/
│   └── SKILL.md
├── frontend-dev/
│   └── SKILL.md
├── frontend-design/
│   └── SKILL.md
├── typography/
│   └── SKILL.md
├── webgl-shader/
│   └── SKILL.md
└── backend-dev/
    └── SKILL.md
```

## 関連ドキュメント

- [CLAUDE.md](../../CLAUDE.md) - プロジェクト全体の運用ガイド
- [AGENTS.md](../../AGENTS.md) - エージェント詳細規約
- [ACTIVE-PARALLEL-TASK.md](../tasks/ACTIVE-PARALLEL-TASK.md) - 現在の進捗状況
