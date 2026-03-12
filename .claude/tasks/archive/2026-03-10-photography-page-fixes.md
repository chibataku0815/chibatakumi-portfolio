# Photography ページ修正 (2026-03-10)

## 概要
Photography LP の3つのバグを修正。

## 修正内容

### Fix 1: カウンターアニメーション (TestimonialSection.tsx)
- **原因:** React 18 Strict Mode のダブルマウントで `textContent` が "0+" に書き換わり、2回目の mount が target=0 を読む
- **修正:** `data-value` 属性に元値を保持し、`el.dataset.value` から読み取り。textContent はアニメーション開始前に "0+suffix" にリセット

### Fix 2: ヒーローテキスト改行 (HeroSection.tsx)
- **原因:** `text-wrap: balance` が CJK テキストを均等幅に分割 → "イベン|トの熱を" (3+4) に折れる
- **修正:** `text-balance` と `max-w` を削除し、`word-break: auto-phrase` を追加。貪欲アルゴリズムで "イベントの|熱を" (5+2) の自然な位置で改行

### Fix 3: GSAP ease 構文 (5箇所)
- **原因:** GSAP は CSS `cubic-bezier()` を認識せず、デフォルト ease にフォールバック
- **修正:**
  - `cubic-bezier(0.22, 1, 0.36, 1)` → `expo.out` (ServicesSection, AboutSection, CTAFormSection)
  - `cubic-bezier(0.34, 1.56, 0.64, 1)` → `back.out(1.56)` (ServicesSection)
  - `cubic-bezier(0.33, 1, 0.68, 1)` → `power2.out` (PhotographyClient)

## 対象ファイル
1. `apps/web/src/features/photography/sections/TestimonialSection.tsx`
2. `apps/web/src/features/photography/sections/HeroSection.tsx`
3. `apps/web/src/features/photography/sections/ServicesSection.tsx`
4. `apps/web/src/features/photography/sections/AboutSection.tsx`
5. `apps/web/src/features/photography/sections/CTAFormSection.tsx`
6. `apps/web/src/features/photography/PhotographyClient.tsx`

## ナレッジ参照
- `.ai/knowledge/gsap-ease-syntax.md`
- `.ai/knowledge/react18-strict-mode-dom-data.md`
- `.ai/knowledge/cjk-typography-pitfalls.md`
