# AI Agent Global Policy

**対象:** Claude Code / Cursor AI / Codex CLI / その他AIツール

このファイルはすべてのAIツールが参照するグローバルルールです。ツール固有の設定は各ツールの設定ファイルを参照してください。

---

## プロジェクト概要

Next.js + Tailwind + shadcn/ui + Framer Motion のポートフォリオサイト。
Phase 2 で GSAP / Three.js への拡張を見据えた設計。

### 技術スタック
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Animation:** Framer Motion → GSAP (Phase 2)
- **WebGL:** Three.js / React Three Fiber (Phase 2)
- **Runtime:** Bun

---

## ソース・オブ・トゥルース

| ファイル | 役割 | 対象ツール |
|---------|------|-----------|
| `.ai/GLOBAL.md` | 共通グローバルルール | 全ツール |
| `.ai/parallel-work.md` | パラレルワーク協調 | 全ツール |
| `.ai/tool-mapping.md` | ツール機能マッピング | 全ツール |
| `AGENTS.md` | Codex CLI専用指示 | Codex CLI |
| `CLAUDE.md` | Claude Code補足 | Claude Code |
| `.cursor/rules/` | Cursor AI ルール | Cursor AI |
| `.claude/tasks/ACTIVE-PARALLEL-TASK.md` | タスク進捗（共有） | 全ツール |
| `apps/exampleXX/` | サンプル実装 + YouTube文字起こし | 全ツール |

---

## デザイン原則: Pitch Black & Fire

- **背景:** 漆黒 (#050505–#0a0a0a)
- **テキスト:** オフホワイト/グレー (~#ededed)
- **アクセント:** Amber/Orange（限定使用、インタラクションの熱源）
- **Hero:** 抽象カラー + 粒子・光漏れ（色は殺さない）
- **Grid:** モノクロ高コントラスト + 強粒子、ホバーで一瞬カラー/グリッチ
- **Noise/Grain:** CSS filter/SVG overlay を優先し軽量に

---

## エンジニアリング原則

- **KISS / DRY / YAGNI** を徹底
- 既存スタイル・パターンを尊重
- Next.js App Router 前提。Server Component / Server Actions を適材適所に
- Tailwind: カスタムトークンを優先し、インラインスタイル多用を避ける
- shadcn/ui + Radix を優先活用（アクセシビリティ担保）
- Phase 2 拡張余地を確保（GSAP / Three.js 置換しやすい抽象化）

---

## サンプル実装の学習

アニメーション/シェーダー実装時は、`apps/exampleXX/` のサンプルを**必ず参照**する。

### 構造
```
apps/
├── web/                    # 本番プロジェクト
├── example01/              # サンプル実装 1
│   ├── src/                # 実装コード
│   └── transcript.md       # YouTube解説動画の文字起こし
└── example02/              # サンプル実装 2（以降同様）
```

### 学習手順
1. `apps/exampleXX/transcript.md` を読んで概念・意図を理解
2. `apps/exampleXX/src/` のコードを分析（パラメータ、手法）
3. 本番 `apps/web/` への適用方法を**提案（実装前に確認を得る）**
4. 承認後、実装

### 禁止事項
- サンプルを見ずに手探りで実装しない
- 実装前の承認なしに進めない
- サンプルのパラメータを理由なく変更しない

### 対象プロジェクトの明確化
- **実装対象は常に `apps/web`**。他のディレクトリ（`apps/exampleXX/`, `apps/gsap-horizontal-dots-nav`, `apps/codegrid-madeinuxstudio-page-transition-nextjs` など）は **参考用サンプル** として扱い、直接実装を進めない。

---

## 変更安全性

- 破壊的・広範囲変更前は意図/影響を簡潔に共有
- 新規環境変数や設定追加は原則禁止（必要時のみ合意の上）
- ログ/デバッグ用コードは提出前に除去
- コミットは明示的に指示された場合のみ

---

## ドキュメント運用

- タスク進捗: `.claude/tasks/ACTIVE-PARALLEL-TASK.md` を単一の真実源として更新
- 時刻: Asia/Tokyo (JST) タイムゾーン
- 新規ドキュメントは必要最小限。既存章へ統合を優先

---

## サブエージェント・スキル運用（Claude Code）

Claude Codeでは、**サブエージェント（Task）** と **スキル（Skill）** を積極的に活用する。

### 使用判断フロー

```
タスク受領
    ↓
┌─ 専門領域に該当？ ─────────────────────────┐
│  - フロントエンド実装 → frontend-dev      │
│  - UI/デザイン品質重視 → frontend-design  │
│  - バックエンド/API → backend-dev         │
│  - WebGL/シェーダー → webgl-shader        │
│  - タイポグラフィ → typography            │
│  YES → Skill を先に呼び出して専門知見取得 │
└────────────────────────────────────────────┘
    ↓ NO or スキル取得後
┌─ 並列実行可能？ ───────────────────────────┐
│  - 複数コンポーネント同時実装              │
│  - 独立したファイル群の編集                │
│  YES → Task(subagent) を並列起動          │
└────────────────────────────────────────────┘
    ↓ NO
┌─ 探索が必要？ ─────────────────────────────┐
│  - コードベース構造の理解                  │
│  - 既存パターンの調査                      │
│  YES → Task(Explore) で調査               │
└────────────────────────────────────────────┘
    ↓ NO
直接実装（Read/Edit/Write）
```

### スキル使用基準

| スキル | 使用タイミング |
|--------|---------------|
| `frontend-dev` | React/Next.js/Tailwind/GSAP実装時 |
| `frontend-design` | UI品質・デザインシステム構築時 |
| `backend-dev` | API/Server Actions/DB操作時 |
| `webgl-shader` | Three.js/シェーダー/3D実装時 |
| `typography` | フォント選定・視覚階層設計時 |

### サブエージェント使用基準

| タイプ | 使用タイミング |
|--------|---------------|
| `Explore` | コードベース探索・パターン調査 |
| `Plan` | 複雑な実装の設計・アーキテクチャ決定 |
| `general-purpose` | 複合的なリサーチ・マルチステップタスク |

### 並列実行の原則

- 2つ以上の独立したコンポーネント → 並列Task起動を**必須**とする
- スキル取得 + 実装 → スキルを先に呼び、知見を得てから実装
- 「ハイブリッド運用」指示時 → スキルとサブエージェント両方を活用

### 禁止事項

- 専門領域タスクでスキルを呼ばずに直接実装すること
- 並列可能な作業を逐次処理すること
- 探索せずに推測でコードを書くこと

---

## 出力スタイル

- 簡潔・行動志向
- ファイルパスはバッククォートで明示
- 逐語の原則列挙は不要。行動と結果で担保
- 過度な称賛や感情表現を避け、技術的に正確な表現を優先
