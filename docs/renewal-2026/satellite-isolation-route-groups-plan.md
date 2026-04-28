---
title: Satellite Isolation via Route Groups — Plan & Spec
date: 2026-04-26
status: in-progress
authors: Takumi Chiba (with Claude)
references:
  - docs/renewal-2026/MASTER-HANDOFF-2026-04-25.md
  - docs/renewal-2026/archive/wave1-2/stream-wave2-completion-handoff.md
  - apps/web/src/app/[locale]/layout.tsx (current root shell)
  - apps/web/src/app/[locale]/filmtone/layout.tsx (current data-theme=dark wrapper)
  - apps/web/next.config.ts (redirects)
  - apps/web/src/app/sitemap.ts (URL canonical list)
---

# Satellite Isolation via Route Groups — Plan & Spec

## §0. Why this exists

Renewal 2026 plan (§1.2 / §2.2 / §5.5) defines `/filmtone` and `/photography` as **satellite LPs** that:

- 独自の visual language (Filmtone = dark glass / Photography = light editorial GSAP)
- Global nav に出さない
- 将来、独立ドメインへ分離可能な物理境界を持つ

しかし 2026-04-26 時点の実装は **renewal の bleed-through で satellite 隔離が崩壊**している (localhost:3217/filmtone のスクリーンショットで確認済)。本 plan はその構造的根治。

---

## §1. Root Cause — 3 つの構造バグ

### Bug 1 — `<html data-theme="light">` が body 背景を支配
`[locale]/layout.tsx:96` で `<html ... data-theme="light">` を設定 → body 背景は light scope の CSS var を読む。
`filmtone/layout.tsx:17` の `<div data-theme="dark">` は html の **子** の div だけを dark にするので、`<body>` 領域の背景は light のまま漏れる。
結果: dark token を読む文字が薄く light bg に溶ける (実機確認済)。

### Bug 2 — `<Nav />` が root layout に直置き
`[locale]/layout.tsx` の `<PageTransition><Nav />{children}</PageTransition>` が**全ルートで** Nav を render。
プラン §5.5「satellite に global nav 不可」と明確に矛盾。スクリーンショット上の HOME/EXPERIMENTS/JOURNAL/CONTACT がこれ。

### Bug 3 — `<MotionStageProvider>` 全画面ラップ → motion-dot bleed
`[locale]/layout.tsx` の `<MotionStageProvider>` が全ルートを包む → motion-dot canvas が `/filmtone` `/photography` でも mount される。スクリーンショットの黒い floating dots がこれ。

---

## §2. Architecture Decision — Option Y: Nested Route Groups

### 採用構造

```
apps/web/src/app/
├── layout.tsx                                [unchanged: 246B passthrough]
└── [locale]/
    ├── layout.tsx                            [REDUCED: html/body + i18n + analytics + fonts のみ]
    ├── (portfolio)/                          [NEW route group]
    │   ├── layout.tsx                        [NEW: Nav + MotionStage + LiquidGlass + AudioBus + PageTransition + SoundToggle + data-theme="light" wrapper]
    │   ├── page.tsx                          [moved from [locale]/page.tsx]
    │   ├── about/, contact/, craft/, experiments/, glass-poc/, journal/, works/
    └── (satellite)/                          [NEW route group]
        ├── layout.tsx                        [NEW: data-theme="dark" wrapper, min-h-dvh + bg-[--bg-primary], AudioBus opt, NO Nav, NO MotionStage]
        ├── filmtone/                         [moved + その内側 layout.tsx を簡素化]
        └── photography/                      [moved]
```

### 採用理由 (検討代替案との比較)

| 代替案 | 採否 | 理由 |
|--------|------|------|
| Option X: Multi-Root Layout (`(portfolio)/` と `(satellite)/` がそれぞれ独立 html/body) | ❌ | next-intl `[locale]` placement が複雑化、generateStaticParams 二重化、analytics 設置二重化 |
| Option Y: Nested Route Groups (this plan) | ✅ | next-intl 不変、shared core に i18n/analytics 集約、shell ごと providers 完全分離 |
| Option Z: Conditional Nav/MotionStage (`usePathname` で hide) | ❌ | shell の物理分離が無く、将来 又 bleed する riguard 構造的に残る (memory `feedback_no_silent_stream_redefine` の警鐘域) |

### URL 不変性

Route group `(portfolio)` `(satellite)` は **URL に出ない** (Next.js App Router 仕様)。
従って:
- `next.config.ts` の 301 redirects (`/film-lab` → `/filmtone` 等) は無調整。
- `sitemap.ts` の URL paths は無調整。
- `Nav.tsx` の internal links は無調整 (`/filmtone` / `/photography` も含めて URL は同じ — ただし設計上 satellite link は portfolio nav に**置かない**)。
- canonical URLs in metadata は無調整。

---

## §3. Layout Spec (3 ファイル)

### §3.1 `[locale]/layout.tsx` — Reduced Shared Core

責務:
- `<html lang={locale} className={fontVariables}>` (data-theme は **削除** — 各 route group が wrapper で付ける)
- `<body className="antialiased">`
- `<NextIntlClientProvider messages={messages}>`
- Analytics scripts (Meta Pixel / GA4) — Suspense boundary 込み
- `<AnalyticsPageTracker />` (Suspense)
- `<Analytics />` `<SpeedInsights />` (Vercel)
- generateMetadata, generateStaticParams (i18n SSoT)

責務外 (route group へ移動):
- Nav / MotionStageProvider / LiquidGlassProvider / AudioBusProvider / PageTransition / SoundToggleControl

### §3.2 `[locale]/(portfolio)/layout.tsx` — Portfolio Shell

責務:
- 外側 wrapper: `<div data-theme="light">` ── **bg/min-height 付与禁止** (理由は下記)
- `<MotionStageProvider>` `<LiquidGlassProvider>` `<AudioBusProvider>`
- `<PageTransition><Nav />{children}</PageTransition>`
- `<SoundToggleControl />`
- top-level `<style>{`:root { --motion-hud-top: calc(var(--nav-height, 64px) + 16px); }`}</style>`

> ⚠️ **重要 — Portfolio wrapper に背景色を付けないこと**
>
> `MotionStageProvider` の canvas は `fixed inset-0 -z-10 pointer-events-none w-screen h-screen` で
> mount される (`apps/web/src/features/motion/MotionStageProvider.tsx:27,87`)。
> `-z-10` は背面配置を意図する。Body は透明のまま、canvas が viewport を埋め、children が前面に乗る設計。
> この wrapper に `bg-[var(--bg-primary)]` などを付けると、canvas が完全に隠れて motion-dot が表示されなくなる。
> **2026-04-26 の初回実装でこの罠に踏み、検証で発覚 → 即修正済 (本 §3.2 確定版)**。

### §3.3 `[locale]/(satellite)/layout.tsx` — Satellite Shell

責務:
- 外側 wrapper: `<div data-theme="dark" className="min-h-dvh bg-[var(--bg-primary)]">`
- (Optional) `<AudioBusProvider>` ※ Filmtone が音声 controls を使う場合
- **Nav なし** (satellite 隔離の核)
- **MotionStageProvider なし** (motion-dot bleed 防止)
- **LiquidGlassProvider なし** (renewal-only feature; satellite 独自 effect は内側 client island で完結)

### §3.4 `[locale]/(satellite)/filmtone/layout.tsx` — 内側 layout 簡素化

現状の `<div data-theme="dark" className="film-lab-lp-root">` は **(satellite) layout が dark を提供する** ため redundant。`film-lab-lp-root` クラスの globals.css L1460 scope (liquid glass / typography) は維持必要なため、wrapper は残すが data-theme は削除:

```tsx
return <div className="film-lab-lp-root">{children}</div>;
```

---

## §4. File Move Table

### `git mv` 実行マッピング

| 現在 | 移動先 | 種別 |
|------|--------|------|
| `[locale]/page.tsx` | `[locale]/(portfolio)/page.tsx` | file |
| `[locale]/about/` | `[locale]/(portfolio)/about/` | dir |
| `[locale]/contact/` | `[locale]/(portfolio)/contact/` | dir |
| `[locale]/craft/` | `[locale]/(portfolio)/craft/` | dir |
| `[locale]/experiments/` | `[locale]/(portfolio)/experiments/` | dir |
| `[locale]/glass-poc/` | `[locale]/(portfolio)/glass-poc/` | dir (untracked) |
| `[locale]/journal/` | `[locale]/(portfolio)/journal/` | dir |
| `[locale]/works/` | `[locale]/(portfolio)/works/` | dir |
| `[locale]/filmtone/` | `[locale]/(satellite)/filmtone/` | dir |
| `[locale]/photography/` | `[locale]/(satellite)/photography/` | dir |

### 据え置き

- `[locale]/error.tsx` `loading.tsx` `not-found.tsx` — Next.js framework files。レイアウト直下据え置きで全ルート共有。
- `app/layout.tsx` `app/api/**` `app/globals.css` `app/sitemap.ts` `app/robots.ts` `app/fonts.ts` `app/icon.svg` `app/favicon.ico` — 不変。

---

## §5. Verification Plan

### 5.1 Static checks (実装後)

```bash
cd /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio

# typecheck (workspace)
bun run --cwd apps/web typecheck 2>&1 || bun run --cwd apps/web build --no-lint 2>&1 | head -100

# lint
bun run --cwd apps/web lint 2>&1 | head -50

# build (production parity)
bun run --cwd apps/web build 2>&1 | tail -60
```

### 5.2 Dev server visual checks

```bash
bun run --cwd apps/web dev
# Open: http://localhost:3217/ja/                  → portfolio shell (Nav 表示, motion-dot, light)
# Open: http://localhost:3217/ja/filmtone          → satellite shell (Nav 非表示, motion-dot 非表示, dark bg, dim 文字 解消)
# Open: http://localhost:3217/ja/photography       → satellite shell (Nav 非表示, motion-dot 非表示)
# Open: http://localhost:3217/ja/experiments       → portfolio shell (現状動作維持)
```

### 5.3 Acceptance criteria (must all pass)

- [ ] `/filmtone` で Nav (`HOME / EXPERIMENTS / JOURNAL / CONTACT`) が表示されない
- [ ] `/filmtone` で背景が dark canvas 色 (#0F1115)、文字が読める
- [ ] `/filmtone` で motion-dot の floating dots が出ない
- [ ] `/photography` 同上
- [ ] `/` (home) `/experiments` `/journal` `/contact` 等は現状通り Nav + motion-dot
- [ ] 301 redirects (`/film-lab` → `/filmtone` 等) 不変
- [ ] sitemap.xml 不変
- [ ] typecheck / lint / build 全て pass

---

## §6. Rollback

問題発生時:
```bash
git -C /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio reset --hard HEAD
```
(本 plan 実行は単一作業 chat 内で完結。中間 commit を打たないため `reset --hard HEAD` で即時復帰可能。)

---

## §7. 範囲外 (本 plan で扱わないもの)

- Filmtone LP Renewal Rev 2 (paused 中、別 stream — `.claude/plans/filmtone-lp-renewal-handoff-modular-sketch.md`)
- Photography rich LP 復元 (renewal plan §5.5 — Wave 3+ で別 stream)
- Filmtone 独立ドメイン化 (`filmtone.com`) のタイミング決定
- 3 Layer hierarchy (Shared Craft DNA / Core Portfolio Language / Satellite Brand Voices) の token 共有実装 — 別 plan として codify 予定

---

## §8. Execution Log

- 2026-04-26 plan 起案 (Claude / 本 chat)
- 実装は別 task #2-5 で進行中
