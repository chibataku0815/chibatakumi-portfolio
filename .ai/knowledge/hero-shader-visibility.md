# Hero Shader 写真可視性ナレッジ

## object-contain vs object-cover

### 問題
`object-contain` はアスペクト比が異なる場合に大きな暗い余白を生み、写真がほぼ認識できなくなる。

### GLSL実装
```glsl
// object-cover (推奨: 画面全体に写真が広がる)
if (screenAspect > imageAspect) {
    photoScale = vec2(1.0, screenAspect / imageAspect);
} else {
    photoScale = vec2(imageAspect / screenAspect, 1.0);
}

// object-contain (写真を全て表示、余白あり)
if (screenAspect > imageAspect) {
    photoScale = vec2(imageAspect / screenAspect, 1.0);
} else {
    photoScale = vec2(1.0, screenAspect / imageAspect);
}
```

## Config値と視覚的影響

| パラメータ | 暗すぎ | 推奨 | 効果 |
|-----------|--------|------|------|
| baseColorDarken | 0.55 | 0.72 | 背景の明るさ |
| edgeColorDarken | 0.6 | 0.78 | エッジブラー色の明るさ |
| saturationRetain | 0.6 | 0.78 | 彩度維持率 |
| edgeFade | 0.18 | 0.08 | 写真エッジのフェード幅 |
| blendToBaseDistance | 0.32 | 0.18 | 背景への遷移距離 |
| minBrightness | 0.06 | 0.03 | 黒潰れ防止閾値 |

## CSSオーバーレイとの相互作用

シェーダーの上にCSSグラデーションが乗る場合、**掛け算効果**で写真が消える:
- シェーダー暗化 50% × CSSオーバーレイ 92% = 写真の4%しか見えない

### 推奨グラデーション
```
BEFORE: linear-gradient(180deg, rgba(6,7,9,0.12), rgba(6,7,9,0.52) 34%, rgba(6,7,9,0.92) 84%)
AFTER:  linear-gradient(180deg, rgba(6,7,9,0) 0%, rgba(6,7,9,0.15) 45%, rgba(6,7,9,0.5) 80%, rgba(6,7,9,0.72) 100%)
```

テキスト可読性は `text-shadow` で補完:
```css
text-shadow: 0 2px 28px rgba(0,0,0,0.45), 0 0 80px rgba(0,0,0,0.25);
```

## Prismatic Dispersion の輝度影響

7サンプルスペクトル分散は `spectralWeight` でRGBウェイトをかけて正規化するため、**輝度は落とさない**。分散が小さい場合は `photoColor ≈ 元画像の色` となる。

## ナビデザインとの統合

ヒーロー全画面では**ナビは透明バー**が必須:
- ピル型コンテナ (border + bg + rounded-full) は写真と断絶する
- `bg-transparent` + テキストのみで背景に溶け込む
