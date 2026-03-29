# G2 ゴールデン比較メモ（CD ゲート）

> 更新: 2026-03-29（LUT・cover AR 追記）

## 現状スコープ

- Remotion 側は **解析グレード**（露出・コントラスト・彩度・色温度）に加え、**任意の `.cube` 3D LUT**（WebGL1 向け **2D パック＋トリリニア**）を適用できる（`GradeScene.tsx`）。
- **ソース画像**はコンポ解像度（1080×1920）に対して **object-fit: cover** 相当（縦横比維持・はみ出しは黒レターボックス）。`grade.mp4` の「伸び」はこの契約で抑える。
- Film Lab ブラウザは **8-pass**（Bloom / Halation 等）および **ユーザー読み込み LUT** パイプ。Remotion の LUT は `public/luts/*.cube` を props の `lutCubeRelPath` で指定（サンプルは `samples/grade-props.json`）。
- **ピクセル一致は求めない**。G2 はトーン方向・LUT の「かかり方」の目視と、ここへの許容差メモ。

## 手順（人手）— G2-1（LUT なし比較）

1. `apps/web/public/images/film-lab/default.jpg` を Film Lab で開き、Portra プリセット（または `samples/grade-props.json` と同じ数値）を適用。**LUT はブラウザ側で読み込まない**。
2. スクリーンショット 1 枚保存。
3. `samples/grade-props.json` から **`lutCubeRelPath` / `lutEnabled` / `lutIntensity` を一時的に削除**した JSON で `render:grade` した `out/grade.mp4` から代表フレームを切り出し。
4. 並べて **許容差メモ**を §「許容差ログ」に追記。

## 手順（人手）— G2-2（LUT あり）

1. ブラウザ Film Lab で **同じ `warm-cinematic.cube`**（`apps/web/public/luts/warm-cinematic.cube`）を読み込み、**同じ解析グレード数値**（Portra 相当）を適用。
2. スクリーンショット 1 枚。
3. 既定の `samples/grade-props.json`（`luts/warm-cinematic.cube` 指定あり）でレンダした `out/grade.mp4` から代表フレームを切り出し。
4. 並べて **LUT 周りの差分**（彩度の乗り・シャドウの分離など）を §「許容差ログ」に追記。  
   - 差分要因例: ブラウザは 8-pass 後に LUT、Remotion は **解析グレード後にのみ LUT**（パイプ順の差）。

## 許容差ログ

| 日付 | 比較 | メモ |
|------|------|------|
| （追記用） | G2-1 / G2-2 | |

## 参照

- `packages/film-lab-core/docs/LUT_2D_PACKING.md` — LUT の 2D パック仕様
- `ideas/status/...`（life リポ）— 検証ラダー・CD ゲートの正本が life 側にある場合はそちらを優先

## 次フェーズ

- Viewport 収斂（ブラウザのクロップ中心と Remotion の cover の **ピクセル単位の対応表**）を詰めたら G2 を再実行。
- CI で `render:grade` が通ることを常時確認（`.github/workflows/film-lab-ci.yml`）。
