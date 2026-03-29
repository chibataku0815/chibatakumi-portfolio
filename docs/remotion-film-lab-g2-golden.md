# G2 ゴールデン比較メモ（CD ゲート）

> 更新: 2026-03-29 — LUT なし props 固定ファイル `grade-props-g2-no-lut.json`・`still:grade:nolut`・CI / life 一発検証への組み込み

## 現状スコープ

- Remotion 側は **解析グレード**（露出・コントラスト・彩度・色温度）に加え、**任意の `.cube` 3D LUT**（WebGL1 向け **2D パック＋トリリニア**）を適用できる（`GradeScene.tsx`）。
- **ソース画像**はコンポ解像度（1080×1920）に対して **object-fit: cover** 相当（縦横比維持・はみ出しは黒レターボックス）。`grade.mp4` の「伸び」はこの契約で抑える。
- Film Lab ブラウザは **8-pass**（Bloom / Halation 等）および **ユーザー読み込み LUT** パイプ。Remotion の LUT は `public/luts/*.cube` を props の `lutCubeRelPath` で指定（サンプルは `samples/grade-props.json`）。
- **ピクセル一致は求めない**。G2 はトーン方向・LUT の「かかり方」の目視と、ここへの許容差メモ。
- **パイプライン差の正本**: life `docs/guides/2026-04-01-film-lab-remotion-film-aesthetic-gap-verification-handoff.md`（ブラウザ 8-pass と Remotion 単パス近似の整理）。

## 手順（半自動）— G2-0（代表フレーム PNG / Route C）

目的: MP4 の再エンコードを挟まず **コンポ結果の静止画**でブラウザキャプチャと並べる。grain / halation の有無は **H.264 だけでは潰れる**ことがあるため、§「エンコード切り分け」とセットで見る。

```bash
cd apps/remotion-film-lab
# 既定 props（静止画ソース・LUT あり）· 45/90 フレーム（1.5秒相当）
bun run still:grade
# → out/stills/grade-default-f45.png（out/ は .gitignore）

# LUT なし・同一 grade 数値（G2-1 の Remotion 側参照用）
bun run still:grade:nolut
# → out/stills/grade-g2-nolut-f45.png（源: samples/grade-props-g2-no-lut.json）
```

動画サンプル `IMG_0513` を `public/videos/` に置いたうえで:

```bash
bun run still:grade:img0513
# → out/stills/grade-img0513-f45.png
```

別フレームを切りたいときは `package.json` の `--frame=` をコピーして変更する。

## 手順（人手）— G2-1（LUT なし比較）

1. `apps/web/public/images/film-lab/default.jpg` を Film Lab で開き、Portra プリセット（または `samples/grade-props.json` と同じ数値）を適用。**LUT はブラウザ側で読み込まない**。
2. スクリーンショット 1 枚保存。
3. Remotion 側は **`bun run still:grade:nolut`**（`samples/grade-props-g2-no-lut.json`）で PNG を生成。または `render:grade` した `out/grade.mp4` から代表フレームを切り出し。
4. 並べて **許容差メモ**を §「許容差ログ」に追記。

## 手順（人手）— G2-2（LUT あり）

1. ブラウザ Film Lab で **同じ `warm-cinematic.cube`**（`apps/web/public/luts/warm-cinematic.cube`）を読み込み、**同じ解析グレード数値**（Portra 相当）を適用。
2. スクリーンショット 1 枚。
3. 既定の `samples/grade-props.json`（`luts/warm-cinematic.cube` 指定あり）でレンダした `out/grade.mp4` から代表フレームを切り出し。
4. 並べて **LUT 周りの差分**（彩度の乗り・シャドウの分離など）を §「許容差ログ」に追記。  
   - 差分要因例: ブラウザは 8-pass 後に LUT、Remotion は **解析グレード後にのみ LUT**（パイプ順の差）。

## エンコード切り分け（Route C）

**問題意識**: H.264（デフォルトの低〜中ビットレート）では **grain・細い halation** が落ち、**シェーダ不足**と誤認しうる。

1. **PNG（`still:grade`）** で見た目を記録（エンコード前の参照）。
2. 同じコンポから **`render:grade` の MP4** を見る。
3. 必要なら **高ビットレート H.264** または **ProRes などロスレスに近い中間**で書き出し、PNG に近づくか確認（具体コマンドはプロジェクトの配信要件に合わせて追記。例: `ffmpeg` で同フレームを高ビットレート再エンコードして比較する）。

判定を G2 ログに **「エンコード条件」1 行**で残す（例: `crf 18` / ProRes 422 HQ など）。

## 自動検証（CI・life スクリプト）

次は **人の目視を要さず**に「パイプラインが壊れていない」ことの下限を担保する。

| 機構 | 内容 |
|------|------|
| portfolio CI | `film-lab-ci.yml` — `render:spike` / `render:grade` のあと **`still:grade`** と **`still:grade:nolut`** を実行し、両 PNG の存在を `test -f` で確認。 |
| life | `./scripts/verify-film-lab-remotion.sh` — 上記 MP4 に加え **同じ still 2 本**を既定で実行（`FILM_LAB_SKIP_REMOTION_STILLS=1` で省略可）。`public/videos/IMG_0513.MOV` があれば `still:grade:img0513` も実行。 |

**自動 Pass の意味**: Remotion が決定的にフレームを書き出せること。**ブラウザとの主観一致は含まない**（Tier A・docs/handoff 参照）。

## 許容差ログ

判定は **Pass**（Tier A として許容） / **Fail**（要修正） / **要検討**（環境差・主観）。スクリーンショットは任意のパスを記載。

| 日付 | 比較 | メモ |
|------|------|------|
| 2026-03-29 | G2-0（still・既定 props） | **自動 Pass（下限）** — `still:grade` → `grade-default-f45.png`。CI / life 検証に組み込み。ブラウザ主観並置は任意。 |
| 2026-03-29 | G2-0b（LUT なし・同一 grade） | **自動 Pass（下限）** — `still:grade:nolut` → `grade-g2-nolut-f45.png`。ブラウザとの目視は任意。 |
| 2026-03-31 | G2-1（LUT なし・目視） | **要検討** — Remotion 参照は G2-0b。ブラウザキャプチャとの並置・Pass/Fail は CD。 |
| 2026-03-31 | G2-2（LUT あり・目視） | **要検討** — 既知差: 8-pass 後 LUT（Web）vs 解析直後 LUT（Remotion）。並置は任意。 |
| （追記用） | G2-1 / G2-2 | CD: スクリーンショット保存パスと主観メモを追記 |

## 参照

- `packages/film-lab-core/docs/LUT_2D_PACKING.md` — LUT の 2D パック仕様
- **Viewport（ブラウザ）と Remotion cover の対応表**（life リポ）: `docs/guides/2026-03-31-film-lab-viewport-remotion-correspondence.md`
- `ideas/status/...`（life リポ）— 検証ラダー・CD ゲートの正本が life 側にある場合はそちらを優先

## 次フェーズ

- Viewport 収斂（ブラウザのクロップ中心と Remotion の cover の **ピクセル単位の対応表**）を詰めたら G2 目視を再実行。
- CI で `render:grade`・`still:grade`・`still:grade:nolut` が通ることを常時確認（`.github/workflows/film-lab-ci.yml`）。
- **判断の一本化**（改善の順序）: life `docs/guides/2026-03-29-film-lab-remotion-verified-low-touch.md`。
