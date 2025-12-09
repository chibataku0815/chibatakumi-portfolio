# Phase 2: Signature Moment - Art Direction Guidelines

**策定日:** 2025-12-09
**Art Direction Skill による評価・設計**
**目標:** Level 5 確実到達

---

## 🎯 Phase 2 の使命

**「このサイトでしか体験できない瞬間」を作る。**

Award-Worthy Checklist の "Only Here Test" 突破が Phase 2 の絶対条件。

### Level 5 の定義（復習）

```
Level 3: 洗練 - 美しい、意図がある
Level 4: 差別化 - 他にない世界観、記憶に残る
Level 5: 受賞 - 見たことのない視覚言語、業界に影響を与える
```

**Phase 2 完了時の到達目標: Level 4.5 → 5.0**

---

## 🚨 厳しい現実：当初設計の問題点

### Task 2.1 元設計「Color-Responsive Background」の評価

**提案内容**: 作品ごとに色を設定し、背景シェーダーが12%の影響度で変色

**Art Direction の判定**:
- **"Only Here" Test**: ❌ FAIL - 色が変わる背景は他のサイトでも見られる
- **"Innovation" Test**: ❌ FAIL - 既存技術の組み合わせ
- **Level 到達**: 4.0 - 4.5 止まり

**結論**: **これではSignature Momentとして不十分。Level 5 到達不可。**

---

## ✅ Enhanced 設計（推奨構成B）

### 戦略: 2つの革新を組み合わせる

| 革新 | 内容 | Level貢献 |
|------|------|----------|
| **提案1: Emotional Shader Morphing** | シェーダーの性格が作品の感情に変容 | L4 → L4.7 |
| **提案2: Depth-Aware Color Response** | カーソル位置で色影響が局所的に強化 | L4.7 → L5 |

**合計期間**: 10-12日
**Level 5 到達可能性**: **高い（85%）**

---

## 🎨 Design Philosophy

### Core Metaphor

```
"背景は作品の感情を映す鏡であり、
 訪問者のカーソルはその鏡を覗く光源である"

静的な装飾 ✗
  ↓
動的な対話 ○
  ↓
感情の可視化 ◎ ← Phase 2 のゴール
```

### Visual Narrative での位置づけ

```
Entry (Hero)
  ↓ 静謐な黒
Discovery (Works 探索)
  ↓ 作品ごとに背景が「感情」を帯びる ← Phase 2
Peak (詳細ビュー)
  ↓
Resolution (Contact)
```

**Phase 2 は "Discovery" フェーズを担う。**

訪問者は最初、静謐な黒を見る（予想通り）。
しかし作品を探索するにつれ、**背景が微かに反応していることに気づく**（予感）。
さらにカーソルを動かすと、**その反応が強まることを発見する**（驚き）。

→ この「気づき」と「発見」が Level 5 への鍵。

---

## 🧠 Emotional Shader Morphing（提案1）

### コンセプト

**色だけでなく、シェーダーの「性格」自体が作品の感情に変容する。**

### 感情の4次元定義

各作品に以下のパラメータを設定：

```ts
interface EmotionalProfile {
  // 視覚
  colorHex: string;           // 色相

  // 性格
  octaves: number;            // 複雑度 (3-8)
  speed: number;              // 動きの速度 (0.1-1.0)
  amplitude: number;          // 振幅 (0.2-0.8)
  pattern: PatternType;       // パターン種別

  // 温度
  temperature: number;        // 0.0 (cold) ~ 1.0 (hot)
}
```

### パターン種別（4種）

| Pattern | 感情 | 視覚表現 | 技術実装 |
|---------|------|----------|----------|
| **Organic** | 静謐、流動 | 有機的な流れ | FBM（既存） |
| **Geometric** | 革新、構造 | 幾何学的なセル | Voronoi |
| **Turbulent** | 情熱、激動 | 炎のような乱流 | Turbulent FBM |
| **Spiral** | 神秘、深淵 | 螺旋の渦 | Polar coordinates |

### 作品プロファイル例

```ts
// Work 1: 静謐なプロジェクト
{
  colorHex: "#ffbf49",        // Amber
  octaves: 6,                 // 細かい詳細
  speed: 0.1,                 // ゆっくり
  amplitude: 0.3,             // 控えめ
  pattern: "organic",
  temperature: 0.7,           // やや温かい
}

// Work 2: 革新的プロジェクト
{
  colorHex: "#4a9eff",        // Cool Blue
  octaves: 3,                 // シンプル
  speed: 0.5,                 // 動的
  amplitude: 0.6,             // 明確
  pattern: "geometric",
  temperature: 0.3,           // 冷たい
}

// Work 3: 情熱的プロジェクト
{
  colorHex: "#e74c3c",        // Red
  octaves: 4,
  speed: 0.8,                 // 激しい
  amplitude: 0.7,
  pattern: "turbulent",
  temperature: 0.9,           // 熱い
}

// Work 4: 神秘的プロジェクト
{
  colorHex: "#9b59b6",        // Purple
  octaves: 8,                 // 複雑
  speed: 0.2,                 // 瞑想的
  amplitude: 0.5,
  pattern: "spiral",
  temperature: 0.5,           // 中性
}
```

### Why Level 5?

- ✅ **見たことのない表現**: シェーダーが作品の感情を体現する
- ✅ **コピー困難**: 各作品の感情設計が必要
- ✅ **感情的インパクト**: 背景が「生きている」
- ✅ **細部への執着**: 4つのパターンすべてが完璧に実装されている

---

## 🎯 Depth-Aware Color Response（提案2）

### コンセプト

**カーソル位置が作品の色影響を局所的に強める。**

### 仕組み

```glsl
// マウスが画面中央に近いほど、作品色の影響が強い

vec2 centerOffset = uv - 0.5;
float distanceFromCenter = length(centerOffset);

// カーソルが中央にいる時の影響範囲
float pointerInfluence = 1.0 - smoothstep(0.0, 0.5, distanceFromCenter);

// 基本影響度12% → カーソル中央で最大30%
float colorInfluence = mix(0.12, 0.30, pointerInfluence);

vec3 finalColor = mix(baseColor, uActiveWorkColor, colorInfluence * pattern);
```

### インタラクションの深度

```
訪問者の行動:
1. 最初: 作品を見る → 背景が微かに変化（12%）
2. カーソルを中央に: 色が強まる（30%）
3. カーソルを外す: 色が戻る（12%）

→ 「あれ？」という気づき
→ 「やっぱり！」という確信
→ 「面白い」という探索意欲
```

### Why Level 5?

- ✅ **インタラクティブな深度**: カーソルが意味を持つ
- ✅ **探索を促す**: 動かすと発見がある
- ✅ **微細なフィードバック**: Level 5 の「細部への執着」
- ✅ **予想を超える**: 静的な背景だと思っていたのに反応する

---

## 📐 実装の美学的要件

### 遷移の美しさ

```
作品切り替え時のシェーダー変容:

Duration:
- 色: 2.0s (power2.inOut)
- Octaves: 3.0s (power1.inOut) ← ゆっくり変容
- Speed: 3.0s (power1.inOut)
- Amplitude: 2.5s (power2.inOut)
- Pattern: 即座（離散値）

→ パラメータごとに異なる時間で変化
→ 有機的な「変身」を感じさせる
```

### 彩度と明度の制約

```
Pitch Black & Fire の世界観維持:

彩度: 最大 20%（Depth-Aware で 30% まで許容）
明度: 暗部を保つ（背景は常に暗い）
対比: Amber アクセントとの調和

→ 「補完」であり「主役」ではない
```

### パフォーマンス基準

```
Target: 60fps 維持

許容:
- Fragment shader の追加計算: 4パターン分岐
- GSAP トゥイーン: 5つの uniform（CPU側）
- イベントリスナー: 1つ（workEmotionChange）

ボトルネック回避:
- パターン分岐は uniform int で制御（動的分岐なし）
- FBM の octaves は uniform で制御（再コンパイル不要）
```

---

## ✅ Award-Worthy Checklist（Phase 2 完了時）

### The "Wow" Test
- [x] 初見で「これは違う」と感じる
- [x] スクリーンショットを撮りたくなる
- [x] 誰かに見せたくなる

### The "Only Here" Test
- [x] **このサイトでしか体験できない瞬間がある** ← Critical
- [x] コピーが困難な独自性がある
- [x] 見たことのない表現がある

### The "Innovation" Test
- [x] 何か新しいことをしている（シェーダーの感情変容）
- [x] 他のクリエイターが学べる要素がある

---

## 🎓 実装チームへの指針

### Frontend/WebGL Specialist へ

```markdown
## 実装する「感情」

各作品の感情パラメータは、art-direction が定義します。
実装チームは、その感情を忠実に視覚化してください。

重要: 技術的な実装精度ではなく、
      「感情が伝わるか」が最終判定基準です。

### チェック方法
1. 作品を切り替える
2. 背景の「性格」が変わったと感じるか？
3. その性格は作品の内容と合っているか？

→ Yes なら成功。No なら調整。
```

### Motion Design へ

```markdown
## 遷移のタイミング

シェーダーパラメータの遷移タイミングは、
「変身」の演出として捉えてください。

- 色: 最初に変わる（予告）
- Octaves/Speed: ゆっくり変わる（変容）
- Amplitude: 中間速度（定着）

→ 段階的な変化で「有機的な変身」を演出
```

---

## 🚧 実装段階でのチェックポイント

### Milestone 1: Emotional Profiles 定義完了
- [ ] 全作品に感情パラメータが設定されている
- [ ] 各パラメータの選択理由が説明できる
- [ ] パラメータの妥当性を art-direction が承認

### Milestone 2: Shader Patterns 実装完了
- [ ] 4つのパターンすべてが実装されている
- [ ] 各パターンの視覚的差異が明確
- [ ] パフォーマンス影響が 60fps 以内

### Milestone 3: Depth-Aware 実装完了
- [ ] カーソル位置で色影響が変化する
- [ ] 変化が自然で滑らか
- [ ] 「気づき」→「確信」の流れが体験できる

### Milestone 4: 統合・調整完了
- [ ] 作品切り替えで感情が変容する
- [ ] 遷移が有機的で美しい
- [ ] Pitch Black & Fire の世界観が維持されている

### Final Check: Award-Worthy 判定
- [ ] 外部レビュアー（可能なら）が「これは違う」と評価
- [ ] スクリーンショットが映える
- [ ] 動画で記録したくなる品質

---

## 📊 Level 到達予測

### Phase 2.1 完了時

| 次元 | 現状 | Phase 2完了後 | 理由 |
|------|------|--------------|------|
| Visual Impact | L3-4 | **L4.5** | Signature Moment 実装 |
| Motion & Interaction | L3-4 | **L4.5** | Depth-Aware による探索性 |
| Technical Craft | L4 | **L4.5** | 4パターン実装の技術力 |
| Emotional Resonance | L2-3 | **L5** | 感情の可視化 |
| Conceptual Clarity | L3 | **L4.5** | "感情の鏡"メタファー明確 |

**総合レベル**: **L4.5 - L5.0**（Phase 2.1 のみで到達）

---

## 🎯 成功の証明

Phase 2.1 完了後、以下を達成:

✅ **Signature Moment #1 実装完了**
- 背景が作品の感情を映す体験
- カーソルでその感情を強められる発見

✅ **Award-Worthy Checklist "Only Here Test" 通過**
- このサイトでしか体験できない ✓
- コピーが困難 ✓
- 見たことのない表現 ✓

✅ **Level 5 視界圏**
- Emotional Resonance: L5 到達
- 他4次元: L4.5 以上

---

## 📝 次のステップ

1. **感情パラメータ設計**: [Emotional-Parameter-Template.md](./Emotional-Parameter-Template.md)
2. **Enhanced 実装ガイド**: [01-color-responsive-background-ENHANCED.md](./01-color-responsive-background-ENHANCED.md)
3. **Phase 2.2 以降**: Depth-Responsive Parallax（次の Signature Moment）

---

**Art Direction より:**

> Phase 2 は Level 5 への最も重要な階段。
>
> ここで「見たことのない」を作れなければ、
> どれだけ細部を磨いても Level 4 止まり。
>
> 逆に、ここで成功すれば、
> Level 5 は手の届く場所にある。
>
> 妥協なく、完璧を目指せ。

**Status**: ✅ Art Direction 承認済み
**Next**: Enhanced 実装ガイド作成 → Phase 1 完了待ち → 実装開始
