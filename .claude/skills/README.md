# Claude Code Skills

このディレクトリには、並行チャットワークフロー用のスキル定義が格納されています。

## スキル一覧

### Creative Direction (クリエイティブ)

| スキル | 用途 | キーワード |
|--------|------|-----------|
| [art-direction](./art-direction/SKILL.md) | ビジュアルコンセプト | ムード設計, ナラティブ, 参照分析, 視覚的一貫性 |
| [visual-composition](./visual-composition/SKILL.md) | 構図・空間設計 | グリッド, 黄金比, 視線誘導, ネガティブスペース |
| [motion-design](./motion-design/SKILL.md) | 動きの芸術性 | タイミング, リズム, トランジション, キネティック |
| [typography](./typography/SKILL.md) | タイポグラフィ | 書体の性格, 視覚的階層, 感情設計, 和欧混植 |

### Implementation (実装)

| スキル | 用途 | キーワード |
|--------|------|-----------|
| [frontend-dev](./frontend-dev/SKILL.md) | フロントエンド実装 | React, Next.js, Tailwind, shadcn/ui |
| [frontend-design](./frontend-design/SKILL.md) | UIデザイン実装 | UI/UX, 配色, レイアウト, 差別化 |
| [webgl-shader](./webgl-shader/SKILL.md) | WebGL/シェーダー | Three.js, R3F, GLSL, ノイズ |
| [backend-dev](./backend-dev/SKILL.md) | バックエンド実装 | API Routes, Server Actions, DB |

### Coordination (調整)

| スキル | 用途 | キーワード |
|--------|------|-----------|
| [project-coordinator](./project-coordinator/SKILL.md) | 進捗管理・チーム調整 | タスク分解, 依存関係, ハンドオフ |

## 並行ワークフロー構成

```
                              ┌──────────────────────┐
                              │  project-coordinator │
                              │    (進捗管理・調整)    │
                              └──────────┬───────────┘
                                         │
          ┌──────────────────────────────┼──────────────────────────────┐
          │                              │                              │
          ▼                              ▼                              ▼
┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
│   Creative Layer    │      │ Implementation Layer│      │   Technical Layer   │
│   (クリエイティブ層)    │      │     (実装層)         │      │     (技術層)         │
├─────────────────────┤      ├─────────────────────┤      ├─────────────────────┤
│ • art-direction     │ ───▶ │ • frontend-dev      │ ◀─── │ • webgl-shader      │
│ • visual-composition│      │ • frontend-design   │      │ • backend-dev       │
│ • motion-design     │      │                     │      │                     │
│ • typography        │      │                     │      │                     │
└─────────────────────┘      └─────────────────────┘      └─────────────────────┘
```

### レイヤー間の関係

```
【クリエイティブ層】
  方向性を定義し、実装層に指針を渡す

  art-direction ──── 全体のビジュアルコンセプト
       │
       ├── visual-composition ── 構図・空間の設計
       │
       ├── motion-design ─────── 動きの設計
       │
       └── typography ────────── 文字の設計


【実装層】
  クリエイティブ層の指針を受け、技術層と連携して実装

  frontend-dev ────── コンポーネント・アニメーション実装
       │
       └── frontend-design ──── UIの品質・差別化


【技術層】
  専門技術を提供、実装層に成果物を渡す

  webgl-shader ────── シェーダー・3D実装
  backend-dev ─────── API・データ層
```

## 各スキルの責務

### Creative Direction

#### art-direction (アートディレクション)
- ビジュアルコンセプトの策定
- ムード・トーンの定義
- 参照作品の分析
- セクション間の視覚的一貫性
- ビジュアルナラティブの設計

#### visual-composition (ビジュアルコンポジション)
- グリッドシステムの設計
- 黄金比・構図理論の適用
- 視線誘導とフローの設計
- ネガティブスペース戦略
- 視覚的バランスとテンション

#### motion-design (モーションデザイン)
- アニメーションの12原則適用
- タイミングとリズムの設計
- トランジションの演出
- キネティックタイポグラフィ
- 感情的ペーシング

#### typography (タイポグラフィ)
- 書体の「声」と性格の定義
- 視覚的階層の設計理論
- フォントペアリングの美学
- 感情設計（書体×色×余白）
- 和欧混植・縦組みの考慮

### Implementation

#### frontend-dev (フロントエンド開発)
- React/Next.js コンポーネント実装
- Tailwind CSS スタイリング
- GSAP/Framer Motion アニメーション
- アクセシビリティ対応

#### frontend-design (フロントエンドデザイン)
- UIコンポーネント品質
- ジェネリックAI美学の回避
- 配色・レイアウト方針
- 視覚的差別化の提案

#### webgl-shader (WebGL/シェーダー)
- GLSL シェーダー実装
- Three.js / R3F シーン構築
- プロシージャルテクスチャ生成
- パフォーマンス最適化

#### backend-dev (バックエンド開発)
- API Routes / Server Actions
- データベース設計 (Prisma)
- 認証・バリデーション
- 型定義・エラーハンドリング

### Coordination

#### project-coordinator (プロジェクト調整)
- タスクの分解と優先度付け
- チーム間の依存関係管理
- `.claude/tasks/ACTIVE-PARALLEL-TASK.md` の更新
- ブロッカーの検出と解消

## ハンドオフプロトコル

### クリエイティブ層 → 実装層

```markdown
## [Frontend] への指針

### ビジュアルコンセプト (from art-direction)
[世界観の要約]

### 構図指針 (from visual-composition)
- Grid: [type]
- Proportions: [ratios]
- Visual Flow: [pattern]

### モーション指針 (from motion-design)
- Timing: [durations]
- Easing: [functions]
- Transitions: [descriptions]

### タイポグラフィ指針 (from typography)
- Display: [font choice]
- Body: [font choice]
- Hierarchy: [specifications]
```

### 実装層 → 技術層

```markdown
## [Specialist] への依頼

### 目的
[実装したいこと]

### 入力
- 参照ファイル
- 前提条件

### 出力
- 期待するコンポーネント/関数

### 制約
- パフォーマンス要件
- スタイル上の制約
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

## スキルの使用判断

```
タスク受領
    │
    ▼
┌───────────────────────────────────────────────┐
│ 1. クリエイティブ観点が必要？                    │
│    • ビジュアル方向性 → art-direction          │
│    • 構図・レイアウト → visual-composition     │
│    • 動きの設計 → motion-design               │
│    • 文字の設計 → typography                  │
└───────────────────────────────────────────────┘
    │
    ▼
┌───────────────────────────────────────────────┐
│ 2. 実装が必要？                                │
│    • UI/フロントエンド → frontend-dev/design   │
│    • WebGL/3D → webgl-shader                 │
│    • API/バックエンド → backend-dev           │
└───────────────────────────────────────────────┘
    │
    ▼
┌───────────────────────────────────────────────┐
│ 3. 調整が必要？                                │
│    • 複数チーム連携 → project-coordinator     │
└───────────────────────────────────────────────┘
```

## ディレクトリ構造

```
.claude/skills/
├── README.md                    # このファイル
│
├── art-direction/               # クリエイティブ方向性
│   └── SKILL.md
├── visual-composition/          # 構図・空間設計
│   └── SKILL.md
├── motion-design/               # モーションデザイン
│   └── SKILL.md
├── typography/                  # タイポグラフィ
│   └── SKILL.md
│
├── frontend-dev/                # フロントエンド実装
│   └── SKILL.md
├── frontend-design/             # UIデザイン実装
│   └── SKILL.md
├── webgl-shader/                # WebGL/シェーダー
│   └── SKILL.md
├── backend-dev/                 # バックエンド
│   └── SKILL.md
│
└── project-coordinator/         # 進捗管理
    └── SKILL.md
```

## 関連ドキュメント

- [CLAUDE.md](../../CLAUDE.md) - プロジェクト全体の運用ガイド
- [.ai/GLOBAL.md](../../.ai/GLOBAL.md) - グローバルルール
- [ACTIVE-PARALLEL-TASK.md](../tasks/ACTIVE-PARALLEL-TASK.md) - 現在の進捗状況
