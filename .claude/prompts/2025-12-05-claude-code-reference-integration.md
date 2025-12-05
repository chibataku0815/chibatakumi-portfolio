# 2025-12-05 Claude Code 実装プロンプト（Reference Files → apps/web）
- Created: 2025-12-05T22:00:21+09:00 (Asia/Tokyo)
- Model: Claude Code (Haiku 4.5)
- Purpose: `apps/example01` と `apps/gsap-horizontal-dots-nav` の演出を `apps/web` へ移植・統合する具体手順を指示
- Constraints: **コミット禁止**、最小差分、既存トークン/スタイル尊重、外部依存追加は必要最小限（Lenisは必要な場合のみ）
- Scope: `apps/web` 配下のみ

---

## コンテキスト
- Stack: Next.js 16 (App Router) + React 19 + Tailwind v4 + GSAP 3.13.0 + Three.js。`@/* -> ./src/*`
- 既存: `HeroText` はGSAP/ScrollTrigger使用。文字分割ユーティリティ `src/shared/utils/splitText.ts` あり。デザイントークンは `src/app/globals.css` で定義済（Pitch Black & Fireテーマ）。
- 参考資料:
  - `apps/example01`: Spotlightセクション。20枚画像をZ奥からscatter→regroup、カバー画像が後段で前面へ。単語フェードアウト/イン、モバイル倍率補正あり。Lenis + ScrollTrigger構成。
  - `apps/gsap-horizontal-dots-nav/README.md`: 横スクロールPinnedセクション。タイトル/ディスクリプションをゴースト(低opacity)→ソリッド化。進捗バー/ドットナビ/ラインフラッシュ。ScrollTrigger Timelineの相対指定が詳細化。

## 期待する成果物
- Spotlightギャラリー（example01移植版）コンポーネント
- Horizontal Works Scroller（README移植版）コンポーネント
- `app/page.tsx` へのセクション統合（Heroの下に順番配置）
- 付随するスタイル/データ定義。ビルドやリンターの実行案内は不要。

## 実装指示（Haiku 4.5 向け）
1) **基盤/準備**
   - ScrollTriggerはクライアントコンポーネント内で`gsap.registerPlugin(ScrollTrigger)`。`gsap.context`でスコープ化し、`return () => ctx.revert()` + `ScrollTrigger.getAll().forEach(kill)`でクリーンアップ。
   - 文字分割は必ず `splitText` を再利用。必要なら`splitText(element,"words")`で単語単位、charsは`type:"chars"`。
   - Lenis導入が必要な場合のみ`package.json`に追記し、Smooth scroll→ScrollTrigger同期（lenis.on("scroll", ScrollTrigger.update)）をSpotlight側で実装。不要ならScrollTrigger単独でOK。

2) **Spotlightセクション（例: `src/features/works/spotlight/SpotlightGallery.tsx`）**
   - クライアントコンポーネント。データ: `{ src, alt }[]` の画像配列 + カバー画像 + 見出しテキスト（intro/outro）を同ファイル内で定義。
   - レイアウト: `section`を`className="relative min-h-screen w-full overflow-hidden bg-[var(--bg-darker)] text-[var(--text-base)]"`等で構成。画像レイヤは`absolute inset-0` + `preserve-3d/perspective`を`globals.css`に限定追加（ユーティリティクラス可）。
   - アニメーション:
     - 初期: 全画像を`z: -1000, scale:0, x/y:0`。カバー画像も同様に後方。
     - Scatter: `scatterDirections`配列を用意し、`gsap.utils.interpolate`でScrollTrigger進捗に応じて`x/y/z/scale`を更新。モバイル時は倍率を強める係数を条件分岐。
     - カバー画像: トリガー後半で`z`を0→前面、`scale`を1へ。
     - テキスト: `splitText(...,"words")`したワードをprogress帯域でopacityフェード（0.6〜0.75でintro消去、0.8〜0.95でoutro出現）。
   - Cleanup: `ScrollTrigger`インスタンスをkill。`ResizeObserver`や`window.resize`を使う場合は解除。

3) **Horizontal Works Scroller（例: `src/features/works/horizontal/HorizontalWorks.tsx`）**
   - クライアントコンポーネント。`data.ts`に`{id,title,description,meta}`配列を用意し、タイトル/本文は短めに。
   - レイアウト: `horizontal-wrapper`相当のdivをPinned対象にし、中に`flex`で`panel`を横並び。各パネル内でタイトル/本文/進捗バー/セクション番号を配置。ドットナビとグローバルバーを画面端に固定。
   - 初期状態: タイトルcharsはopacity 0.04、本文charsは0.03（CSS変数で調整可能）。`splitText`でspan化し、ゴーストクラスを当てる。
   - Timeline構成（README準拠）:
     - フェーズ1: タイトルcharsをstagger 0.025, duration ~0.25, ease power2.out。開始時にセクション進捗をactive化。
     - フェーズ2: 説明charsをstagger 0.004, duration ~0.4, `<0.12`で開始。onUpdateで進捗%を計算しバー/テキスト更新。完了でcompletedクラス付与。
     - フェーズ3: 既存パネルをscale 0.95 + opacity 0.3 + blur(4px)、ラインフラッシュを0.15s、横移動`container x = -window.innerWidth*(i+1)`、次パネルのfade-in。相対位置はREADMEの`">"`, `"<0.03"`, `">-0.08"`等を踏襲。
   - ScrollTrigger設定: `trigger`をラッパーに、`start:"top top"`, `end: "+=" + window.innerHeight * totalPanels * 2.2`, `scrub:1`, `pin:true`, `anticipatePin:1`。onUpdateでグローバル進捗バー更新。
   - ドットナビ: `navigateToSection(index)`でScrollTrigger start/endから目標スクロール位置を算出し、`gsap.to(window,{scrollTo:target,duration:0.6,ease:"power2.inOut"})`。セクション状態リセットロジックをReactに移植。

4) **ページ統合**
   - `app/page.tsx`でHeroの下に`<SpotlightGallery />`、その下に`<HorizontalWorks />`を配置。長尺Pinnedが連続するので、間に`section`スペーサー（例: `py-16` + 簡易リード文）を追加してスクロール体験を緩和。
   - 追加するCSSは`globals.css`に集約（3D用ユーティリティ、ゴースト文字のopacityクラスなど）。既存トークンを使い、任意のカラー直書きを避ける。

5) **品質/安全メモ**
   - クリーンアップ忘れを防ぐため、各コンポーネントの`useEffect`で`return`に`ctx.revert()`と`ScrollTrigger` killを入れる。
   - プレースホルダ画像は`public/`内ダミーでOK。重いアセットは追加しない。
   - コミットは絶対に行わない。ビルド/リンターの実行もこの指示では不要。
