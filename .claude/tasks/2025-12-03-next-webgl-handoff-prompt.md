# 2025-12-03 Next.js/WebGL 保守性ハンドオフ (Haiku 4.5)
- Created: 2025-12-03T00:31:31+09:00 (Asia/Tokyo)
- Purpose: 次チャットで Claude Code (haiku 4.5) に渡す実装プロンプト。Hero背景の写真ベースノイズ調和を維持したまま、ディレクトリとシェーダ構成を再整理し保守性を高める。
- Constraints: コミット禁止。ビルド/リンター不要。最小差分で apps/web/ 配下のみを編集。
- App context: Next.js App Router / Tailwind v4 (configレスで @tailwindcss/postcss) / TS / alias `@/* -> ./src/*`。Hero背景は `HeroShaderBackground.tsx`（Three.js, shader内で hero.jpg contain）。画像外は平均暗部＋端ブラーをFBM+ノイズで補完。Amberリークなし。ノイズ振幅は写真分散サンプルで動的決定。

## 実装ゴール
- `components/canvas` と `lib/shaders` を起点に、Three/GLコードとシェーダユーティリティを分離して再利用しやすくする。
- Hero背景の見た目（暗部トーン・粒度・contain配置）を維持し、fbm/noiseを共通化、パラメータをconfigで一元管理。
- GLフォールバック（黒ベース簡素）を維持。Tailwind拡張は必要最小限。

## Claude Code (haiku 4.5) への指示テンプレ
```
あなたはNext.js + Tailwind + shadcn/ui + Three.jsの実装担当です。以下を最小差分で行ってください。ビルド/リンター実行は不要。コミットは絶対にしないでください。

目的:
- Hero背景の写真ベースノイズ調和を維持しつつ、ディレクトリ/シェーダ構成を整理して保守性を高める。
- fbm/noiseやパラメータを共通化し、config経由で調整できるようにする。

前提:
- 作業パスは `apps/web/` 配下。App Router / Tailwind v4 (configレスでCSS変数) / TS / alias `@/* -> ./src/*`。
- 画像は shader 内で object-contain/中央表示。DOM側 <img> は使わない。
- 背景は平均暗部＋端ブラーをベースにFBM+ノイズで補完。Amberリークは入れない。

必須タスク:
1) ディレクトリ/モジュール整理
   - `src/components/canvas/` に Three/GL関係をまとめる（HeroShaderBackground をここへ移動or分割）。
   - `src/lib/shaders/` に GLSL/JSユーティリティを配置。fbm/noise共通コードと色抽出ロジックを分割。
   - `src/lib/shaders/config.ts` 的ファイルにシェーダパラメータを集約（暗化係数、edgeFade、blend距離、coarse/fine上限など）。
   - Tailwind拡張が必要なら `src/styles` または `src/lib/theme` に最小限で追加。

2) HeroShaderBackground の保守性向上
   - fbm/noise/ハッシュを共通ユーティリティからimportする形にリファクタ。
   - 粒度/明度/フェード幅/ノイズ係数などの値を config で定義し、ShaderMaterial側は参照のみ。調整ポイントに最小限のコメントを入れる（何を調整するかだけ）。
   - テクスチャ/ユニフォームの型定義や構造を `lib/shaders` に切り出し、configと合わせて再利用しやすくする。
   - GLフォールバックは現行の黒ベース簡素表示を維持。

3) 出力時の要件
   - 変更ファイル一覧と要点を述べる。
   - ノイズ/明度/フェード幅を調整する場所（config内のキー）を明記。
   - コミット禁止・ビルド/リンター不要を再掲。

守ること:
- Tailwindユーティリティ追加は必要最小限（レイアウト/タイポ程度）。
- Heroの見た目（暗部トーン・粒度感）を壊さない。パラメータ変更は小さく。
- 新規環境変数や設定ファイル追加は避ける（必要なら明示する）。
```
