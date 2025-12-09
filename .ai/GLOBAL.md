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
- ループ記法: `forEach` と `for (let i...)` は使用禁止。`for...of` / `for...of entries()` など明示的なループ、または意図の合う配列メソッドを用いる

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

## Excellence Level 維持ルール（品質劣化防止）

**目標:** プロジェクトは **Level 5（Awwwards 受賞レベル）** を目指す。実装中に Level が下がることを絶対に許容しない。

### 必須参照ドキュメント

すべての実装作業前に以下を確認:

| ドキュメント | 確認内容 |
|-------------|---------|
| `.claude/skills/EXCELLENCE-FRAMEWORK.md` | Level 定義、Award-Worthy Checklist |
| `.claude/skills/art-direction/SKILL.md` | ビジュアル品質基準、Signature Moment |
| `.claude/tasks/awwwards-upgrade/README.md` | 現在の Level、ギャップ分析 |

### 実装前チェック（必須）

```
実装開始前に自問:

1. この実装は何 Level を目指すか？
   → Level 3 以下の回答は不可。最低 Level 4 を目指す。

2. Excellence Framework のどの次元に貢献するか？
   - Visual Impact
   - Motion & Interaction
   - Technical Craft
   - Emotional Resonance
   - Conceptual Clarity

3. 参照サイト（Awwwards Site of the Day）と比較して遜色ないか？
   → 「そこそこ良い」は Level 3。Level 4+ には「他と違う」が必要。

4. この実装に Signature Moment はあるか？
   → なければ Level 4 止まり。Level 5 には必須。
```

### 妥協禁止リスト

以下の妥協は **絶対に許容しない**:

| 妥協パターン | Level への影響 | 対処 |
|-------------|---------------|------|
| 「とりあえず動けばいい」 | L1-2 | 動作だけでなく美学を追求 |
| 「時間がないので簡易版で」 | L2-3 | 時間がないなら scope を減らし、質を保つ |
| 「ユーザーは気づかないから」 | L3 | **細部が Level 5 を作る** |
| 「他のサイトでもよくある」 | L3-4 | **Level 5 は前例を作る側** |
| 「技術的に難しいので妥協」 | L3-4 | 難しいからこそ価値がある |
| 「デザインは後で調整」 | L2-3 | デザインと実装は不可分 |

### 「十分良い」の排除

```
禁止フレーズ:
❌ "This is good enough"（これで十分）
❌ "Probably fine"（たぶん大丈夫）
❌ "Users won't notice"（ユーザーは気づかない）
❌ "We can improve later"（後で改善できる）
❌ "It's just a minor detail"（些細な詳細）

Level 5 に必要なマインドセット:
✅ "Can this be better?"（もっと良くできないか？）
✅ "What would [参照サイト] do?"（参照サイトならどうするか？）
✅ "Is this Award-Worthy?"（受賞レベルか？）
✅ "Does this surprise?"（驚きがあるか？）
✅ "Will I be proud in a year?"（1年後も誇れるか？）
```

### スキル呼び出し強制

以下の作業では、**直接実装を禁止**。必ず先にスキルを呼び出す:

| 作業内容 | 必須スキル | 理由 |
|---------|----------|------|
| UI/コンポーネント実装 | `frontend-design` | デザイン品質の担保 |
| アニメーション実装 | `motion-design` | タイミング・イージングの芸術性 |
| WebGL/シェーダー | `webgl-shader` | Level 5 の技術的革新 |
| ビジュアル調整 | `art-direction` | 世界観の一貫性 |
| タイポグラフィ | `typography` | 視覚階層の最適化 |

**違反例:**
```
❌ ユーザー: "ボタンにホバーエフェクトを追加して"
   AI: [直接 CSS を書く] ← Level 3 に留まる

✅ ユーザー: "ボタンにホバーエフェクトを追加して"
   AI: [motion-design スキル呼び出し]
   → Level 5 のタイミング・イージングで実装
```

### 実装中レビュー（セルフチェック）

実装の節目で以下を確認:

```markdown
## Level Self-Check

### Visual Impact
- [ ] 初見で「これは違う」と感じるか？
- [ ] スクリーンショットを撮りたくなるか？

### Motion & Interaction
- [ ] 動きに意味と感情があるか？
- [ ] 予測可能すぎないか？（驚きはあるか？）

### Technical Craft
- [ ] コードは最適化されているか？
- [ ] パフォーマンス影響はないか？

### Emotional Resonance
- [ ] 意図した感情が生まれるか？
- [ ] 余韻が残るか？

### Conceptual Clarity
- [ ] 「なぜこの選択？」に答えられるか？
- [ ] Pitch Black & Fire の世界観に沿っているか？
```

### 完了判定基準

タスク完了の判定は以下の基準で:

```
Level 1-2: 動作する → **却下（やり直し）**
Level 3: 洗練されている → **不十分（改善必須）**
Level 4: 差別化されている → **許容（最低ライン）**
Level 5: 受賞レベル → **目標達成**

最低でも Level 4 到達を完了条件とする。
```

### Excellence Framework 常時参照

```
実装の各段階で Excellence Framework を参照:

設計時: 目標 Level を設定（最低 L4）
実装時: Quality Dimensions を意識
完了時: Award-Worthy Checklist で検証

参照: .claude/skills/EXCELLENCE-FRAMEWORK.md
```

### Anti-Pattern 検出と修正

以下のパターンを検出したら即座に修正:

| Anti-Pattern | 検出方法 | 修正アクション |
|-------------|---------|---------------|
| Generic AI Aesthetics | 紫〜青グラデーション、ガラスモーフィズム | art-direction スキルで再設計 |
| Template 的レイアウト | よくある3カラム、Hero + Feature Grid | visual-composition で独自性追加 |
| 意味のないアニメーション | 「動けばいい」感覚 | motion-design で意図を明確化 |
| Stock な色選択 | 無難な青/白 | Pitch Black & Fire に準拠 |

### 品質劣化の早期検出

以下の兆候があれば即座に立ち止まる:

```
⚠️ 警告サイン:
- 「これで良いか」と迷いながら進めている
- 参照サイトと比較せずに実装している
- スキルを呼ばずに「感覚」で進めている
- 細部を「後回し」にしている
- パフォーマンスを「とりあえず」無視している

→ 検出したら作業を停止し、スキルを呼び出すか、ユーザーに確認
```

### Level 5 哲学（常に想起）

```
Art Direction スキルより:

「良い」は敵。「素晴らしい」を目指す。

Level 3（洗練された）で満足しない。
Level 4（差別化された）で妥協しない。
Level 5（受賞レベル）を当然の目標とする。

これは傲慢ではなく、基準の設定。
到達できなくても、目指すことで Level 4 に到達する。
Level 3 を目指すと Level 2 になる。

妥協は Level 4 の始まり。
「十分良い」は Level 3 の終わり。
Level 5 は「これ以上は無理」の先にある。
```

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
│  - ブランド/ポジショニング → brand-strategy│
│  - コピー/メッセージ → copywriting        │
│  - ユーザー心理/CTA → user-journey        │
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

**Strategy (戦略層)**

| スキル | 使用タイミング |
|--------|---------------|
| `brand-strategy` | ポジショニング策定、価値提案の構築、差別化言語化時 |
| `copywriting` | タグライン開発、ヒーローコピー、CTA設計、トーン&マナー時 |
| `user-journey` | 感情アーク設計、コンバージョン最適化、CTA配置戦略時 |

**Creative Direction (クリエイティブ層)**

| スキル | 使用タイミング |
|--------|---------------|
| `art-direction` | ビジュアルコンセプト策定、ムード設計、参照分析時 |
| `visual-composition` | 構図設計、グリッドシステム、視線誘導設計時 |
| `motion-design` | アニメーション設計、タイミング、トランジション演出時 |
| `typography` | フォント選定・視覚階層設計時 |

**Implementation (実装層)**

| スキル | 使用タイミング |
|--------|---------------|
| `frontend-dev` | React/Next.js/Tailwind/GSAP実装時 |
| `frontend-design` | UI品質・デザインシステム構築時 |
| `webgl-shader` | Three.js/シェーダー/3D実装時 |
| `backend-dev` | API/Server Actions/DB操作時 |

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

### プロジェクト方向性（apps/web）
- 実装対象は常に `apps/web`。その他ディレクトリは参考サンプルのみ。
- コンテンツ方針: マルチクリエイター（Motion / Interactive / Installation / Archive / Contact）。Pitch Black & Fire（漆黒背景 + オフホワイト文字 + アンバーアクセント）を維持。
- コンテンツの一次ソースはデータファイルに集約し、ページでの直書きを避けること。
