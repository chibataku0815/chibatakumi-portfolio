# 2025-12-05 Reference Files → apps/web 組み込み計画
- Created: 2025-12-05T22:00:21+09:00 (Asia/Tokyo)
- Purpose: `apps/example01` と `apps/gsap-horizontal-dots-nav` の参考実装を、`apps/web` へ組み込むための計画整理
- Scope: 設計・段取りのみ（実装は別タスクでClaude Codeに委譲予定）
- Model downstream: Claude Code (Haiku 4.5)
- Constraints: コミット禁止 / 既存スタイル・トークン尊重 / 最小差分方針

---

## 現状サマリ（apps/web）
- Tech: Next.js 16 (App Router) + React 19 + Tailwind v4 + GSAP 3.13.0 + Three.js
- Hero: `HeroText` がGSAP/ScrollTriggerで文字リビール＆パララックス。`splitText` ユーティリティあり。BGにはThree.jsベースのシェーダー構成が既存。
- グローバル: `globals.css` で色/タイポ変数定義済。Lenisなどスムーススクロール系は未導入。

## 参考素材の要点
- `apps/example01`（Kaitonote Scroll Animation）
  - GSAP + ScrollTrigger + Lenis + SplitText (Club版) を使用。
  - Spotlightセクションを長尺ピン留めし、20枚の画像をZ奥からばら撒き→手前で再集合。カバー画像が後半で前面に出現。
  - 見出しは単語分割でフェードアウト/インを段階的に制御。モバイルではscatter量を強めに補正。
- `apps/gsap-horizontal-dots-nav/README.md`
  - 縦スクロールを横移動に変換するPinnedセクション。各パネルでタイトル/ディスクリプションをゴースト(低opacity)→ソリッドにステッガー表示。
  - グローバル/セクション進捗バー、ドットナビゲーション、ラインフラッシュなどフェーズ構造が明確。
  - Split-to-chars関数でspan化し、ScrollTrigger + Timelineの相対指定で順序を保証。

## 組み込み方針
1) **基盤/依存関係**
   - ScrollTrigger登録と`gsap.context`運用は既存Heroと同様に統一。
   - Lenis導入を検討（Spotlightの長尺ピン留めでスムース感を担保）。最小差分ならGSAP ScrollTriggerだけでまず組む→必要なら後追いでLenis。
   - 文字分割は既存`splitText`を活用し、ゴースト→ソリッド表現用の`char`スタイルをユーティリティクラスで用意。

2) **Spotlightセクション（example01移植）**
   - 新規: `src/features/works/spotlight/SpotlightGallery.tsx`（client）。データ定義で画像配列・カバー・見出し文言を持つ。
   - レイアウト: ピン留めセクションを`min-h-[100vh]`で占有。絶対配置の画像グリッド（`position: absolute; transform-style: preserve-3d; perspective`）をTailwindカスタムクラスで実現。
   - アニメ: ScrollTrigger `scrub` で scatter→regroup。scatter方向は配列で定義し、ウィンドウ幅/高さで補正。カバー画像は後半でZを0→前面に。
   - テキスト: 見出しは`splitText(...,"words")`で単語単位のフェード制御。進行度に応じてopacityを段階的に変化。
   - モバイル: scatter倍率を強めにするパラメータをprops/定数で管理。

3) **Horizontal Works Scroller（README移植）**
   - 新規: `src/features/works/horizontal/HorizontalWorks.tsx`（client）と`data.ts`でパネルデータ管理。
   - レイアウト: `horizontal-wrapper`をTailwindで表現し、`horizontal-container`をflex並び。タイトル/説明/進捗UIをコンポーネント化。
   - アニメ: ScrollTriggerでPinned + scrub。パネル単位のフェーズ（タイトル→説明→トランジション→次パネル）をTimelineで組み、相対位置指定（">", "<0.12"など）をREADME通りに実装。
   - テキスト分割: `splitText`でspan化し、ゴースト状態の初期opacityはCSSカスタムプロパティで管理。
   - ナビ/進捗: ドットナビとグローバル進捗バーをReact stateで同期。セクションジャンプ用のScrollTrigger計算は`navigateToSection`ロジックをReactに移植。

4) **ページ統合**
   - `app/page.tsx` でHero下に Spotlight、続いて Horizontal Works を配置。長尺ピン留めが連続しないように間にスペーサー or 簡易リードを挿入。
   - 背景/テキスト色は既存トークンを使用し、外部CSSは`globals.css`に限定的に追加（3D/perspective用ユーティリティのみ）。

5) **移植時のリスク・注意**
   - ScrollTriggerインスタンスのクリーンアップ徹底。`ctx.revert` + `ScrollTrigger.getAll().forEach(kill)`をcomponent単位で実装。
   - 画像プレースホルダは`public/`に仮配置 or ダミーdivで代替し、実写依存を避ける。
   - パフォーマンス監視: 大量spanを生成するため、文字数を抑えた文言にし、`will-change`乱用を避ける。

## 次ステップ（実装タスク化の素案）
- Spotlight: コンポーネント骨組み → ScrollTriggerロジック → スタイル微調整 → モバイル検証
- Horizontal Scroller: データモデル → Split処理 → Timeline構築 → ナビ/進捗同期 → レスポンシブ調整
- 最終: `app/page.tsx` 配置と軽いUX確認（ビルド/リンター実行は別工程）
