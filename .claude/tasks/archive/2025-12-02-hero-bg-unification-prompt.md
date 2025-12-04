# 2025-12-02 Hero/Background Unification Prompt (Haiku 4.5)
- Created: 2025-12-02T21:58:34+09:00 (Asia/Tokyo)
- Purpose: Claude Code (haiku 4.5) 向け実装プロンプト。Hero画像とサイト背景を「同一パレット・同一ノイズ・同一ブレンド」で完全親和させる最短工数案。
- Constraints: 勝手にコミット禁止。ビルド/リンター手順不要。最低限のファイル追加・差分で対応。作業パスは `apps/web/` 配下のみ。
- App context: App Router, Tailwind v4（`tailwind.config.*` なしで `@tailwindcss/postcss` 使用）、TS、alias `@/* -> ./src/*`。ルートは `apps/web/src/app/` 構成。
- Image placeholder: `public/hero.jpg`（必要に応じて差し替え可）。

## 実装ゴール
- Hero画像と背景の色・質感を揃え、継ぎ目の違和感をなくす。
- CSSフォールバックで即描画し、必要ならThree.jsで流体/光漏れを差し替え可能にする（Hero限定）。Gridや本文はCSS版のまま。

## 必要な素材
- Hero画像（抽象自画像: 漆黒＋粒子＋光漏れ）。拡張子: WebP/AVIF推奨。
- ノイズテクスチャ（小型SVGまたはPNG 120x120程度）。CSSとGLで共用。
- カラーパレット（画像から抽出）:
  - `--bg-dark`: 平均暗部（例 #050505〜#0a0a0a）
  - `--accent-amber1`, `--accent-amber2`: 光漏れの2トーン
  - `--text-base`: #ededed 近辺

## 実装タスク（haikuに指示する内容）
1) トークン定義  
   - `src/app/globals.css` でカスタムプロパティとして `--bg-dark`, `--accent-amber1/2`, `--text-base` を定義し、Tailwind v4 で参照できるようにする（v4はconfig不要のためCSS変数ベース）。  
   - ノイズテクスチャを data URI 化し、`bg-repeat opacity-5 mix-blend-screen` 相当のユーティリティをCSSで用意。
2) 共通背景レイヤー  
   - 背景にダークソリッド＋2枚のラジアルグラデ（白弱光/アンバー弱光）。  
   - 右端に光漏れライン（linear-gradient + blur）を擬似要素で追加。  
   - ノイズレイヤーを全体に重ねる（同一テクスチャをSoTに）。
3) Heroコンテナ（CSSフォールバック）  
   - `<VisualMedia variant="hero">` 相当のラッパーを `apps/web/src/app/page.tsx` で仮実装。初期はCSS版を即描画。  
   - 画像には vignette マスク（CSS `mask-image: radial-gradient`）と `mix-blend-lighten` / `screen` 合成。  
   - `brightness/contrast` を微調整し、背景暗部と一致させる。
4) Three.js差し替え（オプション）  
   - Heroのみ `dynamic import` + `ssr:false` で遅延ロード。  
   - GL側で同じ画像テクスチャと同じノイズテクスチャを使用し、スクリーン合成。  
   - ごく浅い流体ディスプレイスと細い光漏れポスト（小半径bloom相当）。  
   - デバイス/性能判定でCSS版にフォールバック。初期表示はCSS版を即出し、GLがreadyならフェードインで切替。  
   - Gridや本文はGLを使わない（CSSのまま）。
5) アクセシビリティ/パフォーマンス  
   - `alt` は「Abstract portrait with light leak」等で記述。  
   - 画像はAVIF/WEBP圧縮。ノイズは小型をrepeat。  
   - 追加の環境変数・設定ファイルは作らない。

## Claude Code (haiku 4.5) への指示テンプレ
```
あなたはNext.js (App Router) + Tailwind + shadcn/ui を扱うフロントエンド実装担当です。以下を最小差分で実装してください。ビルド/リンター実行は不要。コミットは決して行わないでください。

目的: Hero画像とサイト背景の色・質感を完全親和させる。CSSフォールバックを即描画し、HeroのみThree.js差し替え可能な構造を用意する（Grid/本文はCSSのまま）。

前提:
- 作業パスは `apps/web/` 配下。App Router / Tailwind v4（configなしで CSS変数運用）/ TS / alias `@/* -> ./src/*`。
- Hero画像パスは `public/hero.jpg` を利用（差し替え可）。

必須要素:
- カラートークンを定義: --bg-dark, --accent-amber1, --accent-amber2, --text-base（画像から抽出値をセット）。`src/app/globals.css` の:rootカスタムプロパティで定義（Tailwind v4向け）。
- ノイズテクスチャを1枚用意（小型SVG/PNG）。data URIでCSSユーティリティ化し、bg-repeat/opacity-5/mix-blend-screen。
- 背景レイヤー: ダークソリッド + 2ラジアル弱光 + 右端光漏れライン（linear-gradient + blur） + ノイズ。
- Heroコンテナ(CSS版): 画像にvignetteマスク、mix-blend-lighten(or screen)、brightness/contrast微調整。背景と同一パレット・同一ノイズを重ねる。`apps/web/src/app/page.tsx` に簡易実装。
- Three.js版(オプション): Heroのみ dynamic import + ssr:false。画像＆ノイズを同パレットで合成し、浅い流体ディスプレイスと細い光漏れポストを追加。準備完了後にCSS版からフェードで切替。性能が低い場合はCSS版のまま。
- 追加環境変数は禁止。設定ファイルも必要最小限。
- altテキストを適切に記述（例: "Abstract portrait with light leak"）。

提出物:
- 追加・変更ファイル一覧と要点。
- フォールバックと切替条件の説明。

守ること:
- ビルド/リンター実行はしない。
- コミットは絶対に行わない。
- 最小差分で実装する。
```
