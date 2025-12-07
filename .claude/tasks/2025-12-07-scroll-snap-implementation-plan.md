# 2025-12-07 Section Scroll Snap Implementation Plan

- Created: 2025-12-07T21:53:46+0900 (Asia/Tokyo)
- Completed: 2025-12-07T22:12:01+0900 (Asia/Tokyo)
- Status: ✅ Completed
- Target: `apps/web`

---

## 背景と課題

### 現状
- `apps/web/src/app/page.tsx` はHero、HorizontalWorks、SpotlightGallery、Footerの4セクションで構成
- HorizontalWorksとSpotlightGalleryは `pin: true` + `scrub: 1` でスクロールアニメーションを制御
- セクション間の遷移が中途半端な位置で停止する可能性がある

### 問題点
- ユーザーがスクロールを途中で止めると、セクションの境界がビューポートの中途半端な位置に表示される
- CSS `scroll-snap` は `pin: true` のセクションでは機能しない（GSAPがスクロール位置を制御するため）

### 要件
- セクションごとにスナップ（セクションの開始位置に自動スクロール）
- pinされたセクション内ではGSAPの `scrub` アニメーションを邪魔しない
- モバイルのタッチスクロールにも対応
- パフォーマンスへの影響を最小限に

---

## 技術調査

### 現在使用中のGSAPプラグイン
- `ScrollTrigger` - スクロール駆動アニメーション
- `ScrollToPlugin` - プログラマティックスクロール（HorizontalWorksで使用済み）

### 追加が必要なプラグイン
- `Observer` - wheel/touchイベントの効率的なキャプチャ

### セクション構成とスクロール距離

| セクション | 高さ | スクロール距離 | 制御 |
|-----------|------|--------------|------|
| Hero | 1vh | 1vh | 通常スクロール |
| HorizontalWorks | 1vh (pinned) | `innerHeight * panels * 2.2` | ScrollTrigger (scrub) |
| SpotlightGallery | 1vh (pinned) | `innerHeight * 15` | ScrollTrigger (scrub) |
| Footer | 0.5vh | 0.5vh | 通常スクロール |

### スナップポイント
1. Hero開始: `0`
2. HorizontalWorks開始: `window.innerHeight`
3. SpotlightGallery開始: HorizontalWorksのScrollTrigger終了位置
4. Footer開始: SpotlightGalleryのScrollTrigger終了位置

---

## 実装方針

### アプローチ: GSAP Observer + ScrollToPlugin

**選定理由:**
- 既存のGSAPエコシステムと統合
- wheel/touchイベントを効率的にキャプチャ
- スクロール方向を検知
- デバウンス/スロットリングが組み込み
- モバイル対応

### 実装構造

```
src/features/scroll-manager/
├── components/
│   └── SectionScrollManager.tsx   # スクロールスナップ制御コンポーネント
├── hooks/
│   └── useSectionSnap.ts          # スナップロジック
├── utils/
│   └── scrollRegistry.ts          # セクション登録・位置計算
└── index.ts
```

### 動作フロー

```
ユーザースクロール
    ↓
Observer がイベントキャプチャ
    ↓
┌─ スナップアニメーション中？ ──┐
│  YES → イベント無視            │
└────────────────────────────────┘
    ↓ NO
┌─ セクション境界近く？ ────────┐
│  - Hero終端 (～innerHeight)    │
│  - HorizontalWorks終端         │
│  - SpotlightGallery終端        │
│  YES → 次セクション開始へスナップ │
└────────────────────────────────┘
    ↓ NO
通常スクロール（GSAPのscrubに任せる）
```

---

## 実装詳細

### SectionScrollManager コンポーネント

**責務:**
1. Observer でスクロールイベントをキャプチャ
2. 現在のスクロール位置からセクションを判定
3. セクション境界でスナップアニメーションを実行
4. スナップ中は追加のスクロールを無視

**状態管理:**
- `isSnapping`: スナップアニメーション中フラグ
- `currentSection`: 現在のセクションインデックス

### セクション境界の計算

ScrollTriggerの `start` と `end` プロパティからセクション境界を取得:

```typescript
const getSectionBoundaries = () => {
  const heroEnd = window.innerHeight;

  // HorizontalWorksのScrollTriggerから取得
  const horizontalST = ScrollTrigger.getById('horizontal-works');
  const horizontalEnd = horizontalST?.end || heroEnd;

  // SpotlightGalleryのScrollTriggerから取得
  const spotlightST = ScrollTrigger.getById('spotlight-gallery');
  const spotlightEnd = spotlightST?.end || horizontalEnd;

  return [
    { name: 'hero', start: 0, end: heroEnd },
    { name: 'horizontal', start: heroEnd, end: horizontalEnd },
    { name: 'spotlight', start: horizontalEnd, end: spotlightEnd },
    { name: 'footer', start: spotlightEnd, end: document.documentElement.scrollHeight },
  ];
};
```

### スナップ判定ロジック

```typescript
const shouldSnap = (scrollY: number, direction: 'up' | 'down', sections: Section[]) => {
  const threshold = 50; // px

  for (const section of sections) {
    // セクション開始位置付近でのスナップ
    if (Math.abs(scrollY - section.start) < threshold) {
      return { target: section.start, section };
    }
  }

  return null;
};
```

---

## 変更対象ファイル

### 新規作成
- `src/features/scroll-manager/components/SectionScrollManager.tsx`
- `src/features/scroll-manager/hooks/useSectionSnap.ts`
- `src/features/scroll-manager/utils/scrollRegistry.ts`
- `src/features/scroll-manager/index.ts`

### 修正
- `src/app/page.tsx` - SectionScrollManager の配置
- `src/features/works/horizontal/HorizontalWorks.tsx` - ScrollTrigger に ID 追加
- `src/features/works/spotlight/SpotlightGallery.tsx` - ScrollTrigger に ID 追加

---

## リスクと対策

| リスク | 対策 |
|--------|------|
| スナップとscrubの競合 | スナップはセクション境界のみ、セクション内はscrubに委譲 |
| モバイルでの挙動 | Observer は touch イベントも統一処理 |
| リサイズ時の位置ずれ | セクション境界をリサイズ時に再計算 |
| パフォーマンス低下 | Observer の throttle 機能を活用 |

---

## 参照ファイル

### 既存実装
- `apps/web/src/features/works/horizontal/HorizontalWorks.tsx`
- `apps/web/src/features/works/spotlight/SpotlightGallery.tsx`
- `apps/web/src/app/page.tsx`

### GSAP ドキュメント
- [GSAP Observer](https://gsap.com/docs/v3/Plugins/Observer/)
- [GSAP ScrollToPlugin](https://gsap.com/docs/v3/Plugins/ScrollToPlugin/)

---

## 次のステップ

1. Claude Code (Haiku 4.5) 向け実装プロンプト作成
2. ACTIVE-PARALLEL-TASK.md 更新
3. 実装委譲
