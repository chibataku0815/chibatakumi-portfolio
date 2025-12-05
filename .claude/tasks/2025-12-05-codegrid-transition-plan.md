# 2025-12-05 Codegrid Page Transition Multipage 設計計画
- Created: 2025-12-05T22:20:00+09:00 (Asia/Tokyo)
- Purpose: `apps/codegrid-madeinuxstudio-page-transition-nextjs` を単一LPからマルチページ化し、ページトランジションを活かした体験設計を整理する
- Scope: 設計・段取りのみ（実装は後続タスクでClaude Codeに委譲）
- Model downstream: Claude Code (Haiku 4.5)
- Constraints: コミット禁止 / ビルド・リンター記載不要 / 既存トランジション（GSAP blocks + Logo描画）を維持・活用

---

## 現状整理
- Stack: Next.js 15.4.6 (App Router), React 19.1, GSAP 3.12, @gsap/react, SplitText, Lenis (未使用), CSSはグローバルに直接記述。
- ルーティング: `/` のみ（Navは `/archive`, `/contact` へのリンクを持つが未実装）。
- トランジション: `PageTransition` で20本のblock wipe + Logo stroke描画 → fill。`onAnchorClick` で内部リンク時に覆い→router.push→reveal。
- Copy演出: `Copy` コンポーネントがSplitTextでcharマスク＆GSAP reveal。フォント: Barlow Condensed, DM Mono。
- デザイン: BG #e3e4d8、巨大見出し。SPではh1が2remに縮小。

## 目標
- マルチクリエイターとしてジャンル別ページを追加し、トランジションの見せ場を増やす。
- トップページはインパクト重視：ヒーロー＋短いリード、ページ遷移導線を明確化。
- 各ページで共通のトーン（タイポ/背景/余白）を保ちつつ、セクション固有のアクセントを設定。

## 提案ページ構成
- `/` Landing: ヒーロー「Silhouette」キービジュアル（タイポ + サブコピー）、下部にジャンルカード（各ページへのLink）と「Latest Drop」短文。
- `/motion`: Motion/Film系のショーケース（2〜3枚の静止ビジュアル + 短いロールテキスト）。
- `/interactive`: インタラクティブ/ウェブ作品のグリッド（3カード）。テキストは短い説明＋タグ。
- `/installation`: インスタレーション/展示のディップティック（左右2カラム、イメージ + コピー）。
- `/archive`: 既存Navリンク。年別/カテゴリ別の簡易リスト + 1枚のキービジュアル。
- `/contact`: 既存Navリンク。短いイントロ + CTA（メール/ソーシャル）。

## トランジション活用方針
- 現行の block wipe + Logo ストローク演出を全ページ遷移で再利用（PageTransitionは既にRootLayoutでラップ済み）。
- ページごとに初期状態でCopyをSplitText reveal（スクロール連動/非連動をページに応じて切り替え）。
- 画像や背景は軽量: public配下にプレースホルダ（単色グラデ or SVG）でOK、後で差し替え可能に。

## 実装タスク案（後続でClaude Codeに依頼）
1) ルーティング追加: `/motion`, `/interactive`, `/installation`, `/archive`, `/contact` を App Router で作成。各ページは`Copy`を活用したテキストリビールを最低1カ所設置。
2) ナビ更新: Navのリンクラベルをジャンルに合わせて調整（例: Index / Motion / Interactive / Installation / Archive / Contact）。active状態の視覚差は不要だが、将来余地として`aria-current`対応を検討。
3) ランディング刷新: `/` にジャンルカード（Link）と短いイントロセクションを配置し、トランジション導線を目立たせる。背景は既存の#e3e4d8を継続。
4) スタイル: globals.css に軽微なユーティリティを追加（カードレイアウト、タグ、セクション余白）。既存タイポスケールを踏襲し、大文字/モノスペースのアクセントを維持。
5) パフォーマンス/安全: SplitText revertを各ページで確実に行う。Lenisは未使用のまま（導入不要）。画像は低負荷プレースホルダで実装。

## 留意点
- トランジションのDOM（overlay, blocks, logo overlay）は既存を流用し、構造変更しない。
- コミット禁止。ビルド/リンタ実行案内は不要。
- 実装時は最小差分でCSS追加し、既存カラー/タイポを踏襲する。
