# 2025-12-03 Typography Direction & Shader Brush-up Prompt (Haiku 4.5)
- Created: 2025-12-03T01:09:17+09:00 (Asia/Tokyo)
- Purpose: 次チャット向け。タイポグラフィの世界観決定と、WebGL/Shaderの「必然性」を強化するための実装ブリーフ。
- Constraints: コミット禁止。ビルド/リンター不要。最小差分。作業パスは `apps/web/` 配下。モデルは Claude Code (haiku 4.5) 前提。
- Context: Heroは `features/hero` 配下に再構成済み。GLユーティリティは `shared/gl`。Heroシェーダは写真contain + 平均暗部 + FBM/ノイズで背景補完。現状は静的ぼかし＋ノイズに近く、WebGLを使う必然性が弱い。

## 目的
1) タイポグラフィの方向性を定義し、Pitch Black & Fire テーマに沿った「読みやすく尖った」トーンを決める。
2) シェーダーに有機的な動き／インタラクションを足し、「なぜWebGLか」が伝わる表現へブラッシュアップする。

## 成果物（次チャットでやること）
- タイポの世界観: フォント選定、ウェイト/トラッキング/サイズのルール、見出し・本文・ラベルの階層、アクセントカラーの使い方を短く決める。
- シェーダー改良: 「呼吸する光」「カーソルで滲みが揺らぐ」「スクロールで粒度変化」のいずれか複数を最小コストで実装。必然性を示すコメントを最小限に。
- 変更ファイル一覧と調整パラメータの記載場所を出力。
- タイポ演出: Gsapでヘッダ/リードのステップアニメ（stagger, fade+letter-tracking）を必要最小限で適用し、動きの必然性を補強する。App Routerのクライアント側に限定し、サーバー側依存を避ける。

## Claude Code (haiku 4.5) への指示テンプレ
```
あなたはNext.js + Tailwind + shadcn/ui + Three.jsの実装担当です。以下を最小差分で行ってください。ビルド/リンター実行は不要。コミットは絶対にしないでください。

目的:
- タイポグラフィの世界観を定義し、Pitch Black & Fire テーマに沿う階層ルールを設定する。
- Heroシェーダーに「WebGLでしか出せない有機的な動き」を追加し、必然性を高める。

前提:
- 作業パス: apps/web/ 配下。App Router / Tailwind v4（configレス, CSS変数ベース）/ TS。alias `@/* -> ./src/*`。
- Hero: `src/features/hero/components/HeroShaderBackground.tsx` と `src/features/hero/shader/*`。GLユーティリティは `src/shared/gl/*`。
- 現状: 写真contain + 平均暗部 + FBM/ノイズ。静的寄りでWebGLの必然性が薄い。

タスク:
1) タイポグラフィ方針
   - フォント: 見出し用と本文用を指定（例: セリフ/ジオメトリック系 + モノ/サンセリフの本文）。トラッキング、サイズ、ラインハイトの階層ルールを短く定義。
   - 色: `text-base`/`text-muted` の運用とアクセント（Amber系）の限定使いを明記。
   - 反映先: `src/app/globals.css` または必要最小のCSSモジュール/TWクラス。Tailwind v4のCSS変数で定義し、既存トークンを尊重。
   - 動き: Gsapで見出し・リードの初回ロード時にstagger/fadeを最小実装（必要なら `use client` コンポーネントでのみ読み込み、遅延importを検討）。動きは短く、過剰なイージングを避ける。

2) シェーダーブラッシュアップ（必然性の追加）
   - 「呼吸する光」: 低周波の明滅（sin/cosでbgColorに緩やかな変調）。
   - 「カーソルで滲みが揺らぐ」: マウス位置をuniformで渡し、距離に応じてFBMの位相/強度やブラー半径を微変調。
   - 「スクロールで粒度変化」: スクロール量をuniformで渡し、grainのscale/intensityを少し変化。  
   - 上記から少なくとも2要素を実装し、過剰に派手にしない（暗部と粒度を維持）。fallbackは現行の黒ベースを維持。
   - パラメータ: `src/features/hero/shader/config/hero.ts` に追加し、調整箇所を出力で明記。例: `breathIntensity`, `cursorDistortionStrength`, `scrollGrainScale`.

3) 実装方針
   - 必要なuniform（time, pointer, scroll）を ShaderMaterial に追加。`pointermove`/`scroll` で軽量に更新。requestAnimationFrameで再描画（過剰負荷に注意）。
   - GLSL: 既存FBM/ノイズを再利用し、位相やスケールに微小変化を与える。コメントは「何を調整するか」だけに留める。
   - Tailwind/CSS: タイポの変数とクラスを追加する場合、最小範囲で。既存テーマを壊さない。

出力:
- 変更ファイル一覧と要点。
- パラメータ調整箇所（configのキー名）を明記。
- コミット禁止・ビルド/リンター不要を再掲。

守ること:
- 派手すぎない。暗部と粒度を維持し、Amber漏れを抑制。
- パフォーマンスに配慮（uniform更新は軽量に）。フォールバックは維持。
```
