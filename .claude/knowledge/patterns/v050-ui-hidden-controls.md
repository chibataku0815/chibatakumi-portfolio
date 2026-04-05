# v0.5.0 UI Hidden Controls

v0.5.0 で非表示にした UI コントロールの一覧と理由。
コードは残存しており、params は正常に動作する（プリセットや保存済み URL 経由で値が入る）。

## 非表示コントロール

### PROCESS セクション（FilmLabControlPanelCore.tsx）

| コントロール | params key | 理由 |
|-------------|-----------|------|
| ハイライトの柔らかさ (toggle) | compressionAmount | ほぼ使われていない |
| 強さ (slider) | compressionAmount | compression toggle 配下 |
| 階調の広がり (slider) | compressionRange | compression toggle 配下 |
| 仕上げのコントラスト (slider) | printContrast | ほぼ使われていない |

### POST EFFECTS セクション（廃止）

| コントロール | params key | 理由 |
|-------------|-----------|------|
| Light Shafts toggle + 4 sliders | shaftIntensity, shaftDecay, shaftOriginX, shaftOriginY | 品質不足（v0.6 defer） |
| ホコリ (slider) | dustAmount | 品質不足（v0.6 defer） |
| スクラッチ (slider) | scratchAmount | 品質不足（v0.6 defer） |

### 移動したコントロール

| コントロール | params key | 移動元 | 移動先 |
|-------------|-----------|--------|--------|
| 残像の強さ (slider) | motionBlurAmount | POST EFFECTS セクション | ARTIFACTS セクション末尾 |
| LUT パネル (Creative + Log) | — | パネル最下部（全モード共通） | Pro: プリセット直下 / Quick: 従来位置に残留 |

## Renderer Guard

`Viewport.ts` の `hasPostCompositeChain()` は `motionBlurAmount > 0` のみをチェック。
Shafts/Dust/Scratch は renderer レベルでも無効化済み。

## 復活時の注意

- UI 復活: JSDoc コメントで隠した箇所をマーク済み
- Renderer 復活: `hasPostCompositeChain()` の条件を戻す
- State: `compressionAmountEnabled`, `toggleCompressionAmount` 等のロジックは残存（再利用可能）
- `postEffectsOpen` state は削除済み → POST EFFECTS セクション復活時に再追加が必要
