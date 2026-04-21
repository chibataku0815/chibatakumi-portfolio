# Film Lab Panel Flex Overflow - 技術知見

**作成日:** 2026-04-19T02:25:00+09:00 (Asia/Tokyo)
**カテゴリ:** Film Lab UI / Flex Layout / CJK Copy / Overflow

---

## 概要

Film Lab の右パネルで、**長い日本語 hint** と **segmented control** を同じ flex row に載せると、
見た目上は改行されているようでも親 row が content width に引っ張られ、**不要な横スクロール** が発生することがある。

今回の発生箇所は `crossFilterSpikes` 行で、`ポイント数` の説明文
`光条の本数: 4ポイント（クロス）、6ポイント（スノークロス）、8ポイント（サニークロス）。`
が右パネル幅を押し広げていた。

---

## 症状

- 右パネル下部で横スクロールが出る
- テキスト自体は 2 行に見えていても、親 flex item が縮まず panel 幅を超える
- 特に **CJK の長文 hint** と **shrink-to-content な小型 UI** を横並びにしたときに起こりやすい

---

## 根本原因

問題は `whitespace-normal` の有無だけではなく、**flex item の幅決定** にあった。

今回の悪い条件:

- 左カラムが `min-w-[...]` だけを持ち、**固定幅ではなかった**
- 親 row に `min-w-0` がなく、子が内容幅で押し広げられた
- 右カラムも `min-w-0` を持たず、segmented control 側が縮小余地を持てなかった

この状態では、hint テキストが見た目上折り返されても、
左カラムの **flex basis / content width** が長文に引っ張られ、結果として row 全体が overflow する。

---

## 今回の修正パターン

対象: `packages/film-lab-ui/src/FilmLabControlPanelCore.tsx`

### 変更前

- 左カラム: `min-w-[7.5rem] ... whitespace-nowrap sm:min-w-[8.5rem]`
- 親 row: `flex items-start gap-3`
- 右カラム: `flex-1`

### 変更後

- 親 row に `min-w-0`
- 左カラムを **最小幅ではなく固定幅** に変更
  - `w-[7.5rem] sm:w-[8.5rem] shrink-0`
- hint に `break-words whitespace-normal`
- 右カラムを `flex min-w-0 flex-1 justify-end`

---

## 再利用ルール

Film Lab パネルで以下の組み合わせを作るときは、同じパターンを使う:

- 左: ラベル + 補足説明
- 右: segmented control / button group / compact selector

守るべきルール:

1. 親 row に `min-w-0` を付ける
2. 左カラムは `min-w-*` ではなく `w-*` で **固定カラム化** する
3. 左カラムの補足文は `whitespace-normal` だけでなく `break-words` も付ける
4. 右カラムは `min-w-0 flex-1` を付ける
5. 「見た目で改行されている」だけでは安心せず、**panel 全体の横スクロール有無** を確認する

---

## 覚えておくこと

- flex overflow は「テキストが折り返されるか」ではなく、**どの要素が縮める責任を持つか** が本質
- CJK 長文は英語よりも「単語境界で自然に縮む」前提が弱いので、
  `min-w-0` と固定カラム設計を先に入れた方が安全
- shared UI では 1 行だけ custom row を作ると、`ControlSlider` など既存の幅制約パターンから外れて事故りやすい

---

## 関連ファイル

- `packages/film-lab-ui/src/FilmLabControlPanelCore.tsx`
- `packages/film-lab-ui/src/ui/ControlSlider.tsx`
- `packages/film-lab-ui/src/ui/SegmentedControl.tsx`
