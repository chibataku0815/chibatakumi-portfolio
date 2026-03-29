# Film Lab CI — 動画レンダー（`render:grade:img0513`）を入れるか

> **更新**: 2026-03-31  
> **結論（現行）**: **デフォルトの `film-lab-ci.yml` には含めない。** `public/videos/*.MOV` がリポに無いと必ず失敗するため。  
> **代わりに常時回すジョブ**: `render:spike` と `render:grade`（静止画 + LUT・`samples/grade-props.json`）。

## Linux / GitHub Actions

GitHub-hosted `ubuntu-latest` には実ディスプレイがないため、Chromium が **WebGL context を作れず** `render:grade` 等が失敗することがある。`.github/workflows/film-lab-ci.yml` では **xvfb** と Mesa / Chromium 依存パッケージを `apt-get` したうえで、各 Remotion コマンドを **`xvfb-run -a`** で実行する。

## 将来 CI に入れる場合の選択肢

| 方式 | 内容 | 注意 |
|------|------|------|
| **A. テスト用ミニ MP4 をリポにコミット** | 数秒・低解像・ライセンスクリアなクリップを `public/videos/ci-smoke.mp4` のように置き、`render:grade:img0513` 相当の props を CI 専用にする | リポサイズ増・LFS 要否を検討 |
| **B. 条件付きジョブ** | `workflow_dispatch` または `paths` で `public/videos/**` 変更時だけ動画レンダーを実行 | 本番ブランチの毎回実行からは外れる |
| **C. 手元・life スクリプト** | `life/scripts/verify-film-lab-remotion.sh` は動画を含めない。大型 MOV の検証は handoff §5.2 の手順のまま | 現状運用 |

## 参照

- `.github/workflows/film-lab-ci.yml`
- life `docs/guides/2026-03-29-film-lab-remotion-next-session-handoff-full.md` §3.4 / §7 item 6
