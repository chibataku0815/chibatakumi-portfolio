---
name: motion-design
description: Motion graphics specialist focusing on animation artistry, timing choreography, and kinetic storytelling. Use this skill for transition design, motion rhythm, emotional pacing, and transforming technical animation into expressive visual experiences. Bridges frontend-dev and webgl-shader with artistic intent.
---

# motion-design

モーションデザイン専門。アニメーションの芸術性、タイミングの振り付け、動きによるストーリーテリングを設計する。

## Role Definition

- **責務**: トランジション設計、モーションリズム、感情的ペーシング、キネティックタイポグラフィ
- **成果物**: モーション指針、タイミングチャート、トランジション設計、アニメーションストーリーボード
- **境界**: GSAP/CSS実装は Frontend、WebGL/シェーダーは Specialist に委譲

## Philosophy: Motion as Meaning

動きは「効果」ではなく「意味」を伝える。

```
効果的思考（避ける）:
  「ここにフェードインを入れよう」
  「このボタンをバウンスさせよう」
  → 無意味な動き、注意散漫

意味的思考（推奨）:
  「この登場は"静かな確信"を表現する」
  「この遷移は"次への期待"を作る」
  → 感情を運ぶ動き、記憶に残る
```

## The 12 Principles (Disney + Digital)

クラシックアニメーションの12原則をデジタルに応用:

### 1. Squash and Stretch → Scale and Morph

```
物理的な伸縮 → デジタルな変形

Applications:
- ボタンホバー: 微細なスケール変化 (1.0 → 1.02)
- モーダル登場: 中心から外への拡大
- エラー: 軽い横揺れ

注意:
- 過剰な変形は安っぽい
- 微細さが高級感を生む
```

### 2. Anticipation → Preparation Cues

```
動作前の予備動作 → デジタルでの予感

Applications:
- ホバー前の微妙な光の変化
- クリック前の要素の「引き」
- スクロール前のインジケーター

Pitch Black & Fire:
  クリック → 0.1秒前にアンバーの微細な glow
  → 「何かが起きる」予感
```

### 3. Staging → Visual Hierarchy in Time

```
何に注目させるか → 時間軸での階層

Applications:
- 最重要要素が最初に動く
- 二次要素は遅れて追従
- 背景は最も控えめに

Sequence Example:
  T+0.0s: Title appears
  T+0.3s: Subtitle fades in
  T+0.5s: Background subtly shifts
```

### 4. Straight Ahead / Pose to Pose → Scripted vs Emergent

```
逐次アニメ vs キーフレーム → 計画的 vs 創発的

Scripted Motion:
- 予測可能、安定
- ナビゲーション、UI要素

Emergent Motion:
- 予測不能、生命感
- パーティクル、背景効果
- webgl-shader との連携領域
```

### 5. Follow Through / Overlapping → Secondary Motion

```
慣性による余韻 → 二次的な動き

Applications:
- メインカードが動いた後、影が追従
- テキストが停止した後、アンダーラインが滑り込む
- パネル遷移後、背景グラデーションが落ち着く

Timing:
  Main: 0.0 → 0.6s
  Secondary: 0.1 → 0.8s (少し遅れて、少し長い)
```

### 6. Slow In / Slow Out → Easing

```
緩急 → イージング関数

Easing Personality:

ease-out (power2.out):
  素早く始まり、優雅に終わる
  → 登場、確信に満ちた動き

ease-in (power2.in):
  ゆっくり始まり、急いで去る
  → 退場、消えゆくもの

ease-in-out (power2.inOut):
  滑らかに始まり終わる
  → 移動、状態変化

custom (expo, elastic):
  性格付け
  → 特別な瞬間のみ使用
```

### 7. Arc → Curved Motion Paths

```
直線ではなく弧 → 自然な動き

Linear (機械的):
  A ───────────→ B

Arc (有機的):
  A ╭──────────╮
    │          │
    ╰──────────╯ B

Applications:
- フローティング要素
- ドラッグ＆ドロップ
- 視線誘導の補助

注意:
- UIナビゲーションは直線が適切
- 弧は演出的な動きに限定
```

### 8. Secondary Action → Supporting Motion

```
主動作を支える副動作

Primary: カードの展開
Secondary:
  - 周囲のカードが少し避ける
  - 影が伸びる
  - 背景が微かに暗くなる

→ 主役を引き立てる脇役の動き
```

### 9. Timing → Duration and Tempo

```
時間設計の基本:

Duration Guide (Pitch Black & Fire):
  Micro (hover, feedback): 150-250ms
  Small (button, toggle): 250-400ms
  Medium (panel, modal): 400-600ms
  Large (page, section): 600-1000ms
  Dramatic (hero, transition): 800-1500ms

Tempo:
  Fast tempo = 緊張、エネルギー
  Slow tempo = 高級、落ち着き

  Pitch Black & Fire → Slow tempo 基調
    (ただし、アクセントとしての fast を配置)
```

### 10. Exaggeration → Emphasis

```
誇張 → 強調（控えめに）

デジタルでの誇張:
- 通常: 1.0 → 1.02 のスケール
- 誇張: 1.0 → 1.05 のスケール（限定的に）

使用場面:
- エラー状態
- 重要な達成
- 注意喚起

注意:
- 常時使用は効果を殺す
- 特別な瞬間に限定
```

### 11. Solid Drawing → Consistent Visual Language

```
一貫した視覚言語

モーションの文法:
- 登場は常に下から上 + fade
- 退場は常に上へ + fade
- 強調は常に scale + glow

→ ユーザーは動きのパターンを学習する
→ 一貫性が予測可能性を生む
→ 予測可能性が心地よさを生む
```

### 12. Appeal → Aesthetic Quality

```
魅力 → 美的品質

技術的に正しくても魅力がない動き:
- 機械的すぎる
- 予測可能すぎる
- 個性がない

魅力のある動き:
- 微細な不規則性
- 意外な瞬間
- 一貫した性格

Pitch Black & Fire の動きの性格:
  「静かな自信」
  - 急がない
  - 過剰に主張しない
  - しかし存在感がある
```

## Motion Rhythm

### Tempo and Beat

```
サイト全体のリズム設計:

Beat: 基本単位 (例: 200ms)

Rhythm Pattern:
  ○ ○ ○ ○  →  ● ○ ○ ○  →  ○ ● ○ ○  →  ...
  (静) (静)    (動) (静)    (静) (動)

Polyrhythm:
  Layer 1: ● ○ ○ ● ○ ○  (メイン要素: 3拍子)
  Layer 2: ● ○ ● ○ ● ○  (副要素: 2拍子)
  → 複雑さと深み
```

### Silence is Motion

```
動きの「間」:

連続した動き:
  ●●●●●●●●  → 疲れる、安っぽい

間のある動き:
  ●○○●○○●○  → 呼吸、高級感

Pitch Black & Fire:
  動きの後に必ず「沈黙」を
  → 余韻 = 価値
```

### Stagger Patterns

```
複数要素の時間差:

Linear Stagger:
  Element 1: |████        |
  Element 2: |  ████      |
  Element 3: |    ████    |
  → 均等、予測可能

Eased Stagger:
  Element 1: |████        |
  Element 2: | ████       |
  Element 3: |  ████      |
  → 最初が密、後が疎

Grouped Stagger:
  Group A: |████         |
  Group A: | ████        |
  (pause)
  Group B: |     ████    |
  Group B: |      ████   |
  → 意味のまとまり
```

## Transition Design

### Transition Types

```
1. Cut (カット)
   即座の切り替え
   → 関連性の低いコンテンツ間

2. Dissolve (ディゾルブ)
   クロスフェード
   → 関連性のあるコンテンツ間

3. Wipe (ワイプ)
   方向性のある遷移
   → シーケンシャルなナビゲーション

4. Morph (モーフ)
   要素の変形
   → 同一要素の状態変化

5. Shared Element
   要素を保持した遷移
   → カードからディテールへ
```

### For Pitch Black & Fire

```
推奨トランジション:

Hero → Works:
  - Dissolve + Subtle scale down
  - 2-3秒かけてゆっくり
  - 「沈んでいく」感覚

Works Panel → Panel:
  - Wipe (horizontal)
  - トランジションライン
  - 「ページをめくる」感覚

Works → Contact:
  - Dissolve + Light emergence
  - アンバーが一瞬強まる
  - 「終わりと始まり」の感覚
```

### Micro-Transitions

```
小さな状態変化:

Hover:
  - opacity: 1 → 0.8 (100ms)
  - transform: none → translateY(-2px) (150ms)
  - 影の subtle な変化

Focus:
  - outline 代わりの glow
  - scale: 1 → 1.02 (150ms)

Active:
  - scale: 1 → 0.98 (50ms)
  - 「押し込み」の感触

Disabled:
  - opacity: 1 → 0.4
  - grayscale filter
```

## Kinetic Typography

### Text as Motion

```
文字を動かす原則:

1. Character Level (文字単位)
   - 一文字ずつ reveal
   - 文字が主役の時のみ

2. Word Level (単語単位)
   - 意味の塊で reveal
   - より読みやすい

3. Line Level (行単位)
   - 行ごとに reveal
   - 長文に適切

4. Block Level (ブロック単位)
   - 段落/セクションで reveal
   - 最も控えめ
```

### For Hero Text

```
Pitch Black & Fire Hero:

Character Reveal with Blur:
  Initial: opacity 0, blur 8px, y +16px
  Final: opacity 1, blur 0px, y 0px
  Duration: 35ms/char stagger
  Easing: power2.out

Philosophy:
  - 「霧の中から現れる」
  - 急がない reveal
  - 完了後の余韻
```

### Text Interaction

```
インタラクティブテキスト:

Hover on Word:
  - 単語全体が反応（文字単位は過剰）
  - 色の変化 or 微細な動き
  - 意味の強調

Scroll-linked:
  - スクロールに連動した reveal
  - 視線を導く
  - 読む速度に合わせる
```

## Emotional Motion

### Motion and Emotion

```
動きと感情のマッピング:

Slow + Smooth = 落ち着き、高級
Fast + Bouncy = 楽しさ、遊び
Slow + Heavy = 重厚、権威
Fast + Sharp = 緊張、アラート

Pitch Black & Fire:
  Base: Slow + Smooth (高級感、深み)
  Accent: Medium + Smooth (注目、活性)
  Alert: Fast + Sharp (限定使用)
```

### Building Tension

```
緊張の構築:

Slow build:
  - 徐々に速度を上げる
  - 要素を徐々に近づける
  - 色を徐々に濃くする

Release:
  - 突然の解放
  - 新しい要素の登場
  - 色/形の急変

Example (Works Section):
  0-70%: 文字がゆっくり reveal (build)
  70-90%: 最後の数文字が加速 (tension)
  90-100%: 完了 + 一瞬の pause + 次への遷移 (release)
```

### Breathing Room

```
動きの「呼吸」:

Inhale (吸気):
  - 要素が近づく
  - 色が濃くなる
  - スケールが上がる

Hold (保持):
  - 静止の瞬間
  - 最も緊張が高い

Exhale (呼気):
  - 要素が離れる
  - 色が薄くなる
  - スケールが下がる

→ サイト全体がゆっくり「呼吸」している感覚
```

## Scroll-Driven Motion

### Scroll as Input

```
スクロールを入力として:

Discrete (離散的):
  - セクションごとに独立
  - snap points で区切り
  - 明確な「章」

Continuous (連続的):
  - スクロール量に連動
  - scrub animation
  - 流れるような体験

Hybrid (ハイブリッド):
  - 基本は continuous
  - 重要ポイントで discrete に切り替え
```

### Scroll-Linked Animation Design

```
スクロール連動アニメーションの設計:

Progress Mapping:
  0% scroll → Initial state
  50% scroll → Transition state
  100% scroll → Final state

Danger Zone:
  - すべてをスクロール連動にしない
  - 重要な要素は独立したタイミングで
  - スクロール速度の違いに対応
```

## Performance Considerations

### Motion Budget

```
動きの予算:

Simultaneous Animations:
  - 同時に動く要素は 3-5 以下
  - それ以上は混乱を招く

Animation Properties:
  Cheap (GPU):
    - transform (translate, scale, rotate)
    - opacity

  Expensive (CPU):
    - width, height
    - margin, padding
    - filter (blur など)

Rule:
  - 可能な限り transform + opacity
  - filter は限定的に
  - レイアウトを動かさない
```

### Reduced Motion

```
アクセシビリティ:

@media (prefers-reduced-motion: reduce) {
  - アニメーションを簡素化
  - 必要最小限に
  - 意味は維持、動きは削減
}

代替:
  - fade のみにする
  - duration を短縮
  - parallax を無効化
```

## Handoff Protocol

### To Frontend Team

```markdown
## [Frontend] モーション指針

### Global Timing
- Base duration: [ms]
- Easing: [function]
- Stagger interval: [ms]

### Element Choreography
[要素名]:
  - Initial: [state]
  - Final: [state]
  - Duration: [ms]
  - Easing: [function]
  - Trigger: [scroll/load/interaction]

### Transitions
[Source] → [Destination]:
  - Type: [cut/dissolve/wipe/morph]
  - Duration: [ms]
  - Key moments: [description]

### Emotional Intent
[セクション名]:
  - Mood: [feeling]
  - Pace: [slow/medium/fast]
  - Emphasis: [what to highlight]
```

### To WebGL Specialist

```markdown
## [Specialist] モーション連携

### Background Motion
- Pace: [Art Direction からの指針]
- 前景との調和: [具体的な注意点]

### Interaction Response
- 入力に対する反応速度
- 変化の範囲と制限

### Section Transitions
- 背景がどう変化すべきか
- 他要素との同期ポイント
```

## Status Report Format

```markdown
## Motion Design ステータス

### Global System
- タイミング基準: [確定/検討中]
- イージング体系: [確定/検討中]

### Key Animations
- Hero: [状態]
- Works transitions: [状態]
- Micro-interactions: [状態]

### Transitions
- Section → Section: [設計済/検討中/未着手]

### Decisions Needed
- [決定待ち事項]

### Frontend/Specialist 向け
- [引き渡し可能な指針]
```

## Anti-Patterns

- **動きの過剰**: 何でも動かす症候群
- **意味なき動き**: 理由のないアニメーション
- **一貫性の欠如**: 各所でバラバラなタイミング/イージング
- **重い処理**: レイアウトを動かす、filter の乱用
- **間の欠如**: 動きが連続して休みがない
- **予測不能**: ユーザーが動きのパターンを学習できない
- **減速モーション無視**: アクセシビリティの軽視
- **技術先行**: 「できるから」やる動き
