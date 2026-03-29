# Film Lab — 動画 CI の扱い・ヘッドレス Linux（参考）

> **更新**: 2026-03-29  
> **GitHub Actions `film-lab-ci`**: **撤去済み**（push/PR が長時間ブロックされるのを避けるため）。Remotion の短尺レンダー・静止画は **手元** または **life** リポの `scripts/verify-film-lab-remotion.sh` で確認する。  
> **`render:grade:img0513` を CI に入れる話**は従来どおり、`public/videos/*.MOV` がリポに無いと必ず失敗するため **デフォルトの自動 CI には向かない**。

## Linux ヘッドレスで `render:grade` 等を叩くとき（参考）

GitHub-hosted `ubuntu-latest` やディスプレイの無い Linux では、Chromium が **WebGL context を作れず** `render:grade` 等が失敗することがある。過去に CI で使っていた構成は次のとおり（**手元の Docker / 無頭マシンでも同様**）。

- **`xvfb`** と Mesa / Chromium 向け共有ライブラリを `apt-get` する  
- 各 Remotion コマンドを **`xvfb-run -a`**（例: `--server-args="-screen 0 1920x1080x24"`）で包む  
- 環境変数 **`LIBGL_ALWAYS_SOFTWARE=1`** でソフトウェア GL（llvmpipe 等）を明示すると通りやすい  

## 将来「CI に戻す」場合の選択肢

| 方式 | 内容 | 注意 |
|------|------|------|
| **A. テスト用ミニ MP4 をリポにコミット** | 数秒・低解像・ライセンスクリアなクリップを `public/videos/ci-smoke.mp4` のように置き、`render:grade:img0513` 相当の props を CI 専用にする | リポサイズ増・LFS 要否を検討 |
| **B. 条件付きジョブ** | `workflow_dispatch` または `paths` で `apps/remotion-film-lab/**` 変更時だけレンダーを実行 | 本番ブランチの毎回実行とは切り離せる |
| **C. 手元・life スクリプト** | `life/scripts/verify-film-lab-remotion.sh` は動画を含めない既定。大型 MOV の検証は handoff の手順のまま | **現行運用** |

## 参照

- life `docs/guides/2026-03-29-film-lab-remotion-next-session-handoff-full.md` §3.4 / §7 item 6
