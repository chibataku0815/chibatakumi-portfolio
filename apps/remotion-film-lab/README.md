# remotion-film-lab

Film Lab のルック定義（`film-lab-core`）を Remotion で書き出すサブプロジェクト。

## 前提

- リポジトリルートで `bun install`（`postinstall` で `film-lab-core` がビルドされる）
- `public/film-lab-default.jpg` — スパイク用プレースホルダ画像（`apps/web` の default と同源）

## コマンド

```bash
# ルートから
cd apps/remotion-film-lab
bun run dev          # Studio
bun run render:spike # Phase 0 — props 上書きの短尺 MP4 → out/spike.mp4
bun run render:grade # Phase 2+ — 解析グレード + 任意 .cube LUT + cover AR → out/grade.mp4
bun run render:grade:img0513 # サンプル: `public/videos/IMG_0513.MOV`（手元コピー必須）→ out/grade-img0513.mp4
```

`render:*` は **`--gl=angle`** を付与（ヘッドレスでの WebGL 安定化）。別バックエンドを試す場合は [Chromium flags](https://www.remotion.dev/docs/chromium-flags) を参照。

## 動画ソース（任意）

- props に **`gradeSourceVideoRelPath`**（`public/` 相対）と、任意で **`gradeSourceVideoWidth` / `gradeSourceVideoHeight`**（**初回フレーム前のプレースホルダ**用。実際のキャンバス縦横は **デコード後の実寸**から長辺 1920 に収まるよう決定する）を渡すと、静止画の代わりに **`@remotion/media` の `Video`（headless）** でフレームを取り込む。
- 各フレームは **デコード後の実寸**で **object-fit: cover** 相当に Canvas へ描く（`drawImage` の一発伸縮は行わない。コンテナメタと実ピクセルが違うと従来は破綻していた）。
- テクスチャは長辺 **1920px** に縮小した `CanvasTexture`（メモリ対策）。例: `samples/grade-props-IMG0513.json`。
- `public/videos/*.MOV` は `.gitignore` 対象。検証時はデスクトップ等から `public/videos/` へコピーする。

## グレードのうち Remotion で効くもの

- **適用される**: 露出・コントラスト・彩度・色温度、`tint`、`rgbShift`、`fade`、`highlights`、`shadows`、**LUT**、`vignette` / `grainIntensity`（ブラウザの composite パス相当・画面空間）。
- **適用されない（無視）**: `bloom*` / `halation*`（Web 側の多パス専用）、`shadowHue` / `highlightHue` ベースのスプリットトーン（将来拡張）。

## LUT（`.cube`）

- `public/luts/` に配置し、props の **`lutCubeRelPath`**（例: `luts/warm-cinematic.cube`）で指定。`lutEnabled` / `lutIntensity` は任意（`film-lab-core` の Zod スキーマ参照）。
- WebGL1 では `sampler3D` を使わず、core の **`packCubeLutToFloatRgbaGrid`** で 2D テクスチャ化している（`packages/film-lab-core/docs/LUT_2D_PACKING.md`）。

## Compositions

| ID | 内容 |
|----|------|
| `FilmLookSpike` | テキスト props のみ（Phase 0・パイプライン smoke） |
| `FilmLookGrade` | `grade` + 任意 LUT + **ソース画像 cover**（1080×1920 コンポ） |

## Zod

Remotion 4 系は **zod 4.3.6** を期待するため、`film-lab-core` も同バージョンに揃えています。
