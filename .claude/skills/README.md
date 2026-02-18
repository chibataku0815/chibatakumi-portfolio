# Claude Code Skills

このディレクトリには、並行チャットワークフロー用のスキル定義が格納されています。

**🎯 2025-12-09 更新: すべてのスキルが Excellence Framework Level 5（受賞レベル）を目指す設計に刷新されました。**

---

## 🏆 Excellence Framework

すべてのスキルは `EXCELLENCE-FRAMEWORK.md` で定義された5段階評価基準に基づいています:

```
Level 5: Award-Worthy（受賞レベル） ← 目標
Level 4: Distinctive（差別化）
Level 3: Refined（洗練）
Level 2: Professional（プロフェッショナル）
Level 1: Functional（機能的）
```

詳細: [EXCELLENCE-FRAMEWORK.md](./EXCELLENCE-FRAMEWORK.md)
改善履歴: [SKILLS-UPGRADE-2025.md](./SKILLS-UPGRADE-2025.md)

---

## スキル一覧

### Strategy (戦略)

| スキル | 用途 | キーワード |
|--------|------|-----------|
| [brand-strategy](./brand-strategy/SKILL.md) | ブランド戦略 | ポジショニング, 価値提案, 差別化, ターゲット |
| [copywriting](./copywriting/SKILL.md) | コピーライティング | タグライン, ヒーローコピー, CTA, トーン&マナー |
| [user-journey](./user-journey/SKILL.md) | ユーザージャーニー | 感情設計, コンバージョン, CTA戦略, 心理学 |

### Creative Direction (クリエイティブ) 🔥

| スキル | 用途 | キーワード | Level 5 対応 |
|--------|------|-----------|------------|
| [**art-direction**](./art-direction/SKILL.md) | **ビジュアルコンセプト** | **ムード設計, ナラティブ, 参照分析** | **✅ 完了** |
| [**motion-design**](./motion-design/SKILL.md) | **動きの芸術性** | **タイミング, リズム, トランジション** | **✅ 完了** |
| [**color-visual-styling**](./color-visual-styling/SKILL.md) | **色彩設計・ビジュアルスタイリング** | **パレット, oklch, グラデーション, アクセシビリティ** | **✅ 完了** |
| [visual-composition](./visual-composition/SKILL.md) | 構図・空間設計 | グリッド, 黄金比, 視線誘導 | 🔄 近日 |
| [typography](./typography/SKILL.md) | タイポグラフィ | 書体の性格, 階層, 和欧混植 | 🔄 近日 |

### Implementation (実装)

| スキル | 用途 | キーワード | Level 5 対応 |
|--------|------|-----------|------------|
| [frontend-dev](./frontend-dev/SKILL.md) | フロントエンド実装 | React, Next.js, Tailwind, shadcn/ui | - |
| [frontend-design](./frontend-design/SKILL.md) | UIデザイン実装 | UI/UX, 配色, レイアウト, 差別化 | 🔄 近日 |
| [**webgl-shader**](./webgl-shader/SKILL.md) | **WebGL/シェーダー** | **Three.js, R3F, GLSL, GPU最適化** | **✅ 完了** |
| [backend-dev](./backend-dev/SKILL.md) | バックエンド実装 | API Routes, Server Actions, DB | - |

### Coordination (調整)

| スキル | 用途 | キーワード |
|--------|------|-----------|
| [project-coordinator](./project-coordinator/SKILL.md) | 進捗管理・チーム調整 | タスク分解, 依存関係, ハンドオフ |

---

## 並行ワークフロー構成

```
                              ┌──────────────────────┐
                              │  project-coordinator │
                              │    (進捗管理・調整)    │
                              └──────────┬───────────┘
                                         │
    ┌────────────────────────────────────┼────────────────────────────────────┐
    │                                    │                                    │
    ▼                                    ▼                                    ▼
┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
│   Strategy Layer    │      │   Creative Layer    │      │ Implementation Layer│
│     (戦略層)         │      │  (クリエイティブ層)   │      │      (実装層)        │
├─────────────────────┤      ├─────────────────────┤      ├─────────────────────┤
│ • brand-strategy    │ ───▶ │ • art-direction ⭐   │ ───▶ │ • frontend-dev      │
│ • copywriting       │      │ • color-visual-styling ⭐│   │ • frontend-design   │
│ • user-journey      │      │ • visual-composition│      │ • webgl-shader ⭐   │
│                     │      │ • motion-design ⭐   │      │ • backend-dev       │
│                     │      │ • typography        │      │                     │
└─────────────────────┘      └─────────────────────┘      └─────────────────────┘

⭐ = Level 5 対応完了 (art-direction, motion-design, color-visual-styling, webgl-shader)
```

---

## Level 5 スキルの特徴

### art-direction（アートディレクション）

**新機能:**
- Award-Worthy Reference Library（必修参照サイト）
- Signature Moment 定義（このサイトでしか体験できない瞬間）
- Level 5 Mood Design（ムードの「裏切り」と「回収」）
- 6軸 Award-Worthy Checklist

**参照サイト例:**
- Active Theory（WebGL/Immersive）
- Locomotive（スクロール体験）
- Thibault Poirer（ミニマリズム）

---

### motion-design（モーションデザイン）

**新機能:**
- Award-Worthy Motion Reference Library
- Level 5 Motion の5要素（ボキャブラリー、オーケストレーション、予想外、沈黙、パフォーマンス）
- Level 5 Stagger Patterns（予測不能な心地よさ）
- Level 5 Transition Anatomy（5段階設計）

**参照サイト例:**
- Aristide Benoist（ページ遷移）
- Locomotive（スクロール連動）
- Linear（マイクロインタラクション）

---

### color-visual-styling（色彩設計・ビジュアルスタイリング）

**新機能:**
- Award-Worthy Color Reference Library（Stripe, Linear, Vercel, Apple等）
- oklch ベースのパレットアーキテクチャ（5層構造 + 60-30-10 ルール）
- Level 5 Signature Techniques（Color Narrative, Unexpected Harmony, Color Breathing, Chromatic Signature）
- 6軸 Award-Worthy Color Quality Checklist
- 5スキル連携 Integration Protocol（art-direction, frontend-dev, webgl-shader, typography, motion-design）

**色彩理論:**
- oklch 知覚均一カラースペース
- APCA 次世代コントラスト指標
- Wide Gamut (P3) 対応
- color-mix(), relative color syntax, @property 活用

**Pitch Black & Fire 固有:**
- Heat Tokens パターン（subtle/medium/intense）
- 漆黒の深度レイヤー設計
- 琥珀のカラーナラティブ（起承転結）

---

### webgl-shader（WebGL/シェーダー）

**新機能:**
- Award-Worthy WebGL Reference Library（Active Theory, Immersive Garden, Bruno Simon）
- Level 5 Shader Techniques（ドメインワーピング、SDF、カスタムノイズ）
- GPU最適化戦略（KTX2圧縮、インスタンシング、プログレッシブローディング）
- Level 5 Quality Checklist（Innovation, Performance, Integration, Craft, Emotion, Uniqueness）

**参照サイト例:**
- Active Theory（カスタムシェーダー、物理ベース）
- Immersive Garden（3D統合、ストーリーテリング）
- Bruno Simon（Three.js革新）
- Inigo Quilez（シェーダー数学）

**技術スタック:**
- Three.js + React Three Fiber
- カスタムGLSLシェーダー
- KTX2/DRACO圧縮
- パフォーマンス最適化（60fps desktop, 30fps+ mobile）

---

## 使用方法

### 1. Excellence Level を意識する

```markdown
現状: Level 3（洗練されている）
目標: Level 5（受賞レベル）
ギャップ: Signature Moment の欠如、予想外の瞬間がない
```

### 2. スキルを呼び出す

```
Claude Code で Skill ツールを使用:

- art-direction: ビジュアルコンセプト策定時
- motion-design: アニメーション設計時
- frontend-design: UI実装時
- webgl-shader: シェーダー実装時
```

### 3. Award-Worthy Checklist を実行

作業完了後、必ず以下を確認:

```
□ The "Wow" Test: 初見で「これは違う」と感じるか？
□ The "Only Here" Test: このサイトでしか体験できない瞬間があるか？
□ The "Coherence" Test: すべての要素が同じ言語を話しているか？
□ The "Craft" Test: 404ページまで設計されているか？
□ The "Emotion" Test: 意図した感情が生まれているか？
□ The "Innovation" Test: 何か新しいことをしているか？
```

---

## レイヤー間の関係

### 戦略層 → クリエイティブ層

```markdown
## [Creative] への戦略指針

### ポジショニング (from brand-strategy)
- Core Identity: [1文で定義]
- Target: [ターゲット像]

### メッセージング (from copywriting)
- Tagline: [案]
- Key Messages: [階層別]

### ユーザージャーニー (from user-journey)
- 感情アーク: [5幕構造]
- CTA戦略: [配置・表現]
```

### クリエイティブ層 → 実装層

```markdown
## [Frontend] への指針

### ビジュアルコンセプト (from art-direction)
[世界観の要約]
Signature Moment: [このサイトでしか体験できない瞬間]

### モーション指針 (from motion-design)
- Timing: [Level 5 duration system]
- Easing: [カスタムベジェ]
- Stagger: [予測不能なパターン]

### 構図指針 (from visual-composition)
- Grid: [type]
- Visual Flow: [pattern]
```

---

## 2024-2025 受賞サイトトレンド

背景調査により判明した最新トレンド:

### 技術スタック

```
必須: Three.js + GSAP + Lenis
推奨: Svelte/React + カスタムGLSLシェーダー
最適化: GPU圧縮（KTX）、チャンネルパッキング
```

### 美学的特徴

```
タイポグラフィ: Kinetic Typography（動的文字）
色彩: ダーク背景 + ビビッドアクセント
構成: Scrollytelling 2.0（スクロール駆動ナラティブ）
```

### 差別化要因

```
1. マイクロインタラクション & イースターエッグ
2. 独創的スクロール体験
3. パフォーマンス最適化（Core Web Vitals達成）
4. ストーリーテリング重視
5. モバイル最適化
6. アクセシビリティ（WCAG AA以上 + 美学）
7. 独自性追求（テンプレート離れ）
```

### 主要スタジオ

| スタジオ | 2024年実績 | スコア |
|---------|-----------|--------|
| Buttermax | Best Agency Site | 9.06 |
| Active Theory | Best Innovation | 9.03 |
| Immersive Garden | Studio of the Year | 8.99 |
| Locomotive | Agency of the Year | - |

---

## 各スキルの責務

### Strategy

#### brand-strategy
- ポジショニングステートメントの策定
- 価値提案（Value Proposition）の構築
- 競合差別化の言語化

#### copywriting
- タグライン・ヒーローコピーの開発
- トーン&マナーガイドの策定

#### user-journey
- 訪問者の感情アーク設計
- コンバージョンファネル最適化

---

### Creative Direction

#### art-direction ⭐ Level 5
- **ビジュアルコンセプトの策定**
- **Signature Moment の定義**
- **ムード・トーンの設計（裏切りと回収）**
- **Award-Worthy Reference 分析**
- ビジュアルナラティブの設計

#### color-visual-styling ⭐ Level 5
- **oklch ベースのパレットアーキテクチャ**
- **セマンティックトークン設計（Heat Tokens 拡張）**
- **グラデーション・サーフェスエフェクト設計**
- **色彩アクセシビリティ（WCAG AA + APCA）**
- **Color Narrative（色の物語設計）**
- **Chromatic Signature（色彩の署名）**

#### motion-design ⭐ Level 5
- **モーションボキャブラリーの確立**
- **感情のオーケストレーション**
- **Level 5 Stagger Patterns**
- **Level 5 Transition 設計**
- **沈黙の設計**

#### visual-composition
- グリッドシステムの設計
- 黄金比・構図理論の適用
- 視線誘導とフローの設計

#### typography
- 書体の「声」と性格の定義
- 視覚的階層の設計理論
- Kinetic Typography の手法

---

### Implementation

#### frontend-dev
- React/Next.js コンポーネント実装
- GSAP/Framer Motion アニメーション

#### frontend-design
- UIコンポーネント品質
- ジェネリックAI美学の回避

#### webgl-shader ⭐ Level 5
- **カスタムGLSLシェーダー実装（ドメインワーピング、SDF）**
- **GPU最適化（KTX2圧縮、インスタンシング）**
- **Three.js / R3F Level 5 パターン**
- **パフォーマンス最適化（60fps desktop, 30fps+ mobile）**
- **技術革新と美学の融合**

#### backend-dev
- API Routes / Server Actions
- データベース設計 (Prisma)

---

### Coordination

#### project-coordinator
- タスクの分解と優先度付け
- チーム間の依存関係管理
- `.claude/tasks/ACTIVE-PARALLEL-TASK.md` の更新

---

## ステータス報告

各チームは以下の形式で coordinator に報告:

```markdown
## [チーム名] ステータス

### Excellence Level
- 現在: Level [1-5]
- 目標: Level 5

### Quality Checklist
- "Wow" Test: [Pass/Fail]
- "Only Here" Test: [Pass/Fail]
- "Coherence" Test: [Pass/Fail]
- "Craft" Test: [Pass/Fail]
- "Emotion" Test: [Pass/Fail]
- "Innovation" Test: [Pass/Fail]

### 完了
- タスク名: 簡潔な説明

### 進行中
- タスク名: 進捗%, 残作業

### ブロッカー
- 問題: 必要なアクション
```

---

## スキルの使用判断

```
タスク受領
    │
    ▼
┌───────────────────────────────────────────────┐
│ 0. 戦略的観点が必要？                           │
│    • ブランド/ポジショニング → brand-strategy   │
│    • コピー/メッセージ → copywriting           │
│    • ユーザー心理/CTA → user-journey           │
└───────────────────────────────────────────────┘
    │
    ▼
┌───────────────────────────────────────────────┐
│ 1. クリエイティブ観点が必要？                    │
│    • ビジュアル方向性 → art-direction ⭐        │
│    • 色彩設計 → color-visual-styling ⭐       │
│    • 動きの設計 → motion-design ⭐             │
│    • 構図・レイアウト → visual-composition     │
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

---

## 哲学

> **「良い」は敵。「素晴らしい」を目指す。**
>
> Level 3（洗練された）で満足しない。
> Level 4（差別化された）で妥協しない。
> Level 5（受賞レベル）を当然の目標とする。
>
> これは傲慢ではなく、基準の設定。
> 到達できなくても、目指すことで Level 4 に到達する。
> Level 3 を目指すと Level 2 になる。

---

## ディレクトリ構造

```
.claude/skills/
├── README.md                    # このファイル
├── EXCELLENCE-FRAMEWORK.md      # 🆕 卓越性評価基準
├── SKILLS-UPGRADE-2025.md       # 🆕 改善履歴
│
│ # Strategy Layer
├── brand-strategy/
│   └── SKILL.md
├── copywriting/
│   └── SKILL.md
├── user-journey/
│   └── SKILL.md
│
│ # Creative Layer ⭐
├── art-direction/               # ⭐ Level 5 対応完了
│   └── SKILL.md
├── color-visual-styling/        # ⭐ Level 5 対応完了
│   └── SKILL.md
├── visual-composition/
│   └── SKILL.md
├── motion-design/               # ⭐ Level 5 対応完了
│   └── SKILL.md
├── typography/
│   └── SKILL.md
│
│ # Implementation Layer
├── frontend-dev/
│   └── SKILL.md
├── frontend-design/             # 🔄 Level 5 対応予定
│   └── SKILL.md
├── webgl-shader/                # ⭐ Level 5 対応完了
│   └── SKILL.md
├── backend-dev/
│   └── SKILL.md
│
│ # Coordination
└── project-coordinator/
    └── SKILL.md
```

---

## 関連ドキュメント

- [CLAUDE.md](../../CLAUDE.md) - プロジェクト全体の運用ガイド
- [.ai/GLOBAL.md](../../.ai/GLOBAL.md) - グローバルルール
- [ACTIVE-PARALLEL-TASK.md](../tasks/ACTIVE-PARALLEL-TASK.md) - 現在の進捗状況
- [EXCELLENCE-FRAMEWORK.md](./EXCELLENCE-FRAMEWORK.md) - 卓越性評価基準
- [SKILLS-UPGRADE-2025.md](./SKILLS-UPGRADE-2025.md) - 改善履歴

---

**最終更新**: 2026-02-18
**次のマイルストーン**: visual-composition / typography の Level 5 対応
