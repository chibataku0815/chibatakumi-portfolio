# @chibatakumi/design-system

**Status**: skeleton only (Phase 1 / Stream 3 not started)

Renewal 2026 のデザイン言語 tokens + Tailwind 4 plugin + component primitives。

## 基調

- Palette 基調: motion-dot-new の `#D2D2D2 / #1A1A1A` 系
- Typography 基調: Geist Sans + Noto Sans JP（現行継承）
- Grid 基調: hexagonal 7/6/7、サイズ 5/9/15
- Motion grammar 基調: easeOutQuint / smootherstep / springScaleSimple
- Color mode 基調: **light default**、dark alt（plan §5.6 で確定）

## Stream 3 タスク

1. Tailwind 4 plugin（CSS variables + utility classes）
2. Storybook（または Ladle）導入
3. Component primitives:
   - Logo / Wordmark — dot vocabulary で再描画
   - SoundToggle — 全ページ右下 fixed icon
   - NavRail — sub-section navigation
4. Light/Dark mode 切替インフラ
