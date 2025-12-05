# 2025-12-05 apps/web Page Transition & Multipage 実装
- **完了:** 2025-12-05T22:40:00+09:00 (Asia/Tokyo)
- **Agent:** Codex CLI（実装: Claude Code）
- **内容:** GSAPベースのページトランジション導入とマルチページ化

## 変更概要
- 新規: `src/shared/transitions/Logo.tsx`, `PageTransition.tsx`, `index.ts`  
  - 20ブロックの覆いアニメ + ロゴストローク/フィル。`data-transition="true"` のリンクのみインターセプト。
- 新規: `src/shared/components/Nav.tsx`, `AnimatedHeading.tsx`, `index.ts`  
  - 6リンクNav（aria-current対応）、splitText用クライアント見出し。
- 新規ページ: `app/motion`, `app/interactive`, `app/installation`, `app/archive`, `app/contact`  
  - それぞれプレースホルダのショーケース/リスト/CTAを配置。
- 更新: `app/layout.tsx`（PageTransition + Navでラップ）、`app/page.tsx`（ジャンルカード追加）、`app/globals.css`（transition overlay CSS）。

## 運用メモ
- トランジションは内部リンクで `data-transition="true"` を付与したもののみ対象。外部リンクや通常リンクは影響なし。
- `AnimatedHeading` を使ってサーバーコンポーネントページ上で splitText アニメを適用。
- z-index: overlay 9998/9999、HeroShaderBackgroundとの衝突を回避。
- コミット未実施。ビルド/リンタは未実行（指示通り）。

## フォローアップ案
- 画像プレースホルダを実アセットに差し替える場合はレイアウト確認を実施。
- トランジションを多用するページでは、リンク数が極端に多い場合のオーバーヘッドに留意。
