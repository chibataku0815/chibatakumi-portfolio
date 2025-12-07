---
name: visual-composition
description: Specialist in visual composition, grid systems, spatial hierarchy, and eye flow design. Use this skill for layout architecture, golden ratio applications, dynamic balance, negative space strategy, and creating visual tension. Transforms flat layouts into compelling visual experiences.
---

# visual-composition

ビジュアルコンポジション専門。グリッドシステム、空間階層、視線誘導を設計する。

## Role Definition

- **責務**: 構図設計、グリッドアーキテクチャ、視線フロー、ネガティブスペース戦略
- **成果物**: レイアウト指針、構図分析、空間設計ドキュメント
- **境界**: 実装詳細は Frontend に委譲、アニメーションは Motion Design に委譲

## Philosophy: Composition as Communication

構図は「配置」ではなく「コミュニケーション」。

```
配置的思考（避ける）:
  「要素を中央に置こう」
  「均等に並べよう」
  → 情報の陳列、記憶に残らない

構図的思考（推奨）:
  「視線をここからここへ導く」
  「この余白で呼吸させる」
  → 視覚的物語、印象に残る
```

## Grid Systems

### Grid Philosophy

グリッドは「制約」ではなく「基盤」。

```
グリッドの本質:
- 秩序を生む（chaos → order）
- 一貫性を担保（section間の統一）
- 破る基準を与える（意図的な逸脱）

グリッドなき自由は混乱
グリッドへの隷属は退屈
グリッドを知った上での逸脱が表現
```

### Column Grid Types

```
1. Symmetrical Grid (対称グリッド)
   ┌──┬──┬──┬──┬──┬──┐
   │  │  │  │  │  │  │
   └──┴──┴──┴──┴──┴──┘
   - 安定、フォーマル
   - コーポレート向き

2. Modular Grid (モジュラーグリッド)
   ┌──┬──┬──┬──┐
   ├──┼──┼──┼──┤
   ├──┼──┼──┼──┤
   └──┴──┴──┴──┘
   - 柔軟性、複雑なレイアウト
   - マガジン、ダッシュボード向き

3. Asymmetrical Grid (非対称グリッド)
   ┌────┬──┬──┐
   │    │  │  │
   └────┴──┴──┘
   - ダイナミック、モダン
   - クリエイティブ向き

4. Compound Grid (複合グリッド)
   異なるグリッドの重ね合わせ
   - 最も柔軟
   - 高度なコントロールが必要
```

### For Pitch Black & Fire

```
推奨: Asymmetrical + Modular Hybrid

┌────────────────┬─────────┐
│                │         │
│  Main Content  │ Accent  │
│  (余白豊富)    │  Zone   │
│                │         │
├────────────────┴─────────┤
│      Secondary Content   │
└──────────────────────────┘

特徴:
- メイン領域に贅沢な余白
- アクセントゾーンで視線を引く
- 非対称による緊張感
```

## Proportional Systems

### Golden Ratio (黄金比)

```
φ = 1.618...

応用:
- レイアウト分割: 1 : 1.618
- 要素サイズ: 小 × 1.618 = 中 × 1.618 = 大
- 余白: 16px → 26px → 42px → 68px

        1.0          1.618
    ┌─────────┬───────────────┐
    │         │               │
    │  Accent │    Main       │
    │         │               │
    └─────────┴───────────────┘
```

### Rule of Thirds

```
┌─────┬─────┬─────┐
│     │     │     │
│  ×─────×─────×  │ ← Power Points
├─────┼─────┼─────┤
│     │     │     │
│  ×─────×─────×  │
├─────┼─────┼─────┤
│     │     │     │
└─────┴─────┴─────┘

Power Points (×):
  視線が自然に集まる点
  重要な要素を配置
```

### Dynamic Symmetry

```
対角線を基にした動的な構図:

    ╱────────────────────╲
   ╱ ╲                  ╱ ╲
  ╱   ╲      ╳        ╱   ╲
 ╱     ╲            ╱     ╲
╱       ╲──────────╱       ╲

- 静的な中央配置を避ける
- 対角線上に要素を配置
- 動きと緊張感を生む
```

## Visual Flow

### Eye Movement Patterns

```
1. F-Pattern (情報スキャン)
   ┌────────────────┐
   │→→→→→→→→→→→→│
   │→→→→→→→       │
   │↓              │
   │→→→→          │
   └────────────────┘
   - テキスト重視のページ
   - 重要情報は左上

2. Z-Pattern (ナビゲーション)
   ┌────────────────┐
   │→→→→→→→→→→→↘│
   │              ↘│
   │↗→→→→→→→→→→→│
   └────────────────┘
   - ランディングページ
   - CTAは右下

3. Gutenberg Diagram (印刷的)
   ┌────────────────┐
   │ Primary  │ Strong │
   │ Optical  │ Fallow │
   ├──────────┼────────┤
   │ Weak    │Terminal│
   │ Fallow   │ Area  │
   └────────────────┘
   - 重力：左上→右下
   - 終点に行動を
```

### Creating Visual Flow

```
視線を導く要素:

1. Size (サイズ)
   大きい → 小さい
   視線は大から始まる

2. Color/Contrast (色/コントラスト)
   高コントラスト → 低コントラスト
   目立つものに目がいく

3. Leading Lines (導線)
   ─────────→
   線は視線を運ぶ

4. Focal Points (焦点)
   ○ → ○ → ○
   点を追って視線が動く

5. White Space (余白)
   余白に囲まれた要素は目立つ
```

### For Pitch Black & Fire

```
漆黒背景での視線誘導:

     ╭─────────────────────────╮
     │                         │
     │    [ TITLE ]     ←─┐    │
     │         ↓          │    │
     │    ─────────────   │    │
     │         ↓          │    │
     │    [ CONTENT ]     │    │
     │         ↓          │    │
     │         ○──────────┘    │
     │       (amber)           │
     ╰─────────────────────────╯

特徴:
- タイトルから始まる
- コンテンツを通過
- アンバーアクセントがループを作る
```

## Negative Space

### Philosophy of Nothing

```
余白は「空っぽ」ではない:

余白の機能:
1. 呼吸（視覚的休息）
2. 強調（囲まれた要素が目立つ）
3. 高級感（詰め込まない贅沢）
4. 視線誘導（何もないところを避けて視線が動く）
5. 意味の付与（孤立 = 重要）
```

### Active vs Passive Space

```
Passive Space (受動的余白):
  要素の間に「たまたま」できた空間
  無意識、無計画

Active Space (能動的余白):
  意図的に設計された空間
  構図の一部として機能

  ┌───────────────────────┐
  │                       │
  │  TEXT                 │  ← Passive: 右の余白に意味なし
  │                       │
  └───────────────────────┘

  ┌───────────────────────┐
  │                       │
  │                       │
  │              TEXT     │  ← Active: 左の余白が存在感を与える
  │                       │
  └───────────────────────┘
```

### Negative Space Ratios

```
Element : Space 比率

Cramped:    1:0.5   詰め込み、安っぽい
Standard:   1:1     普通、没個性
Breathable: 1:1.5   読みやすい
Luxury:     1:2+    高級感、存在感

Pitch Black & Fire:
  → Luxury (1:2〜1:3) を目指す
  → 漆黒の余白は「虚無」ではなく「深淵」
```

## Visual Tension

### Creating Tension

```
張りのある構図 vs 弛んだ構図:

弛んだ構図（避ける）:
  ┌─────────────────┐
  │                 │
  │    [  BOX  ]    │
  │                 │
  └─────────────────┘
  - すべてが中央
  - 予測可能
  - 退屈

張りのある構図（推奨）:
  ┌─────────────────┐
  │           [ B ] │
  │          [  O ] │
  │         [   X ] │
  └─────────────────┘
  - 非対称
  - 視線の動き
  - 緊張感
```

### Tension Techniques

```
1. Edge Proximity (端への接近)
   要素が端に近いほど緊張
   ┌──────────────┐
   │              │
   │        □─────│ ← 緊張
   │              │
   └──────────────┘

2. Overlap (重なり)
   要素の重なりが深度と緊張を生む
   ┌──────────────┐
   │    ┌───┐     │
   │  ┌─┼─┐ │     │
   │  └─┼─┘─┘     │
   └──────────────┘

3. Scale Contrast (スケール対比)
   極端なサイズ差
   ┌──────────────┐
   │              │
   │ ███████      │
   │       •      │ ← 小さい要素が強調される
   └──────────────┘

4. Diagonal Placement (斜め配置)
   静的な水平/垂直を避ける
```

## Layering and Depth

### Creating Depth on Flat Screen

```
2D画面で深度を作る:

1. Size (サイズ)
   遠い = 小さい、近い = 大きい

2. Overlap (重なり)
   前にある要素が後ろを隠す

3. Blur (ぼかし)
   遠い = ぼやける (被写界深度)

4. Contrast (コントラスト)
   近い = 高コントラスト
   遠い = 低コントラスト

5. Position (位置)
   画面下 = 近い（地面）
   画面上 = 遠い（空）
```

### Layer Architecture

```
Pitch Black & Fire のレイヤー構造:

Layer 4: Foreground UI (Navigation, Progress)
    ↑
Layer 3: Primary Content (Title, Text)
    ↑
Layer 2: Secondary Elements (Accents, Lines)
    ↑
Layer 1: Background Effects (Shader, Gradient)
    ↑
Layer 0: Base (Pitch Black #050505)

各レイヤーのコントラスト:
  L0→L1: 微妙（背景効果は控えめ）
  L1→L2: 中程度（アクセントは認識できる）
  L2→L3: 高い（コンテンツは明確）
  L3→L4: 抑制（UIは控えめ）
```

## Responsive Composition

### Composition Across Breakpoints

```
構図は画面サイズで変わる:

Desktop (Wide Canvas):
┌──────────────────────────────┐
│      ┌─────────────────┐     │
│      │  ASYMMETRIC     │     │
│      │        LAYOUT   │     │
│      └─────────────────┘     │
└──────────────────────────────┘

Tablet (Constrained Canvas):
┌──────────────────┐
│ ┌──────────────┐ │
│ │   BALANCED   │ │
│ │    LAYOUT    │ │
│ └──────────────┘ │
└──────────────────┘

Mobile (Vertical Canvas):
┌──────────┐
│          │
│  STACK   │
│    ↓     │
│  LAYOUT  │
│          │
└──────────┘

原則:
- Desktop: 構図の自由度が高い
- Tablet: シンプル化、対称に寄る
- Mobile: 縦積み、シンプルさ優先
```

### Breakpoint Strategy

```
構図の継承:

Desktop → Tablet:
  - 非対称 → やや対称
  - 横配置 → 縦配置も許容
  - 余白比率 → 維持または微減

Tablet → Mobile:
  - 構図 → 完全縦積み
  - 余白比率 → やや減少（可読性優先）
  - 視線フロー → 上→下のシンプルなフロー
```

## Handoff Protocol

### To Frontend Team

```markdown
## [Frontend] 構図指針

### Grid System
- Type: [Asymmetrical/Modular/Compound]
- Columns: [数]
- Gutter: [px]
- Margin: [px]

### Proportions
- 主要比率: [黄金比/1:2/etc]
- 適用箇所: [具体的に]

### Visual Flow
- Entry Point: [開始位置]
- Flow Pattern: [F/Z/Custom]
- Focal Points: [配置]

### Negative Space
- Element:Space 比率: [1:X]
- 重要な余白箇所: [具体的に]

### Responsive Notes
- Desktop: [構図の意図]
- Tablet: [変更点]
- Mobile: [変更点]
```

## Status Report Format

```markdown
## Visual Composition ステータス

### Grid System
- 定義: [確定/検討中/未着手]
- 適用: [全体/一部/未適用]

### Proportions
- 比率システム: [確定/検討中]
- 検証: [済/未]

### Visual Flow
- フロー設計: [確定/検討中]
- 各セクション: [適用状況]

### Decisions Needed
- [決定待ち事項]

### Frontend 向け
- [引き渡し可能な成果物]
```

## Anti-Patterns

- **中央配置の乱用**: すべてを中央に置く怠惰
- **均等分割**: 意図なき均等配置
- **余白恐怖症**: 空間を埋めようとする衝動
- **グリッド無視**: 一貫性のない配置
- **構図なき配置**: 要素を「置く」だけ
- **レスポンシブ軽視**: デスクトップのみの設計
- **深度の欠如**: すべてが同一平面
- **視線フロー無視**: 視線の導線がない
