# 2025-12-05 Claude Code 引き継ぎプロンプト（apps/web ポートフォリオ化）
- Model: Claude Code (Haiku 4.5)
- Scope: `apps/web`
- 状態: トランジション/マルチページ構造は実装済み。コンテンツはプレースホルダ。
- 禁止: コミット。不要な依存追加。ビルド/リンター案内。

## ゴール
- サンプル文言/ビジュアルを本人ポートフォリオ実データに置き換える。
- ロゴ/タイトルSVG（本人がIllustratorで作成）の格納・読み込みを設計し、PageTransitionやNavに反映。

## 事前に欲しい入力（ユーザーから）
- Heroコピー（JP/EN方針）、サブコピー。
- 各ジャンル（Motion/Interactive/Installation）の案件タイトル・短文・タグ・サムネ（画像 or グラデ指定）。
- Archive用の年/カテゴリリスト（配列で可）。
- Contact文言、メール/リンク。
- ロゴSVG: stroke/塗りのカラー想定、1パスか複数パスか。

## 実装タスク
1) **ロゴ/アセット格納**
   - 推奨: `public/assets/logo/logo-mark.svg`（stroke用）、`logo-type.svg`（タイプ付き）。
   - 必要なら `src/shared/assets/logo/` にも複製し、`Logo` コンポーネントで差し替え対応。
   - `PageTransition` のロゴをSVG差し替え可能にする（パス選択をprops化 or import差し替え）。

2) **データ集約**
   - 新規: `src/shared/data/works.ts` などにジャンルごとの配列を定義。
   - `/motion`, `/interactive`, `/installation`, `/archive`, `/contact`, `/` でのデータ参照を置換（現状はページ内ベタ書き）。
   - 画像がない場合はプレースホルダグラデを継続。

3) **コピー反映**
   - Heroと各ページの見出し/本文を本人提供文言に差し替え。
   - `AnimatedHeading` に渡すテキストを更新。英日混在の場合はクラス調整（フォント/サイズ）で可読性確保。

4) **トークン/スタイル微調整**
   - ロゴ色・トランジション覆い色をトークン化（例: `--transition-overlay`, `--logo-stroke`）。`globals.css` に追加。
   - 必要に応じてカード/タグの配色を本人トーンに寄せる（既存トークンを使う）。

5) **アクセシビリティ/挙動確認**
   - トランジション対象リンクは `data-transition="true"` のみ。外部リンクには付与しない。
   - `AnimatedHeading` の splitText revert が確実に呼ばれるよう、ページ構造に変更があれば再確認。

## 注意
- 既存トランジション構造を壊さない。z-index 9998/9999、pointer-events制御は維持。
- SplitText Club版は使わず、既存 `splitText` を使用。
- コミット禁止。diffは最小限で。
