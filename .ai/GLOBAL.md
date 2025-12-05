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

## 出力スタイル

- 簡潔・行動志向
- ファイルパスはバッククォートで明示
- 逐語の原則列挙は不要。行動と結果で担保
- 過度な称賛や感情表現を避け、技術的に正確な表現を優先
