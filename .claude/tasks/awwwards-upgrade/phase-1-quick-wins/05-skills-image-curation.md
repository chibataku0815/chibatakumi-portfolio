# Task 1.5: Skills ページ画像キュレーション

**フェーズ:** Phase 1 - Quick Wins
**優先度:** ★★★★☆ (High - Craft Details)
**期間:** 1-2日
**前提条件:** なし（独立タスク）
**Level 貢献:** L1-2 → L4（Craft Details 改善）

---

## 🎯 目的

Skills ページの各スキルに、**そのスキルを正確に表現する画像**を割り当てる。

**現状の問題:**
- img_1, 4, 7, 10 を使用（spotlight ギャラリーから無作為選定）
- img_1（Visual/Photo）のみ適合、残り3つは**完全に不適合**
- すべてポートレート写真 → Code/Motion/Identity を表現できていない
- Level 判定: **L1-2**（機能していない）

**Art Direction 原則:**
> すべての要素に意図がある。何も "とりあえず" は存在しない。

---

## 📋 現状分析

### 画像の内容と適合性

| スキル | 現在の画像 | 内容 | 適合性 | 問題点 |
|--------|-----------|------|--------|--------|
| **Visual & Photo Direction** | img_1.jpg | ポートレート（黄緑グラデ背景） | ✅ 適合 | Pitch Black との乖離（bright背景） |
| **Code & Interaction** | img_4.jpg | ポートレート（bokeh、warm） | ❌ 不適合 | コードを一切表現していない |
| **Motion & Sound** | img_7.jpg | ポートレート（オレンジ背景） | ❌ 不適合 | モーションを一切表現していない |
| **Identity & Systems** | img_10.jpg | シルエット（オレンジ背景） | ❌ 不適合 | システムを一切表現していない |

### Pitch Black & Fire との整合性

```
現状の問題:
- すべて warm/bright 背景（黄緑、オレンジ）
- Pitch Black の深い黒が存在しない
- "Fire"（熱）が表面に出すぎている

Level 5 要件:
- Pitch Black（深い黒）をベースに
- 各スキルの "Fire"（専門性の熱）を微かに見せる
- 技術的証拠を視覚的に提示
```

---

## 🎨 各スキルの画像要件（Level 5 基準）

### Skill 01: Visual & Photo Direction

**現状:** img_1.jpg（ポートレート作品）
**判定:** ✅ 内容は適合、⚠️ Pitch Black との乖離

#### Level 5 要件:

```markdown
### 画像内容（優先順）
1. **撮影現場 BTS**（最優先）
   - スタジオライティングセットアップ
   - カメラ + モニター + カラーグレーディング画面
   - 「光をコントロールする」過程の可視化

2. **ポートフォリオ級作品**（次点）
   - Pitch Black ベースの作品
   - Lighting/Color Grading が明確
   - 現在の img_1.jpg を Pitch Black 化

### ビジュアル基準
- ベース: Pitch Black（深い黒背景）
- アクセント: Amber tones（照明の温かさ）
- Contrast: High（光と影の dramatic な対比）
- Mood: Controlled intensity

### 技術的証拠
- ライティング機材の存在
- または: 明確な光のコントロール

### Alt text 例
"Studio lighting setup with controlled amber tones against pitch black background"
```

#### 推奨アクション:

```
Option A: 新規撮影/スクリーンショット
- 撮影現場の BTS を撮影
- Pitch Black 背景 + Amber ライティング

Option B: img_1.jpg を Pitch Black 化
- 背景を深い黒に変更（Photoshop/Lightroom）
- 被写体の lighting はそのまま
- Pitch Black & Fire に適合させる
```

---

### Skill 02: Code & Interaction Systems

**現状:** img_4.jpg（ポートレート作品）
**判定:** ❌ 完全に不適合（Level 1）

#### Level 5 要件:

```markdown
### 画像内容（優先順）
1. **コードエディタ画面**（最優先）
   - Three.js / GSAP のコード
   - シェーダー（GLSL）コード
   - VSCode dark theme + syntax highlighting

2. **ブラウザ DevTools**（次点）
   - Chrome DevTools の Elements/Console
   - React/Three.js コンポーネント階層
   - パフォーマンスプロファイラー

3. **インタラクティブ作品実行中**（代替）
   - ブラウザでシェーダー実行中
   - Three.js シーンの wireframe view
   - GSAP timeline の可視化

### ビジュアル基準
- ベース: Pitch Black（dark theme editor）
- アクセント: Syntax highlighting colors（控えめに）
- Contrast: Medium-High（可読性重視）
- Mood: Precision + Creativity

### 技術的証拠
- 実際のコード（読める必要はないが、本物感）
- ターミナル、エディタ、ブラウザ等の UI

### Alt text 例
"Three.js shader code in VSCode with live preview in browser"
```

#### 推奨アクション:

```
新規作成必須:
1. VSCode で Three.js/GLSL コードを開く
2. Pitch Black theme（例: "One Dark Pro"）を使用
3. スクリーンショット（コード + ブラウザプレビュー）
4. 不要な UI 要素を削除（clean composition）
```

---

### Skill 03: Motion & Sound Layering

**現状:** img_7.jpg（ポートレート作品）
**判定:** ❌ 完全に不適合（Level 1）

#### Level 5 要件:

```markdown
### 画像内容（優先順）
1. **モーションタイムライン**（最優先）
   - After Effects タイムライン
   - + Audio waveform（音声同期を示す）
   - キーフレームが見える

2. **キネティック・タイポグラフィ**（次点）
   - モーショングラフィックスのスチル
   - 文字が「動いている瞬間」をキャプチャ
   - モーションブラー、trails、変形等

3. **GSAP timeline 可視化**（代替）
   - ブラウザでの GSAP アニメーション
   - timeline の視覚的表現
   - ScrollTrigger markers 表示

### ビジュアル基準
- ベース: Pitch Black
- アクセント: Kinetic energy（動きの軌跡、trails）
- Contrast: High（動きの強調）
- Mood: Dynamic energy（止まっていても動きを感じる）

### 技術的証拠
- タイムライン、waveform、keyframes
- または: 明確な motion blur/trails

### Alt text 例
"Kinetic typography motion frames with audio waveform synchronization"
```

#### 推奨アクション:

```
新規作成必須:
1. After Effects で既存のモーション作品を開く
2. Timeline + Waveform が見えるようにレイアウト
3. Pitch Black 背景でスクリーンショット
4. または: モーショングラフィックスの代表的なフレームを選定
```

---

### Skill 04: Identity & Systems

**現状:** img_10.jpg（シルエット作品）
**判定:** ❌ 完全に不適合（Level 1）

#### Level 5 要件:

```markdown
### 画像内容（優先順）
1. **デザインシステム UI**（最優先）
   - Figma のデザインシステム画面
   - Component library の一覧
   - Color palette + Typography scale

2. **ブランドスタイルガイド**（次点）
   - ブランドカラー + ロゴ展開
   - Grid system の可視化
   - Typography hierarchy

3. **Component Library コード**（代替）
   - Storybook 画面
   - shadcn/ui のカスタマイズ
   - Tailwind config + design tokens

### ビジュアル基準
- ベース: Pitch Black
- アクセント: Design tokens（カラーパレット等）
- Contrast: Medium（調和重視）
- Mood: Systematic harmony

### 技術的証拠
- デザインシステムの構造が見える
- または: ブランド要素の一貫性

### Alt text 例
"Design system component library with brand color palette and typography scale"
```

#### 推奨アクション:

```
新規作成必須:
1. Figma でデザインシステムファイルを開く
2. Components/Styles パネルが見えるようにレイアウト
3. Pitch Black 背景でスクリーンショット
4. または: このポートフォリオのデザインシステムを可視化
```

---

## 📐 実装手順

### Day 1: 画像準備（4-6時間）

#### Morning: Code & Motion 画像作成

```bash
# Code 画像
1. VSCode で apps/web/src/features/hero/shader/materials/hero.ts を開く
2. Theme: One Dark Pro（Pitch Black ベース）
3. Split view: コード（左） + ブラウザプレビュー（右）
4. スクリーンショット → /public/skills/code-interaction.jpg

# Motion 画像
1. After Effects で既存モーション作品を開く
2. Timeline + Waveform を表示
3. Pitch Black 背景でスクリーンショット → /public/skills/motion-sound.jpg
```

#### Afternoon: Identity 画像作成 + Visual 調整

```bash
# Identity 画像
1. Figma でデザインシステムを開く（or 新規作成）
2. Components + Color palette を配置
3. スクリーンショット → /public/skills/identity-systems.jpg

# Visual 画像調整
1. img_1.jpg を Lightroom で開く
2. 背景を Pitch Black に調整
3. 保存 → /public/skills/visual-photo.jpg
```

### Day 2: 統合とテスト（2-3時間）

#### Morning: portfolio.ts 更新

```typescript
// apps/web/src/shared/data/portfolio.ts

const multiskillItems: WorkItem[] = [
  {
    id: "01",
    title: "Visual & Photo Direction",
    media: {
      type: "image",
      src: "/skills/visual-photo.jpg",  // ← 変更
      alt: "Studio lighting with controlled amber tones against pitch black"
    },
    // ...
  },
  {
    id: "02",
    title: "Code & Interaction Systems",
    media: {
      type: "image",
      src: "/skills/code-interaction.jpg",  // ← 変更
      alt: "Three.js shader code with live browser preview"
    },
    // ...
  },
  {
    id: "03",
    title: "Motion & Sound Layering",
    media: {
      type: "image",
      src: "/skills/motion-sound.jpg",  // ← 変更
      alt: "Motion graphics timeline with audio waveform synchronization"
    },
    // ...
  },
  {
    id: "04",
    title: "Identity & Systems",
    media: {
      type: "image",
      src: "/skills/identity-systems.jpg",  // ← 変更
      alt: "Design system components with brand color palette"
    },
    // ...
  },
];
```

#### Afternoon: 動作確認と調整

```bash
# 開発サーバー起動
npm run dev

# Skills ページ確認
open http://localhost:3000/skills

# 確認項目:
□ 各画像が正しく表示される
□ Pitch Black & Fire の世界観に統一されている
□ 各スキルの内容を正確に表現している
□ Alt text が descriptive
```

---

## ✅ 完了基準

### 必須項目

- [ ] 各スキルに適切な画像が割り当てられている
- [ ] すべての画像が Pitch Black & Fire に準拠
- [ ] Code/Motion/Identity の技術的証拠が可視化されている
- [ ] Alt text がスキル内容を正確に説明
- [ ] `/public/skills/` ディレクトリに画像格納

### Quality Check

- [ ] **"Craft" Test**: 最も小さな要素まで意図があるか？ → YES
- [ ] **"Coherence" Test**: すべてが同じ言語を話しているか？ → YES
- [ ] **"Only Here" Test**: このポートフォリオの独自性を示すか？ → YES
- [ ] Pitch Black（深い黒）がベースになっているか？
- [ ] 各スキルの "Fire"（専門性）が微かに見えるか？

### Level 判定

```
Before: Level 1-2
  - 3/4 の画像が不適切
  - "Craft" Test: FAIL
  - "Coherence" Test: FAIL

After: Level 4
  - すべての画像が意図的に選定
  - "Craft" Test: PASS
  - "Coherence" Test: PASS
  - Award-Worthy Checklist: 3/18 → 5/18
```

---

## 🎨 Pitch Black & Fire 統一ガイドライン

### 色温度基準

```
すべての画像で統一:

Base: Pitch Black
  - RGB: (11, 11, 11) or darker
  - 深い黒、微かな FBM ノイズのみ

Accent: Controlled Fire
  - Visual: Amber (#f2b869)
  - Code: Syntax colors（控えめに）
  - Motion: Kinetic trails（動的）
  - Identity: Brand palette（調和）

Contrast: High but controlled
  - 光と影の dramatic な対比
  - ただし「叫ばない」レベル
```

### 撮影/作成時の注意

```
DO:
✅ Pitch Black 背景を徹底
✅ 技術的証拠を明確に
✅ 各スキルの「本質」を視覚化
✅ 世界観の統一

DON'T:
❌ Bright/colorful 背景
❌ 装飾的な要素の追加
❌ 「カッコよさ」優先
❌ 汎用的な Stock photo 感
```

---

## 📚 参照リソース

### Art Direction 原則

```
Level 5 の Craft:
「すべての要素に意図がある。
 404 ページ、Loading、そして Skills の画像まで。
 何も "とりあえず" は存在しない。」

GLOBAL.md より:
> 細部が Level 5 を作る。
> 「ユーザーは気づかないから」は Level 3 止まり。
```

### Award-Worthy References

- **Active Theory**: すべての要素が世界観を語る
- **Aristide Benoist**: Craft details への執着
- **Locomotive**: 一貫したビジュアル言語

---

## 🚨 注意事項

### 世界観の維持

```
重要:
- Skills ページだけが浮いてはいけない
- Hero shader、Works、すべてが Pitch Black & Fire
- この画像変更で世界観が「完成」する
```

### パフォーマンス

```
画像サイズ:
- 推奨: 1200x1500px（aspect-ratio 4/5 対応）
- Format: .jpg（最適化済み）
- サイズ: <500KB（spotlight 画像を参考）
```

### Accessibility

```
Alt text 基準:
- Descriptive（内容を正確に説明）
- 50-100 characters
- 「写真」「画像」等の冗長語を避ける

良い例:
"Three.js shader code with live browser preview"

悪い例:
"Image of code"
```

---

## 📝 成果物

### 1. 新規画像ファイル

```
/apps/web/public/skills/
├── visual-photo.jpg        (Visual & Photo Direction)
├── code-interaction.jpg    (Code & Interaction Systems)
├── motion-sound.jpg        (Motion & Sound Layering)
└── identity-systems.jpg    (Identity & Systems)
```

### 2. portfolio.ts 更新

- multiskillItems の media.src を更新
- Alt text を descriptive に

### 3. README.md 更新

```markdown
## Phase 1: Quick Wins

### 完了タスク
- ✅ Task 1.5: Skills ページ画像キュレーション
  - すべての画像を Pitch Black & Fire に統一
  - 各スキルの技術的証拠を可視化
  - Level 1-2 → Level 4
```

---

## 📊 Excellence Level への貢献

### Before（現状）

```
Skills Section:
  - Level: 1-2（機能していない）
  - Craft Details: Level 1（無意図な選定）

Site Overall:
  - Award-Worthy Checklist: 3/18
  - "Craft" Test: FAIL
  - "Coherence" Test: FAIL
```

### After（完了後）

```
Skills Section:
  - Level: 4（意図的な選定、技術証明）
  - Craft Details: Level 4（すべてに意図）

Site Overall:
  - Award-Worthy Checklist: 5/18 (+2)
  - "Craft" Test: PASS
  - "Coherence" Test: PASS
  - Level 5 への道が開く
```

---

**Status:** 🔜 Not Started
**Assigned:** -
**Started:** -
**Completed:** -

---

## 💡 なぜこのタスクが重要か

**GLOBAL.md より:**
> Level 5 への道:
> Level 1-2: 動作する → 却下（やり直し）
> Level 3: 洗練されている → 不十分（改善必須）
> **Level 4: 差別化されている → 許容（最低ライン）**
> Level 5: 受賞レベル → 目標達成

現在の Skills 画像は Level 1-2。**却下レベル**です。

このタスクで Level 4 に到達し、Award-Worthy への道を確保します。

**Art Direction スキルより:**
> 細部への執着（見えない部分まで）
> これが Level 5 への要件。

Skills の画像は「見える」部分です。
ここが Level 1-2 では、Level 5 は絶対に達成できません。
