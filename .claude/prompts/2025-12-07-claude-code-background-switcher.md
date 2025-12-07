# 2025-12-07 Claude Code 実装プロンプト（BackgroundSwitcher）
- Created: 2025-12-07T20:59:16+0900 (Asia/Tokyo)
- Model: Claude Code (Haiku 4.5)
- Purpose: ページパスに応じて背景コンポーネントを動的に切り替えるBackgroundSwitcherを実装
- Constraints: **コミット禁止**、最小差分、既存アーキテクチャ尊重
- Scope: `apps/web` 配下のみ

---

## 背景と目的

### 現在の問題
- `layout.tsx` で `HeroShaderBackground` が全ページ共通で配置されている
- `interactive/page.tsx` で `FluidGradientBackground` を追加配置 → **2つのWebGL背景が重複**
- パフォーマンス懸念とリソース無駄遣い

### 解決策
- `BackgroundSwitcher` クライアントコンポーネントを作成
- `usePathname()` でパスを判定し、適切な背景のみを表示
- 重複を完全に排除

---

## 期待する成果物

1. `src/shared/components/BackgroundSwitcher.tsx` - 新規作成
2. `src/shared/components/index.ts` - re-export追加
3. `src/app/layout.tsx` - BackgroundSwitcherに置き換え
4. `src/app/interactive/page.tsx` - FluidGradientBackground削除（BackgroundSwitcherが管理）

---

## 実装指示

### Step 1: BackgroundSwitcher コンポーネント作成

`src/shared/components/BackgroundSwitcher.tsx`:

```typescript
"use client";

import { usePathname } from "next/navigation";
import { HeroShaderBackground } from "@/features/hero/components";
import { FluidGradientBackground } from "@/features/fluid-gradient";

/**
 * 背景設定: パスごとに使用する背景タイプを定義
 * - "fluid": FluidGradientBackground (流体インタラクション)
 * - "hero": HeroShaderBackground (画像ベースシェーダー)
 */
const backgroundConfig: Record<string, "fluid" | "hero"> = {
  "/": "fluid",
  "/interactive": "fluid",
  "/motion": "hero",
  "/installation": "hero",
  "/archive": "hero",
  "/contact": "hero",
};

/**
 * BackgroundSwitcher
 * パスに応じて適切な背景コンポーネントを表示
 * 重複を防ぎ、1つのWebGLコンテキストのみをアクティブにする
 */
export function BackgroundSwitcher() {
  const pathname = usePathname();

  // パスに対応する背景タイプを取得（デフォルトは "hero"）
  const backgroundType = backgroundConfig[pathname] ?? "hero";

  return (
    <>
      {backgroundType === "fluid" && (
        <FluidGradientBackground className="fixed inset-0 -z-10" />
      )}
      {backgroundType === "hero" && <HeroShaderBackground />}
    </>
  );
}

export default BackgroundSwitcher;
```

---

### Step 2: index.ts に re-export 追加

`src/shared/components/index.ts` を編集し、BackgroundSwitcher を追加:

```typescript
export { Nav } from "./Nav";
export { AnimatedHeading } from "./AnimatedHeading";
export { BackgroundSwitcher } from "./BackgroundSwitcher";
```

---

### Step 3: layout.tsx を更新

`src/app/layout.tsx`:

**変更前:**
```typescript
import { HeroShaderBackground } from "@/features/hero/components";
```

**変更後:**
```typescript
import { BackgroundSwitcher } from "@/shared/components";
```

**JSX変更前:**
```tsx
<HeroShaderBackground />
```

**JSX変更後:**
```tsx
<BackgroundSwitcher />
```

**完成形:**
```typescript
import { BackgroundSwitcher } from "@/shared/components";
import { PageTransition } from "@/shared/transitions";
import { Nav } from "@/shared/components";
import { portfolioData } from "@/shared/data/portfolio";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: portfolioData.site.title,
  description: portfolioData.site.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Dynamic background based on current path */}
        <BackgroundSwitcher />

        <PageTransition>
          <Nav />
          {children}
        </PageTransition>
      </body>
    </html>
  );
}
```

---

### Step 4: interactive/page.tsx から重複背景を削除

`src/app/interactive/page.tsx`:

**削除する行:**
```typescript
import { FluidGradientBackground } from "@/features/fluid-gradient";
```

**削除するJSX:**
```tsx
{/* Fluid Gradient Background */}
<FluidGradientBackground className="fixed inset-0 -z-10" />
```

**完成形:**
```typescript
import { AnimatedHeading } from "@/shared/components";
import { portfolioData } from "@/shared/data/portfolio";

export default function InteractivePage() {
  const { label, title, cards } = portfolioData.pages.interactive;

  return (
    <main className="relative min-h-screen pt-32 pb-24">
      {/* Background is now managed by BackgroundSwitcher in layout.tsx */}

      {/* Hero */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-4xl">
          <span className="mb-4 block font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent-amber1)]/60">
            {label}
          </span>
          <AnimatedHeading
            as="h1"
            className="text-[clamp(2.5rem,8vw,5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--text-base)]"
          >
            {title}
          </AnimatedHeading>
        </div>
      </section>

      {/* Cards Grid */}
      <section className="px-6">
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.title}
              className="flex flex-col gap-4 rounded-lg bg-white/[0.02] p-6 transition-colors hover:bg-white/[0.04]"
            >
              {/* Visual placeholder */}
              <div className="aspect-square w-full bg-gradient-to-br from-white/5 to-transparent rounded-md" />

              <div className="flex flex-wrap gap-1.5">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--accent-amber1)]/60 bg-[var(--accent-amber1)]/10 px-1.5 py-0.5"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <h2 className="text-lg font-semibold tracking-tight text-[var(--text-base)]">
                {card.title}
              </h2>
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
```

---

## 背景設定の変更方法

将来的に背景の割り当てを変更したい場合は、`BackgroundSwitcher.tsx` の `backgroundConfig` を編集:

```typescript
const backgroundConfig: Record<string, "fluid" | "hero"> = {
  "/": "fluid",           // ← トップページ
  "/interactive": "fluid", // ← インタラクティブ
  "/motion": "hero",       // ← モーション
  // 新規ページを追加する場合もここに追記
};
```

---

## 品質チェックリスト

- [ ] TypeScript エラーがないこと
- [ ] `usePathname` が正しく動作すること
- [ ] トップページ (`/`) で FluidGradientBackground が表示されること
- [ ] `/interactive` で FluidGradientBackground が表示されること
- [ ] `/motion` 等で HeroShaderBackground が表示されること
- [ ] 背景が1つだけ表示され、重複していないこと
- [ ] ページ遷移時に背景が正しく切り替わること

---

## 禁止事項

1. **コミットを行わない**
2. **新規依存を追加しない**
3. **既存コンポーネントのロジックを変更しない** - 配置場所のみ変更
4. **console.log を残さない**

---

## 参照ファイル

### 変更対象
- `apps/web/src/shared/components/BackgroundSwitcher.tsx` (新規)
- `apps/web/src/shared/components/index.ts` (追加)
- `apps/web/src/app/layout.tsx` (編集)
- `apps/web/src/app/interactive/page.tsx` (編集)

### 参照（既存）
- `apps/web/src/features/hero/components/HeroShaderBackground.tsx`
- `apps/web/src/features/fluid-gradient/components/FluidGradientBackground.tsx`
