# apps/web コンテンツ一次ソース (2025-12-05)

- **データ格納:** `apps/web/src/shared/data/content.ts`（型: `content.types.ts`）。Hero/genres/motion/interactive/installation/archive/contact/seo/logo_notes を1か所に集約。
- **参照方法:** 各ページは `siteContent` を import して描画（Motion/Interactive/Installation/Archive/Contact/Homeのジャンルカード）。HeroTextも `siteContent.hero` を参照。
- **ルール:** ページでの文言直書き禁止。差し替えは content.ts を更新し、必要ならフィールド拡張（tags/role/linksなど）を型に追加。
- **ロゴメモ:** `logo_notes` にSVG作成時の配色/パスヒントを保持。ロゴファイルは将来 `public/assets/logo/` へ配置予定。
