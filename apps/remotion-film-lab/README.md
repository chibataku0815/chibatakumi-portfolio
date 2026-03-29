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
# G2 / Route C: 代表フレーム PNG（MP4 再エンコードなし。ブラウザキャプチャと並べやすい）
bun run still:grade           # samples/grade-props.json · frame 45 → out/stills/grade-default-f45.png
bun run still:grade:nolut     # LUT なし・同一 grade（samples/grade-props-g2-no-lut.json）→ grade-g2-nolut-f45.png
bun run still:grade:img0513   # 動画ソースありのとき（上記 MOV 必須）
```

`render:*` / `still:*` は **`--gl=angle`** を付与（ヘッドレスでの WebGL 安定化）。別バックエンドを試す場合は [Chromium flags](https://www.remotion.dev/docs/chromium-flags) を参照。

## ブラウザ Film Lab との差（Tier A）

同じ **JSON / `film-lab-core` の props** でも、**画が一致するとは限らない**。`GradeScene.tsx` は **多パス**（grade+LUT → bloom（しきい値＋H/V ブラー @ 1/2 解像度）→ halation（同 @ 1/4）→ composite）で `apps/web` の `Viewport.ts` と**同順**に寄せ、`bloom` / `halation` / `blur` / `composite` シェーダは web 本番と同一ソースを import。**残る差**: Pass1 の LUT は Remotion 用 **2D パック**、ブラウザ本番は **3D LUT**／色空間・GL 実装差・split tone 未配線など。詳細は life `docs/guides/2026-04-01-film-lab-remotion-film-aesthetic-gap-verification-handoff.md`。目視比較は `docs/remotion-film-lab-g2-golden.md`。

## 動画ソース（任意）

- props に **`gradeSourceVideoRelPath`**（`public/` 相対）と、任意で **`gradeSourceVideoWidth` / `gradeSourceVideoHeight`**（**初回フレーム前のプレースホルダ**用。実際のキャンバス縦横は **デコード後の実寸**から長辺 1920 に収まるよう決定する）を渡すと、静止画の代わりに **`@remotion/media` の `Video`（headless）** でフレームを取り込む。
- 各フレームは **デコード後の実寸**で **object-fit: cover** 相当に Canvas へ描く（`drawImage` の一発伸縮は行わない。コンテナメタと実ピクセルが違うと従来は破綻していた）。
- テクスチャは長辺 **1920px** に縮小した `CanvasTexture`（メモリ対策）。例: `samples/grade-props-IMG0513.json`。
- `public/videos/*.MOV` は `.gitignore` 対象。検証時はデスクトップ等から `public/videos/` へコピーする。

## グレードのうち Remotion で効くもの

- **適用される**: 露出・コントラスト・彩度・色温度、`tint`、`rgbShift`、`fade`、`highlights`、`shadows`、**LUT**、`vignette` / `grainIntensity`（composite）、`bloomThreshold` / `bloomStrength` / `bloomRadius`、`halationIntensity` / `halationSpread` / `halationHue`（**多パス**: web `Viewport` と同型のしきい値＋ガウス風ブラー 2 パス／解像度スケールも同様）。
- **適用されない（無視）**: `shadowHue` / `highlightHue` ベースのスプリットトーン（将来拡張）。

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
