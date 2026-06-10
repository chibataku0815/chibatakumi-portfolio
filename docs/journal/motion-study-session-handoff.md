# Motion-study 記事執筆セッションの引き継ぎプロンプト

新しいセッションに motion-study 記事の執筆を引き継ぐとき、以下のブロックをそのまま渡す。
テイストの中身はここに書かない（正本 doc に委譲 — このファイルは工程と罠だけ）。

---

```
chibatakumi-portfolio（/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio）の
journal に motion-study 記事を追加してください。テイストは固定済みです — 自分の文体判断で逸脱しないこと。

## 0. 現状確認（着手前）
- `git status --short` — 並行セッションの未コミット作業が居る可能性がある。他人のファイルには触れない
- `node scripts/check-motion-study-style.mjs --all` — 既存記事の状態と、書きかけ草稿の有無を把握する
- `docs/journal/motion-study-rollout.md` で次に書くべき slug と進捗を確認する

## 1. 最初に読む（この順・スキップ禁止）
1. docs/journal/motion-study-writing-style.md — テイストの正本
   （読者規定・本文 5 セクション雛形・語彙写像表・断定語規律・公開 3 段ゲート）
2. docs/journal/motion-study-rollout.md — 展開順序・per-article 8 ファイルセット・SNS 制約
3. docs/journal/ja-writing-style.md — journal 共通の下層規約（常体・backtick・block 別規則）
4. 基準記事 lattice-breath（https://www.chibatakumi.studio/journal/motion-studies/lattice-breath）
   — 迷ったらこれと見比べる。タイトルは「〜に見える○○の解剖」系列の韻を踏襲

## 2. 執筆の鉄則
- 書く前に ground truth を読む: 本文に出す数値の唯一の出所は
  apps/web/src/features/journal/motion-demos/verbs/<slug>.ts と <slug>.params.ts。
  記憶・推測・それらしい数値は 1 個も書かない
- 断定語（のみ/だけ/すべて/〜ない）は実装と 1 件ずつ突合してから書く
- ja = master 独立執筆 / en = 事実完全一致 + sections 配列長 & block type 順序一致
- 帰属は敬称付き「プッティさん（@PuttiMW）」
- bit-parity（乱数列ビット同一）の主張は SNS 納品クリップが実在するセルのみ
- params 改変は 3 つだけ（再センタリング / ラスタ較正ゼロ化 / 色不携行）

## 3. 公開ゲート（順番に全部・ERROR 0 まで先に進まない）
1. vendor parity: vendored 写本 vs motion-grammar-lab 上流 package を全フレーム突き合わせ（Δ=0）
2. bun run build:web（両ロケール SSG 通過）
3. node scripts/check-motion-study-style.mjs <slug> — ERROR 0。
   warn の断定語リストは次工程の監査対象リストとして使う
4. 再構築可能性監査: 記事だけを仕様書として「自分が同じものを作れるか」をシミュレート
   （断定語の突合 / 従うと別物になる不可視チャンネルの有無 / 数値の復元経路が本文にあるか）
5. ユーザー承認。コミット/push = 本番公開。承認なしで push しない

## 4. 環境の罠
- 作業 dir は並行セッションと共有。コミットは自分のファイルだけを per-file add。
  AGENTS.md と他セッションの未コミットファイルは絶対に stage しない
- SSH push が agent 署名エラーで落ちたら:
  git -c credential.helper='!gh auth git-credential' push https://github.com/chibataku0815/chibatakumi-portfolio.git main
- デプロイ確認は gh run list --workflow "Vercel Production Deploy"
  （commit status の "Vercel – chibatakumi-portfolio: success" は空ビルドの赤ニシン）
- 本番検証は新コピー固有フレーズを cache-buster 付き URL（?v=<sha>）で grep。
  ストリーミング HTML はチャンク分割で文字列がまたがり、素の grep は取りこぼす
- /ja/ プレフィックス URL は 307 で無プレフィックスへ飛ぶ（ja がデフォルトロケール）

## 5. テイストを変えたくなったら
記事側で先に逸脱しない。docs/journal/motion-study-writing-style.md の更新案を
ユーザーに提示し、承認後に doc → 記事の順で適用する。
```
