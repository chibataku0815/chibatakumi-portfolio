# 2025-12-03 Hero背景/写真親和メモ (shaderベース)
- Created: 2025-12-03T00:07:57+09:00 (Asia/Tokyo)
- Scope: Heroセクションの背景と写真の粒度・色を一致させるための実装メモ（現在のapps/web状態）

## 実装ポイント
- 背景はThree.jsシェーダー `HeroShaderBackground` で生成。写真は同一テクスチャ1枚のみロード。
- 表示: 画像をobject-contain相当で中央表示。画像外は写真の平均暗部色と端ブラーをベースにFBM+ノイズで補完。
- Amberリーク: 背景ではオフ（写真側の色だけで統一）。

## シェーダー概要（HeroShaderBackground.tsx）
- `uTextureSize`/`uResolution`でアスペクト計算し、contain配置のphotoUvを算出。
- `sampleAverageColor`: 画像内側グリッドから暗部重みで平均色を取得 → 彩度50%、明度25%へ暗化（ベース色）。
- `blurSample`: 5x5サンプリングで端から少し内側をブラー取得（edgeColor、明度45%程度）。
- outsideDistを元に edgeColor → baseColor へ0〜25%距離でスムーズに遷移。
- FBMは控えめ（uv*1.5、変動±15%）で暗部の揺らぎを付与。
- ノイズ: coarse 0.03、fine 0.015（写真粒度に合わせる）。
- ソフトエッジ: 画像端から0.1幅でフェードし、photoとbgをミックス。

## フロント側
- 背景は layout.tsx で `HeroShaderBackground` を固定描画。
- Hero画像は page.tsx で `object-contain`/中央揃え、フェードや余計なCSSノイズは付けず、背景に統一。

## 注意点 / 調整ノブ
- 粒度: coarse/fine を上下（例: 0.03/0.015 基準）。
- ベース暗さ: `sampleAverageColor` の明度係数（現在0.25）で調整。
- フェード幅: edgeFade（0.1）を広げると境界がさらに馴染む。
- Amberリークを入れる場合は別レイヤーで追加（現在はなし）。
