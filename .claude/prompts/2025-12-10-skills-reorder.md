# Skills表示順序変更 実装プロンプト

## 概要

`portfolio.ts` の `multiskillItems` 配列を編集し、スキルの表示順序を変更する。
また「コーヒー」スキルを新規追加する。

---

## 対象ファイル

```
apps/web/src/shared/data/portfolio.ts
```

---

## 実装手順

### Step 1: ファイルを読み込む

`Read` ツールで `apps/web/src/shared/data/portfolio.ts` を読み込む。

### Step 2: multiskillItems 配列の順序を変更

`multiskillItems` 配列の要素を以下の順序に並べ替える。

**新しい順序:**

1. **Code & Interaction Systems** (現在 id: "02")
2. **Identity & Systems** (現在 id: "04")
3. **Visual & Photo Direction** (現在 id: "01")
4. **Motion & Sound Layering** (現在 id: "03")
5. **Coffee & Hospitality** (新規追加 id: "05")

### Step 3: コーヒースキルを追加

配列の最後（5番目）に以下の新規スキルを追加:

```typescript
{
  id: "05",
  title: "Coffee & Hospitality",
  description:
    "スペシャルティコーヒーの焙煎・抽出から、空間演出としてのサービス設計まで。一杯を通じて体験全体をデザインする視点を持つ。",
  meta: "Coffee & Hospitality",
  role: "Barista / Coffee Consultant",
  tags: ["Specialty Coffee", "Roasting", "Extraction", "Hospitality"],
  media: { type: "image", src: "/spotlight/img_5.jpg", alt: "Coffee" },
  background: "#0b0b0b",
  accent: "#c4a574",
},
```

**注意:** 画像パスは仮設定。実際の画像に合わせて変更が必要な場合は別途対応。

---

## 変更後の配列構造

```typescript
const multiskillItems: WorkItem[] = [
  {
    id: "02",
    title: "Code & Interaction Systems",
    // ... 既存の内容
  },
  {
    id: "04",
    title: "Identity & Systems",
    // ... 既存の内容
  },
  {
    id: "01",
    title: "Visual & Photo Direction",
    // ... 既存の内容
  },
  {
    id: "03",
    title: "Motion & Sound Layering",
    // ... 既存の内容
  },
  {
    id: "05",
    title: "Coffee & Hospitality",
    // ... 新規追加
  },
];
```

---

## 実装上の注意

1. **IDは変更しない**: 各スキルの `id` プロパティは既存のまま維持する。配列の順序のみ変更する。

2. **他のプロパティは変更しない**: 既存スキルの `title`, `description`, `meta`, `role`, `tags`, `media`, `background`, `accent` は変更しない。

3. **コミット禁止**: 実装完了後、絶対にコミットを行わないこと。

4. **works と skills は同じデータを参照**: `portfolioData.works.items` と `portfolioData.skills.items` は両方とも `multiskillItems` を参照しているため、一度の変更で両方に反映される。

---

## 検証方法

変更後、以下を目視確認:

- `/skills` ページでスキルが新しい順序で表示されること
- 5つ目にコーヒースキルが表示されること

---

## 備考

- 構図パターンは `index % 3` で自動決定されるため、順序変更により各スキルの構図が変わる
- 新しい順序: 開発(A) → デザイン(B) → 写真(C) → 映像(A) → コーヒー(B)

---

作成日: 2025-12-10
対象モデル: Claude Haiku 4.5
