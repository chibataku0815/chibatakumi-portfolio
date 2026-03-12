# React 18 Strict Mode と DOM 読み取りの罠

> 作成: 2026-03-10 | 発見契機: Photography LP のカウンターアニメーションが "0+" のまま動かなかった

## 問題

React 18 の Strict Mode（開発環境）は、**useEffect を2回実行**する:

```
mount → effect実行 → cleanup → mount → effect実行
```

1回目の effect で DOM の `textContent` を書き換えると、2回目の effect が**書き換え後の値**を読み取ってしまう。

### 具体例: カウンターアニメーション

```tsx
// ❌ BAD: textContent から初期値を読む
useEffect(() => {
  const el = document.querySelector(".stat-value");
  const text = el.textContent; // 2回目: "0+" を読む（1回目が書き換え済み）
  const target = parseInt(text.match(/\d+/)[1]); // target = 0

  gsap.to(obj, {
    val: target, // 0 にアニメーション → 見た目は動かない
    onUpdate: () => { el.textContent = Math.floor(obj.val) + "+"; }
  });
}, []);
```

**結果:** 1回目の effect が textContent を "0+" に書き換え → 2回目の effect が "0+" を読んで target=0 → アニメーションが 0→0 で見た目変化なし。

## 解決パターン: data-* 属性

```tsx
// ✅ GOOD: data-* 属性に元値を保持
// JSX
<p className="stat-value" data-value={stat.value}>
  {stat.value}
</p>

// useEffect
useEffect(() => {
  const el = document.querySelector(".stat-value") as HTMLElement;
  const raw = el.dataset.value; // 常に元の値を読める
  const target = parseInt(raw.match(/\d+/)[1]); // 正しい target

  // textContent を明示的にリセット（視覚的に0スタート）
  el.textContent = "0+";

  gsap.to(obj, {
    val: target,
    onUpdate: () => { el.textContent = Math.floor(obj.val) + "+"; }
  });
}, []);
```

## なぜ data-* 属性が安全か

- `data-*` 属性は React の管理下で**再レンダリング時に復元**される
- useEffect 内の DOM 操作は `textContent` のみ変更し、`data-*` 属性は変更しない
- 2回目の mount でも `dataset.value` は JSX で宣言した元の値を返す

## 適用場面

| パターン | 問題 | 対策 |
|----------|------|------|
| DOM textContent → アニメーション target | Strict Mode で初期値が失われる | `data-value` に保持 |
| DOM getAttribute → 計算 | 同上 | `data-*` 属性 |
| innerHTML の読み取り → 加工 | 同上 | `data-*` または ref で初期値保存 |

## 補足

- **本番環境では発生しない**（Strict Mode は開発のみ）
- ただし Strict Mode で壊れるコードは将来の React バージョンで問題を起こす可能性がある
- useEffect 内で DOM を読み取って書き換えるパターン自体がアンチパターン寄り
- 可能なら **React state で管理**し、DOM 操作を避けるのがベスト
- GSAP など外部ライブラリとの統合では data-* パターンが現実的な妥協点
