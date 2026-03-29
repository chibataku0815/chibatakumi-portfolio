# Film Lab — プリセット品質テストコーパス

このディレクトリは **プリセットの見た目をレビュー・回帰するための参照画像**を置く場所です。  
life 側の計画: `docs/guides/2026-03-31-film-lab-preset-quality-master-plan.md`

## 現在のファイル（例）

| ファイル | 説明 |
|----------|------|
| `landscape_reference_01.jpg` | `public/images/film-lab/default.jpg` と同一の参照（コミット推奨） |
| `technical_smptebars_01.png` | SMPTE カラーバー（小容量・コミット推奨） |
| `night_street_synthetic_01.png` | 暗い単色ベース（夜景系の粗いスタンドイン） |
| `pattern_testsrc2_01.png` | ffmpeg testsrc2（パイプライン負荷用） |
| `*_synthetic_01.png`（ノイズ付き） | `.gitignore` 対象。`generate-synthetic-corpus.sh` で再生成 |

## 合成画像の再生成

```bash
cd apps/web/src/features/interactive/film-lab/preset-quality-corpus
chmod +x ./generate-synthetic-corpus.sh   # 初回のみ
./generate-synthetic-corpus.sh
```

**要件**: `ffmpeg`（Homebrew 等）

## Safari で PNG が開けないとき

- ディスプレイ ICC 付きスクリーンショット（CleanShot `@2x` 等）で、**Chrome は通るが Safari だけ `Image` が落ちる**ことがある。Film Lab は `createImageBitmap` フォールバックを試す（`MediaLoader.ts`）。
- 詳細ログ: Film Lab の URL に **`?filmLabDebugMedia=1`** を付けて開き、コンソールを確認（例: `http://localhost:3000/film-lab?filmLabDebugMedia=1`）。
- それでもダメなら **プレビュー等で JPEG 書き出し**（プロファイルを剥がす）。

## cinematic v2 の実写確認（Unsplash）

- life の手順書: `docs/guides/2026-03-31-film-lab-cinematic-verify-photo-set.md`（life リポジトリ）
- このディレクトリで `./fetch-verify-photos.sh` → `verify_*.jpg` が生成される（`.gitignore` のためコミットされない）

## Playwright でプリセット別 PNG を書き出す（Phase D）

`apps/web` で:

```bash
bun run e2e:install          # 初回: Chromium のみ
bun run e2e:preset-quality
```

- 出力: `snapshots/latest/{presetName}.png`（`snapshots/` は gitignore）
- テストは `landscape_reference_01.jpg` を Open 経由で読み込み、各プリセットボタンを順に押して `data-testid="film-lab-viewport"` を切り取る。

## 命名規則（推奨）

| 接頭辞 | 意味 |
|--------|------|
| `skin_natural_` | 自然光・肌 |
| `skin_event_` | イベント混合光 |
| `night_` | 夜景・街灯 |
| `office_` | 蛍光灯・オフィス |
| `highkey_` | 白飛びしやすいシーン |
| `green_` | 緑・森・芝 |
| `landscape_` | 風景・彩度試し |

## ライセンス

- **権利がクリアされた画像のみ**（自撮り・クライアント許諾・社内ストック）。外部から持ち込む場合はライセンスをこの README に追記する。
- 本ディレクトリの **ffmpeg 合成画像**は開発用のパターン素材（実在シーンの再現ではない）。

## 配置

- ノイズの大きい PNG は **コミットしない**（`.gitignore`）。CI では `generate-synthetic-corpus.sh` を先に実行する運用も可。
- 実写を追加したら、life の `ideas/status/2026-03-31-film-lab-preset-quality-photo.md` のマトリクス更新を検討。
