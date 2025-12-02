# 2025-12-03 Handoff Prompt — Next.js構成とWebGL保守性
- Created: 2025-12-03T00:07:57+09:00 (Asia/Tokyo)
- Purpose: 次チャットでの指示テンプレ。現状のHero背景実装を踏まえ、ディレクトリ設計とWebGL保守性を整備するための具体プロンプト。

## 現状サマリ
- 背景: `HeroShaderBackground.tsx`（Three.js, shader内でhero.jpgをcontain表示）。写真外周は写真の平均暗部色＋端ブラーをFBM+ノイズで補完。Amberリークなし。
- 写真: 前景DOMでobject-contain/中央表示。余計なフェードやCSSノイズは外して背景に寄せる方針。
- ノイズ: 写真の分散をサンプリングし、grain振幅を動的決定（coarse/fineを同じ振幅で最終色にも加算）。

## 次の課題
1) Next.jsディレクトリ設計を再整理  
   - 提案: `apps/web/src` 配下で `components/ui`（shadcn/ui系）、`components/canvas`（WebGL/Three用）、`lib/shaders`（GLSL/JSシェーダユーティリティ）、`styles`（Tailwind拡張/テーマ）に整理。  
   - App Router構成に合わせて、レイアウト/ルート別にセクションコンポーネントを分離。

2) WebGL保守性の確保  
   - シェーダ断片を分割（fbm/noise共通ユーティリティ、色抽出ロジック）し、再利用しやすい構造へ。  
   - テクスチャ/ユニフォームの型定義、パラメータ（暗化率・ノイズ係数・フェード幅）をまとめた config を `lib/shaders/config.ts` 的な形で外出し。
   - GLフォールバック（CSS）を簡素に維持。

## 次チャット用プロンプト（貼り付け用）
```
あなたはNext.js + Tailwind + shadcn/ui + Three.jsのフロントエンドエンジニア/WebGLエンジニアです。以下を最小差分で実施してください。

目的:
- ディレクトリを再設計し、WebGLシェーダを保守しやすい構造にする。
- 現行のHero背景(写真ベースのノイズ調和)を維持しつつ、設定値やユーティリティを分離して再利用性を高める。

必須要件:
1) ディレクトリ/モジュール整理
   - `components/canvas` に Three/GL まわりを集約。
   - `lib/shaders/` にシェーダユーティリティ（fbm/noise共通コード、色抽出、ノイズ係数設定）を分割。
   - `styles/` または `lib/theme` に Tailwind拡張/トークンを整理（必要最小限）。

2) HeroShaderBackground の保守性向上
   - fbm/noise関数を共通ユーティリティへ移動し、importして使う形にリファクタ。
   - 粒度/明度/フェード幅などのパラメータを config として一元管理（暗化係数、edgeFade、blend距離、coarse/fine上限など）。
   - コメントを最小限で残し（何を調整するパラメータか）、GLフォールバックは現行の黒ベースで維持。

3) 写真描画
   - 画像は shader 内で contain/中央表示のまま（DOM側 <img> は使わない）。
   - 背景は写真平均暗部＋端ブラーをベースにFBM+ノイズで補完。Amberリークは入れない。

守ること:
- コミット禁止・ビルド/リンター不要。
- Tailwindユーティリティは必要最低限（レイアウト/タイポ程度）。
- 既存のHero見た目（粒度感・暗部トーン）を壊さないよう、パラメータ変更は小さく行う。

出力:
- 変更ファイル一覧と要点の説明。
- ノイズ/明度パラメータの調整箇所（どのconfigで触るか）を明記。
```
