# Photography Motion-First Detail Refresh (2026-03-13)

## 概要

Photography ページを「構造は維持したまま、微細な motion と section 間の空気感で密度を上げる」方針で再設計した。

- Hero: headline / proof panel / side panel の reveal と減速感を再設計
- Gallery: featured hover の多層反応、pointer drift、contact sheet caption を追加
- Services / Case Study / About / CTA: section ごとの動きの文法を統一
- Shared: photography 専用 motion token、panel edge、handoff divider、ambient orb を導入

## 変更ファイル

- `apps/web/src/features/photography/motion.ts`
- `apps/web/src/app/globals.css`
- `apps/web/src/features/photography/PhotographyClient.tsx`
- `apps/web/src/features/photography/sections/HeroSection.tsx`
- `apps/web/src/features/photography/sections/GallerySection.tsx`
- `apps/web/src/features/photography/sections/ServicesSection.tsx`
- `apps/web/src/features/photography/sections/TestimonialSection.tsx`
- `apps/web/src/features/photography/sections/AboutSection.tsx`
- `apps/web/src/features/photography/sections/CTAFormSection.tsx`
- `apps/web/messages/ja.json`
- `apps/web/messages/en.json`

## 検証

- `bunx eslint` で変更対象の photography ファイル群を確認
- `bun run build` 成功
- 厳密検索で `Anysphere` / `Official Photographer` / `200+` / `organizer` の再流入なし
- `/en/photography` で Hero / Gallery hover / CTA の実画面確認

## 既知事項

- `/ja/photography` は dev 環境で locale redirect loop が残っており、画面確認は未実施
- Playwright 用ブラウザは local cache に導入したが、MCP 側の revision 差異があり、`chromium_headless_shell-1200 -> 1208` の symlink で回避した

## 引き継ぎメモ

- この種の改修は section ごとの個別アニメーションより、`motion.ts` と `globals.css` で共通 grammar を先に定義した方が崩れにくい
- Gallery の featured hover は CSS だけでなく pointer drift を少量入れると、Shiftbrain 系の「静止画なのに空気が動く」印象に寄せやすい
- locale 付き route の dev 確認は `ja` より `en` の方が安定していたため、英語実画面確認 + build 成功 + 翻訳整合で詰めるのが現実的
