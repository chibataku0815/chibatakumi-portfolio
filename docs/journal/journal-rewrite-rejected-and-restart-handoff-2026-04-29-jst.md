# Journal — リライト却下 → 精査再起動ハンドオフ

**作成日**: 2026-04-29 JST（前ハンドオフ `journal-curation-and-japanese-review-handoff-2026-04-29-jst.md` の続き／**リライト却下**を受けての再起動）
**前提**: portfolio リポ `/Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio` (branch: `main`, HEAD: `28b0ded2`)
**目的**: 別チャットでこの作業を **ゼロから精査し直す** ための完全な引き継ぎ。本ドキュメントを最初に必ず読むこと。

---

## 0. このセッションの結論（最重要）

**リライトは却下された。** ユーザーの言葉:

> 「ライト・サブストレートに統一する — Renewal 2026 の判断と削ったもの」意味がわからないし、誰に対して何を伝えないかもわかりません
>
> 論外過ぎます
> 次のチャットで精査し直してください

つまり:

1. **タイトルの意味が伝わらない**: 「ライト・サブストレート」が何を指すか、なぜそれが価値ある話題なのかが、読者に開かれていない
2. **誰に対して何を伝えるかがわからない**: 想定読者・記事の役割・読後に何が残るかが、表現として埋め込まれていない
3. **既存リライト全体の前提が崩れた**: タイトルがこのレベルで失敗している以上、本文・要約・metaDescription も同じ問題を抱えている可能性が高い

**コミットしていない。** 現在の作業ツリーは未コミットの状態（前セッションの HEAD `28b0ded2` から進んでいない）。次セッションは、私のリライトを採用するか、破棄してやり直すかを最初に決める必要がある。

---

## 1. 現在のファイル状態（次セッションが受け取るもの）

### 1.1 編集された tracked files（コミット未実行）

```
M apps/web/messages/ja.json           (649 行差分: +520 / -154)
M apps/web/src/shared/data/journal.ts (+25 行の JSDoc)
```

**`ja.json` の変更内容（私のリライト）**:

- `journal.intro` を書き換え
- `journal.entries.<3 slugs>.{title, summary, metaDescription}` を書き換え
- `journal.motionStudies.entries.<4 slugs>.{title, summary, metaDescription}` を書き換え
- `journal.articles.<3 main slugs>.sections[]` の paragraph / heading / list 各 block の text を書き換え（code block は不変、section 数 / type 順序も保持）
- `journal.articles.motion-studies.<4 slugs>.sections[]` の paragraph / heading / list 各 block の text を書き換え（同上）

**`journal.ts` の変更内容**:

- ファイル先頭に JSDoc を追加し、`kind` / `evidenceLevel` / `status` の運用ポリシーを言語化、`docs/journal/curation-rationale.md` への参照を残した

### 1.2 新規作成された untracked docs

```
docs/journal/ja-writing-style.md       (14 KB — 日本語執筆スタイル規範)
docs/journal/curation-rationale.md     (8.2 KB — キュレーション根拠)
docs/journal/wave-2-backlog.md         (6.3 KB — 次 wave 候補)
docs/journal/journal-curation-and-japanese-review-handoff-2026-04-29-jst.md (前ハンドオフ、24 KB、既存)
docs/journal/journal-rewrite-rejected-and-restart-handoff-2026-04-29-jst.md (本ハンドオフ)
```

### 1.3 検証済み事実

- JSON 構造健全（`python3 -m json.tool` パス）
- section 数 / block type 順序は EN と完全一致を維持
- `bunx tsc --noEmit` は journal 関連でクリーン（残 1 件のエラーは無関係の `release-data.test.ts`）
- `bun run build` は成功（exit 0）。SSG が JA/EN 両ロケールで全 journal ページを生成

→ **技術的には壊れていない。失敗したのは「言葉の選択と読者への到達」の層。**

---

## 2. このセッションで起きたこと（時系列）

### 2.1 前提

前ハンドオフ `journal-curation-and-japanese-review-handoff-2026-04-29-jst.md` を起点として開始。前ハンドオフは:
- `/journal/` セクション（Wave 1, 全 7 entry）の (1) 日本語品質 (2) キュレーション根拠 を 2 軸で精査せよ、という議題
- 詳細な事実関係（リポマップ、レジストリ構造、翻訳ファイル、現状の懸念）を整理済み

### 2.2 Phase 1（探索）

3 並列の Explore agent を起動:

| Stream | スコープ | 主要発見 |
|--------|----------|----------|
| A | `ja.json` の `journal` 名前空間を逐文診断 | 94 件 / 47 フィールドの問題（english-mixing 68 件、literary-tone 12 件、term-inconsistency 8 件、translation-smell 4 件など） |
| B | `en.json` と `ja.json` の対比 | **EN-master 確定**: 56 ブロックペア中 51 が EN 先行、独立執筆は `journal.intro` のみ |
| C | `journal.ts` レジストリ + 動的ルート + git 履歴 | レジストリにキュレーション根拠未記録。motion-study 動的ルートは sections 不在時に空 `<div>` を描画 |

Stream A は `articles.motion-studies.<slug>.sections[]` パスを見落としており、「motion-studies の本文は未執筆」と誤報告。実際は各 8 sections が既存。

### 2.3 Phase 2（方針決定）

ユーザーへ AskUserQuestion で 4 問を提示し、以下が確定:

| 軸 | 確定方針 |
|----|----------|
| JA リライト方針 | **独立執筆に切り替える**（EN は参考、JA は自然な日本語として再執筆） |
| 想定読者 | **デザイン系同業 + テクノロジスト**（クラフトとトレードオフを許容、文学的トーンも有効） |
| 文学的トーン | **ハイブリッド**（本文は中立な技術語彙、callout / 章結び / 「もうひとつ」節のみ文学トーン） |
| motion-studies 本文 | 既存 8 sections × 4 を独立執筆スタイルにリライト |

### 2.4 Phase 3（実装）

Plan ファイル (`/Users/chibatakumi/.claude/plans/docs-journal-journal-curation-and-japane-zany-bonbon.md`) を承認後、Auto Mode で実装:

1. `docs/journal/ja-writing-style.md` を起こす（表記ルール・用語決定・文体規範）
2. `docs/journal/curation-rationale.md` を起こす（Wave 1 selection logic、kind / evidenceLevel / status 運用）
3. `docs/journal/wave-2-backlog.md` を起こす（次 wave 候補 7 件）
4. `journal.ts` 上部に JSDoc 追加
5. Python スクリプト `/tmp/rewrite_journal_ja.py` で `ja.json` の journal 名前空間を一括書き換え
6. tsc + build で検証 → クリア

検証 grep で `ライト面` / lowercase `theatre` / `プラミング` / 一人称 `自分は` / `編集物として強/致命/弱` / `見るに堪え` の **残存 0** を確認、と報告。

### 2.5 Phase 4（却下）

ユーザーがリライト後のタイトル例を見て却下:

> 「ライト・サブストレートに統一する — Renewal 2026 の判断と削ったもの」意味がわからないし、誰に対して何を伝えないかもわかりません
> 論外過ぎます

→ コミット未実行のまま、本ハンドオフを書く指示が下りた。

---

## 3. 何が失敗したかの診断（次セッションへの本質的な申し送り）

### 3.1 表面的な失敗

リライト後タイトル「ライト・サブストレートに統一する — Renewal 2026 の判断と削ったもの」は:

- 「ライト・サブストレート」が **読者には何の concept も呼び起こさない造語** のまま放置されている
- 「統一する」は何が何になったかが文中に開かれていない（背景? UI? 全体? 読者は推測しないと読めない）
- 「Renewal 2026」は内部プロジェクト名で、**外部読者には文脈ゼロ**
- 「判断と削ったもの」は読み手側のメリットゼロの紹介（読むと何が得られるかが伝わらない）

### 3.2 根本原因（推測）

私は「ja-writing-style.md」を立てて、以下のルールを機械的に適用した:

1. EN-master を維持しつつ、JA の clause 順序を独立化
2. 用語揺れを統一（`light substrate` → カナ「ライト・サブストレート」または backtick）
3. 文学的トーンを callout / 章結びだけに残す
4. 一人称・主観評価語を排除

→ 結果として、**「翻訳調が消えた読みやすい JA」** にはなったが、**「読者にとって意味のある JA」** にはなっていない。

ルールが扱っていなかったもの:

- **読者が何を持って帰るか**（記事のテーゼ、benefit、so what）
- **記事タイトルが扉として機能するか**（クリックする動機）
- **造語・自前概念名（"light substrate", "motion-dot", "data-readability"）が、初見読者にとって何を意味するか**
- **「Renewal 2026」のような内部固有名を、外部読者がどう受け取るか**
- **記事が journal index に並んだとき、どの 1 本を読みたくなるかの誘引**

### 3.3 構造的な見落とし

ユーザーが Phase 2 で「想定読者 = デザイン系同業 + テクノロジスト」と回答した時、私はそれを「専門用語そのまま使ってよい」と解釈した。しかし読者像をもっと具体的に詰めるべきだった:

- どのデザイン同業? UI デザイナー? Web デザイナー? アートディレクター?
- どのテクノロジスト? フロントエンド? バックエンド? CG / シェーダー?
- 既知の文脈は? Filmtone を知っている? 千葉拓巳のロゴワークを知っている?
- このサイトに来る経路は? Twitter? GitHub? 仕事の選定中?
- 読後の **行動** は? 連絡? ブックマーク? 同業に共有? 何かを真似する?

これを詰めずに「`WebGPU` を説明なしで使ってよい」だけで先に進んだのが、根本のミス。

### 3.4 もうひとつの構造問題: そもそもこの 7 本は「公開する記事」として成立しているか

ユーザーは前ハンドオフ §1 で「**なぜこれらを選んだかも不明**」と書いていた。私は `curation-rationale.md` を書いてキュレーション根拠を後付けで言語化したが、**選定そのものを再評価しなかった**。

候補としては:
- 7 本のうち、wave 1 で公開すべきは何本か（ゼロかもしれない）
- 現状の 7 本は「内部のメモ」レベルにとどまる可能性（公開するなら全面リビルドが必要）
- 公開ではなく非公開アーカイブ（`status: "draft"` か `"hold"`）に倒すべきものがあるか

ユーザーがこれをどう考えているかは、まだヒアリングできていない。

---

## 4. 次セッションが最初に確認すべきこと

### 4.1 ユーザーへの問い（精査前提）

1. **記事公開の前提を再確認**: 現状の 7 本は本当に公開する前提か。それとも一部 / 全部を `draft` / `hold` に戻し、wave 1 そのものを再構成する選択肢もあるか
2. **想定読者の解像度**: もう一段具体的に。例: 「Twitter で見つけて開く同業の Web デザイナー」「採用検討中の制作会社のディレクター」「フロント実装の参考にしている同業エンジニア」
3. **タイトルが届く相手**: タイトルだけ見て read more したくなる相手は誰か。その人にとって何が引きとして機能するか
4. **本文の役割**: 読了後に読者の中に何が残ってほしいか。技術判断? 視点? 名刺としての印象? 制作物の解像度? どれを最優先にするか
5. **EN との関係**: EN は誰向けに残すか。JA を独立に書き直す場合、EN もリライトするのか、放置するのか
6. **私のリライトの扱い**: 採用 / 部分採用 / 全破棄 / 一部参考にして書き直し のいずれにするか
7. **`ja-writing-style.md` の扱い**: 採用するならどの規則を残し、どの規則を改訂するか。例: 「英単語は backtick」のルールが、タイトル・要約レベルでは逆効果かどうか

### 4.2 やるべき確認

```bash
# リポ位置と branch
cd /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio
git status -- apps/web/messages/ja.json apps/web/src/shared/data/journal.ts docs/journal/
git log --oneline -5
# → main, HEAD: 28b0ded2 (前セッションのコミット未実行のまま)

# 現状の ja.json journal namespace
python3 -c "import json, sys; d=json.load(open('apps/web/messages/ja.json'))['journal']; json.dump(d, sys.stdout, ensure_ascii=False, indent=2)" | less

# 現状の en.json journal namespace（master）
python3 -c "import json, sys; d=json.load(open('apps/web/messages/en.json'))['journal']; json.dump(d, sys.stdout, ensure_ascii=False, indent=2)" | less

# 私のリライトの diff を読む
git diff -- apps/web/messages/ja.json | head -200
git diff -- apps/web/src/shared/data/journal.ts

# 表記スタイルガイド
cat docs/journal/ja-writing-style.md
cat docs/journal/curation-rationale.md
cat docs/journal/wave-2-backlog.md
```

### 4.3 復元したい場合（私のリライトを破棄）

```bash
# 私のリライトを完全に破棄して HEAD に戻す
git checkout -- apps/web/messages/ja.json apps/web/src/shared/data/journal.ts
# 新規 docs を残すか消すかは判断
# 消す場合:
rm docs/journal/ja-writing-style.md
rm docs/journal/curation-rationale.md
rm docs/journal/wave-2-backlog.md
rm docs/journal/journal-rewrite-rejected-and-restart-handoff-2026-04-29-jst.md
```

---

## 5. リポマップ（journal 関連、再掲）

### 5.1 ルーティング

```
apps/web/src/app/[locale]/(portfolio)/journal/
  page.tsx                                           ← index
  portfolio-renewal-2026/page.tsx                    ← 主記事 1
  mobile-safari-touch-controller/page.tsx            ← 主記事 2
  journal-typography-wordmark-system/page.tsx        ← 主記事 3
  motion-studies/page.tsx                            ← motion studies index
  motion-studies/[slug]/page.tsx                     ← motion study 詳細（動的）
```

### 5.2 レジストリ

```
apps/web/src/shared/data/journal.ts
  - 私が冒頭に JSDoc を追加（25 行）
  - 7 entries (3 主記事 + 4 motion-studies)
  - 全 entry が status: "published", publishedAt: "2026-04-29"
```

### 5.3 翻訳（messages）

```
apps/web/messages/ja.json   (1731 行、journal namespace は私のリライト適用済)
apps/web/messages/en.json   (master、未編集)
```

journal 関連の paths:
- `journal.title` / `description` / `eyebrow` / `intro`
- `journal.indexLabels.*`
- `journal.entries.<slug>.{eyebrow, title, summary, metaDescription}` × 3
- `journal.motionStudies.{indexEyebrow, indexTitle, indexSummary, metaDescription}`
- `journal.motionStudies.entries.<slug>.{eyebrow, title, summary, metaDescription}` × 4
- `journal.articles.<3 main slugs>.sections[]` （20 / 15 / 14 sections）
- `journal.articles.motion-studies.<4 slugs>.sections[]` （各 8 sections）

### 5.4 レンダリング層

```
apps/web/src/features/journal/
  article-blocks.ts          ← block 型定義（heading/paragraph/code/callout/list）
  JournalArticleBody.tsx     ← block 配列 → React レンダリング
  JournalArticleHeader.tsx   ← 記事ヘッダ
  JournalIndexCard.tsx       ← 一覧カード
  JournalIndexGroup.tsx      ← 一覧グルーピング
```

---

## 6. 私が書いた docs の概要（次セッションが採否を判断するために）

### 6.1 `docs/journal/ja-writing-style.md` の主な規則

- **§1 master-language**: JA 独立執筆、EN は参考、両言語で一致するのは事実のみ
- **§2 想定読者**: デザイン系同業 + テクノロジスト
- **§3 文体**: 常体（だ・である調）統一、一人称排除
- **§4 文学的トーン**: ハイブリッド — callout / 章結び / 予告 paragraph のみ literary OK
- **§5 英単語フォーマット**: backtick（コード識別子・製品/技術/概念名）/ bare（固有名詞）/ 翻訳または注釈（loanword・比喩）
- **§6 用語決定**: light substrate / Theatre.js / boil 場 / data-readability / source of truth の表記固定
- **§7 文の作り方**: 一文 30〜60 字、連体修飾入れ子は 2 段まで、指示語は曖昧禁止
- **§8 block ごとの書き方**: heading 8〜30 字、paragraph 60〜180 字、code 前後に paragraph 必須
- **§9 校正チェック**: grep コマンド一覧

→ **却下を踏まえての評価**: §2「想定読者」と §6「用語決定」が **粒度が粗すぎた**。タイトルレベルでの読者到達を担保していない。再検討要。

### 6.2 `docs/journal/curation-rationale.md` の主張

- Wave 1 selection logic（3 主記事 + 4 motion-studies の選定理由）
- kind / evidenceLevel / status の運用基準
- 意図的に出さない領域（顧客機密、NDA、内部運用、短命 workaround）
- wave 単位で出すリズム（3〜5 記事 / 1〜3 ヶ月）

→ **却下を踏まえての評価**: 「なぜこの 7 本か」を後付けで言語化したが、**選定そのものの妥当性は議論していない**。次セッションで再評価対象。

### 6.3 `docs/journal/wave-2-backlog.md` の候補

- `filmtone-ios-lut-intensity-slider`
- `filmtone-motion-180-baseline-industry`
- `photography-lp-design-polish`
- `wordmark-pipeline-v2`
- `data-readability-shader-pipeline`
- `motion-dot-light-substrate-constraint`
- `cjk-typography-pitfalls`

→ wave 1 が再構成される場合、これらの一部を wave 1 に繰り上げる選択肢もある。

---

## 7. 重要な確定事実（次セッションが二度確認しなくてよいもの）

これは Phase 1 Explore で確定した事実。再度同じ調査をしないこと。

1. **EN-master 確定**: 56 ブロックペア中 51 が EN 先行、独立執筆は `journal.intro` のみ、JA 先行ゼロ
2. **`motion-dot` の hardcode**: `packages/motion-dot` の `bgColor` が `[0.82, 0.82, 0.82, 1.0]` で固定 → site は light 前提でしか整合しない
3. **motion-study 動的ルートのフォールバック**: `articles.motion-studies.${slug}.sections` が無い場合、空 `<div>` を描画（404 ではない）
4. **`JournalStatus` 型に `"hold"` 存在**: エントリ 0、backlog 用の枠は型レベルでは用意済み
5. **wave-1 commit `b8353730` メッセージに暗黙根拠あり**:
   - `motif-loop-background is intentionally omitted — isn't in the tree`
   - `engineering-note, scoped honestly to visual-viewport plumbing only`
   - `study, in-progress R&D`
6. **既存の関連ハンドオフ**: `docs/renewal-2026/2026-04-27-journal-motion-studies-curation-review-handoff.md`（4/27、motion-studies 精査の前段）

---

## 8. 提案: 次セッションの進め方

### 8.1 段階的アプローチ

```
Phase A: 失敗の共有
  - 本ハンドオフを Read
  - ユーザーの却下コメントを起点として、想定読者と記事の役割を再定義する 1 〜 2 サイクルの対話
  - §4.1 の問い 7 つを順番に AskUserQuestion で確認

Phase B: 私のリライトの取り扱いを決定
  - 全破棄 / 部分採用 / 参考にして再執筆 を user 選択
  - 全破棄なら git checkout で原状復帰、新規 docs の取り扱いも決定

Phase C: タイトル 1 本ずつから書く
  - いきなり全文書かない
  - 主記事 3 本 + motion-studies 4 本のタイトル + summary + metaDescription を 1 本ずつ作る
  - 1 本書くごとにユーザー確認を入れる（タイトルだけで read more したくなるか）
  - タイトル群が固まってから本文に入る

Phase D: 本文を書く
  - § 必要に応じて記事構成（block 順序・section 数）も再構築
  - EN 側も同時に書き直すかは Phase A で決定

Phase E: 検証 + コミット
  - tsc + build
  - ローカル dev でブラウザ目視
  - コミット粒度: ユーザーと相談
```

### 8.2 やってはいけないこと

- 私の `ja-writing-style.md` の規則を **そのまま採用** すること（フォーマット規則だけで読者到達の問題は解けない）
- 「規則 → 適用 → grep で残存ゼロ → 完成」というワークフロー（今回の失敗パターン）
- **タイトルを後回しにして本文から書く**（タイトルが扉として機能していなければ本文を読まれない）
- ユーザーが文学的トーン許容と言ったから、と内部用語を放置する（文学的トーンと専門用語の説明責任は別軸）

---

## 9. 次セッション用 引き継ぎプロンプト（コピペ用・最高精度版）

> 以下を新規チャットの最初のメッセージにそのまま貼り付けてください。

---

**[ここから次チャット用プロンプト]**

```
# Portfolio Journal — 公開判断と日本語の書き直し（前セッション却下後の再起動）

## 前提

リポジトリ: /Volumes/SamsungPortableSSDX5001/documents/forestone/chibatakumi-portfolio
Branch: main / HEAD: 28b0ded2

前セッションで /journal/ セクションの日本語リライトとキュレーション根拠の言
語化を試みたが、ユーザーから「論外過ぎる」と却下された。具体的には、リライ
ト後タイトル「ライト・サブストレートに統一する — Renewal 2026 の判断と削っ
たもの」が、「意味がわからないし、誰に対して何を伝えないかもわかりません」
と評価された。

完全な背景・経緯・失敗診断・現状ファイル状態・次に確認すべきことは、以下の
ハンドオフドキュメントに集約してある。最初に必ず読むこと:

  docs/journal/journal-rewrite-rejected-and-restart-handoff-2026-04-29-jst.md

このハンドオフは前ハンドオフ
  docs/journal/journal-curation-and-japanese-review-handoff-2026-04-29-jst.md
の続きとして書かれている。両方を読むこと。

## このセッションでやること

ユーザーの主訴（前セッション末尾より verbatim）:

> 「ライト・サブストレートに統一する — Renewal 2026 の判断と削ったもの」
> 意味がわからないし、誰に対して何を伝えないかもわかりません
>
> 論外過ぎます
> 次のチャットで精査し直してください

つまり、表現規則の調整ではなく「読者への到達」を起点として、journal の公開
判断とタイトル・要約を再構築する。

## 進め方の提案（ハンドオフ §8 を踏襲）

最初の応答で以下を順に実行してほしい:

1. 上記 2 つのハンドオフを Read
2. 前セッションが現状にどう手を入れたかを git diff で確認
   ```
   git status -- apps/web/messages/ja.json apps/web/src/shared/data/journal.ts docs/journal/
   git diff apps/web/messages/ja.json | head -200
   git diff apps/web/src/shared/data/journal.ts
   ```
3. 私のリライト（前セッション）を採用するか破棄するかをユーザーに尋ねる前
   に、まず以下を AskUserQuestion で確認する:
   a. 想定読者の解像度（誰が、どこから来て、何のために読むか）
   b. 記事公開の前提（7 本そのまま公開か、一部 hold/draft に戻すか、wave 1
      自体を再構成するか）
   c. タイトルが届く相手と、その人にとっての引きは何か
   d. 本文を読み終えた後に読者の中に残ってほしいもの（技術判断 / 視点 /
      名刺の印象 / 制作物の解像度）の優先順位
   e. EN との関係（EN は master のままか、JA とともに書き直すか、放置か）
   f. 前セッションのリライトの扱い（全破棄 / 部分採用 / 参考にして再執筆）
   g. 前セッションの ja-writing-style.md の扱い（採用 / 改訂 / 廃棄）

4. 上記回答を受けて、Phase B（取り扱い決定）→ Phase C（タイトル 1 本ずつ）
   → Phase D（本文）→ Phase E（検証）と進める。

## 守ってほしいこと（前セッションの失敗を踏まえて）

- 表現規則を立ててから機械的に適用するワークフローを取らない
- いきなり全文書かない。タイトル + summary + metaDescription を 1 本ずつ
  書き、1 本ごとにユーザー確認を取る
- タイトルだけ見て read more したくなるかを毎回判定する
- 「`light substrate`」「`motion-dot`」「`data-readability`」のような造語・
  自前概念名は、初見読者にとって何を意味するかを記事側で開く（それができ
  ない記事は、そもそも公開対象として正しいかを再評価する）
- 文学的トーンと専門用語の説明責任は別軸として扱う
- 前ハンドオフ §6 で確定した方針（独立執筆、デザイン系同業 + テクノロジス
  ト、ハイブリッド文学トーン）は、却下を受けて再評価対象とする。盲従しな
  い

## 守ってほしいこと（運用）

- 思考すべき箇所は sequential-thinking で考える
- 検索が必要なら gemini-search または web search を使う
- 並列に走らせられる調査は同時に投げる
- 内部処理は英語、最終出力は日本語
- パッケージマネージャは bun
- コミットはユーザーが明示的に指示するまでしない

## 確定済みの事実（再調査不要、ハンドオフ §7 参照）

1. EN-master 確定（51/56 ブロックペアで EN 先行、独立執筆は intro のみ）
2. motion-dot の bgColor は light 固定（site 全体が light 前提）
3. motion-study 動的ルートは sections 不在時に空 div を描画（404 ではない）
4. JournalStatus 型に "hold" 存在、エントリ 0
5. wave-1 commit b8353730 メッセージに暗黙根拠あり
6. 関連ハンドオフ docs/renewal-2026/2026-04-27-journal-motion-studies-
   curation-review-handoff.md 既存

## 出力の最終目標（範囲未確定）

- 公開する記事の本数と組み合わせ（wave 1 の再構成 or 維持）
- タイトル / summary / metaDescription（読者到達を担保したもの）
- 本文（必要に応じて構成も再設計）
- 表記スタイルガイドの改訂版（または破棄）
- キュレーション根拠の改訂版（または破棄）
- 公開可否の確認手続き

開始してください。最初は 2 つのハンドオフを Read することから。
```

**[ここまで次チャット用プロンプト]**

---

## 10. 補遺: 私のリライトの実例（次セッションが評価する材料）

却下されたタイトル群（現状 `ja.json` に書き込まれているもの）:

| slug | リライト後タイトル | 私の意図 | ユーザーの判定（推定） |
|------|---------------------|----------|------------------------|
| portfolio-renewal-2026 | ライト・サブストレートに統一する — Renewal 2026 の判断と削ったもの | サイト全体を 1 枚の light 面に統合した話 | **論外**（明示的に却下） |
| mobile-safari-touch-controller | iOS Safari の `visualViewport` を CSS 変数に降ろす | 配信基盤としての visualViewport 取り扱い | 未判定（同種の問題を抱える可能性高） |
| journal-typography-wordmark-system | Geist を彫り直して wordmark にする — extract → modify → build パイプライン | wordmark の彫り直し記録 | 未判定（同種の問題を抱える可能性高） |
| signal-stroke-relay | Signal Stroke Relay — 1 本のストロークを複数のレイヤーで relay する | Theatre.js タイムラインの参照型 relay | 未判定 |
| staged-emphasis-payoff | Staged Emphasis Payoff — 強調を段階で組み、最後に payoff を渡す | family / stage / payoff の pacing study | 未判定 |
| boiling-poster-aperture | Boiling Poster Aperture — boil 場と displacement で reveal を作る | boil 場の displacement reveal | 未判定 |
| temporal-echo-residue | Temporal Echo Residue — 動きが止まったあとの残響を decay で持つ | 動き停止後の echo decay | 未判定 |

**観察**:

- タイトル全体に「内部造語 / 自前概念名」がそのまま乗っており、初見読者に開かれていない
- motion-studies 4 本の英タイトル（Signal Stroke Relay 等）はそのまま採用してしまった。これは EN-master を採った帰結だが、JA の入口としてふさわしくない可能性が高い
- 「— の判断と削ったもの」「— の構築」など、構造（記事内での目次的役割）を伝えるが、**読者にとっての価値**は伝えていない

→ 次セッションでの最初の評価対象。

---

## 11. このハンドオフを書いた根拠（再現性）

```bash
# git 状態
git log --oneline -3
git status --short -- apps/web/messages/ja.json apps/web/src/shared/data/journal.ts docs/journal/

# 変更行数
git diff --stat apps/web/messages/ja.json apps/web/src/shared/data/journal.ts

# 私のリライト後 ja.json journal namespace の検証
python3 -c "import json; d=json.load(open('apps/web/messages/ja.json')); print(d['journal']['entries']['portfolio-renewal-2026']['title'])"
```

このドキュメントは時間で陳腐化する。次セッションは必ず最初に `git log -3` と `git status` で現状を取り直すこと。
