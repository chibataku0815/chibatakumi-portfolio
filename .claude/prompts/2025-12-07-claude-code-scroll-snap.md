# 2025-12-07 Claude Code 実装プロンプト（Section Scroll Snap）

- Created: 2025-12-07T21:53:46+0900 (Asia/Tokyo)
- Model: Claude Code (Haiku 4.5)
- Purpose: indexページにセクションスナップ（スクロールジャック）を実装
- Constraints: **コミット禁止**、最小差分、既存アーキテクチャ尊重
- Scope: `apps/web` 配下のみ

---

## コンテキスト

### Stack
- Next.js 16 (App Router) + React 19 + Tailwind v4
- GSAP 3.13.0 + ScrollTrigger + ScrollToPlugin
- パスエイリアス: `@/* → ./src/*`

### 現状の問題
- `page.tsx` は Hero、HorizontalWorks、SpotlightGallery、Footer の4セクション構成
- セクション間の遷移が中途半端な位置で停止する可能性がある
- CSS `scroll-snap` は `pin: true` のセクションでは機能しない

### 目標
- セクションごとにきっちりスナップするスクロールジャックを実装
- pinされたセクション内ではGSAPの `scrub` アニメーションを邪魔しない
- モバイルのタッチスクロールにも対応

---

## 期待する成果物

1. `src/features/scroll-manager/` ディレクトリ構造
2. `SectionScrollManager.tsx` コンポーネント
3. 既存ScrollTriggerへのID追加
4. `page.tsx` への統合

---

## 実装指示

### Step 1: ディレクトリ構造作成

以下の構造を作成する:

```
src/features/scroll-manager/
├── components/
│   ├── SectionScrollManager.tsx
│   └── index.ts
├── hooks/
│   ├── useSectionSnap.ts
│   └── index.ts
└── index.ts
```

各 `index.ts` は適切な re-export を行う。

---

### Step 2: GSAP Observer プラグイン登録確認

GSAP Observer は追加インストール不要（gsap パッケージに含まれる）。
使用するファイルで以下のように登録する:

```typescript
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { Observer } from 'gsap/Observer'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, Observer)
}
```

---

### Step 3: useSectionSnap フック作成

`hooks/useSectionSnap.ts`:

```typescript
'use client'

import { useRef, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export interface SectionBoundary {
  name: string
  start: number
  end: number
}

export function useSectionSnap() {
  const isSnappingRef = useRef(false)
  const currentSectionRef = useRef(0)

  /**
   * セクション境界を取得
   * ScrollTrigger の start/end から計算
   */
  const getSectionBoundaries = useCallback((): SectionBoundary[] => {
    const heroEnd = window.innerHeight

    // HorizontalWorks の ScrollTrigger
    const horizontalST = ScrollTrigger.getById('horizontal-works')
    const horizontalEnd = horizontalST?.end ?? heroEnd

    // SpotlightGallery の ScrollTrigger
    const spotlightST = ScrollTrigger.getById('spotlight-gallery')
    const spotlightEnd = spotlightST?.end ?? horizontalEnd

    return [
      { name: 'hero', start: 0, end: heroEnd },
      { name: 'horizontal', start: heroEnd, end: horizontalEnd },
      { name: 'spotlight', start: horizontalEnd, end: spotlightEnd },
      { name: 'footer', start: spotlightEnd, end: document.documentElement.scrollHeight },
    ]
  }, [])

  /**
   * 現在のセクションインデックスを取得
   */
  const getCurrentSection = useCallback((scrollY: number, sections: SectionBoundary[]): number => {
    for (let i = sections.length - 1; i >= 0; i--) {
      if (scrollY >= sections[i].start - 10) {
        return i
      }
    }
    return 0
  }, [])

  /**
   * 指定セクションへスナップ
   */
  const snapToSection = useCallback((sectionIndex: number, sections: SectionBoundary[]) => {
    if (isSnappingRef.current) return
    if (sectionIndex < 0 || sectionIndex >= sections.length) return

    const target = sections[sectionIndex].start
    isSnappingRef.current = true

    gsap.to(window, {
      scrollTo: target,
      duration: 0.8,
      ease: 'power2.inOut',
      onComplete: () => {
        isSnappingRef.current = false
        currentSectionRef.current = sectionIndex
      },
    })
  }, [])

  /**
   * スクロール方向に応じて次/前のセクションへスナップ
   */
  const handleSnap = useCallback((direction: 'up' | 'down') => {
    if (isSnappingRef.current) return

    const sections = getSectionBoundaries()
    const scrollY = window.scrollY
    const currentSection = getCurrentSection(scrollY, sections)

    // セクション境界近くかチェック（閾値: 100px）
    const section = sections[currentSection]
    const atStart = Math.abs(scrollY - section.start) < 100
    const atEnd = Math.abs(scrollY - section.end) < 100

    if (direction === 'down' && atEnd && currentSection < sections.length - 1) {
      snapToSection(currentSection + 1, sections)
    } else if (direction === 'up' && atStart && currentSection > 0) {
      snapToSection(currentSection - 1, sections)
    }
  }, [getSectionBoundaries, getCurrentSection, snapToSection])

  return {
    isSnappingRef,
    currentSectionRef,
    getSectionBoundaries,
    getCurrentSection,
    snapToSection,
    handleSnap,
  }
}
```

---

### Step 4: SectionScrollManager コンポーネント作成

`components/SectionScrollManager.tsx`:

```typescript
'use client'

import { useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { Observer } from 'gsap/Observer'
import { useSectionSnap } from '../hooks/useSectionSnap'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, Observer)
}

export function SectionScrollManager() {
  const { isSnappingRef, handleSnap, getSectionBoundaries, snapToSection, getCurrentSection } = useSectionSnap()
  const observerRef = useRef<Observer | null>(null)
  const lastScrollY = useRef(0)
  const scrollTimeout = useRef<number | null>(null)

  /**
   * スクロール停止時にスナップ
   */
  const handleScrollEnd = useCallback(() => {
    if (isSnappingRef.current) return

    const sections = getSectionBoundaries()
    const scrollY = window.scrollY
    const currentSection = getCurrentSection(scrollY, sections)
    const section = sections[currentSection]

    // セクションの開始位置から離れている場合、最も近いセクションへスナップ
    const distanceToStart = Math.abs(scrollY - section.start)
    const distanceToEnd = Math.abs(scrollY - section.end)

    // セクション内で中途半端な位置にいる場合
    if (distanceToStart > 50 && distanceToEnd > 50) {
      // より近い方にスナップ
      if (distanceToStart < distanceToEnd) {
        snapToSection(currentSection, sections)
      } else if (currentSection < sections.length - 1) {
        snapToSection(currentSection + 1, sections)
      }
    }
  }, [isSnappingRef, getSectionBoundaries, getCurrentSection, snapToSection])

  useEffect(() => {
    // Observer でスクロール/タッチイベントをキャプチャ
    observerRef.current = Observer.create({
      type: 'wheel,touch',
      tolerance: 10,
      preventDefault: false,
      onUp: () => {
        if (!isSnappingRef.current) {
          handleSnap('up')
        }
      },
      onDown: () => {
        if (!isSnappingRef.current) {
          handleSnap('down')
        }
      },
      onStop: () => {
        // スクロール停止後にスナップ判定
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current)
        }
        scrollTimeout.current = window.setTimeout(() => {
          handleScrollEnd()
        }, 150)
      },
    })

    // scroll イベントでも補助的に監視
    const handleScroll = () => {
      lastScrollY.current = window.scrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      observerRef.current?.kill()
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
    }
  }, [handleSnap, handleScrollEnd, isSnappingRef])

  // このコンポーネントはUIを持たない
  return null
}
```

---

### Step 5: index.ts ファイル作成

#### `components/index.ts`
```typescript
export { SectionScrollManager } from './SectionScrollManager'
```

#### `hooks/index.ts`
```typescript
export { useSectionSnap } from './useSectionSnap'
export type { SectionBoundary } from './useSectionSnap'
```

#### `features/scroll-manager/index.ts`
```typescript
export * from './components'
export * from './hooks'
```

---

### Step 6: 既存ScrollTriggerにID追加

#### `src/features/works/horizontal/HorizontalWorks.tsx`

ScrollTrigger.create の引数に `id` を追加（約290行目）:

**変更前:**
```typescript
scrollTriggerRef.current = ScrollTrigger.create({
  trigger: wrapperRef.current,
  start: "top top",
  end: () => "+=" + scrollDistance,
  scrub: 1,
  pin: true,
  anticipatePin: 1,
  animation: mainTimeline,
  onUpdate: (self) => {
    // ...
  },
});
```

**変更後:**
```typescript
scrollTriggerRef.current = ScrollTrigger.create({
  id: 'horizontal-works',  // ← 追加
  trigger: wrapperRef.current,
  start: "top top",
  end: () => "+=" + scrollDistance,
  scrub: 1,
  pin: true,
  anticipatePin: 1,
  animation: mainTimeline,
  onUpdate: (self) => {
    // ...
  },
});
```

#### `src/features/works/spotlight/SpotlightGallery.tsx`

ScrollTrigger.create の引数に `id` を追加（約112行目）:

**変更前:**
```typescript
scrollTriggerRef.current = ScrollTrigger.create({
  trigger: sectionRef.current,
  start: "top top",
  end: `+=${window.innerHeight * 15}px`,
  pin: true,
  pinSpacing: true,
  scrub: 1,
  onUpdate: (self) => {
    // ...
  },
});
```

**変更後:**
```typescript
scrollTriggerRef.current = ScrollTrigger.create({
  id: 'spotlight-gallery',  // ← 追加
  trigger: sectionRef.current,
  start: "top top",
  end: `+=${window.innerHeight * 15}px`,
  pin: true,
  pinSpacing: true,
  scrub: 1,
  onUpdate: (self) => {
    // ...
  },
});
```

---

### Step 7: page.tsx に統合

`src/app/page.tsx` を編集:

**変更前:**
```typescript
import { HeroText } from "@/features/hero/components";
import { HorizontalWorks, SpotlightGallery } from "@/features/works";
import {
  FluidGradientBackground,
  fluidConfigMonochrome,
} from "@/features/fluid-gradient";

export default function Home() {
  return (
    <main>
      {/* ... existing content ... */}
    </main>
  );
}
```

**変更後:**
```typescript
import { HeroText } from "@/features/hero/components";
import { HorizontalWorks, SpotlightGallery } from "@/features/works";
import {
  FluidGradientBackground,
  fluidConfigMonochrome,
} from "@/features/fluid-gradient";
import { SectionScrollManager } from "@/features/scroll-manager";

export default function Home() {
  return (
    <main>
      {/* Section Scroll Snap Manager */}
      <SectionScrollManager />

      {/* Hero Section - uses HeroShaderBackground from layout.tsx */}
      <section className="relative min-h-screen">
        <HeroText />
      </section>

      {/* Works Sections with Fluid Gradient Background */}
      <div className="relative">
        {/* Sticky container for Fluid Background - starts after Hero */}
        <div className="sticky top-0 h-screen w-full -z-[5]">
          <FluidGradientBackground
            className="absolute inset-0"
            config={fluidConfigMonochrome}
          />
        </div>

        {/* Content overlays the sticky background */}
        <div className="relative -mt-[100vh]">
          {/* Horizontal Works Section */}
          <HorizontalWorks />

          {/* Spotlight Gallery */}
          <SpotlightGallery />

          {/* Footer spacer */}
          <section className="h-[50vh]" />
        </div>
      </div>
    </main>
  );
}
```

---

## 動作確認ポイント

1. **Heroセクション → HorizontalWorksへのスナップ**
   - Heroの終端付近でスクロールダウンすると、HorizontalWorksの開始位置へスナップ

2. **HorizontalWorks内のスクロール**
   - scrubアニメーションが正常に動作すること
   - パネル間の遷移がスムーズであること

3. **HorizontalWorks → SpotlightGalleryへのスナップ**
   - HorizontalWorks完了後、SpotlightGalleryの開始位置へスナップ

4. **SpotlightGallery内のスクロール**
   - 3Dアニメーションが正常に動作すること

5. **モバイルでのタッチスクロール**
   - タッチ操作でも同様のスナップ動作

---

## 品質チェックリスト

- [ ] TypeScript エラーがないこと
- [ ] Observer が cleanup で kill されること
- [ ] スナップアニメーション中は二重トリガーしないこと
- [ ] 既存の ScrollTrigger アニメーションが正常動作すること
- [ ] リサイズ時にセクション境界が正しく再計算されること

---

## 禁止事項

1. **コミットを行わない** - 実装完了後もコミットは禁止
2. **依存追加しない** - Observer は gsap パッケージに含まれる
3. **既存ファイルを不必要に変更しない** - ID追加とimport追加のみ
4. **console.log を残さない** - デバッグコードは削除
5. **any 型を使わない** - 適切な型定義を行う

---

## 参照ファイル

### 修正対象
- `apps/web/src/app/page.tsx`
- `apps/web/src/features/works/horizontal/HorizontalWorks.tsx`
- `apps/web/src/features/works/spotlight/SpotlightGallery.tsx`

### パターン参照
- `apps/web/src/features/fluid-gradient/` - feature構造の参考

### GSAP ドキュメント
- Observer: https://gsap.com/docs/v3/Plugins/Observer/
- ScrollToPlugin: https://gsap.com/docs/v3/Plugins/ScrollToPlugin/
