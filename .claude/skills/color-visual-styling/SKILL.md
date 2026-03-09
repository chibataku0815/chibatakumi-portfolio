---
name: color-visual-styling
description: Color theory and visual styling specialist for palette architecture, perceptual color systems, gradient design, surface effects, and accessibility. Transforms art-direction mood into concrete color systems and hands off to frontend-dev/webgl-shader. Bridges creative intent and technical implementation through oklch-based color science. (project)
---

# color-visual-styling

色彩理論とビジュアルスタイリングの専門家。パレットアーキテクチャ、知覚的カラーシステム、グラデーション設計、サーフェスエフェクト、アクセシビリティを一貫して扱う。

**目標: Excellence Framework Level 5（受賞レベル）**

---

## 1. Role Definition

- **責務**: カラーパレット設計、セマンティックトークン体系、グラデーション・サーフェス効果、ダーク/ライトモード戦略、色彩アクセシビリティ
- **成果物**: カラーシステム仕様書、セマンティックトークンマップ、グラデーション定義、サーフェスマテリアル指針、コントラスト検証レポート
- **境界**: ムードの方向性は art-direction に委譲、CSS/GLSL 実装は frontend-dev / webgl-shader に委譲
- **品質基準**: EXCELLENCE-FRAMEWORK.md を参照し、常に Level 5 を目指す

### ブリッジとしての役割

```
art-direction        color-visual-styling       frontend-dev / webgl-shader
  (WHY)          →        (WHAT)           →          (HOW)

ムード・感情        カラーシステム・トークン       CSS Custom Properties
ビジュアルメタファー    パレット・グラデーション       GLSL uniform vec3
ナラティブ         色彩の物語構造              実装コード
```

---

## Quick Start — 5分で始めるカラー設計

```
このスキルを初めて使う場合、目的に合わせて以下から開始:

━━━ Use Case 1: 新しいコンポーネントに色を付ける ━━━
1. globals.css の既存トークンを確認（§5.2）
2. --bg-dark, --text-base, --accent-amber1 から選択
3. ホバー/アクティブ状態は relative color syntax で派生（§10.3）
   例: oklch(from var(--accent-amber1) calc(l * 1.1) c h)
4. アクセシビリティ確認（§9.1: AA 4.5:1 以上）

━━━ Use Case 2: 新しいセクションの色彩設計 ━━━
1. カラーナラティブでの位置を確認（§11.1: 起承転結）
2. 意思決定ツリーでパレット方針を選択（§5 冒頭）
3. 5層パレット構造でトークンを設計（§5.1）
4. @theme ブロックに Tailwind 用トークンを追加（§10.7）

━━━ Use Case 3: ダークモード対応 / テーマ拡張 ━━━
1. 既存の dark-first 設計を理解（§8.1）
2. oklch の L 値で深度レイヤーを設計（§8.1: Layer 0-3）
3. light-dark() で自動切替を実装（§10.6）
4. prefers-contrast / forced-colors を確認（§9.5）

━━━ Use Case 4: インタラクション色の決定 ━━━
「ホバー色を決めて」と言われたら:
1. §5.5 の判定フロー Q1 でコンポーネントの主張度を判定
2. Q2 で琥珀の要否を確認 → Strategy（S1-S6）を特定
3. §5.5 Interaction State Algorithm で状態別の色を導出
4. §14.2 Reality Map で類似コンポーネントの実装を確認
5. 既存トークンで実装可能か Token Decision Protocol で判定

━━━ Use Case 5: 既存コンポーネントの色修正 ━━━
「このコンポーネントの色がおかしい」と言われたら:
1. §14.2 Reality Map で対象コンポーネントの Strategy を確認
2. 現在の実装と Strategy の Interaction State が一致しているか検証
3. 不一致 → Strategy の状態色に合わせて修正
4. Strategy 自体が不適切 → Q1-Q2 で再判定し、正しい Strategy に変更
5. §15 Anti-Pattern に該当していないか確認

重要な参照先:
  - 既存トークン一覧 → §5.2
  - globals.css の @theme ブロック → §10.7
  - アクセシビリティ基準 → §9.1
  - Quality Checklist → §12
```

---

## 2. Philosophy: Color as Emotion

色は「装飾」ではなく「感情」を運ぶメディア。

```
装飾的思考（避ける）:
  「ここに青を入れよう」
  「このボタンをもっと鮮やかに」
  → 根拠なき色選択、パレットの崩壊

感情的思考（推奨）:
  「この琥珀は"制御された情熱"を表現する」
  「この漆黒は"無限の深淵"を意味する」
  → 色が物語を語る、記憶に残る

Level 3（洗練）: 調和した配色、意図がある
Level 4（差別化）: 色に性格がある、ブランドを体現
Level 5（受賞）: 色が言語になる、見たことのない色の使い方
```

### Level 5 に必要なもの

```
1. カラーナラティブ（色で物語を紡ぐ）
2. 予測を裏切る調和（意図的な不協和から生まれる記憶）
3. 色の呼吸（微妙なゆらぎによる生命感）
4. クロマティック・シグネチャ（このサイトでしか体験できない色）
5. アクセシビリティを創造性の触媒に変える
```

---

## 3. Award-Worthy Color Reference Library

### 必修参照: 色彩の達人たち

#### Color System Masters
| サイト | 特徴 | 学ぶべき点 |
|--------|------|-----------|
| [Stripe](https://stripe.com) | カラーシステムの教科書 | セマンティックトークン設計、一貫性のある広色域パレット |
| [Linear](https://linear.app) | ダークモード+グラデーションの完成形 | 漆黒の中の微妙な色温度変化、UI グラデーション |
| [Vercel](https://vercel.com) | ミニマルカラー戦略 | 最小限の色数で最大効果、geist カラースケール |
| [Apple](https://apple.com) | Liquid Glass / P3広色域 | 素材感の色彩表現、Wide Gamut の実践 |

#### Dynamic Color Expression
| サイト | 特徴 | 学ぶべき点 |
|--------|------|-----------|
| [Lando Norris by OFF+BRAND](https://landonorris.com) | 2025 SOTD、動的カラー変化 | スクロール連動の色彩変容、ブランドカラーの物語化 |
| [Aristide Benoist](https://aristidebenoist.com) | クリエイティブカラー表現 | ページ遷移での色の継続性、色が空間を定義する |
| [Active Theory](https://activetheory.net) | WebGL × カラー | シェーダーによる色彩の生成的表現、動的パレット |
| [Locomotive](https://locomotive.ca) | スクロール連動カラー変化 | セクション間の色彩グラデーション遷移 |

### ケーススタディ: Stripe のカラーシステム分析

```
Stripe の色彩戦略を分析し、Level 5 の要素を抽出する:

1. カラーアーキテクチャ
   - ベース: 深いネイビー/ダーク (#0a2540) → 「信頼 × 先進性」の融合
   - アクセント: パープル〜ブルーのグラデーション → 「テクノロジーの洗練」
   - 補助: 多色パレット（各プロダクト別に固有色）→ スケーラビリティ

2. Level 5 要素の特定
   □ Chromatic Signature: 「Stripe Purple」という唯一の色
     → 紫でもフィンテック感がある（通常は青が金融の色）
     → 予測を裏切りつつ、ブランドと完全に一致
   □ グラデーション: oklch 空間での多点グラデ（ダークモード）
     → 単なる2色混合ではなく、3-5色の微妙なブレンド
     → 「色が呼吸している」感覚
   □ Surface Design: ダークモードの微妙な表面差
     → Layer 0-3 の明度差が 0.02-0.04 oklch L 刻み
     → シャドウではなく luminance で深度を表現

3. Pitch Black & Fire への応用
   | Stripe の手法 | 本プロジェクトへの翻訳 |
   |-------------|---------------------|
   | 多色グラデーション | Heat Tokens の3段階グラデーション |
   | ブランド固有色 | 琥珀の「温度」概念 |
   | 微細な表面差 | slate-1/2 間の深度レイヤー |
   | ダークモード優先設計 | Pitch Black を primary に |

4. 教訓
   「Stripe は色が多いが騒がしくない」
   → 各色に明確な役割があるから
   → Pitch Black & Fire も「少ない色、深い意味」で同じ効果を狙う
```

### Anti-Teacher Patterns（避けるべき参照）

```
Generic AI Color Palette:
- 紫→青のリニアグラデーション背景
- 彩度が高すぎるネオンアクセント
- 根拠なき虹色グラデーション
- Bootstrap / Material のデフォルトカラーそのまま

Corporate Blandness:
- 安全な青 (#0066CC) + 白の企業テンプレート
- 灰色だけの「モダン」配色
- Stock photo に合わせた無個性な色選択

Trend Chasing:
- 2023年的 Glassmorphism の安易な模倣
- ダークモードを「とりあえず」実装
- Bento Grid のパステルカラー濫用
```

---

## 4. Color Theory Fundamentals

### 4.1 Color Wheel & Harmony

```
| ハーモニー | 関係 | 感情特性 | Level 5 活用 |
|-----------|------|---------|-------------|
| Complementary | 対立2色 | 緊張、ドラマ | 漆黒×琥珀（PB&Fのコア） |
| Analogous | 隣接色 | 調和、統一感 | 琥珀→オレンジ→赤の暖色グラデ |
| Triadic | 120°間隔 | 活気、豊かさ | ダークUI上では彩度を抑制 |
| Split-Comp. | 補色の両隣 | 穏やか、多様 | 3色目の「意外性」で記憶を作る |
| Tetradic | 2組の補色 | 複雑、豊か | 1色ドミナント、残りアクセント |
| Monochromatic | 1色相内 | 洗練、統一 | 微妙な色相シフトで深みを作る |
```

#### Level 5: 予測を裏切るハーモニー

```
「正しい」ハーモニーは Level 3。
Level 5 は意図的な「不協和音」を導入し、記憶に残す。

例:
  調和したモノクロマティックパレットの中に、
  1箇所だけ予想外の彩度/色相を配置
  → 「あの色」としてユーザーの記憶に残る

Pitch Black & Fire の場合:
  漆黒（モノクロマティック）× 琥珀（補色的アクセント）
  → 琥珀の出現が「不協和」として記憶を作る
  → しかし火のメタファーにより文脈に沿った「裏切り」
```

### 4.2 oklch Mental Model

```
RGB → HSL → oklch の進化:

RGB:
  機械のための色空間
  「赤50% + 緑80% + 青30%」→ 人間に直感的でない

HSL:
  人間向きに見えるが、知覚的に均一でない
  H=60°(黄) と H=240°(青) の L=50% は同じ明るさに見えない

oklch:
  知覚的に均一な色空間
  L: Lightness (0-1) — 知覚的に均一な明度
  C: Chroma (0-∞ 理論値) — 彩度（色の鮮やかさ）
      sRGB ガマット内: 最大 ~0.37（彩度の高い青/緑）
      Display P3:      最大 ~0.40+（より広い色域）
      実用範囲: 0-0.37 (sRGB), 0-0.45 (P3)
  H: Hue (0-360) — 色相角度

なぜ oklch がデザインシステムの標準か:
  1. L を固定すれば、色相を変えても同じ明るさに見える
  2. Chroma を均一に調整するとハーモニーが自然
  3. Tailwind v4 が oklch を採用 → エコシステム標準化
  4. CSS color-mix(in oklch, ...) で知覚的に正確な合成
  5. linear-gradient(in oklch, ...) で muddy midpoints を回避
```

### 4.3 Color Psychology & Cultural Context

```
色→感情マッピング:

| 色 | Western | Japanese | Pitch Black & Fire |
|-----|---------|----------|-------------------|
| 黒 | 死、高級、権威 | 闇、空、墨 | 深淵、無限の奥行き |
| 琥珀 | 暖かさ、注意 | 金、火、秋 | 制御された熱、職人の火 |
| 白 | 純粋、清潔 | 神聖、無 | 光の断片、余白の呼吸 |
| 灰 | 中立、工業 | 灰燼、侘び | 深度の階層、沈黙 |

Level 5: 文脈による意味の転覆
  同じ色が場所によって異なる意味を持つ設計
  例: 琥珀が Hero では「情熱」、Contact では「歓迎の灯」
  → 色の意味が物語と共に変化する
```

### 4.4 Pitch Black & Fire のカラー言語

```
漆黒 = 深淵・無限の奥行き
  - 単なる「暗い背景」ではない
  - 複数の黒のレイヤー（slate-1, slate-2）で深度を表現
  - 「何もない」のではなく「すべてを内包する」闇

琥珀 = 抑制された熱・職人の火
  - 爆発する炎ではなく、炉の中の静かな火
  - heat-subtle / heat-medium / heat-intense の3段階
  - 「見せる」のではなく「感じさせる」熱

両者の関係:
  漆黒は琥珀を引き立てる「舞台」
  琥珀は漆黒に「生命」を吹き込む「火種」
  → この関係性がブランドの色彩署名
```

---

## 5. Color Palette Architecture

### 色選択の意思決定ツリー

```
色を選ぶ前に、以下のフローで方向性を決定する:

Q1. プロジェクトタイプは？
├─ ポートフォリオ / パーソナルブランド
│   → 独自性重視。Chromatic Signature を定義（§11.4）
├─ プロダクト / SaaS
│   → 一貫性重視。セマンティックトークンを先に設計（§5.2）
└─ キャンペーン / LP
    → インパクト重視。60-30-10 の 10% を最大活用

Q2. ムードは？（art-direction から受信 §13.1）
├─ 静謐・深淵 → 低 Chroma (0.01-0.05), 深い L (0.10-0.18)
├─ 情熱・熱 → 暖色 Hue (50-80), 中-高 Chroma (0.10-0.20)
├─ 洗練・知的 → 中性色中心, Chroma ≤ 0.03, モノクロマティック
└─ 遊び・活気 → 高 Chroma (0.15+), 複数色相, Triadic/Tetradic

Q3. パレット戦略は？
├─ Monochromatic → 1色相 + 明度/彩度バリエーション
├─ Complementary → 2色の緊張感（Pitch Black & Fire はこれ）
├─ Analogous → 隣接色の調和
└─ Custom → art-direction の指示に従う

→ 決定後、§5.1 の 5層構造でパレットを構築
```

### 5.1 Palette Layers

5層パレット構造:

```
Layer 1: Base（基盤）
  背景色、最も広い面積
  Pitch Black & Fire: --bg-dark (slate-1), --bg-darker (slate-2)

Layer 2: Surface（表面）
  カード、パネル、オーバーレイ
  Pitch Black & Fire: --bg-overlay-5/10/20/40

Layer 3: Text（テキスト）
  本文、見出し、キャプション
  Pitch Black & Fire: --text-base (slate-12), --text-muted (slate-11)

Layer 4: Accent（アクセント）
  CTA、ハイライト、フォーカス
  Pitch Black & Fire: --accent-amber1 (amber-9), --accent-amber2 (amber-10)

Layer 5: Semantic（意味的）
  成功、警告、エラー、情報
  Pitch Black & Fire: heat-subtle/medium/intense
```

#### 60-30-10 ルール

```
60% — Base Layer（漆黒）
  視覚的な安定と統一感の土台

30% — Surface + Text Layer（深灰〜白）
  コンテンツの可読性と階層

10% — Accent Layer（琥珀）
  注目点と感情的インパクト

Level 5: Signature Color
  10%のアクセントの「使い方」がそのサイト固有になる
  → 琥珀の glow エフェクト、heat token の3段階
  → 他のサイトが同じ琥珀を使っても同じにならない
```

### 5.2 Semantic Token System

```
命名規則: --[category]-[role]

既存トークン（globals.css）:
  Background:  --bg-dark, --bg-darker
  Text:        --text-base, --text-muted
  Accent:      --accent-amber1, --accent-amber2
  Overlay:     --bg-overlay-5/10/20/40
  Heat:        --heat-subtle, --heat-medium, --heat-intense
  Shadow:      --shadow-glow-sm/md/lg
  Heat Glow:   --heat-glow-sm/md/lg

Radix Color スケール（globals.css で import 済み）:
  @import "@radix-ui/colors/slate-dark.css";
  @import "@radix-ui/colors/amber-dark.css";

  Radix スケール構造（1-12）:
  | Step | 用途 | 例 |
  |------|------|-----|
  | 1-2 | 背景（アプリ/サブ） | --slate-1 → --bg-dark |
  | 3-5 | インタラクティブ表面 | ホバー、アクティブ |
  | 6-8 | 境界線、セパレーター | subtle → visible |
  | 9-10 | ソリッドカラー | --amber-9 → --accent-amber1 |
  | 11 | 低コントラストテキスト | --slate-11 → --text-muted |
  | 12 | 高コントラストテキスト | --slate-12 → --text-base |

  Radix のメリット:
  - ダークモード用に最適化済み（-dark.css サフィックス）
  - 12段階の一貫したスケール → セマンティックトークンへのマッピングが容易
  - アクセシビリティ考慮済み（step 9-12 はコントラスト比保証）

拡張可能パターン:
  Semantic:    --color-success, --color-warning, --color-error
  Interactive: --color-hover, --color-active, --color-focus
  Border:      --border-subtle, --border-medium

Heat Tokens パターンの拡張可能性:
  現在: 3段階（subtle/medium/intense）
  拡張: 状態別（--heat-hover, --heat-active, --heat-glow-pulse）
  → 琥珀の「温度」をインタラクション状態にマッピング
```

### 5.3 Palette Generation with oklch

```
Lightness スケール生成（例: 中性色）:

  oklch(0.98 0.003 250)  → 50  (ほぼ白)
  oklch(0.93 0.005 250)  → 100
  oklch(0.87 0.008 250)  → 200
  oklch(0.78 0.012 250)  → 300
  oklch(0.68 0.015 250)  → 400
  oklch(0.55 0.018 250)  → 500
  oklch(0.45 0.020 250)  → 600
  oklch(0.35 0.018 250)  → 700
  oklch(0.25 0.015 250)  → 800
  oklch(0.15 0.010 250)  → 900 (ほぼ黒)

Chroma 調整:
  Low Chroma (0.01-0.03): 中性的、静かな色
  Mid Chroma (0.05-0.12): 落ち着いたアクセント
  High Chroma (0.15-0.30): 鮮やかなアクセント

Relative color syntax での動的派生:
  --accent-hover: oklch(from var(--accent-amber1) calc(l * 1.1) c h);
  --accent-muted: oklch(from var(--accent-amber1) l calc(c * 0.5) h);
```

### 5.4 Brand Color Expansion

```
限定パレット → フルシステムへの拡張:

Step 1: ブランドカラーの oklch 値を分析
  琥珀 (amber-9) → oklch(0.76 0.16 70)

Step 2: Lightness スケールを生成
  amber-50:  oklch(0.98 0.04 70)
  amber-100: oklch(0.93 0.08 70)
  ...
  amber-900: oklch(0.25 0.08 70)

Step 3: 補完色を数学的に導出
  補色: oklch(0.76 0.16 250) → 冷たい青
  類似色: oklch(0.76 0.16 40) → 暖かい赤
  分裂補色: oklch(0.76 0.16 220), oklch(0.76 0.16 280)

Level 5: 色の「呼吸」
  静的な固定値ではなく、微妙な彩度・明度のゆらぎ
  → CSS @property + animation で実現
  → 色が「生きている」感覚を作る
```

### 5.5 Color Strategy Engine

```
━━━ 6つの色戦略（Color Strategy Classification） ━━━

コードベースには以下の6戦略が共存する。
「いい感じの色にして」では判断できない。まず Strategy を特定する。

| Strategy | 名称 | 概要 | 琥珀の使い方 |
|----------|------|------|-------------|
| S1 | Amber Full | CTA、主要アクション | amber-9 直接 + glow + 常時視認 |
| S2 | Amber Hint | フォーム、状態変化 | focus/success 時のみ amber 出現 |
| S3 | Amber Recovery | エラー回復、注意喚起 | 通常 muted → hover で amber に変化 |
| S4 | Opacity Gradient | ナビ、テキスト階層 | 琥珀不使用。text-base の opacity 変化 |
| S5 | White Opacity | タグ、メタ情報 | 琥珀不使用。white/X の bg + border |
| S6 | Minimal Surface | リスト、背景的要素 | 琥珀不使用。white/[0.02] 極微ホバー |
```

#### Component Role → Strategy 判定フロー

```
Q1. コンポーネントの「主張度」は？
├─ 最高（ページに1-2個の CTA）          → S1: Amber Full
├─ 高（フォーム入力、状態変化を伴う操作）  → S2: Amber Hint
├─ 中（エラー/リカバリ、注意喚起）        → S3: Amber Recovery
├─ 低-中（ナビゲーション、テキスト階層）   → S4: Opacity Gradient
├─ 低（グループ化されたメタ情報、タグ）    → S5: White Opacity
└─ 最低（リストアイテム、背景的要素）      → S6: Minimal Surface

Q2. 琥珀を使うべきか？（確認用）
├─ ユーザーの次のアクションを導く → YES (S1-S3)
├─ 情報の階層を表現する → NO (S4)
├─ グルーピング/装飾的な区切り → NO (S5-S6)
└─ 迷ったら → S5（最も安全で汎用的）

判定例:
  「新しいタグのホバー色」
    → Q1: 低（メタ情報） → S5
    → Q2: グルーピング → NO
    → 出力: border-white/12 → hover:border-white/20 bg-white/10

  「フォーム入力のフォーカス色」
    → Q1: 高（状態変化） → S2
    → Q2: アクションを導く → YES
    → 出力: focus: amber-9 underline animate

  「アーカイブリストのホバー」
    → Q1: 最低（リスト） → S6
    → Q2: 装飾的 → NO
    → 出力: hover:bg-white/[0.02]
```

#### Interaction State Algorithm

```
Strategy 別のインタラクション状態派生ルール:

━━━ S1-S3: 琥珀を使う戦略 ━━━

| State | S1: Amber Full | S2: Amber Hint | S3: Amber Recovery |
|-------|---------------|---------------|-------------------|
| default | amber-9 + glow | --text-base-20 border | muted text + border |
| hover | glow intensity ×1.5 | border → text-base-40 | border → amber-9/60, text → amber |
| focus | ring amber-9 | amber-9 underline animate | ring amber-9 |
| active | scale(0.98) | (N/A) | scale(0.98) |
| disabled | opacity 0.4, glow off | opacity 0.4 | opacity 0.4 |

━━━ S4-S6: 琥珀を使わない戦略 ━━━

| State | S4: Opacity Gradient | S5: White Opacity | S6: Minimal Surface |
|-------|---------------------|------------------|-------------------|
| default | text-muted | border-white/12 bg-white/6 | bg-transparent |
| hover | text-base + opacity:1 | border-white/20 bg-white/10 | bg-white/[0.02] |
| focus | opacity:1 + underline | border-white/25 | bg-white/[0.04] |
| active | (N/A) | bg-white/12 | (N/A) |
| disabled | opacity 0.3 | opacity 0.3 | pointer-events-none |

重要: 上記は原則。§14.2 の Reality Map で既存コンポーネントの実装を確認し、
新規追加時は近いコンポーネントの実装に合わせる。
```

#### Token Decision Protocol

```
新しい色が必要になった場合の判断フロー:

Q1. 既存トークンで表現可能か？
├─ --text-base-XX（opacity 派生）で表現可 → 使う（§5.2）
├─ white/X（Tailwind 直書き）で表現可 → 使う（§14.2 標準スケール参照）
├─ amber-9 の派生で表現可 → oklch(from ...) で導出（§10.3）
└─ いずれも不可 → Q2 へ

Q2. 新トークンが必要な場合:
├─ 3箇所以上で使う → :root + @theme に追加（§10.7）
├─ 1-2箇所のみ → コンポーネントローカル CSS variable
└─ セマンティックな意味がある → --color-{semantic} 命名（§15.1）

Q3. 命名規則:
├─ 色の値を名前にしない（NG: --amber-hover）
├─ 役割を名前にする（OK: --color-success, --border-active）
└─ Strategy との対応を明記（コメントで S1-S6 を記載）
```

---

## 6. Gradients & Color Transitions

### 6.1 Gradient Types & Emotional Impact

```
Linear Gradient:
  方向性、流れ、進行感
  → ナビゲーション、プログレスバー、時間の経過

Radial Gradient:
  中心からの放射、焦点、エネルギー
  → ヒーロー背景、スポットライト、注目点

Conic Gradient:
  回転、周期、変化
  → チャート、ローディング、装飾

Mesh Gradient:
  有機的、自然、流体的
  → 背景テクスチャ、アート表現
  → Level 5: CSS mesh gradient (複数ポイントの blend)

Level 5: Cinematic Gradients
  映画のカラーグレーディングのような色彩遷移
  → 複数色の微妙なブレンド
  → 環境光を意識した色温度変化
  → 「シーン」としてのセクション色彩
```

### 6.2 Perceptual Gradients (oklch interpolation)

```
sRGB の問題: Muddy midpoints
  linear-gradient(red, blue) → 中間が灰色っぽく濁る
  理由: sRGB は知覚的に均一でない

oklch による解決:
  linear-gradient(in oklch, red, blue)
  → 中間色が鮮やかに保たれる
  → 知覚的に自然な色の遷移

色相補間方向（Hue Interpolation）:
  oklch での色相補間には方向指定が重要。
  デフォルトは shorter hue（短い方の弧を通る）。

  shorter hue（デフォルト）:
    H:70(琥珀) → H:250(青) = 70→0→360→250 (180°)
    → 赤/マゼンタを経由。意図と異なることが多い

  longer hue:
    H:70(琥珀) → H:250(青) = 70→100→...→250 (180°)
    → 黄→緑→シアン→青。彩度豊かな経路

  使い分け:
  | 用途 | 指定 | 理由 |
  |------|------|------|
  | 近い色相間のグラデ | shorter hue | 自然で短い経路 |
  | 虹色/スペクトル表現 | longer hue | 多くの色相を経由 |
  | 180° 以上離れた色相 | 明示的に指定 | 意図しない経路を防止 |

  構文:
    linear-gradient(in oklch shorter hue, start, end);
    linear-gradient(in oklch longer hue, start, end);
    color-mix(in oklch shorter hue, color1, color2);

Level 5: Multi-stop Ambient Lighting
  background: linear-gradient(
    in oklch shorter hue,
    oklch(0.15 0.01 250) 0%,      /* 深い闇 */
    oklch(0.18 0.02 260) 30%,      /* 微かな青み */
    oklch(0.20 0.04 70) 60%,       /* 琥珀の予感 */
    oklch(0.15 0.01 250) 100%      /* 闇への回帰 */
  );
  → セクション背景に映画的な環境光を表現
  → shorter hue 指定で 250→70 間の意図しない色相経由を防止
```

### 6.3 Animated Color Transitions

```
@property によるグラデーションアニメーション:

@property --gradient-hue {
  syntax: '<number>';
  inherits: false;
  initial-value: 70;
}

.animated-gradient {
  background: linear-gradient(
    in oklch,
    oklch(0.20 0.05 var(--gradient-hue)),
    oklch(0.15 0.01 250)
  );
  transition: --gradient-hue 1.2s ease-out;
}

スクロール連動カラーシフト:
  ScrollTrigger で progress (0-1) を取得
  → CSS custom property に反映
  → グラデーションの色相が連続的に変化

  注意: H:70→250 のように 180° 以上離れた色相をアニメーションする場合、
  oklch 補間が意図しない方向を通ることがある。
  → @property で --gradient-hue を <number> 型にし、
    数値として直接補間することで方向を制御する。

Level 5: 色の物語性（セクション間の色彩ナラティブ）
  Hero:     oklch(0.15 0.01 250) → 深い闇（静謐）
  Works:    oklch(0.18 0.04 70)  → 琥珀の気配（発見）
  Skills:   oklch(0.20 0.06 60)  → 熱の高まり（頂点）
  Contact:  oklch(0.16 0.03 80)  → 暖かい余韻（回帰）
```

---

## 7. Visual Effects & Surface Design

### 7.1 Shadow System

```
Elevation Hierarchy:
  --shadow-sm:  0 1px 2px    → 微かな浮き（ボタン、バッジ）
  --shadow-md:  0 4px 8px    → 中程度の浮き（カード）
  --shadow-lg:  0 8px 24px   → 大きな浮き（モーダル）
  --shadow-xl:  0 16px 48px  → 最大の浮き（オーバーレイ）

ヒュー染めシャドウ（純黒シャドウの禁止）:
  NG: box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  OK: box-shadow: 0 4px 8px color-mix(in oklch, var(--bg-dark) 80%, transparent);

既存トークン活用:
  --shadow-glow-sm/md/lg → 白い発光（テキスト、UI要素）
  --heat-glow-sm/md/lg → 琥珀の発光（アクセント、CTA）

Level 5: Shadow as Narrative
  影の「方向」で光源を暗示 → 世界観の一貫性
  影の「色」で温度を伝える → 琥珀の glow = 熱源の存在
  影の「変化」で時間経過を示す → スクロールで影が変化
```

### 7.2 Glass & Blur Effects

```
Dark Glassmorphism（2025-2026 主流）:
  background: color-mix(in oklch, var(--bg-dark) 70%, transparent);
  backdrop-filter: blur(16px) saturate(1.2);
  border: 1px solid var(--bg-overlay-10);

Apple Liquid Glass の影響:
  - 背景の色を拾って反映する半透明
  - 光の屈折を意識した border 処理
  - P3 カラースペースでの高品質な透過

パフォーマンス考慮:
  backdrop-filter は GPU 負荷が高い
  → 必要な箇所に限定（ナビ、モーダル）
  → モバイルでは blur 値を軽減
  → will-change: backdrop-filter を適切に使用

  パフォーマンスコスト一覧:
  | 機能 | コスト | 制限ガイド |
  |------|--------|-----------|
  | backdrop-filter: blur() | 高 | 同時 3 要素以下、モバイルは blur(8px) 以下 |
  | oklch() アニメーション | 中 | @property 経由で L/C/H を個別アニメーション |
  | CSS Custom Property 更新 | 低-中 | JS から頻繁に更新する場合は :root を避け要素直指定 |
  | color-mix() | 低 | 静的使用はほぼ無コスト、アニメーション時は注意 |
  | linear-gradient(in oklch) | 低 | 描画時のみ計算、アニメーションしなければ問題なし |

  Custom Property アニメーション時の注意:
  → :root レベルの property 変更は全子孫に波及（リペイント大）
  → アニメーション対象の要素に直接 property を定義する
  → @property で型を定義しないと transition/animation が効かない

Level 5: 目的ある透明性
  透明は「装飾」ではなく「階層の表現」
  → 前面のコンテンツと背面の世界の関係性を可視化
  → ガラス越しに見える背景が「文脈」を提供する
```

### 7.3 Texture & Noise

```
既存: --noise-texture（SVG ノイズ）
  background-image: var(--noise-texture);
  opacity: 0.03-0.08;
  mix-blend-mode: overlay;

フィルムグレイン:
  → SVG feTurbulence のアニメーション
  → 写真・映像コンテンツとの親和性

ペーパーテクスチャ:
  → フラットな表面に「物質感」を付与
  → デジタルだが触覚的な質感

Level 5: テクスチャが感情を運ぶ
  - ノイズの粒度が「時代」を表現（粗い=ヴィンテージ、微細=現代）
  - テクスチャの密度がセクションの「重さ」を表現
  - --ghost-subtle/medium/strong との連携
```

### 7.4 Surface Material Taxonomy

```
| マテリアル | 特徴 | 適用 |
|-----------|------|------|
| Flat | 影なし、テクスチャなし | テキスト、本文 |
| Frosted | ガラス効果、blur、半透明 | ナビ、オーバーレイ |
| Textured | ノイズ、グレイン | 背景、装飾 |
| Metallic | グラデーション、反射 | ロゴ、アイコン |
| Matte | 低コントラスト、柔らかい影 | カード、入力 |

Level 5: Material Storytelling
  素材の選択が物語を語る:
  - 職人セクション → Textured（手仕事の質感）
  - 技術セクション → Metallic（精密さ）
  - 哲学セクション → Flat（言葉の余白）
```

---

## 8. Dark/Light Mode Design

### 8.1 Dark Mode Mastery

```
輝度による深度表現:
  ダークモードではシャドウが見えにくい
  → 代わりに「表面の明度差」で深度を表現

  Layer 0 (最深): oklch(0.13 0.005 250)  — 背景
  Layer 1:        oklch(0.16 0.008 250)  — カード
  Layer 2:        oklch(0.19 0.010 250)  — 浮いた要素
  Layer 3:        oklch(0.22 0.012 250)  — モーダル

色の彩度調整:
  ダーク背景上の高彩度 → 振動して見える（halation）
  → Chroma を 70-80% に抑える
  → oklch(from var(--accent) l calc(c * 0.75) h)

Pitch Black & Fire のレイヤー構造:
  --bg-dark (slate-1):  最深の闇、メイン背景
  --bg-darker (slate-2): 一段深い闇、ネストされたコンテナ
  --bg-overlay-5/10/20:  表面のレイヤー、ガラス効果

Level 5: 闇が持つ意味
  暗い背景は「デザインの不在」ではない
  → 「無限の深淵」であり、すべてを内包する空間
  → 闇の中で光（琥珀）が持つ意味が増幅される
  → Stripe は闇を「上質な舞台」、Pitch Black & Fire は「深淵そのもの」
```

### 8.2 Light Mode Strategy

```
ダークモードとの差異:
  深度表現: 輝度差 → シャドウベース（色付きシャドウで温かみ追加）
  アクセント: oklch(from var(--accent) calc(l * 0.85) c h) で L を調整
  白の基調: oklch(0.97 0.003 80)（純白は眩しいため微暖色）
```

### 8.3 Theme Architecture

```
CSS Custom Property による切り替え戦略:

:root {
  /* Default: Dark (Pitch Black & Fire) */
  --bg-primary: var(--slate-1);
  --text-primary: var(--slate-12);
  --accent: var(--amber-9);
}

:root[data-theme="light"] {
  --bg-primary: oklch(0.97 0.003 80);
  --text-primary: oklch(0.20 0.01 250);
  --accent: oklch(0.65 0.18 70);
}

light-dark() 関数:
  color: light-dark(oklch(0.20 0.01 250), oklch(0.95 0.01 80));
  → テーマに応じて自動切替

prefers-color-scheme + class-based:
  @media (prefers-color-scheme: dark) → OS設定に従う
  [data-theme="dark"] → ユーザー選択を優先
  → ハイブリッド戦略で両方に対応
```

---

## 9. Color Accessibility

### 9.1 WCAG 2.x Contrast Standards

```
AA 基準（必須）:
  通常テキスト: 4.5:1 以上
  大テキスト (18px+ bold / 24px+): 3:1 以上
  UI要素・グラフィクス: 3:1 以上

AAA 基準（推奨）:
  通常テキスト: 7:1 以上
  大テキスト: 4.5:1 以上

Pitch Black & Fire の現状:
  --text-base (slate-12) on --bg-dark (slate-1):
    → 高コントラスト、AA/AAA 両方クリア
  --text-muted (slate-11) on --bg-dark (slate-1):
    → AA クリア、確認必要
  --accent-amber1 (amber-9) on --bg-dark (slate-1):
    → テキスト使用時は要確認
```

### 9.2 APCA (Next-Gen Contrast)

```
APCA（Advanced Perceptual Contrast Algorithm）:
  WCAG 3.0 で採用予定の新コントラスト指標
  Lc値（Lightness Contrast）で評価

Lc値ガイドライン:
  |Lc| ≥ 90:  本文テキスト（小サイズ）
  |Lc| ≥ 75:  本文テキスト（通常サイズ）
  |Lc| ≥ 60:  大テキスト、見出し
  |Lc| ≥ 45:  UI要素、アイコン
  |Lc| ≥ 30:  非テキストの装飾、境界線
  |Lc| ≥ 15:  微妙な背景の差異

oklch × APCA の相性:
  oklch の L 値と APCA の Lc 値は相関する
  → oklch でパレットを設計すると APCA への最適化が容易

Level 5: アクセシビリティを制約ではなく創造性の触媒に
  「コントラスト比を満たすために色を変えなければ」→ Level 3
  「コントラスト制約が、より力強い配色を導いた」→ Level 5
  → 制約が創造性を高めるマインドセット
```

### 9.3 Color Vision Deficiency

```
対応すべき色覚タイプ:

Protanopia（赤色覚異常、約1%）:
  赤が見えにくい
  → 赤/緑の区別に色以外の情報を追加

Deuteranopia（緑色覚異常、約5%）:
  緑が見えにくい
  → 赤/緑の区別に形状・テクスチャを併用

Tritanopia（青色覚異常、約0.01%）:
  青/黄の区別が困難
  → 青/黄の組み合わせに注意

設計原則:
  1. 色のみに依存しない情報伝達
     - アイコン、テキストラベル、パターンの併用
  2. 十分なコントラスト比の確保
  3. 色覚シミュレーションツールでの検証
     - Chrome DevTools: Rendering > Emulate vision deficiencies

Pitch Black & Fire への影響:
  琥珀 × 漆黒: 全色覚タイプで十分な明度差
  → 色相に依存せず明度差で識別可能
  → モノクロに変換しても情報が保持される
```

### 9.5 Forced Colors & High Contrast Mode

```
Windows High Contrast Mode（forced-colors）:
  ユーザーが OS レベルで色を強制指定する環境。
  デザイントークンが完全に無視される。

@media (forced-colors: active) {
  /* forced-colors 環境では以下が強制される:
     - 背景色 → Canvas
     - テキスト → CanvasText
     - リンク → LinkText
     - ボタン → ButtonText / ButtonFace
     - 選択 → Highlight / HighlightText  */

  .card {
    border: 1px solid CanvasText; /* 境界が消えるのを防止 */
  }

  .heat-indicator {
    /* 色で表現していた「温度」をテキストで補完 */
    forced-color-adjust: none; /* 一部要素のみ強制解除（慎重に） */
  }
}

prefers-contrast — コントラスト設定:
  @media (prefers-contrast: more) {
    :root {
      --text-muted: var(--slate-12); /* muted を廃止、全テキスト最高コントラスト */
      --bg-overlay-5: var(--bg-overlay-20); /* 薄いオーバーレイを濃く */
      --heat-subtle: var(--heat-medium); /* subtle を medium に引き上げ */
    }
  }

  @media (prefers-contrast: less) {
    :root {
      --text-base: var(--slate-11); /* テキストのコントラストを控えめに */
    }
  }

設計原則:
  1. forced-colors 環境ではシステムカラーキーワードを使用
  2. 色のみで伝えている情報には必ず代替手段を用意（境界線、アイコン、テキスト）
  3. forced-color-adjust: none は限定的に使用（ブランドロゴ等）
  4. prefers-contrast: more では「美しさ」より「明瞭さ」を優先
```

### 9.4 Existing Token Audit

```
検証すべきカラーペア:

| Foreground | Background | 用途 | 確認項目 |
|-----------|-----------|------|---------|
| --text-base | --bg-dark | 本文 | AA 4.5:1 ✓ |
| --text-muted | --bg-dark | 補助テキスト | AA 4.5:1 確認 |
| --accent-amber1 | --bg-dark | CTA テキスト | AA 3:1 確認 |
| --text-base | --bg-overlay-20 | オーバーレイ上テキスト | AA 4.5:1 確認 |
| --heat-medium | --bg-dark | Heat アクセント | AA 3:1 確認 |

検証手順:
  1. 各ペアの実際の RGB 値を取得
  2. WCAG 2.1 コントラスト比を計算
  3. APCA Lc 値を計算
  4. 不合格ペアの代替色を oklch で導出

検証ツール・ワークフロー:
  1. WebAIM Contrast Checker (webaim.org/resources/contrastchecker/)
     → 前景/背景の HEX 値を入力、WCAG AA/AAA の即時判定
     → 複数ペアを連続チェックする際に最速

  2. APCA Contrast Calculator (apcacontrast.com)
     → WCAG 3.0 ドラフトの APCA Lc 値を算出
     → フォントサイズ別の推奨 Lc 値と照合

  3. Chrome DevTools Rendering パネル
     手順:
     a. DevTools → More tools → Rendering
     b. "Emulate vision deficiencies" → 各色覚タイプを選択
     c. "Emulate CSS media feature prefers-contrast" → more/less を確認
     d. "Emulate CSS media feature forced-colors" → active で確認
     → スクリーンショットを撮って比較

  4. oklch.com
     → oklch 値のインタラクティブ探索
     → sRGB / P3 ガマット境界の可視化
     → パレット生成時の Chroma 上限確認
```

---

## 10. Modern CSS Color Features

### 10.1 oklch() — 知覚均一カラースペース

```css
/* 基本構文 */
color: oklch(0.76 0.16 70);
/* L: 0-1 (lightness), C: 0-∞ (chroma, sRGB≤0.37), H: 0-360 (hue) */

/* 透明度付き */
color: oklch(0.76 0.16 70 / 0.8);

/* 用途: パレット生成、ハーモニー計算、一貫性のあるスケール */
```

### 10.2 color-mix() — 色の合成

```css
/* 既存トークンでの使用例 */
--text-base-60: color-mix(in srgb, var(--slate-12) 60%, transparent);

/* oklch での合成（推奨） */
--accent-hover: color-mix(in oklch, var(--accent-amber1) 80%, white);
--accent-subtle: color-mix(in oklch, var(--accent-amber1) 30%, transparent);

/* 2色のブレンド */
--warm-surface: color-mix(in oklch, var(--bg-dark) 95%, var(--accent-amber1));
```

### 10.3 Relative Color Syntax — 動的色派生

```css
/* ベース色から動的に派生 */
--accent-lighter: oklch(from var(--accent-amber1) calc(l + 0.1) c h);
--accent-desaturated: oklch(from var(--accent-amber1) l calc(c * 0.5) h);
--accent-complementary: oklch(from var(--accent-amber1) l c calc(h + 180));

/* ホバー状態の動的生成 */
.btn:hover {
  background: oklch(from var(--accent-amber1) calc(l * 1.1) c h);
}
```

### 10.4 Wide Gamut (P3) — 広色域

```css
/* P3 カラースペースでより鮮やかな色 */
@media (color-gamut: p3) {
  :root {
    --accent-amber1: oklch(0.76 0.20 70); /* 高 Chroma */
  }
}

/* フォールバック付き */
color: oklch(0.76 0.16 70);
@supports (color: color(display-p3 1 0 0)) {
  color: oklch(0.76 0.20 70);
}
```

### 10.5 @property — カラーアニメーション

```css
/* カスタムプロパティの型定義 → アニメーション可能に */
@property --hue-shift {
  syntax: '<number>';
  inherits: false;
  initial-value: 70;
}

.color-breathe {
  background: oklch(0.20 0.05 var(--hue-shift));
  animation: hue-breathe 8s ease-in-out infinite;
}

@keyframes hue-breathe {
  0%, 100% { --hue-shift: 70; }
  50% { --hue-shift: 75; }
}
/* → 微妙な色相のゆらぎで「呼吸」を表現 */
```

### 10.6 light-dark() — モード切替

```css
/* テーマに応じた色の自動切替 */
:root {
  color-scheme: dark light;
}

.element {
  color: light-dark(oklch(0.20 0.01 250), oklch(0.95 0.01 80));
  background: light-dark(oklch(0.97 0.003 80), oklch(0.13 0.005 250));
}
```

### 10.7 Tailwind v4 `@theme` ブロック

```css
/* globals.css での実際の使用例 */
@theme inline {
  --color-background: var(--bg-dark);
  --color-foreground: var(--text-base);
  --color-accent-amber1: var(--accent-amber1);
  --color-heat-subtle: var(--heat-subtle);
  --color-heat-medium: var(--heat-medium);
  --color-heat-intense: var(--heat-intense);
  /* ... */
}
```

```
@theme の役割:
  Tailwind v4 では @theme ブロック内で宣言した CSS Custom Property が
  ユーティリティクラスとして自動生成される。

  --color-accent-amber1 → text-accent-amber1, bg-accent-amber1 が使用可能
  --color-heat-medium   → text-heat-medium, bg-heat-medium が使用可能

:root vs @theme の使い分け:
  :root { }      → 純粋な CSS Custom Property（JS からも参照可能）
  @theme { }     → Tailwind ユーティリティクラス生成のトリガー
  → 両方で同じトークンを宣言し、:root の値を @theme で参照する

拡張方法:
  新しいセマンティックトークンを追加する場合:
  1. :root に --new-token: oklch(...); を追加
  2. @theme に --color-new-token: var(--new-token); を追加
  3. → bg-new-token / text-new-token が即座に使用可能

注意:
  - @theme inline → globals.css 内にインラインで定義（外部ファイル不要）
  - Tailwind v4 では tailwind.config は不要（CSS-first 設計）
  - @import "tailwindcss" の後に @theme を宣言する
```

### 10.8 accent-color / ::selection / @starting-style

```css
/* フォーム要素のアクセントカラー */
:root {
  accent-color: var(--accent-amber1);
}
/* → チェックボックス、ラジオ、レンジスライダーに琥珀が適用 */
/* → OS ネイティブ UI との一貫性を保ちつつブランドカラーを反映 */

/* テキスト選択時の色 */
::selection {
  background: oklch(from var(--accent-amber1) l c h / 0.3);
  color: var(--text-base);
}
/* → 選択時にも Pitch Black & Fire のアイデンティティを維持 */
/* → 透明度 0.3 で背景を透かし、読みやすさを確保 */

/* @starting-style — 初期表示アニメーションの色指定 */
.card {
  background: var(--bg-dark);
  transition: background 0.5s ease-out;

  @starting-style {
    background: oklch(0.10 0 0);
    /* → 要素が DOM に追加された瞬間は完全な黒 */
    /* → 0.5s かけて --bg-dark へ遷移（「闇から浮かび上がる」演出） */
  }
}
/* @starting-style は display: none → block のアニメーションにも有効 */
/* → Dialog, Popover の登場アニメーションに最適 */
```

---

## 11. Level 5 Signature Techniques

### 11.1 Color Narrative（色の物語）

```
セクション間の色彩的起承転結:

起: Hero — 漆黒の深淵（oklch 0.13, 低 Chroma）
   → 静謐、未知への入口

承: Works — 琥珀の出現（oklch 0.18, Chroma 上昇）
   → 作品が「熱」を帯びる

転: Skills — 色温度のピーク（oklch 0.20, 最高 Chroma）
   → 技術の火が燃え盛る

結: Contact — 暖かい余韻（oklch 0.16, Chroma 低下）
   → 炉の残り火、歓迎の灯

「裏切り」と「回収」の色彩版:
  起で見せた漆黒が、結では「暖かさを含んだ漆黒」に変化
  → 同じ暗さだが、旅を経て見え方が変わる
  → ユーザーの知覚が更新される
```

### 11.2 Unexpected Harmony（予測を裏切る調和）

```
安全な配色:
  漆黒 + 琥珀 + 灰 → 予測可能、Level 3

意図的な不協和:
  漆黒 + 琥珀 + 一瞬の冷たい白
  → 「白」の出現が記憶に残る
  → しかし火の中の「灰」として文脈に沿う

実装例:
  特定の Impact Point でのみ、
  通常パレットにない色を一瞬だけ使う
  → ユーザーの注意を引き、記憶に刻む
  → しかしすぐに通常のパレットに回帰
```

### 11.3 Color Breathing（色の呼吸）

```
静的な色は「死んでいる」。
Level 5 の色は「呼吸する」。

微妙なゆらぎ:
  @property --breath-chroma {
    syntax: '<number>';
    inherits: false;
    initial-value: 0.16;
  }

  .accent {
    color: oklch(0.76 var(--breath-chroma) 70);
    animation: chroma-breathe 6s ease-in-out infinite;
  }

  @keyframes chroma-breathe {
    0%, 100% { --breath-chroma: 0.16; }
    50% { --breath-chroma: 0.18; }
  }

  → 2% の Chroma 変化は意識されないが「生きている」と感じる
  → 心臓の鼓動のような、無意識に感じるリズム

パルスによる生命感:
  --heat-glow-sm の shadow-spread を微妙にアニメーション
  → CTA ボタンが「息をしている」
```

### 11.5 Portfolio-Specific Color Guidance

```
ポートフォリオサイト固有の色彩戦略:

1. 作品画像 × サイトカラーの関係
   問題: 作品画像の色がサイトパレットと衝突する
   解決:
   - 作品表示エリアは中性的な背景（slate-1/2）で分離
   - 画像周囲に oklch(0.10 0.003 250) のバッファゾーン
   - 画像の dominant color を抽出し、セクション遷移に活用（上級）

2. 色によるウェイファインディング
   セクション間の「今どこにいるか」を色で伝達:
   - Hero:    低 Chroma、最深背景 → 「入口」
   - Works:   amber 微増 → 「作品の熱」
   - Skills:  amber ピーク → 「技術の頂点」
   - Contact: amber 減衰、暖色残留 → 「出口の灯」
   → ユーザーは無意識に色でナビゲーションを感じる

3. オーバーレイ戦略
   作品画像上のテキスト表示:
   - 方法 A: グラデーションオーバーレイ
     background: linear-gradient(
       to top,
       oklch(0.13 0.005 265 / 0.9) 0%,
       oklch(0.13 0.005 265 / 0) 60%
     );
   - 方法 B: backdrop-filter
     backdrop-filter: blur(4px) brightness(0.4);
   - 方法 C: テキストシャドウのみ（最軽量）
     text-shadow: 0 2px 8px oklch(0 0 0 / 0.6);

   選択基準:
   - テキスト量が多い → 方法 A
   - 画像を見せたい → 方法 B
   - タイトルのみ → 方法 C
```

### 11.4 Chromatic Signature（色彩の署名）

```
このサイトでしか体験できない色の使い方:

Pitch Black & Fire の署名:
  1. Heat Tokens の3段階（subtle/medium/intense）
     → 琥珀の「温度」という概念
  2. 漆黒の中の glow エフェクト
     → 闇の中に浮かぶ光
  3. color-mix(in oklch, ...) による Heat Glow
     → oklch 空間での琥珀の発光

他のサイトが同じ色（琥珀 + 黒）を使っても:
  「温度」の概念 → 真似できない
  Glow の質感 → 同じに見えない
  物語構造 → 文脈が異なる
  → 色の「使い方」が署名になる
```

---

## 12. Award-Worthy Color Quality Checklist

### 6つの名前付きテスト

```
### 1. The "Feel" Test — この色は何を感じさせるか
□ 各色に感情的な意図があるか？
□ パレット全体のムードが一貫しているか？
□ 色を言葉で説明できるか？（「暖かい」「緊張する」等）
□ 色が世界観を支えているか？

### 2. The "Only Here" Test — この色の使い方はこのサイトだけか
□ 色のシステム（例: Heat Tokens）に独自性があるか？
□ 色の「使い方」が署名になっているか？
□ 同じ色を使った他のサイトと見分けがつくか？
□ Chromatic Signature が定義されているか？

### 3. The "System" Test — パレットは体系的か
□ セマンティックトークンが定義されているか？
□ 5層パレット構造が整っているか？
□ 60-30-10 ルールに基づいているか？
□ 新しい色の追加ルールが明確か？

### 4. The "Contrast" Test — アクセシビリティは確保されているか
□ すべてのテキストペアが WCAG AA を満たすか？
□ UI要素のコントラスト比は 3:1 以上か？
□ 色覚異常シミュレーションで検証したか？
□ 色のみに依存しない情報伝達か？

### 5. The "Narrative" Test — 色がストーリーを語っているか
□ セクション間の色彩遷移に意図があるか？
□ 色の起承転結が設計されているか？
□ 色の「裏切り」と「回収」があるか？
□ 色が感情のアークを支えているか？

### 6. The "Craft" Test — 細部まで色が吟味されているか
□ シャドウの色はヒュー染めされているか？
□ グラデーションは oklch 補間か？
□ ホバー/アクティブ状態の色に意図があるか？
□ 最も小さな UI 要素まで色が設計されているか？
```

---

## 13. Integration Protocols

### 13.1 From Art Direction → Color Visual Styling

```markdown
## [Color] Art Direction からの指針

### ムードキーワード
受け取る情報:
- Temperature: [Cold/Hot/Mix]
- Density: [Light/Dense/Varies]
- Tension: [Relaxed/Taut/Dynamic]

### 色彩翻訳ガイド
- 「静謐」→ 低 Chroma、深い Lightness、寒色寄り
- 「緊張」→ 高コントラスト、補色的配置、彩度の急変
- 「深淵」→ oklch L: 0.10-0.15、微妙な色相差での深度
- 「熱」→ 琥珀域 Hue 60-80、Chroma 0.12-0.20
- 「余韻」→ Chroma の漸減、Lightness の微増

### Signature Moment への色彩貢献
[art-direction が定義した Signature Moment に対する色彩的な演出案]

### 禁止事項
- art-direction の意図を逸脱する派手な色使い
- ムードに合わない彩度の追加
```

### 13.2 To Frontend Dev

```markdown
## [Frontend] カラートークン仕様

### CSS Custom Properties
--[token-name]: [oklch value];
--[token-name]-hover: [oklch value];
--[token-name]-active: [oklch value];

### Gradient Definitions
background: linear-gradient(in oklch, [stops]);

### Surface Specifications
- background: [value]
- backdrop-filter: [value]
- border: [value]
- box-shadow: [value]

### Dark/Light Mode Values
:root { --token: [dark value]; }
:root[data-theme="light"] { --token: [light value]; }

### Performance Notes
- backdrop-filter の使用箇所と制限
- will-change が必要な要素
- P3 フォールバック戦略
```

### 13.3 To WebGL/Shader

```markdown
## [Shader] カラー指定

### GLSL Uniform 色指定
uniform vec3 u_colorBase;    // oklch → linear RGB 変換済み
uniform vec3 u_colorAccent;  // [R, G, B] 0.0-1.0
uniform float u_colorMix;    // ブレンド比率

### Color Palette for Shader
const vec3 COLOR_ABYSS  = vec3(0.07, 0.07, 0.09);  // 深淵
const vec3 COLOR_EMBER   = vec3(0.85, 0.55, 0.15);  // 琥珀
const vec3 COLOR_ASH     = vec3(0.60, 0.58, 0.56);  // 灰

### カラー遷移パラメータ
- mix() のイージング関数
- smoothstep() の閾値
- セクション遷移時の色変化速度

### 注意事項
- sRGB → Linear RGB 変換を忘れない
- HDR ディスプレイ対応時は P3 出力を検討
```

### 13.4 With Typography

```markdown
## [Typography] 色×タイポグラフィ協調

### テキスト色の階層
- Display: --text-base (最高コントラスト)
- Body: --text-base-90 (読みやすさ)
- Caption: --text-muted (控えめ)
- Accent: --accent-amber1 (注目)

### 色で作る視覚的階層
- Weight × Color の組み合わせでダブル階層化
- 大きなテキストは opacity で階層を作る
- 小さなテキストは color-mix で階層を作る

### アクセシビリティ注意点
- テキストサイズ別の最低コントラスト比
- --text-muted の使用箇所制限（16px以上推奨）
```

### 13.5 With Motion Design

```markdown
## [Motion] 色彩遷移×モーションタイミング協調

### 色変化のタイミング原則
- 色の変化は動きに「乗せる」
- 動きなしの色変化は不自然に見える
- 色変化の duration は動きの 1.2-1.5 倍

### セクション遷移の色彩タイミング
Phase 1 (予感):     色温度が微かに変化 (0-200ms)
Phase 2 (遷移中):   新セクションの色が浸透 (200-600ms)
Phase 3 (着地):     色が安定、微細な調整 (600-900ms)

### 共有タイムライン
- motion-design の Stagger Pattern と色変化を同期
- 色の「呼吸」アニメーションと motion の「間」を合わせる
```

### 13.6 From Motion Design Protocol

```markdown
## [Color] Motion Design からの受信テンプレート

motion-design が色変化を伴うモーションを設計する場合、
以下のパラメータを color-visual-styling に送信する:

### 受信パラメータ
| パラメータ | 説明 | 例 |
|-----------|------|-----|
| duration | 色変化の全体時間 | 800ms |
| easing | 色変化のイージング | cubic-bezier(0.33, 1, 0.68, 1) |
| from_state | 開始時の色状態 | --bg-dark |
| to_state | 終了時の色状態 | --heat-medium |
| trigger | 発火条件 | scroll-enter / hover / click |
| delay | 色変化の開始遅延 | 200ms（動きの後追い） |

### 色変化品質の確認事項
- duration が短すぎると色のフリッカーが発生（最低 150ms）
- easing が linear だと色変化が機械的に見える
- 色変化は動きの duration × 1.2-1.5 倍を推奨
- oklch 空間での補間は Chroma dip に注意（§6.2 参照）

### 拒否すべきリクエスト
- 100ms 以下の色変化（知覚できない or フリッカー）
- 3色以上の連続変化（認知負荷が高すぎる）
- アクセシビリティ基準を下回るコントラスト状態への遷移
```

---

## 14. Status Report Format

```markdown
## Color Visual Styling ステータス

### Excellence Level
- 現在: Level [1-5]
- 目標: Level 5

### Color System
- パレット定義: [確定/検討中/未着手]
- セマンティックトークン: [確定/検討中/未着手]
- Heat Tokens: [確定/検討中/未着手]

### Gradients & Effects
- グラデーション設計: [確定/検討中/未着手]
- サーフェスマテリアル: [確定/検討中/未着手]
- Glass/Blur 効果: [確定/検討中/未着手]

### Accessibility
- WCAG AA 準拠: [Pass/Fail/未検証]
- APCA 検証: [Pass/Fail/未検証]
- 色覚シミュレーション: [Pass/Fail/未検証]

### Quality Checklist
- "Feel" Test: [Pass/Fail]
- "Only Here" Test: [Pass/Fail]
- "System" Test: [Pass/Fail]
- "Contrast" Test: [Pass/Fail]
- "Narrative" Test: [Pass/Fail]
- "Craft" Test: [Pass/Fail]

### Decisions Needed
- [決定待ち事項]

### Team Handoffs
- From Art Direction: [ステータス]
- To Frontend Dev: [ステータス]
- To WebGL/Shader: [ステータス]
- With Typography: [ステータス]
- With Motion Design: [ステータス]
```

### 14.1 Pitch Black & Fire 実装ステータス

```
現在のカラートークン oklch 参考値:

| Token | 参照元 | oklch 近似値 | 役割 |
|-------|--------|-------------|------|
| --bg-dark (slate-1) | Radix slate-dark 1 | oklch(0.13 0.005 265) | 最深背景 |
| --bg-darker (slate-2) | Radix slate-dark 2 | oklch(0.16 0.007 265) | ネスト背景 |
| --text-base (slate-12) | Radix slate-dark 12 | oklch(0.96 0.005 265) | 本文テキスト |
| --text-muted (slate-11) | Radix slate-dark 11 | oklch(0.78 0.012 260) | 補助テキスト |
| --accent-amber1 (amber-9) | Radix amber-dark 9 | oklch(0.76 0.16 70) | プライマリアクセント |
| --accent-amber2 (amber-10) | Radix amber-dark 10 | oklch(0.80 0.14 70) | セカンダリアクセント |

コントラスト比（参考）:
| ペア | WCAG 2.1 比 | APCA Lc | 判定 |
|------|------------|---------|------|
| slate-12 on slate-1 | ~15.4:1 | Lc ~106 | AAA ✓ |
| slate-11 on slate-1 | ~7.3:1 | Lc ~78 | AA ✓ |
| amber-9 on slate-1 | ~5.8:1 | Lc ~65 | AA ✓（大テキスト推奨） |
| amber-10 on slate-1 | ~6.8:1 | Lc ~72 | AA ✓ |

注意:
  - 上記 oklch 値は Radix 実値からの近似。実装時は DevTools で実測推奨
  - amber-9 をテキストに使う場合は 18px+ bold / 24px+ を推奨
  - heat-subtle (30% 混合) はテキスト用途禁止（コントラスト不足）
```

### 14.2 Codebase Color Reality Map

```
コードベースには 6つの異なる色戦略 が共存している。
新しいコンポーネントに色を付ける前に、まずこの地図で現状を把握する。

━━━ Component → Strategy 対応表 ━━━

| コンポーネント | Strategy | default 色 | hover 色 | 根拠 |
|--------------|----------|-----------|---------|------|
| GlowButton | S1: Amber Full | amber-9 + glow | glow ×1.5 | ページ唯一の CTA |
| ShaderButton | S1: Amber Full | amber-9 + glow | glow intensity 増 | Hero の主要アクション |
| Contact form inputs | S2: Amber Hint | border --text-base-20 | border --text-base-40 | フォーカス時のみ amber |
| ContactClient success | S2: Amber Hint | (状態変化後) | amber-9 + glow 出現 | 成功＝火が灯るメタファー |
| ErrorDisplay button | S3: Amber Recovery | muted text + border | border amber-9/60, text amber | リカバリ行動を促す |
| Nav links | S4: Opacity Gradient | text-muted | text-base opacity:1 | テキスト階層の表現 |
| SectionNav indicators | S4: Opacity Gradient | opacity 低 | opacity:1 | 現在位置の表現 |
| SkillsSections tags | S5: White Opacity | border-white/12 bg-white/6 | border-white/20 bg-white/10 | グループ化メタ情報 |
| Profile tags | S5: White Opacity | border-white/10 bg-white/5 | border-white/18 bg-white/8 | 装飾的タグ |
| WorksSection cards | S5: White Opacity | border-white/8 | border-white/15 | カード境界 |
| Archive items | S6: Minimal Surface | bg-transparent | bg-white/[0.02] | リストの背景的要素 |
| Footer links | S6: Minimal Surface | text-muted | text-base-60 | 最低主張度 |
| ScrollProgress bar | S1: Amber Full | amber-9 | (N/A: 進捗表示) | 常時視認が必要 |

━━━ globals.css Token → Strategy 対応表 ━━━

| Token | 使用 Strategy | 用途 |
|-------|-------------|------|
| --accent-amber1 (amber-9) | S1, S2, S3 | 琥珀の直接使用（CTA, focus, recovery） |
| --accent-amber2 (amber-10) | S1 | ホバー時の強調 |
| --text-base | S4 | 不透明度変化のベース |
| --text-muted | S3, S4 | デフォルト状態の控えめテキスト |
| --bg-overlay-5/10/20 | S5 | 表面レイヤーのベース |
| --heat-subtle/medium/intense | S1 | glow エフェクトの段階 |
| --shadow-glow-sm/md/lg | S1 | 発光シャドウ |

━━━ white/ Opacity スケール標準化 ━━━

コードベースで使用中の white/X 値を整理し、推奨スケールを定義:

| 用途 | 実態値 | 推奨標準 | Strategy |
|------|--------|---------|----------|
| 極微ホバー bg | white/[0.02] | white/[0.02] | S6 |
| 最薄 bg | white/5 | white/5 | S5 |
| 薄い bg | white/6-8 | white/6 | S5 |
| 中間 bg | white/10 | white/10 | S5 hover |
| 最薄 border | white/8-10 | white/10 | S5 |
| 標準 border | white/12 | white/12 | S5 |
| hover border | white/15-20 | white/20 | S5 hover |
| 強調 border | white/25 | white/25 | S5 focus |

推奨: 新規コンポーネントでは上記標準値を使用する。
既存の微差（white/8 vs white/10 等）は視覚的に区別困難なため、
新規追加時に標準値へ寄せることを推奨（既存の変更は不要）。
```

---

## 15. Anti-Patterns

### Generic Patterns（Level 1-2 に留まる原因）

| 避ける | 代わりに | 参照 |
|--------|---------|------|
| **根拠なき色選択**: 「なんとなくこの色」で決める | §5.5 の判定フローで Strategy を特定してから色を選ぶ | §5.5 Q1-Q2 |
| **sRGB のみの思考**: HSL でパレット生成 | oklch でパレット生成、知覚均一性を保証 | §4.2, §5.3 |
| **コントラスト無視**: 美しさ優先 | 実装前に WCAG AA 検証、APCA Lc 値を確認 | §9.1, §9.2 |
| **黒いシャドウ**: `rgba(0,0,0,0.3)` | `color-mix(in oklch, var(--bg-dark) 80%, transparent)` | §7.1 |
| **グラデーションの濁り**: sRGB 補間 | `linear-gradient(in oklch, ...)` で知覚的に正確な補間 | §6.2 |
| **テーマ設計の欠如**: 色を反転するだけ | 明度ベースの深度レイヤー設計（Layer 0-3） | §8.1 |
| **amber を根拠なく使う**: 「アクセントだから amber」 | §5.5 Q2 で琥珀の要否を判定。S4-S6 は amber を使わない | §5.5 |

### Stagnation Patterns（Level 3-4 に留まる原因）

| 避ける | 代わりに | 参照 |
|--------|---------|------|
| **安全な配色に固執**: 見たことがある配色 | 予測を裏切るハーモニーを1箇所導入 | §11.2 |
| **技術的正しさに満足**: oklch を使うだけ | Color Narrative（起承転結）を設計 | §11.1 |
| **物語の欠如**: セクション間に意図がない | セクション別の色温度マップを定義 | §11.1 |
| **呼吸の欠如**: すべてが静的 | @property で微妙な Chroma/Hue のゆらぎ | §11.3, §10.5 |
| **署名の欠如**: 他と区別できない | Chromatic Signature を定義 | §11.4 |
| **制約の回避**: a11y を障害と見なす | 制約を創造性の触媒に変換 | §9.2 |
| **一方向のハンドオフ**: 受け取るだけ | 色彩視点からのフィードバックを返す | §13.1 |
| **Strategy 無視**: 全コンポーネント同じ色処理 | §14.2 Reality Map で現状を確認してから着手 | §14.2 |

### 15.1 Semantic Color Guide

```
セマンティック色の決定表:
琥珀ベースのデザインシステムにおける意味的色彩の定義。

| 意味 | 色 | oklch 値 | 根拠 |
|------|-----|---------|------|
| success | amber-9 | oklch(0.76 0.16 70) | 火が灯る＝成功。ブランドカラーと一致 |
| error | red | oklch(0.63 0.22 25) | 普遍的な危険シグナル。amber と色相差 45° |
| warning | amber-11 寄り | oklch(0.68 0.12 70) | amber の低明度版。success より控えめ |
| info | slate-11 | oklch(0.78 0.012 260) | 中性的。感情を持たない情報 |
| disabled | 任意色 + opacity 0.4 | 元色の opacity 40% | Strategy 共通。色相を変えず不透明度で表現 |

判断ルール:
  - success に緑を使わない → amber が「成功の灯」として機能する
  - error は amber と十分な色相差（≥40°）を確保 → 混同を防止
  - disabled は色相を変えず opacity で表現 → どの Strategy でも一貫
  - warning と success の区別 → 明度差で表現（success L:0.76, warning L:0.68）
```

---

## 16. Excellence Reminder

```
Level 5 カラーデザインの問い:

「この色は何を語っているか？」
「この色の使い方は、このサイトでしか見られないか？」
「色を消してグレースケールにしても、情報は伝わるか？」
「色がユーザーの感情のアークを支えているか？」
「1年後もこの配色を誇れるか？」

色は言語。
パレットは文法。
Level 5 は「色で物語を紡ぐ」こと。

妥協は Level 4 の始まり。
「技術的に正しい」は Level 3 の終わり。
Level 5 は「このサイトの色を忘れられない」の先にある。
```
