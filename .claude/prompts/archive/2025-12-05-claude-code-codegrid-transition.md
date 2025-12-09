# 2025-12-05 Claude Code 実装プロンプト（Codegrid Page Transition Multipage）
- Created: 2025-12-05T22:20:00+09:00 (Asia/Tokyo)
- Model: Claude Code (Haiku 4.5)
- Target: `apps/codegrid-madeinuxstudio-page-transition-nextjs`
- Constraints: **コミット禁止**。ビルド/リンター案内不要。最小差分で実装。既存のページトランジション（block wipe + Logoストローク）構造を壊さない。

---

## コンテキスト
- Next.js 15.4.6 (App Router) / React 19.1.0
- Dependencies: gsap 3.12.2, @gsap/react, SplitText, Lenis（未使用）
- 現状: ルート `/` のみ（巨大h1「Timeless Form」）。Navは `/`, `/archive`, `/contact` リンクを持つが中身未実装。
- PageTransition: 20本のブロックでcover → Logo描画 → reveal。`RootLayout` で全体をラップ済み。
- Copy: SplitTextでcharsマスク、スクロール連動 or 即時実行が可能。
- スタイル: `globals.css` にベタ書き（BG #e3e4d8, Barlow Condensed / DM Mono）。

## 期待する成果物
- マルチページ化（ジャンル別）とトップページ刷新。以下のページを追加/更新し、Navリンクを有効化。
- ページごとに最低1箇所 `Copy` を使ったテキストリビールを配置。
- 画像はプレースホルダ（単色背景や簡易グラデ）でOK。public配下にダミーを追加する場合は軽量に。

## 実装タスク
1) **Nav更新**
   - リンク構成: Index(`/`), Motion(`/motion`), Interactive(`/interactive`), Installation(`/installation`), Archive(`/archive`), Contact(`/contact`).
   - アクセシビリティ: `aria-current="page"` を現在のパスに付与（optionalだが可能なら対応）。

2) **ページ追加（App Router直下）**
   - `/motion`: Motion/Film作品のショーケース（2〜3枚のビジュアルブロック + 短い説明とタグ）。`Copy` でヒーロー見出しをリビール。
   - `/interactive`: インタラクティブ/ウェブ作品のカードグリッド（3カード、各タイトル+短文+タグ）。
   - `/installation`: インスタレーション/展示用の2カラム（画像ダミー + テキスト）。`Copy`でサブコピーをリビール。
   - `/archive`: 年・カテゴリ簡易リストと1枚のキービジュアル枠。リストは静的配列でOK。
   - `/contact`: 短いイントロ + CTAボタン（メールリンク mailto: など）。

3) **トップページ刷新（`src/app/page.js`）**
   - Hero: タイトル「Silhouette」などインパクトのある見出し＋サブコピー。`Copy`でリビール。
   - ジャンルカード: Motion / Interactive / Installation / Archive へのリンクカードを横並び or 2x2グリッドで配置。各カードは小さなタグと短い説明を含める。
   - 下部に「Latest Drop」など一文のリードセクション。

4) **スタイル追加（`globals.css`）**
   - カード、タグ、グリッド、セクション余白の軽量ユーティリティを追加。既存カラー(#e3e4d8, #141414)とフォントを踏襲。
   - 画像枠はプレースホルダ背景（例: `linear-gradient`）でOK。必要に応じて`.placeholder-img`クラスを追加。

5) **アニメーション/クリーンアップ**
   - `Copy`使用箇所はSplitText `revert()` が確実に走るよう、コンポーネント外でのリスト生成や条件分岐に注意。
   - PageTransitionのDOM構造は変更しない。Linksは`href`でApp Router遷移するだけでOK。
   - Lenisは導入不要（現状未使用のまま）。

## 留意点
- 画像は軽量ダミーで、後で差し替え可能な構造にする。
- コミットは絶対禁止。ビルド/リンター実行指示は書かない。
- 大きな設計変更を避け、既存スタイル/トーン（大文字タイポ + モノスペースアクセント）を維持する。
