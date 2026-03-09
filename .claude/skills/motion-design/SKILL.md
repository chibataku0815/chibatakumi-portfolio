---
name: motion-design
description: Motion graphics specialist focusing on animation artistry, timing choreography, and kinetic storytelling. Use this skill for transition design, motion rhythm, emotional pacing, and transforming technical animation into expressive visual experiences. Bridges frontend-dev and webgl-shader with artistic intent. (project)
---

# motion-design

モーションデザイン専門。アニメーションの芸術性、タイミングの振り付け、動きによるストーリーテリングを設計する。

**目標: Excellence Framework Level 5（受賞レベル）**

---

## Role Definition

- **責務**: トランジション設計、モーションリズム、感情的ペーシング、キネティックタイポグラフィ
- **成果物**: モーション指針、タイミングチャート、トランジション設計、アニメーションストーリーボード
- **境界**: GSAP/CSS実装は Frontend、WebGL/シェーダーは Specialist に委譲
- **品質基準**: EXCELLENCE-FRAMEWORK.md を参照し、常に Level 5 を目指す

---

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

### Award-Worthy Motion の特徴

```
Level 3（洗練）: スムーズ、心地よいタイミング
Level 4（差別化）: 動きに性格がある、物語を感じる
Level 5（受賞）: 動きが言語になる、見たことのないモーション

Level 5 に必要なもの:
1. モーションボキャブラリー（一貫した動きの文法）
2. 感情のオーケストレーション（複数要素の協奏）
3. 予想を超える瞬間（「そう来るか」）
4. 沈黙の設計（動かないことの意図）
5. パフォーマンスと美学の完全両立
```

---

## Award-Worthy Motion Reference Library

### 必修参照: モーションの達人たち

#### Page Transition Masters
| サイト | 特徴 | 学ぶべき点 |
|--------|------|-----------|
| [Aristide Benoist](https://aristidebenoist.com) | シームレスなページ遷移 | 要素の継続性 |
| [Dennis Snellenberg](https://dennissnellenberg.com) | 流体的な動き | 自然なフロー |
| [Jesper Landberg](https://jesperlandberg.dev) | ミニマルな動き | 少ない動きで最大効果 |

#### Scroll-Driven Animation
| サイト | 特徴 | 学ぶべき点 |
|--------|------|-----------|
| [Locomotive](https://locomotive.ca) | Lenis/Smooth Scrollの美学 | スクロール連動の芸術 |
| [Cuberto](https://cuberto.com) | 予想外の展開 | スクロールのストーリーテリング |
| [Obys Agency](https://obys.agency) | 大胆なタイポグラフィアニメーション | 文字を動かす勇気 |

#### Micro-Interaction Excellence
| サイト | 特徴 | 学ぶべき点 |
|--------|------|-----------|
| [Linear](https://linear.app) | 機能的な美しさ | プロダクトUIのモーション |
| [Vercel](https://vercel.com) | 控えめな高級感 | 引き算のモーション |
| [Raycast](https://raycast.com) | 反応の心地よさ | フィードバックの完璧さ |

### 反面教師: 避けるべきモーションパターン

```
Meaningless Motion（無意味な動き）:
- 理由のないバウンス
- すべてがスライドイン
- 永続的なパルス/グロー
- 無限ループアニメーション

Performance Killers（パフォーマンス殺し）:
- width/height のアニメーション
- filter: blur() の乱用
- 同時に動く要素が多すぎ
- will-change の過剰使用

Generic Patterns（AIが生成しがちな動き）:
- 均一な stagger (0.1s, 0.2s, 0.3s...)
- 同じイージングの繰り返し
- 予測可能なフェードイン
```

---

## The 12 Principles (Disney + Digital)

クラシックアニメーションの12原則をデジタルに応用:

### 1. Squash and Stretch → Scale and Morph

```
物理的な伸縮 → デジタルな変形

Level 3: 微細なスケール変化 (1.0 → 1.02)
Level 5: 要素が「呼吸」している感覚

Applications:
- ボタンホバー: scale(1.02) + 微細な歪み
- モーダル登場: 中心から外への有機的な拡大
- カード: ホバーで「膨らむ」感覚

注意:
- 過剰な変形は安っぽい
- 微細さが高級感を生む
```

### 2. Anticipation → Preparation Cues

```
動作前の予備動作 → デジタルでの予感

Level 3: ホバー時の視覚的フィードバック
Level 5: 「何かが起きる」という期待の設計

Applications:
- クリック前の微かな引き（scale 0.98）
- ページ遷移前の要素の収束
- スクロール到達前のヒント

Level 5 のテクニック:
  1. 視線を集める → 2. 期待を作る → 3. 予想を超える
```

### 3. Staging → Visual Hierarchy in Time

```
何に注目させるか → 時間軸での階層

Level 3: メイン要素が最初に動く
Level 5: 動きの「振り付け」が物語を語る

Sequence Example (Level 5):
  T+0.0s: 背景が微かに変化（予感）
  T+0.3s: タイトルが reveal（主役の登場）
  T+0.6s: サブ要素が追従（支える動き）
  T+1.0s: すべてが落ち着く（呼吸）
```

### 4. Straight Ahead / Pose to Pose → Scripted vs Emergent

```
計画的 vs 創発的

Scripted Motion:
- 予測可能、安定
- ナビゲーション、UI要素

Emergent Motion:
- 予測不能、生命感
- パーティクル、背景効果
- マウス追従、物理シミュレーション

Level 5: 両者の絶妙なバランス
- 主要UIは Scripted（安心感）
- 背景/アクセントは Emergent（生命感）
```

### 5. Follow Through / Overlapping → Secondary Motion

```
慣性による余韻 → 二次的な動き

Level 3: メインの後に影が追従
Level 5: すべての要素が異なるタイミングで「落ち着く」

Timing Architecture:
  Primary:   ████████────────  (0.0 → 0.6s)
  Secondary: ──████████────    (0.1 → 0.8s)
  Tertiary:  ────████████      (0.2 → 1.0s)

→ 要素が「重さ」を持っている感覚
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

Level 5 Easing:
  カスタムベジェで「性格」を作る
  cubic-bezier(0.22, 1, 0.36, 1) → 「自信ある登場」
  cubic-bezier(0.33, 1, 0.68, 1) → 「穏やかな確信」
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

Level 5: 弧が「意図」を持つ
- 上向きの弧 = 軽さ、希望
- 下向きの弧 = 重さ、落ち着き
- S字の弧 = 優雅さ、流れ
```

### 8-12. 残りの原則

```
8. Secondary Action → Supporting Motion
   主役を引き立てる脇役の動き
   Level 5: オーケストラのような協奏

9. Timing → Duration and Tempo
   Level 5 Duration Guide:
     Micro: 100-200ms (瞬き)
     Small: 200-400ms (呼吸)
     Medium: 400-700ms (歩み)
     Large: 700-1200ms (うねり)
     Dramatic: 1200-2000ms (波)

10. Exaggeration → Emphasis
    Level 5: 控えめな中の「一点の誇張」

11. Solid Drawing → Consistent Visual Language
    Level 5: 動きの「文法」が確立している

12. Appeal → Aesthetic Quality
    Level 5: 動きに「人格」がある
```

---

## Motion Rhythm

### Tempo and Beat

```
サイト全体のリズム設計:

Beat: 基本単位 (例: 200ms)

Rhythm Pattern:
  ○ ○ ○ ○  →  ● ○ ○ ○  →  ○ ● ○ ○  →  ...
  (静) (静)    (動) (静)    (静) (動)

Level 5 Polyrhythm:
  Layer 1: ● ○ ○ ● ○ ○  (メイン要素: 3拍子)
  Layer 2: ● ○ ● ○ ● ○  (副要素: 2拍子)
  Layer 3: ●──────●──────  (背景: 長い波)
  → 複雑さの中の調和
```

### Silence is Motion

```
動きの「間」:

Level 3:
  ●●●●○○●●●●  → 休みがある

Level 5:
  ●○○○○○●○○○  → 沈黙が「語る」

間の設計:
- 大きな動きの後 → 長い間（余韻）
- 次の動きの前 → 短い間（予感）
- 頂点の瞬間 → 完全な静止（息を呑む）
```

### Award-Worthy Stagger Patterns

```
Generic Stagger (避ける):
  Element 1: |████        | +0.0s
  Element 2: |  ████      | +0.1s
  Element 3: |    ████    | +0.2s
  Element 4: |      ████  | +0.3s
  → 予測可能、退屈

Level 5 Stagger:
  Element 1: |████            | +0.0s  (主役、長め)
  Element 2: | ██             | +0.05s (素早く追従)
  Element 3: |  ██            | +0.08s (さらに素早く)
  Element 4: |        ████    | +0.4s  (間を置いて)
  → 「呼吸」のリズム、予測不能な心地よさ
```

---

## Transition Design

### Page Transition Types

```
Level 3 Transitions:
  - Fade (opacity crossfade)
  - Slide (directional movement)
  - Scale (zoom in/out)

Level 5 Transitions:
  1. Shared Element Transition
     - 要素が次のページへ「旅をする」
     - アイデンティティの継続

  2. Morphing Transition
     - 要素が変形して次の要素になる
     - 視覚的な連続性

  3. Choreographed Exit/Enter
     - 退場と登場が対話する
     - 物語の「場面転換」

  4. Reveal Transition
     - 次のページが「現れる」
     - カーテンが開く感覚
```

### Level 5 Transition Anatomy

```
Phase 1: 予感 (0-200ms)
  - 現在のページ要素が「準備」を始める
  - 微かな動き、色の変化

Phase 2: 収束 (200-500ms)
  - 要素が exit point に向かって集まる
  - または個別に消えていく

Phase 3: 間 (500-700ms)
  - 完全な空白、または中間状態
  - 「息を吸う」瞬間

Phase 4: 展開 (700-1200ms)
  - 新しいページ要素が entry point から現れる
  - 段階的な reveal

Phase 5: 着地 (1200-1500ms)
  - すべてが最終位置に落ち着く
  - 余韻の動き
```

### For Pitch Black & Fire

```
推奨トランジション:

Hero → Works:
  Phase 1: タイトルが上へ消えながら opacity 低下
  Phase 2: 背景シェーダーが波打つ
  Phase 3: 一瞬の暗転（深淵への沈降）
  Phase 4: Works要素が下から浮上
  Phase 5: 背景シェーダーが安定

Works Panel → Panel:
  - 水平ワイプ + 要素の stagger
  - 「ページをめくる」感覚
  - 前のパネルの残像が一瞬残る

Works → Contact:
  - すべての要素が中央に収束
  - アンバーの光が強まる
  - 「終わりと始まり」の感覚
```

---

## Scroll-Driven Motion

### Scroll as Instrument

```
Level 3: スクロールで要素が appear
Level 5: スクロールが「演奏」になる

Scroll Motion Types:

1. Trigger-based (トリガー型)
   - 特定位置で発火
   - IntersectionObserver / ScrollTrigger
   - 確実、予測可能

2. Scrub-based (スクラブ型)
   - スクロール量に連動
   - 0-1 の progress で制御
   - インタラクティブ、没入感

3. Hybrid (ハイブリッド)
   - 基本は trigger
   - 特別なセクションで scrub
   - Level 5 の選択
```

### Level 5 Scroll Choreography

```
Section Entry Sequence:

Viewport Enter (0%)
    │
    ▼ 20% - 予感の動き開始
    │       (背景変化、微細なヒント)
    │
    ▼ 40% - メイン要素 reveal 開始
    │       (タイトル、主要コンテンツ)
    │
    ▼ 60% - サポート要素 reveal
    │       (サブテキスト、装飾)
    │
    ▼ 80% - すべてが安定
    │       (アニメーション完了)
    │
    ▼ 100% - 次のセクションへの予感
            (exit の準備)
```

---

## Kinetic Typography

### Level 5 Text Animation

```
Character Animation Approaches:

1. Reveal (出現)
   Level 3: 文字が順番に fade in
   Level 5: 文字が「物質化」する感覚
           - blur → sharp
           - scale 0.8 → 1.0
           - y +20 → 0

2. Wave (波)
   Level 3: 均一な波
   Level 5: 有機的な波、強弱のある波

3. Scatter/Gather (散乱/収束)
   Level 3: 文字がランダムに散らばる
   Level 5: 意味のある散らばり方、
           収束時の「意図」

Hero Text (Pitch Black & Fire):
  Initial: opacity 0, blur 12px, y +24px
  Final: opacity 1, blur 0px, y 0px
  Duration: 40ms/char stagger
  Easing: cubic-bezier(0.22, 1, 0.36, 1)

  + 完了後 500ms の「静寂」
  + その後、サブテキストの reveal
```

---

## Performance & Motion

### Motion Budget

```
同時アニメーション制限:

Level 3: 最大 5 要素
Level 5: 最大 3 主要 + 無限の微細

なぜ制限するか:
- 注意の分散を防ぐ
- パフォーマンスを確保
- 「主役」を明確にする

GPU-Friendly Properties:
✓ transform (translate, scale, rotate)
✓ opacity
△ filter (控えめに)
✗ width, height
✗ margin, padding
✗ top, left
```

### Reduced Motion

```
@media (prefers-reduced-motion: reduce) {
  Level 3: アニメーションを短縮
  Level 5: 意味を維持した別表現

  例:
  通常: 複雑なスクロールアニメーション
  reduced: 即時表示 + 微細なフェード

  → 体験の本質は維持
  → 動きに依存しない情報設計
}
```

---

## Motion Quality Checklist

### Award-Worthy Checklist

```
### The "Feel" Test
□ 動きに「性格」があるか？
□ 見ていて気持ちいいか？
□ 何度見ても飽きないか？
□ 動きを止めたくならないか？

### The "Purpose" Test
□ すべての動きに理由があるか？
□ 動かないことにも意図があるか？
□ 削除できる動きはないか？

### The "Orchestration" Test
□ 複数要素が協奏しているか？
□ 「主役」と「脇役」が明確か？
□ 沈黙/間が設計されているか？

### The "Surprise" Test
□ 予想外の瞬間があるか？
□ しかし文脈に沿っているか？
□ 「そう来るか」があるか？

### The "Performance" Test
□ 60fps を維持しているか？
□ GPU-friendly な実装か？
□ reduced-motion に対応しているか？

### The "Coherence" Test
□ 動きの「文法」が一貫しているか？
□ イージングシステムがあるか？
□ タイミングシステムがあるか？
```

---

## Integration Protocols

### From Art Direction

```markdown
## [Motion] Art Direction からの指針

受け取るもの:
- ムードキーワード → 動きの性格に翻訳
- Impact Points → 動きの強弱の配置
- 視覚的メタファー → 動きのモチーフ

翻訳ガイド:
- 「静謐」→ ゆっくり、呼吸を感じる (800ms+, ease-out)
- 「緊張」→ 溜めて解放 (anticipation + snap)
- 「深淵」→ 奥行きを感じる動き (parallax, scale)
- 「熱」→ 微かな震え、グロー (subtle vibration)
```

### To Frontend Dev

```markdown
## [Frontend] モーション指針

### Global Timing System
- Beat: 200ms
- Micro: 100-200ms
- Small: 200-400ms
- Medium: 400-700ms
- Large: 700-1200ms

### Easing Library
- entry: cubic-bezier(0.22, 1, 0.36, 1)
- exit: cubic-bezier(0.36, 0, 0.66, 1)
- move: cubic-bezier(0.33, 1, 0.68, 1)
- bounce: cubic-bezier(0.34, 1.56, 0.64, 1)

### Element Choreography
[要素名]:
  - Initial: [state]
  - Final: [state]
  - Duration: [ms]
  - Easing: [name]
  - Stagger: [ms] (if applicable)
  - Trigger: [scroll/load/interaction]

### Page Transitions
[Source] → [Destination]:
  - Exit choreography: [description]
  - Transition: [type]
  - Enter choreography: [description]
  - Total duration: [ms]
```

### From Color Visual Styling

```markdown
## [Motion] Color Visual Styling からの色変化パラメータ

色変化を伴うモーションを設計する際、color-visual-styling から
以下のパラメータを受け取る:

### 受信パラメータ
| パラメータ | 説明 | 例 |
|-----------|------|-----|
| from_color | 開始色（oklch 値 or トークン名） | --bg-dark |
| to_color | 終了色 | --heat-medium |
| chroma_range | 彩度の変化幅 | 0.01 → 0.16 |
| hue_direction | 色相補間方向 | shorter / longer |
| contrast_floor | 最低コントラスト比（WCAG AA） | 4.5:1 |

### 色変化とモーションの同期ルール
1. 色変化の duration は動きの 1.2-1.5 倍に設定
2. 色変化は動きの後を追う（delay 100-200ms）
3. oklch の L/C/H を個別にアニメーション → @property で型定義必須
4. Chroma dip（oklch 補間時の彩度低下）に注意

### 禁止
- 100ms 以下の色遷移（フリッカーリスク）
- WCAG AA を下回るコントラスト状態への遷移
- 色変化単体での意味伝達（動き/テキストで補完）
```

### To WebGL Specialist

```markdown
## [Specialist] モーション連携

### 背景シェーダーとの同期
- ページ遷移時の変化
- セクション変更時の反応
- インタラクション時の呼応

### Shared Timeline Points
- T+0ms: [何が起きるか]
- T+Xms: [シェーダーの変化]
- T+Yms: [UI要素の変化]

### Performance Coordination
- 重い処理のタイミング調整
- GPU負荷の分散
```

---

## Status Report Format

```markdown
## Motion Design ステータス

### Excellence Level
- 現在: Level [1-5]
- 目標: Level 5

### Global System
- タイミング基準: [確定/検討中]
- イージングライブラリ: [確定/検討中]
- モーション文法: [確定/検討中]

### Key Animations
- Hero entrance: [Level/状態]
- Page transitions: [Level/状態]
- Scroll animations: [Level/状態]
- Micro-interactions: [Level/状態]

### Quality Checklist
- "Feel" Test: [Pass/Fail]
- "Purpose" Test: [Pass/Fail]
- "Orchestration" Test: [Pass/Fail]
- "Surprise" Test: [Pass/Fail]
- "Performance" Test: [Pass/Fail]
- "Coherence" Test: [Pass/Fail]

### Decisions Needed
- [決定待ち事項]

### Handoffs
- Frontend: [引き渡し可能な指針]
- Specialist: [連携ポイント]
```

---

## Anti-Patterns

### Generic Patterns（Level 1-2 に留まる原因）
- **動きの過剰**: 何でも動かす症候群
- **意味なき動き**: 理由のないアニメーション
- **一貫性の欠如**: 各所でバラバラなタイミング/イージング
- **重い処理**: レイアウトを動かす、filter の乱用

### Stagnation Patterns（Level 3-4 に留まる原因）
- **間の欠如**: 動きが連続して休みがない
- **予測可能**: 均一な stagger、同じパターンの繰り返し
- **主役不在**: すべてが同じ重要度で動く
- **オーケストレーション不足**: 要素が協奏していない
- **性格の欠如**: 動きに「人格」がない
- **技術先行**: 「できるから」やる動き

---

## Excellence Reminder

```
Level 5 モーションの問い:

「この動きは何を語っているか？」
「動かないという選択を検討したか？」
「見ている人の呼吸と合っているか？」
「1年後もこの動きは美しいか？」

動きは言語。
沈黙も言語。
Level 5 は「動きで物語を紡ぐ」こと。
```
