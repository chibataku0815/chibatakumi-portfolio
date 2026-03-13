---
title: "/photography LP ブラッシュアップ引き継ぎ"
created: 2026-03-09
status: active
project: chibatakumi-portfolio
repo: /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio
---

# /photography LP — ブラッシュアップ引き継ぎ

## 現状（MVP実装済み）

### 実装済みファイル一覧

| ファイル | 役割 |
|---------|------|
| `apps/web/src/app/photography/page.tsx` | ページルート + OG Tags / Twitter Card |
| `apps/web/src/features/photography/PhotographyClient.tsx` | LP本体（Client Component） |
| `apps/web/src/features/photography/index.ts` | barrel export |
| `apps/web/src/app/layout.tsx` | グローバル OG Tags / metadataBase 追加済み |
| `apps/web/src/app/sitemap.ts` | /photography 含む6ページの自動生成サイトマップ |
| `apps/web/src/app/robots.ts` | クローラー許可 + sitemap参照 |
| `apps/web/src/shared/data/portfolio.ts` | ナビに "Photography" リンク追加済み / siteUrl → chibatakumi.studio |

### LP構成（5セクション）

```
1. Hero       — "Event Photography in Tokyo" + CTA(Book Now / See Portfolio)
2. Services   — 3カード: Event Photography / Highlight Videos / Same-Day Delivery
3. Gallery    — Cafe Cursor Tokyo 8枚グリッド（2枚が大判） + Lightbox
4. About      — "I understand tech events because I'm part of the community."
5. CTA        — "Planning an event in Tokyo?" + Get in Touch ボタン
```

### 技術スタック

- Next.js 16 App Router（Server Component + Client Component分離）
- GSAP（hero fade-in, gallery scroll stagger, services stagger）
- Next.js `<Image>` で画像最適化（fill + sizes + object-cover）
- `<dialog>` ネイティブ要素でLightbox実装
- Tailwind v4 + Radix Colors（既存デザイントークン踏襲）
- OG Tags: /photography 専用メタデータ（1200x630 OG画像対応）

### ビルド状態

`bun run build` 成功（15ページ静的生成）。写真ファイルが未配置のため本番表示には写真配置が必要。

---

## デプロイ前に必要な作業

### 1. 写真配置（必須）

NASから8枚選んで `apps/web/public/photography/` に配置:

```
public/photography/
├── cafe-cursor-01.jpg  ← 空間系（P1000159, P1000502 等）
├── cafe-cursor-02.jpg
├── cafe-cursor-03.jpg
├── cafe-cursor-04.jpg
├── cafe-cursor-05.jpg
├── cafe-cursor-06.jpg
├── cafe-cursor-07.jpg
├── cafe-cursor-08.jpg
└── og-image.jpg        ← 1200x630px OG画像
```

**写真ソース**: `smb://forestone_923._smb._tcp.local/photo/2026-03-05-cafe-cursor-tokyo`

**選定基準**:
- index 0, 5 は大判表示（4:3）→ 空間の広がりが分かるワイドショット
- index 1-4, 6-7 は正方形表示 → 寄り・ディテール・雰囲気カット
- **肖像権ルール**: 広告使用は個人特定不可カットのみ（空間・シルエット・手元・ディテール）

**画像最適化推奨**:
- 長辺2000px以下にリサイズ（Next.js Imageがさらに最適化する）
- JPG品質85%程度
- OG画像は正確に1200x630pxで作成

### 2. Meta Pixel + GA4 設置（広告出稿の前提条件）

`apps/web/src/app/layout.tsx` の `<head>` にスクリプト追加が必要:

```tsx
// layout.tsx の <html> 内、<body> の前に追加
<head>
  {/* Meta Pixel */}
  <script dangerouslySetInnerHTML={{ __html: `
    !function(f,b,e,v,n,t,s){...}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', 'YOUR_PIXEL_ID');
    fbq('track', 'PageView');
  `}} />
  <noscript><img height="1" width="1" style={{display:'none'}} src="https://www.facebook.com/tr?id=YOUR_PIXEL_ID&ev=PageView&noscript=1" /></noscript>

  {/* GA4 */}
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX" />
  <script dangerouslySetInnerHTML={{ __html: `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
  `}} />
</head>
```

**必要なID**:
- Meta Pixel ID: Meta Business Suite → Events Manager で作成
- GA4 Measurement ID: Google Analytics → Admin → Data Streams で取得

---

## ブラッシュアップ候補

### 優先度高（LP効果に直結）

| 項目 | 詳細 |
|------|------|
| Hero全画面写真背景 | 現在はShader背景。写真をheroの背景にしてインパクト向上。LCP注意 |
| Gallery枚数拡張 | 8枚 → 12枚。`GALLERY_IMAGES` 配列に追加するだけ |
| Case Study磨き込み | 数字や testimonial に頼らず、制作意図と納品設計を見せる 3 カード構成へ更新 |
| CTA → B2Bフォーム | 現在は /contact（汎用）へ遷移。B2B専用フィールド追加（Event Date / Attendees / Needs） |
| LCP最適化 | Hero画像に `priority` 属性、`placeholder="blur"` + `blurDataURL` 追加 |

### 優先度中（2週間以内）

| 項目 | 詳細 |
|------|------|
| JSON-LD構造化データ | Photographer schema でリッチリザルト対応 |
| `/photography/gallery/cafe-cursor-tokyo` | 個別ギャラリーページ（フル30枚+） |
| Highlight Video埋め込み | 37秒動画の Reels/YouTube embed |
| モバイル最適化確認 | ギャラリーグリッドの2カラム→1カラム切り替え検討 |

### 優先度低（Phase 4以降）

| 項目 | 詳細 |
|------|------|
| 英語/日本語切り替え | next-intl or /en/ prefix |
| 複数案件ギャラリー | 案件が増えたらギャラリーをタブ/フィルターで分離 |
| 料金表セクション | 問い合わせ実績が出てから検討 |

---

## 既存サイトとの整合性メモ

- **デザイントークン**: globals.css の `--bg-dark`, `--text-base`, `--accent-amber1` 等をそのまま使用。独自CSSなし
- **アニメーション**: GSAPのみ（既存サイトと同一）。Three.js背景はlayout.tsxのHeroShaderBackgroundがグローバルに適用される
- **ナビゲーション**: `portfolio.ts` の `navigation.links` に追加済み。Nav.tsx は自動で反映
- **ページ遷移**: `data-transition="true"` でPageTransitionが動作。/contact へのリンクに適用済み
- **コンタクトフォーム**: 既存の `/contact` ページ（Slack Webhook統合済み）をそのまま利用。B2B拡張は別途

---

## 関連ファイルクイックリファレンス

```
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx              ← OG Tags / Meta Pixel追加先
│   │   ├── sitemap.ts              ← 新規作成済み
│   │   ├── robots.ts               ← 新規作成済み
│   │   ├── photography/
│   │   │   └── page.tsx            ← ページメタデータ
│   │   └── contact/
│   │       ├── page.tsx            ← 既存コンタクトページ
│   │       └── actions.ts          ← Server Action（Slack Webhook）
│   ├── features/
│   │   ├── photography/
│   │   │   ├── PhotographyClient.tsx ← LP本体
│   │   │   └── index.ts
│   │   └── contact/
│   │       ├── ContactClient.tsx   ← 既存フォーム（B2B拡張候補）
│   │       └── index.ts
│   └── shared/
│       ├── data/portfolio.ts       ← サイトデータ + ナビゲーション
│       ├── components/             ← AnimatedHeading, Nav, etc.
│       └── transitions/            ← PageTransition
├── public/
│   └── photography/                ← 写真配置先（要作成）
├── next.config.ts                  ← 空（必要に応じて images 設定追加）
└── package.json                    ← Next.js 16 / React 19 / GSAP / Three.js
```

---

## SNS投稿戦略（Phase 0）参照

Instagram/X投稿のスケジュールと素材選定は別ドキュメント参照:
→ `ideas/status/2026-03-09-chibatakumi-portfolio.md`（SNS投稿計画セクション）

**Instagramプロフィール最適化案**:
```
Takumi Chiba
📸 Event & Corporate Photography in Tokyo
🎬 Same-day delivery | Bilingual (EN/JP)
💻 Also a full-stack engineer
⬇️ Portfolio & Booking
www.chibatakumi.studio/photography
```

---

## Design Polish (2026-03-09 追記)

### 新規UIコンポーネント

| Component | Path | 用途 |
|-----------|------|------|
| Calendar | `src/shared/components/ui/calendar.tsx` | date-fnsベースのカスタムカレンダー（ダークテーマ） |
| DatePicker | `src/shared/components/ui/date-picker.tsx` | Calendar + dropdown統合、i18n対応 |
| Popover | `src/shared/components/ui/popover.tsx` | Radix Popover ラッパー |

### 追加パッケージ
- `date-fns` — 日付計算・locale
- `@radix-ui/react-popover` — Popover primitive

### GSAPモーション追加

| Section | Animation | Trigger |
|---------|-----------|---------|
| About | scroll-driven opacity (0.3→1.0) + card-settle rotateX stagger | scroll scrub / top 80% |
| CTA | form card reveal + submit button breathing amber glow | top 60% / 常時 |
| Testimonial | counter ignition (0→target + bounce) | top 70% |
| Services | card-settle rotateX:8 + icon pop bounce ease | top 75% / top 65% |

### Lightbox 改善
- 画像切替: slide crossfade transition（x:±60px + opacity）
- `isAnimating` ref guard で連打防止
- `isOpen` state で img 要素の条件レンダリング（空src警告解消）

### セクション間 Divider
- Gallery → Services 間に `h-px w-24` の装飾線
- `scaleX: 0→1` line-draw animation（`cubic-bezier(0.33, 1, 0.68, 1)`）

### CTA DatePicker
- `<input type="date">` → カスタム DatePicker に置換
- react-day-picker v9 → **自前実装**に変更（Vercel lightningcss互換性のため）
- ja/en locale対応（date-fns locale切替）

### Heat Tokens統一
- inline `rgba(255,196,61,N)` → `var(--heat-subtle)` に置換
- 対象: CTAFormSection, ServicesSection

### 技術修正
- VideoHeroBackground: pointerleave時のheat reset追加
- shader/config.ts: fallbackColor `#0a0a0a` → `#070707`（globals.css背景と統一）

### コミット
- `608f043` feat: Photography LP design polish — motion, lightbox transition, calendar UI
- `32e9ab2` fix: remove react-day-picker CSS import causing Vercel lightningcss error
- `e9c3951` feat: replace react-day-picker with custom calendar UI
