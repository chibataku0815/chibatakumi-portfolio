# Remotion Film Lab — Phase 0 / スパイク記録

> 2026-03-29

## 実施内容

- `FilmLookSpike` コンポジションで CLI `--props` から JSON を渡し、タイトル文字列が焼き込まれる確認用 MP4 を生成。
- レンダー時は **`--gl=angle`** を使用（デフォルト SwiftShader では Three 系が失敗しうるため）。

## 成果物パス（ローカル・gitignore）

- `apps/remotion-film-lab/out/spike.mp4`（生成後）

## 次の検証候補

- `swiftshader` と `angle` の見え方差分を記録（別マシン・CI）
