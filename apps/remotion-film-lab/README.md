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
bun run render:grade # Phase 2 — 解析グレード + Three → out/grade.mp4
```

`render:*` は **`--gl=angle`** を付与（ヘッドレスでの WebGL 安定化）。別バックエンドを試す場合は [Chromium flags](https://www.remotion.dev/docs/chromium-flags) を参照。

## Compositions

| ID | 内容 |
|----|------|
| `FilmLookSpike` | テキスト props のみ（Phase 0） |
| `FilmLookGrade` | `film-lab-core` の `grade`（露出・コントラスト・彩度・色温度）を GLSL100 で適用 |

## Zod

Remotion 4 系は **zod 4.3.6** を期待するため、`film-lab-core` も同バージョンに揃えています。
