# G2 ゴールデン比較メモ（CD ゲート）

> 2026-03-29 | 初期版

## 現状スコープ

- Remotion 側は **解析グレード**（露出・コントラスト・彩度・色温度）のみの GLSL100 シェーダ。
- Film Lab ブラウザは **8-pass**（Bloom / Halation 等を含む）。
- よって **ピクセル一致は求めない**。G2 の第一版は「同じ `grade` 数値を入れたとき、**全体的なトーンの方向が近いか**」の目視比較とする。

## 手順（人手）

1. `apps/web/public/images/film-lab/default.jpg` を Film Lab で開き、Portra プリセット（または `samples/grade-props.json` と同じ数値）を適用。
2. スクリーンショット 1 枚保存。
3. `apps/remotion-film-lab/out/grade.mp4` から代表フレームを切り出し。
4. 並べて **許容差メモ**をここに追記（例: 「ハイライトが Remotion 側やや硬い」等）。

## 次フェーズ

- `.cube` LUT を Remotion 側に載せたあと、G2 を **再実行**し、許容差を更新する。
