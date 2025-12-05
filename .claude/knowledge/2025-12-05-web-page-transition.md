# Page Transition & Multipage (apps/web) - 2025-12-05

## 実装ポイント
- **PageTransition** (`src/shared/transitions/PageTransition.tsx`)
  - 20ブロック覆い + ロゴストローク/フィル。GSAP timeline。
  - `data-transition="true"` の内部リンクのみインターセプト（外部リンクや通常リンクはスルー）。
  - `gsap.context` + pointer-events制御。z-index: blocks 9998 / logo 9999。
  - ロゴはシンプルSVG (`Logo.tsx`)、strokeDasharray/offsetで描画→fill。
- **Nav** (`src/shared/components/Nav.tsx`)
  - 6リンク（Index/Motion/Interactive/Installation/Archive/Contact）、aria-current対応。
  - リンクに `data-transition="true"` を付与し、PageTransition適用。
- **AnimatedHeading** (`src/shared/components/AnimatedHeading.tsx`)
  - サーバーページ内でも splitText アニメを使える小型クライアントコンポーネント。
  - chars/wordsを指定可。GSAPでopacity/y/blurをアニメートし、revertを保証。
- **ページ構成**（全て `apps/web/src/app/`）
  - `/` ジャンルカード追加。/motion /interactive /installation /archive /contact を新規。
  - 画像はプレースホルダ（グラデ/無地）想定。実アセット差し替えはレイアウト確認が必要。

## トラブル回避メモ
- splitTextは自前実装。Club版SplitTextは未導入。必ず `revert()` を呼ぶ。
- トランジション対象リンクは `data-transition="true"` で限定する。外部リンクは付与しない。
- ヒーロー背景との重なりは z-index 9998/9999 で解決済み。
- コミット禁止ルール下で作業。ビルド/リンタ未実行。
