# Photography LP i18n 実装 — 完全ハンドオフドキュメント

> **目的:** Photography LP の i18n 実装の全経緯・アーキテクチャ・コンポーネント・デザインシステムを
> 別チャットでのデザインブラッシュアップ作業に引き継ぐための包括的ドキュメント。
>
> **作成日:** 2026-03-09
> **ステータス:** i18n 実装完了、ビルド成功、検証済み

---

## 目次

1. [プロジェクト概要・背景](#1-プロジェクト概要背景)
2. [技術スタック](#2-技術スタック)
3. [i18n アーキテクチャ](#3-i18n-アーキテクチャ)
4. [URL構造 & ロケール設計](#4-url構造--ロケール設計)
5. [ディレクトリ構造](#5-ディレクトリ構造)
6. [レイアウト構造](#6-レイアウト構造)
7. [Photography LP コンポーネント詳細](#7-photography-lp-コンポーネント詳細)
8. [コンポーネント間データフロー](#8-コンポーネント間データフロー)
9. [デザインシステム](#9-デザインシステム)
10. [SEO対応](#10-seo対応)
11. [Nav & LanguageSwitcher](#11-nav--languageswitcher)
12. [翻訳メッセージ構造 & 全キー対応表](#12-翻訳メッセージ構造--全キー対応表)
13. [Server Actions](#13-server-actions)
14. [検証結果](#14-検証結果)
15. [デザインブラッシュアップ向け注意事項](#15-デザインブラッシュアップ向け注意事項)
16. [変更ファイル完全一覧](#16-変更ファイル完全一覧)

---

## 1. プロジェクト概要・背景

### なぜ i18n が必要だったか

- Photography LP は東京のイベント撮影サービスのLPだが、**全文英語で実装済み**だった
- 既存サイト（contact, profile）は**日本語**で運用中
- この不整合を解消し、**日本企業からの問い合わせ障壁を下げる**ため i18n を導入
- 日本語をデフォルトとし、英語版を `/en/` プレフィックスで提供する構成を採用

### スコープ

- **対象:** Photography LP のみ（全セクション翻訳済み）
- **他ページ:** `[locale]` セグメント化は完了。翻訳JSONにスタブのみ（将来対応）
- **言語:** 日本語（ja）+ 英語（en）

---

## 2. 技術スタック

| カテゴリ | 技術 | バージョン |
|---------|------|-----------|
| フレームワーク | Next.js | 16.0.7 |
| UI | React | 19.2.1 |
| スタイリング | Tailwind CSS | 4 |
| i18n | next-intl | 4.8.3 |
| アニメーション | GSAP | 3.13.0 |
| 3D/WebGL | Three.js | 0.181.2 |
| 3D React | @react-three/fiber | 9.4.2 |
| カラーシステム | @radix-ui/colors | 3.0.0 |
| TypeScript | typescript | 5.x |

**tsconfig パスエイリアス:** `@/*` → `./src/*`

---

## 3. i18n アーキテクチャ

### 採用: next-intl 4.8.3

**理由:**
- Vercel 公式推奨、Next.js App Router ネイティブ対応
- RSC (React Server Components) 完全統合
- TypeScript 完全型安全
- Middleware + Dynamic Routing + Static Generation 標準サポート

### ファイル構成と役割

| ファイル | 場所 | 役割 |
|---------|------|------|
| `routing.ts` | `src/i18n/routing.ts` | ロケール定義・ルーティング設定 |
| `request.ts` | `src/i18n/request.ts` | リクエストコンテキストでのメッセージ解決 |
| `navigation.ts` | `src/i18n/navigation.ts` | locale-aware Link/usePathname/useRouter |
| `middleware.ts` | `src/middleware.ts` | Edge Middleware でのロケール判定 |
| `next.config.ts` | Root | next-intl plugin 初期化 |
| メッセージ | `messages/en.json`, `messages/ja.json` | ロケール別翻訳文字列 |

### routing.ts

```typescript
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ja"],
  defaultLocale: "ja",
  localePrefix: "as-needed",
});
```

| 設定 | 値 | 説明 |
|-----|-----|------|
| locales | `["en", "ja"]` | 対応言語 |
| defaultLocale | `"ja"` | デフォルト言語（プレフィックスなし） |
| localePrefix | `"as-needed"` | ja はプレフィックスなし、en は `/en/...` |

### request.ts

```typescript
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as "en" | "ja")) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

- 各リクエストで locale を検証し、対応する messages JSON を動的インポート
- 無効な locale は `"ja"` にフォールバック

### navigation.ts

```typescript
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

| エクスポート | 用途 |
|------------|------|
| `Link` | locale-aware な `<Link>` コンポーネント |
| `redirect` | Server-side リダイレクト |
| `usePathname` | locale prefix を除いた pathname 取得 |
| `useRouter` | locale 自動付加の router |
| `getPathname` | Server-side パス構築 |

### middleware.ts

```typescript
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

- ユーザーリクエストを locale 判定し、適切な `[locale]` セグメントにルーティング
- API, _next, 静的ファイルは除外

### next.config.ts

```typescript
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);
```

---

## 4. URL構造 & ロケール設計

### 設計方針

| 設定 | 値 | 理由 |
|-----|-----|------|
| defaultLocale | `"ja"` | 既存サイトが日本語メイン、主要ターゲットが日本ユーザー |
| localePrefix | `"as-needed"` | 日本語 URL はシンプルに、英語のみプレフィックス |

### URL マッピング表

| ページ | 日本語 (default) | 英語 |
|-------|-----------------|------|
| ホーム | `/` | `/en` |
| スキル | `/skills` | `/en/skills` |
| **写真** | **`/photography`** | **`/en/photography`** |
| プロフィール | `/profile` | `/en/profile` |
| お問い合わせ | `/contact` | `/en/contact` |
| 作品集 | `/works` | `/en/works` |
| アーカイブ | `/archive` | `/en/archive` |
| モーション | `/motion` | `/en/motion` |
| インタラクティブ | `/interactive` | `/en/interactive` |
| インストレーション | `/installation` | `/en/installation` |

---

## 5. ディレクトリ構造

```
apps/web/src/
├── app/
│   ├── [locale]/                          # ★ locale セグメント
│   │   ├── layout.tsx                     # locale レイアウト (i18n Provider)
│   │   ├── page.tsx                       # ホーム
│   │   ├── not-found.tsx                  # 404
│   │   ├── error.tsx                      # エラー
│   │   ├── loading.tsx                    # ローディング
│   │   ├── photography/                   # ★ Photography LP
│   │   │   ├── layout.tsx                 # .photography-page ラッパー
│   │   │   └── page.tsx                   # metadata + JSON-LD + PhotographyClient
│   │   ├── contact/page.tsx
│   │   ├── skills/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── works/page.tsx
│   │   ├── archive/page.tsx
│   │   ├── motion/page.tsx
│   │   ├── interactive/page.tsx
│   │   └── installation/page.tsx
│   ├── layout.tsx                         # Root layout (pass-through のみ)
│   ├── globals.css                        # CSS カスタムプロパティ
│   ├── fonts.ts                           # Geist + Noto Sans JP
│   ├── favicon.ico
│   ├── robots.ts
│   └── sitemap.ts                         # hreflang alternates 対応
│
├── i18n/
│   ├── routing.ts                         # locale 定義
│   ├── request.ts                         # messages 読み込み
│   └── navigation.ts                      # locale-aware navigation
│
├── middleware.ts                           # Edge locale routing
│
├── features/
│   └── photography/                       # ★ Photography feature
│       ├── index.ts
│       ├── PhotographyClient.tsx           # セクション統合
│       ├── actions.ts                      # Server Action (Slack webhook)
│       ├── components/
│       │   └── VideoHeroBackground.tsx     # Three.js video shader
│       ├── sections/
│       │   ├── HeroSection.tsx
│       │   ├── GallerySection.tsx
│       │   ├── ServicesSection.tsx
│       │   ├── TestimonialSection.tsx
│       │   ├── AboutSection.tsx
│       │   ├── CTAFormSection.tsx
│       │   └── LightboxDialog.tsx
│       └── shader/
│           ├── config.ts                   # Film grain, vignette 等パラメータ
│           └── materials.ts                # Vertex + Fragment shader
│
└── shared/
    ├── components/
    │   ├── Nav.tsx                         # locale-aware Link
    │   ├── LanguageSwitcher.tsx            # EN | JA トグル
    │   ├── GlowButton.tsx                 # locale-aware Link
    │   ├── ShaderButton.tsx               # locale-aware Link
    │   └── MagneticButton.tsx             # locale-aware Link
    ├── data/
    │   └── portfolio.ts                   # サイトデータ
    └── transitions/
        └── PageTransition.tsx

messages/
├── en.json                                # 英語翻訳
└── ja.json                                # 日本語翻訳
```

---

## 6. レイアウト構造

### Root Layout (`app/layout.tsx`)

```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

- pass-through のみ。`<html>` / `<body>` は `[locale]/layout.tsx` で生成
- next-intl のベストプラクティスに準拠

### Locale Layout (`app/[locale]/layout.tsx`)

**主要な責務:**

| 処理 | 説明 |
|------|------|
| `generateStaticParams()` | SSG 対象: `["en", "ja"]` を事前ビルド |
| `generateMetadata()` | locale 動的 og:locale, alternates.languages |
| `hasLocale()` 検証 | 無効 locale → 404 |
| `setRequestLocale()` | request scope に locale セット |
| `getMessages()` | 翻訳メッセージ取得 |
| `<html lang={locale}>` | SEO + アクセシビリティ |
| `NextIntlClientProvider` | Client Components にメッセージ供給 |

**レンダリングツリー:**

```
<html lang={locale} className="dark {fontVariables}">
  <body className="antialiased">
    <NextIntlClientProvider messages={messages}>
      <HeroShaderBackground />        <!-- Three.js shader (locale非依存) -->
      <PageTransition>
        <Nav />                        <!-- locale-aware Link + LanguageSwitcher -->
        {children}                     <!-- 各ページ -->
      </PageTransition>
    </NextIntlClientProvider>
  </body>
</html>
```

---

## 7. Photography LP コンポーネント詳細

### 7.1 PhotographyClient.tsx

- **役割:** 6セクション + Lightbox のオーケストレーション
- **Props:** なし
- **i18n:** 各セクションに委譲
- **特記:** `useRef<LightboxHandle>` で Gallery→Lightbox 通信

### 7.2 HeroSection.tsx

- **i18n:** `useTranslations("photography.hero")`
- **キー:** `label`, `title`, `titleAccent`, `subtext`, `ctaBook`, `ctaPortfolio`
- **Props:** `videoSrc?`, `fallbackImage?`
- **背景:** `VideoHeroBackground` (Three.js + WebGL video shader)
  - Film grain, chromatic aberration, vignette, pointer interaction
  - Low-power device → 静止画フォールバック
- **アニメーション (GSAP):**
  - `.hero-entry` fade-in stagger: duration 0.8s, stagger 0.15s, delay 0.3s, ease power3.out
- **CTA:** `/contact` へ locale-aware Link

### 7.3 GallerySection.tsx

- **i18n:** `useTranslations("photography.gallery")`
- **キー:** `label`, `title`, `subtitle`, `images.{01-12}`
- **データ:** `GALLERY_IMAGES` (12枚、`altKey` で翻訳参照)
- **Featured:** 01, 06, 11 (col-span-2 row-span-2)
- **グリッド:** `grid-cols-2 md:grid-cols-4`
- **アニメーション:** ScrollTrigger stagger: duration 0.7s, stagger 0.1s, start "top 80%", once
- **Lightbox連携:** `onImageClick` callback → `lightboxRef.current?.open(i)`

### 7.4 ServicesSection.tsx

- **i18n:** `useTranslations("photography.services")`
- **キー:** `{eventPhotography|highlightVideos|sameDayDelivery}.{title|description}`
- **データ:** `SERVICE_KEYS` (3 const), `SERVICE_ICONS` (SVG)
- **グリッド:** `md:grid-cols-3`
- **アニメーション:** ScrollTrigger stagger: duration 0.6s, stagger 0.12s
- **ホバー:** border → amber1/40

### 7.5 TestimonialSection.tsx

- **i18n:** `useTranslations("photography.testimonial")`
- **キー:** `badge`, `event`, `description`, `stats.*`, `quote`, `quoteAuthor`, `quoteRole`
- **Stats:** 翻訳キーから動的取得 (attendees, coverage, delivery)
- **アニメーション:** ScrollTrigger stagger: duration 0.7s, stagger 0.12s

### 7.6 AboutSection.tsx

- **i18n:** `useTranslations("photography.about")`
- **キー:** `label`, `title`, `titleSub`, `body`
- **アニメーション:** なし

### 7.7 CTAFormSection.tsx

- **i18n:** `useTranslations("photography.form")` + `useLocale()`
- **キー:** 全フォームラベル、プレースホルダー、オプション、成功/エラーメッセージ
- **Server Action:** `submitPhotographyInquiry` (useActionState)
- **Hidden inputs:** `source="photography"`, `locale={locale}`
- **select value:** 英語固定（Slack通知用）、表示テキストのみ翻訳

### 7.8 LightboxDialog.tsx

- **i18n:** なし（画像表示のみ）
- **Props:** `images: Array<{ src: string; alt: string }>`
- **操作:** キーボード (Arrow/Escape) + マウス
- **アニメーション:** GSAP fade in/out (0.2-0.3s)
- **パターン:** `forwardRef<LightboxHandle>` で open メソッド公開

---

## 8. コンポーネント間データフロー

```
[locale]/photography/page.tsx (Server)
  ├─ generateMetadata() → locale動的 title/description/OG
  ├─ getJsonLd(locale) → 構造化データ
  ├─ setRequestLocale(locale)
  └─ <PhotographyClient /> (Client boundary)
       │
       ├─ HeroSection
       │   ├─ useTranslations("photography.hero")
       │   ├─ VideoHeroBackground (Three.js + WebGL)
       │   └─ Link → /contact
       │
       ├─ GallerySection
       │   ├─ useTranslations("photography.gallery")
       │   ├─ GALLERY_IMAGES (12枚)
       │   └─ onImageClick → lightboxRef.current?.open(i)
       │
       ├─ ServicesSection
       │   ├─ useTranslations("photography.services")
       │   └─ SERVICE_KEYS × SERVICE_ICONS
       │
       ├─ TestimonialSection
       │   └─ useTranslations("photography.testimonial")
       │
       ├─ AboutSection
       │   └─ useTranslations("photography.about")
       │
       ├─ CTAFormSection
       │   ├─ useTranslations("photography.form")
       │   ├─ useLocale() → hidden input locale
       │   └─ useActionState(submitPhotographyInquiry)
       │       └─ Server Action → Slack webhook
       │
       └─ LightboxDialog (forwardRef)
           ├─ ref: lightboxRef
           └─ images: GALLERY_IMAGES
```

---

## 9. デザインシステム

### 9.1 コンセプト: Pitch Black & Fire

- **Pitch Black:** Radix Slate Dark パレットで深い暗さを表現
- **Fire:** Radix Amber Dark パレットで温かみ・エネルギーを表現
- 暗い背景がフォトグラフィーの作品を引き立て、amber アクセントが CTA・ハイライトを強調

### 9.2 カラーパレット

#### セマンティックカラー
```css
--bg-dark: var(--slate-1)           /* 背景基本 */
--bg-darker: var(--slate-2)         /* カード背景 */
--text-base: var(--slate-12)        /* テキスト基本（最高コントラスト） */
--text-muted: var(--slate-11)       /* サブテキスト */
--accent-amber1: var(--amber-9)     /* アクセント #ffc53d */
--accent-amber2: var(--amber-10)    /* アクセント濃色 */
```

#### テキスト透明度バリエーション
```css
--text-base-90: color-mix(in srgb, var(--slate-12) 90%, transparent)
--text-base-80: color-mix(in srgb, var(--slate-12) 80%, transparent)
--text-base-60: color-mix(in srgb, var(--slate-12) 60%, transparent)
--text-base-50: color-mix(in srgb, var(--slate-12) 50%, transparent)
--text-base-40: color-mix(in srgb, var(--slate-12) 40%, transparent)
--text-base-30: color-mix(in srgb, var(--slate-12) 30%, transparent)
--text-base-20: color-mix(in srgb, var(--slate-12) 20%, transparent)
```

#### 発光効果トークン
```css
--shadow-glow-sm: 0 0 8px rgba(250, 250, 250, 0.6)
--shadow-glow-md: 0 0 12px rgba(250, 250, 250, 0.6)
--heat-glow-sm: 0 0 8px color-mix(in oklch, var(--accent-amber1) 40%, transparent)
--heat-glow-md: 0 0 12px color-mix(in oklch, var(--accent-amber1) 60%, transparent)
--heat-glow-lg: 0 0 20px color-mix(in oklch, var(--accent-amber1) 80%, transparent)
```

#### Radix CSS Import
```css
@import "@radix-ui/colors/slate-dark.css";
@import "@radix-ui/colors/amber-dark.css";
```

### 9.3 タイポグラフィ

#### フォントファミリー
| フォント | CSS変数 | 用途 |
|---------|--------|------|
| Geist Sans | `--font-geist-sans` | Latin テキスト |
| Geist Mono | `--font-geist-mono` | コード、ラベル |
| Noto Sans JP | `--font-noto-sans-jp` | 日本語テキスト (300, 400, 500, 700) |

#### タイポグラフィスケール
```css
--type-display-hero: clamp(3.5rem, 15vw, 14rem)   /* 56–224px */
--type-display-xl: clamp(2.5rem, 10vw, 10rem)     /* 40–160px */
--type-display-lg: clamp(2rem, 6vw, 6rem)         /* 32–96px */
--type-heading: clamp(1.5rem, 3.5vw, 3rem)        /* 24–48px */
--type-body-lg: clamp(1rem, 1.4vw, 1.4rem)        /* 16–22.4px */
--type-body: 1rem                                   /* 16px */
--type-caption: 0.875rem                            /* 14px */
```

#### レタースペーシング
```css
--tracking-ultra-tight: -0.06em
--tracking-tight: -0.02em
--tracking-normal: 0
--tracking-wide: 0.1em
--tracking-wider: 0.2em
```

### 9.4 アニメーションパターン (GSAP)

全アニメーションは `"use client"` コンポーネント内で GSAP 3 + ScrollTrigger を使用。

#### 共通 ScrollTrigger 設定
```javascript
scrollTrigger: {
  trigger: element,
  start: "top 80%",    // 要素上端がビューポート80%に達したとき
  once: true,           // 1回だけ実行
}
```

#### セクション別アニメーション

| セクション | 対象クラス | from | to | duration | stagger | ease |
|-----------|----------|------|-----|---------|---------|------|
| Hero | `.hero-entry` | opacity:0, y:40 | opacity:1, y:0 | 0.8s | 0.15s | power3.out |
| Gallery | `.gallery-item` | opacity:0, y:60, scale:0.95 | opacity:1, y:0, scale:1 | 0.7s | 0.1s | power3.out |
| Services | `.service-card` | opacity:0, y:40 | opacity:1, y:0 | 0.6s | 0.12s | power3.out |
| Testimonial | `.testimonial-entry` | opacity:0, y:30 | opacity:1, y:0 | 0.7s | 0.12s | power3.out |

#### GSAP Context パターン（必須）
```typescript
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.fromTo(...);
  }, sectionRef.current);  // scope 指定
  return () => ctx.revert();  // cleanup 必須
}, []);
```

### 9.5 コンポーネントスタイリングパターン

#### ボーダー
- 標準: `border-[var(--text-base-20)]`
- ホバー: `hover:border-[var(--accent-amber1)]/40`

#### 背景
- セクション: `bg-[var(--bg-dark)]` (body 継承)
- カード: `bg-[var(--bg-darker)]`
- アクセント: `bg-[var(--accent-amber1)]/10`

#### テキスト
- ボディ: `text-[var(--text-base)]`
- サブ: `text-[var(--text-muted)]`
- ミュート: `text-[var(--text-base-60)]` / `text-[var(--text-base-40)]`
- アクセント: `text-[var(--accent-amber1)]`

#### Rounded
- ボタン: `rounded-full`
- カード: `rounded-2xl`
- 入力: `rounded-lg`

#### Spacing
- セクション: `px-6 py-24`
- コンテンツ最大幅: `max-w-6xl` / `max-w-5xl` / `max-w-4xl` / `max-w-3xl` / `max-w-2xl`

### 9.6 レスポンシブパターン

- **Gallery:** `grid-cols-2` → `md:grid-cols-4`
- **Services:** `grid-cols-1` → `md:grid-cols-3`
- **タイトル:** `clamp()` による流動的スケーリング
- **Nav テキスト:** `text-[10px] sm:text-xs`
- **Nav gap:** `gap-2 sm:gap-4 md:gap-6`

---

## 10. SEO対応

### 10.1 sitemap.ts

全ページに `alternates.languages` (hreflang) を設定:

```typescript
alternates: {
  languages: {
    ja: `${BASE_URL}${page.path}`,
    en: `${BASE_URL}/en${page.path}`,
  },
}
```

| ページ | Priority | changeFrequency |
|-------|----------|-----------------|
| Home | 1.0 | monthly |
| Photography | 0.9 | weekly |
| Skills | 0.8 | monthly |
| Profile / Works | 0.7 | monthly |
| Contact | 0.6 | yearly |

### 10.2 Photography Page Metadata

`getTranslations({ locale, namespace: "photography.metadata" })` で動的生成:

| フィールド | ja | en |
|-----------|-----|-----|
| title | 東京のイベント撮影 | Event Photography in Tokyo |
| og:locale | ja_JP | en_US |
| canonical | /photography | /en/photography |

### 10.3 JSON-LD 構造データ

**ProfessionalService:**
- name, description, url, image, inLanguage (locale動的)
- serviceType: locale別（日本語/英語）
- address: Tokyo, JP
- founder: Takumi Chiba

**ImageGallery:**
- name: Cafe Cursor Tokyo — March 2026
- description: locale 動的
- inLanguage: locale 動的
- about: Cursor Tokyo Meetup Event

### 10.4 robots.ts

```typescript
rules: { userAgent: "*", allow: "/" },
sitemap: "https://www.chibatakumi.studio/sitemap.xml",
```

---

## 11. Nav & LanguageSwitcher

### Nav.tsx

- `Link`, `usePathname` を `@/i18n/navigation` から import（locale-aware）
- `portfolioData.navigation.links` でリンク生成
- アクティブ判定: `pathname === href`
- 右端に `<LanguageSwitcher />` 統合

### LanguageSwitcher.tsx

```typescript
const locale = useLocale();
const pathname = usePathname();
const router = useRouter();
const [isPending, startTransition] = useTransition();

function switchLocale(newLocale: "en" | "ja") {
  if (newLocale === locale) return;
  startTransition(() => {
    router.replace(pathname, { locale: newLocale });
  });
}
```

**UI:** `EN | JA` テキストトグル
- アクティブ: `text-[var(--text-base)] opacity-100`
- 非アクティブ: `text-[var(--text-muted)] opacity-60`
- Pending: `opacity-50` + `disabled`
- 区切り: `border-l border-[var(--text-base-20)]`

### locale-aware Link に移行したファイル

- `Nav.tsx`
- `GlowButton.tsx`
- `ShaderButton.tsx`
- `MagneticButton.tsx`
- `not-found.tsx`
- `HeroSection.tsx`

---

## 12. 翻訳メッセージ構造 & 全キー対応表

### ネームスペース構造

```
photography.hero.*
photography.gallery.*
photography.gallery.images.{01-12}
photography.services.{eventPhotography|highlightVideos|sameDayDelivery}.*
photography.testimonial.*
photography.testimonial.stats.*
photography.about.*
photography.form.*
photography.form.eventTypeOptions.*
photography.form.attendeesOptions.*
photography.form.errors.*
photography.metadata.*
common.*
nav.*
```

### 全キー対応表

#### photography.hero

| キー | EN | JA |
|-----|-----|-----|
| label | Tokyo-Based Event Photographer | 東京拠点のイベントフォトグラファー |
| title | Event Photography | イベント撮影 |
| titleAccent | in Tokyo | in Tokyo |
| subtext | Same-day previews. Full gallery in 72 hours. Bilingual coverage for Tokyo's tech community. | 当日中にプレビューをお届け。全データは72時間以内に納品。東京のテックコミュニティに寄り添うバイリンガル撮影。 |
| ctaBook | Book Now | 撮影を依頼する |
| ctaPortfolio | See Portfolio | 撮影実績を見る |

#### photography.gallery

| キー | EN | JA |
|-----|-----|-----|
| label | Featured Work | 撮影実績 |
| title | Cafe Cursor Tokyo | Cafe Cursor Tokyo |
| subtitle | Cursor (by Anysphere) official Tokyo meetup — March 2026 | Cursor（Anysphere）公式東京ミートアップ — 2026年3月 |
| images.01-12 | (各画像のalt英語) | (各画像のalt日本語) |

#### photography.services

| キー | EN | JA |
|-----|-----|-----|
| eventPhotography.title | Event Photography | イベント撮影 |
| eventPhotography.description | Every moment that matters — candid interactions... | 大切な瞬間をすべて記録します... |
| highlightVideos.title | Highlight Videos | ハイライト動画 |
| highlightVideos.description | A 30-60 second story of your event... | 30〜60秒のイベントストーリーを制作... |
| sameDayDelivery.title | Same-Day Delivery | 当日納品 |
| sameDayDelivery.description | Your team shares on social while the event is still fresh... | イベントの余韻が冷めないうちにSNSでシェア... |

#### photography.testimonial

| キー | EN | JA |
|-----|-----|-----|
| badge | Official Photographer | 公式フォトグラファー |
| event | Cursor Tokyo Meetup | Cursor Tokyo Meetup |
| description | Selected as the official photographer... | Cursor初の東京コミュニティミートアップにて... |
| stats.attendeesValue | 200+ | 200+ |
| stats.attendeesLabel | Attendees Captured | 名の参加者を撮影 |
| stats.coverageValue | 3hrs | 3時間 |
| stats.coverageLabel | Full Event Coverage | フルイベントカバレッジ |
| stats.deliveryValue | Same Day | 当日 |
| stats.deliveryLabel | Preview Delivery | プレビュー納品 |
| quote | Takumi captured the energy of our community perfectly... | Takumiさんは、コミュニティのエネルギーを完璧に写し取ってくれました... |
| quoteAuthor | Cafe Cursor Tokyo | Cafe Cursor Tokyo |
| quoteRole | Community Event | コミュニティイベント |

#### photography.about

| キー | EN | JA |
|-----|-----|-----|
| label | About | About |
| title | I understand tech events | テックイベントを理解できるのは |
| titleSub | because I'm part of the community. | コミュニティの一員だから。 |
| body | I am both a full-stack engineer and an event photographer... | エンジニアでもあり、イベントフォトグラファーでもあるからこそ... |

#### photography.form

| キー | EN | JA |
|-----|-----|-----|
| heading | Let's capture your next event. | 次のイベント、一緒に記録しませんか。 |
| subheading | Share your event details... | イベントの詳細をお聞かせください... |
| nameLabel | Name | お名前 |
| emailLabel | Email | メールアドレス |
| eventTypeLabel | Event Type | イベントの種類 |
| eventTypeOptions.techMeetup | Tech Meetup | テックミートアップ |
| eventTypeOptions.corporateEvent | Corporate Event | 企業イベント |
| eventTypeOptions.conference | Conference | カンファレンス |
| eventTypeOptions.communityGathering | Community Gathering | コミュニティイベント |
| eventTypeOptions.other | Other | その他 |
| eventDateLabel | Event Date | イベント開催日 |
| attendeesLabel | Estimated Attendees | 想定参加人数 |
| attendeesOptions.under50 | Under 50 | 50名未満 |
| attendeesOptions.50-100 | 50-100 | 50〜100名 |
| attendeesOptions.100-200 | 100-200 | 100〜200名 |
| attendeesOptions.200-500 | 200-500 | 200〜500名 |
| attendeesOptions.500+ | 500+ | 500名以上 |
| detailsLabel | Additional Details | その他のご要望 |
| submit | Send Inquiry | お問い合わせを送信する |
| submitting | Sending... | 送信中... |
| successTitle | Thank you! | 送信完了 |
| successMessage | I'll get back to you within 24 hours. | 24時間以内にご連絡いたします。 |
| errors.name | Please enter your name | お名前を入力してください |
| errors.email | Please enter a valid email address | 有効なメールアドレスを入力してください |
| errors.eventType | Please select an event type | イベントの種類を選択してください |
| errors.submitFailed | Failed to send. Please try again later. | 送信に失敗しました。しばらくしてから再度お試しください。 |

#### photography.metadata

| キー | EN | JA |
|-----|-----|-----|
| title | Event Photography in Tokyo | 東京のイベント撮影 |
| description | Bilingual event photographer in Tokyo... | 東京拠点のバイリンガルイベントフォトグラファー... |
| ogTitle | Event Photography in Tokyo \| Takumi Chiba | 東京のイベント撮影 \| Takumi Chiba |
| ogDescription | Same-day previews. Full gallery in 72 hours... | 当日プレビュー。72時間以内に全データ納品... |

### 翻訳トーン

- **日本語:** ですます調（丁寧語）、柔らかく親しみやすい
- **既存 contact ページと統一**
- **プロジェクト名・ブランド名は翻訳しない**（Cafe Cursor Tokyo, Cursor Tokyo Meetup 等）

---

## 13. Server Actions

### Photography Actions (`features/photography/actions.ts`)

- **locale 対応済み:** hidden input `name="locale"` でフォームからlocale受け取り
- **ERROR_MESSAGES:** en/ja 両方のエラーメッセージを `as const` で定義
- **validateFormData:** `data.locale` に基づいてメッセージ選択
- **Slack メッセージ:** フィールドラベルは英語固定、`*Locale*` フィールドで言語記録
- **Dev mode:** SLACK_WEBHOOK_URL 未設定時は console.log のみ

### Contact Actions (`features/contact/actions.ts`)

- **locale 未対応:** エラーメッセージは日本語ハードコード（将来対応）
- **移動済み:** `app/[locale]/contact/actions.ts` → `features/contact/actions.ts`（import path 修正）

---

## 14. 検証結果

### ビルド

```
✓ Compiled successfully
✓ Generating static pages (25/25) — en + ja 全ページ
✓ TypeScript エラーなし
```

### lang 属性

| URL | `<html lang>` |
|-----|---------------|
| `/photography` | `ja` |
| `/en/photography` | `en` |
| `/` | `ja` |

### コンテンツ確認

| URL | 確認テキスト |
|-----|------------|
| `/photography` | 東京拠点, イベント撮影, 撮影を依頼する |
| `/en/photography` | Tokyo-Based, Event Photography, Book Now |

### OG Tags

| URL | og:locale |
|-----|-----------|
| `/photography` | `ja_JP` |
| `/en/photography` | `en_US` |

### Sitemap

```xml
<loc>https://www.chibatakumi.studio/photography</loc>
<xhtml:link rel="alternate" hreflang="ja" href="...chibatakumi.studio/photography" />
<xhtml:link rel="alternate" hreflang="en" href="...chibatakumi.studio/en/photography" />
```

---

## 15. デザインブラッシュアップ向け注意事項

### テキスト追加・変更時

1. `messages/en.json` と `messages/ja.json` を**同時に**更新
2. コンポーネントで `useTranslations("namespace")` → `t("key")` で参照
3. 画像 alt は `altKey` + `t("images.{key}")` パターン
4. select option の `value` は英語固定、表示テキストのみ翻訳

### アニメーション変更時

- GSAP `context` でスコープ管理必須（`ctx.revert()` で cleanup）
- ScrollTrigger は `once: true` が標準
- 依存配列は空 `[]`（1回だけ実行）

### CSS 変更時

- Tailwind CSS 4 + CSS カスタムプロパティ優先
- `text-[var(--text-base)]` 形式（Tailwind のデフォルトカラーではなく）
- `clamp()` でレスポンシブ（固定ブレークポイント値より推奨）

### 日本語テキスト表示

- フォント: Geist Sans → Noto Sans JP → フォールバック
- 行間: 日本語は `leading-relaxed` (1.6+) が読みやすい
- 文字幅: 英語より自然に広いため、コンテナ幅に注意

### VideoHeroBackground

- WebGL 非サポート/低スペック端末 → 静止画フォールバック
- IntersectionObserver でビュー外ではビデオ停止
- shader パラメータは `shader/config.ts` で一元管理

### LanguageSwitcher の位置

- Nav 右端に `border-l` で区切って配置
- `font-mono text-[10px] sm:text-xs uppercase`
- 切り替え時は `useTransition` + `router.replace` で遷移

---

## 16. 変更ファイル完全一覧

### 新規作成（i18n 基盤）

| ファイル | 説明 |
|---------|------|
| `src/i18n/routing.ts` | locale 定義 |
| `src/i18n/request.ts` | メッセージ解決 |
| `src/i18n/navigation.ts` | locale-aware navigation |
| `src/middleware.ts` | Edge locale routing |
| `messages/en.json` | 英語翻訳 |
| `messages/ja.json` | 日本語翻訳 |
| `src/shared/components/LanguageSwitcher.tsx` | EN\|JA トグル |
| `src/features/photography/actions.ts` | locale対応 Server Action |
| `src/features/contact/actions.ts` | 移動（import path 修正） |

### 移動（`app/` → `app/[locale]/`）

- `page.tsx`, `not-found.tsx`, `error.tsx`, `loading.tsx`
- `archive/`, `contact/`, `installation/`, `interactive/`, `motion/`, `photography/`, `profile/`, `skills/`, `works/`

### 変更

| ファイル | 変更内容 |
|---------|---------|
| `next.config.ts` | next-intl plugin 追加 |
| `src/app/layout.tsx` | pass-through に簡素化 |
| `src/app/[locale]/layout.tsx` | **新規作成** — NextIntlClientProvider, 動的 lang, generateStaticParams |
| `src/app/[locale]/photography/page.tsx` | 動的 metadata, JSON-LD inLanguage |
| `src/app/sitemap.ts` | alternates.languages 追加 |
| `src/shared/components/Nav.tsx` | locale-aware Link + LanguageSwitcher |
| `src/shared/components/GlowButton.tsx` | next/link → @/i18n/navigation Link |
| `src/shared/components/ShaderButton.tsx` | next/link → @/i18n/navigation Link |
| `src/shared/components/MagneticButton.tsx` | next/link → @/i18n/navigation Link |
| `src/app/[locale]/not-found.tsx` | next/link → @/i18n/navigation Link |
| `src/features/photography/PhotographyClient.tsx` | subtext prop 削除 |
| `src/features/photography/sections/HeroSection.tsx` | useTranslations + VideoHeroBackground |
| `src/features/photography/sections/GallerySection.tsx` | useTranslations + altKey パターン |
| `src/features/photography/sections/ServicesSection.tsx` | useTranslations |
| `src/features/photography/sections/TestimonialSection.tsx` | useTranslations |
| `src/features/photography/sections/AboutSection.tsx` | useTranslations |
| `src/features/photography/sections/CTAFormSection.tsx` | useTranslations + locale hidden input |
| `src/features/contact/ContactClient.tsx` | import path 修正 |

### 削除

| ファイル | 理由 |
|---------|------|
| `src/app/[locale]/photography/actions.ts` | `features/photography/actions.ts` に移動 |
| `src/app/[locale]/contact/actions.ts` | `features/contact/actions.ts` に移動 |

---

> **このドキュメントで Photography LP の i18n 実装全体を把握できます。**
> **デザインブラッシュアップ時は、セクション 15 の注意事項を必ず確認してください。**
