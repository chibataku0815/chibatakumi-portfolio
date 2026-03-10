# ScrollTrigger ピットフォール集

## 存在しないScrollTrigger IDの参照によるスナップバグ

### 症状
ページ最下部までスクロールすると、自動的に先頭に反動で戻される。

### 原因
`SectionScrollManager` が `ScrollTrigger.getById('horizontal-works')` 等で存在しないScrollTriggerを参照。
- `getSectionBoundaries()` が不正確な境界値を計算
- `handleScrollEnd()` が非pinセクションで「中途半端な位置」と判断
- `gsap.to(window, { scrollTo: 0 })` で先頭にスナップ

### 修正
ページに対応するセクションが存在しない場合、`SectionScrollManager` を使用しない。

```tsx
// BEFORE: 存在しないScrollTriggerを参照してバグ
<main>
  <SectionScrollManager />
  <HomeHero />
</main>

// AFTER: ヒーローのみのページではスナップ不要
<main>
  <HomeHero />
</main>
```

### 教訓
- ScrollTriggerベースのスナップロジックは、**対応するpinセクションが全て存在する**前提で動作する
- ページ構成が変わったら、スナップマネージャーの対応も必須
- `ScrollTrigger.getById()` が `null` を返す場合のフォールバックを実装すべき

## pin() と pinSpacing の注意点

- `pin: true` はセクションを固定し、スクロール距離を擬似的に拡張する
- `pinSpacing: true` は `document.documentElement.scrollHeight` に影響
- 複数の `pin()` が同時に存在する場合、`refresh()` 時に境界値が不安定化する可能性がある

## Observer.create の副作用

```javascript
Observer.create({
  type: 'wheel,touch',
  onStop: () => {
    // スクロール停止時にスナップ → 意図しないスナップの原因
    setTimeout(() => handleScrollEnd(), 150)
  },
})
```

- `onStop` は**全てのスクロール停止**でトリガーされる
- ページ最下部でも発火し、不正なスナップ先に飛ばされる
- 対策: スナップ前に `scrollY` が有効な範囲内かチェック
