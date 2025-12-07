# Section Scroll Snap Implementation

- Created: 2025-12-07T22:12:01+0900 (Asia/Tokyo)
- Status: Completed

---

## 概要

indexページにセクションスクロールスナップ（スクロールジャック）を実装。中途半端なスクロール位置を防止し、セクション境界でスナップする。

---

## 技術的知見

### GSAP pinned セクションとスナップの競合問題

**問題:**
- `pin: true` + `scrub: 1` のセクションでは CSS `scroll-snap` は機能しない
- GSAP Observer でスナップを実装すると、pinned セクション内の scrub アニメーション中にもスナップが発動

**解決策:**
- ScrollTrigger の `progress` プロパティを使用
- progress が 0〜2% または 98〜100% の場合のみスナップを許可
- それ以外の場合（scrub アニメーション中）はスナップを無効化

```typescript
const canSnapInPinnedSection = (scrollTriggerId: string): boolean => {
  const st = ScrollTrigger.getById(scrollTriggerId)
  if (!st) return true
  const progress = st.progress
  return progress <= 0.02 || progress >= 0.98
}
```

### ScrollTrigger ID の活用

ScrollTrigger に `id` を設定することで、他のコンポーネントから参照可能:

```typescript
// HorizontalWorks.tsx
ScrollTrigger.create({
  id: 'horizontal-works',  // ← ID設定
  trigger: wrapperRef.current,
  // ...
})

// 別コンポーネントから取得
const st = ScrollTrigger.getById('horizontal-works')
const progress = st?.progress  // 0〜1
const start = st?.start        // スクロール開始位置
const end = st?.end            // スクロール終了位置
```

### GSAP Observer の使用

wheel/touch イベントを統一的にキャプチャ:

```typescript
Observer.create({
  type: 'wheel,touch',
  tolerance: 10,
  preventDefault: false,
  onUp: () => { /* 上方向スクロール */ },
  onDown: () => { /* 下方向スクロール */ },
  onStop: () => { /* スクロール停止 */ },
})
```

---

## 実装構造

```
src/features/scroll-manager/
├── components/
│   ├── SectionScrollManager.tsx   # Observer + スナップ制御
│   └── index.ts
├── hooks/
│   ├── useSectionSnap.ts          # スナップロジック + progress判定
│   └── index.ts
└── index.ts
```

---

## セクション境界の定義

```typescript
interface SectionBoundary {
  name: string
  start: number
  end: number
  isPinned?: boolean
  scrollTriggerId?: string
}
```

| セクション | isPinned | scrollTriggerId |
|-----------|----------|-----------------|
| hero | false | - |
| horizontal | true | 'horizontal-works' |
| spotlight | true | 'spotlight-gallery' |
| footer | false | - |

---

## 関連ファイル

- `apps/web/src/features/scroll-manager/` - 新規作成
- `apps/web/src/features/works/horizontal/HorizontalWorks.tsx` - ID追加
- `apps/web/src/features/works/spotlight/SpotlightGallery.tsx` - ID追加
- `apps/web/src/app/page.tsx` - SectionScrollManager 統合

---

## 参照

- [GSAP Observer](https://gsap.com/docs/v3/Plugins/Observer/)
- [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
