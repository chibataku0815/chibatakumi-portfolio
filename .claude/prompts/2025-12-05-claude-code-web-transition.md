# 2025-12-05 Claude Code 実装プロンプト（apps/web Page Transition & Multipage）
- Created: 2025-12-05T22:30:00+09:00 (Asia/Tokyo)
- Model: Claude Code (Haiku 4.5)
- Target: `apps/web`
- Constraints: **コミット禁止**。ビルド/リンター案内不要。Pitch Black & Fireトークンを尊重。最小差分。SplitText(Club)は使わず既存 `splitText` を利用。

---

## コンテキスト
- Stack: Next.js 16 (App Router), React 19, Tailwind v4, GSAP 3.13, Three.js (Hero BG)。
- 既存: `/` のみ。HeroTextにGSAP + ScrollTrigger。`splitText`ユーティリティ（chars/words）あり。
- 参考: `apps/codegrid-madeinuxstudio-page-transition-nextjs` の block覆い + ロゴstroke トランジション、文字リビールをモチーフにする。

## 目的
- インパクトあるトップページとジャンル別ページを追加し、トランジションでページ遷移体験を強化する。
- ジャンル例: Motion / Interactive / Installation / Archive / Contact。

## 実装タスク
1) **PageTransitionコンポーネント追加**
   - 例: `src/shared/transitions/PageTransition.tsx`（client）。
   - 構成: overlayに複数block(div)を生成（20本程度）。`gsap` で cover: scaleX 0→1、reveal: 1→0。覆い色は `var(--bg-darker)` または `#050505`。
   - ロゴ: シンプルなモノラインSVGを同コンポーネント内に定義し、`strokeDasharray/offset` で描画→fill演出。カラーは `var(--text-base)`。
   - ルーティング連動: `useRouter` + `usePathname` + anchor intercept（同一ドメイン内部リンクのみ）。完了後に `router.push(url)` → reveal。
   - クリーンアップ: `gsap.context` で timeline/blocksを管理し、unmountでkill。`pointer-events` 制御を忘れず。

2) **レイアウトへの適用**
   - `src/app/layout.tsx` で `<PageTransition>{children}</PageTransition>` をラップ。Nav/フッターを内包。

3) **ナビゲーション更新**
   - Navリンク: `/` / `/motion` / `/interactive` / `/installation` / `/archive` / `/contact`。必要なら現在ページに `aria-current="page"`。
   - 見た目は既存トークンを活用（TailwindクラスでOK）。

4) **ページ追加**
   - `/` Landing: 新Heroコピー（マルチクリエイター表現）、ジャンルカードグリッド（Link付き）、短いリード「Latest」など。`splitText` をHeroタイトルに使用。
   - `/motion`: 2〜3ショーケースカード（タイトル/説明/タグ）。`splitText` で見出しリビール。
   - `/interactive`: 3カードのグリッド（タイトル/説明/タグ）。
   - `/installation`: 2カラム（左: プレースホルダビジュアル、右: テキスト + サブコピーを `splitText`）。
   - `/archive`: 年/カテゴリの静的リスト + 1枚のキービジュアル枠。
   - `/contact`: 短いイントロ + CTA（メールリンク）。Copyで見出しリビール。
   - 画像はプレースホルダのdiv（グラデーションや境界線）でOK。重いアセットは追加しない。

5) **スタイル補助**
   - `src/app/globals.css` に必要最小限のクラス/ユーティリティ（overlay, block, placeholder-img, grid/card spacing）を追加。Tailwind中心で、カスタムCSSはトランジション用に限定。
   - 背景・テキスト色は `var(--bg-darker)`, `var(--bg-dark)`, `var(--text-base)`, `var(--text-muted)` を使用。アクセントに `--accent-amber1/2` を少量。

6) **アニメーション注意**
   - `splitText` は chars/wordsに応じて`display: inline-block` 必須。revertを必ず呼ぶ。
   - PageTransitionの block 配列はrefで保持し、重複生成しないよう初期化を整理。

## 禁止事項
- コミットしない。
- 不要な依存追加をしない（SplitTextなどClub専用は不可、Lenis追加不要）。
- 大規模な色/トークン変更をしない。
