# Task 3.1: Mood Mapping（感情マッピング）

**フェーズ:** Phase 3 - Emotional Arc
**優先度:** ★★★★★ (Critical - Level 5 必須)
**期間:** 2-3日
**前提条件:** Phase 2 完了必須
**Level 貢献:** L4.5 → L5（感情アークの基盤）

---

## 🎯 目的

サイト全体の感情アーク（Entry → Discovery → Peak → Resolution）を設計し、ドキュメント化する。

**Art Direction スキルの Level 5 Mood Design:**
```
ムードの「裏切り」と「回収」

Entry: 静謐（予想通り）
  ↓
Discovery: 微かな緊張（予感）
  ↓
Peak: 意外な熱量（裏切り）
  ↓
Resolution: 静謐への回帰（回収）
  → 最初の静謐が違って見える
```

---

## 📋 要件定義

### 機能要件
- [ ] 各セクションの感情目標を定義
- [ ] セクション間の遷移ロジックを設計
- [ ] ムード次元（Temperature, Density, Rhythm 等）を数値化
- [ ] 実装ガイドラインの作成

### デザイン要件
- [ ] Pitch Black & Fire のメタファーに沿った感情設計
- [ ] 予測可能性と意外性のバランス
- [ ] 余韻（Resolution）の設計

### 技術要件
- [ ] ドキュメントとして明確化（このタスク）
- [ ] 次のタスク（3.2）で実装可能な形式

---

## 🎨 感情アーク設計

### Section-by-Section Mood Map

```markdown
┌─────────────────────────────────────────────────────────┐
│ Hero (Entry): 静謐の深淵                                  │
├─────────────────────────────────────────────────────────┤
│ 感情目標: 引き込まれる静けさ、探索への期待                 │
│                                                          │
│ Mood Dimensions:                                         │
│   Temperature:  ■■■□□□□□□□  (Cold, contemplative)    │
│   Density:      ■■■■■■□□□□  (Dense, focused)          │
│   Rhythm:       ■■□□□□□□□□  (Slow, breathing)         │
│   Contrast:     ■■■■■■■■□□  (High, dramatic)          │
│                                                          │
│ 実装要素:                                                 │
│   - Hero shader: 最も静的な状態                          │
│   - Title animation: ゆっくりとした blur-to-sharp        │
│   - 背景: 深い黒、微かな FBM ノイズのみ                  │
├─────────────────────────────────────────────────────────┤
│ Works Section (Discovery): 微かな目覚め                   │
├─────────────────────────────────────────────────────────┤
│ 感情目標: 「何かが反応している」予感                       │
│                                                          │
│ Mood Dimensions:                                         │
│   Temperature:  ■■■■□□□□□□  (Warming up)             │
│   Density:      ■■■■■□□□□□  (Opening up)             │
│   Rhythm:       ■■■□□□□□□□  (Subtle acceleration)    │
│   Contrast:     ■■■■■■■□□□  (Maintained)             │
│                                                          │
│ 実装要素:                                                 │
│   - 背景が作品色に微かに反応（Task 2.1 完了）            │
│   - HorizontalWorks の文字ステージング                  │
│   - 最初の作品（Work 1-2）は控えめな反応                │
├─────────────────────────────────────────────────────────┤
│ Works Section Peak (Work 3-4): 熱量の頂点（裏切り）        │
├─────────────────────────────────────────────────────────┤
│ 感情目標: 予想を超える熱量、息を呑む瞬間                   │
│                                                          │
│ Mood Dimensions:                                         │
│   Temperature:  ■■■■■■■■■□  (HOT - Peak heat)        │
│   Density:      ■■■■□□□□□□  (Less dense, energetic)  │
│   Rhythm:       ■■■■■■□□□□  (Dynamic, pulsing)        │
│   Contrast:     ■■■■■■■■■■  (Maximum)                │
│                                                          │
│ 実装要素:                                                 │
│   - 背景シェーダーの活性度が最大                         │
│   - Amber の彩度が最も高い（ただし 20% 以内）           │
│   - パーティクルの密度上昇（optional）                   │
│   - Origin Glow の pulse が最も強い                     │
├─────────────────────────────────────────────────────────┤
│ Works Section Tail (Work 5+): 徐々に冷却                  │
├─────────────────────────────────────────────────────────┤
│ 感情目標: ピークからの緩やかな降下、満足感                 │
│                                                          │
│ Mood Dimensions:                                         │
│   Temperature:  ■■■■■□□□□□  (Cooling down)           │
│   Density:      ■■■■■■□□□□  (Re-focusing)            │
│   Rhythm:       ■■■□□□□□□□  (Slowing down)           │
│   Contrast:     ■■■■■■□□□□  (Softening)              │
│                                                          │
│ 実装要素:                                                 │
│   - 背景の活性度が徐々に低下                             │
│   - 色温度が冷却方向へ                                  │
├─────────────────────────────────────────────────────────┤
│ Contact/Footer (Resolution): 静謐への回帰（回収）          │
├─────────────────────────────────────────────────────────┤
│ 感情目標: 最初の静けさに戻るが、「満たされた」静けさ        │
│                                                          │
│ Mood Dimensions:                                         │
│   Temperature:  ■■□□□□□□□□  (Cold again, but warm memory) │
│   Density:      ■■■■■■■□□□  (Dense, settled)         │
│   Rhythm:       ■□□□□□□□□□  (Slowest, resting)        │
│   Contrast:     ■■■■■□□□□□  (Moderate, peaceful)      │
│                                                          │
│ 実装要素:                                                 │
│   - 背景が完全に静的に戻る                               │
│   - Origin Glow の微かな「余熱」（0.1-0.2 opacity）     │
│   - 「また来たい」と思わせる余韻                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📐 実装ガイドライン

### 1. Temperature 制御

```tsx
// Hero shader の温度制御パラメータ

interface TemperatureConfig {
  hero: 0.2,        // Entry: Cold
  work1_2: 0.4,     // Discovery: Warming
  work3_4: 0.9,     // Peak: HOT
  work5plus: 0.5,   // Cooling
  contact: 0.1,     // Resolution: Cold but satisfied
}

// Shader での使用例:
vec3 coldColor = vec3(0.1, 0.15, 0.2);   // Blue-ish
vec3 hotColor = vec3(0.3, 0.2, 0.1);     // Amber-ish
vec3 baseColor = mix(coldColor, hotColor, temperature);
```

### 2. Density 制御

```tsx
// パーティクル/ノイズの密度

interface DensityConfig {
  hero: 0.6,        // Dense, focused
  work1_2: 0.5,     // Opening up
  work3_4: 0.4,     // Less dense, energetic
  work5plus: 0.6,   // Re-focusing
  contact: 0.7,     // Dense, settled
}

// Shader での使用例:
float noiseDensity = uDensity;
float fbmValue = fbm(vUv * (10.0 / noiseDensity));
```

### 3. Rhythm 制御

```tsx
// アニメーションの速度/周期

interface RhythmConfig {
  hero: { speed: 0.3, pulse: 1.5 },      // Slow breathing
  work1_2: { speed: 0.5, pulse: 1.8 },   // Subtle acceleration
  work3_4: { speed: 0.9, pulse: 2.5 },   // Dynamic, pulsing
  work5plus: { speed: 0.5, pulse: 1.5 }, // Slowing down
  contact: { speed: 0.2, pulse: 1.0 },   // Slowest, resting
}

// Shader での使用例:
float pulse = sin(uTime * uRhythm.pulse) * 0.5 + 0.5;
```

---

## ✅ 完了基準

### 必須項目（このタスク）
- [ ] 感情アークが明確にドキュメント化されている
- [ ] 各セクションの Mood Dimensions が数値化されている
- [ ] 実装ガイドラインが具体的
- [ ] Task 3.2（実装）に引き継げる形式

### Quality Check
- [ ] ストーリーアークが理解できるか？
- [ ] 「裏切り」と「回収」が明確か？
- [ ] Pitch Black & Fire のメタファーに沿っているか？
- [ ] 実装可能な具体性があるか？

---

## 📝 成果物

### 1. Mood Map ドキュメント（このファイル）
- Section-by-Section の感情設計

### 2. 実装パラメータファイル（作成）
```ts
// apps/web/src/features/mood/config.ts (新規作成)

export const moodConfig = {
  hero: {
    temperature: 0.2,
    density: 0.6,
    rhythm: { speed: 0.3, pulse: 1.5 },
    contrast: 0.8,
  },
  work1_2: {
    temperature: 0.4,
    density: 0.5,
    rhythm: { speed: 0.5, pulse: 1.8 },
    contrast: 0.7,
  },
  work3_4: {
    temperature: 0.9,
    density: 0.4,
    rhythm: { speed: 0.9, pulse: 2.5 },
    contrast: 1.0,
  },
  work5plus: {
    temperature: 0.5,
    density: 0.6,
    rhythm: { speed: 0.5, pulse: 1.5 },
    contrast: 0.6,
  },
  contact: {
    temperature: 0.1,
    density: 0.7,
    rhythm: { speed: 0.2, pulse: 1.0 },
    contrast: 0.5,
  },
};
```

---

## 📚 参照リソース

### Art Direction スキル
- `SKILL.md` - Level 5 Mood Design
- Mood Dimensions の定義
- ムードの「裏切り」と「回収」

### 参照サイト
- **Locomotive**: スクロール体験での感情変化の設計
- **Active Theory**: インタラクションが物語を作る

---

## 📝 完了後のアクション

1. **moodConfig.ts を作成**: パラメータファイル
2. **README.md 更新**: Phase 3 進捗を記録
3. **次のタスクへ**: [02-section-activation.md](./02-section-activation.md)（実装）

---

**Status:** 🔜 Not Started
**Assigned:** -
**Started:** -
**Completed:** -

---

## 💡 なぜこのタスクが重要か

**Excellence Framework:**
> Emotional Resonance (感情的共鳴)
> Level 5: 忘れられない体験

現状、プロジェクトは **L2-3**（快適だが、感情を強く動かさない）

このタスクで感情アークを設計することで:
- **L2-3 → L4**: 感情の変化がある
- **L4 → L5**: 予想を裏切る熱量がある

**Art Direction スキルより:**
> Level 5 は「これ以上は無理」の先にある。

感情設計なき実装は、Level 3 に留まる。
このタスクが、Level 5 への「設計図」を作る。
