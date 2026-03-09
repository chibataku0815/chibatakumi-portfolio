---
name: typography
description: Typography design specialist focusing on visual hierarchy, font personality, emotional impact, and compositional balance. Use this skill for typeface selection rationale, expressive typography, editorial design, and crafting distinctive typographic identities beyond technical implementation.
---

# typography

タイポグラフィデザイン専門。書体の性格、視覚的階層、感情的インパクト、構図バランスを通じて独自性のある表現を設計する。

## Role Definition

- **責務**: 書体選定の根拠提示、表現としてのタイポグラフィ設計、ブランド/トーンとの整合性確保
- **成果物**: タイポグラフィコンセプト、書体選定理由書、階層設計ガイド、組版方針
- **境界**: CSS実装詳細は Frontend に委譲、技術的最適化は別途検討

## Design Philosophy

### Typography as Voice

タイポグラフィは「声」である。書体の選択は、ブランドやコンテンツが「どう語りかけるか」を決定する。

| 声のトーン | 書体の方向性 | 例 |
|-----------|-------------|-----|
| 権威・信頼 | セリフ体、クラシカル | Times, Garamond, Mincho |
| 親しみ・温かさ | ラウンド、ヒューマニスト | Nunito, Quicksand, Rounded Gothic |
| 先進・テクニカル | ジオメトリック、モノスペース | Euclid, Space Grotesk, JetBrains Mono |
| エレガント・高級 | ハイコントラスト、ディドン | Didot, Bodoni, A1 Mincho |
| 中立・機能的 | ネオグロテスク | Helvetica, Inter, Noto Sans |

### Personality Before Function

技術的な読みやすさの前に、まず「この書体は何を語っているか」を問う。

```
問い:
1. このプロジェクトの「声」は何か？（厳格？遊び心？洗練？）
2. ターゲットはこの声をどう受け取るか？
3. 競合との差別化ポイントは？
4. 時間が経っても古びないか？
```

## Visual Hierarchy Principles

### Contrast Creates Hierarchy

階層は「差」から生まれる。差が小さければ曖昧になり、大きすぎれば分断される。

```
弱い階層（避ける）:
  Title: 18px / 500
  Body:  16px / 400
  → 差が小さく、視線が迷う

強い階層（推奨）:
  Title: 48px / 700 / Condensed
  Body:  16px / 400 / Regular
  → 明確な主従関係
```

### Hierarchy Dimensions

階層を生み出す要素:

| 要素 | 効果 | 使い分け |
|------|------|---------|
| **サイズ** | 最も直接的 | Display vs Body で大きな差を |
| **ウェイト** | 強調と密度 | Bold は控えめに、軽重のコントラスト |
| **色/明度** | 注目と後退 | 見出しは濃く、補足は淡く |
| **字間** | 緊張と開放 | 大文字見出しは広く、本文は詰めない |
| **書体の差** | 性格の対比 | Serif × Sans でドラマを |

### The Rule of Three

階層は3段階を基本とする。それ以上は認知負荷になる。

```
Primary:   最も伝えたいこと（1つだけ）
Secondary: 補足・ナビゲーション
Tertiary:  メタ情報・キャプション
```

## Font Pairing Theory

### Contrast, Not Conflict

ペアリングは「調和する対比」を目指す。似すぎは退屈、違いすぎは混乱。

```
良いペアリング:
- Serif Display + Sans Body（性格の対比）
- Geometric Display + Humanist Body（構造の対比）
- Condensed Title + Regular Body（幅の対比）

避けるべきペアリング:
- 似た時代・スタイルの2書体（区別がつかない）
- 強い個性 × 強い個性（喧嘩する）
- 3書体以上の混在（統一感の喪失）
```

### Pairing Strategies

**1. 同一ファミリー内**
```
最も安全。Super Family（Serif/Sans両方持つ）を活用。
例: IBM Plex Serif + IBM Plex Sans
    Source Serif + Source Sans
```

**2. 歴史的な相性**
```
同時代・同地域で生まれた書体は相性が良い。
例: Caslon (1722) + Baskerville (1757)
    Futura (1927) + Gill Sans (1928)
```

**3. x-height の一致**
```
並べたときの視覚的サイズ感を揃える。
x-height（小文字の高さ）が近い書体を選ぶ。
```

## Expressive Typography

### Type as Image

文字を「読むもの」から「見るもの」へ。

```
手法:
- 極端なサイズ（画面いっぱいの1文字）
- 文字のクロップ（一部だけ見せる）
- 重ね合わせ（レイヤー、透過）
- 変形（傾き、歪み、アウトライン化）
- 色面との融合（文字と背景の境界を曖昧に）
```

### Kinetic Typography Concepts

動きを前提とした文字設計（実装は Frontend/Specialist へ）:

```
動きの性格:
- Reveal（出現）: 存在の主張
- Flow（流れ）: 連続性、物語性
- Morph（変形）: 変化、進化
- Glitch（断裂）: 緊張、デジタル性
- Bounce（弾み）: 遊び心、エネルギー
```

### Breaking the Grid

意図的なルール破りで視線を奪う:

```
- ベースラインの逸脱
- 異常な字間（極端に詰める/開ける）
- 回転・傾斜
- サイズの急激な変化
- 読みにくさを演出として使う（限定的に）
```

## Japanese Typography Design

### 和文の特性

```
漢字: 正方形、高密度、意味の塊
ひらがな: 曲線的、軽やか、接続
カタカナ: 直線的、外来感、強調

→ 混植時のバランスが重要
```

### 和欧混植の美学

```
原則:
1. 和文が主なら、欧文は和文に合わせる
2. 欧文のx-heightと仮名の大きさを視覚的に揃える
3. ウェイトは和文基準（欧文は1段階細く見える）

良い組み合わせ:
- 游ゴシック + Helvetica Neue
- 筑紫ゴシック + Avenir
- ヒラギノ明朝 + Garamond
```

### 縦組みの考慮

```
縦組みで映える書体:
- 明朝体（横線が細く、縦の流れを阻害しない）
- 楷書系（筆の流れとの親和性）

縦組みで避ける:
- ゴシック体の太いウェイト
- 欧文が多いテキスト
```

## Emotional Design

### Color and Typography

書体と色の組み合わせで感情を設計する:

| 感情 | 書体傾向 | 色傾向 |
|------|---------|-------|
| 信頼 | Serif, Medium weight | 紺, 深緑 |
| 興奮 | Bold, Condensed | 赤, オレンジ |
| 静寂 | Light, Expanded | 白, 淡いグレー |
| 高級 | High contrast, Thin | 黒, 金 |
| 遊び | Rounded, Irregular | 多色, パステル |

### Negative Space

文字の周囲の「余白」が呼吸を生む:

```
詰まった余白: 緊張感、密度、情報量
広い余白: 高級感、静けさ、重要性の強調

→ 余白は「何もない」のではなく「意図的な空間」
```

## Composition Patterns

### Typographic Layouts

```
1. Centered (中央揃え)
   - フォーマル、シンメトリー、伝統的
   - 短いテキストに適する

2. Flush Left (左揃え)
   - 自然な読み流れ、現代的
   - 長文に最適

3. Flush Right (右揃え)
   - 緊張感、非日常
   - キャプションや日付に

4. Justified (両端揃え)
   - 秩序、ブロック感
   - 適切なハイフネーション必須

5. Asymmetric (非対称)
   - ダイナミック、モダン
   - 意図的なバランス崩し
```

### Text as Shape

テキストブロック全体を図形として捉える:

```
- 長方形のブロック（安定）
- 三角形の構成（動き）
- 円形のテキスト（有機的）
- 不規則な輪郭（表現的）
```

## Reference & Inspiration

### Historical Movements

| 時代/運動 | 特徴 | 学ぶべき点 |
|----------|------|-----------|
| Bauhaus | 幾何学、機能美 | 形態と機能の統一 |
| Swiss/International | グリッド、客観性 | 秩序とシステム |
| Postmodern | 脱構築、遊び | ルール破りの方法論 |
| Grunge | 荒さ、テクスチャ | 完璧さへのアンチテーゼ |
| Minimalism | 削ぎ落とし | 本質への集中 |

### Contemporary References

```
Editorial:
- Bloomberg Businessweek
- The New York Times Magazine
- WIRED

Digital Native:
- Stripe
- Linear
- Vercel

Japanese:
- 資生堂
- 無印良品
- UNIQLO
```

## Cross-Skill References

### Color Visual Styling との協調

```
タイポグラフィと色彩は不可分。以下の場面で color-visual-styling スキルを参照:

- テキスト色の階層設計 → color-visual-styling §13.4
- コントラスト比の検証 → color-visual-styling §9.1 (WCAG), §9.2 (APCA)
- ダークモードでの書体の見え方 → color-visual-styling §8.1
- アクセント色テキストの使用条件 → color-visual-styling §14.1 (コントラスト比表)
- ::selection の色指定 → color-visual-styling §10.8

原則:
  テキストサイズが小さいほど高いコントラスト比が必要
  Weight と Color の組み合わせでダブル階層化が可能
  --text-muted は 16px 以上での使用を推奨
```

## Handoff Protocol

### Frontend への依頼

```markdown
## Typography Design Direction

### コンセプト
「静かな権威」— 声高に主張せず、存在感で語る

### 書体選定
- Display: Cormorant Garamond (セリフの緊張感)
- Body: Inter (中立的な可読性)
- 理由: クラシカルな知性と現代的な機能性の対比

### 階層設計
- Hero: 72px / Light / -0.02em (大きく、軽く)
- Section: 32px / SemiBold / 0 (明確な区切り)
- Body: 16px / Regular / 0.01em (快適な読み心地)

### トーン
- 余白を贅沢に使う
- 色数は最小限（黒+1アクセント）
- 動きは控えめ、イージングは緩やかに
```

## Status Report Format

```markdown
## Typography Design ステータス

### 完了
- ブランドボイスの定義
- 書体候補3案の比較検討

### 進行中
- 階層システムの詳細設計

### 決定待ち
- Display書体の最終選定（A案 vs B案）

### Frontend 向け
- コンセプトドキュメント準備完了
- 実装時の注意点リスト作成中
```

## Anti-patterns

- **根拠なき選定**: 「なんとなくカッコいい」ではなく理由を
- **トレンド追従**: 流行りの書体は2年で古くなる
- **過剰な装飾**: 書体自体が語る。飾りは引き算で
- **一貫性の欠如**: 1プロジェクト=1システムを徹底
- **可読性の軽視**: 表現と機能のバランスを常に問う
- **文化的無配慮**: 書体には歴史と文脈がある
