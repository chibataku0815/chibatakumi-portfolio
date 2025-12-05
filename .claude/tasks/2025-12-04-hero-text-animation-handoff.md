# Hero Text Animation 引き継ぎプロンプト

## 現状

### 完了済み
- Hero背景シェーダー実装済み (`apps/web/src/features/hero/shader/`)
- HeroText.tsx: GSAPによる基本アニメーション（blur-to-sharp reveal, scroll parallax）
- 色収差/グリッチ/グローエフェクトは**全て削除**（品質が低かったため）

### 問題点
テキストエフェクトの実装が「素人的」「小学生レベル」と評価された。

具体的な失敗:
1. **SVG Displacement Filter**: 派手すぎるグリッチ、常時動作、制御不能
2. **Three.js Glow Layer**: 効果が見えない or 見えすぎる極端な結果
3. **Chromatic Aberration**: 赤/シアンの色収差が安っぽい

根本原因:
- パラメータ調整の経験不足
- リファレンス実装なしでの手探り
- 「エレガント」の具体的な視覚基準が不明確

---

## サンプル実装の配置

### 構造
```
apps/
├── web/                    # 本番プロジェクト
├── example01/              # サンプル実装 1
│   ├── src/                # 実装コード
│   └── transcript.md       # YouTube解説動画の文字起こし
├── example02/              # サンプル実装 2
│   ├── src/
│   └── transcript.md
└── ...
```

### 学習手順
1. `apps/exampleXX/transcript.md` を読んで概念・意図を理解
2. `apps/exampleXX/src/` のコードを分析
3. 本番 `apps/web/` への適用方法を検討

---

## 現在のコード状態

### HeroText.tsx (クリーン状態)
```
apps/web/src/features/hero/components/
├── HeroText.tsx          # GSAPアニメーションのみ
├── HeroShaderBackground.tsx
└── index.ts
```

主要な実装:
- `splitText()` で文字分割
- blur-to-sharp reveal (0→8px blur, 16px→0 Y移動)
- ScrollTrigger parallax
- エフェクトコンポーネントは削除済み

### 背景シェーダー
```
apps/web/src/features/hero/shader/
├── config/hero.ts        # パラメータ
├── lib/                  # noise, fbm等
├── materials/            # vertex/fragment shader
└── types.ts
```

---

## 次のタスクへの指示

```
## コンテキスト
- Hero背景シェーダーは実装済み
- テキストエフェクトは白紙状態（クリーン）
- `apps/exampleXX/` にサンプル実装とYouTube文字起こしを配置済み

## タスク
1. `apps/exampleXX/transcript.md` を読んで概念を理解
2. `apps/exampleXX/src/` のコードを分析
3. 学んだ内容を `apps/web/` のHeroTextに適用する方法を提案（実装前に確認）
4. 承認後、実装

## 制約
- コミットしない
- 実装前に必ずアプローチを説明して承認を得る
- サンプルの手法・パラメータを尊重する
```

---

## 補足: 失敗から学んだこと

### やってはいけないこと
- `Math.random()` を毎フレーム呼ぶグリッチ
- `rgba(255, 0, 64)` / `rgba(0, 212, 255)` の原色色収差
- `scale: 15-25` のような大きすぎるdisplacement
- 常時アニメーションするノイズ

### 目指すべきこと
- サンプル実装のパラメータ・手法を参考にする
- 文字起こしで説明されている意図を理解する
- 「なぜそのパラメータか」を理解してから実装する
