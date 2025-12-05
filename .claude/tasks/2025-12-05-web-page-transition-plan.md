# 2025-12-05 apps/web Page Transition & Multipage 設計計画
- Created: 2025-12-05T22:30:00+09:00 (Asia/Tokyo)
- Purpose: `apps/web` をインパクトあるトップ＋ジャンル別ページ構成へ拡張し、codegridサンプル（page-transition）を参考にした遷移演出の設計をまとめる
- Scope: 設計・段取りのみ（実装は後続でClaude Codeに委譲）
- Model downstream: Claude Code (Haiku 4.5)
- Constraints: コミット禁止 / ビルド・リンター記載不要 / 既存トークン・デザイン原則（Pitch Black & Fire）を尊重

---

## 現状（apps/web）
- Stack: Next.js 16 (App Router), React 19, Tailwind v4, GSAP 3.13, Three.js（Hero BG）。`splitText`ユーティリティあり（chars/words）。
- ルーティング: `/` のみ。HeroText + placeholder content。
- デザイン: Pitch Black & Fire トークン（globals.css）。GSAPアニメはHeroTextのみ。

## 参考にするサンプル（codegrid page-transition）
- Blockベースの覆い→Logoストローク→revealのページトランジション（PageTransition + blocks 20本）。
- SplitTextによる文字リビール（Club版 SplitText）。※apps/webでは自前 `splitText` を使用。
- グローバルCSSでタイポ/背景を管理。

## 目標
- トップページ: インパクト重視（Hero + リード + ジャンル導線カード）。
- ジャンル別ページ: 例) Motion / Interactive / Installation / Archive / Contact。マルチクリエイターとして作品カテゴリを分ける。
- 全ページで軽量なトランジションを導入し、一貫した体験を提供。

## トランジション方針（apps/web向け）
- 新規 `PageTransition` コンポーネントを `src/shared/transitions/PageTransition.tsx` などに実装。
  - blocks overlay（20本程度）を作成し、GSAPで scaleX 0→1 (cover) → 0 (reveal)。
  - ロゴ代替: 既存ロゴがない場合はシンプルなモノラインSVGを用意し、stroke-dashoffset演出。ライトなSVG1本でOK。
  - `gsap.context` + `useEffect`でクリーンアップ。ScrollTrigger不要。
  - Next App Router: `useRouter` / `usePathname` + anchor interception（同一ドメイン内部リンクのみ覆い）。
- Tailwindでスタイル管理し、カスタムCSSは最小限。背景色は `var(--bg-darker)` を覆い色に使用。

## ページ構成案（App Router）
- `/` Landing: Hero（新コピー）＋ジャンルカードグリッド（Motion/Interactive/Installation/Archive/Contact）＋Latest短文。ジャンルカードはページ遷移リンク。
- `/motion`: 2〜3カードのショーケース（静止サムネ + タグ + 一文）。スクロール連動で `splitText` reveal。
- `/interactive`: グリッド3件（タイトル/説明/タグ）。
- `/installation`: 2カラムのビジュアル＋テキスト（プレースホルダ背景で可）。
- `/archive`: 年別/カテゴリのリスト + 1枚のキービジュアル枠。
- `/contact`: 短いイントロ + CTA（メール/ソーシャルリンク）。

## 実装タスク素案（後続でClaude Codeへ）
1) ルーティング追加: 上記ページを `app/` 配下に追加（Server Componentベース、Heroなど一部Client許容）。
2) Nav/フッター導線: ジャンルリンクを追加。active表示は任意。`PageTransition` で覆うためLinkは通常の `Link` でOK。
3) トップ刷新: Heroコピーをマルチクリエイター表現に変更、カードグリッドを設置。
4) トランジション導入: `PageTransition` で `children` をラップし、blocks overlay + ロゴstrokeを再現。ダーク基調に合わせた覆い色/ロゴ色設定。
5) スタイル: `globals.css` に必要最小限の補助（overlay、blocks、placeholderイメージなど）を追加。Tailwindで大半を表現。

## リスク・注意
- SplitText (GSAP Club) は使えないので、既存 `splitText` を全ページで使う。CSS `display: inline-block` を忘れず。
- トランジションで `pointer-events` 制御とクリーンアップを徹底。
- 画像はプレースホルダ（div with gradient）でOK。重い実画像は避ける。
- コミット禁止。
